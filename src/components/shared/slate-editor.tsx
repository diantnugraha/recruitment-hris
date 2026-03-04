"use client";

import React, { useCallback, useMemo, useState } from "react";
import isHotkey from "is-hotkey";
import { createEditor, Editor, Transforms, Element as SlateElement, Descendant, BaseEditor } from "slate";
import { Slate, Editable, withReact, useSlate, ReactEditor, RenderElementProps, RenderLeafProps } from "slate-react";
import { withHistory, HistoryEditor } from "slate-history";
import {
  Bold,
  Italic,
  Underline,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Slate type augmentation ----------

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

type CustomElement = {
  type: string;
  children: Descendant[];
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// ---------- Constants ----------

const HOTKEYS: Record<string, string> = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code",
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];

const EMPTY_VALUE: Descendant[] = [
  { type: "paragraph", children: [{ text: "" }] },
];

// ---------- Helpers ----------

function isMarkActive(editor: Editor, format: string): boolean {
  const marks = Editor.marks(editor);
  return marks ? (marks as Record<string, boolean>)[format] === true : false;
}

function isBlockActive(editor: Editor, format: string): boolean {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  );

  return !!match;
}

function toggleMark(editor: Editor, format: string) {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

function toggleBlock(editor: Editor, format: string) {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type),
    split: true,
  });

  Transforms.setNodes(editor, {
    type: isActive ? "paragraph" : isList ? "list-item" : format,
  });

  if (!isActive && isList) {
    const block: CustomElement = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
}

/**
 * Parse incoming value (JSON string, array, or plain text) into Slate Descendant[].
 */
function parseValue(value: unknown): Descendant[] {
  if (!value) return EMPTY_VALUE;

  if (Array.isArray(value) && value.length > 0) {
    return value as Descendant[];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as Descendant[];
        }
      } catch {
        // fall through
      }
    }

    if (trimmed) {
      return trimmed.split("\n").map((line) => ({
        type: "paragraph",
        children: [{ text: line }],
      }));
    }
  }

  return EMPTY_VALUE;
}

// ---------- Element & Leaf renderers ----------

function EditorElement({ attributes, children, element }: RenderElementProps) {
  switch (element.type) {
    case "block-quote":
      return (
        <blockquote
          {...attributes}
          className="border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground"
        >
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul {...attributes} className="list-disc space-y-1 pl-6">
          {children}
        </ul>
      );
    case "heading-one":
      return (
        <h1 {...attributes} className="text-lg font-bold">
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 {...attributes} className="text-base font-semibold">
          {children}
        </h2>
      );
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "numbered-list":
      return (
        <ol {...attributes} className="list-decimal space-y-1 pl-6">
          {children}
        </ol>
      );
    default:
      return (
        <p {...attributes} className="leading-relaxed">
          {children}
        </p>
      );
  }
}

function EditorLeaf({ attributes, children, leaf }: RenderLeafProps) {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  if (leaf.code) {
    children = (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    );
  }
  return <span {...attributes}>{children}</span>;
}

// ---------- Toolbar buttons ----------

function MarkButton({ format, icon: Icon }: { format: string; icon: React.ElementType }) {
  const editor = useSlate();
  const active = isMarkActive(editor, format);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground"
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleMark(editor, format);
      }}
      title={format.charAt(0).toUpperCase() + format.slice(1)}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function BlockButton({ format, icon: Icon }: { format: string; icon: React.ElementType }) {
  const editor = useSlate();
  const active = isBlockActive(editor, format);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground"
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleBlock(editor, format);
      }}
      title={format.replace("-", " ")}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// ---------- Main component ----------

interface SlateEditorProps {
  value: unknown;
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Slate.js WYSIWYG editor component.
 *
 * Note: React Strict Mode must be disabled in next.config.ts for Slate.js to work.
 * See: https://github.com/ianstormtaylor/slate/issues/4081
 */
export function SlateEditor({
  value,
  onChange,
  placeholder,
  className
}: SlateEditorProps) {
  // Create editor instance - useState ensures it's created once per component
  const [editor] = useState(() => withHistory(withReact(createEditor())));

  const renderElement = useCallback((props: RenderElementProps) => <EditorElement {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <EditorLeaf {...props} />, []);

  const initialValue = useMemo(() => parseValue(value), []);

  return (
    <div className={cn("rounded-md border border-input", className)}>
      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={(val) => {
          const isAstChange = editor.operations.some(
            (op) => op.type !== "set_selection"
          );
          if (isAstChange) {
            onChange(val);
          }
        }}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 px-2 py-1.5">
          <MarkButton format="bold" icon={Bold} />
          <MarkButton format="italic" icon={Italic} />
          <MarkButton format="underline" icon={Underline} />
          <MarkButton format="code" icon={Code} />
          <div className="mx-1 h-5 w-px bg-border" />
          <BlockButton format="heading-one" icon={Heading1} />
          <BlockButton format="heading-two" icon={Heading2} />
          <div className="mx-1 h-5 w-px bg-border" />
          <BlockButton format="bulleted-list" icon={List} />
          <BlockButton format="numbered-list" icon={ListOrdered} />
          <BlockButton format="block-quote" icon={Quote} />
        </div>

        {/* Editor area */}
        <Editable
          className="min-h-[120px] px-3 py-2 text-sm focus:outline-none"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder || "Enter text..."}
          spellCheck
          onKeyDown={(event) => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, event as unknown as KeyboardEvent)) {
                event.preventDefault();
                toggleMark(editor, HOTKEYS[hotkey]);
              }
            }
          }}
        />
      </Slate>
    </div>
  );
}

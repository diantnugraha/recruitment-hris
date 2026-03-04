"use client";

import React, { useCallback, useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  FORMAT_TEXT_COMMAND,
  EditorState,
  LexicalEditor as LexicalEditorType,
  TextFormatType,
  COMMAND_PRIORITY_NORMAL,
} from "lexical";
import {
  ListNode,
  ListItemNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
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

// ---------- Theme ----------

const theme = {
  paragraph: "leading-relaxed",
  heading: {
    h1: "text-lg font-bold",
    h2: "text-base font-semibold",
  },
  list: {
    ul: "list-disc space-y-1 pl-6",
    ol: "list-decimal space-y-1 pl-6",
    listitem: "",
  },
  quote: "border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    code: "rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
  },
};

// ---------- Toolbar Button ----------

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ElementType;
  title: string;
}

function ToolbarButton({ onClick, isActive, icon: Icon, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground"
      )}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// ---------- Toolbar Plugin ----------

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = React.useState<Set<string>>(new Set());
  const [blockType, setBlockType] = React.useState<string>("paragraph");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text formats
      const formats = new Set<string>();
      if (selection.hasFormat("bold")) formats.add("bold");
      if (selection.hasFormat("italic")) formats.add("italic");
      if (selection.hasFormat("underline")) formats.add("underline");
      if (selection.hasFormat("code")) formats.add("code");
      setActiveFormats(formats);

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === "root"
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element.getParent();
          const type = parentList ? parentList.getType() : element.getType();
          setBlockType(type === "bullet" ? "ul" : "ol");
        } else {
          const type = element.getType();
          if (type === "heading") {
            const tag = (element as unknown as { getTag: () => string }).getTag();
            setBlockType(tag);
          } else {
            setBlockType(type);
          }
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatBlock = (type: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (type === "paragraph") {
          $setBlocksType(selection, () => $createParagraphNode());
        } else if (type === "h1") {
          $setBlocksType(selection, () => $createHeadingNode("h1"));
        } else if (type === "h2") {
          $setBlocksType(selection, () => $createHeadingNode("h2"));
        } else if (type === "quote") {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      }
    });
  };

  const formatList = (listType: "bullet" | "number") => {
    if (blockType === "ul" && listType === "bullet") {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else if (blockType === "ol" && listType === "number") {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else if (listType === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 px-2 py-1.5">
      <ToolbarButton
        onClick={() => formatText("bold")}
        isActive={activeFormats.has("bold")}
        icon={Bold}
        title="Bold"
      />
      <ToolbarButton
        onClick={() => formatText("italic")}
        isActive={activeFormats.has("italic")}
        icon={Italic}
        title="Italic"
      />
      <ToolbarButton
        onClick={() => formatText("underline")}
        isActive={activeFormats.has("underline")}
        icon={Underline}
        title="Underline"
      />
      <ToolbarButton
        onClick={() => formatText("code")}
        isActive={activeFormats.has("code")}
        icon={Code}
        title="Code"
      />
      <div className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        onClick={() => formatBlock("h1")}
        isActive={blockType === "h1"}
        icon={Heading1}
        title="Heading 1"
      />
      <ToolbarButton
        onClick={() => formatBlock("h2")}
        isActive={blockType === "h2"}
        icon={Heading2}
        title="Heading 2"
      />
      <div className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        onClick={() => formatList("bullet")}
        isActive={blockType === "ul"}
        icon={List}
        title="Bulleted List"
      />
      <ToolbarButton
        onClick={() => formatList("number")}
        isActive={blockType === "ol"}
        icon={ListOrdered}
        title="Numbered List"
      />
      <ToolbarButton
        onClick={() => formatBlock("quote")}
        isActive={blockType === "quote"}
        icon={Quote}
        title="Quote"
      />
    </div>
  );
}

// ---------- Initial Value Plugin ----------

interface InitialValuePluginProps {
  value: unknown;
}

function InitialValuePlugin({ value }: InitialValuePluginProps) {
  const [editor] = useLexicalComposerContext();
  const initialized = React.useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!value) return;

    // Try to parse as Lexical state JSON
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("{") && trimmed.includes('"root"')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.root) {
            const editorState = editor.parseEditorState(parsed);
            editor.setEditorState(editorState);
            return;
          }
        } catch {
          // Fall through to plain text
        }
      }

      // Handle plain text
      if (trimmed) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const lines = trimmed.split("\n");
          lines.forEach((line) => {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(line));
            root.append(paragraph);
          });
        });
      }
    }
  }, [editor, value]);

  return null;
}

// ---------- Main Component ----------

interface LexicalEditorProps {
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Lexical WYSIWYG editor component.
 * Works with React 18 Strict Mode.
 */
export function LexicalEditor({
  value,
  onChange,
  placeholder,
  className
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: "LexicalEditor",
    theme,
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
  };

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditorType) => {
      editorState.read(() => {
        const json = editorState.toJSON();
        onChange(JSON.stringify(json));
      });
    },
    [onChange]
  );

  return (
    <div className={cn("rounded-md border border-input", className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[120px] px-3 py-2 text-sm focus:outline-none" />
            }
            placeholder={
              <div className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
                {placeholder || "Enter text..."}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin onChange={handleChange} />
        <InitialValuePlugin value={value} />
      </LexicalComposer>
    </div>
  );
}

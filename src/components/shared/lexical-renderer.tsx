"use client";

import React from "react";

/**
 * Lexical.js node types
 *
 * Data flow:
 *   MySQL TEXT column → JSON string → JSON.parse() → LexicalState
 */

interface LexicalTextNode {
  type: "text";
  text: string;
  format?: number; // Bitmask: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code, 32=subscript, 64=superscript
  style?: string;
}

interface LexicalElementNode {
  type: string;
  children: LexicalNode[];
  direction?: "ltr" | "rtl" | null;
  format?: string | number;
  indent?: number;
  tag?: string;
  listType?: "bullet" | "number" | "check";
  start?: number;
  value?: number;
}

interface LexicalLineBreakNode {
  type: "linebreak";
}

type LexicalNode = LexicalTextNode | LexicalElementNode | LexicalLineBreakNode;

interface LexicalState {
  root: LexicalElementNode;
}

// Format bitmask values
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

function isTextNode(node: LexicalNode): node is LexicalTextNode {
  return node.type === "text";
}

function isLineBreak(node: LexicalNode): node is LexicalLineBreakNode {
  return node.type === "linebreak";
}

/**
 * Render a text node with formatting
 */
function renderTextNode(node: LexicalTextNode, index: number): React.ReactNode {
  let content: React.ReactNode = node.text;

  if (!content) return null;

  const format = node.format || 0;

  if (format & FORMAT_BOLD) {
    content = <strong key={`b-${index}`}>{content}</strong>;
  }
  if (format & FORMAT_ITALIC) {
    content = <em key={`i-${index}`}>{content}</em>;
  }
  if (format & FORMAT_UNDERLINE) {
    content = <u key={`u-${index}`}>{content}</u>;
  }
  if (format & FORMAT_CODE) {
    content = (
      <code
        key={`c-${index}`}
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
      >
        {content}
      </code>
    );
  }

  return <React.Fragment key={index}>{content}</React.Fragment>;
}

function renderNode(node: LexicalNode, index: number): React.ReactNode {
  if (isLineBreak(node)) {
    return <br key={index} />;
  }

  if (isTextNode(node)) {
    return renderTextNode(node, index);
  }

  const elementNode = node as LexicalElementNode;
  const children = elementNode.children?.map((child, i) => renderNode(child, i)) || [];

  switch (elementNode.type) {
    case "root":
      return <React.Fragment key={index}>{children}</React.Fragment>;

    case "paragraph":
      return (
        <p key={index} className="leading-relaxed">
          {children.length > 0 ? children : <br />}
        </p>
      );

    case "heading":
      const tag = elementNode.tag || "h1";
      const headingClass = tag === "h1"
        ? "text-lg font-bold"
        : "text-base font-semibold";
      if (tag === "h1") {
        return <h1 key={index} className={headingClass}>{children}</h1>;
      }
      return <h2 key={index} className={headingClass}>{children}</h2>;

    case "list":
      if (elementNode.listType === "number") {
        return (
          <ol key={index} className="list-decimal space-y-1 pl-6">
            {children}
          </ol>
        );
      }
      return (
        <ul key={index} className="list-disc space-y-1 pl-6">
          {children}
        </ul>
      );

    case "listitem":
      return <li key={index}>{children}</li>;

    case "quote":
      return (
        <blockquote
          key={index}
          className="border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground"
        >
          {children}
        </blockquote>
      );

    default:
      return (
        <p key={index} className="leading-relaxed">
          {children}
        </p>
      );
  }
}

/**
 * Parse a value that could be:
 * - A JSON string (Lexical state from API)
 * - An already-parsed Lexical state object
 * - A plain text string
 * - null/undefined
 */
function parseLexicalValue(value: unknown): LexicalState | null {
  if (!value) return null;

  // Already parsed Lexical state
  if (typeof value === "object" && value !== null && "root" in value) {
    return value as LexicalState;
  }

  // JSON string — try to parse
  if (typeof value === "string") {
    const trimmed = value.trim();

    // Treat empty strings as empty
    if (!trimmed || /^[\"'`][\s]*[\"'`]$/.test(trimmed)) return null;

    // Looks like Lexical JSON (has "root" key)
    if (trimmed.startsWith("{") && trimmed.includes('"root"')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.root) {
          return parsed as LexicalState;
        }
      } catch {
        // Fall through to plain text
      }
    }

    // Handle Slate.js format for backward compatibility
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          // Convert Slate format to display
          return convertSlateToLexical(parsed);
        }
      } catch {
        // Fall through to plain text
      }
    }

    // Plain text — wrap in paragraph structure
    if (trimmed) {
      return {
        root: {
          type: "root",
          children: trimmed.split("\n").map((line) => ({
            type: "paragraph",
            children: [{ type: "text", text: line }],
          })),
        },
      };
    }
  }

  return null;
}

/**
 * Convert Slate.js format to Lexical-like structure for rendering
 */
function convertSlateToLexical(slateNodes: unknown[]): LexicalState {
  const convertNode = (node: unknown): LexicalNode => {
    if (typeof node === "object" && node !== null) {
      const n = node as Record<string, unknown>;

      // Text node
      if ("text" in n) {
        let format = 0;
        if (n.bold) format |= FORMAT_BOLD;
        if (n.italic) format |= FORMAT_ITALIC;
        if (n.underline) format |= FORMAT_UNDERLINE;
        if (n.code) format |= FORMAT_CODE;

        return {
          type: "text",
          text: String(n.text || ""),
          format,
        };
      }

      // Element node
      const children = Array.isArray(n.children)
        ? n.children.map(convertNode)
        : [];

      const type = String(n.type || "paragraph");

      // Map Slate types to Lexical types
      switch (type) {
        case "bulleted-list":
          return { type: "list", listType: "bullet", children };
        case "numbered-list":
          return { type: "list", listType: "number", children };
        case "list-item":
          return { type: "listitem", children };
        case "heading-one":
          return { type: "heading", tag: "h1", children };
        case "heading-two":
          return { type: "heading", tag: "h2", children };
        case "block-quote":
          return { type: "quote", children };
        default:
          return { type, children };
      }
    }
    return { type: "text", text: "" };
  };

  return {
    root: {
      type: "root",
      children: slateNodes.map(convertNode),
    },
  };
}

/**
 * Check if content has any actual text
 */
function hasContent(state: LexicalState): boolean {
  const checkNode = (node: LexicalNode): boolean => {
    if (isTextNode(node)) {
      return !!node.text?.trim();
    }
    if (isLineBreak(node)) {
      return false;
    }
    return (node as LexicalElementNode).children?.some(checkNode) ?? false;
  };

  return state.root.children.some(checkNode);
}

/**
 * Check if a string contains HTML tags (not JSON).
 */
function isHtmlString(value: string): boolean {
  const trimmed = value.trim();
  // Skip if it looks like JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return false;
  // Check for common HTML tags
  return /<[a-z][\s\S]*?>/i.test(trimmed);
}

interface LexicalRendererProps {
  /** Lexical.js JSON value — string (from API) or parsed state object */
  value: unknown;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/**
 * Renders Lexical.js JSON content as formatted HTML.
 * Also supports Slate.js format for backward compatibility.
 */
export function LexicalRenderer({ value, className }: LexicalRendererProps) {
  // Check if value is a raw HTML string (contains HTML tags but not JSON)
  if (typeof value === "string" && isHtmlString(value)) {
    return (
      <div
        className={`space-y-2 text-sm text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_p]:leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  const state = parseLexicalValue(value);

  if (!state || !hasContent(state)) return null;

  const rendered = state.root.children.map((node, i) => renderNode(node, i));

  return (
    <div className={`space-y-2 text-sm text-muted-foreground ${className ?? ""}`}>
      {rendered}
    </div>
  );
}

/**
 * Check if a value contains renderable Lexical content.
 * Useful for conditional rendering (e.g., hiding sections when empty).
 */
export function hasLexicalContent(value: unknown): boolean {
  if (typeof value === "string" && isHtmlString(value)) return true;
  const state = parseLexicalValue(value);
  return state ? hasContent(state) : false;
}

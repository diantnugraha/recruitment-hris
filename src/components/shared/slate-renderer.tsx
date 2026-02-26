import React from "react";

/**
 * Slate.js node types (matching the format used in hris-tuv)
 *
 * Data flow:
 *   MySQL TEXT column → JSON string → JSON.parse() → SlateNode[]
 *
 * Example stored value:
 *   [{"type":"paragraph","children":[{"text":"Hello ","bold":true},{"text":"world"}]}]
 */

interface SlateLeaf {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
}

interface SlateElement {
  type?: string;
  children: (SlateElement | SlateLeaf)[];
}

type SlateNode = SlateElement | SlateLeaf;

function isLeaf(node: SlateNode): node is SlateLeaf {
  return "text" in node;
}

/**
 * Render a leaf node (text with formatting)
 */
function renderLeaf(leaf: SlateLeaf, index: number): React.ReactNode {
  let content: React.ReactNode = leaf.text;

  if (!content) return null;

  if (leaf.bold) {
    content = <strong key={`b-${index}`}>{content}</strong>;
  }
  if (leaf.italic) {
    content = <em key={`i-${index}`}>{content}</em>;
  }
  if (leaf.underline) {
    content = <u key={`u-${index}`}>{content}</u>;
  }
  if (leaf.code) {
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

/**
 * Strip leading bullet prefix (e.g. "• ", "\t• ", "- ") from the first text leaf.
 */
function stripLeadingBullet(
  children: (SlateElement | SlateLeaf)[],
  prefix: string
): (SlateElement | SlateLeaf)[] {
  const result = [...children];
  for (let i = 0; i < result.length; i++) {
    const child = result[i];
    if (isLeaf(child) && child.text) {
      result[i] = { ...child, text: child.text.slice(prefix.length) };
      break;
    }
  }
  return result;
}

/**
 * Extract plain text from a node tree (used for bullet detection).
 */
function getPlainText(node: SlateElement | SlateLeaf): string {
  if (isLeaf(node)) return node.text || "";
  return node.children.map((c) => getPlainText(c)).join("");
}

function renderElement(node: SlateElement, index: number): React.ReactNode {
  const children = node.children.map((child, i) =>
    isLeaf(child) ? renderLeaf(child, i) : renderElement(child, i)
  );

  switch (node.type) {
    case "paragraph":
      return (
        <p key={index} className="leading-relaxed">
          {children}
        </p>
      );
    case "bulleted-list":
      return (
        <ul key={index} className="list-disc space-y-1 pl-6">
          {children}
        </ul>
      );
    case "numbered-list":
      return (
        <ol key={index} className="list-decimal space-y-1 pl-6">
          {children}
        </ol>
      );
    case "list-item":
      return <li key={index}>{children}</li>;
    case "block-quote":
      return (
        <blockquote
          key={index}
          className="border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground"
        >
          {children}
        </blockquote>
      );
    case "heading-one":
      return (
        <h1 key={index} className="text-lg font-bold">
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 key={index} className="text-base font-semibold">
          {children}
        </h2>
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
 * - A JSON string (from MySQL TEXT column via API)
 * - An already-parsed array of Slate nodes
 * - A plain text string
 * - null/undefined
 */
function parseSlateValue(value: unknown): SlateNode[] | null {
  if (!value) return null;

  // Already parsed array of nodes
  if (Array.isArray(value)) {
    return value as SlateNode[];
  }

  // JSON string — try to parse
  if (typeof value === "string") {
    const trimmed = value.trim();

    // Treat empty-quoted strings ("", '', ``), or strings with only whitespace inside quotes, as empty
    if (/^["'`][\s]*["'`]$/.test(trimmed)) return null;

    // Looks like Slate JSON
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed as SlateNode[];
        }
      } catch {
        // Fall through to plain text
      }
    }

    // Plain text — wrap in paragraph nodes
    if (trimmed) {
      return trimmed.split("\n").map((line) => ({
        type: "paragraph",
        children: [{ text: line }],
      }));
    }
  }

  return null;
}

interface SlateRendererProps {
  /** Slate.js JSON value — string (from API) or parsed node array */
  value: unknown;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/**
 * Renders Slate.js JSON content as formatted HTML.
 *
 * Supports the same node types as hris-tuv:
 * - Paragraphs, bulleted lists, numbered lists, list items
 * - Bold, italic, underline, code formatting
 * - Block quotes, headings
 *
 * @example
 * // From API response (JSON string):
 * <SlateRenderer value={jobTitle.description} />
 *
 * // From parsed data:
 * <SlateRenderer value={[{ type: "paragraph", children: [{ text: "Hello" }] }]} />
 */
export function SlateRenderer({ value, className }: SlateRendererProps) {
  const nodes = parseSlateValue(value);

  if (!nodes || nodes.length === 0) return null;

  // Check if content is effectively empty (all nodes have no text)
  const hasContent = nodes.some((node) => {
    if (isLeaf(node)) return !!node.text?.trim();
    return (node as SlateElement).children?.some(function checkChild(
      child: SlateNode
    ): boolean {
      if (isLeaf(child)) return !!child.text?.trim();
      return (child as SlateElement).children?.some(checkChild) ?? false;
    });
  });

  if (!hasContent) return null;

  // Group consecutive bullet paragraphs into a single <ul>
  const rendered: React.ReactNode[] = [];
  let bulletGroup: { node: SlateElement; prefix: string }[] = [];

  function flushBulletGroup() {
    if (bulletGroup.length === 0) return;
    rendered.push(
      <ul key={`bl-${rendered.length}`} className="list-disc space-y-1 pl-6">
        {bulletGroup.map((item, i) => {
          const stripped = stripLeadingBullet(item.node.children, item.prefix);
          return (
            <li key={i}>
              {stripped.map((child, ci) =>
                isLeaf(child) ? renderLeaf(child, ci) : renderElement(child, ci)
              )}
            </li>
          );
        })}
      </ul>
    );
    bulletGroup = [];
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isLeaf(node)) {
      flushBulletGroup();
      rendered.push(renderLeaf(node, i));
      continue;
    }

    const el = node as SlateElement;
    if (el.type === "paragraph") {
      const text = getPlainText(el);
      const bulletMatch = text.match(/^[\t ]*[•\-\*]\s*/);
      if (bulletMatch) {
        bulletGroup.push({ node: el, prefix: bulletMatch[0] });
        continue;
      }
    }

    flushBulletGroup();
    rendered.push(renderElement(el, i));
  }
  flushBulletGroup();

  return (
    <div className={`space-y-2 text-sm text-muted-foreground ${className ?? ""}`}>
      {rendered}
    </div>
  );
}

/**
 * Check if a value contains renderable Slate content.
 * Useful for conditional rendering (e.g., hiding sections when empty).
 */
export function hasSlateContent(value: unknown): boolean {
  const nodes = parseSlateValue(value);
  if (!nodes || nodes.length === 0) return false;

  return nodes.some((node) => {
    if (isLeaf(node)) return !!node.text?.trim();
    return (node as SlateElement).children?.some(function checkChild(
      child: SlateNode
    ): boolean {
      if (isLeaf(child)) return !!child.text?.trim();
      return (child as SlateElement).children?.some(checkChild) ?? false;
    });
  });
}

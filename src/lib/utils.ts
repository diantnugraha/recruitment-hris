import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "No Data";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "No Data";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "No Data";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "No Data";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

// Rich text parser for Slate.js format
interface RichTextChild {
  text?: string;
  children?: RichTextChild[];
}

interface RichTextNode {
  type?: string;
  children?: RichTextChild[];
  text?: string;
}

/**
 * Check if a string looks like JSON rich text format
 */
function isRichTextJson(str: string): boolean {
  const trimmed = str.trim();
  return trimmed.startsWith("[{") && trimmed.includes('"type"') && trimmed.includes('"children"');
}

/**
 * Parse rich text data (Slate.js format) and extract plain text as array
 * Input: [{"type":"paragraph","children":[{"text":"• Item 1"}]}, ...]
 * Output: ["Item 1", "Item 2", ...]
 */
export function parseRichTextToArray(data: unknown): string[] {
  if (!data) return [];

  // If it's already a string array, return as is
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "string") {
    return data as string[];
  }

  // If it's a rich text format (array of nodes)
  if (Array.isArray(data)) {
    const results: string[] = [];

    for (const node of data as RichTextNode[]) {
      const text = extractTextFromNode(node);
      if (text) {
        // Clean up bullet points and tabs
        const cleaned = text
          .replace(/^[•\-\*]\s*/, "") // Remove leading bullet
          .replace(/^\t+/, "") // Remove leading tabs
          .trim();

        if (cleaned) {
          results.push(cleaned);
        }
      }
    }

    return results;
  }

  // If it's a string (possibly JSON), try to parse it
  if (typeof data === "string") {
    // Check if it looks like rich text JSON
    if (isRichTextJson(data)) {
      try {
        const parsed = JSON.parse(data);
        return parseRichTextToArray(parsed);
      } catch {
        // Fall through to plain text handling
      }
    }

    // Plain string with line breaks, split it
    return data
      .split("\n")
      .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Parse rich text data and extract as single string
 * Useful for description fields that may contain rich text
 */
export function parseRichTextToString(data: unknown): string {
  if (!data) return "";

  // If it's already a plain string that doesn't look like rich text JSON
  if (typeof data === "string" && !isRichTextJson(data)) {
    return data;
  }

  // Parse as array and join
  const items = parseRichTextToArray(data);
  return items.join("\n");
}

/**
 * Split a long text into array of sentences/items
 * Useful for converting description text to responsibility list
 */
export function splitTextToItems(text: string): string[] {
  if (!text) return [];

  // First, try to split by common patterns
  let items: string[] = [];

  // Check if text has bullet points or numbers
  if (text.includes("•") || text.includes("-") || /^\d+\./.test(text)) {
    items = text
      .split(/[•\-]|\d+\./)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  // Check if text has newlines
  else if (text.includes("\n")) {
    items = text
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  // Split by sentences - look for patterns like "verb + noun" starts
  else {
    // Split by period followed by capital letter (sentence boundary)
    // Also handle Indonesian sentence patterns
    const sentences = text.split(/\.(?=[A-Z]|Mem|Meng|Mel|Men|Meny|Mer|Pen|Per)/);

    items = sentences
      .map((s) => s.trim())
      .map((s) => s.replace(/\.$/, "").trim()) // Remove trailing period
      .filter((s) => s.length > 10); // Filter out very short fragments
  }

  return items;
}

function extractTextFromNode(node: RichTextNode): string {
  if (!node) return "";

  // If node has direct text
  if (typeof node.text === "string") {
    return node.text;
  }

  // If node has children, recursively extract text
  if (node.children && Array.isArray(node.children)) {
    return node.children.map((child) => extractTextFromNode(child as RichTextNode)).join("");
  }

  return "";
}

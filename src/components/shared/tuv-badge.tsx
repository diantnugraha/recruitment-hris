/**
 * Badge component styled with TUV design tokens.
 *
 * Exact values from @tuv-indo/badges CSS.
 */

import * as React from "react";

type BadgeVariant = "success" | "danger" | "info" | "warning" | "dark" | "brand" | "purple" | "rose";
type BadgeSize = "xs" | "sm" | "md" | "lg";

interface TuvBadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  border?: boolean;
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string; borderNoBorder: string; borderWithBorder: string }> = {
  success: {
    bg: "var(--hsd-ui-color-lime-50, #f4fee6)",
    color: "var(--hsd-ui-color-green-700, #186742)",
    borderNoBorder: "var(--hsd-ui-color-lime-50, #f4fee6)",
    borderWithBorder: "var(--hsd-ui-color-green-300, #75dead)",
  },
  danger: {
    bg: "var(--hsd-ui-color-carmine-50, #ffebed)",
    color: "var(--hsd-ui-color-carmine-600, #bc2935)",
    borderNoBorder: "var(--hsd-ui-color-carmine-50, #ffebed)",
    borderWithBorder: "var(--hsd-ui-color-red-300, #ff8fa3)",
  },
  info: {
    bg: "var(--hsd-ui-color-blue-50, #e3f2fd)",
    color: "var(--hsd-ui-color-blue-800, #1565c0)",
    borderNoBorder: "var(--hsd-ui-color-blue-50, #e3f2fd)",
    borderWithBorder: "var(--hsd-ui-color-blue-300, #64b5f6)",
  },
  warning: {
    bg: "var(--hsd-ui-color-yellow-50, #fffde6)",
    color: "var(--hsd-ui-color-gray-700, #48504c)",
    borderNoBorder: "var(--hsd-ui-color-yellow-50, #fffde6)",
    borderWithBorder: "var(--hsd-ui-color-orange-300, #ffcb69)",
  },
  dark: {
    bg: "var(--hsd-ui-color-gray-100, #eff3f8)",
    color: "var(--hsd-ui-color-gray-700, #48504c)",
    borderNoBorder: "var(--hsd-ui-color-gray-100, #eff3f8)",
    borderWithBorder: "var(--hsd-ui-color-gray-300, #aeb6b2)",
  },
  brand: {
    bg: "var(--hsd-ui-color-navy-50, #e6e9fb)",
    color: "var(--hsd-ui-color-navy-500, #001ed2)",
    borderNoBorder: "var(--hsd-ui-color-navy-50, #e6e9fb)",
    borderWithBorder: "var(--hsd-ui-color-navy-200, #8a98ea)",
  },
  purple: {
    bg: "var(--hsd-ui-color-purple-50, #e9def5)",
    color: "var(--hsd-ui-color-purple-500, #7f39c5)",
    borderNoBorder: "var(--hsd-ui-color-purple-50, #e9def5)",
    borderWithBorder: "var(--hsd-ui-color-purple-500, #7f39c5)",
  },
  rose: {
    bg: "var(--hsd-ui-color-pink-50)",
    color: "var(--hsd-ui-color-pink-500)",
    borderNoBorder: "var(--hsd-ui-color-pink-50)",
    borderWithBorder: "var(--hsd-ui-color-pink-200)",
  },
};

const SIZE_STYLES: Record<BadgeSize, { height: string; fontSize: string; paddingInline: string }> = {
  xs: { height: "20px", fontSize: "10px", paddingInline: "8px" },
  sm: { height: "24px", fontSize: "12px", paddingInline: "8px" },
  md: { height: "28px", fontSize: "12px", paddingInline: "12px" },
  lg: { height: "32px", fontSize: "14px", paddingInline: "12px" },
};

export function TuvBadge({ text, variant = "dark", size = "sm", border = false, dot = false }: TuvBadgeProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        height: s.height,
        fontSize: s.fontSize,
        paddingInline: s.paddingInline,
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 500,
        borderRadius: "4px",
        backgroundColor: v.bg,
        color: v.color,
        border: `1px solid ${border ? v.borderWithBorder : v.borderNoBorder}`,
        width: "max-content",
      }}
    >
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: v.color,
            flexShrink: 0,
          }}
        />
      )}
      {text}
    </span>
  );
}

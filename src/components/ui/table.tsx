import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Table primitives styled with TUV design tokens.
 *
 * Exact values from central-invoicing TableMaster:
 * - Thead: bg #F8F9FB, uppercase, height 50px, whiteSpace nowrap
 * - Th text: fontSize 12px (sm), fontWeight 500 (semibold), color gray-900
 * - Td text: fontSize 12px (sm), fontWeight 400 (medium)
 * - Td first-col paddingLeft 16px
 * - Tr border: 1px solid rgba(gray-500, 0.2)
 * - Tr hover: bg #EDF0F2
 */

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom", className)}
      style={{
        borderCollapse: "collapse",
        fontFamily: "'Poppins', sans-serif",
      }}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(className)}
    style={{
      backgroundColor: "#F8F9FB",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      height: "50px",
    }}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("[&>tr]:last:border-b-0", className)}
    style={{
      borderTop: "1px solid rgba(120, 134, 127, 0.2)",
    }}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors data-[state=selected]:bg-muted",
      className
    )}
    style={{
      borderBottom: "1px solid rgba(120, 134, 127, 0.2)",
      transition: "background-color 0.3s ease",
    }}
    onMouseOver={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = "#EDF0F2";
    }}
    onMouseOut={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = "";
    }}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, children, style: propStyle, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "text-left align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    style={{
      padding: "12px 8px 12px 16px",
      ...propStyle,
    }}
    {...props}
  >
    {/* Match central-invoicing: Text fontSize="sm" fontWeight="semibold" color="text" inside Th */}
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 500,
        fontFamily: "'Poppins', sans-serif",
        color: "var(--hsd-ui-color-gray-900)",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  </th>
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    style={{
      fontWeight: 400,
      fontSize: "0.75rem",
      padding: "16px 8px 16px 16px",
      color: "var(--hsd-ui-color-gray-900)",
    }}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm", className)}
    style={{ color: "var(--hsd-ui-color-gray-500)" }}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

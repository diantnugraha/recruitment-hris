"use client";

import * as React from "react";
import { X, Loader2 } from "lucide-react";

import { employeeService } from "@/services/employee.service";

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

interface EmployeeMultiSelectProps {
  value: EmployeeOption[];
  onChange: (employees: EmployeeOption[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export type { EmployeeOption };

export function EmployeeMultiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Search employees...",
}: EmployeeMultiSelectProps) {
  const [search, setSearch] = React.useState("");
  const [options, setOptions] = React.useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced search with AbortController
  React.useEffect(() => {
    if (search.length < 2) {
      setOptions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await employeeService.search(search);
      if (!controller.signal.aborted && res.success && res.data) {
        const selectedIds = new Set(value.map((v) => v.id));
        setOptions(res.data.filter((emp) => !selectedIds.has(emp.id)));
      }
      if (!controller.signal.aborted) setIsLoading(false);
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, value]);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (emp: EmployeeOption) => {
    onChange([...value, emp]);
    setSearch("");
    setOptions([]);
    inputRef.current?.focus();
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-1.5 rounded border px-3 py-2 min-h-[38px] cursor-text"
        style={{
          borderColor: "rgba(120, 134, 127, 0.3)",
          backgroundColor: disabled
            ? "var(--hsd-ui-color-gray-50)"
            : "#fff",
        }}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {value.map((emp) => (
          <span
            key={emp.id}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5"
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              backgroundColor: "var(--hsd-ui-color-gray-100)",
              color: "var(--hsd-ui-color-gray-700)",
            }}
          >
            {emp.name}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(emp.id);
                }}
                className="hover:opacity-70"
              >
                <X style={{ width: "12px", height: "12px" }} />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none bg-transparent"
            style={{
              fontSize: "0.875rem",
              color: "var(--hsd-ui-color-gray-900)",
            }}
          />
        )}
      </div>

      {isOpen && !disabled && (search.length >= 2 || isLoading) && (
        <div
          className="absolute z-50 mt-1 w-full rounded border shadow-lg"
          style={{
            backgroundColor: "#fff",
            borderColor: "rgba(120, 134, 127, 0.2)",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2
                className="animate-spin"
                style={{
                  width: "16px",
                  height: "16px",
                  color: "var(--hsd-ui-color-gray-400)",
                }}
              />
            </div>
          ) : options.length === 0 ? (
            <div
              className="py-3 px-4"
              style={{
                fontSize: "0.875rem",
                color: "var(--hsd-ui-color-gray-400)",
              }}
            >
              No employees found
            </div>
          ) : (
            options.map((emp) => (
              <button
                key={emp.id}
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                onClick={() => handleSelect(emp)}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--hsd-ui-color-gray-900)",
                  }}
                >
                  {emp.name}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--hsd-ui-color-gray-500)",
                  }}
                >
                  {emp.email}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  searchPlaceholder?: string;
  emptyText?: string;
}

export type { EmployeeOption };

export function EmployeeMultiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Select employee...",
  searchPlaceholder = "Search employee...",
  emptyText = "No employee found.",
}: EmployeeMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [options, setOptions] = React.useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  // Fetch employees on search change
  const handleSearch = React.useCallback(
    (query: string) => {
      setSearch(query);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (query.length < 2) {
        setOptions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      debounceRef.current = setTimeout(async () => {
        const res = await employeeService.search(query);
        if (res.success && res.data) {
          setOptions(res.data);
        }
        setIsLoading(false);
      }, 300);
    },
    []
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setOptions([]);
    }
  }, [open]);

  const selectedIds = new Set(value.map((v) => v.id));

  const handleSelect = (emp: EmployeeOption) => {
    if (selectedIds.has(emp.id)) {
      onChange(value.filter((v) => v.id !== emp.id));
    } else {
      onChange([...value, emp]);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v.id !== id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between text-sm transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          )}
          style={{
            minHeight: "38px",
            borderRadius: "4px",
            border: "1px solid rgba(120, 134, 127, 0.2)",
            backgroundColor: disabled ? "var(--hsd-ui-color-gray-50)" : "#fff",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            padding: "4px 12px",
          }}
        >
          <div className="flex flex-wrap gap-1.5 flex-1" style={{ minHeight: "28px", alignItems: "center" }}>
            {value.length > 0 ? (
              value.map((emp) => (
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
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemove(emp.id, e)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRemove(emp.id, e as unknown as React.MouseEvent); }}
                      className="hover:opacity-70 cursor-pointer"
                    >
                      <X style={{ width: "12px", height: "12px" }} />
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span style={{ color: "#d0d6dd" }}>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown
            style={{
              width: "16px",
              height: "16px",
              flexShrink: 0,
              color: "var(--hsd-ui-color-gray-400)",
            }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{
          width: "var(--radix-popover-trigger-width)",
          borderRadius: "4px",
          border: "1px solid rgba(120, 134, 127, 0.2)",
          boxShadow: "0px 8px 12px 0px rgba(0, 0, 0, 0.08)",
          backgroundColor: "#fff",
          overflow: "hidden",
        }}
      >
        <Command
          shouldFilter={false}
          className="emp-multi-cmd"
          style={{ backgroundColor: "#fff", borderRadius: "4px" }}
        >
          <style>{`
            .emp-multi-cmd [cmdk-input-wrapper] {
              border: none !important;
              margin: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              border-bottom: 1px solid rgba(120, 134, 127, 0.15) !important;
            }
          `}</style>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={handleSearch}
          />
          <CommandList
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              padding: "4px",
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
            ) : search.length < 2 ? (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  fontSize: "0.875rem",
                  color: "var(--hsd-ui-color-gray-500)",
                }}
              >
                Type to search...
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty
                style={{
                  padding: "16px",
                  textAlign: "center",
                  fontSize: "0.875rem",
                  color: "var(--hsd-ui-color-gray-500)",
                }}
              >
                {emptyText}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((emp) => (
                  <CommandItem
                    key={emp.id}
                    value={emp.id}
                    onSelect={() => handleSelect(emp)}
                    className="cursor-pointer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      fontFamily: "'Poppins', sans-serif",
                      color: "#232933",
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.has(emp.id) ? "opacity-100" : "opacity-0"
                      )}
                      style={{
                        color: selectedIds.has(emp.id)
                          ? "var(--hsd-ui-color-navy-500)"
                          : "transparent",
                      }}
                    />
                    <div className="flex flex-col">
                      <span style={{ fontWeight: 500 }}>{emp.name}</span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--hsd-ui-color-gray-500)",
                        }}
                      >
                        {emp.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

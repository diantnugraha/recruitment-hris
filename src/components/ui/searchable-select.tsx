"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between text-sm transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
          style={{
            height: "38px",
            borderRadius: "4px",
            border: "1px solid rgba(120, 134, 127, 0.2)",
            backgroundColor: "#fff",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            color: value ? "#232933" : "#d0d6dd",
            padding: "0 12px",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: selectedOption ? "#232933" : "#d0d6dd",
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
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
          style={{
            backgroundColor: "#fff",
            borderRadius: "4px",
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              padding: "4px",
            }}
          >
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
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
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
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                      color: value === option.value ? "var(--hsd-ui-color-navy-500)" : "transparent",
                    }}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

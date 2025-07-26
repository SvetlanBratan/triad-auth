
"use client"

import * as React from "react"
import { Check, X, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "./badge"
import { ScrollArea } from "./scroll-area"

export type OptionType = {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
}

function MultiSelect({ options, selected, onChange, className, placeholder = "Выберите..." }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  // Find the labels for the selected values
  const selectedLabels = selected
    .map(value => options.find(option => option.value === value)?.label)
    .filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", className)}
          onClick={() => setOpen(!open)}
        >
             <div className="flex flex-wrap gap-1">
              {selectedLabels.length === 0 && <span className="text-muted-foreground font-normal">{placeholder}</span>}
              {selectedLabels.map((label, index) => {
                 const value = selected[index];
                 return (
                    <Badge
                      variant="secondary"
                      key={value}
                      className="rounded-sm"
                    >
                      {label}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`Remove ${label}`}
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            handleUnselect(value);
                          }
                        }}
                        onClick={(e) => {
                           e.stopPropagation(); // Prevent popover from closing
                           handleUnselect(value);
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </div>
                    </Badge>
                  )
              })}
             </div>
             <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <ScrollArea className="max-h-72">
            <div className="p-1">
            {options.map((option) => (
                <div
                    key={option.value}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                        onChange(
                        selected.includes(option.value)
                            ? selected.filter((item) => item !== option.value)
                            : [...selected, option.value]
                        )
                    }}
                >
                <Check
                    className={cn(
                    "mr-2 h-4 w-4",
                    selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                />
                {option.label}
                </div>
            ))}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export { MultiSelect };

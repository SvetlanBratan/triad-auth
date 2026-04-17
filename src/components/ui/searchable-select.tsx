"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type SelectOption = { value: string; label: string }
type SelectOptionGroup = { label: string; options: SelectOption[] }

interface SearchableSelectProps {
  options: (SelectOption | SelectOptionGroup)[]
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  renderOption?: (option: SelectOption) => React.ReactNode
  renderSelected?: (option: SelectOption) => React.ReactNode
  className?: string
}

const isOptionGroup = (
  option: SelectOption | SelectOptionGroup
): option is SelectOptionGroup => {
  return "options" in option
}

export const SearchableSelect = ({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  renderOption,
  renderSelected,
  className,
}: SearchableSelectProps) => {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const allOptions = React.useMemo(() => {
    const flatOptions: SelectOption[] = []
    options.forEach((opt) => {
      if (isOptionGroup(opt)) {
        flatOptions.push(...opt.options)
      } else {
        flatOptions.push(opt)
      }
    })
    return flatOptions
  }, [options])

  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase()

  const filteredOptions = React.useMemo(() => {
    if (!normalizedSearchQuery) {
      return options
    }

    return options
      .map((opt) => {
        if (isOptionGroup(opt)) {
          const filteredGroupOptions = opt.options.filter((item) =>
            item.label.toLocaleLowerCase().includes(normalizedSearchQuery)
          )

          if (filteredGroupOptions.length === 0) {
            return null
          }

          return {
            ...opt,
            options: filteredGroupOptions,
          }
        }

        return opt.label.toLocaleLowerCase().includes(normalizedSearchQuery)
          ? opt
          : null
      })
      .filter((opt): opt is SelectOption | SelectOptionGroup => opt !== null)
  }, [normalizedSearchQuery, options])

  const selectedOption = allOptions.find((opt) => opt.value === value)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearchQuery("")
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", className)}
          disabled={disabled}
        >
          <div className="flex-1 text-left">
            {selectedOption && renderSelected ? (
              renderSelected(selectedOption)
            ) : (
              <span className="truncate">
                {selectedOption?.label || placeholder}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Поиск..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-72 overflow-y-auto overflow-x-hidden">
            <CommandEmpty>Ничего не найдено.</CommandEmpty>
            {filteredOptions.map((option, index) => {
              if (isOptionGroup(option)) {
                return (
                  <CommandGroup
                    key={`${option.label}-${index}`}
                    heading={option.label}
                  >
                    {option.options.map((item) => (
                      <CommandItem
                        key={item.value}
                        value={item.label}
                        onSelect={() => {
                          onValueChange(item.value === value ? "" : item.value)
                          handleOpenChange(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === item.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {renderOption ? renderOption(item) : item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              }
              return (
                <CommandGroup key={`${option.value}-${index}`}>
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.value === value ? "" : option.value)
                      handleOpenChange(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {renderOption ? renderOption(option) : option.label}
                  </CommandItem>
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

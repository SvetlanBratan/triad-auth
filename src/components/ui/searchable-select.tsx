
'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from './scroll-area';

type SelectOption = { value: string; label: string };
type SelectOptionGroup = { label: string; options: SelectOption[] };

interface SearchableSelectProps {
  options: (SelectOption | SelectOptionGroup)[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  renderOption?: (option: SelectOption) => React.ReactNode;
  renderSelected?: (option: SelectOption) => React.ReactNode;
}

const isOptionGroup = (option: SelectOption | SelectOptionGroup): option is SelectOptionGroup => {
    return 'options' in option;
}

export const SearchableSelect = ({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  renderOption,
  renderSelected,
}: SearchableSelectProps) => {
  const [open, setOpen] = React.useState(false);

  const allOptions = React.useMemo(() => {
    const flatOptions: SelectOption[] = [];
    options.forEach(opt => {
        if(isOptionGroup(opt)) {
            flatOptions.push(...opt.options);
        } else {
            flatOptions.push(opt);
        }
    });
    return flatOptions;
  }, [options]);

  const selectedOption = allOptions.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10"
          disabled={disabled}
        >
          <div className="flex-1 text-left">
            {selectedOption && renderSelected ? (
              renderSelected(selectedOption)
            ) : (
              <span className="truncate">{selectedOption?.label || placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Поиск..." />
          <ScrollArea className="max-h-72">
            <CommandEmpty>Ничего не найдено.</CommandEmpty>
            {options.map((option, index) => {
              if (isOptionGroup(option)) {
                  return (
                  <CommandGroup key={`${option.label}-${index}`} heading={option.label}>
                      {option.options.map((item) => (
                      <CommandItem
                          key={item.value}
                          value={item.label}
                          onSelect={() => {
                          onValueChange(item.value === value ? "" : item.value);
                          setOpen(false);
                          }}
                      >
                          <Check
                          className={cn(
                              'mr-2 h-4 w-4',
                              value === item.value ? 'opacity-100' : 'opacity-0'
                          )}
                          />
                          {renderOption ? renderOption(item) : item.label}
                      </CommandItem>
                      ))}
                  </CommandGroup>
                  );
              }
              return (
                  <CommandGroup key={`${option.value}-${index}`}>
                      <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                              onValueChange(option.value === value ? "" : option.value);
                              setOpen(false);
                          }}
                          >
                          <Check
                              className={cn(
                              'mr-2 h-4 w-4',
                              value === option.value ? 'opacity-100' : 'opacity-0'
                              )}
                          />
                           {renderOption ? renderOption(option) : option.label}
                      </CommandItem>
                  </CommandGroup>
              );
            })}
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

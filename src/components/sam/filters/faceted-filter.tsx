'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { FilterChip } from './filter-chip';

/**
 * Single-select filter chip with a searchable list — the shadcn faceted-filter
 * anatomy, holding a plain string like `FilterCombobox` does (`''` = ไม่กรอง)
 * so the screens keep storing ids rather than option objects.
 *
 * Lists such as ชื่อพนักงานขาย run to twenty-odd near-identical names, which is
 * why the list is searchable rather than a plain menu.
 */

export type FacetedFilterOption = {
  value: string;
  label: string;
};

export interface FacetedFilterProps {
  title: string;
  options: FacetedFilterOption[];
  /** '' = ไม่กรอง. */
  value: string;
  onValueChange: (value: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function FacetedFilter({
  title,
  options,
  value,
  onValueChange,
  emptyMessage = 'ไม่พบรายการที่ค้นหา',
  className
}: FacetedFilterProps) {
  const [open, setOpen] = React.useState(false);

  const selected = options.find((option) => option.value === value);

  const handleReset = (event?: React.MouseEvent | React.KeyboardEvent) => {
    // Without this the chip's own trigger would fire and open the popover.
    event?.stopPropagation();
    onValueChange('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterChip
        title={title}
        hasValue={Boolean(selected)}
        onReset={handleReset}
        className={className}
      >
        <Badge variant='secondary' className='max-w-40 truncate rounded-sm px-1 font-normal'>
          {selected?.label}
        </Badge>
      </FilterChip>
      <PopoverContent className='w-56 p-0' align='start'>
        <Command>
          <CommandInput placeholder={`ค้นหา${title}`} />
          <CommandList className='max-h-full'>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className='max-h-[18.75rem] overflow-x-hidden overflow-y-auto'>
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <CommandItem
                    key={option.value}
                    // Picking the selected entry again clears the filter, which
                    // is how the shadcn faceted filter behaves.
                    onSelect={() => {
                      onValueChange(isSelected ? '' : option.value);
                      setOpen(false);
                    }}
                  >
                    <div
                      className={cn(
                        'border-primary flex size-4 items-center justify-center rounded-sm border',
                        isSelected ? 'bg-primary' : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Icons.check />
                    </div>
                    <span className='truncate'>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      handleReset();
                      setOpen(false);
                    }}
                    className='justify-center text-center'
                  >
                    ล้างตัวกรอง
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

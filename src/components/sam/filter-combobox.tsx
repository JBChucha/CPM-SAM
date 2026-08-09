'use client';

import * as React from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

/**
 * Searchable single-select for the SAM filter bars.
 *
 * Same contract as the native select it replaces — a plain string in, a plain
 * string out, `''` meaning "everything" — so screens keep holding their filter
 * state as ids and never deal with option objects. The "ทั้งหมด" entry is added
 * here rather than by every caller, and it is a real item in the list so the
 * filter can be widened again by picking it.
 *
 * Lists like ชื่อพนักงานขาย run to twenty-odd near-identical names; typing to
 * narrow them is the point of using this over a select.
 */

export type FilterComboboxOption = {
  value: string;
  label: string;
};

export interface FilterComboboxProps {
  /** Id of the input, so the field's <Label> points at it. */
  id: string;
  options: FilterComboboxOption[];
  /** '' = ทั้งหมด. */
  value: string;
  onValueChange: (value: string) => void;
  /** Label of the "everything" entry, which is also the placeholder. */
  allLabel?: string;
  emptyMessage?: string;
  className?: string;
}

export function FilterCombobox({
  id,
  options,
  value,
  onValueChange,
  allLabel = 'ทั้งหมด',
  emptyMessage = 'ไม่พบรายการที่ค้นหา',
  className
}: FilterComboboxProps) {
  const items = React.useMemo(
    () => [{ value: '', label: allLabel }, ...options],
    [options, allLabel]
  );

  const selected = React.useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value]
  );

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  // Closed, the input reads as the current selection, like the select it
  // replaces. Open, it empties out and the selection moves to the placeholder:
  // otherwise the caret lands after the selected label and the first keystroke
  // produces a query like "ทั้งหมด16", which matches nothing.
  const inputValue = open ? query : (selected?.label ?? '');

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(item) => onValueChange(item?.value ?? '')}
      // Options are rebuilt on render, so identity comparison would never match.
      isItemEqualToValue={(item, current) => item.value === current.value}
      // Type a few letters, press Enter: the first match is already highlighted.
      autoHighlight
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setQuery('');
      }}
      inputValue={inputValue}
      onInputValueChange={setQuery}
    >
      <ComboboxInput
        id={id}
        placeholder={selected?.label ?? allLabel}
        className={cn('w-full', className)}
      />
      <ComboboxContent>
        <ComboboxList>
          {(item: FilterComboboxOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
}

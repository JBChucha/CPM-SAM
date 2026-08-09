'use client';

import * as React from 'react';
import { th } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { useMediaQuery } from '@/hooks/use-media-query';
import { formatDateBE } from '@/lib/format-date-be';
import { FilterChip } from './filter-chip';

/**
 * Date-range filter chip for the SAM list screens.
 *
 * The screens filter as the chips change, so the range is held back until the
 * user has finished outlining it: applying the first day on its own would
 * filter the table down to that one day, and then out again, while they are
 * still reaching for the second date.
 *
 * "Finished" is counted in clicks rather than read off the range, because
 * react-day-picker hands back a complete `{ from, to }` from the very first
 * click — a one-day range — so `from && to` is true immediately and says
 * nothing about whether the user is done. Two clicks in, whatever they have
 * outlined is what they meant, including the same day twice: react-day-picker
 * clears the selection there, and we read it as that single day.
 *
 * A range left half-picked when the popover closes is dropped.
 */

export interface DateRangeFilterProps {
  title: string;
  /** The applied range; `undefined` (or empty ends) = ไม่กรอง. */
  value?: DateRange;
  onValueChange: (range?: DateRange) => void;
  className?: string;
}

export function DateRangeFilter({ title, value, onValueChange, className }: DateRangeFilterProps) {
  const { isOpen: isSmallScreen } = useMediaQuery();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>(value);
  /** Days picked since the popover was opened; the second one commits. */
  const picks = React.useRef(0);

  // Follows the applied value when it is changed from outside — ล้างตัวกรอง on
  // the toolbar, or a reset after a search.
  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const shown = open ? draft : value;
  const hasValue = Boolean(shown?.from || shown?.to);

  const handleSelect = (range?: DateRange) => {
    picks.current += 1;

    if (picks.current < 2) {
      setDraft(range);
      return;
    }

    // `range` is empty when the same day was clicked twice; the range the user
    // outlined is then the single day still in the draft.
    const committed = range?.from ? range : draft;
    picks.current = 0;
    setDraft(committed);
    onValueChange(committed);
    setOpen(false);
  };

  const handleReset = (event: React.MouseEvent | React.KeyboardEvent) => {
    // Without this the chip's own trigger would fire and open the popover.
    event.stopPropagation();
    picks.current = 0;
    setDraft(undefined);
    onValueChange(undefined);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        picks.current = 0;
        // Closing on a half-picked range drops it rather than applying it.
        if (!next) setDraft(value);
      }}
    >
      <FilterChip
        title={title}
        hasValue={hasValue}
        onReset={handleReset}
        icon={<Icons.calendar />}
        className={className}
      >
        <span className='font-mono text-xs tabular-nums'>{formatRange(shown)}</span>
      </FilterChip>
      <PopoverContent className='w-auto p-0' align='start'>
        {/* The shadcn Range Picker anatomy: two months side by side behind
            prev/next arrows — one month on phones, where two would not fit. */}
        <Calendar
          autoFocus
          mode='range'
          locale={th}
          numberOfMonths={isSmallScreen ? 1 : 2}
          formatters={{ formatCaption: formatCaptionBE }}
          selected={draft}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

/** 05/08/2569 - 12/08/2569, or a single day when both ends land on it. */
function formatRange(range?: DateRange) {
  if (!range?.from && !range?.to) return '';
  if (range?.from && range?.to && !isSameDay(range.from, range.to)) {
    return `${formatDateBE(range.from)} - ${formatDateBE(range.to)}`;
  }
  return formatDateBE(range?.from ?? range?.to);
}

/** สิงหาคม 2569 — the month heading over each of the two months. */
function formatCaptionBE(month: Date) {
  return `${month.toLocaleString('th-TH', { month: 'long' })} ${month.getFullYear() + 543}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

/**
 * The dashed pill every SAM filter is triggered from — the shadcn data-table
 * filter anatomy (`data-table-faceted-filter`), with Thai labels and without the
 * TanStack `Column` binding, since the SAM list screens hold their filter state
 * themselves rather than in a table instance.
 *
 * Renders the trigger only; the caller owns the `<Popover>` and its content.
 *
 *   [⊕ ชื่อผู้ทำรายการ]        idle
 *   [⊗ ชื่อผู้ทำรายการ | สมชาย]  with a value, the icon becomes the clear button
 */

export interface FilterChipProps {
  title: string;
  /** Drives both the clear affordance and whether `children` is shown. */
  hasValue: boolean;
  onReset: (event: React.MouseEvent | React.KeyboardEvent) => void;
  /** Icon shown while no value is set. */
  icon?: React.ReactNode;
  /** The selected value, rendered after a separator. */
  children?: React.ReactNode;
  className?: string;
}

export function FilterChip({
  title,
  hasValue,
  onReset,
  icon,
  children,
  className
}: FilterChipProps) {
  return (
    <PopoverTrigger
      render={<Button type='button' variant='outline' size='sm' />}
      className={cn('border-dashed', className)}
    >
      {hasValue ? (
        <FilterChipClear title={title} onReset={onReset} />
      ) : (
        (icon ?? <Icons.plusCircle />)
      )}
      {title}
      {hasValue && children && (
        <>
          <Separator orientation='vertical' className='mx-0.5 data-[orientation=vertical]:h-4' />
          {children}
        </>
      )}
    </PopoverTrigger>
  );
}

/**
 * Sits INSIDE the trigger button, so it must not be a <button> itself
 * (button-in-button is invalid HTML and breaks hydration): a div with button
 * semantics and Enter/Space activation, same as the template's
 * `DataTableFilterClear` but labelled in Thai.
 *
 * Everything is handled in the capture phase. The popover trigger opens on its
 * own native pointerdown/click listener, which runs on the way back up — before
 * React's delegated bubble handlers — so stopping the event there is too late
 * and clearing a filter would leave its popover hanging open.
 */
function FilterChipClear({
  title,
  onReset
}: {
  title: string;
  onReset: (event: React.MouseEvent | React.KeyboardEvent) => void;
}) {
  return (
    <div
      role='button'
      aria-label={`ล้างตัวกรอง${title}`}
      tabIndex={0}
      onPointerDownCapture={stop}
      onMouseDownCapture={stop}
      onClickCapture={(event) => {
        event.stopPropagation();
        onReset(event);
      }}
      onKeyDownCapture={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onReset(event);
        }
      }}
      className='focus-visible:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:outline-none'
    >
      <Icons.xCircle />
    </div>
  );
}

function stop(event: React.SyntheticEvent) {
  event.stopPropagation();
}

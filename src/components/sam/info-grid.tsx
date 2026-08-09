import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Header data grid shared by the SAM screens (ใบเบิกสินค้า SP, เคลียร์เงิน …).
 *
 * Visual language matches the purchase-order grid already shipped: caption
 * above value, dividers running edge to edge, so the padding lives on the cells
 * rather than the container.
 *
 * For the dividers to actually reach the card's edges the host has to give up
 * its own gutter on all four sides — `<CardContent className='-mt-3 px-0 pb-0'>`
 * inside a `<Card size='sm' className='pb-0'>`, where the negative margin
 * cancels the card's flex gap below its header.
 */

/**
 * Padding for one cell. The cells carry the whole vertical gutter themselves so
 * the host card can drop its own — that is what lets the dividers run all the
 * way to the card's top and bottom edges instead of stopping short of them.
 */
const CELL = 'px-3 py-6';

/** Caption above every value. */
const CAPTION = 'text-sm text-muted-foreground';

export type InfoGridField = {
  label: string;
  /** Read-only text. Ignored when `control` is given. */
  value?: React.ReactNode;
  /** Interactive cell content (select, date picker, input) instead of text. */
  control?: React.ReactNode;
  /** Id of the control, so the caption becomes its real <label>. */
  controlId?: string;
  /** Renders a red asterisk after the caption. */
  required?: boolean;
  /**
   * Renders a read-only `value` at the size the purchase-order grid gives its
   * PO number. That size is the slip's single headline identifier — one field
   * per grid, never a second. Ignored when `control` is given.
   */
  emphasis?: boolean;
  /** Columns this field spans on `lg` and up. */
  span?: 1 | 2 | 3 | 4 | 5;
};

export interface InfoGridProps {
  fields: InfoGridField[];
  /** Cells per row from `lg` up. Below that every field stacks. */
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

const COLUMN_CLASS = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5'
} as const;

const SPAN_CLASS = {
  1: '',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5'
} as const;

export function InfoGrid({ fields, columns = 4, className }: InfoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 divide-y lg:divide-x lg:divide-y-0',
        COLUMN_CLASS[columns],
        className
      )}
    >
      {fields.map((field) => (
        <div key={field.label} className={cn(CELL, 'min-w-0', SPAN_CLASS[field.span ?? 1])}>
          {field.controlId ? (
            <Label htmlFor={field.controlId} className={cn(CAPTION, 'font-normal')}>
              {field.label}
              {field.required && <span className='text-destructive ml-0.5'>*</span>}
            </Label>
          ) : (
            <p className={CAPTION}>
              {field.label}
              {field.required && <span className='text-destructive ml-0.5'>*</span>}
            </p>
          )}

          {field.control ? (
            <div className='mt-1.5'>{field.control}</div>
          ) : (
            <div
              className={cn(
                'text-foreground mt-1 truncate',
                field.emphasis ? 'text-xl font-bold tracking-tight' : 'text-sm font-medium'
              )}
            >
              {field.value ?? '-'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

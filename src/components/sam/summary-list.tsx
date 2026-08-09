import * as React from 'react';
import { formatAmount } from '@/lib/format-date-be';
import { cn } from '@/lib/utils';

/**
 * Numbered amount list used by the clearing screens
 * (ข้อมูลส่งเงินสุทธิพนักงาน, สรุปหนี้/รายได้อื่นๆ, สรุปการเคลียร์เงิน).
 *
 * Rows are zebra-striped, amounts are right-aligned tabular numbers, and the
 * unit ("บาท") sits in its own trailing column so the numbers stay in line
 * regardless of magnitude — the same anatomy as the reference screens.
 *
 * Blank lines in the reference are semantic groupings, not decoration, so they
 * are modelled as separate groups rather than empty rows.
 */

export type SummaryTone = 'default' | 'positive' | 'negative' | 'muted';

export type SummaryRow = {
  /** Includes its own numbering, e.g. "1. มูลค่าสินค้าขายจริง". */
  label: string;
  /** Formatted with two decimals when numeric. Ignored when `control` is set. */
  value?: number | string;
  /** Editable amount (an <Input>) instead of static text. */
  control?: React.ReactNode;
  tone?: SummaryTone;
  /** Defaults to "บาท". Pass '' to drop the unit column for this row. */
  unit?: string;
  /** Renders the label and amount bold — used for the closing total of a group. */
  emphasis?: boolean;
};

const TONE_CLASS: Record<SummaryTone, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-destructive',
  muted: 'text-muted-foreground'
};

export interface SummaryListProps {
  title?: string;
  /** Each group renders as a block; groups are separated by vertical space. */
  groups: SummaryRow[][];
  className?: string;
}

export function SummaryList({ title, groups, className }: SummaryListProps) {
  return (
    <section className={cn('space-y-3', className)}>
      {title && <h3 className='text-sm font-semibold'>{title}</h3>}

      <div className='space-y-4'>
        {groups.map((rows, groupIndex) => (
          <dl key={groupIndex} className='overflow-hidden rounded-lg'>
            {rows.map((row, rowIndex) => (
              <div
                key={row.label}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm',
                  rowIndex % 2 === 0 && 'bg-muted/50'
                )}
              >
                <dt className={cn('min-w-0 flex-1 truncate', row.emphasis && 'font-semibold')}>
                  {row.label}
                </dt>
                <dd
                  className={cn(
                    'shrink-0 text-right font-mono tabular-nums',
                    row.control ? 'w-40' : 'w-28',
                    TONE_CLASS[row.tone ?? 'default'],
                    row.emphasis && 'font-bold'
                  )}
                >
                  {row.control ??
                    (typeof row.value === 'number' ? formatAmount(row.value) : (row.value ?? '-'))}
                </dd>
                <span className='text-muted-foreground w-8 shrink-0 text-xs'>
                  {row.unit ?? 'บาท'}
                </span>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </section>
  );
}

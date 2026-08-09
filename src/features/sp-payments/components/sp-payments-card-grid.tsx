'use client';

import { formatAmount, formatDateBE } from '@/lib/format-date-be';
import type { SpPaymentRecord } from '../api/types';
import { fromISODate } from '../lib/iso-date';

/**
 * The card view of รายการเคลียร์เงิน — the same rows the table serves, cut down
 * to what identifies a clearing round at a glance: เลขที่, ชื่อ SP, ยอดสุทธิที่ต้องส่ง
 * and วันที่ทำรายการ.
 *
 * Everything the table also shows (ยอดส่งจริง, ค่าคอมฯ, ผู้ทำรายการ) is one click
 * away in the detail dialog, so each card is a single button rather than a div
 * with controls inside it — that keeps it reachable by keyboard without any
 * nested tab stops.
 */
export interface SpPaymentsCardGridProps {
  rows: SpPaymentRecord[];
  /** 1-based index of `rows[0]` across the whole result — the ลำดับที่ badge. */
  rangeStart: number;
  onView: (record: SpPaymentRecord) => void;
}

export function SpPaymentsCardGrid({ rows, rangeStart, onView }: SpPaymentsCardGridProps) {
  return (
    <ul className='grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {rows.map((record, index) => (
        <li key={record.id} className='min-w-0'>
          <button
            type='button'
            onClick={() => onView(record)}
            aria-label={`ดูรายละเอียดใบเคลียร์เงิน ${record.id}`}
            className='bg-card text-card-foreground hover:border-ring/40 hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-ring/50 flex h-full w-full min-w-0 flex-col gap-3 rounded-lg border p-4 text-left transition-colors outline-none focus-visible:ring-3'
          >
            <div className='flex min-w-0 items-start justify-between gap-2'>
              <span className='truncate font-mono text-sm font-medium'>{record.id}</span>
              <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                #{rangeStart + index}
              </span>
            </div>

            <div className='min-w-0'>
              <p className='text-muted-foreground text-xs'>ชื่อ SP</p>
              <p className='mt-0.5 truncate text-sm font-medium'>{record.staffName}</p>
            </div>

            <div className='mt-auto flex items-end justify-between gap-3 border-t pt-3'>
              <div className='min-w-0'>
                <p className='text-muted-foreground text-xs'>ยอดสุทธิที่ต้องส่ง</p>
                <p className='mt-0.5 font-mono text-lg font-semibold tabular-nums'>
                  {formatAmount(record.netDue)}
                </p>
              </div>
              <span className='text-muted-foreground shrink-0 font-mono text-xs tabular-nums'>
                {formatDateBE(fromISODate(record.transactionDate))}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

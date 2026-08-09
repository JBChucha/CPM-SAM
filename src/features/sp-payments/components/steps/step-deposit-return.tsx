'use client';

import * as React from 'react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Icons } from '@/components/icons';
import { CatalogTable, type CatalogColumn } from '@/components/sam/catalog-table';
import type { SpProductItem } from '@/features/sp/api/sp-catalog';
import { formatAmount, formatBaht, formatCount } from '@/lib/format-date-be';
import { cn } from '@/lib/utils';
import type { ClearingLine } from '../../lib/sp-payment-math';

/**
 * ขั้นตอนที่ 2 — ฝาก/คืน สินค้า.
 *
 * The step that turns "what left the agent" into "what was actually sold":
 * จำนวนที่ขายได้จริง = เบิก − ฝาก − คืน. The ฝาก/คืน of the round come in with the
 * ใบเบิก, so this screen only reports them — every figure here is read-only and
 * feeds the มูลค่า, คอมมิชชั่น and ยอดที่ต้องส่ง of the later steps.
 */

/** The catalog table keys on the product, so each row carries its line along. */
type ClearingRow = SpProductItem & { line: ClearingLine };

export interface StepDepositReturnProps {
  lines: ClearingLine[];
}

export function StepDepositReturn({ lines }: StepDepositReturnProps) {
  const rows: ClearingRow[] = React.useMemo(
    () => lines.map((line) => ({ ...line.product, line })),
    [lines]
  );

  const totals = React.useMemo(
    () =>
      lines.reduce(
        (acc, line) => ({
          withdrawn: acc.withdrawn + line.withdrawn,
          deposited: acc.deposited + line.deposited,
          returned: acc.returned + line.returned,
          sold: acc.sold + line.sold,
          value: acc.value + line.value
        }),
        { withdrawn: 0, deposited: 0, returned: 0, sold: 0, value: 0 }
      ),
    [lines]
  );

  const columns: CatalogColumn<ClearingRow>[] = React.useMemo(
    () => [
      {
        id: 'index',
        header: 'ลำดับ',
        width: 'w-14',
        align: 'center',
        cellClassName: 'text-muted-foreground text-sm',
        cell: (_row, index) => index + 1
      },
      {
        id: 'code',
        header: 'รหัสสินค้า',
        width: 'w-24',
        cellClassName: 'text-muted-foreground font-mono text-sm',
        cell: (row) => row.code
      },
      {
        // The only auto-width column — it absorbs the slack and truncates.
        id: 'name',
        header: 'ชื่อสินค้า',
        cellClassName: 'text-foreground truncate py-1.5 text-sm font-semibold',
        cell: (row) => row.name
      },
      {
        id: 'unit',
        header: 'หน่วย',
        width: 'w-16',
        align: 'center',
        cellClassName: 'text-muted-foreground text-sm',
        cell: (row) => row.unit
      },
      {
        id: 'price',
        header: 'ราคา/หน่วย',
        fullHeader: 'ราคาขายต่อหน่วย',
        width: 'w-20',
        align: 'right',
        cellClassName: 'font-mono text-sm tabular-nums',
        cell: (row) => formatAmount(row.spPrice)
      },
      {
        id: 'withdrawn',
        header: 'เบิก',
        fullHeader: 'จำนวนที่เบิกตามใบเบิกที่เลือก',
        width: 'w-16',
        align: 'right',
        cellClassName: 'font-mono text-sm font-semibold tabular-nums',
        cell: (row) => formatCount(row.line.withdrawn)
      },
      {
        id: 'deposited',
        header: 'ฝาก',
        fullHeader: 'จำนวนที่ฝากไว้กับร้านค้า',
        width: 'w-16',
        align: 'right',
        cell: (row) => (
          <span
            className={cn(
              'font-mono text-sm tabular-nums',
              row.line.deposited > 0 ? 'text-foreground' : 'text-muted-foreground/50'
            )}
          >
            {formatCount(row.line.deposited)}
          </span>
        )
      },
      {
        id: 'returned',
        header: 'คืน',
        fullHeader: 'จำนวนที่คืนเข้าสต็อกเอเยนต์',
        width: 'w-16',
        align: 'right',
        cell: (row) => (
          <span
            className={cn(
              'font-mono text-sm tabular-nums',
              row.line.returned > 0 ? 'text-foreground' : 'text-muted-foreground/50'
            )}
          >
            {formatCount(row.line.returned)}
          </span>
        )
      },
      {
        id: 'sold',
        header: 'ขายได้จริง',
        fullHeader: 'จำนวนที่ขายได้จริง (เบิก − ฝาก − คืน)',
        width: 'w-20',
        align: 'right',
        cell: (row) => (
          <span
            className={cn(
              'font-mono text-sm tabular-nums',
              row.line.sold > 0 ? 'text-foreground font-bold' : 'text-muted-foreground/50'
            )}
          >
            {formatCount(row.line.sold)}
          </span>
        )
      },
      {
        // Must stay a width the catalog table can pin against (PIN_OFFSET).
        id: 'value',
        header: 'มูลค่า',
        fullHeader: 'มูลค่าสินค้าที่ขายได้จริง',
        width: 'w-24',
        align: 'right',
        cell: (row) => (
          <span
            className={cn(
              'font-mono text-sm tabular-nums',
              row.line.value > 0 ? 'text-brand font-bold' : 'text-muted-foreground/50'
            )}
          >
            {formatAmount(row.line.value)}
          </span>
        )
      }
    ],
    []
  );

  if (lines.length === 0) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.inbox />
          </EmptyMedia>
          <EmptyTitle>ยังไม่ได้เลือกใบเบิกสินค้า</EmptyTitle>
          <EmptyDescription>
            กลับไปที่ขั้นตอนที่ 1 แล้วเลือกใบเบิกสินค้าอย่างน้อย 1 ใบ จึงจะบันทึกการฝาก/คืนได้
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='min-w-0 space-y-4'>
      <CatalogTable
        items={rows}
        columns={columns}
        grouped={false}
        pinLastTwo
        minWidthClass='min-w-[900px]'
        emptyDescription='ไม่มีสินค้าในใบเบิกที่เลือก'
      />

      {/* Running totals — the figures ขั้นตอนที่ 3 opens with. */}
      <div className='bg-muted/40 grid grid-cols-2 gap-4 rounded-lg p-4 sm:grid-cols-5'>
        {[
          { label: 'จำนวนที่เบิก', value: formatCount(totals.withdrawn) },
          { label: 'จำนวนที่ฝาก', value: formatCount(totals.deposited) },
          { label: 'จำนวนที่คืน', value: formatCount(totals.returned) },
          { label: 'ขายได้จริง', value: formatCount(totals.sold) },
          { label: 'มูลค่าที่ขายได้จริง', value: formatBaht(totals.value), emphasis: true }
        ].map((item) => (
          <div key={item.label} className='min-w-0'>
            <p className='text-muted-foreground truncate text-xs'>{item.label}</p>
            <p
              className={cn(
                'mt-0.5 truncate font-mono tabular-nums',
                item.emphasis ? 'text-brand text-lg font-bold' : 'text-base font-semibold'
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

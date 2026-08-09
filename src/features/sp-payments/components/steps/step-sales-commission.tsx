'use client';

import * as React from 'react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatAmount, formatCount } from '@/lib/format-date-be';
import { cn } from '@/lib/utils';
import type { ClearingLine, NetPaymentInput, NetPaymentTotals } from '../../lib/sp-payment-math';
import { AmountInput } from '../amount-input';

/**
 * ขั้นตอนที่ 3 — ข้อมูลการส่งเงินสุทธิและค่าคอมฯ (Screen 6 in the reference system).
 *
 * Two stacked cards, in the reference order: the per-product
 * สรุปรายการเบิก/ขายวันนี้ table is the only place ค่าคอมมิชชั่น is broken down by
 * line, and ข้อมูลส่งเงินสุทธิพนักงาน below it turns that same มูลค่า into the
 * amount the rep has to hand over (rows 1–12). Each block gets its own titled
 * card — the same box treatment as ขั้นตอนที่ 4 และ 5 — so the step reads as two
 * distinct things rather than one long scroll.
 */

export interface StepSalesCommissionProps {
  lines: ClearingLine[];
  input: NetPaymentInput;
  totals: NetPaymentTotals;
  onChange: (input: NetPaymentInput) => void;
}

/** One row of ข้อมูลส่งเงินสุทธิพนักงาน: a label, then a figure or an input. */
interface NetPaymentRow {
  no?: number;
  label: string;
  /** Rendered instead of `amount` when the row is user-entered. */
  field?: keyof NetPaymentInput;
  amount?: number;
  /** A subtotal the rows above add up to — carries the emphasis. */
  subtotal?: boolean;
  /** The single row the whole screen builds towards. */
  highlight?: boolean;
}

export function StepSalesCommission({ lines, input, totals, onChange }: StepSalesCommissionProps) {
  // Off by default, same as the withdrawal catalog — the thumbnails are an aid
  // for spotting a product, not part of the figures being cleared.
  const [showImages, setShowImages] = React.useState(false);

  const handleChange = (field: keyof NetPaymentInput, value: number) => {
    onChange({ ...input, [field]: value });
  };

  const lineTotals = React.useMemo(
    () =>
      lines.reduce(
        (acc, line) => ({
          withdrawn: acc.withdrawn + line.withdrawn,
          deposited: acc.deposited + line.deposited,
          returned: acc.returned + line.returned,
          sold: acc.sold + line.sold
        }),
        { withdrawn: 0, deposited: 0, returned: 0, sold: 0 }
      ),
    [lines]
  );

  const netPaymentRows: NetPaymentRow[] = [
    { label: 'มูลค่าสินค้าเบิก', amount: totals.withdrawnValue },
    { no: 1, label: 'มูลค่าสินค้าขายจริง', amount: totals.soldValue, subtotal: true },
    { no: 2, label: 'ลูกค้าประจำ', field: 'regularCredit' },
    { no: 3, label: 'ลูกค้าทั่วไป', field: 'generalCredit' },
    {
      no: 4,
      label: 'สรุปจำนวนเงินที่ได้รับจริง (1,2,3)',
      amount: totals.cashFromSales,
      subtotal: true
    },
    { no: 5, label: 'เก็บเงินลูกค้าประจำ', field: 'regularCollect' },
    { no: 6, label: 'เก็บเงินลูกค้าทั่วไป', field: 'generalCollect' },
    {
      no: 7,
      label: 'รวมยอดเงินที่ได้รับจริงสุทธิ (4,5,6)',
      amount: totals.netReceived,
      subtotal: true
    },
    { no: 8, label: 'ยอดหนี้คงค้างยกมา', amount: totals.carriedDebt },
    { no: 9, label: 'ส่วนลด (จากทางศูนย์นม)', amount: totals.centerDiscount },
    {
      no: 10,
      label: 'รวมยอดเงินที่ต้องส่งสุทธิ (7,8,9)',
      amount: totals.netDue,
      subtotal: true,
      highlight: true
    },
    { no: 11, label: 'ยอดเงินชำระจริง', field: 'paidAmount' },
    { no: 12, label: 'ยอดคงค้างยกไป (10,11)', amount: totals.carryForward, subtotal: true }
  ];

  return (
    <div className='min-w-0 space-y-4 pb-4'>
      {/* ─── สรุปรายการเบิก/ขายวันนี้ — read-only; ฝาก/คืน are entered in ขั้นตอนที่ 2 ─── */}
      <Card size='sm' className='min-w-0 border ring-0'>
        <CardHeader className='bg-muted/20 border-b pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
            <Icons.product className='size-4' />
            สรุปรายการเบิก/ขายวันนี้
          </CardTitle>

          <CardAction className='flex items-center gap-2'>
            <Switch
              id='sp-payment-show-images'
              checked={showImages}
              onCheckedChange={setShowImages}
            />
            <Label
              htmlFor='sp-payment-show-images'
              className='text-muted-foreground cursor-pointer text-xs font-normal whitespace-nowrap'
            >
              แสดงรูปภาพสินค้า
            </Label>
          </CardAction>
        </CardHeader>

        {lines.length === 0 ? (
          <CardContent className='min-w-0'>
            <Empty className='border-0'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Icons.inbox />
                </EmptyMedia>
                <EmptyTitle>ยังไม่มีรายการสินค้าให้สรุป</EmptyTitle>
                <EmptyDescription>
                  กลับไปที่ขั้นตอนที่ 1 แล้วเลือกใบเบิกสินค้าอย่างน้อย 1 ใบ จึงจะคำนวณมูลค่าและค่าคอมมิชชั่นได้
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : (
          <CardContent className='min-w-0 overflow-x-auto px-0 py-0'>
            {/* +80px (w-20) when the image column is spliced in. The edge cells
                get the card's own inset back, since the table runs full-bleed. */}
            <Table
              className={cn(
                '[&_tr>*:first-child]:pl-4 [&_tr>*:last-child]:pr-4',
                showImages ? 'min-w-[980px]' : 'min-w-[900px]'
              )}
            >
              <TableHeader className='bg-muted/50'>
                <TableRow>
                  {showImages && <TableHead className='w-20 text-center'>รูปภาพ</TableHead>}
                  <TableHead className='w-28'>รหัสสินค้า</TableHead>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead className='w-24 text-right'>จำนวนที่เบิก</TableHead>
                  <TableHead className='w-24 text-right'>จำนวนที่ฝาก</TableHead>
                  <TableHead className='w-20 text-right'>จำนวนที่คืน</TableHead>
                  <TableHead className='w-28 text-right'>จำนวนที่ขายได้จริง</TableHead>
                  <TableHead className='w-28 text-right'>มูลค่า</TableHead>
                  <TableHead className='w-28 text-right'>คอมมิชชั่น</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.product.id}>
                    {showImages && (
                      <TableCell>
                        <div className='bg-background mx-auto flex size-10 items-center justify-center overflow-hidden rounded-md border p-0.5'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={line.product.image}
                            alt={line.product.name}
                            className='size-full object-contain'
                          />
                        </div>
                      </TableCell>
                    )}
                    <TableCell className='text-muted-foreground font-mono text-sm'>
                      {line.product.code}
                    </TableCell>
                    <TableCell className='text-sm font-medium'>{line.product.name}</TableCell>
                    <TableCell className='text-right font-mono text-sm tabular-nums'>
                      {formatCount(line.withdrawn)}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-right font-mono text-sm tabular-nums'>
                      {formatCount(line.deposited)}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-right font-mono text-sm tabular-nums'>
                      {formatCount(line.returned)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm tabular-nums',
                        line.sold > 0 ? 'font-bold' : 'text-muted-foreground/50'
                      )}
                    >
                      {formatCount(line.sold)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm tabular-nums',
                        line.value > 0 ? 'font-semibold' : 'text-muted-foreground/50'
                      )}
                    >
                      {formatAmount(line.value)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm tabular-nums',
                        line.commission > 0 ? 'font-semibold' : 'text-muted-foreground/50'
                      )}
                    >
                      {formatAmount(line.commission)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={showImages ? 3 : 2} className='text-sm font-semibold'>
                    รวม {formatCount(lines.length)} รายการ
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm font-semibold tabular-nums'>
                    {formatCount(lineTotals.withdrawn)}
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm font-semibold tabular-nums'>
                    {formatCount(lineTotals.deposited)}
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm font-semibold tabular-nums'>
                    {formatCount(lineTotals.returned)}
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm font-bold tabular-nums'>
                    {formatCount(lineTotals.sold)}
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm font-bold tabular-nums'>
                    {formatAmount(totals.soldValue)}
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400'>
                    {formatAmount(totals.commission)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        )}
      </Card>

      {/* ─── ข้อมูลส่งเงินสุทธิพนักงาน — rows 1–12 ─── */}
      <Card size='sm' className='min-w-0 border ring-0'>
        <CardHeader className='bg-muted/20 border-b pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
            <Icons.coins className='size-4' />
            ข้อมูลส่งเงินสุทธิพนักงาน
          </CardTitle>
        </CardHeader>

        <CardContent className='min-w-0 overflow-x-auto px-0 py-0'>
          <Table className='min-w-[560px] [&_tr>*:first-child]:pl-4 [&_tr>*:last-child]:pr-4'>
            <TableBody>
              {netPaymentRows.map((row) => (
                <TableRow
                  key={row.label}
                  className={cn(
                    row.subtotal && 'bg-muted/40',
                    row.highlight && 'bg-amber-500/10 hover:bg-amber-500/15'
                  )}
                >
                  <TableCell
                    className={cn(
                      'py-2.5 text-sm',
                      row.subtotal ? 'font-semibold' : 'text-muted-foreground',
                      row.highlight && 'font-bold text-amber-900 dark:text-amber-200'
                    )}
                  >
                    <span className='text-muted-foreground mr-2 inline-block w-6 text-right font-mono text-xs'>
                      {row.no ?? ''}
                    </span>
                    {row.label}
                  </TableCell>

                  <TableCell className='w-48 py-1.5 text-right'>
                    {row.field ? (
                      <AmountInput
                        value={input[row.field]}
                        onChange={(v) => handleChange(row.field!, v)}
                        placeholder='0.00'
                        className='ml-auto w-40 text-right font-mono'
                      />
                    ) : (
                      <span
                        className={cn(
                          'font-mono text-sm tabular-nums',
                          row.subtotal
                            ? 'font-bold text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground',
                          row.highlight && 'text-base text-amber-700 dark:text-amber-300'
                        )}
                      >
                        {formatAmount(row.amount ?? 0)}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className='text-muted-foreground w-14 py-2.5 text-sm'>บาท</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

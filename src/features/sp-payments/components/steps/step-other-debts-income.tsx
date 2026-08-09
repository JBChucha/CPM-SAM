'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { OtherEntry, OtherTotals } from '../../lib/sp-payment-math';

/**
 * ขั้นตอนที่ 4 — หนี้/รายได้อื่นๆ (Screen 7 in the reference system).
 *
 * Three cards, each its own block the way ขั้นตอนที่ 5 lays its สรุป out: the two
 * ledgers — ข้อมูลหนี้อื่นๆ and ข้อมูลรายได้เพิ่มเติมพนักงาน — stack in the wide
 * left column, and สรุปหนี้/รายได้อื่นๆ stands beside them in the narrow right
 * column, folding both into the six numbered rows that ขั้นตอนที่ 5 reprints —
 * so the two screens have to agree row for row.
 *
 * The screen is read-only, like its reference: nothing here is typed in. The
 * ledgers and จำนวนเงินที่ส่งจริง come in with the round (see
 * `getOtherDebtEntries` / `getOtherIncomeEntries` / `getOtherSentAmount`), and
 * this step only shows what they add up to.
 */

export interface StepOtherDebtsIncomeProps {
  debts: OtherEntry[];
  incomes: OtherEntry[];
  totals: OtherTotals;
}

// ─────────────────────────────────────────────────────────────────────────────
// One ledger — ข้อมูลหนี้อื่นๆ or ข้อมูลรายได้เพิ่มเติมพนักงาน
// ─────────────────────────────────────────────────────────────────────────────

interface OtherEntryCardProps {
  title: string;
  icon: React.ReactNode;
  /** Header of the description column, e.g. "รายการหนี้". */
  itemHeader: string;
  emptyLabel: string;
  /** Extra income is money owed back to the rep, so it reads in the positive. */
  positive?: boolean;
  entries: OtherEntry[];
  total: number;
}

function OtherEntryCard({
  title,
  icon,
  itemHeader,
  emptyLabel,
  positive,
  entries,
  total
}: OtherEntryCardProps) {
  const amountTone = positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground';

  return (
    <Card size='sm' className='flex h-full min-w-0 flex-col border ring-0'>
      <CardHeader className='bg-muted/20 border-b pb-3'>
        <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className='min-w-0 flex-1 overflow-x-auto px-0 py-0'>
        <Table className='min-w-[400px]'>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              <TableHead className='w-20 pl-4 text-center'>ลำดับที่</TableHead>
              <TableHead>{itemHeader}</TableHead>
              <TableHead className='w-40 pr-4 text-right'>จำนวนเงิน (บาท)</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {entries.length === 0 ? (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={3} className='text-muted-foreground py-8 text-center text-sm'>
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell className='text-muted-foreground pl-4 text-center font-mono text-sm tabular-nums'>
                    {index + 1}
                  </TableCell>
                  <TableCell className='text-sm font-medium'>{entry.label}</TableCell>
                  <TableCell
                    className={cn(
                      'pr-4 text-right font-mono text-sm font-semibold tabular-nums',
                      amountTone
                    )}
                  >
                    {formatAmount(entry.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className='pl-4 text-sm font-semibold'>
                รวม {formatCount(entries.length)} รายการ
              </TableCell>
              <TableCell
                className={cn(
                  'pr-4 text-right font-mono text-sm font-bold tabular-nums',
                  amountTone
                )}
              >
                {formatAmount(total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// สรุปหนี้/รายได้อื่นๆ — rows 1–6
// ─────────────────────────────────────────────────────────────────────────────

/** One row of the summary block. */
interface OtherSummaryRow {
  no: number;
  label: string;
  amount: number;
  /** A total the rows above add up to — carries the emphasis. */
  subtotal?: boolean;
  /** The row the whole screen builds towards. */
  highlight?: boolean;
  tone?: 'positive' | 'negative';
}

export function StepOtherDebtsIncome({ debts, incomes, totals }: StepOtherDebtsIncomeProps) {
  const summaryRows: OtherSummaryRow[] = [
    { no: 1, label: 'หนี้ยกมา', amount: totals.carriedDebt },
    { no: 2, label: 'หนี้อื่นๆ', amount: totals.otherDebt },
    {
      no: 3,
      label: 'รายได้',
      amount: totals.income,
      tone: totals.income > 0 ? 'positive' : undefined
    },
    {
      no: 4,
      label: 'จำนวนเงินที่ต้องชำระ (1,2,3)',
      amount: totals.payable,
      subtotal: true,
      highlight: true
    },
    { no: 5, label: 'จำนวนเงินที่ส่งจริง', amount: totals.sent },
    {
      no: 6,
      label: 'หนี้ยกไป (4,5)',
      amount: totals.carryForward,
      subtotal: true,
      tone: totals.carryForward > 0 ? 'negative' : undefined
    }
  ];

  return (
    /* สองกล่องซ้ายกินความกว้าง 2 ใน 3 ส่วน กล่องสรุปอยู่คอลัมน์ขวาเต็มความสูง
       พอจอแคบกว่า lg ทั้งสามกล่องจะเรียงต่อกันตามลำดับเดิม */
    <div className='grid min-w-0 grid-cols-1 gap-4 pb-4 lg:grid-cols-3'>
      <div className='flex min-w-0 flex-col gap-4 lg:col-span-2'>
        <OtherEntryCard
          title='ข้อมูลหนี้อื่นๆ'
          icon={<Icons.trendingDown className='size-4' />}
          itemHeader='รายการหนี้'
          emptyLabel='ไม่มีรายการหนี้อื่นๆ ในรอบนี้'
          entries={debts}
          total={totals.otherDebt}
        />

        <OtherEntryCard
          title='ข้อมูลรายได้เพิ่มเติมพนักงาน'
          icon={<Icons.trendingUp className='size-4' />}
          itemHeader='รายการรายได้'
          emptyLabel='ไม่มีรายการรายได้เพิ่มเติมในรอบนี้'
          positive
          entries={incomes}
          total={totals.income}
        />
      </div>

      {/* ─── สรุปหนี้/รายได้อื่นๆ — the six rows ขั้นตอนที่ 5 reprints ─── */}
      <Card size='sm' className='flex h-full min-w-0 flex-col border ring-0'>
        <CardHeader className='bg-muted/20 border-b pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
            <Icons.creditCard className='size-4' />
            สรุปหนี้/รายได้อื่นๆ
          </CardTitle>
        </CardHeader>

        <CardContent className='min-w-0 flex-1 overflow-x-auto px-0 py-0'>
          <Table className='min-w-[280px]'>
            <TableBody>
              {summaryRows.map((row) => (
                <TableRow
                  key={row.no}
                  className={cn(
                    row.subtotal && 'bg-muted/40',
                    row.highlight && 'bg-amber-500/10 hover:bg-amber-500/15'
                  )}
                >
                  <TableCell
                    className={cn(
                      'py-2.5 pl-4 text-sm',
                      row.subtotal ? 'font-semibold' : 'text-muted-foreground',
                      row.highlight && 'font-bold text-amber-900 dark:text-amber-200'
                    )}
                  >
                    <span className='text-muted-foreground mr-2 inline-block w-6 text-right font-mono text-xs'>
                      {row.no}
                    </span>
                    {row.label}
                  </TableCell>

                  <TableCell className='py-2.5 text-right'>
                    <span
                      className={cn(
                        'font-mono text-sm tabular-nums',
                        row.subtotal ? 'font-bold' : 'text-muted-foreground',
                        row.tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
                        row.tone === 'negative' && 'text-destructive font-semibold',
                        row.highlight && 'text-base text-amber-700 dark:text-amber-300'
                      )}
                    >
                      {formatAmount(row.amount)}
                    </span>
                  </TableCell>

                  <TableCell className='text-muted-foreground w-10 py-2.5 pr-4 text-sm'>
                    บาท
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

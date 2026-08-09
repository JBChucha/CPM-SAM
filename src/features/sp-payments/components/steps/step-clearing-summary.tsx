'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { formatAmount } from '@/lib/format-date-be';
import { cn } from '@/lib/utils';
import type { NetPaymentInput, NetPaymentTotals, OtherTotals } from '../../lib/sp-payment-math';

export interface StepClearingSummaryProps {
  netInput: NetPaymentInput;
  netTotals: NetPaymentTotals;
  otherTotals: OtherTotals;
}

/**
 * One numbered line of the reference system's สรุป blocks: an index, a label and
 * a right-aligned baht figure. `subtotal` marks the rows the reference prints in
 * bold above a rule — ข้อ 4, 7, 10, 12 on the net-payment side.
 */
interface SummaryRowProps {
  index: number;
  label: string;
  value: number;
  subtotal?: boolean;
  /** Emphasis for a figure that is money still owed rather than money settled. */
  tone?: 'default' | 'positive' | 'negative';
  /** Extra space above, matching the grouping of the reference capture. */
  gap?: boolean;
}

function SummaryRow({ index, label, value, subtotal, tone = 'default', gap }: SummaryRowProps) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 py-1.5',
        gap && 'border-border/80 mt-2 border-t pt-3',
        subtotal && 'font-semibold'
      )}
    >
      <span
        className={cn('min-w-0 text-sm', subtotal ? 'text-foreground' : 'text-muted-foreground')}
      >
        <span className='font-mono tabular-nums'>{index}.</span> {label}
      </span>
      <span
        className={cn(
          'shrink-0 font-mono text-sm tabular-nums',
          tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'negative' && 'text-destructive font-semibold',
          tone === 'default' && (subtotal ? 'text-foreground' : 'text-muted-foreground')
        )}
      >
        {formatAmount(value)}
      </span>
    </div>
  );
}

export function StepClearingSummary({
  netInput,
  netTotals,
  otherTotals
}: StepClearingSummaryProps) {
  return (
    <div className='min-w-0 space-y-4 pb-4'>
      {/* ─── The reference สรุป blocks (ข้อ 1–12 / ข้อ 1–6 / ค่าคอมมิชชั่น) ───
          ข้อ 1–12 takes one half on its own, the other two stack in the second
          half — the two columns share the width 1:1. */}
      <div className='grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2'>
        <Card size='sm' className='min-w-0 border ring-0'>
          <CardHeader className='bg-muted/20 border-b pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
              <Icons.coins className='size-4' />
              สรุปข้อมูลการส่งเงินสุทธิพนักงาน
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pt-3 pb-4'>
            <SummaryRow index={1} label='มูลค่าสินค้าขายจริง' value={netTotals.soldValue} />
            <SummaryRow index={2} label='ลูกค้าประจำ' value={netInput.regularCredit} />
            <SummaryRow index={3} label='ลูกค้าทั่วไป' value={netInput.generalCredit} />
            <SummaryRow
              index={4}
              label='สรุปจำนวนเงินที่ได้รับจริง (1,2,3)'
              value={netTotals.cashFromSales}
              subtotal
            />

            <SummaryRow index={5} label='เก็บเงินลูกค้าประจำ' value={netInput.regularCollect} gap />
            <SummaryRow index={6} label='เก็บเงินลูกค้าทั่วไป' value={netInput.generalCollect} />
            <SummaryRow
              index={7}
              label='รวมยอดเงินที่ได้รับจริงสุทธิ (4,5,6)'
              value={netTotals.netReceived}
              subtotal
            />

            <SummaryRow index={8} label='ยอดหนี้คงค้างยกมา' value={netTotals.carriedDebt} gap />
            <SummaryRow
              index={9}
              label='ส่วนลด (จากทางศูนย์นม)'
              value={netTotals.centerDiscount}
              tone={netTotals.centerDiscount > 0 ? 'positive' : 'default'}
            />
            <SummaryRow
              index={10}
              label='รวมยอดเงินที่ต้องส่งสุทธิ (7,8,9)'
              value={netTotals.netDue}
              subtotal
            />

            <SummaryRow index={11} label='ยอดเงินชำระจริง' value={netTotals.paidAmount} gap />
            <SummaryRow
              index={12}
              label='ยอดคงค้างยกไป (10,11)'
              value={netTotals.carryForward}
              subtotal
              tone={netTotals.carryForward > 0 ? 'negative' : 'default'}
            />
          </CardContent>
        </Card>

        <div className='min-w-0 space-y-4'>
          <Card size='sm' className='min-w-0 border ring-0'>
            <CardHeader className='bg-muted/20 border-b pb-3'>
              <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                <Icons.creditCard className='size-4' />
                สรุปข้อมูลหนี้/รายได้อื่นๆ
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pt-3 pb-4'>
              <SummaryRow index={1} label='หนี้ยกมา' value={otherTotals.carriedDebt} />
              <SummaryRow index={2} label='หนี้อื่นๆ' value={otherTotals.otherDebt} />
              <SummaryRow
                index={3}
                label='รายได้'
                value={otherTotals.income}
                tone={otherTotals.income > 0 ? 'positive' : 'default'}
              />
              <SummaryRow
                index={4}
                label='จำนวนเงินที่ต้องชำระ (1,2,3)'
                value={otherTotals.payable}
                subtotal
              />

              <SummaryRow index={5} label='จำนวนเงินที่ส่งจริง' value={otherTotals.sent} gap />
              <SummaryRow
                index={6}
                label='หนี้ยกไป (4,5)'
                value={otherTotals.carryForward}
                subtotal
                tone={otherTotals.carryForward > 0 ? 'negative' : 'default'}
              />
            </CardContent>
          </Card>

          <Card size='sm' className='min-w-0 border ring-0'>
            <CardHeader className='bg-muted/20 border-b pb-3'>
              <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                <Icons.trendingUp className='size-4' />
                สรุปค่าคอมมิชชั่นพนักงาน
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pt-3 pb-4'>
              <div className='flex items-baseline justify-between gap-3 py-1.5'>
                <span className='text-muted-foreground min-w-0 text-sm'>ค่าคอมมิชชั่นที่ได้</span>
                <span className='shrink-0 font-mono text-sm tabular-nums text-emerald-600 dark:text-emerald-400'>
                  {formatAmount(netTotals.commission)}
                </span>
              </div>
              <div className='flex items-baseline justify-between gap-3 py-1.5'>
                <span className='text-muted-foreground min-w-0 text-sm'>คอมมิชชั่นสะสมยกมา</span>
                <span className='text-muted-foreground shrink-0 font-mono text-sm tabular-nums'>
                  {formatAmount(netTotals.accumulatedCommissionBefore)}
                </span>
              </div>
              <div className='border-border/80 mt-2 flex items-baseline justify-between gap-3 border-t pt-3 font-semibold'>
                <span className='min-w-0 text-sm'>คอมมิชชั่นสะสมสุทธิ</span>
                <span className='shrink-0 font-mono text-sm tabular-nums'>
                  {formatAmount(netTotals.accumulatedCommission)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

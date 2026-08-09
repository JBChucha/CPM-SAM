'use client';

import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { SummaryList } from '@/components/sam/summary-list';
import { formatAmount, formatDateBE } from '@/lib/format-date-be';
import type { SpPaymentRecord } from '../api/types';
import { fromISODate } from '../lib/iso-date';

/**
 * Read-only view behind the magnifier on each row of the clearing list.
 *
 * The legacy screen opens a full page for this; a dialog keeps the list —
 * including the filters and the page the user is on — behind it, since there is
 * nothing to edit here.
 */
export interface SpPaymentDetailDialogProps {
  /** `null` closes the dialog; the record is what it shows. */
  record: SpPaymentRecord | null;
  onOpenChange: (open: boolean) => void;
}

export function SpPaymentDetailDialog({ record, onOpenChange }: SpPaymentDetailDialogProps) {
  if (!record) return null;

  const outstanding = record.netDue - record.netSent;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>รายละเอียดใบเคลียร์เงิน</DialogTitle>
          <DialogDescription>
            เลขที่ใบเคลียร์เงิน <span className='font-mono'>{record.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='text-muted-foreground text-xs'>ชื่อ SP</p>
              <p className='mt-0.5 text-sm font-medium'>{record.staffName}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>วันที่ทำรายการ</p>
              <p className='mt-0.5 font-mono text-sm font-medium tabular-nums'>
                {formatDateBE(fromISODate(record.transactionDate))}
              </p>
            </div>
            <div className='col-span-2'>
              <p className='text-muted-foreground text-xs'>ชื่อผู้ทำรายการ</p>
              <p className='mt-0.5 text-sm font-medium'>{record.createdBy}</p>
            </div>
          </div>

          <SummaryList
            groups={[
              [
                { label: 'ยอดสุทธิที่ต้องส่ง', value: record.netDue },
                { label: 'ยอดส่งจริง', value: record.netSent, tone: 'positive' },
                {
                  label: 'ยอดคงค้างยกไป',
                  value: outstanding,
                  tone: outstanding > 0 ? 'negative' : 'muted',
                  emphasis: true
                }
              ],
              [{ label: 'ค่าคอมมิชชั่น SP', value: record.commission }]
            ]}
          />

          <div>
            {outstanding > 0 ? (
              <Badge
                variant='outline'
                className='border-red-300 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
              >
                ค้างส่ง {formatAmount(outstanding)} บาท
              </Badge>
            ) : (
              <Badge
                variant='outline'
                className='border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
              >
                เคลียร์ครบแล้ว
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => toast.success(`ดาวน์โหลดเอกสารใบเคลียร์เงิน ${record.id} แล้ว`)}
          >
            <Icons.download />
            ดาวน์โหลดเอกสาร
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

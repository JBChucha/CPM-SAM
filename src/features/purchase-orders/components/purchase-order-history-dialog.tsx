'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

interface HistoryEntry {
  date: string;
  actor: string;
  action: string;
  detail: string;
}

const MOCK_HISTORY: HistoryEntry[] = [
  {
    date: '31/07/2569 (18:52)',
    actor: 'วรากรณ์ ด้วงมี',
    action: 'สร้างใบสั่งซื้อ',
    detail: 'สร้างใบสั่งซื้อเลขที่ 9999999999PO260703 จำนวน 3 รายการ'
  },
  {
    date: '31/07/2569 (18:47)',
    actor: 'วรากรณ์ ด้วงมี',
    action: 'แก้ไขจำนวนสินค้า',
    detail: 'ปรับจำนวน PM 2000 จืด จาก 8 เป็น 11 ชิ้น'
  },
  {
    date: '31/07/2569 (18:30)',
    actor: 'วรากรณ์ ด้วงมี',
    action: 'เริ่มร่างใบสั่งซื้อ',
    detail: 'สร้างร่างใบสั่งซื้อจากรอบสั่งซื้อ 01/08/2569'
  }
];

export function PurchaseOrderHistoryDialog({ poNumber }: { poNumber: string }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button type='button' variant='outline' />}>
        <Icons.history />
        ประวัติการแก้ไขใบสั่งซื้อ
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>ประวัติการแก้ไขใบสั่งซื้อ</DialogTitle>
          <DialogDescription>
            เลขที่ใบสั่งซื้อ <span className='font-mono'>{poNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[60vh] space-y-3 overflow-y-auto py-1'>
          {MOCK_HISTORY.map((entry, index) => (
            <div
              key={`${entry.date}-${entry.action}`}
              className='flex gap-3 rounded-lg border bg-muted/20 p-3'
            >
              <div className='flex flex-col items-center pt-0.5'>
                <span
                  className={
                    index === 0
                      ? 'size-2 shrink-0 rounded-full bg-brand'
                      : 'size-2 shrink-0 rounded-full bg-muted-foreground/40'
                  }
                />
                {index < MOCK_HISTORY.length - 1 && <span className='mt-1 w-px flex-1 bg-border' />}
              </div>
              <div className='min-w-0 flex-1 space-y-1 pb-1'>
                <div className='flex flex-wrap items-center justify-between gap-x-2 gap-y-1'>
                  <Badge variant='outline' className='font-medium'>
                    {entry.action}
                  </Badge>
                  <span className='font-mono text-xs text-muted-foreground'>{entry.date}</span>
                </div>
                <p className='text-sm text-foreground'>{entry.detail}</p>
                <p className='text-xs text-muted-foreground'>โดย {entry.actor}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

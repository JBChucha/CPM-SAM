'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import PurchaseOrderInfoGrid from './purchase-order-info-grid';
import { PurchaseOrderHistoryDialog } from './purchase-order-history-dialog';

const svgMilk = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
  <rect x="30" y="35" width="40" height="55" rx="5" fill="${color}" stroke="#333" stroke-width="2"/>
  <path d="M30 35 L40 15 L60 15 L70 35 Z" fill="#fff" stroke="#333" stroke-width="2"/>
  <rect x="45" y="10" width="10" height="5" fill="#333"/>
  <circle cx="50" cy="60" r="12" fill="#fff" opacity="0.8"/>
  <path d="M45 55 Q50 48 55 55 Q50 68 45 55 Z" fill="#2563eb"/>
  <text x="50" y="80" font-family="sans-serif" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">MEIJI</text>
</svg>
`)}`;

interface OrderLineItem {
  code: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  vat: number;
  /** VAT-inclusive line amount, as returned by the order API. */
  total: number;
  image: string;
}

// Mirrors the reference dashboard's order-detail screen — fixed demo data,
// same shape a real detail-by-id fetch would return.
const ORDER = {
  cvCode: '9999999999',
  poNumber: '9999999999PO260703',
  poSource: 'system' as 'system' | 'learner',
  customerName: 'เอเยนต์ใหม่เริ่มสิบหลัก',
  customerFileName: null as string | null,
  transactionDate: '31/07/2569 (18:52)',
  orderRound: '01/08/2569',
  cpReceivedDate: null as string | null,
  deliveryDate: '03/08/2569',
  status: 'รอ CP รับข้อมูล',
  items: [
    {
      code: '72000726',
      name: 'PM 200 จืด',
      qty: 1,
      unit: 'ขวด',
      price: 9.34,
      vat: 0,
      total: 9.34,
      image: svgMilk('#f3f4f6')
    },
    {
      code: '72000873',
      name: 'PM 200 ช็อกโกแลต',
      qty: 3,
      unit: 'ขวด',
      price: 8.65,
      vat: 7,
      total: 27.76,
      image: svgMilk('#78350f')
    },
    {
      code: '72000854',
      name: 'PM 2000 จืด',
      qty: 11,
      unit: 'ขวด',
      price: 83.75,
      vat: 0,
      total: 921.25,
      image: svgMilk('#93c5fd')
    }
  ] satisfies OrderLineItem[]
};

const formatBaht = (value: number) =>
  value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface PurchaseOrderDetailPageProps {
  orderId: string;
}

export default function PurchaseOrderDetailPage({ orderId }: PurchaseOrderDetailPageProps) {
  const router = useRouter();
  const [showImages, setShowImages] = useState(false);
  const poNumber = ORDER.poNumber || orderId;

  const totals = ORDER.items.reduce(
    (acc, item) => {
      const lineSubtotal = item.price * item.qty;
      acc.subtotal += lineSubtotal;
      acc.vatAmount += item.total - lineSubtotal;
      acc.grandTotal += item.total;
      return acc;
    },
    { subtotal: 0, vatAmount: 0, grandTotal: 0 }
  );

  return (
    <PageContainer pageTitle='รายการสั่งซื้อสินค้า'>
      <div className='min-w-0 space-y-4 pb-4'>
        {/* ─── Call to action — the order is not placed until it is confirmed ─── */}
        <Alert variant='destructive'>
          <Icons.warning />
          <AlertTitle className='text-base font-semibold'>
            กรุณาตรวจสอบรายการสินค้าและกดยืนยันเพื่อสั่งซื้อ
          </AlertTitle>
          <AlertDescription>
            {/* บรรทัดในซอร์สตัดตรงช่องว่างของประโยคเท่านั้น — JSX แปลง newline เป็นช่องว่าง */}
            คำสั่งซื้อนี้จะยังไม่ถูกส่งให้ CP จนกว่าท่านจะกดยืนยัน และเมื่อยืนยันแล้วจะไม่สามารถแก้ไขรายการได้
            กรุณาตรวจสอบรหัสสินค้า จำนวน และราคาให้ถูกต้องครบถ้วนก่อนดำเนินการ
          </AlertDescription>
        </Alert>

        {/* ─── Order details + attachment — same two-card top section as the
             create-order page, rendered read-only ─── */}
        <div className='grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-4'>
          {/* pb-0: the grid's dividers have to reach the card's bottom edge,
              so the bottom gutter lives on the grid's last row instead. */}
          <Card size='sm' className='min-w-0 pb-0 lg:col-span-3'>
            <CardHeader className='border-b bg-muted/20 pb-3'>
              <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                <Icons.page className='size-4' />
                รายละเอียดข้อมูลคำสั่งซื้อ
              </CardTitle>
            </CardHeader>
            {/* Cell grid — dividers run edge to edge, so the content padding
                lives on the cells rather than on CardContent. */}
            <CardContent className='px-0'>
              <PurchaseOrderInfoGrid
                poNumber={poNumber}
                poSource={ORDER.poSource}
                cvCode={ORDER.cvCode}
                customerName={ORDER.customerName}
                transactionDate={ORDER.transactionDate}
                orderRound={ORDER.orderRound}
                deliveryDate={ORDER.deliveryDate}
                cpReceivedDate={ORDER.cpReceivedDate}
                status={ORDER.status}
              />
            </CardContent>
          </Card>

          <Card size='sm' className='min-w-0 lg:col-span-1'>
            <CardHeader className='border-b bg-muted/20 pb-3'>
              <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                <Icons.paperclip className='size-4' />
                แนบไฟล์ใบสั่งซื้อสินค้า
              </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-1 pt-5'>
              <div className='flex min-h-[132px] w-full flex-1 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-input bg-muted/40 p-3 text-center'>
                <Icons.paperclip className='size-5 text-muted-foreground' />
                {ORDER.customerFileName ? (
                  <span className='w-full truncate px-2 font-mono text-xs text-foreground'>
                    {ORDER.customerFileName}
                  </span>
                ) : (
                  <span className='text-xs text-muted-foreground'>ยังไม่ได้แนบไฟล์</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Order items — read-only summary table ─── */}
        <Card className='min-w-0'>
          <CardHeader className='border-b bg-muted/20 pb-3'>
            <CardTitle className='flex flex-wrap items-center justify-between gap-2 text-sm font-semibold'>
              <span className='flex items-center gap-2'>
                <Icons.cart className='size-4' />
                สรุปรายการสินค้าที่สั่งซื้อ
              </span>
              <span className='flex items-center gap-2'>
                <Switch id='po-show-images' checked={showImages} onCheckedChange={setShowImages} />
                <Label
                  htmlFor='po-show-images'
                  className='cursor-pointer text-xs font-normal whitespace-nowrap text-muted-foreground'
                >
                  แสดงรูปภาพสินค้า
                </Label>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='min-w-0 space-y-4'>
            <div className='min-w-0 overflow-hidden rounded-lg border'>
              <Table>
                <TableHeader className='bg-muted dark:bg-background'>
                  <TableRow>
                    <TableHead className='w-14 text-center'>ลำดับ</TableHead>
                    {showImages && <TableHead className='w-20 text-center'>รูปภาพ</TableHead>}
                    <TableHead className='w-28'>รหัสสินค้า</TableHead>
                    <TableHead className='min-w-[200px]'>ชื่อสินค้า</TableHead>
                    <TableHead className='w-24 text-right'>จำนวนที่สั่ง</TableHead>
                    <TableHead className='w-28 text-right'>ราคาต่อหน่วย</TableHead>
                    <TableHead className='w-20 text-right'>Vat (%)</TableHead>
                    <TableHead className='w-28 text-right'>มูลค่าสินค้า</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ORDER.items.map((item, index) => (
                    <TableRow key={item.code}>
                      <TableCell className='text-center text-sm text-muted-foreground'>
                        {index + 1}
                      </TableCell>
                      {showImages && (
                        <TableCell>
                          <div className='bg-background mx-auto flex size-10 items-center justify-center overflow-hidden rounded-md border p-0.5'>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt={item.name}
                              className='size-full object-contain'
                            />
                          </div>
                        </TableCell>
                      )}
                      <TableCell className='font-mono text-sm text-muted-foreground'>
                        {item.code}
                      </TableCell>
                      <TableCell className='text-sm font-semibold text-foreground'>
                        {item.name}
                      </TableCell>
                      <TableCell className='text-right font-mono text-sm tabular-nums'>
                        {item.qty}
                      </TableCell>
                      <TableCell className='text-right font-mono text-sm tabular-nums'>
                        {item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right font-mono text-sm tabular-nums text-muted-foreground'>
                        {item.vat}
                      </TableCell>
                      <TableCell className='text-right font-mono text-sm font-bold tabular-nums text-foreground'>
                        {item.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals — same shaded breakdown pattern as the create-order summary card */}
            <div className='flex justify-end'>
              <div className='w-full space-y-3 rounded-lg bg-muted/40 p-4 text-sm sm:w-80'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-muted-foreground'>ราคารวมสั่งซื้อทั้งหมด</span>
                  <span className='font-mono'>{formatBaht(totals.subtotal)}</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-muted-foreground'>VAT</span>
                  <span className='font-mono'>{formatBaht(totals.vatAmount)}</span>
                </div>
                <div className='flex items-center justify-between gap-2 border-t border-border/80 pt-2'>
                  <span className='font-semibold'>ราคารวมทั้งสิ้น</span>
                  <span className='font-mono text-xl font-bold'>
                    {formatBaht(totals.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions — a full-width row of their own, so neither button has to
                squeeze into the totals box */}
            <div className='flex flex-col-reverse items-stretch justify-between gap-2 sm:flex-row sm:items-center'>
              <PurchaseOrderHistoryDialog poNumber={poNumber} />
              {/* Neutral rather than the brand red — this is a navigation
                  escape hatch, not the page's primary action. */}
              <Button
                type='button'
                onClick={() => router.back()}
                className='bg-foreground text-background hover:bg-foreground/90'
              >
                <Icons.chevronLeft />
                ย้อนกลับ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

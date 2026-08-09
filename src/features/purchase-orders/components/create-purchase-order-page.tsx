'use client';

import * as React from 'react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import PurchaseOrderInfoGrid from './purchase-order-info-grid';
import PurchaseOrderAttachment from './purchase-order-attachment';
import PurchaseOrderTable from './purchase-order-table';
import { DatePickerField } from './date-picker-field';
import { MOCK_PRODUCTS } from '../api/mock-products';
import {
  addDays,
  formatDateBE,
  formatDateTimeBE,
  generateSystemPoNumber
} from '../lib/format-date-be';

const TABS = ['นมพาสเจอร์ไรส์', 'นมเปรี้ยว', 'นมเปรี้ยวโพรไบโอ', 'โยเกิร์ตเมจิ'];

const formatBaht = (value: number) =>
  `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CreatePurchaseOrderPage() {
  // ─── Order form state ───
  const [cvCode] = React.useState('9999999999');
  const [customerName] = React.useState('เอเยนต์ใหม่เริ่มสิบหลัก');
  // System-set timestamps — no setter, since the form now shows them as
  // read-only preview text rather than editable date pickers.
  const [transactionDate] = React.useState<Date | undefined>(() => new Date());
  const [orderRound] = React.useState<Date | undefined>(() => addDays(new Date(), 1));
  const [poSource, setPoSource] = React.useState<'system' | 'learner'>('system');
  const [poNumber, setPoNumber] = React.useState('');
  const [cpReceivedDate] = React.useState<Date | undefined>(undefined);
  const [status] = React.useState('รอ CP รับข้อมูล');
  const [deliveryDate, setDeliveryDate] = React.useState<Date | undefined>(() =>
    addDays(new Date(), 3)
  );
  const [showImages, setShowImages] = React.useState(false);
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null);

  // ─── Interaction state ───
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ─── Product catalog state ───
  const [activeTab, setActiveTab] = React.useState(TABS[0]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [quantities, setQuantities] = React.useState<Record<number, number>>(() =>
    Object.fromEntries(MOCK_PRODUCTS.map((p) => [p.id, p.recommended]))
  );

  // Keep the system-generated PO number in sync with its inputs.
  React.useEffect(() => {
    if (poSource === 'system') {
      setPoNumber(generateSystemPoNumber(cvCode));
    }
  }, [poSource, cvCode]);

  const handleQuantityChange = (productId: number, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const handleApplyRecommended = () => {
    setQuantities(Object.fromEntries(MOCK_PRODUCTS.map((p) => [p.id, p.recommended])));
    const count = MOCK_PRODUCTS.filter((p) => p.recommended > 0).length;
    toast.success(`กรอกจำนวนแนะนำสำหรับสินค้าจำนวน ${count} รายการแล้ว`);
  };

  const handleClearAll = () => {
    setQuantities(Object.fromEntries(MOCK_PRODUCTS.map((p) => [p.id, 0])));
    toast.success('ล้างตะกร้าสินค้าทั้งหมดเรียบร้อยแล้ว');
  };

  // ─── Totals (VAT categories kept separate for audit clarity) ───
  const totals = React.useMemo(() => {
    let uniqueItemsCount = 0;
    let totalQty = 0;
    let subtotalVat0 = 0;
    let subtotalVat7 = 0;

    // Units and value per catalog tab, for the summary's top section. Values are
    // before VAT, so the four rows add up to subtotalBeforeVat and the box reads
    // as one chain: what was bought → tax on it → grand total. Every tab is
    // seeded so the section keeps a fixed height as quantities come and go.
    const byCategory = Object.fromEntries(TABS.map((tab) => [tab, { qty: 0, value: 0 }])) as Record<
      string,
      { qty: number; value: number }
    >;

    MOCK_PRODUCTS.forEach((p) => {
      const qty = quantities[p.id] ?? 0;
      if (qty <= 0) return;

      uniqueItemsCount += 1;
      totalQty += qty;
      const lineTotal = p.price * qty;
      if (p.vat === 0) subtotalVat0 += lineTotal;
      else if (p.vat === 7) subtotalVat7 += lineTotal;

      const bucket = byCategory[p.category];
      if (bucket) {
        bucket.qty += qty;
        bucket.value += lineTotal;
      }
    });

    const subtotalBeforeVat = subtotalVat0 + subtotalVat7;
    const vatAmount7 = subtotalVat7 * 0.07;

    return {
      uniqueItemsCount,
      totalQty,
      byCategory,
      subtotalVat0,
      subtotalVat7,
      subtotalBeforeVat,
      vatAmount7,
      grandTotal: subtotalBeforeVat + vatAmount7
    };
  }, [quantities]);

  // Tab badges mirror the reference dashboard: how many items in each category
  // are already in the order.
  const orderedCountByCategory = React.useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(TABS.map((t) => [t, 0]));
    MOCK_PRODUCTS.forEach((p) => {
      if ((quantities[p.id] ?? 0) > 0) counts[p.category] = (counts[p.category] ?? 0) + 1;
    });
    return counts;
  }, [quantities]);

  const buildOrderPayload = () => ({
    poNumber,
    poSource,
    cvCode,
    customerName,
    transactionDate,
    orderRound,
    deliveryDate,
    attachedFile: attachedFile?.name ?? null,
    summary: totals,
    items: MOCK_PRODUCTS.filter((p) => (quantities[p.id] ?? 0) > 0).map((p) => ({
      code: p.code,
      name: p.name,
      qty: quantities[p.id],
      unit: p.unit,
      price: p.price,
      total: p.price * (quantities[p.id] ?? 0)
    }))
  });

  const handleSubmitOrder = () => {
    if (totals.totalQty === 0) {
      toast.error('กรุณาเลือกจำนวนสินค้าที่ต้องการสั่งซื้ออย่างน้อย 1 รายการ');
      return;
    }
    if (!deliveryDate) {
      toast.error('กรุณาระบุวันที่ต้องการรับสินค้า');
      return;
    }
    if (poSource === 'learner' && !poNumber.trim()) {
      toast.error('กรุณากรอกเลขที่ใบสั่งซื้อ');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // eslint-disable-next-line no-console
      console.log('Submitted Purchase Order:', buildOrderPayload());
      toast.success('ยืนยันการสั่งซื้อเสร็จสมบูรณ์!', {
        description: `เลขที่ ${poNumber} · ยอดรวมสุทธิ ${formatBaht(totals.grandTotal)}`
      });
    }, 1200);
  };

  return (
    <PageContainer pageTitle='สั่งซื้อสินค้า'>
      <div className='min-w-0 space-y-4 pb-4'>
        {/* ─── Top section: order details + attachment as two separate cards ─── */}
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
                onPoNumberChange={setPoNumber}
                poSource={poSource}
                onPoSourceChange={setPoSource}
                cvCode={cvCode}
                customerName={customerName}
                transactionDate={formatDateTimeBE(transactionDate)}
                orderRound={formatDateBE(orderRound)}
                deliveryFieldId='po-delivery-date'
                deliveryDate={
                  <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
                    <DatePickerField
                      id='po-delivery-date'
                      value={deliveryDate}
                      onChange={setDeliveryDate}
                      className='h-10 w-full sm:w-1/2'
                    />
                    <span className='text-sm font-normal text-muted-foreground'>
                      จำเป็นต้องระบุวันที่รับสินค้า
                    </span>
                  </div>
                }
                cpReceivedDate={cpReceivedDate ? formatDateBE(cpReceivedDate) : null}
                status={status}
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
              <PurchaseOrderAttachment
                attachedFile={attachedFile}
                setAttachedFile={setAttachedFile}
              />
            </CardContent>
          </Card>
        </div>

        {/* ─── Bottom section: 4-col grid (Product catalog 3/4 + Order Summary 1/4) ─── */}
        <div className='grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-4'>
          {/* Catalog card — 3/4 */}
          <Card className='min-w-0 lg:col-span-3'>
            <CardHeader className='border-b bg-muted/20 pb-3'>
              <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                <Icons.cart className='size-4' />
                รายการสินค้า
              </CardTitle>
            </CardHeader>
            <CardContent className='min-w-0'>
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as string);
                  setSearchQuery('');
                }}
                className='gap-4'
              >
                <TabsList className='h-fit! group-data-horizontal/tabs:h-fit! flex-wrap justify-start gap-1.5 p-1 bg-muted/50 rounded-lg'>
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className='gap-2 h-9! px-5 text-sm font-bold rounded-md transition-all duration-200 data-active:bg-brand! data-active:text-brand-foreground! data-active:shadow-md'
                      >
                        {tab}
                        {orderedCountByCategory[tab] > 0 && (
                          <Badge
                            variant='secondary'
                            className={cn(
                              'px-2 py-0.5 font-mono text-xs font-bold transition-colors duration-200',
                              isActive
                                ? 'bg-white text-black'
                                : 'bg-muted-foreground/15 text-muted-foreground'
                            )}
                          >
                            {orderedCountByCategory[tab]}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='relative w-full sm:max-w-sm'>
                    <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                    <Input
                      type='search'
                      placeholder='ค้นหาด้วยรหัสสินค้า หรือ ชื่อสินค้า...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label='ค้นหาสินค้า'
                      className='bg-white pl-9 dark:bg-background'
                    />
                  </div>

                  <div className='flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap'>
                    <div className='flex items-center gap-2 mr-1 pr-3 h-6 border-border border-r sm:border-r'>
                      <Switch
                        id='po-show-images'
                        checked={showImages}
                        onCheckedChange={setShowImages}
                      />
                      <Label
                        htmlFor='po-show-images'
                        className='cursor-pointer text-xs font-normal whitespace-nowrap text-muted-foreground'
                      >
                        แสดงรูปภาพสินค้า
                      </Label>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={handleApplyRecommended}
                        className='bg-white dark:bg-background'
                      >
                        <Icons.checks />
                        ใส่จำนวนแนะนำทั้งหมด
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={handleClearAll}
                        className='bg-white dark:bg-background'
                      >
                        <Icons.trash />
                        ล้างทั้งหมด
                      </Button>
                    </div>
                  </div>
                </div>

                {TABS.map((tab) => (
                  <TabsContent key={tab} value={tab} className='min-w-0'>
                    <PurchaseOrderTable
                      products={MOCK_PRODUCTS.filter((p) => p.category === tab)}
                      quantities={quantities}
                      onQuantityChange={handleQuantityChange}
                      showImages={showImages}
                      searchQuery={searchQuery}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Order summary card — 1/4
              Layout follows a "claimable balance" card pattern: caption, then a
              large hero amount, and a shaded breakdown box ending in
              a bold total row. lg:top-[72px] (not top-4) clears the app's own
              sticky header (h-14 = 56px from md up, see components/layout/header.tsx)
              so this card's CardHeader doesn't scroll in underneath it. */}
          <Card size='sm' className='min-w-0 pt-4! lg:sticky lg:top-[72px] lg:col-span-1'>
            <CardHeader className='border-b bg-muted/20 pb-4!'>
              <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                <Icons.invoice className='size-4' />
                สรุปคำสั่งซื้อ
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-5 pt-3'>
              <div className='rounded-lg bg-red-50 p-4 dark:bg-red-950/30'>
                <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  ยอดรวมสุทธิ (รวม VAT)
                </p>
                <p className='font-mono text-4xl font-bold text-foreground'>
                  {formatBaht(totals.grandTotal)}
                </p>
              </div>

              {/* One grid rather than a stack of flex rows: the value track sizes
                  itself to the widest amount across every row, so the column holds
                  its edge no matter how the figures grow, and a long label
                  truncates instead of wrapping the row out of rhythm. The gutter
                  is cell padding, not a grid gap — a gap would break the total
                  row's rule at the column seam. */}
              <div className='grid grid-cols-[minmax(0,1fr)_auto_auto] gap-y-2.5 rounded-lg bg-muted/40 p-4 text-sm'>
                {/* What was bought, by catalog tab — units and value before VAT. */}
                {TABS.map((tab) => {
                  const bucket = totals.byCategory[tab];
                  const dim = bucket.qty === 0 ? 'text-muted-foreground/50' : undefined;
                  return (
                    <React.Fragment key={tab}>
                      <span className={cn('truncate text-muted-foreground', dim)}>{tab}</span>
                      <span
                        className={cn(
                          'pl-3 text-right font-mono text-xs tabular-nums text-muted-foreground',
                          dim
                        )}
                      >
                        {bucket.qty.toLocaleString('th-TH')} ชิ้น
                      </span>
                      <span className={cn('pl-3 text-right font-mono tabular-nums', dim)}>
                        {formatBaht(bucket.value)}
                      </span>
                    </React.Fragment>
                  );
                })}

                {/* Tax on it. No unit count applies here, so the middle cell is
                    left empty rather than spanned — that keeps the value column
                    on the same edge as the rows above. */}
                <span className='mt-0.5 truncate border-t border-border/80 pt-2.5 text-muted-foreground'>
                  ยกเว้นภาษี (VAT 0%)
                </span>
                <span className='mt-0.5 border-t border-border/80 pt-2.5' />
                <span className='mt-0.5 border-t border-border/80 pt-2.5 pl-3 text-right font-mono tabular-nums'>
                  {formatBaht(totals.subtotalVat0)}
                </span>

                <span className='truncate text-muted-foreground'>คิดภาษี (VAT 7%)</span>
                <span />
                <span className='pl-3 text-right font-mono tabular-nums'>
                  {formatBaht(totals.subtotalVat7)}
                </span>

                <span className='truncate text-muted-foreground'>ภาษีมูลค่าเพิ่ม (7%)</span>
                <span />
                <span className='pl-3 text-right font-mono tabular-nums'>
                  {formatBaht(totals.vatAmount7)}
                </span>

                <span className='mt-0.5 border-t border-border/80 pt-2.5 font-semibold'>
                  ยอดรวมสุทธิ
                </span>
                <span className='mt-0.5 border-t border-border/80 pt-2.5 pl-3 text-right font-mono text-xs tabular-nums text-muted-foreground'>
                  {totals.totalQty.toLocaleString('th-TH')} ชิ้น
                </span>
                <span className='mt-0.5 border-t border-border/80 pt-2.5 pl-3 text-right font-mono font-bold tabular-nums'>
                  {formatBaht(totals.grandTotal)}
                </span>
              </div>

              <Button
                type='button'
                size='lg'
                className='h-14! w-full gap-2 text-base font-semibold bg-black text-white hover:bg-black/85 dark:bg-black dark:text-white dark:hover:bg-black/85'
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Icons.spinner className='size-5 animate-spin' />
                ) : (
                  <Icons.check className='size-5' />
                )}
                ยืนยันการสั่งซื้อ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

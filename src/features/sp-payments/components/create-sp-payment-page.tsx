'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { WizardStepper, type WizardStep } from '@/components/sam/wizard-stepper';
import { SP_STAFF, type SpStaffItem } from '@/features/sp/api/sp-catalog';
import { formatDateBE } from '@/lib/format-date-be';
import {
  CLEARING_SLIPS_BY_STAFF,
  getDepositReturnEntries,
  getOtherDebtEntries,
  getOtherIncomeEntries,
  getOtherSentAmount
} from '../api/sp-payment-data';
import {
  buildClearingLines,
  computeNetPayment,
  computeOtherTotals,
  EMPTY_NET_PAYMENT_INPUT,
  type DepositReturnEntry,
  type NetPaymentInput
} from '../lib/sp-payment-math';
import { StepClearingSummary } from './steps/step-clearing-summary';
import { StepDepositReturn } from './steps/step-deposit-return';
import { StepOtherDebtsIncome } from './steps/step-other-debts-income';
import { StepSalesCommission } from './steps/step-sales-commission';
import { StepSelectSlips } from './steps/step-select-slips';

const STEPS: WizardStep[] = [
  { step: 1, title: 'เลือกพนักงานและใบเบิก', icon: <Icons.teams className='size-5' /> },
  { step: 2, title: 'ฝาก/คืน สินค้า', icon: <Icons.product className='size-5' /> },
  { step: 3, title: 'ส่งเงินสุทธิและค่าคอมฯ', icon: <Icons.coins className='size-5' /> },
  { step: 4, title: 'หนี้/รายได้อื่นๆ', icon: <Icons.creditCard className='size-5' /> },
  { step: 5, title: 'สรุปการเคลียร์เงิน', icon: <Icons.invoice className='size-5' /> }
];

const STAFF_OPTIONS = SP_STAFF.map((staff) => ({ value: String(staff.id), label: staff.name }));

export default function CreateSpPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const stepParam = parseInt(searchParams.get('step') ?? '1', 10);
  const currentStep = isNaN(stepParam) || stepParam < 1 || stepParam > 5 ? 1 : stepParam;

  // Selected SP staff
  const [staffId, setStaffId] = React.useState<number>(SP_STAFF[0].id);
  const staff: SpStaffItem = React.useMemo(
    () => SP_STAFF.find((s) => s.id === staffId) ?? SP_STAFF[0],
    [staffId]
  );

  // Every open slip of the selected staff — the round always clears all of them.
  const availableSlips = React.useMemo(() => CLEARING_SLIPS_BY_STAFF[staffId] ?? [], [staffId]);

  // Step 2: Deposit & Return entries — the reference rep opens with the ฝาก/คืน
  // of their round already filled in, so the wizard reads like the captures.
  const [depositReturnEntries, setDepositReturnEntries] = React.useState<
    Record<number, DepositReturnEntry>
  >(() => getDepositReturnEntries(staffId));

  // Clearing lines built from selected slips & entries
  const clearingLines = React.useMemo(
    () => buildClearingLines(availableSlips, depositReturnEntries),
    [availableSlips, depositReturnEntries]
  );

  // Step 3: Net Payment Inputs & Totals
  const [netPaymentInput, setNetPaymentInput] =
    React.useState<NetPaymentInput>(EMPTY_NET_PAYMENT_INPUT);

  const netTotals = React.useMemo(
    () => computeNetPayment(clearingLines, netPaymentInput, staffId),
    [clearingLines, netPaymentInput, staffId]
  );

  // Step 4: Other Debts, Extra Income & Sent Amount — booked against the rep
  // outside this wizard, so the step only displays them (see ขั้นตอนที่ 4).
  const otherDebts = React.useMemo(() => getOtherDebtEntries(staffId), [staffId]);
  const otherIncomes = React.useMemo(() => getOtherIncomeEntries(staffId), [staffId]);
  const otherSentAmount = React.useMemo(() => getOtherSentAmount(staffId), [staffId]);

  const otherTotals = React.useMemo(
    () => computeOtherTotals(otherDebts, otherIncomes, otherSentAmount, staffId),
    [otherDebts, otherIncomes, otherSentAmount, staffId]
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleStepChange = (nextStep: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', String(nextStep));
    router.push(`/dashboard/sp-payments/create?${params.toString()}`);
  };

  /**
   * ทุกตัวเลขของรอบนี้ผูกกับพนักงานคนที่เลือก — ใบเบิก ฝาก/คืน หนี้และรายได้อื่นๆ
   * การเปลี่ยนคนจึงต้องเริ่มรอบใหม่ทั้งหมด ไม่ใช่แค่เปลี่ยนชื่อบนหัวเรื่อง
   */
  const handleStaffChange = (nextStaffId: number) => {
    setStaffId(nextStaffId);
    setDepositReturnEntries(getDepositReturnEntries(nextStaffId));
    setNetPaymentInput(EMPTY_NET_PAYMENT_INPUT);
  };

  // ขั้นตอนที่ 3, 4 และ 5 แยกเนื้อหาเป็นกล่องของตัวเองอยู่แล้ว จึงวางบนหน้าโดยตรงโดยไม่มีการ์ดครอบอีกชั้น
  // ส่วนขั้นตอนที่ 1–2 ยังเป็นเนื้อหาแบบ section ที่ต้องมีการ์ดครอบเหมือนเดิม
  const stepContent = (
    <div className='min-w-0'>
      {currentStep === 1 && <StepSelectSlips slips={availableSlips} />}

      {currentStep === 2 && <StepDepositReturn lines={clearingLines} />}

      {currentStep === 3 && (
        <StepSalesCommission
          lines={clearingLines}
          input={netPaymentInput}
          totals={netTotals}
          onChange={setNetPaymentInput}
        />
      )}

      {currentStep === 4 && (
        <StepOtherDebtsIncome debts={otherDebts} incomes={otherIncomes} totals={otherTotals} />
      )}

      {currentStep === 5 && (
        <StepClearingSummary
          netInput={netPaymentInput}
          netTotals={netTotals}
          otherTotals={otherTotals}
        />
      )}
    </div>
  );

  const stepView =
    currentStep >= 3 ? (
      stepContent
    ) : (
      <Card>
        <CardContent className='space-y-6 px-4 sm:px-6'>{stepContent}</CardContent>
      </Card>
    );

  const handleFinish = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('บันทึกปิดรอบการเคลียร์เงินเรียบร้อยแล้ว', {
        description: `ปิดรอบของ ${staff.name} ประจำวันที่ ${formatDateBE(new Date())}`
      });
      router.push('/dashboard/sp-payments');
    }, 1200);
  };

  return (
    /* หัวเรื่องเป็น 'เคลียร์เงิน' เหมือนหน้ารายการ — ระบบเดิมแยกสองหน้านี้ด้วย breadcrumb
       ไม่ใช่ด้วยหัวเรื่อง (ดูภาพหน้า 5–8) */
    <PageContainer pageTitle='เคลียร์เงิน'>
      <div className='space-y-6 pb-12'>
        {/* ─── กล่องบน: ขั้นตอนการทำรายการ ─── */}
        <Card>
          <CardContent className='px-4 sm:px-6'>
            <WizardStepper steps={STEPS} current={currentStep} onStepChange={handleStepChange} />
          </CardContent>
        </Card>

        {/* ─── พนักงานขาย: หัวเรื่องร่วมของทุกขั้นตอน วางลอยไม่มีกรอบครอบ จัดกึ่งกลางหน้า ─── */}
        {/* เลือกพนักงานได้เฉพาะขั้นตอนที่ 1 เท่านั้น ขั้นตอนที่ 2–5 คำนวณจากใบเบิกของคนที่เลือกไว้แล้ว
            จึงแสดงเป็นข้อความอย่างเดียวเพื่อไม่ให้ตัวเลขที่กรอกไปแล้วเปลี่ยนเจ้าของกลางคัน */}
        <div className='flex min-w-0 flex-col items-center text-center'>
          <p className='text-muted-foreground text-xs font-medium'>พนักงานขาย</p>
          {currentStep === 1 ? (
            <Select
              /* base-ui อ่าน `items` เพื่อแปลงค่าที่เลือกเป็นชื่อบนปุ่ม ไม่งั้นจะโชว์เป็นรหัสพนักงาน */
              items={STAFF_OPTIONS}
              value={String(staffId)}
              onValueChange={(value) => handleStaffChange(Number(value))}
            >
              <SelectTrigger
                aria-label='เลือกพนักงานขาย'
                className='mt-1 gap-2 px-3 py-1.5 text-xl font-bold tracking-tight hover:bg-accent/50 [&[data-size]]:h-auto [&_svg]:size-5'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className='text-foreground mt-0.5 text-xl font-bold tracking-tight'>{staff.name}</p>
          )}
        </div>

        {/* ─── กล่องล่าง: เนื้อหาของขั้นตอนที่กำลังแสดง ─── */}
        {stepView}

        {/* Wizard Navigation Actions — outside the step card */}
        <div className='flex items-center justify-between'>
          <Button
            variant='outline'
            onClick={() => handleStepChange(currentStep - 1)}
            disabled={currentStep === 1}
          >
            <Icons.chevronLeft className='mr-1.5 h-4 w-4' /> ย้อนกลับ
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={() => handleStepChange(currentStep + 1)}
              disabled={currentStep === 1 && availableSlips.length === 0}
              className='bg-foreground text-background hover:bg-foreground/85'
            >
              ถัดไป <Icons.chevronRight className='ml-1.5 h-4 w-4' />
            </Button>
          ) : (
            /* The reference system closes the round from the wizard footer too. */
            <Button onClick={handleFinish} disabled={isSubmitting}>
              {isSubmitting ? (
                <Icons.spinner className='mr-1.5 h-4 w-4 animate-spin' />
              ) : (
                <Icons.check className='mr-1.5 h-4 w-4' />
              )}
              ยืนยันปิดรอบการเคลียร์เงิน
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

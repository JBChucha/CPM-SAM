'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Product name, used to build the accessible labels. */
  label: string;
  /** What the number means, e.g. "จำนวนที่เบิก". Announced to screen readers. */
  fieldLabel?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

/**
 * Minus / number / plus stepper used in every product table across SAM.
 *
 * Same anatomy and sizing as the purchase-order screens' `QuantityInput`, but
 * with a configurable `fieldLabel` so the withdrawal and clearing screens can
 * announce "จำนวนที่เบิก" / "จำนวนฝาก" instead of "จำนวนที่สั่ง", and an
 * optional `max` cap so a row can never be pushed past its available stock.
 */
export function QuantityStepper({
  value,
  onChange,
  label,
  fieldLabel = 'จำนวน',
  min = 0,
  max = 9999,
  disabled = false
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const handleInputChange = (raw: string) => {
    if (raw === '') {
      onChange(min);
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) onChange(clamp(parsed));
  };

  return (
    <div className='flex items-center justify-center gap-1'>
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='size-9 shrink-0 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900/50 dark:hover:bg-red-950/20 dark:hover:text-red-400'
        disabled={disabled || value <= min}
        aria-label={`ลด${fieldLabel} ${label}`}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Icons.minus className='size-3.5' />
      </Button>
      <Input
        type='number'
        inputMode='numeric'
        min={min}
        max={max}
        disabled={disabled}
        value={value === 0 ? '' : value}
        placeholder='0'
        aria-label={`${fieldLabel} ${label}`}
        onChange={(e) => handleInputChange(e.target.value)}
        className={cn(
          'h-9 w-14 px-1 text-center font-mono text-sm font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          value > 0 &&
            'text-foreground border-zinc-400 bg-white font-bold dark:border-zinc-600 dark:bg-zinc-950'
        )}
      />
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='size-9 shrink-0 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-600 dark:hover:border-green-900/50 dark:hover:bg-green-950/20 dark:hover:text-green-400'
        disabled={disabled || value >= max}
        aria-label={`เพิ่ม${fieldLabel} ${label}`}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Icons.add className='size-3.5' />
      </Button>
    </div>
  );
}

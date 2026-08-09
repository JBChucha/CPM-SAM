'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
}

/**
 * Custom quantity stepper: <Button variant='outline' size='icon'> on both sides
 * of a compact <Input type='number'>.
 */
export function QuantityInput({ value, onChange, label, min = 0, max = 9999 }: QuantityInputProps) {
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
        className='size-9 shrink-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-900/50 transition-colors'
        disabled={value <= min}
        aria-label={`ลดจำนวน ${label}`}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Icons.minus className='size-3.5' />
      </Button>
      <Input
        type='number'
        inputMode='numeric'
        min={min}
        max={max}
        value={value === 0 ? '' : value}
        placeholder='0'
        aria-label={`จำนวนที่สั่ง ${label}`}
        onChange={(e) => handleInputChange(e.target.value)}
        className={cn(
          'h-9 w-14 px-1 text-center font-mono text-sm font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          value > 0
            ? 'border-zinc-400 bg-white dark:border-zinc-600 dark:bg-zinc-950 text-foreground font-bold'
            : ''
        )}
      />
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='size-9 shrink-0 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-950/20 dark:hover:text-green-400 dark:hover:border-green-900/50 transition-colors'
        disabled={value >= max}
        aria-label={`เพิ่มจำนวน ${label}`}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Icons.add className='size-3.5' />
      </Button>
    </div>
  );
}

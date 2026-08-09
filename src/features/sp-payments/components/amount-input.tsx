'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Baht amount field used on the editable rows of the clearing wizard
 * (ลูกค้าประจำ, เก็บเงินลูกค้าทั่วไป, จำนวนเงินที่ส่งจริง …).
 *
 * The displayed text is held locally so a half-typed decimal survives: parsing
 * "12." to a number and rendering it back would eat the dot the moment it is
 * typed. The parent's number is still the source of truth — it is pushed back
 * into the field whenever it changes from the outside, which the focus check
 * limits to changes the user is not currently making themselves.
 */
export interface AmountInputProps {
  id?: string;
  /** Accessible name, e.g. "ลูกค้าประจำ". */
  label?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function AmountInput({
  id,
  label,
  value,
  onChange,
  disabled,
  className,
  placeholder
}: AmountInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState(() => String(value));

  React.useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) return;
    setText(String(value));
  }, [value]);

  return (
    <Input
      id={id}
      ref={inputRef}
      type='number'
      inputMode='decimal'
      min={0}
      step='0.01'
      disabled={disabled}
      placeholder={placeholder}
      aria-label={label}
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        const parsed = Number.parseFloat(raw);
        onChange(Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
      }}
      onBlur={() => setText(String(value))}
      className={cn(
        'h-9 w-full text-right font-mono text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        value > 0 && 'text-foreground border-zinc-400 font-semibold dark:border-zinc-600',
        className
      )}
    />
  );
}

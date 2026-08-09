'use client';

import * as React from 'react';
import { th } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { formatDateBE, formatDateTimeBE } from '../lib/format-date-be';

export interface DatePickerFieldProps {
  id: string;
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  withTime?: boolean;
  className?: string;
}

/**
 * Shadcn DatePicker anatomy: Popover + Calendar behind a Button trigger.
 * Displays the selected day in Thai Buddhist Era.
 */
export function DatePickerField({
  id,
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  disabled = false,
  withTime = false,
  className
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const format = withTime ? formatDateTimeBE : formatDateBE;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        render={<Button variant='outline' />}
        className={cn(
          'w-full justify-start px-3 font-normal',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <Icons.calendar className='size-4 shrink-0 opacity-70' />
        <span className='truncate font-mono'>{value ? format(value) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          autoFocus
          mode='single'
          locale={th}
          captionLayout='dropdown'
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

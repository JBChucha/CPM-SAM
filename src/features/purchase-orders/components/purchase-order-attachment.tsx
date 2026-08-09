'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface PurchaseOrderAttachmentProps {
  attachedFile: File | null;
  setAttachedFile: (val: File | null) => void;
  className?: string;
}

/** Drop zone for the customer's own PO document — lives in its own card. */
export default function PurchaseOrderAttachment({
  attachedFile,
  setAttachedFile,
  className
}: PurchaseOrderAttachmentProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleUploadClick();
        }
      }}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'flex min-h-[132px] w-full flex-1 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed bg-muted/40 p-3 text-center transition-colors',
        dragActive ? 'border-brand bg-brand/5' : 'border-input',
        className
      )}
    >
      {attachedFile ? (
        <>
          <Icons.page className='size-5 text-muted-foreground' />
          <span className='w-full truncate px-2 font-mono text-xs text-foreground'>
            {attachedFile.name}
          </span>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label='ลบไฟล์แนบ'
            onClick={() => setAttachedFile(null)}
            className='h-6 px-2 text-xs text-destructive'
          >
            <Icons.close className='size-3.5' />
            ลบไฟล์
          </Button>
        </>
      ) : (
        <>
          <Icons.paperclip className='size-5 text-muted-foreground' />
          <span className='text-xs text-muted-foreground'>ยังไม่ได้แนบไฟล์</span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-label='เลือกไฟล์ใบสั่งซื้อสินค้า'
            onClick={handleUploadClick}
            className='h-7 px-2.5 text-xs'
          >
            เลือกไฟล์
          </Button>
        </>
      )}
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileChange}
        className='hidden'
        accept='.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx'
      />
    </div>
  );
}

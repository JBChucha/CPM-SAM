'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

export type WizardStep = {
  /** 1-based. */
  step: number;
  title: string;
  icon?: React.ReactNode;
};

export interface WizardStepperProps {
  steps: WizardStep[];
  /** 1-based index of the step being shown. */
  current: number;
  /** Omit to render a read-only bar. */
  onStepChange?: (step: number) => void;
  className?: string;
}

export function WizardStepper({ steps, current, onStepChange, className }: WizardStepperProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const currentRef = React.useRef<HTMLLIElement>(null);

  // The bar is wider than a phone, so the step being shown has to be brought
  // into view — otherwise the active step sits off-screen and the wizard looks
  // like it lost its last steps. Re-centring on every resize of the list also
  // covers the late relayout when the Thai web font finishes loading, which
  // otherwise leaves the first measurement stale.
  React.useEffect(() => {
    const scroller = scrollerRef.current;
    const item = currentRef.current;
    if (!scroller || !item) return;

    let settled = false;

    const centre = () => {
      if (scroller.scrollWidth <= scroller.clientWidth) return;
      const itemRect = item.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const offsetInScroller = scroller.scrollLeft + itemRect.left - scrollerRect.left;
      // `scrollTo` clamps to the scrollable range on its own.
      scroller.scrollTo({
        left: Math.max(0, offsetInScroller - (scroller.clientWidth - itemRect.width) / 2),
        behavior: settled ? 'smooth' : 'auto'
      });
      settled = true;
    };

    centre();
    const observer = new ResizeObserver(centre);
    observer.observe(scroller);
    observer.observe(item);
    return () => observer.disconnect();
  }, [current, steps.length]);

  return (
    <div className={cn('w-full', className)}>
      {/* The scroll padding lives here, not on the caller-facing wrapper, so a
          `className` from the parent can never merge it away and let the
          horizontal scrollbar sit on top of the status badges.

          `overflow-x-auto` forces `overflow-y` to `auto` as well, so anything
          drawn outside a circle — the tick badge (offset 2px, plus its 2px
          ring) and the 4px hover ring — would be sliced off by the scroll box.
          The padding buys that room back; the matching negative margin keeps
          the first circle optically aligned with the content below. */}
      <div
        ref={scrollerRef}
        className='-mx-1.5 w-[calc(100%+0.75rem)] overflow-x-auto px-1.5 pt-1.5 pb-4 [scrollbar-width:thin]'
        aria-label='ขั้นตอนการเคลียร์เงิน'
      >
        <ol className='flex min-w-[max-content] items-start'>
          {steps.map((stepInfo, index) => {
            const { step, title, icon } = stepInfo;
            const isCurrent = step === current;
            const isComplete = step < current;
            const isPending = step > current;
            const canNavigate = Boolean(onStepChange) && isComplete;
            const isLast = index === steps.length - 1;

            // Determine circle styling. A finished step keeps its own icon and
            // wears the tick as a badge instead, so the bar still reads as five
            // distinct steps once several of them are done.
            const circleClasses = cn(
              'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
              // Outlined rather than filled: `border-current` picks up the very
              // same green the icon is drawn in, so the ring and the glyph can
              // never drift apart across themes. The fill is transparent rather
              // than `bg-background` because the bar sits on a card, and
              // `--background` is a shade off `--card` in both themes — letting
              // the surface show through is what actually matches.
              isComplete &&
                'border-2 border-current bg-transparent text-emerald-700 dark:text-emerald-400',
              isCurrent && 'bg-black text-white dark:bg-white dark:text-black',
              isPending && 'border-2 border-muted bg-transparent text-muted-foreground',
              canNavigate && 'cursor-pointer hover:ring-4 ring-emerald-500/20'
            );

            return (
              <li
                key={step}
                ref={isCurrent ? currentRef : undefined}
                // Every step — the last one included — takes an equal share, so
                // the final label keeps its own column instead of being pushed
                // flush against the card edge. Basing the flex on `max-content`
                // means a long title widens its column (and the scroll area)
                // instead of being cut off.
                className='relative flex min-w-[180px] flex-[1_1_max-content] flex-col'
              >
                {/* Top part: Circle and Connecting Line */}
                <div className='flex items-center w-full'>
                  <button
                    type='button'
                    disabled={!canNavigate}
                    onClick={() => onStepChange?.(step)}
                    className={circleClasses}
                    aria-label={`ขั้นตอนที่ ${step} ${title}${isComplete ? ' (เสร็จสิ้น)' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {icon || <span className='font-semibold text-sm'>{step}</span>}

                    {isComplete && (
                      <span
                        aria-hidden
                        className='ring-card absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2'
                      >
                        <Icons.check className='size-2.5' />
                      </span>
                    )}
                  </button>

                  {!isLast && (
                    <div
                      className={cn(
                        'h-[2px] flex-1 mx-4 transition-colors duration-200',
                        isComplete ? 'bg-emerald-500' : 'bg-muted'
                      )}
                    />
                  )}
                </div>

                {/* Text content below */}
                <div className='mt-4 flex flex-col items-start gap-1.5'>
                  <span className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
                    Step {step}
                  </span>

                  <button
                    type='button'
                    disabled={!canNavigate}
                    onClick={() => onStepChange?.(step)}
                    // Thai has no inter-word break opportunities, so a wrapping
                    // title would be clipped rather than reflowed — keep it on
                    // one line and let `min-w-[max-content]` on the <ol> widen
                    // the bar to fit it.
                    className={cn(
                      'whitespace-nowrap text-base font-semibold leading-7 text-foreground text-left',
                      canNavigate && 'hover:underline cursor-pointer'
                    )}
                  >
                    {title}
                  </button>

                  <div className='mt-0.5'>
                    {isComplete && (
                      <span className='inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'>
                        Completed
                      </span>
                    )}
                    {isCurrent && (
                      <span className='inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground'>
                        In Progress
                      </span>
                    )}
                    {isPending && (
                      <span className='inline-flex items-center rounded-md bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground'>
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

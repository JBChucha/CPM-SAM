import Image from 'next/image';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { portalThumbnails, type PortalScreenWithGroup } from '../config/screens';

/**
 * One screen tile on the portal: the legacy capture and the redesigned capture
 * side by side, with the whole card acting as the door into the new screen.
 *
 * A ready screen renders as a link; a planned one renders as an inert article
 * so the grid still shows the full shape of the redesign without offering a
 * destination that would 404.
 */
export function PortalScreenCard({ screen }: { screen: PortalScreenWithGroup }) {
  const Icon = Icons[screen.icon];
  const isReady = screen.status === 'ready';
  const thumbs = portalThumbnails(screen);

  const content = (
    <>
      <div className='flex items-center justify-between gap-2'>
        <Badge variant='secondary' className='min-w-0 truncate'>
          {screen.groupTitle}
        </Badge>
        <span className='text-muted-foreground/40 shrink-0 font-mono text-xs tabular-nums'>
          {String(screen.no).padStart(2, '0')}
        </span>
      </div>

      <div className='mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5'>
        <ScreenShot
          src={thumbs.before}
          alt={`หน้าจอเดิม — ${screen.title}`}
          label='เดิม'
          caption={screen.legacyPath}
        />
        <Icons.arrowRight
          className='text-muted-foreground/40 size-4 shrink-0 self-center'
          aria-hidden
        />
        <ScreenShot
          src={thumbs.afterLight}
          darkSrc={thumbs.afterDark}
          alt={`หน้าจอใหม่ — ${screen.title}`}
          label='ใหม่'
          caption={screen.href ?? '—'}
          highlighted={isReady}
        />
      </div>

      <div className='mt-3 space-y-1'>
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
              isReady
                ? 'bg-brand/10 text-brand group-hover:bg-brand group-hover:text-brand-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Icon className='size-4' />
          </span>
          <h3 className='min-w-0 leading-snug font-semibold'>{screen.title}</h3>
        </div>
        <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
          {screen.description}
        </p>
      </div>

      {isReady ? (
        <div className='text-brand mt-3 flex items-center gap-1.5 text-xs font-medium'>
          <span>เปิดหน้าจอใหม่</span>
          <Icons.arrowRight className='size-3.5' />
        </div>
      ) : (
        <Badge variant='outline' className='text-muted-foreground mt-3 w-fit'>
          กำลังทำ
        </Badge>
      )}
    </>
  );

  const className = cn(
    'bg-card flex h-full flex-col rounded-xl border p-4 text-left transition-all',
    isReady
      ? 'group hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
      : 'border-dashed opacity-65'
  );

  if (!isReady || !screen.href) {
    return (
      <article className={className} aria-label={`${screen.title} (ยังไม่พร้อมใช้งาน)`}>
        {content}
      </article>
    );
  }

  // Opens in the same tab so it acts as normal navigation.
  return (
    <Link href={screen.href} className={className}>
      {content}
    </Link>
  );
}

/**
 * A single capture, framed like a browser window.
 *
 * The captures are 16:10 but the frame is 4:3, so `object-top` trims a little
 * off the bottom of the page in exchange for a taller thumbnail — the head of
 * the screen, where the two designs differ most, always survives the crop.
 *
 * Pass `darkSrc` to swap the capture with the theme. The swap is CSS-only
 * because next-themes resolves the theme on the client: reading it in React
 * would flash the wrong capture on first paint.
 */
function ScreenShot({
  src,
  darkSrc,
  alt,
  label,
  caption,
  highlighted = false
}: {
  src: string;
  darkSrc?: string;
  alt: string;
  label: string;
  caption: string;
  highlighted?: boolean;
}) {
  return (
    <figure
      className={cn(
        'bg-muted/40 flex min-w-0 flex-col overflow-hidden rounded-lg border transition-colors',
        highlighted ? 'border-brand/30 group-hover:border-brand/60' : 'border-border'
      )}
    >
      <div className='bg-muted/60 flex items-center gap-1.5 border-b px-2 py-1.5'>
        <span className='bg-muted-foreground/30 size-1.5 shrink-0 rounded-full' aria-hidden />
        <code
          className='text-muted-foreground/70 min-w-0 flex-1 truncate font-mono text-[10px]'
          title={caption}
        >
          {caption}
        </code>
        <figcaption
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium',
            highlighted ? 'bg-brand text-brand-foreground' : 'bg-background text-muted-foreground'
          )}
        >
          {label}
        </figcaption>
      </div>
      <div className='relative aspect-[4/3]'>
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized={true}
          sizes='(min-width: 1280px) 200px, 45vw'
          className={cn('object-cover object-top', darkSrc && 'dark:hidden')}
        />
        {darkSrc ? (
          <Image
            src={darkSrc}
            alt=''
            aria-hidden
            fill
            unoptimized={true}
            sizes='(min-width: 1280px) 200px, 45vw'
            className='hidden object-cover object-top dark:block'
          />
        ) : null}
      </div>
    </figure>
  );
}

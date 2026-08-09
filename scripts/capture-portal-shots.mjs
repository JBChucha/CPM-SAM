/**
 * Regenerates the before/after thumbnails shown on /portal.
 *
 * "before" comes from the legacy SAM captures committed under `data resource/`;
 * "after" is shot live from the running dev server with headless Chrome, once in
 * each colour scheme, so the portal never drifts from what the redesigned pages
 * actually look like and the thumbnail always matches the theme it is viewed in.
 *
 * Usage:
 *   npm run dev                 # in another terminal
 *   npm run portal:shots        # optionally: PORTAL_BASE_URL=http://localhost:3001
 *
 * Only Chrome and sharp are needed — both are already on the machine, so this
 * adds no dependency to the project.
 */
import { spawn } from 'node:child_process';
import { access, constants, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEGACY_DIR = path.join(ROOT, 'data resource', 'CP SAM_Redesign ');
const OUT_BEFORE = path.join(ROOT, 'public', 'portal', 'before');
const OUT_AFTER = path.join(ROOT, 'public', 'portal', 'after');

/**
 * The dashboard follows `prefers-color-scheme` (next-themes runs with
 * `defaultTheme='system'`), and a fresh Chrome profile has no stored theme — so
 * emulating the media query is enough to shoot the same route in both looks.
 * `preferredColorScheme` is Blink's enum: 0 = dark, 1 = light.
 */
const COLOR_SCHEMES = [
  { name: 'light', blinkValue: 1 },
  { name: 'dark', blinkValue: 0 }
];

const BASE_URL = process.env.PORTAL_BASE_URL ?? 'http://localhost:3000';

/** Thumbnail width. Cards render these around 150–260 CSS px, so 800 covers 2x. */
const THUMB_WIDTH = 800;
const WEBP = { quality: 78, effort: 5 };

/** Viewport used for the "after" shots — a 16:10 laptop, matching the legacy captures' shape. */
const VIEWPORT = { width: 1440, height: 900, scale: 2 };

/**
 * `no` matches both `<no>.png` in the legacy folder and `no` in
 * src/features/portal/config/screens.ts, which is what ties a card to its pair
 * of images.
 */
const SCREENS = [
  { no: 1, route: '/dashboard/purchase-orders/create' },
  { no: 2, route: '/dashboard/purchase-orders/9999999999PO260703' },
  { no: 3, route: '/dashboard/sp-withdrawals/create' },
  { no: 4, route: '/dashboard/sp-payments' },
  { no: 5, route: '/dashboard/sp-payments/create?step=1' },
  { no: 6, route: '/dashboard/sp-payments/create?step=3' },
  { no: 7, route: '/dashboard/sp-payments/create?step=4' },
  { no: 8, route: '/dashboard/sp-payments/create?step=5' }
];

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  process.env.CHROME_PATH
].filter(Boolean);

async function resolveChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // try the next one
    }
  }
  throw new Error(
    `No Chrome-family browser found. Set CHROME_PATH to a binary. Tried:\n  ${CHROME_CANDIDATES.join('\n  ')}`
  );
}

async function assertServerUp() {
  const res = await fetch(`${BASE_URL}/portal`, { redirect: 'manual' }).catch(() => null);
  if (!res) {
    throw new Error(`Dev server is not reachable at ${BASE_URL}. Start it with \`npm run dev\`.`);
  }
}

/** Warms a route so Turbopack finishes compiling before Chrome's time budget starts. */
async function warm(route) {
  await fetch(`${BASE_URL}${route}`, { redirect: 'manual' }).catch(() => null);
}

async function toThumbnail(inputPath, outputPath) {
  await sharp(inputPath)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp(WEBP)
    .toFile(outputPath);
}

/**
 * Waits for a file to appear and stop growing.
 *
 * `--screenshot` writes the PNG within a second or two but the Chrome process
 * then sits there holding the dev server's HMR socket open, so waiting on exit
 * costs minutes per shot. Watching the file instead — and killing Chrome once
 * it has settled — is what keeps a full run under a minute.
 */
async function waitForSettledFile(file, { timeoutMs = 90_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastSize = -1;

  while (Date.now() < deadline) {
    await delay(250);
    const size = await stat(file).then((s) => s.size, () => -1);
    if (size > 0 && size === lastSize) return;
    lastSize = size;
  }

  throw new Error(`Timed out waiting for ${path.basename(file)}`);
}

async function captureAfter(chrome, screen, scheme, workDir) {
  const raw = path.join(workDir, `after-${scheme.name}-${screen.no}.png`);
  const child = spawn(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      // A throwaway profile keeps the shots reproducible: no stored next-themes
      // choice to override the emulated colour scheme, and no clash with the
      // Chrome the developer already has open.
      `--user-data-dir=${path.join(workDir, `profile-${scheme.name}-${screen.no}`)}`,
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      `--force-device-scale-factor=${VIEWPORT.scale}`,
      `--blink-settings=preferredColorScheme=${scheme.blinkValue}`,
      `--screenshot=${raw}`,
      `${BASE_URL}${screen.route}`
    ],
    { stdio: 'ignore' }
  );

  try {
    await waitForSettledFile(raw);
  } finally {
    child.kill('SIGKILL');
  }

  await toThumbnail(raw, path.join(OUT_AFTER, scheme.name, `${screen.no}.webp`));
}

async function captureBefore(screen) {
  const source = path.join(LEGACY_DIR, `${screen.no}.png`);
  await toThumbnail(source, path.join(OUT_BEFORE, `${screen.no}.webp`));
}

async function main() {
  await assertServerUp();
  const chrome = await resolveChrome();
  await mkdir(OUT_BEFORE, { recursive: true });
  for (const scheme of COLOR_SCHEMES) {
    await mkdir(path.join(OUT_AFTER, scheme.name), { recursive: true });
  }
  const workDir = await mkdtemp(path.join(tmpdir(), 'portal-shots-'));

  try {
    for (const screen of SCREENS) {
      await captureBefore(screen);
      await warm(screen.route);
      for (const scheme of COLOR_SCHEMES) {
        await captureAfter(chrome, screen, scheme, workDir);
      }
      console.log(`✓ ${String(screen.no).padStart(2, '0')}  ${screen.route}`);
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  console.log(
    `\nWrote ${SCREENS.length} legacy shots to public/portal/before/ and ${
      SCREENS.length * COLOR_SCHEMES.length
    } redesigned shots to public/portal/after/{light,dark}/`
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});

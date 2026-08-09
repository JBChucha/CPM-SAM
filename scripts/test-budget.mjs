import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
const execFileAsync = promisify(execFile);

async function main() {
  const start = Date.now();
  await execFileAsync(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
      '--virtual-time-budget=5000',
      '--screenshot=test-budget.png',
      'http://localhost:3000/dashboard/purchase-orders/create'
    ]
  ).catch(e => console.log('error', e.message));
  console.log('done in', Date.now() - start);
}
main();

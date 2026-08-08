import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  defaultViewport: { width: 1280, height: 900 },
  args: ['--no-sandbox'],
});

const page = await browser.newPage();
const errors = [];
const net = [];
page.on('pageerror', (e) => errors.push(`PAGE: ${e.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`CONS: ${msg.text()}`);
});
page.on('response', async (res) => {
  if (res.url().includes('/api/')) {
    let body = '';
    try {
      body = await res.text();
    } catch {
      body = '';
    }
    net.push(`${res.status()} ${res.url()} :: ${body.slice(0, 220)}`);
  }
});

await page.goto('http://127.0.0.1:4300/login', { waitUntil: 'networkidle0' });
await page.click('#email', { clickCount: 3 });
await page.type('#email', 'test@gmail.com');
await page.click('#password', { clickCount: 3 });
await page.type('#password', '123456789');
await page.click('button[type=submit]');
await page.waitForSelector('.dev-chip button, .otp-cell', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 600));

const useBtn = await page.$('.dev-chip button');
if (useBtn) {
  await useBtn.click();
} else {
  await page.click('button.btn-primary');
}

try {
  await page.waitForFunction(() => location.pathname.includes('/dashboard'), { timeout: 15000 });
} catch {
  /* dump below */
}

await new Promise((r) => setTimeout(r, 1000));
console.log('URL', page.url());
console.log('TEXT', await page.evaluate(() => document.body.innerText.slice(0, 500)));
console.log('NET', JSON.stringify(net, null, 2));
console.log('ERRORS', JSON.stringify(errors, null, 2));
await browser.close();

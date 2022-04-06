const puppeteer = require('puppeteer');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function scrape() {
  const browser = await puppeteer.launch({});
  const page = await browser.newPage();

  await page.goto('https://open-atlas.notion.site/06073101bbd34ec19434568c515060ec?v=72803e3bdc8140dcab9d83f0919e90f5');
  await sleep(3000);
  // await page.waitForSelector('.notion-collection-item');

  const rows = await page.evaluateHandle(() => document.querySelector('.notion-collection-item'));

  // const row = rows[0].evaluateHandle();

  console.log(await rows.length);
  // console.log(row);

  browser.close();
}
scrape();

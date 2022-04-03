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
  await page.waitForSelector('.notion-collection-item');

  // const rows = await page.$eval('.notion-collection-item');
  // $eval shortcut for Array.from(document.querySelectorAll(selector))
  // $eval will only work if the returned result is a string

  const selector = '.notion-collection-item';

  const rows = await page.$$(selector);

  const result = [];
  for (let i = 0; i < rows.length; i++) {
    // cells.push( await rows[i].$$('div', (d) => d.textContent));

    // const cells = await rows[i].$$('div');

    result.push( await rows[i].evaluate((x) => {
      x.innerText;
    },
    ));


    // cells.push( await rows[i].$eval('div', (d) => d.textContent));
  }

  const x = await rows[0].evaluate((x) => x.childNodes[0].textContent);

  console.log(x );
  // console.log(rows);

  browser.close();
}
scrape();

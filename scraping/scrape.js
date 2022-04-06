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
  // await page.waitForNavigation({waitUntil: 'domcontentloaded'});
  // consider navigation to be finished when there are no more than 2 network connections for at least 500 ms.
  // networkidle2 | does not work with Notion because it keeps pinging for updates
  // domcontentloaded | also doesn't?
  // load | also doesn't, wut.

  await sleep(3000);
  // with this other cells have the time to populate


  /* const elm = await page.
      waitForSelector('.notion-collection-item');
      elm.querySelectorAll('div')
  //const text = await page.evaluate((x) => x.textContent, elm);

  console.log(text); */

  // .evaluate(x => x.innerHTML, element)

  await page.waitForSelector('.notion-collection-item');
  // the sleep should be enough

  const rows = page.$$('.notion-collection-item');
  // $$ is a shortcut for querySelectorAll
  // const cells = await rows.$$('div');
  // not working

  // evaluate() function
  // page.evaluate(x => x.property, element)
  // element.evaluate(x => x.property)

  const cells = [];

  for (let i = 0; i < rows.length; i++) {
    cells.push( rows[i].$eval('div', (d) => d.textContent));
  }
  // gets only the first div of each row

  /* for (let i = 0; i < rows.length; i++) {
    cells.push( rows[i].textContent);
  } */
  // undefined

  /* await page.$eval('css-selector', (element) => {
    return element.property;
  }); */
  // $eval shortcut for querySelector ($) + pageFunction (.evaluate)
  // get element and passes it to evaluate function

  const list = await page.evaluate(() => {
    // const rows = Array.from(document.querySelectorAll('.notion-collection-item'));

    // const cells = Array.from(rows.querySelector('div'), (cell) => cell.textContent);
    // not working. | can't use querySelectorAll on Array

    /* for (const x of rows) {
      console.log(x);
      console.log(x.textContent, 'lmao');
      console.log(rows[x]);
    }
    console.log(rows); */

    const cell0 = rows[0].children;

    return cells;

    const links = rows.map((cell) => {
      return cell.textContent;
    });
    return links;
  });

  console.log(list);

  /* const children = await page.evaluate(() => {
    return (Array.from(document.querySelector('.notion-collection-item').children).length);
  });
  console.log('Result:', children); */

  /* await page.evaluate((sel) => {
    let elements = Array.from(document.querySelectorAll(sel));
    let links = elements.map(element => {
        return element.href
    })
    return links;
}, sel) */

  /* const data = await page.evaluate(
      () => Array.from(
          document.querySelectorAll('.notion-collection-item'),
          (cell) => cell.innerText,
          // (row) => Array.from(row.querySelectorAll('div > div'), (cell) => cell.innerText),
      ),
  ); */

  // console.log(data);


  // SCRAPE3

  // const rows = await page.$$(selector);

  // TRY1
  /* const result = [];
   for (let i = 0; i < rows.length; i++) {

     const cells = rows[i];

     for (let i = 0; i < cells.length; i++) {
       result.push( await cells.evaluate((x) => x.textContent));
     }
   } */
   // NOT WORKING - EMPTY ARRAY

  browser.close();
}
scrape();

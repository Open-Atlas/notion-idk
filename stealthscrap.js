const puppeteer = require('puppeteer-extra');
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// eslint-disable-next-line new-cap
puppeteer.use(StealthPlugin());


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function scrape() {
  const browser = await puppeteer.launch({
    headless: true,
    // args: ['--proxy-server=http://158.247.199.162:3128'],

  });
  const page = (await browser.pages())[0];

  // await page.goto('https://www.pc-kombo.com/us/components/cpus'); //works
  // await page.goto('https://www.techpowerup.com/cpu-specs/?mfgr=AMD&sort=name'); //works
  await page.goto('https://www.techpowerup.com/cpu-specs/?mfgr=AMD&sort=name');
  await sleep(3000);

  // eslint-disable-next-line max-len
  /* await page.setCookie(
      {
        name: 'xcsrftoken',
        value: 'uaiF9WPXaND07BPxiBiWdFRkwer54VlWtbbTjcWa527px8gFs64DZkOiFBxFwrIk',
        domain: '.pcpartpicker.com',
        expires: 1690557117,
        // MaxAge: 31449600,
        path: '\/',
        sameSite: 'Lax',
      }); */
  // console.log(await page.content());

  // await page.waitForSelector('#paginated_table');


  // const rows = await page.$eval('.notion-collection-item');
  // $eval shortcut for Array.from(document.querySelectorAll(selector))
  // $eval will only work if the returned result is a string


  // const heading1 = await page.$eval('.processors tbody', (el) => el.childNotes[0].innerHTML);

  /* const rows = await page.$$eval('.processors tbody tr', (x) => {
    const u = x[0].innerHTML;
    console.log(u);
  });
  console.log(rows); */

  // $ select just one -> returns object
  // $$ selects all matches -> returns array
  // can't console.log inside eval
  const selector = '.processors tbody tr';

  const rows = await page.$$(selector);

  const result = [];
  for (let i = 0; i < rows.length; i++) {
    // cells.push( await rows[i].$$('div', (d) => d.textContent));

    // const cells = await rows[i].$$('div');

    result[i] = {};

    const tds = await rows[i].$$('td');

    result[i].name = await tds[0].evaluate((x) => x.innerText);
    result[i].codename = await tds[1].evaluate((x) => x.innerText);
    result[i].cores = await tds[2].evaluate((x) => x.innerText);
    result[i].clock = await tds[3].evaluate((x) => x.innerText);
    result[i].socket = await tds[4].evaluate((x) => x.innerText);
    result[i].process = await tds[5].evaluate((x) => x.innerText);
    result[i].l3 = await tds[6].evaluate((x) => x.innerText);
    result[i].tdp = await tds[7].evaluate((x) => x.innerText);
    result[i].release = await tds[8].evaluate((x) => x.innerText);


    // cells.push( await rows[i].$eval('div', (d) => d.textContent));
  }

  console.log(result);

  browser.close();
}
scrape();

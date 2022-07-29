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
    args: ['--proxy-server=http://8.219.97.248:80'],

  });
  const page = (await browser.pages())[0];

  await page.goto('https://pcpartpicker.com/products/case/');
  await sleep(3000);

  // eslint-disable-next-line max-len
  await page.setCookie(
      {
        name: 'xcsrftoken',
        value: 'uaiF9WPXaND07BPxiBiWdFRkwer54VlWtbbTjcWa527px8gFs64DZkOiFBxFwrIk',
        domain: '.pcpartpicker.com',
        expires: 1690557117,
        // MaxAge: 31449600,
        path: '\/',
        sameSite: 'Lax',
      });
  console.log(await page.content());

  // await page.waitForSelector('#paginated_table');


  // const rows = await page.$eval('.notion-collection-item');
  // $eval shortcut for Array.from(document.querySelectorAll(selector))
  // $eval will only work if the returned result is a string


  const heading1 = await page.$eval('#category_content', (el) => el.childNotes[0].textContent);

  console.log(heading1);

  // const x = await rows[0].evaluate((x) => x.childNodes[0].textContent);

  // console.log(x );
  // console.log(rows);

  browser.close();
}
scrape();

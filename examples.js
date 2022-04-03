const {Client} = require('@notionhq/client');

const notion = new Client({auth: 'secret_6myhGoDBvah6hswnfelQeJpl6Y80l0FNbJD3CDyp4YS' || process.env.NOTION_API_KEY});

// Query DB
/* (async () => {
  const databaseId = '06073101bbd34ec19434568c515060ec';
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  console.log(JSON.stringify(response.results[0]));
})();

// Query Page
(async () => {
  const pageId = 'b55c9c91-384d-452b-81db-d1ef79372b75';
  const response = await notion.pages.retrieve({page_id: pageId});
  console.log(response);
})(); */

(async () => {
  const response = await notion.search({
    filter: {
      value: 'database',
      property: 'object',
    },
  });
  response.results.map((x) => {
    console.log(x.title[0].plain_text);
  });
})();

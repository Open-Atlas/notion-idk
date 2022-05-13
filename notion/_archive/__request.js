const {Client} = require('@notionhq/client');

const notion = new Client({auth: 'secret_6myhGoDBvah6hswnfelQeJpl6Y80l0FNbJD3CDyp4YS' || process.env.NOTION_API_KEY});
// get DB
exports.searchDb = async (query = '') => {
  const response = await notion.search({
    query: '',
    filter: {
      value: 'database',
      property: 'object',
    },
  });
  console.log(response);
  return response;
};

// Query DB
exports.queryDb = getDb = async (id) => {
  try {
    const databaseId = '06073101bbd34ec19434568c515060ec';
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    return response;
  } catch (e) {
    console.log(e);
  }
};

// Query Page
exports.getPage = getPage = async (id) => {
  const response = await notion.pages.retrieve({page_id: id});
  return response;
};

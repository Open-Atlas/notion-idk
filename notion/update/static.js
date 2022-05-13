const notion = global.notion.client;

exports.page = async (id, {properties}) => {
  return await notion.pages.update({
    page_id: id,
    properties,
  // properties: {
  //   'In stock': {
  //     checkbox: true,
  //   },
  // },
  }).then(async () => {
    console.log(`${id} UPDATED WITH ${JSON.stringify(properties)}`);
  }).catch((e) =>
    console.log(id, properties, e),
  );
};

const axios = require('axios');
// update database is not included in the notion js sdk - see documentation https://developers.notion.com/reference/update-a-database
exports.database = updateDatabase = async (id, {properties}) => {
  // encodeURI(id);
  try {
    await axios.patch(`https://api.notion.com/v1/databases/${id}`, properties, {
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-02-22',
      },
    });
    console.log('OK ', properties);
  } catch (e) {
    console.log(e);
    console.log('ERROR ', properties);
  }
};

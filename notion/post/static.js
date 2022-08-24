// const sampleData = require('./sample.json');
const notion = global.notion.client;
// TODO: #4 find a way to have a main branch without console.logs

// conditional console.log function

// TODO: create relationship from block to page in case the block is a link, see POSTMAN documentation RETRIEVE BLOCK
// eslint-disable-next-line max-len
// LINK TO PAGE  s://open-atlas.postman.co/workspace/Open-Atlas~30cd5d2f-5eec-4a2a-9710-2930b1dbbe83/documentation/7075921-e61672b7-4165-4916-ad76-222babf24c19?entity=request-7075921-96f60b4e-21f4-4036-a0dc-f70171872bde


try {
  // Query DB | Get Pages from a DB
  exports.query = async ({id, filter, sorts}) => {
    return await notion.databases.query({
      database_id: id,
      filter,
      sorts,
      /* filter: {
        or: [
          {
            property: 'In stock',
            checkbox: {
              equals: true,
            },
          },
          {
            property: 'Cost of next trip',
            number: {
              greater_than_or_equal_to: 2,
            },
          },
        ],
      },
      sorts: [
        {
          property: 'Last ordered',
          direction: 'ascending',
        },
      ], */
    });
    // returns object with results parameter as array of pages
  },

  exports.search= async ({query = undefined, filter = undefined}) => { // filter 'database' or 'page'
    let object = {
      query,
    };

    object = filter ? {...object, filter} : object;

    return await notion.search({
      ...object,
    });
    // returns array
  };
} catch (e) {
  console.log(e);
}


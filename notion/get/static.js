// const sampleData = require('./sample.json');
const notion = global.notion.client;
// TODO: #4 find a way to have a main branch without console.logs

// conditional console.log function

// TODO: create relationship from block to page in case the block is a link, see POSTMAN documentation RETRIEVE BLOCK
// eslint-disable-next-line max-len
// LINK TO PAGE  s://open-atlas.postman.co/workspace/Open-Atlas~30cd5d2f-5eec-4a2a-9710-2930b1dbbe83/documentation/7075921-e61672b7-4165-4916-ad76-222babf24c19?entity=request-7075921-96f60b4e-21f4-4036-a0dc-f70171872bde


try {
  exports.db = async (id) => {
    return await notion.databases.retrieve({database_id: id});
  },

  // Query DB | Get Pages from a DB
  exports.pages= async (id) => {
    return await notion.databases.query({database_id: id});
    // returns object with results parameter as array of pages
  },

  // Query Page
  exports.page = async (id) => {
    return await notion.pages.retrieve({page_id: id});
    // returns object as page
  },

  /* exports.pageProperties= async (pageId, propertyId) => {
    return await notion.pages.properties.retrieve({page_id: pageId, property_id: propertyId});
  }, */

  exports.blockChildren= async (id) => {
    return await notion.blocks.children.list({
      block_id: id,
      page_size: 50,
    });
  },

  exports.block= async (id) => {
    return global.notion.cache.block[id] = await notion.blocks.retrieve({
      block_id: id,
    });
  },

  // search
  exports.search= async (query = undefined, filter = {}) => { // filter 'database' or 'page'
    return await notion.search({
      query,
    });
    // returns array
  },

  exports.searchDb= async (query = undefined) => {
    return await notion.search({
      query,
      filter: {
        value: 'database',
        property: 'object',
      },
    });
  };
} catch (e) {
  console.log(e);
}


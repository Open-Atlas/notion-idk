const {Client} = require('@notionhq/client');
// const sampleData = require('./sample.json');
const refine = require('../get/format.js');
const advanced = require('../advanced');

global.notionCache = {
  db: {},
  pages: {},
  page: {},
  block: {},
};

exports.advanced = advanced;
exports.refine = refine;

const notion = new Client({auth: process.env.NOTION_API_KEY});
// TODO: #4 find a way to have a main branch without console.logs

// conditional console.log function

// TODO: create relationship from block to page in case the block is a link, see POSTMAN documentation RETRIEVE BLOCK
// eslint-disable-next-line max-len
// LINK TO PAGE  s://open-atlas.postman.co/workspace/Open-Atlas~30cd5d2f-5eec-4a2a-9710-2930b1dbbe83/documentation/7075921-e61672b7-4165-4916-ad76-222babf24c19?entity=request-7075921-96f60b4e-21f4-4036-a0dc-f70171872bde


try {
  exports.newRequest = async function request(dataType, params, options = {}) {
    const x = refine(global?.notionCache?.[dataType]?.[params.id] || await this[functionName](params), options);
  };

  // all requests go through a refinement / formatting
  exports.request = async function request(functionName, params, options = {}) {
    // get
    // dataType
	  console.log(params);
    return refine(await this[functionName](params), options);
  };

  // search
  exports.search = async ({query} = undefined, filter = {}) => { // filter 'database' or 'page'
    return await notion.search({
      query,
    });
  // returns array
  };

  exports.searchDb = async ({query} = undefined) => {
    return await notion.search({
      query,
      filter: {
        value: 'database',
        property: 'object',
      },
    });
  };

  // Query DB | Get Pages
  exports.queryDb = async ({id}) => {
	  // console.log(id);
    return await notion.databases.query({
      database_id: id,
    });
    // returns array
  };

  // Query Page
  exports.retrievePage = async ({id}) => {
	  return global.notionCache[id] || await notion.pages.retrieve({page_id: id});
  // returns object
  };

  exports.updatePage = async ({id, properties}) => {
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


  exports.retrievePageProperties = async ({pageId, propertyId}) => {
    return await notion.pages.properties.retrieve({page_id: pageId, property_id: propertyId});
  };

  exports.retrieveBlockChildren = async ({id}) => {
    return await notion.blocks.children.list({
      block_id: id,
      page_size: 50,
    });
  };

  exports.retrieveBlock = async ({id}) => {
    return await notion.blocks.retrieve({
      block_id: id,
    });
  };

  exports.retrieveDb = async ({id}) => {
	  console.log(id);
    return await notion.databases.retrieve({database_id: id});
  };



  exports.queryDb_Relations = async ({id}) => {
    console.log(id);
    const pages = await this.request('queryDb', {id}, {getPageRelations: true});
    return pages;
  };
} catch (e) {
  console.log(e);
}

const notion = global.notion.client;

exports.default= async (query = undefined, dataType = '', filter = {}) => { // filter 'database' or 'page'
  return await notion.search({
    query,
    filter: {
      value: dataType,
      property: 'object',
    },
  });
  // returns array
};

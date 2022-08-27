const get = require('./static.js');
const format = require('./format.js');

module.exports = async (dataType, {id=null, query=null, ...options}) => {
  const result = await get[dataType](id||query);
  // TO-DO: start_cursor and next_cursor from Notion API, can wait to implement https://developers.notion.com/reference/pagination
  return options.raw ? result : await format(result, options);

  // caching does not seem to make much of a difference, but well, let's leave it here
  /* const flag = Object.entries(options).some(([key, option]) => option != global.notion?.cache?.[dataType]?.[id]?.options[key]);
  return options.raw ? result :
    !flag && console.log('CACHE OPTIONS MATCH') && global.notion?.cache?.[dataType]?.[id] || await format(result, options); */
};

const get = require('./static.js');
const format = require('./format.js');

module.exports = async (dataType, {id=null, query=null, ...options}) => {
  let response = {
    start_cursor: undefined,
    next_cursor: undefined,
    results: [],
  };

  if (dataType == 'blockChildren' || dataType == 'pages') {
    do {
      // add list arrays together
      const {results} = JSON.parse(JSON.stringify(response));
      response = await get[dataType](id, response.next_cursor);
      response.results = [...results, ...response.results];

      // console.log(response);
    } while (response.next_cursor);
  } else {
    response = await get[dataType](id, response.start_cursor);
    // console.log(response);
  }


  // TO-DO: start_cursor and next_cursor from Notion API, can wait to implement https://developers.notion.com/reference/pagination


  return options.raw ? response : await format(response, options);

  // caching does not seem to make much of a difference, but well, let's leave it here
  /* const flag = Object.entries(options).some(([key, option]) => option != global.notion?.cache?.[dataType]?.[id]?.options[key]);
  return options.raw ? response :
    !flag && console.log('CACHE OPTIONS MATCH') && global.notion?.cache?.[dataType]?.[id] || await format(response, options); */
};

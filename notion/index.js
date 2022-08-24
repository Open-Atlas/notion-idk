const {Client} = require('@notionhq/client');
global.notion = {
  client: new Client({auth: process.env.NOTION_API_KEY}),
};
// const sampleData = require('./sample.json');
const get = require('./get');
const post = require('./post');
// const update = require('./update');
// const create = require('./post');
const advanced = require('./advanced');

module.exports = {
  get,
  post,
  advanced,
};

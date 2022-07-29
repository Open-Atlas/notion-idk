const {Client} = require('@notionhq/client');
global.notion = {
  client: new Client({auth: process.env.NOTION_API_KEY}),
};
// const sampleData = require('./sample.json');
const advanced = require('./advanced');
const get = require('./get');
const update = require('./update');
const create = require('./create');

module.exports = {
  advanced,
  get,
  update,
  create,
};

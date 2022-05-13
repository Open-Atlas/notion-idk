const notion = require('../index_bkp.js');

const deepClone = ((obj) => {
  return JSON.parse(JSON.stringify(obj));
});

global.notionCache = {};

const getPageTitle = (entry) => {
  // doesn't work if string is empty
  // const [, {title: [{plain_text}]}] = Object.entries(properties).find(([, value]) => value.id == 'title');

  // console.log('PRPS ', entry.properties, ' PROPS END');
  // get title
  const [titleKey, titleObject] = Object.entries(entry.properties).find(([, value]) => {
    return value.id == 'title';
  });
  delete entry.properties[titleKey];
  // console.log("titleObject: ", titleObject);
  entry.title = titleObject?.title?.[0]?.plain_text || '';
  // console.log('entry.title', entry.title);
  return entry;
};

// TODO: #9 implement cache system, object with id as index

const cache = {};

const getPageRelations = async ({properties}) => {
  _properties = deepClone(Object.entries(properties).filter(([, property])=> {
    return property.type=='relation';
  }));

  // eslint-disable-next-line guard-for-in
  for (const [key, property] of _properties) {
    properties[key].relation = [];
    delete properties[key].id;
    // console.log(property);
    for (const {id} of property.relation) {
      // console.log(relation);
      // console.log(global.notionCache[id]);
      console.log('CACHE ', cache[id]);
      cache[id] = await notion.retrievePage({id});

      // console.log('ONE ', cache[id]);

      // const relationPage = await notion.retrievePage({id});
      // console.log('LMAO ', relationPage);

      const {title} = await getPageTitle({...cache[id]});
      /* const x = {
        title,
        id: properties[key].id,
      }; */
      // console.log(title)
      properties[key].relation.push(title);
      // properties[key].data
    }
    console.log('CACHE ', cache);
    return;
  }
  /* setTimeout(() => {
    global.notionCache = {};
  }, 20000); */
  // console.log(properties);
  return properties;
};

/**
 * Changes output in a more readable and consumable way
 *
 * @param {entry} Notion page
 * @param {relationBool} boolean ? add the page title to relation properties (has only id by default) : nothing
 * @return {entry} entry refined
 */

const refinePage = async (entry, options) => {
  entry = getPageTitle(entry);
  entry.properties = options.getPageRelations ? await getPageRelations(entry) : entry.properties;
  // console.log('ENTREE', entry);
  return entry;
};

const refineDatabase = (entry) => {
  entry.title = entry?.title?.[0]?.plain_text || '';
  return entry;
};

const refineEntry = async (entry, options) => {
  // DBs have entry.title
  // Pages have title inside properties.title

  entry = entry.object == 'page' ? await refinePage(entry, options) : refineDatabase(entry, options);
  // console.log('REFINE ENTRY', entry);
  return {
    object: entry.object,
    id: entry.id,
    title: entry.title,
    properties: entry.properties,
    // parent: entry.parent,
    url: entry.url,
  };
};

module.exports = async (data, options = {}) => {
  if (options.raw) {
    return data;
  }
  // console.log(data);
  if (data.object == 'list') {
    _data = [];
    // eslint-disable-next-line guard-for-in
    for (const d of data.results) {
      _data.push(await refineEntry(d, options));
    }
  } else {
    _data = await refineEntry(data, options);
  }
  // console.log('REFINE', _data);
  return _data;
};

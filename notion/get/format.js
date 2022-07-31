const deepClone = ((obj) => {
  return JSON.parse(JSON.stringify(obj));
});

global.notion.cache = {
  db: {},
  pages: {},
  page: {},
  block: {},
};

// TODO: https://dev.to/somedood/the-proper-way-to-write-async-constructors-in-javascript-1o8c
// implement this solution here, code below is not good.

class Entry {
  constructor(entry) {
    this.object = entry.object;
    this.id = entry.id;
    this.properties = entry.properties;
    this.url = entry.url;
    this.title = entry.title;
    /* Object.entries(result).forEach(([key, value]) => {
      this[key] = value;
    }); */
  }

  cache(timeout = 400000) {
    setTimeout(() => {
      global.notion.cache[this.object][this.id] = null;
    }, timeout);
    global.notion.cache[this.object][this.id] = this;
  }
}


class Database extends Entry {
  constructor(database, options) {
    super(database);
    this.title = this?.title?.[0]?.plain_text || '';
  }
}

class Page extends Entry {
  constructor(page) {
    super(page);
  }

  static async init(page, options) {
    // console.log('PAGE ', page);
    // console.log('CACHE1 ', global.notion?.cache?.page?.[page.id]);
    const x = new Page(page);
    // console.log(x);
    x.formatTitle();
    // console.log('CACHE2 ', global.notion?.cache?.page?.[page.id]);
    // console.log(options);
    Object.defineProperty(x, 'options', {
      enumerable: false,
      value: {},
    });
    options.formatRelations ? await x.formatRelations() : '';

    x.cache();
    // console.log(global.notion.cache.page[page.id]);
    return x;
  }

  formatTitle() {
    // get title
    const [titleKey, titleObject] = Object.entries(this.properties).find(([, value]) => value.id == 'title');
    // deletes title property from page properties
    delete this.properties[titleKey];
    // adds title to page (instead of being inside properties)
    this.title = titleObject?.title?.[0]?.plain_text || '';
  // console.log('entry.title', entry.title);
  };

  async formatRelations() {
    console.log('formatting relations..');
    const _properties = deepClone(Object.entries(this.properties).filter(([, property])=> {
      return property.type=='relation';
    }));
    // console.log(_properties);

    // eslint-disable-next-line guard-for-in
    for (const [key, {relation}] of _properties) {
    // console.log(relation);
    // eslint-disable-next-line guard-for-in
      for (const i in relation) {
        const {id} = relation[i];
        // console.log(relation);
        // console.log(global.notionCache[id]);
        const get = require('./index.js');
        // console.log(get);
        const {title} = await get('page', {id});
        // console.log('title ', title);

        this.properties[key].relation[i].title = title;
      // properties[key].data
      }
    }
    this.options.relations = true;
  };
};


// TODO: #9 implement cache system, object with id as index

/**
 * Changes output in a more readable and consumable way
 *
 * @param {entry} Notion page
 * @param {relationBool} boolean ? add the page title to relation properties (has only id by default) : nothing
 * @return {entry} entry formatted
 */

entry = async (entry, options) => {
  // DBs have entry.title
  // Pages have title inside properties.title
  return entry.object == 'page' ? await Page.init(entry, options) :
  entry.object == 'database' ? new Database(entry, options) :
  entry;
};

module.exports = async (data, options = {}) => {
  // data = {...data};
  let _data;
  // console.log(data);
  if (data.object == 'list') {
    _data = [];
    // eslint-disable-next-line guard-for-in
    for (const d of data.results) {
      _data.push(await entry(d, options));
    }
  } else {
    _data = await entry(data, options);
  }
  // console.log('FORMAT', _data);
  return _data;
};

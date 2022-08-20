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

class Block extends Entry {
  constructor(block, options) {
    super(block);
  }

  static async init(block, options) {
    Object.defineProperty(block, 'options', {
      enumerable: false,
      value: {},
    });
    console.log(options);
    // if you want the HTML, it goes through a completely different process
    block = options.html ? await Block.parseAsHTML(block) : new Block(block);
    // console.log('PAGE ', page);
    // console.log('CACHE1 ', global.notion?.cache?.page?.[page.id]);
    console.log(block);
    // make property non-iterable


    // console.log(global.notion.cache.page[page.id]);
    return block;
  }

  static parseAsHTML(block) {
    console.log('parsing as HTML...');
    let result = '';
    switch (block.type) {
      case 'paragraph': {
        console.log('identified paragraph...');
        const {rich_text: richText} = block.paragraph;
        result += parseRichText(richText);
        result = `<p>${result}</p>`;
        break;
      }

      case 'heading_1': {
        const {rich_text: richText} = block.heading_1;
        result += parseRichText(richText);
        result = `<h1>${result}</h1>`;
        break;
      }
      case 'heading_2': {
        const {rich_text: richText} = block.heading_2;
        result += parseRichText(richText);
        result = `<h2>${result}</h2>`;
        break;
      }
      case 'heading_3': {
        const {rich_text: richText} = block.heading_3;
        result += parseRichText(richText);
        result = `<h3>${result}</h3>`;
        break;
      }
      case 'bulleted_list_item':
        const {rich_text: richText} = block.bulleted_list_item;
        result += parseRichText(richText);
        console.log('111', (moduleIndex > 0));
        console.log('222', (moduleIndex + 1 < moduleDataArray.length));
        console.log('THE INDEX ', moduleIndex);
        console.log('THE ARRAY ', moduleDataArray[moduleIndex+1]);
        console.log('THE TYPE ', moduleDataArray[moduleIndex+1].type);
        const {type: prevType} = (moduleIndex > 0) ? moduleDataArray[moduleIndex - 1] : {type: 'x'};
        const {type: nextType} = (moduleIndex + 1 < moduleDataArray.length) ? moduleDataArray[moduleIndex + 1] : {type: 'x'};

        const openTag = 'bulleted_list_item' == prevType ? '' : `<ul>`;
        const closeTag = 'bulleted_list_item' == nextType ? '' : `</ul>`;
        // check if previous block is bulleted_list_item
        result = `${openTag}<li>${result}</li>${closeTag}`;
        break;
      case 'numbered_list_item':
        // to implement, Notion ur bullshit, no info about the number in the API
        break;
      case 'image':
        console.log('identified image...');
        const {image} = block;
        const src = image.type == 'external' ? image.external.url :
        image.type == 'file' ? image.file.url : '';
        result = `<figure><img src="${src}"><figcaption>${getCaption(image)}</figcaption></figure>`;
        break;
      case 'bookmark':
        const {bookmark} = block;
        const {url} = bookmark;
        // need to check url and fill with metadata
        result = `<div class="bookmark"><a href="${url}"></a><caption>${getCaption(bookmark)}</caption></div>`;
        break;
    }
    return result;

    function getCaption(blockObj) {
      return blockObj.caption.length ? parseRichText(blockObj.caption) : '';
    }

    function parseRichText(richText) {
      console.log('RICHTEXT ', richText);
      if (richText.mention) {
        return;
      }
      let result = '';
      richText.forEach(({text, annotations, href, mention}, i) => {
        if (mention) return;
        // internal mentions need to be converted into website links.
        // provide domain as parameter and it can be done, I think?
        // shiet the slugs.

        let {content} = text;
        if (!content.trim()) {
          return;
        }

        content = annotations.bold ? `<b>${content}</b>` :content;
        content = annotations.italic ? `<i>${content}</i>` :content;
        content = annotations.strikethrough ? `<s>${content}</s>` :content;
        content = annotations.underline ? `<u>${content}</u>` :content;
        content = annotations.code ? `<code>${content}</code>` :content;
        content = annotations.color && annotations.color != 'default' ? `<span style="color:${annotations.color}">${content}</span>` :
        content;

        // TO-DO: if adjacent text has same url, merge it
        // if the previous is the same, don't open the tag
        // if the next is the same, don't close the tag
        if (href) {
          console.log(i, i > 0, i < richText.length);
          console.log('PREV', richText[i -1]);
          console.log('NEXT', richText[i+1]);
          const {href: prevHref} = (i > 0) ? richText[i - 1] : {href: 'x'};
          const {href: nextHref} = (i +1 < richText.length) ? richText[i + 1] : {href: 'x'};

          const x = href == prevHref ? '' : `<a href="${href}" target="_blank">`;
          const y = href == nextHref ? '' : `</a>`;
          content = `${x}${content}${y}`;
        }

        console.log('result_content', content);


        result += content;
      });
      return result;
    };
  }
}


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
  entry.object == 'block' ? Block.init(entry, options) :
  entry;
};

moduleDataArray = [];
moduleIndex = 0;

module.exports = async (data, options = {}) => {
  // console.log('format..');
  // data = {...data};
  let _data;
  // console.log(data);
  if (data.object == 'list') {
    // save as global variable to manage bulleted_list_item (and more probably)
    moduleDataArray = data.results;
    _data = [];
    moduleIndex = 0;
    // eslint-disable-next-line guard-for-in
    for (const d of data.results) {
      _data.push(await entry(d, options));
      moduleIndex++;
    }
  } else {
    _data = await entry(data, options);
  }
  // console.log('FORMAT', _data);
  return options.html ? _data.join('') : _data;
};

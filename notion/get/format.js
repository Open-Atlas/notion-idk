const { page } = require('./static.js');

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
		const _properties = deepClone(Object.entries(this.properties).filter(([, property]) => {
			return property.type == 'relation';
		}));
		// console.log(_properties);

		// eslint-disable-next-line guard-for-in
		for (const [key, { relation }] of _properties) {
			// console.log(relation);
			// eslint-disable-next-line guard-for-in
			for (const i in relation) {
				const { id } = relation[i];
				// console.log(relation);
				// console.log(global.notionCache[id]);
				const get = require('./index.js');
				// console.log(get);
				const { title } = await get('page', { id });
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
		// console.log('BLOCK_ ', JSON.stringify(block.type));
		// if you want the HTML, it goes through a completely different process
		block = options.html ? await Block.parseAsHTML(block) : new Block(block);
		// console.log('PAGE ', page);
		// console.log('CACHE1 ', global.notion?.cache?.page?.[page.id]);
		// console.log(block);
		// make property non-iterable


		// console.log(global.notion.cache.page[page.id]);
		return block;
	}

	static async parseAsHTML(block) {
		// console.log('parsing as HTML...');
		// console.log('HTML_BLOCK ', JSON.stringify(block));
		let result = '';
		let tag = '';
		switch (block.type) {
			case 'paragraph':
			// console.log('HTML BLOCK PARSE ', JSON.stringify(block.paragraph.rich_text));
			case 'heading_1':
			case 'heading_2':
			case 'heading_3': {
				tag = block.type == 'paragraph' ? 'p' :
					block.type == 'heading_1' ? 'h1' :
						block.type == 'heading_2' ? 'h2' :
							block.type == 'heading_3' ? 'h3' : '';
				const { rich_text: richText } = block[block.type];
				// console.log('RICHTEXT ', richText);
				result += await parseRichText(richText, `<${tag}%ATTRIBUTES%>%TEXT%</${tag}>`);
				break;
			}
			case 'bulleted_list_item':
				const { rich_text: richText } = block.bulleted_list_item;
				result += await parseRichText(richText);
				/* console.log('111', (moduleIndex > 0));
				console.log('222', (moduleIndex + 1 < moduleDataArray.length));
				console.log('THE INDEX ', moduleIndex);
				console.log('THE ARRAY ', moduleDataArray[moduleIndex + 1]);
				console.log('THE TYPE ', moduleDataArray[moduleIndex + 1].type); */
				const { type: prevType } = (moduleIndex > 0) ? moduleDataArray[moduleIndex - 1] : { type: 'x' };
				const { type: nextType } = (moduleIndex + 1 < moduleDataArray.length) ? moduleDataArray[moduleIndex + 1] : { type: 'x' };

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
				const { image } = block;
				const src = image.type == 'external' ? image.external.url :
					image.type == 'file' ? image.file.url : '';
				result = await getCaption(image.caption || {}, `<figure><img src="${src}"%ATTRIBUTES%>%CAPTION%</figure>`, "figcaption");
				break;
			case 'bookmark':
				const { bookmark } = block;
				const { url } = bookmark;
				// need to check url and fill with metadata
				result = await getCaption(bookmark.caption || {}, `<div class="bookmark"%ATTRIBUTES%><a href="${url}"></a>%CAPTION%</div>`, "caption");
				break;
			case 'divider':
				result = '<hr/>';
				break;
			case 'code':
				result = `<pre class="${block.code.language}">${block.code.rich_text[0].plain_text}</pre>`;
				break;
			/* case 'mention':
			  console.log('mentions');
			  if (block.mention.type == 'page') {
				const {id} = block.mention.type.page;
				const x = page(id);
				console.log('MENTION_ ', x);
			  }
			  break; */
		}
		return result;

		async function getCaption(caption, element, tag) {
			return caption.length ?
				await parseRichText(caption,
					element.replace("%CAPTION%", `<${tag}>%TEXT%</${tag}>`))
				: element.replace("%CAPTION%", "").replace("%ATTRIBUTES%", "");
		}

		async function parseRichText(richText, element = undefined) {
			// console.log('RICHTEXT ', richText);
			if (richText.mention) {
				return;
			}
			let result = '';
			let attributes = '';
			// search with shortcode regex
			// create html to employ
			// delete the shortcode

			// style class
			// console.log('PARSERICHTEXT ', richText);
			// eslint-disable-next-line guard-for-in
			for (const i in richText) {
				const block = richText[i];
				// console.log('BLOCK ', block);
				const { type, annotations, href } = block;
				// internal mentions need to be converted into website links.
				// provide domain as parameter and it can be done, I think?
				// shiet the slugs.

				let content = '';
				let x = '';

				switch (type) {
					case 'text':
						content = block.text.content;

						// console.log('HALLO? ', content);
						try {
							// parse class and style
							x = await content.match(/(\${.+})/)[0];
							// console.log('THE MATCH ', x);
							try {
								content = content.replace(x, '');
								// console.log('REPLACE ', content);
								x = await x.replaceAll('”', '"');
								// console.log('JSON PARSE 1 ', x);


								if (x.length) {
									x = await JSON.parse(x.substring(1));
									console.log('parsed ', x);
									if (x.class) {
										attributes += ` class="${x.class}"`;
									}
									if (x.style) {
										attributes += ` style="${x.style}"`;
									}
									// console.log('JSON PARSED ', x);
								}
							} catch (e) {
								console.log(e);
							}
						} catch (e) {
							// console.error('AAA ', e);
						}
						break;
					// TODO: getting mention of user? need to fix
					case 'mention':
						console.log('mention block ', block.mention);
						if (block.mention.type == 'page') {
							const { id } = block?.mention?.page;
							try {
								// TODO: this is too specific for my use case, could make it more generalized
								// or build another service on top of it
								const entityMentioned = await page(id);
								const slug = entityMentioned.properties.slug.rich_text?.[0].plain_text;
								console.log('MENTION_ ', slug);
								content = `<a target="_blank" href="<BLOG>${slug}">${block.plain_text}</a>`;
							} catch (e) {
								console.error('INLINE MENTION ERROR ', e);
							}
						}
						break;
				}

				console.log('_CONTENT ', content);


				if (!content.trim()) {
					continue;
				}

				content = annotations.bold ? `<b>${content}</b>` : content;
				content = annotations.italic ? `<i>${content}</i>` : content;
				content = annotations.strikethrough ? `<s>${content}</s>` : content;
				content = annotations.underline ? `<u>${content}</u>` : content;
				content = annotations.code ? `<code>${content}</code>` : content;
				content = annotations.color && annotations.color != 'default' ? `<span style="color:${annotations.color}">${content}</span>` :
					content;

				// TO-DO: if adjacent text has same url, merge it
				// if the previous is the same, don't open the tag
				// if the next is the same, don't close the tag
				if (href && type != 'mention') {
					/* console.log(i, i > 0, i < richText.length);
					console.log('PREV', richText[i - 1]);
					console.log('NEXT', richText[i + 1]); */
					const { href: prevHref } = (i > 0) ? richText[i - 1] : { href: 'x' };
					const { href: nextHref } = (i + 1 < richText.length) ? richText[i + 1] : { href: 'x' };

					const x = href == prevHref ? '' : `<a href="${href}" target="_blank">`;
					const y = href == nextHref ? '' : `</a>`;
					content = `${x}${content}${y}`;
				}

				// console.log('result_content', content);

				console.log('ALMOSTRESULT ', content);
				result += content;
			};
			return element ? element.replace("%TEXT%", result).replace("%ATTRIBUTES%", attributes) : result;
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

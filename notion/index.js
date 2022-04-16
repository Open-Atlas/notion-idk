const {Client} = require('@notionhq/client');
const db = require('../neo4j/db.js');
const sampleData = require('./sample.json');

const notion = new Client({auth: process.env.NOTION_API_KEY});
// TODO: #4 find a way to have a main branch without console.logs

const deepClone = ((obj) => {
  return JSON.parse(JSON.stringify(obj));
});

// conditional console.log function

// TODO: create relationship from block to page in case the block is a link, see POSTMAN documentation RETRIEVE BLOCK - LINK TO PAGE https://open-atlas.postman.co/workspace/Open-Atlas~30cd5d2f-5eec-4a2a-9710-2930b1dbbe83/documentation/7075921-e61672b7-4165-4916-ad76-222babf24c19?entity=request-7075921-96f60b4e-21f4-4036-a0dc-f70171872bde

const getPageTitle = (entry) => {
  // doesn't work if string is empty
  // const [, {title: [{plain_text}]}] = Object.entries(properties).find(([, value]) => value.id == 'title');

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

const getPageRelation = async ({properties}) => {
  _properties = deepClone(Object.entries(properties).filter(([, property])=> {
    return property.type=='relation';
  }));

  // eslint-disable-next-line guard-for-in
  for (const [key, property] of _properties) {
    properties[key].relation = [];
    delete properties[key].id;
    // console.log(property);
    for (const relation of property.relation) {
      // console.log(relation);
      const {title} = getPageTitle(await this.retrievePage(relation.id));
      const x = {
        title,
        id: properties[key].id,
      };
      // console.log(title)
      properties[key].relation.push(title);
    }
  }

  // console.log(properties);
  return properties;
};

const refinePage = async (entry) => {
  entry = getPageTitle(entry);
  // entry.properties = await getPageRelation(entry);
  // console.log('ENTREE', entry);
  return entry;
};

const refineDatabase = (entry) => {
  entry.title = entry?.title?.[0]?.plain_text || '';
  return entry;
};

const refineEntry = async (entry) => {
  // DBs have entry.title
  // Pages have title inside properties.title

  entry = entry.object == 'page' ? await refinePage(entry) : refineDatabase(entry);
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

const refine = async (data) => {
  // console.log(data);
  if (data.object == 'list') {
    _data = [];
    // eslint-disable-next-line guard-for-in
    for (const d of data.results) {
      _data.push(await refineEntry(d));
    }
  } else {
    _data = await refineEntry(data);
  }
  // console.log('REFINE', _data);
  return _data;
};

try {
  exports.wrapper = async () => {

  };
  // all requests go through a refinement / formatting
  exports.request = async function request({requestType, param = undefined}) {
    return refine(await this[requestType](param));
  };
	
	// requests for data unformatted, same as Notion's API
	exports.requestRaw = async function request({requestType, param = undefined}) {
    return await this[requestType](param);
  };

  // search
  exports.search = async (query = undefined, filter = {}) => { // filter 'database' or 'page'
    return await notion.search({
      query,
    });
  // returns array
  };

  exports.searchDb = async (query = undefined) => {
    return await notion.search({
      query,
      filter: {
        value: 'database',
        property: 'object',
      },
    });
  };

  // Query DB
  exports.queryDb = async (id) => {
    // const id = '06073101bbd34ec19434568c515060ec';
    return await notion.databases.query({
      database_id: id,
    });
    // returns array
  };

  // Query Page
  exports.retrievePage = async (id) => {
    return await notion.pages.retrieve({page_id: id});
  // returns object
  };
	
updatePage = async (id, properties) => {
	return await notion.pages.update({
    page_id: id,
		properties
    // properties: {
    //   'In stock': {
    //     checkbox: true,
    //   },
    // },
  }).then(async page => {
		const {title} = await getPageTitle(page)
		console.log(`${title} UPDATED WITH ${JSON.stringify(properties)}`)
	});
}
	
	
	
	exports.retrievePageProperties = async (pageId, propertyId) => {
  return await notion.pages.properties.retrieve({ page_id: pageId, property_id: propertyId });
}
	
exports.retrieveBlockChildren = async (id) => {
	return await notion.blocks.children.list({
    block_id: id,
    page_size: 50,
  });
}

exports.retrieveBlock = async (id) => {
	return await notion.blocks.retrieve({
    block_id: id
  });
}

  exports.retrieveDb = async (id) => {
    return await notion.databases.retrieve({database_id: id});
  };


  // TODO: #5 sync also citations from page to page

  exports.sync = async () => {
    const databases = await this.request({requestType: 'searchDb'});
    // console.log('SYNC', databases);

    await db.deleteAll(); // deletes everything

    databases.forEach((entry) => {
      this.syncOne(entry);
    });
  };

  exports.syncOne = async (database) => {
    const pages = await this.request({requestType: 'queryDb', param: database.id});

    // first we create all the nodes
	  // TODO: find a way to make creations parallel, but still 'await' for the whole creation process (it doesn't completely wait for this loop to finish)
    for (const page of pages) {
		// TODO: create object of update rather than sending singular parameters
		
		//const properties = page.properties
		
      await db.mergeNode(
		  page.id,
		  database.title, // Label
		  page.title, // Name
		  page.url // Notion URL
	  );
    }
    // then the relationships (previously the async queries created duplicated nodes)
    pages.forEach((page) => {
      Object.entries(page.properties).forEach(([key, property]) => {
        const relationName = key.split('  ')[0];
        if (!relationName) {
          return;
        }
        switch (property.type) {
          case 'relation':
            property.relation.forEach((relation) => {
              // create relationship
              /* obj1 = {
                id: page.id,
              };
              obj2 = {
                id: relation.id,
              }; */

              db.merge(page.id, relationName, relation.id); // implement direction & label
            });
            break;
			case 'files':
				const filesArray = property.files.map(x => x.name)
				console.log(page.title, filesArray)
				filesArray.length ? db.updateNode(page.id, key, filesArray) : ""
				break;
			case 'url':
				db.updateNode(page.id, key, property.url)
				break;
			case 'rich_text':
				property.rich_text?.[0]?.plain_text ? (db.updateNode(page.id, key, property.rich_text[0].plain_text)) : "";
				break;
        }
      });
    });

    return true;
  };
}catch(e){
	console.log(e)
}

exports.relationJson = () => {
  /* needs to look like this
  {
    "Name": "Karl Marx",
    "Books": "https://www.notion.so/Manifesto-of-the-Communist-Party-2074c071df3d4668b278cb561c9b6bf2",
    "Documents": "",
    "Courses": "",
    "Related to Articles (Authors)": "",
    "Related to Quotes (Assign)": "",
    "Related to Quotes (Property)": ""
  },

  //Person
  {
    "id": "...",
    "name": "Karl Marx"
    "non-relation-data": "..."
  }

  //Person to Book
  {
    "id-person": "...",
    "id-book": "..."
  }

  //Book
  {
    "id": "...",
    "name": "Comunist Manifesto",
    "non-relation-data": "..."
  }
  */

  /*    const personList = [

    ]; */

  const relationList = {};

  // multiple CSVs based on the number of relationships
  // person to book
  // person to article

  x = {
    title: 'title',
  };

  // console.log(sampleData)
  Object.entries(sampleData[0].properties).forEach(([key, property]) => {
    switch (property.type) {
      case 'relation':
        relationList[key] = [];
        break;
    }
  });

  sampleData.forEach((entry) => {
    Object.entries(entry.properties).forEach(([key, property]) => {
      switch (property.type) {
        case 'relation':
          property.relation.forEach((relation) => {
            relationList[key].push(
                {
                  personId: entry.id,
                  bookId: relation.id,
                },
            );
          });
          delete entry.properties[key];
          break;
      }
      delete entry.object;
      // console.log(entry);
    });
  });

  // console.log(relationList);
  // console.log(sampleData);

  return relationList;
};

exports.relationSync = async (id) => { //database id
	
	const { results: pages } = await notion.databases.query({
      database_id: id,
	})
    // returns array
  
	let title;
		
	pages.forEach(async (page) => {
		[[, {title}]] = Object.entries(page.properties).filter(([key, property]) => property.id == 'title')
		// if(title[0].plain_text == "In published articles, every entity with a specific name (company, brand..) is a mention (link), but just the first one is highlighted. (possibly "){
		// 	console.log("SYNC ", title)
		// }
		const mentions = title.filter(block => block.type=='mention')
		//  if(title[0].plain_text == "In published articles, every entity with a specific name (company, brand..) is a mention (link), but just the first one is highlighted. (possibly "){
		// 	console.log("SYNC ", mentions)
		// }
		
		const mentionsTitles = []
		
		for (const {mention} of mentions){
			switch (mention.type){
				case 'page':
					//query
					try{
					const {title: mentionTitle} = await refine(await this['retrievePage'](mention.page.id))
					mentionsTitles.push(mentionTitle)
					} catch(e){
						console.log(mention.page.id, ' PAGE NOT FOUND')
					}
					
					
			}
		}
		
		const {properties: databaseProperties} = await this.retrieveDb(id)
		try{
		!databaseProperties.Mentions ? await updateDatabase(id, {"properties":{"Mentions":{"rich_text":{}}}}) : ''
		} catch(e){
			console.log("MENTIONS UPDATE ERROR", e)
		}
		
		const properties = {
						Mentions: {
							"type": "rich_text",
							"rich_text": [
								{
									"type": "text",
									"text": {
										"content":  mentionsTitles.join(" "),
										"link": null
									},
								}
							]
						}
					}
		try{
			mentionsTitles.length ? await updatePage(page.id, properties) : ''
		}catch(e){
			console.log("Error with page update", e)
		}
		//take mentions and update properties
	})	
	
	//read title
	//get all the type "mention"
	//query its ID and get the name
	//create/update the property with the mentions found
}

var axios = require('axios');
//update database is not included in the notion js sdk - see docmentation https://developers.notion.com/reference/update-a-database
const updateDatabase = async (id, properties) => {
	//encodeURI(id);
	await axios.patch(`https://api.notion.com/v1/databases/${id}`, properties, {
		headers: {
			'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
			'Content-Type': 'application/json',
			'Notion-Version': '2022-02-22'
		}
	})
}
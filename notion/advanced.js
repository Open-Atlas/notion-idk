const notion = require('./index.js');
const refine = require('./refine.js');
const db = require('../neo4j/db.js');

const examplePage = require('./exampleData/page.json');


// TODO: #5 sync also citations from page to page

exports.sync = async () => {
  const databases = await notion.request({requestType: 'searchDb'});
  // console.log('SYNC', databases);

  await db.deleteAll(); // deletes everything

  databases.forEach((entry) => {
    this.syncOne(entry);
  });
};

exports.syncOne = async (database) => {
  const pages = await notion.request({requestType: 'queryDb', param: database.id});

  // first we create all the nodes
  // TODO: find a way to make creations parallel, but still 'await' for the whole creation process (it doesn't completely wait for this loop to finish)
  for (const page of pages) {
    // TODO: create object of update rather than sending singular parameters

    // const properties = page.properties

    await db.mergeNode(
        page.id,
        database.title, // Label
        page.title, // Name
        page.url, // Notion URL
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
          const filesArray = property.files.map((x) => x.name);
          console.log(page.title, filesArray);
					filesArray.length ? db.updateNode(page.id, key, filesArray) : '';
          break;
        case 'url':
          db.updateNode(page.id, key, property.url);
          break;
        case 'rich_text':
					property.rich_text?.[0]?.plain_text ? (db.updateNode(page.id, key, property.rich_text[0].plain_text)) : '';
          break;
      }
    });
  });

  return true;
};

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

exports.relationSync = async (id) => { // database id
  const {results: pages} = await notion.databases.query({
    database_id: id,
  });
  // returns array

  let title;

  pages.forEach(async (page) => {
    [[, {title}]] = Object.entries(page.properties).filter(([key, property]) => property.id == 'title');
    // "In published articles, every entity with a specific name (company, brand..) is a mention (link),
    // but just the first one is highlighted. (possibly "){
    // 	console.log("SYNC ", title)
    // title[0].plain_text
    const mentions = title.filter((block) => block.type == 'mention');

    const properties = {
      Mentions: {
        'type': 'rich_text',
        'rich_text': [],
      },
    };

    for (const {mention, plain_text: mentionTitle, href: mentionHref} of mentions) {
      switch (mention.type) {
        case 'page':

          properties.Mentions.rich_text.push(
              {
                'type': 'text',
                'text': {
                  'content': properties.Mentions.rich_text.length ? ' \n' + mentionTitle : mentionTitle,
                  // separator as environment variable
                  'link': {
                    url: mentionHref,
                  },
                },
              },
          );

				// query
				// try{
				// const {title: mentionTitle} = await refine(await this['retrievePage'](mention.page.id))
				// mentionsData.push(mentionTitle)
				// } catch(e){
				// 	console.log(mention.page.id, ' PAGE NOT FOUND')
				// }
      }
    }

    const {properties: databaseProperties} = await notion.retrieveDb(id);
    try {
			// update db schema in case the mentions property does not exist
			!databaseProperties.Mentions ?
				await notion.updateDatabase(id, {'properties': {'Mentions': {'rich_text': {}}}}) :
				'';
    } catch (e) {
      console.log('MENTIONS UPDATE ERROR', e);
    }

    console.log(properties);
    // add link to page, icon if the page has it

    try {
			properties.Mentions.rich_text.length ? await notion.updatePage(page.id, properties) : '';
    } catch (e) {
      // console.log("Error with page update", e)
    }
    // take mentions and update properties
  });

  // read title
  // get all the type "mention"
  // query its ID and get the name
  // create/update the property with the mentions found
};

exports.testPagesRelations = async (id) => {
  const pages = await notion.request({requestType: 'queryDb', param: id}, {getPageRelations: true});
  return pages;
};

exports.formulaTitleProperty = async (id) => {
  const pages = await notion.request({requestType: 'queryDb', param: id}, {getPageRelations: true});

  let title;

  pages.forEach((page) => {
    // const t = Object.entries(page.properties).find(([key, property]) => property.id == 'title')

    propertyVariables = {};

    Object.entries(page.properties)
        .filter(([key, property]) => !key.includes('${'))
        .forEach(([key, property]) => {
          switch (property.type) {
            case 'number':
              propertyVariables[key] = property.number;
              break;
            case 'formula':
              propertyVariables[key] = property.formula[property.formula.type];
              break;
            case 'relation':
              propertyVariables[key] = property.relation.join(', ');
              break;
            case 'rich_text':
              propertyVariables[key] = property.rich_text?.[0]?.plain_text || '';
              break;
          }
        });
    // console.log(propertyVariables)

    Object.entries(page.properties)
        .filter(([key, property]) => key.includes('${'))
        .forEach(async ([key, property]) => {
          // console.log(property.rich_text)

          // formula should also be supported
          if (property.type != 'rich_text') {
            throw 'DERIVATED PROPERTY MUST BE TYPE rich_text';
          }

          // TO-DO: create function that iterates through all the rich_text[].plain_text and returns the sum of all .plain_text
          let text = property.rich_text?.[0]?.plain_text || '';
          // console.log("TEXT ", text)

          Object.entries(propertyVariables).forEach(([name, value]) => {
            text = text.replace('${' + name + '}', value).newTrim();
          });

          const properties = {
            [key.replace(/\${(\w+)}/g, '$1')]: {
              'type': 'title',
              'title': [
                {
                  'type': 'text',
                  'text': {
                    'content': text,
                  },
                },
              ],
            },
          };

          await updatePage(page.id, properties);

          // console.log(text)
        });


    // console.log(propertyVariables)
  });

  return true;
};

// eslint-disable-next-line no-extend-native
String.prototype.newTrim = function newTrim() {
  // console.log(this.valueOf())
  return this.valueOf().trim().replace(/\s+/g, ' ');
};

exports.formatPage = formatPage = (page) => {
  // page = examplePage;
  const {Software, Naming, Currency, Country, Price, Platforms} = page.properties;
  const newPage = {
    'id': page.id,
    Currency,
    Naming,
    // 	Price,
    'Price per Month': page.properties['Price per Month'],
  };

  newPage.properties = {};

  Object.entries(page.properties)
      .filter(([key, property]) => key.includes('${') || ['Software', 'Naming', 'Currency', 'Country', 'Price', 'Platforms', 'Price per Month'].includes(key) ? false : true)
      .forEach(([key, property]) => {
        newPage.properties[key] = property;
      });

  return newPage;
};


exports.makeHierarchy = async ({id}) => {
  const pages = await notion.request('queryDb', {id}, {getPageRelations: true});

  // console.log(pages[0])

  const softwareList = {};

  // [Software][Country] - sorted by price
  // [Audible][Italy][]

  // group by Software
  // group by country
  // group by price


  /**
		 * Changes output in a more readable and consumable way
		 *
		 * @param {s} Software
		 * @param {c} Country
		 */
  pages.forEach((page) => {
    page.properties.Software.relation.forEach((s) => {
      page.properties.Country.relation.forEach((c) => {
        // console.log(s, " " , c)
        // yada yada - creating softwareList[softwareName][countryName][{data}]
        softwareList[s] = softwareList[s] || {};
        softwareList[s][c] = softwareList[s][c] && softwareList[s][c].length ?
					[...softwareList[s][c], formatPage(page)] :
					[formatPage(page)];
      });
    });
  });

  Object.entries(softwareList).forEach(([s, sV]) => {
    Object.entries(sV).forEach(([c, cV]) => {
      cV.sort((a, b) => a['Price per Month'].number - b['Price per Month'].number);

      for (let i = 1; i < cV.length; i++) {
        // console.log(cV[i])

        Object.entries(cV[i - 1].properties).forEach(async ([index, parentV]) => {
          // empty or?
          childSelect = cV[i].properties[index].select?.name;
          parentSelect = cV[i - 1].properties[index].select?.name?.replace('∇', '');

          if ((!childSelect || childSelect.includes('∇')) && parentSelect) {
            const propertiesUpdate = {
              properties: {
                [index]: {
                  select: {
                    name: '∇' + parentSelect,
                  },
                },
              },
            };

            await notion.updateDatabase(cV[i].id, propertiesUpdate);
          }
        });
      }
    });
  });

  Object.entries(softwareList).forEach(([s, sV]) => {
    Object.entries(sV).forEach(([c, cV]) => {

    });
  });
  // console.log(softwareList)

  // ∇ as inherited
  // console.log(softwareList)
  return softwareList;

  let title;
  pages.forEach((page) => {
    // const t = Object.entries(page.properties).find(([key, property]) => property.id == 'title')

    propertyVariables = {};

    Object.entries(page.properties)
        .filter(([key, property]) => !key.includes('${'))
        .forEach(([key, property]) => {
          switch (property.type) {
            case 'number':
              propertyVariables[key] = property.number;
              break;
            case 'formula':
              propertyVariables[key] = property.formula[property.formula.type];
              break;
            case 'relation':
              propertyVariables[key] = property.relation.join(', ');
              break;
            case 'rich_text':
              propertyVariables[key] = property.rich_text?.[0]?.plain_text || '';
              break;
          }
        });
    // console.log(propertyVariables)

    Object.entries(page.properties)
        .filter(([key, property]) => key.includes('${'))
        .forEach(async ([key, property]) => {
          // console.log(property.rich_text)

          // formula should also be supported
          if (property.type != 'rich_text') {
            throw 'DERIVATED PROPERTY MUST BE TYPE rich_text';
          }

          // TO-DO: create function that iterates through all the rich_text[].plain_text and returns the sum of all .plain_text
          let text = property.rich_text?.[0]?.plain_text || '';
          // console.log("TEXT ", text)

          Object.entries(propertyVariables).forEach(([name, value]) => {
            text = text.replace('${' + name + '}', value).newTrim();
          });

          const properties = {
            [key.replace(/\${(\w+)}/g, '$1')]: {
              'type': 'title',
              'title': [
                {
                  'type': 'text',
                  'text': {
                    'content': text,
                  },
                },
              ],
            },
          };

          await updatePage(page.id, properties);

          // console.log(text)
        });


    // console.log(propertyVariables)
  });

  return true;
};

exports.addSelectOption = async ({id}) => {
  const database = await notion.retrieveDb({id});

  // return await notion.updateDatabase(id, {"properties": {
  // 	"Reviews": {
  // 		"select": {
  // 			options: [
  // 				{
  // 					name: "∇✓",
  // 					"color": "green"
  // 				},
  // 			]
  // 		}
  // 	}
  // }})


  const propertiesUpdate = {properties: {}};

  Object.entries(database.properties)
      .filter(([name, property]) => property.type == 'select')
      .forEach(([name, property]) => {
        delete property.id;
        delete property.name;
        delete property.type;

        property.select.options = [
          {
            'name': '✓',
            'color': 'green',
          },
          {
            'name': '✕',
            'color': 'red',
          },
          {
            'name': '∇✓',
            'color': 'green',
          },
          {
            'name': '∇✕',
            'color': 'red',
          },
        ];

        // console.log(property)

        propertiesUpdate.properties[name] = property;
      });

  // console.log(JSON.stringify(propertiesUpdate))
  notion.updateDatabase(id, propertiesUpdate);
  // can't update everything together

  // notion.updateDatabase(id, propertiesUpdate)
};

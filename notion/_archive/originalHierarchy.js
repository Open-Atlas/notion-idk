const notion = require('../index.js');
const refine = require('../refine.js');

const examplePage = require('../exampleData/page.json');



// eslint-disable-next-line no-extend-native
String.prototype.newTrim = function newTrim() {
  // console.log(this.valueOf())
  return this.valueOf().trim().replace(/\s+/g, ' ');
};

const formatPage = (page) => {
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


module.exports = async ({id}) => {
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
     * @param {p} PricingPlan
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

  // const pageUpdate = [];

  Object.entries(softwareList).forEach(([s, sV]) => {
    console.log('- - - SOFWARE ', s);
    Object.entries(sV).forEach(([c, cV]) => {
      console.log('- - COUNTRY ', c);
      cV.sort((a, b) => a['Price per Month'].number - b['Price per Month'].number);

      cV.forEach( (p, i) => {
        console.log('- PRICE ', p['Price per Month']);

        Object.entries(cV[i].properties).forEach(([propertyName, childV]) => {
          if (childV.type != 'select') {
            return;
          }
          // empty or?
          childSelect = cV[i].properties[propertyName].select?.name;
          parentSelect =
            cV?.[i - 1]?.properties?.[propertyName]?.select?.name?.replace('∇', '') ||
            sV?.[c != 'Worldwide' ? 'Worldwide' : null]?.[i]?.properties?.[propertyName].select?.name?.replace('∇', '');

          console.log('PROPERTY ', propertyName);
          console.log('child ', childSelect);
          console.log('parent ', parentSelect);

          if (!childSelect || (childSelect.includes('∇') /* && !childSelect.includes(parentSelect)*/)) {
            // need the updated properties for the next iteration, but also for updating the Notion DB
            // can't update properties individually
            if (parentSelect == '✓') {
              cV[i].properties[propertyName].select = {
                name: '∇' + parentSelect,
              };
            } else {
              cV[i].properties[propertyName].select = null;
            }
          } else {
            return;
          }
        });
        // console.log(pageUpdate);
      });
    });
  });

  /* pageUpdate.properties[propertyName] = {
    type: 'select',
    select: {
      name: '∇' + parentSelect,
    },
  };

  pageUpdate.properties[propertyName] = {
    type: 'select',
    select: null,
  }; */

  Object.entries(softwareList).forEach(([s, sV]) => {
    Object.entries(sV).forEach(([c, cV]) => {
      cV.forEach(async (p, i) => {
        await notion.updatePage({id: p.id, properties: p.properties});
      });
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

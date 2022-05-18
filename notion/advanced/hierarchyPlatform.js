const get = require('../get');
const update = require('../update');
const pages = require('../exampleData/podcastForHierarchy.json');

class RichText {
  static plainText(richText) {
    let plainText = '';
    richText.forEach((text) => {
      plainText += ' ' + text.plain_text;
    });
    return plainText.trim();
  }
}

module.exports = async ({id}) => {
  // const pages = await get('pages', {id, formatRelations: true});

  const softwareList = {};

  // [Software][Country] - sorted by price
  // [Audible][Italy][]

  // group by Software
  // group by country
  // group by pricing plan
  // group by platform

  // query pricing plans
  // create array and order them
  // save id

  // query platforms
  // associated platform to array through ID


  /**
   * Changes output in a more readable and consumable way
   * @param {s} Software
   * @param {c} Country
   * @param {pp} PricingPlan
   * @param {p} Platform
   */

  // TODO: make hierarchy more selective
  // normally it would be plain sequential, but there may be cases where this does not fit
  for (const page of pages) {
    // console.log(page);
    for (const {title: s} of page.properties.Software.relation) {
      // console.log(s);
      softwareList[s] = softwareList[s] || {};
      for (const {title: c} of page.properties.Country.relation) {
        // console.log('c');
        softwareList[s][c] = softwareList[s][c] || [];
        const index = parseInt(page.properties['Price per Month'].number || 0);
        s == 'Pocket Casts' ? console.log(index) : '';
        softwareList[s][c][index] = softwareList[s][c][index] || {};
        // save price data in softwareList
        Object.defineProperty(softwareList[s][c][index], 'info', {
          value: {
            price: page.properties['Price per Month'].number,
            naming: RichText.plainText(page.properties.Naming.rich_text),
          },
          enumerable: false,
        });
        // console.log(index);
        for (const {id} of page.properties._Platform.relation) {
          // console.log('p');
          // query for platformPage
          const platformPage = await get('page', {id});
          // console.log(platformPage);
          let p = '';
          platformPage.properties.Platform.rich_text.filter((block) => block.type=='mention')
              .forEach((mention)=> p+= ' ' + mention.plain_text);
          p = p.trim().replaceAll(' ', '-');

          softwareList[s][c][index][p]=formatPage(platformPage);
          /* softwareList[s][c][index] = softwareList[s][c][index] && softwareList[s][c][index].length ?
                        [...softwareList[s][c][index][p], formatPage(platformPage)] :
                        [formatPage(platformPage)]; */
        }
        // s == 'Pocket Casts' ? console.log(softwareList[s][c]) : '';
        // calculate number of mentions in title (how many platforms the entry is considering) and sort by that


      /*   //query Platform and get data
        // titleOfPlatform : {data}
        anArray.push(platformData)
        // console.log(s, " " , c)
        // yada yada - creating softwareList[softwareName][countryName][{data}]
        softwareList[s] = softwareList[s] || {};
        softwareList[s][c] = softwareList[s][c] && softwareList[s][c].length ?
                      [...softwareList[s][c], formatPage(page)] :
                      [formatPage(page)]; */
      };
    };
  };

  // deletes empty array entries caused by using the price as index
  Object.entries(softwareList).forEach(([s]) =>{
    Object.entries(softwareList[s]).forEach(([c]) =>{
      // console.log(c);
      // console.log(softwareList[s][c]);
      softwareList[s][c] = softwareList[s][c].filter((x) => x);
      // console.log('AFTER ', softwareList[s][c]);
    });
  });

  // softwareList = require('../exampleData/softwareList.json');

  // console.log(JSON.stringify(softwareList));

  /* const x = {Audible:
    {Worldwide:
      [
        {iOS: {}, Android_iOS: {}},
        {iOS: {}, Android_iOS: {}},
      ],
    },
  US:
      [
        {iOS: {}, Android_iOS: {}},
        {iOS: {}, Android_iOS: {}},
      ],
  }; */

  // const pageUpdate = [];

  Object.entries(softwareList).forEach(([s, country]) => {
    console.log('- - - SOFTWARE ', s);
    Object.entries(country).forEach(([c, pricingPlan]) => {
      console.log('- - COUNTRY ', c);

      // console.log(cV);

      // pricingPlan array with platforms as objects
      // ex. [{Android:{...}, iOS:{...}}]
      pricingPlan.forEach( (platforms, i) => {
        // pricingPlan.platforms array with platforms as array of objects (to sort platforms)
        // ex. [[Android, {...}, [iOS, {...}]]]
        pricingPlan.platforms = pricingPlan.platforms || [];
        // console.log(platforms);
        // console.log('- PRICE ', i);

        pricingPlan.platforms[i] = Object.entries(platforms);
        // console.log(pricingPlan.platforms[i][0]);

        pricingPlan.platforms[i].sort((a, b) => {
          aa = (a[0].match(/-/g)||[]).length;
          bb = (b[0].match(/-/g)||[]).length;
          return bb-aa;
        });
        pricingPlan.platforms[i].forEach(([p, properties], pi) => { // platformIndex
          console.log('- ', p);

          Object.entries(properties).forEach(([propertyName, property]) => {
            if (property.type != 'select') {
              return;
            }
            const childSelect = property.select?.name;

            // console.log(platforms?.[0]?.[1]?.[propertyName]?.select);
            console.log(propertyName, ' ', p );


            // default from worldwide
            const w = country?.[c != 'Worldwide' ? 'Worldwide' : undefined]?.[i]?.[p]?.[propertyName]?.select?.name.replace('∇', '');

            let x;
            if (pi==0) {
              // console.log('hallo ', pricingPlan?.platforms?.[i-1]?.[0]?.[1]);
              // default for previous pricing plan
              x = pricingPlan?.platforms?.[i - 1]?.[0]?.[1]?.[propertyName]?.select?.name.replace('∇', '');
              console.log(x);
            }

            // same platform from previous pricing plan
            const y = pricingPlan?.[i-1]?.[p]?.[propertyName]?.select?.name.replace('∇', '');

            // default for current pricing plan
            // console.log('blep ', pricingPlan.platforms[i][0][1]);
            const z = pricingPlan.platforms?.[i]?.[0]?.[1]?.[propertyName]?.select?.name.replace('∇', '');

            /* console.log('x ', x);
              console.log('y ', y);
              console.log('z ', z); */
            parentSelect = x || y || w || z;
            // console.log(parentSelect);

            if (!childSelect || (childSelect.includes('∇') && !childSelect.includes(parentSelect))) {
              // need the updated properties for the next iteration, but also for updating the Notion DB
              // can't update properties individually
              if (parentSelect == '✓') {
                pricingPlan[i][p][propertyName].select = {
                  name: '∇' + parentSelect,
                };

                // console.log('platforms parent ', pricingPlan.platforms[i][pi][1][propertyName]);

                pricingPlan.platforms[i][pi][1][propertyName].select = {
                  name: '∇' + parentSelect,
                };

                /* cV[i].properties[propertyName].select = {
                      name: '∇' + parentSelect,
                    }; */
              } else {
                pricingPlan[i][p][propertyName].select = null;
                pricingPlan.platforms[i][pi][1][propertyName].select = null;
                // if it has no property to update from and has not been set individually, set to null
                // cV[i].properties[propertyName].select = null;
              }
            } else {
              return;
            }
          });
        });
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

  for (const [s, country] of Object.entries(softwareList)) {
    // console.log('- - - Software ', s);
    for (const [c, pricingPlan] of Object.entries(country)) {
      // console.log('- - Country ', c );
      for (const platforms of pricingPlan) {
        for (const [, properties] of Object.entries(platforms)) {
          const id = properties.id;
          delete properties.id;
          // await update('page', {id, properties});
        }
      }
    }
  }

  const deepClone = ((obj) => {
    return JSON.parse(JSON.stringify(obj));
  });

  for (const [s, country] of Object.entries(softwareList)) {
    console.log('- - - Software ', s);
    for (const [c, pricingPlan] of Object.entries(country)) {
      console.log('- - Country ', c );
      // eslint-disable-next-line guard-for-in
      for (const i in pricingPlan) {
        const info = pricingPlan[i].info;
        const platforms = pricingPlan[i];
        for (const [pl, properties] of Object.entries(platforms)) {
          // also loops through arrays created here: pricingPlan.platforms (I think) - works nonetheless
          // console.log('PROPS', properties);
          for (const [pr, property] of Object.entries(properties)) {
            console.log(softwareList[s][c][i]);
            softwareList[s][c][i][pl][pr] = property?.select?.name.includes('✓') ? true :
             property?.select?.name.includes('✕') ? false :
             null;
          }

          const x = pl.split('-');
          if (x.length>1) {
            console.log(x);
            x.forEach((l) => {
              softwareList[s][c][i][l] = softwareList[s][c][i][l] || softwareList[s][c][i][pl];
            });
            delete softwareList[s][c][i][pl];
          }
        }
        const x = deepClone(softwareList[s][c][i]);
        softwareList[s][c][i] = {
          ...info,
          platforms: x,
        };
      }
    }
  }

  /* Object.entries(softwareList).forEach(([s, country]) => {
    console.log('- - - Software ', s);
    Object.entries(country).forEach(([c, pricingPlan]) => {
      console.log('- - - Country ', c );
      pricingPlan.forEach((platforms, i) => {
        Object.entries(platforms).forEach(async ([, properties]) => {
          const id = properties.id;
          delete properties.id;
          await update('page', {id, properties});
        });
      });
    });
  }); */


  // console.log(softwareList)

  // ∇ as inherited
  // console.log(softwareList)
  return softwareList;
};


// eslint-disable-next-line no-extend-native
String.prototype.newTrim = function newTrim() {
  // console.log(this.valueOf())
  return this.valueOf().trim().replace(/\s+/g, ' ');
};

exports.formatPage = formatPage = (page) => {
  // TODO: format properties and non-properties in a way that makes them distinguishable automatically
  const newPage = {
    id: page.id,
  };

  Object.entries(page.properties)
      .filter(([key]) => key.includes('${') || ['Country', 'Pricing Plan', 'Platform', 'Price Month', 'Software', 'Platforms Number'].includes(key) ? false : true)
      .forEach(([key, property]) => {
        newPage[key] = property;
      });

  return newPage;
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


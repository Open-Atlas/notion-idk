
const get = require('../get/index.js');
const update = require('../update');
// const pages = require('../exampleData/podcastForHierarchy.json');

// gets all the entity properties and replaces them in the ${<name>} property using ${<propertyName>} to replace the values
module.exports = async ({id}) => {
  const pages = await get('pages', {id, formatRelations: true});
  // let title;

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
              propertyVariables[key] = '';
              property.relation.forEach((relation) => {
                propertyVariables[key] += relation.title + ' ';
              });
              propertyVariables[key].trim();
              break;
            case 'rich_text':
              propertyVariables[key] = '';
              property.rich_text.forEach((text) => {
                propertyVariables[key] += text.plain_text + ' ';
              });
              propertyVariables[key] = propertyVariables[key].trim();
              // const x = propertyVariables[key].split(' ');
              // console.log(x);
              break;
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
            throw new Error('DERIVATED PROPERTY MUST BE TYPE rich_text');
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

          console.log(JSON.stringify(properties));

          await update('page', {id: page.id, properties});

          // console.log(text)
        });


    // console.log(propertyVariables)
  });

  return true;
};


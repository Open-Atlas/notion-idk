const {Client} = require('@notionhq/client');
const db = require('../neo4j/db.js');
const sampleData = require('./sample.json');

const notion = new Client({auth: 'secret_6myhGoDBvah6hswnfelQeJpl6Y80l0FNbJD3CDyp4YS' || process.env.NOTION_API_KEY});
// TODO: #4 find a way to have a main branch without console.logs

const deepClone = ((obj) => {
  return JSON.parse(JSON.stringify(obj));
});

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
  // request
  exports.request = async function request({requestType, param = undefined}) {
    return refine(await this[requestType](param));
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

  exports.retrieveDb = async (id) => {
    return await notion.databases.retrieve({database_id: id});
  };


  // TODO: Parser - explore all relations and create all the appropriate data

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
    for (const page of pages) {
      await db.mergeNode(page.id, page.title, database.title);
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
        }
      });
    });

    return true;
  };

  // creates duplicate nodes with same id, the neo4j MERGE is executed simultaneously and causes this
  exports.syncOne_buggy = async (database) => {
    const pages = await this.request({requestType: 'queryDb', param: database.id});

    // console.log(results);

    // get label / DB name using retrieveDb(id)
    // could also retrieve all the labels through subsequent retrieveDb(id) from the relations

    pages.forEach((entry) => {
      Object.entries(entry.properties).forEach(([key, property]) => {
        const relationName = key.split('  ')[0];
        if (!relationName) {
          return;
        }
        switch (property.type) {
          case 'relation':
            property.relation.forEach((relation) => {
              // create relationship
              /* obj1 = {
                id: entry.id,
              };
              obj2 = {
                id: relation.id,
              }; */

              db.merge(entry.id, relationName, relation.id); // implement direction & label
            });
            break;
        }
        delete entry.properties[key];
        delete entry.object;
        // merge object
        // db.mergeNode(entry); // console.log(entry);
      });
      delete entry.properties;
      db.mergeNode(entry.id, entry.title, database.title); // console.log(entry);
    });

    return true;
  };
} catch (e) {
  console.log('ERROR', e);
  throw e;
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

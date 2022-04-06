
const title = {
  property: 'title',
};

exports.getTitle = (properties) => {
  // doesn't work if string is empty
  // const [, {title: [{plain_text}]}] = Object.entries(properties).find(([, value]) => value.id == 'title');

  // TO-EVALUATE: maybe add function to Object prototype?
  try {
    const [property, {title: [{plain_text: name}]}] = Object.entries(properties).find(([key, value]) => {
      return value.id == 'title';
    });
    title.property = property;
    delete entry.properties[property];
    // console.log('PAGE TITLE', title);
    return name;
  } catch (e) {
    // console.log(e);
    return '';
  }
  // const [, {title: [title]}] = Object.entries(properties).find(([, value]) => value.id == 'title');
  return title;
};

  // creates duplicate nodes with same id, the neo4j MERGE is executed simultaneously and causes this
  exports.buggy__syncOne = async (database) => {
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

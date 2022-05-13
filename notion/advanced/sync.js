// TODO: #5 sync also citations from page to page

const all = async () => {
  const databases = await notion.request({requestType: 'searchDb'});
  // console.log('SYNC', databases);

  await db.deleteAll(); // deletes everything

  databases.forEach((entry) => {
    this.syncOne(entry);
  });
};

const one = async (database) => {
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

module.exports = {all, one};

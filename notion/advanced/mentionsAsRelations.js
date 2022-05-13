module.exports = async (id) => { // database id
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


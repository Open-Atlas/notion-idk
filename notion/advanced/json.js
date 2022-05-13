module.exports = () => {
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


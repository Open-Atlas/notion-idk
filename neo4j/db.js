const neo4j = require('neo4j-driver');

const uri = 'neo4j+s://a50e1e1d.databases.neo4j.io';
const user = 'neo4j';
const password = 'Iy9z-hV1-vCrYOfUWHGfaSi2tVY_St9FabjbKtx-z0E';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));


try {
  // To learn more about the Cypher syntax, see https://neo4j.com/docs/cypher-manual/current/
  // The Reference Card is also a good resource for keywords https://neo4j.com/docs/cypher-refcard/current/
  exports.merge = async (id1, rel = '', id2) => {
    // labels
    // ids
    // relationship

    const session = driver.session();

    const writeQuery = `MERGE (n1 { id: "${id1}" })
                          MERGE (n2 { id: "${id2}" })
                          MERGE (n1)-[:\`${rel.toUpperCase()}\`]->(n2)
                          RETURN n1, n2`;

    const writeResult = await session.writeTransaction((tx) =>
      tx.run(writeQuery ),
    );
    writeResult.records.forEach((record) => {
      const node1 = record.get('n1');
      const node2 = record.get('n2');
      console.log(
          `Relationship '${rel.toUpperCase()}' created between: ${node1.properties.name}, ${node2.properties.name}`,
      );
    });
    await session.close();
  };

  exports.mergeNode = async (id, name) => {
    const session = driver.session();

    // const writeQuery = `MERGE (n1 ${{...document}}) RETURN n1`; // not working unfortunately
    // neither JSON.stringify.. need to implement my own stringifer to make it work

    const writeQuery = `MERGE (n1 { id:"${id}", name:"${name}"}) 
        RETURN n1`;

    const writeResult = await session.writeTransaction((tx) =>
      tx.run(writeQuery ),
    );
    writeResult.records.forEach((record) => {
      const node1 = record.get('n1');
      console.log(
          `CREATED ${node1.properties.name}`,
      );
    });
    await session.close();
  };

  /* const readQuery = `MATCH (p:Person)
                         WHERE p.name = $personName
                         RETURN p.name AS name`;
    const readResult = await session.readTransaction((tx) =>
      tx.run(readQuery, {personName: person1Name}),
    );
    readResult.records.forEach((record) => {
      console.log(`Found person: ${record.get('name')}`);
    }); */
} catch (error) {
  console.error('Something went wrong: ', error);
} finally {
}

// Don't forget to close the driver connection when you're finished with it
// await driver.close();

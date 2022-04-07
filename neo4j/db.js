const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASS;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

try {
  exports.deleteAll = async () => {
    const session = driver.session();

    const writeQuery = `MATCH (n) DETACH DELETE n`;

    await session.writeTransaction((tx) =>
      tx.run(writeQuery ),
    );
    console.log('DELETED ALL NEO4J');
    await session.close();
  };

  exports.merge = async (id1, rel = '', id2) => {
    // labels
    // ids
    // relationship

    const session = driver.session();

    const writeQuery = `MERGE (n1 { id:"${id1}" })
                          MERGE (n2 { id:"${id2}" })
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

  exports.mergeNode = async (id, label, name, notionUrl ) => {
    const session = driver.session();

    // const writeQuery = `MERGE (n1 ${{...document}}) RETURN n1`; // not working unfortunately
    // neither JSON.stringify.. need to implement my own stringifer to make it work

    const writeQuery = `MERGE (n { id:"${id}" }) 
    SET n:\`${label}\`, n.name="${name}", n.urlNotion="${notionUrl}"
	RETURN n`;

    const writeResult = await session.writeTransaction((tx) =>
      tx.run(writeQuery ),
    );
    writeResult.records.forEach((record) => {
      const node = record.get('n');
      console.log(
          `CREATED ${node.properties.name}`,
      );
    });
    await session.close();
  };
	
	exports.updateNode = async (id, property, data) => {
		
    const session = driver.session();
		
		/*console.log(`MATCH (n { id:"${id}" }) 
    SET n.${property}=${JSON.stringify(data)}
	RETURN n`)*/
		
		// ISSUE: #8 this is the right code, but neo4j Bloom crashes with an array of URLs, see https://neo4j-bloom.canny.io/feature-requests/p/neo4j-bloom-crashes-if-node-has-an-array-property-with-more-than-1-value
		/*const writeQuery = `MATCH (n { id:"${id}" }) 
    SET n.\`${property}\`=${JSON.stringify(data)}
	RETURN n`;*/
		// TODO: proper workaround would be to breakdown just URLs in single properties, leave the rest in arrays
		
		let set = ""
		
		
		if(Array.isArray(data)){
						data.forEach((d, i) => set = `${set} SET n.${property}${i}=${JSON.stringify(d)}` )
		} else {
			set = `SET n.${property}=${JSON.stringify(data)}`
		}
		
		const writeQuery = `MATCH (n { id:"${id}" }) 
		${set}
	RETURN n`;    
		
		
		
		
		//console.log("UPDATE NODE", writeQuery)
try{
    const writeResult = await session.writeTransaction((tx) =>
      tx.run(writeQuery),
    );
    writeResult.records.forEach((record) => {
      const node = record.get('n');
      console.log(
          `UPDATED ${node.properties.name}`,
      );
    });
} catch(e){
	console.log(e)
	console.log(writeQuery)
}
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

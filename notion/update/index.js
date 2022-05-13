const update = require('./static.js');

module.exports = async (dataType, {id=null, query=null, ...options}) => update[dataType](id||query, options);

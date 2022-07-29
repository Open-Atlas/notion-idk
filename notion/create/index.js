const create = require('../create/static.js');

module.exports = async (dataType, {id=null, query=null, ...options}) => create[dataType](options);

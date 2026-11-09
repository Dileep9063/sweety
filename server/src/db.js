const { Pool, types } = require('pg');
const config = require('./config');

// Return DATE columns as 'YYYY-MM-DD' strings (avoids timezone bugs)
types.setTypeParser(1082, (val) => val);

module.exports = new Pool({ connectionString: config.databaseUrl });

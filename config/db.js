const mysql = require('mysql');

// Store active pools in an object
const pools = {};

// Function to get or create a pool for a given database
function getDBConnection(database) {
    if (!pools[database]) {
        pools[database] = mysql.createPool({
            connectionLimit: 100,
            host: '127.0.0.1', // ✅ Force IPv4
            user: 'root',
            password: 'pavithran@123',
            database: database,
            waitForConnections: true,
            queueLimit: 1000,
        });

        console.log(`🔗 Created new connection pool for database: ${database}`);
    }
    return pools[database];
}

module.exports = getDBConnection;

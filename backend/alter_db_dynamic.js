require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db',
});

const alterQueries = [
  "ALTER TABLE users ADD COLUMN custom_id VARCHAR(100) UNIQUE AFTER email",
  "ALTER TABLE users ADD COLUMN followers_count INT DEFAULT 0",
  "ALTER TABLE users ADD COLUMN following_count INT DEFAULT 0",
  "ALTER TABLE users ADD COLUMN streak INT DEFAULT 0",
  "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255)"
];

connection.connect((err) => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('Connected as id ' + connection.threadId);

  let successCount = 0;
  
  alterQueries.forEach((query) => {
    connection.query(query, (error, results) => {
      if (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column already exists: ${query.split('ADD COLUMN ')[1].split(' ')[0]}`);
          successCount++;
        } else {
          console.error(`Error executing query: ${query}`, error);
        }
      } else {
        console.log(`Successfully added column: ${query.split('ADD COLUMN ')[1].split(' ')[0]}`);
        successCount++;
      }
      
      if (successCount === alterQueries.length) {
        console.log('Finished processing database alterations.');
        connection.end();
      }
    });
  });
});

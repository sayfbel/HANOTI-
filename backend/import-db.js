require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
});

db.connect((err) => {
  if (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
  
  const sqlFile = path.join(__dirname, 'database.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error importing database:', err);
      process.exit(1);
    }
    console.log('Database imported successfully!');
    process.exit(0);
  });
});

require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to db', err);
    process.exit(1);
  }
  
  const sql = `
    ALTER TABLE users 
    DROP COLUMN IF EXISTS streak, 
    DROP COLUMN IF EXISTS following_count, 
    DROP COLUMN IF EXISTS followers_count, 
    DROP COLUMN IF EXISTS abonnement;
  `;
  
  db.query(sql, (err) => {
    if (err) {
      console.error('Error dropping columns:', err);
    } else {
      console.log('Columns dropped successfully.');
    }
    db.end();
  });
});

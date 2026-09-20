require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db'
});

db.connect((err) => {
  if (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
  
  const query = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS birthday DATE,
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error altering table:', err);
      process.exit(1);
    }
    console.log('Database altered successfully!');
    process.exit(0);
  });
});

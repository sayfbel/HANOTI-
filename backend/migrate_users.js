require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }
  
  const alterQuery = `
    ALTER TABLE users 
    ADD COLUMN custom_id VARCHAR(100) UNIQUE AFTER email,
    ADD COLUMN first_name VARCHAR(100) AFTER password,
    ADD COLUMN last_name VARCHAR(100) AFTER first_name,
    ADD COLUMN birthday DATE AFTER last_name,
    ADD COLUMN phone_number VARCHAR(20) AFTER birthday,
    ADD COLUMN avatar_url VARCHAR(255) AFTER role;
  `;
  
  db.query(alterQuery, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Columns already exist.');
      } else {
        console.error('Error altering table:', err);
      }
    } else {
      console.log('Table users altered successfully to include onboarding fields.');
    }
    db.end();
  });
});

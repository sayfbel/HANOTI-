require('dotenv').config();
const mysql = require('mysql2');
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db'
});

db.query('SELECT * FROM users WHERE email = ?', ['admin@gmail.com'], (err, results) => {
  if (err) {
    console.error('DB ERROR:', err);
  } else {
    console.log('SUCCESS:', results);
  }
  process.exit(0);
});

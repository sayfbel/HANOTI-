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
    CREATE TABLE IF NOT EXISTS credit_cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      cardholder_name VARCHAR(100) NOT NULL,
      last_four VARCHAR(4) NOT NULL,
      expiry_date VARCHAR(5) NOT NULL,
      card_type VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  
  db.query(sql, (err) => {
    if (err) {
      console.error('Error creating credit_cards table:', err);
    } else {
      console.log('Credit cards table created or already exists.');
    }
    db.end();
  });
});

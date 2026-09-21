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
    CREATE TABLE IF NOT EXISTS abonnement (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      plan_name VARCHAR(50) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      payment_method VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  
  db.query(sql, (err) => {
    if (err) {
      console.error('Error creating abonnement table:', err);
    } else {
      console.log('Abonnement table created or already exists.');
    }
    db.end();
  });
});

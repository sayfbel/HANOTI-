require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db',
  multipleStatements: true
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      address VARCHAR(255) NULL,
      note TEXT NULL,
      avatar_url VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX (user_id),
      INDEX (name),
      INDEX (phone)
    );

    CREATE TABLE IF NOT EXISTS client_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      user_id INT NOT NULL,
      type ENUM('credit', 'payment') NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      date DATE NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX (client_id),
      INDEX (user_id),
      INDEX (date)
    );
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
    console.log('Clients and client_transactions tables created successfully!');
    db.end();
  });
});

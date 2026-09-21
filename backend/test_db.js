const mysql = require('mysql2');
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db',
  waitForConnections: true,
});

db.query("SELECT id, email, first_name, last_name, birthday, phone_number FROM users WHERE email = 'hamza.emilie23@gmail.com'", (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
  process.exit();
});

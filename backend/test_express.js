require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db'
});

app.post('/login', (req, res) => {
  console.log('Login called with:', req.body);
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.log('DB ERROR:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    console.log('DB RESULTS:', results);
    res.json({ message: 'Success' });
  });
});

const server = app.listen(3002, () => {
  console.log('Server running on 3002');
  
  // Now make the fetch request
  fetch('http://localhost:3002/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin' })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Fetch response:', data);
    server.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Fetch error:', err);
    server.close();
    process.exit(1);
  });
});

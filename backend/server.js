require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'hanoti_secure_key_12345';
const PORT = process.env.PORT || 3000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database hanoti_db');
});

// Email Transporter (Nodemailer)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/* ====================================================
   STANDARD LOGIN
==================================================== */
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, abonnement: user.abonnement }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful', token, user: { email: user.email, role: user.role, abonnement: user.abonnement } });
  });
});

/* ====================================================
   GOOGLE LOGIN
==================================================== */
app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'No Google Token provided' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    // Check if email exists in DB
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length === 0) {
        return res.status(403).json({ message: 'This Google account is not registered.' });
      }

      const user = results[0];
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, abonnement: user.abonnement }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      res.json({ message: 'Google Login successful', token, user: { email: user.email, role: user.role, abonnement: user.abonnement } });
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
});

/* ====================================================
   FORGOT PASSWORD FLOW
==================================================== */

// Step 1: Request Code
app.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'No account found with that email' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minutes

    db.query('INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)', [email, code, expiresAt], async (err2) => {
      if (err2) return res.status(500).json({ message: 'Failed to generate reset code' });

      try {
        await transporter.sendMail({
          from: '"Hanot+" <noreply@hanotplus.com>',
          to: email,
          subject: 'Your Password Reset Code',
          text: `Your password reset code is: ${code}. It expires in 15 minutes.`,
          html: `<p>Your password reset code is: <b>${code}</b>. It expires in 15 minutes.</p>`
        });
        res.json({ message: 'Verification code sent successfully' });
      } catch (mailErr) {
        console.error('Email Send Error:', mailErr);
        res.status(500).json({ message: 'Failed to send verification email (Check your SMTP settings in .env)' });
      }
    });
  });
});

// Step 2: Verify Code
app.post('/auth/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code required' });

  db.query('SELECT * FROM password_resets WHERE email = ? AND code = ? ORDER BY id DESC LIMIT 1', [email, code], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(400).json({ message: 'Invalid verification code' });

    const resetRecord = results[0];
    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    res.json({ message: 'Code verified successfully' });
  });
});

// Step 3: Reset Password
app.post('/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ message: 'All fields are required' });

  // Re-verify code just to be safe
  db.query('SELECT * FROM password_resets WHERE email = ? AND code = ? ORDER BY id DESC LIMIT 1', [email, code], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0 || new Date() > new Date(results[0].expires_at)) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email], (updateErr) => {
      if (updateErr) return res.status(500).json({ message: 'Failed to update password' });

      // Clean up used code
      db.query('DELETE FROM password_resets WHERE email = ?', [email]);
      res.json({ message: 'Password updated successfully' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const JWT_SECRET = process.env.JWT_SECRET || 'hanoti_secure_key_12345';
const PORT = process.env.PORT || 3000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Database connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hanoti_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, conn) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database hanoti_db (Pool)');
  conn.release();
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
    if (err) {
      console.error('Login DB Error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful', token, user: { 
      email: user.email, 
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      birthday: user.birthday,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url
    } });
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
        { id: user.id, email: user.email, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      res.json({ message: 'Google Login successful', token, user: { 
        email: user.email, 
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        birthday: user.birthday,
        phone_number: user.phone_number,
        avatar_url: user.avatar_url
      } });
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

/* ====================================================
   AUTHENTICATION MIDDLEWARE
==================================================== */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token is invalid or expired' });
    req.user = user;
    next();
  });
};

/* ====================================================
   USER PROFILE
==================================================== */
app.get('/user/profile', authenticateToken, (req, res) => {
  const query = `
    SELECT u.id, u.email, u.first_name, u.last_name, u.birthday, u.phone_number, 
           u.role, u.custom_id, u.avatar_url,
           a.plan_name as subscription_plan, a.start_date as subscription_start, 
           a.end_date as subscription_end, a.payment_method as subscription_payment
    FROM users u
    LEFT JOIN abonnement a ON u.id = a.user_id 
    WHERE u.id = ? 
    ORDER BY a.id DESC LIMIT 1
  `;
  console.log('EXECUTING PROFILE QUERY:', query);
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('Profile Fetch Error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
});

/* ====================================================
   USER CREDIT CARD
==================================================== */
app.get('/user/credit-card', authenticateToken, (req, res) => {
  const query = 'SELECT cardholder_name, last_four, expiry_date, card_type FROM credit_cards WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('Fetch Card Error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) return res.json(null);
    res.json(results[0]);
  });
});

app.post('/user/credit-card', authenticateToken, (req, res) => {
  const { cardholder_name, last_four, expiry_date, card_type } = req.body;
  
  if (!cardholder_name || !last_four || !expiry_date) {
    return res.status(400).json({ message: 'Missing required card details' });
  }

  const query = 'INSERT INTO credit_cards (user_id, cardholder_name, last_four, expiry_date, card_type) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [req.user.id, cardholder_name, last_four, expiry_date, card_type], (err) => {
    if (err) {
      console.error('Save Card Error:', err);
      return res.status(500).json({ message: 'Database error while saving card' });
    }
    res.json({ message: 'Card saved successfully' });
  });
});

app.delete('/user/credit-card', authenticateToken, (req, res) => {
  const query = 'DELETE FROM credit_cards WHERE user_id = ?';
  db.query(query, [req.user.id], (err) => {
    if (err) {
      console.error('Delete Card Error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Card deleted successfully' });
  });
});

/* ====================================================
   USER PROFILE UPLOADS
==================================================== */
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

app.post('/user/profile/upload', authenticateToken, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  const avatarUrl = `/uploads/profiles/${req.file.filename}`;
  
  db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id], (err) => {
    if (err) {
      console.error('Avatar Update Error:', err);
      return res.status(500).json({ message: 'Database error while saving avatar' });
    }
    res.json({ message: 'Avatar updated successfully', avatar_url: avatarUrl });
  });
});

app.put('/user/profile', authenticateToken, (req, res) => {
  const { first_name, last_name, birthday, phone_number } = req.body;
  
  const cleanFirstName = (first_name && typeof first_name === 'string' && first_name.trim()) ? first_name.trim() : null;
  const cleanLastName = (last_name && typeof last_name === 'string' && last_name.trim()) ? last_name.trim() : null;
  const cleanBirthday = (birthday && typeof birthday === 'string' && birthday.trim()) ? birthday.trim() : null;
  const cleanPhone = (phone_number && typeof phone_number === 'string' && phone_number.trim()) ? phone_number.trim() : null;

  // Validation
  const nameRegex = /^[A-Za-z\s]+$/;
  if (cleanFirstName && !nameRegex.test(cleanFirstName)) return res.status(400).json({ message: 'First name must contain only letters.' });
  if (cleanLastName && !nameRegex.test(cleanLastName)) return res.status(400).json({ message: 'Last name must contain only letters.' });
  
  const phoneRegex = /^(?:\+212|0)[5-7]\d{8}$/;
  if (cleanPhone && !phoneRegex.test(cleanPhone)) return res.status(400).json({ message: 'Phone number must be a valid Moroccan number.' });

  db.query('SELECT custom_id FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    let custom_id = results[0]?.custom_id || null;
    
    // Generate custom_id based on first name and last name if provided
    if (cleanFirstName && cleanLastName) {
      custom_id = `@${cleanFirstName.toLowerCase()}${cleanLastName.toLowerCase()}`.replace(/\s+/g, '');
    }

    const query = 'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), birthday = COALESCE(?, birthday), phone_number = COALESCE(?, phone_number), custom_id = COALESCE(?, custom_id) WHERE id = ?';
    db.query(query, [cleanFirstName, cleanLastName, cleanBirthday, cleanPhone, custom_id, req.user.id], (updateErr) => {
      if (updateErr) {
        console.error('Profile Update Error:', updateErr);
        // Fallback if custom_id already exists (duplicate)
        if (updateErr.code === 'ER_DUP_ENTRY' && custom_id) {
           const fallbackId = custom_id + Math.floor(Math.random() * 1000);
           db.query(query, [cleanFirstName, cleanLastName, cleanBirthday, cleanPhone, fallbackId, req.user.id], (err2) => {
             if (err2) return res.status(500).json({ message: 'Database error on generating unique ID' });
             return res.json({ message: 'Profile updated successfully with generated ID' });
           });
           return;
        }
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ message: 'Profile updated successfully' });
    });
  });
});

/* ====================================================
   HANOUTI EXPLORE / CLIENTS & DEBT MANAGEMENT
==================================================== */

// 1. GET ALL CLIENTS WITH COMPUTED DEBTS
app.get('/api/clients', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      c.id, c.name, c.phone, c.address, c.note, c.avatar_url, c.created_at,
      COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) AS total_credit,
      COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) AS total_paid,
      (COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0)) AS remaining_debt,
      COUNT(t.id) AS transaction_count,
      MAX(t.date) AS last_transaction_date
    FROM clients c
    LEFT JOIN client_transactions t ON c.id = t.client_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('Fetch clients error:', err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des clients' });
    }
    const clients = results.map(row => ({
      ...row,
      total_credit: Number(row.total_credit) || 0,
      total_paid: Number(row.total_paid) || 0,
      remaining_debt: Number(row.remaining_debt) || 0,
      transaction_count: Number(row.transaction_count) || 0
    }));
    res.json(clients);
  });
});

// 2. CREATE A NEW CLIENT
app.post('/api/clients', authenticateToken, (req, res) => {
  const { name, phone, address, note } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Le nom du client est requis' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ message: 'Le numéro de téléphone est requis' });
  }

  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const cleanAddress = address && address.trim() ? address.trim() : null;
  const cleanNote = note && note.trim() ? note.trim() : null;

  const query = 'INSERT INTO clients (user_id, name, phone, address, note) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [req.user.id, cleanName, cleanPhone, cleanAddress, cleanNote], (err, result) => {
    if (err) {
      console.error('Create client error:', err);
      return res.status(500).json({ message: 'Erreur lors de l’ajout du client' });
    }
    res.status(201).json({
      id: result.insertId,
      user_id: req.user.id,
      name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      note: cleanNote,
      total_credit: 0,
      total_paid: 0,
      remaining_debt: 0,
      transaction_count: 0,
      created_at: new Date()
    });
  });
});

// 3. GET A SPECIFIC CLIENT BY ID (WITH TRANSACTIONS & TOTALS)
app.get('/api/clients/:id', authenticateToken, (req, res) => {
  const clientId = req.params.id;
  
  const clientQuery = `
    SELECT 
      c.id, c.name, c.phone, c.address, c.note, c.avatar_url, c.created_at,
      COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) AS total_credit,
      COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) AS total_paid,
      (COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0)) AS remaining_debt,
      COUNT(t.id) AS transaction_count
    FROM clients c
    LEFT JOIN client_transactions t ON c.id = t.client_id
    WHERE c.id = ? AND c.user_id = ?
    GROUP BY c.id
  `;

  db.query(clientQuery, [clientId, req.user.id], (err, clientResults) => {
    if (err) {
      console.error('Fetch client details error:', err);
      return res.status(500).json({ message: 'Erreur lors de la récupération du client' });
    }
    if (clientResults.length === 0) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    const client = {
      ...clientResults[0],
      total_credit: Number(clientResults[0].total_credit) || 0,
      total_paid: Number(clientResults[0].total_paid) || 0,
      remaining_debt: Number(clientResults[0].remaining_debt) || 0,
      transaction_count: Number(clientResults[0].transaction_count) || 0
    };

    const transQuery = 'SELECT id, client_id, type, amount, date, description, created_at FROM client_transactions WHERE client_id = ? AND user_id = ? ORDER BY date DESC, id DESC';
    db.query(transQuery, [clientId, req.user.id], (err2, transResults) => {
      if (err2) {
        console.error('Fetch client transactions error:', err2);
        return res.status(500).json({ message: 'Erreur lors de la récupération des transactions' });
      }

      const transactions = transResults.map(t => ({
        ...t,
        amount: Number(t.amount) || 0
      }));

      res.json({
        ...client,
        transactions
      });
    });
  });
});

// 4. UPDATE CLIENT INFORMATION
app.put('/api/clients/:id', authenticateToken, (req, res) => {
  const clientId = req.params.id;
  const { name, phone, address, note } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Le nom du client est requis' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ message: 'Le numéro de téléphone est requis' });
  }

  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const cleanAddress = address && address.trim() ? address.trim() : null;
  const cleanNote = note && note.trim() ? note.trim() : null;

  const query = 'UPDATE clients SET name = ?, phone = ?, address = ?, note = ? WHERE id = ? AND user_id = ?';
  db.query(query, [cleanName, cleanPhone, cleanAddress, cleanNote, clientId, req.user.id], (err, result) => {
    if (err) {
      console.error('Update client error:', err);
      return res.status(500).json({ message: 'Erreur lors de la modification du client' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    res.json({ 
      message: 'Client mis à jour avec succès', 
      client: { id: Number(clientId), name: cleanName, phone: cleanPhone, address: cleanAddress, note: cleanNote } 
    });
  });
});

// 5. DELETE A CLIENT AND THEIR TRANSACTIONS
app.delete('/api/clients/:id', authenticateToken, (req, res) => {
  const clientId = req.params.id;
  const query = 'DELETE FROM clients WHERE id = ? AND user_id = ?';
  db.query(query, [clientId, req.user.id], (err, result) => {
    if (err) {
      console.error('Delete client error:', err);
      return res.status(500).json({ message: 'Erreur lors de la suppression du client' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    res.json({ message: 'Client supprimé avec succès' });
  });
});

// 6. RECORD A CREDIT OR PAYMENT TRANSACTION
app.post('/api/clients/:id/transactions', authenticateToken, (req, res) => {
  const clientId = req.params.id;
  const { type, amount, date, description } = req.body;

  if (!type || !['credit', 'payment'].includes(type)) {
    return res.status(400).json({ message: 'Type de transaction invalide (credit ou payment)' });
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: 'Le montant doit être un nombre positif' });
  }

  const transactionDate = date && String(date).trim() ? String(date).trim() : new Date().toISOString().split('T')[0];
  const cleanDesc = description && description.trim() ? description.trim() : null;

  // Verify client belongs to current user
  db.query('SELECT id FROM clients WHERE id = ? AND user_id = ?', [clientId, req.user.id], (err, clientCheck) => {
    if (err || clientCheck.length === 0) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    const query = 'INSERT INTO client_transactions (client_id, user_id, type, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [clientId, req.user.id, type, numAmount, transactionDate, cleanDesc], (insertErr, result) => {
      if (insertErr) {
        console.error('Insert transaction error:', insertErr);
        return res.status(500).json({ message: 'Erreur lors de l’enregistrement de la transaction' });
      }

      res.status(201).json({
        id: result.insertId,
        client_id: Number(clientId),
        type,
        amount: numAmount,
        date: transactionDate,
        description: cleanDesc,
        created_at: new Date()
      });
    });
  });
});

// 7. DELETE A SPECIFIC TRANSACTION
app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  const transId = req.params.id;
  const query = 'DELETE FROM client_transactions WHERE id = ? AND user_id = ?';
  db.query(query, [transId, req.user.id], (err, result) => {
    if (err) {
      console.error('Delete transaction error:', err);
      return res.status(500).json({ message: 'Erreur lors de la suppression de la transaction' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }
    res.json({ message: 'Transaction supprimée avec succès' });
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 2MB.' });
    }
  } else if (err) {
     return res.status(400).json({ message: err.message });
  }
  
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

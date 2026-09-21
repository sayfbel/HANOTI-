CREATE DATABASE IF NOT EXISTS hanoti_db;
USE hanoti_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  custom_id VARCHAR(100) UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  birthday DATE,
  phone_number VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin account
-- password is 'admin123'
INSERT INTO users (email, password, role) 
VALUES ('admin@gmail.com', '$2b$10$m0PQqxn9FRjiZk35tt9tsuhOgOti9cytaMRmEkowl8NHeb9eDz84W', 'user');

-- Hamza account
-- password is 'Saifbel22#'
INSERT INTO users (email, password, role) 
VALUES ('hamza.emilie23@gmail.com', '$2b$10$0YWz5FGnUvR53qv.yVGN7.FVnx5scZRY15YKRAhNj5Y4e6Llruy7S', 'user');

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(email)
);

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

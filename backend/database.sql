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
  abonnement VARCHAR(50) DEFAULT 'standar',
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  streak INT DEFAULT 0,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin account
-- password is 'admin123'
INSERT INTO users (email, password, role, abonnement) 
VALUES ('admin@gmail.com', '$2b$10$m0PQqxn9FRjiZk35tt9tsuhOgOti9cytaMRmEkowl8NHeb9eDz84W', 'user', 'standar');

-- Hamza account
-- password is 'Saifbel22#'
INSERT INTO users (email, password, role, abonnement) 
VALUES ('hamza.emilie23@gmail.com', '$2b$10$0YWz5FGnUvR53qv.yVGN7.FVnx5scZRY15YKRAhNj5Y4e6Llruy7S', 'user', 'standar');

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(email)
);

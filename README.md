# HANOTI+

A modern full-stack web and mobile application built with Expo (React Native) and Node.js. 
This repository contains a robust authentication system including standard login, Google OAuth integration, and a complete password reset flow.

## 🚀 Features

* **Authentication System**
  * Secure standard Email & Password login (bcrypt password hashing).
  * **Google OAuth Login** via `expo-auth-session` and `google-auth-library`.
  * Persistent user sessions across application reloads using `AsyncStorage`.
* **Password Recovery**
  * Complete 3-step Forgot Password flow.
  * NodeMailer SMTP integration for sending 6-digit verification codes.
* **Modern UI/UX**
  * Built with React Native & Expo.
  * Reusable cross-platform UI components (e.g., beautiful custom `ConfirmDialog` modals).
  * Seamless inline form validation and error handling.

## 📁 Project Structure

* `/frontend` - The Expo React Native application (Web, iOS, Android compatible).
* `/backend` - The Node.js Express server and API endpoints.

## 🛠 Setup & Installation

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file (refer to the code for required keys like `DB_HOST`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and `SMTP` configs).
4. Start the server:
   ```bash
   node server.js
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```

## 🔐 Security Notes

- This project uses JWT (JSON Web Tokens) for managing API authorization.
- Passwords are encrypted before being stored in the database.

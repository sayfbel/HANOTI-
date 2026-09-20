# Hanouti 🏪

**Hanouti** (meaning "My Shop" in Arabic) is a digital credit notebook designed specifically for merchants. It aims to replace the traditional paper credit notebooks ("carnet de crédit") with a simple, modern, and reliable digital solution.

## Features ✨

*   **Merchant Dashboard**: Get a real-time overview of your business health, including total outstanding credits, payments received this month, and the number of active clients.
*   **Manage Clients**: Easily add clients to your digital notebook.
*   **Track Credits & Payments**: Record new credits given to clients and log payments received. The app automatically calculates the remaining balance for each client.
*   **Transaction History**: View a clear history of all credits and payments across your store.
*   **SMS Reminders**: (Coming Soon) Send automated SMS reminders to clients with overdue balances.
*   **Data Export**: (Coming Soon) Export your digital notebook to PDF or Excel for safe keeping and accounting.
*   **Multi-language Support**: Available in French, English, and Arabic.
*   **Dark Mode**: Full support for dark and light themes, adapting to the merchant's preference.

## Tech Stack 🛠️

*   **Frontend**: React Native (Expo) - Works seamlessly on Web, iOS, and Android.
*   **Backend**: Node.js, Express
*   **Authentication**: Custom JWT authentication and Google OAuth.
*   **Database**: (Configured via backend)

## Getting Started 🚀

### Prerequisites
- Node.js installed
- Expo CLI installed

### Run the Backend
```bash
cd backend
npm install
node server.js
```
The backend will run on `http://localhost:3000`.

### Run the Frontend
```bash
cd frontend
npm install
npm start
```
This will start the Expo development server. You can view the app in your browser, or on a physical device using the Expo Go app.

---
*Built to make credit management simpler, faster, and more organized.*

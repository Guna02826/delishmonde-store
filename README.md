# 🛒 Delish Monde – Premium Bakery E-Commerce

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

A full-stack e-commerce web application built for a modern bakery. Users can browse products, manage their cart, and place orders. Administrators have access to a high-performance dashboard to manage users, track orders, and view sales insights.

## ✨ Key Features

### 👤 Customer Portal
- **Authentication**: Secure JWT-based login and registration (HTTP-only cookies).
- **Shopping Cart**: Persistent cart functionality stored in localStorage.
- **Checkout**: Seamless checkout flow to place orders.
- **Order History**: View past orders and current statuses.

### 🛠️ Admin Dashboard
- **Lazy-Loaded Modules**: The admin dashboard is split into optimized, lazy-loaded tabs (Overview, Orders, Products, Users, Coupons) to ensure lightning-fast performance and minimal database load.
- **Order Management**: Change order statuses (e.g., shipped, delivered) and view detailed user info.
- **Data Insights**: Real-time summary dashboard of total users, orders, and revenue.

## 🛡️ Security & Architecture

- **Strict Input Validation**: The backend utilizes **Zod** schema validation to intercept malformed data before it reaches the database.
- **Middleware Architecture**: Clean Express middleware for authentication, authorization (Admin-only routes), and generic error handling.
- **Optimized Frontend**: Built with Vite and CSS Modules for scoped styling and fast HMR.

## 📁 Project Structure

```text
delishmonde-store/
├── server/          # Express backend
│   ├── controllers/ # Business logic
│   ├── middleware/  # Auth, Admin, and Zod Validation
│   ├── models/      # Mongoose schemas
│   ├── routes/      # REST API endpoints
│   └── utils/       # Zod schemas and helpers
└── client/          # React frontend (Vite)
    ├── src/
    │   ├── components/
    │   │   └── admin/ # Lazy-loaded admin tabs
    │   ├── pages/
    │   └── context/
```

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd server
npm install
```

Copy the example environment file and fill in your keys:
```bash
cp .env.example .env
```

Start the backend development server:
```bash
npm run dev
```
*(The server runs on http://localhost:5000 by default)*

### 2. Frontend Setup

```bash
cd ../client
npm install
```

Create a `.env` file in the `client` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```
*(The frontend runs on http://localhost:5173 by default)*

## 📌 Engineering Focus

This project was built to demonstrate proficiency in:
- Building scalable, decoupled RESTful APIs.
- Implementing robust security practices (JWT HTTP-only cookies, Zod validation).
- Optimizing React performance (lazy-loading large admin components).
- Handling complex e-commerce flows (Cart state, Checkout, Order tracking).

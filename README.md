# QR Management API

This is a Node.js-based backend for managing QR codes, user authentication, and visit tracking. Built with Express and MongoDB using a clean MVC architecture.

## Features

- 🔐 User Registration & Login (JWT Auth)
- 📩 OTP verification via email
- 📊 QR code creation and visit tracking
- 🛡 Role-based admin/user access
- 📈 Visit analytics and stats

## Live API (Hosted on Render)
Link: https://qr-order-management-api.onrender.com


📡 API Endpoints

🔐 Authentication

| Method | Endpoint         | Description                        |
|--------|------------------|------------------------------------|
| POST   | `/api/register`  | Register a new user                |
| POST   | `/api/login`     | Login with email and password      |
| POST   | `/api/verify-otp`| Verify OTP for registration        |

📲 QR Code

| Method | Endpoint           | Description                         |
|--------|--------------------|-------------------------------------|
| POST   | `/api/qr/create`   | Create a QR code (authentication required) |
| GET    | `/api/qr/:id/visits` | Get QR code visit stats (admin only) |

👤 User

| Method | Endpoint       | Description               |
|--------|----------------|---------------------------|
| GET    | `/api/user/me` | Get information of the logged-in user |





Tech Stack

1.Node.js

2. Express.js

3. MongoDB (Mongoose)

4. JWT for auth

5. Nodemailer (for OTP via email)

6. bcrypt (for password hashing)


Installation:

git clone https://github.com/Heisenity/qr-management-api.git

cd qr-management-api

npm install

npm start


Made with ❤️ by Sayantan

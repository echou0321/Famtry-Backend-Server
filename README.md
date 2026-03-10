# Famtry Backend Server

Backend API for the **Famtry** family inventory app. This server handles users, families, and shared items (e.g. pantry/fridge). Use this repo together with the Famtry iOS app.

---

## For iOS Developers

## Summary for iOS

1. Use **base URL** `https://famtry-backend-server.onrender.com/api` (live) or `http://localhost:5001/api` (local); send **Content-Type: application/json**.
2. Implement **register** and **login**; persist the returned **user** (and `_id`) for subsequent requests.
3. Send **userId** (and other IDs as specified) in request bodies for protected endpoints.
4. Use **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** as the single source of truth for all endpoints and behavior.
5. If the hosted server is unavailable, run the server locally (see **Server Setup** above) and switch the app to the local base URL.

### Base URL

- **Live (hosted):** `https://famtry-backend-server.onrender.com/api`  
  Use this in the iOS app for production or when you don’t want to run the server locally.
- **Local development:** `http://localhost:5001/api`  
  Use when running the server on your machine. From a physical device, use your computer’s IP instead of `localhost` (e.g. `http://192.168.1.x:5001/api`).

If the hosted server is down or slow (e.g. Render free tier spin-down), run the server locally (see **Server Setup** below) and point the app at the local base URL.

All API paths in the docs are relative to the base (e.g. `/api/users/login` → `{baseURL}/users/login`).

### Request / Response

- **Content-Type:** `application/json` for request bodies and responses.
- **Method:** Use the HTTP method shown in the docs (GET, POST, PUT, DELETE).
- **Errors:** JSON body `{ "error": "Message" }` with status codes `400`, `403`, `404`, `500` as described in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Authentication

- **Registration:** `POST /users/register` — create account (optionally with `familyId`).
- **Login:** `POST /users/login` with `email` and `password`. Response includes the `user` object; store the user (and `_id`) on the device.
- **Protected endpoints:** Many routes require a `userId` (and sometimes `familyId` or `approverId`) in the request body. Send the logged-in user’s `_id` from the login/register response. There is no Bearer token; authorization is done via these IDs in the payload.

### Full API Reference

See **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** for:

- All endpoints (Users, Families, Items)
- Request/response bodies and path/query params
- Business rules (one family per user, ownership approval, etc.)
- Error response format and status codes

### Quick Test

- **Health check:** `GET /health` (no base path prefix). Returns server and database status.
- **Root:** `GET /` — welcome message.

---

## Server Setup (for backend devs / running locally)

The live API is at **https://famtry-backend-server.onrender.com**. Use the steps below when you need to run the server on your own machine (e.g. if the host is down or for local development).

### 1. Install dependencies (run in terminal)

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root (or copy from `.env.example` if present):

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
PORT=5001
NODE_ENV=development
```

- `MONGODB_URI` — required; your MongoDB (e.g. Atlas) connection string.
- `PORT` — optional; default is `5001`.
- `NODE_ENV` — optional; e.g. `development` or `production`.

### 3. Run the server

- **Development (auto-reload):**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm start
  ```

Server listens on `http://localhost:5001` (or the port in `.env`).

---

## Project Structure

```
├── server.js                 # Entry point, MongoDB connection, route mounting
├── routes/
│   ├── index.js              # API route index
│   ├── userRoutes.js         # User (register, login, profile, family)
│   ├── familyRoutes.js       # Family CRUD, join, members
│   └── itemRoutes.js         # Items, ownership, request/approve/reject
├── models/
│   ├── index.js
│   ├── User.js
│   ├── Family.js
│   └── Item.js
├── middleware/
│   └── errorHandler.js       # Central error handling
├── API_DOCUMENTATION.md      # Full API reference for clients (e.g. iOS)
├── .env                      # Local config (not committed)
└── package.json
```

---

# Famtry Backend Server

A Node.js/Express server with MongoDB connection.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

## Running the Server

- Development mode (with auto-reload):
```bash
npm run dev
```

- Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## Project Structure

```
├── server.js              # Main server file
├── config/
│   └── database.js       # MongoDB connection configuration
├── routes/
│   └── index.js          # API routes
├── models/
│   └── Example.js        # Example Mongoose model
├── middleware/
│   └── errorHandler.js   # Error handling middleware
├── .env.example          # Environment variables template
└── package.json         # Dependencies and scripts
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## MongoDB Connection

The server uses Mongoose to connect to MongoDB. Make sure your MongoDB connection string is correctly set in the `.env` file.

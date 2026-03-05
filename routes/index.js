const express = require('express');
const router = express.Router();

// API info endpoint
router.get('/', (req, res) => {
  res.json({ 
    message: 'Famtry API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      families: '/api/families',
      items: '/api/items'
    }
  });
});

module.exports = router;

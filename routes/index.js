const express = require('express');
const router = express.Router();

// Example route
router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

// Import and use other route files here
// router.use('/users', require('./userRoutes'));
// router.use('/posts', require('./postRoutes'));

module.exports = router;

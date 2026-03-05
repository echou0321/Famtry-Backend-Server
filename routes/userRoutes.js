const express = require('express');
const router = express.Router();
const { User, Family } = require('../models');

// Register a new user
// POST /api/users/register
// Body: { name: string, email: string, password: string, familyId?: ObjectId }
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, familyId } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!email || email.trim().length === 0) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password is required and must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // If familyId is provided, verify it exists
    if (familyId) {
      const family = await Family.findById(familyId);
      if (!family) {
        return res.status(404).json({ error: 'Family not found' });
      }
    }

    // Create user (password will be hashed by pre-save middleware)
    const user = new User({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password,
      familyId: familyId || null 
    });
    await user.save();

    // If familyId was provided, add user to family members
    if (familyId) {
      await Family.findByIdAndUpdate(familyId, {
        $addToSet: { members: user._id }
      });
    }

    // Don't send password in response
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
});

// Login user
// POST /api/users/login
// Body: { email: string, password: string }
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user and include password (since it's select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Don't send password in response
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
});

// Get a user by ID
// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('familyId', 'name');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Ensure password is not sent
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    next(error);
  }
});

// Get user's family
// GET /api/users/:id/family
router.get('/:id/family', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.familyId) {
      return res.status(404).json({ error: 'User does not belong to a family' });
    }

    const family = await Family.findById(user.familyId).populate('members', 'name');
    res.json(family);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

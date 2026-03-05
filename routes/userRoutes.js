const express = require('express');
const router = express.Router();
const { User, Family } = require('../models');

// Create a new user
// POST /api/users
// Body: { name: string, familyId?: ObjectId }
router.post('/', async (req, res, next) => {
  try {
    const { name, familyId } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // If familyId is provided, verify it exists
    if (familyId) {
      const family = await Family.findById(familyId);
      if (!family) {
        return res.status(404).json({ error: 'Family not found' });
      }
    }

    const user = new User({ name, familyId: familyId || null });
    await user.save();

    // If familyId was provided, add user to family members
    if (familyId) {
      await Family.findByIdAndUpdate(familyId, {
        $addToSet: { members: user._id }
      });
    }

    res.status(201).json(user);
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
    res.json(user);
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

const express = require('express');
const router = express.Router();
const { Family, User } = require('../models');

// Create a new family
// POST /api/families
// Body: { name: string, userId?: ObjectId }
router.post('/', async (req, res, next) => {
  try {
    const { name, userId } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Family name is required' });
    }

    const family = new Family({ name, members: [] });
    await family.save();

    // If userId is provided, add user to family and update user's familyId
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user already belongs to a family
      if (user.familyId) {
        return res.status(400).json({ error: 'User already belongs to a family' });
      }

      user.familyId = family._id;
      await user.save();

      family.members.push(user._id);
      await family.save();
    }

    res.status(201).json(family);
  } catch (error) {
    next(error);
  }
});

// Get a family by ID with members
// GET /api/families/:id
router.get('/:id', async (req, res, next) => {
  try {
    const family = await Family.findById(req.params.id).populate('members', 'name');
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    res.json(family);
  } catch (error) {
    next(error);
  }
});

// Join a family
// POST /api/families/:id/join
// Body: { userId: ObjectId }
router.post('/:id/join', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const familyId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already belongs to a family
    if (user.familyId) {
      return res.status(400).json({ error: 'User already belongs to a family' });
    }

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    // Add user to family
    user.familyId = family._id;
    await user.save();

    // Add user to family members if not already there
    if (!family.members.includes(user._id)) {
      family.members.push(user._id);
      await family.save();
    }

    const updatedFamily = await Family.findById(familyId).populate('members', 'name');
    res.json(updatedFamily);
  } catch (error) {
    next(error);
  }
});

// Get family members
// GET /api/families/:id/members
router.get('/:id/members', async (req, res, next) => {
  try {
    const family = await Family.findById(req.params.id).populate('members', 'name');
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    res.json(family.members);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

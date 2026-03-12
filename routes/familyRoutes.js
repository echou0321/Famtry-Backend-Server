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

// Leave a family
// POST /api/families/:id/leave
// Body: { userId: ObjectId }
router.post('/:id/leave', async (req, res, next) => {
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

    if (user.familyId?.toString() !== familyId) {
      return res.status(400).json({ error: 'User does not belong to this family' });
    }

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    user.familyId = null;
    await user.save();

    family.members = family.members.filter(
      (memberId) => memberId.toString() !== userId
    );
    await family.save();

    res.json({ message: 'Successfully left the family', familyId });
  } catch (error) {
    next(error);
  }
});

// Add a family member (by existing member: invite by userId)
// POST /api/families/:id/members
// Body: { userIdToAdd: ObjectId, addedByUserId: ObjectId }
router.post('/:id/members', async (req, res, next) => {
  try {
    const { userIdToAdd, addedByUserId } = req.body;
    const familyId = req.params.id;

    if (!userIdToAdd || !addedByUserId) {
      return res.status(400).json({
        error: 'userIdToAdd and addedByUserId are required'
      });
    }

    const [userToAdd, addedByUser, family] = await Promise.all([
      User.findById(userIdToAdd),
      User.findById(addedByUserId),
      Family.findById(familyId)
    ]);

    if (!userToAdd) {
      return res.status(404).json({ error: 'User to add not found' });
    }
    if (!addedByUser) {
      return res.status(404).json({ error: 'Requesting user not found' });
    }
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    if (addedByUser.familyId?.toString() !== familyId) {
      return res.status(403).json({ error: 'Only a family member can add new members' });
    }

    if (userToAdd.familyId) {
      return res.status(400).json({ error: 'User already belongs to a family' });
    }

    userToAdd.familyId = family._id;
    await userToAdd.save();

    if (!family.members.some((id) => id.toString() === userIdToAdd)) {
      family.members.push(userToAdd._id);
      await family.save();
    }

    const updatedFamily = await Family.findById(familyId).populate('members', 'name');
    res.status(201).json(updatedFamily);
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

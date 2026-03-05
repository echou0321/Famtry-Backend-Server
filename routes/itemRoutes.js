const express = require('express');
const router = express.Router();
const { Item, User, Family } = require('../models');

// Get all items for a family
// GET /api/families/:familyId/items
router.get('/families/:familyId/items', async (req, res, next) => {
  try {
    const family = await Family.findById(req.params.familyId);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    const items = await Item.find({ familyId: req.params.familyId })
      .populate('owners', 'name')
      .populate('pendingOwners', 'name')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Create a new item
// POST /api/families/:familyId/items
// Body: { name: string, quantity: number, expirationDate?: Date, ownerId: ObjectId }
router.post('/families/:familyId/items', async (req, res, next) => {
  try {
    const { name, quantity, expirationDate, ownerId } = req.body;
    const { familyId } = req.params;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    if (quantity === undefined || quantity === null || quantity < 0) {
      return res.status(400).json({ error: 'Quantity is required and must be >= 0' });
    }

    // Verify family exists
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    // Verify owner exists and belongs to the family
    if (ownerId) {
      const owner = await User.findById(ownerId);
      if (!owner) {
        return res.status(404).json({ error: 'Owner not found' });
      }
      if (owner.familyId?.toString() !== familyId) {
        return res.status(403).json({ error: 'Owner does not belong to this family' });
      }
    }

    const item = new Item({
      name: name.trim(),
      quantity,
      expirationDate: expirationDate || null,
      familyId,
      owners: ownerId ? [ownerId] : [],
      pendingOwners: []
    });

    await item.save();
    const populatedItem = await Item.findById(item._id)
      .populate('owners', 'name')
      .populate('pendingOwners', 'name');

    res.status(201).json(populatedItem);
  } catch (error) {
    next(error);
  }
});

// Get an item by ID
// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owners', 'name')
      .populate('pendingOwners', 'name')
      .populate('familyId', 'name');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Update an item (only owners can update)
// PUT /api/items/:id
// Body: { quantity?: number, expirationDate?: Date, userId: ObjectId }
router.put('/:id', async (req, res, next) => {
  try {
    const { quantity, expirationDate, userId } = req.body;
    const itemId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user is an owner
    const isOwner = item.owners.some(ownerId => ownerId.toString() === userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only owners can update this item' });
    }

    // Update quantity if provided
    if (quantity !== undefined && quantity !== null) {
      if (quantity < 0) {
        return res.status(400).json({ error: 'Quantity cannot be negative' });
      }
      item.quantity = quantity;
    }

    // Update expiration date if provided (can be null to remove)
    if (expirationDate !== undefined) {
      item.expirationDate = expirationDate || null;
    }

    await item.save();
    const updatedItem = await Item.findById(itemId)
      .populate('owners', 'name')
      .populate('pendingOwners', 'name');

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// Delete an item (only owners can delete)
// DELETE /api/items/:id
// Body: { userId: ObjectId }
router.delete('/:id', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const itemId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user is an owner
    const isOwner = item.owners.some(ownerId => ownerId.toString() === userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only owners can delete this item' });
    }

    await Item.findByIdAndDelete(itemId);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Request ownership of an item
// POST /api/items/:id/request-ownership
// Body: { userId: ObjectId }
router.post('/:id/request-ownership', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const itemId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user is already an owner
    const isOwner = item.owners.some(ownerId => ownerId.toString() === userId);
    if (isOwner) {
      return res.status(400).json({ error: 'User is already an owner' });
    }

    // Check if user already has a pending request
    const hasPendingRequest = item.pendingOwners.some(
      pendingId => pendingId.toString() === userId
    );
    if (hasPendingRequest) {
      return res.status(400).json({ error: 'Ownership request already pending' });
    }

    // Verify user belongs to the same family
    const user = await User.findById(userId);
    if (!user || user.familyId?.toString() !== item.familyId.toString()) {
      return res.status(403).json({ error: 'User must belong to the same family' });
    }

    // Add to pending owners
    item.pendingOwners.push(userId);
    await item.save();

    const updatedItem = await Item.findById(itemId)
      .populate('owners', 'name')
      .populate('pendingOwners', 'name');

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// Approve ownership request
// POST /api/items/:id/approve-ownership/:userId
// Body: { approverId: ObjectId }
router.post('/:id/approve-ownership/:userId', async (req, res, next) => {
  try {
    const { approverId } = req.body;
    const { id: itemId, userId } = req.params;

    if (!approverId) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if approver is an owner
    const isOwner = item.owners.some(ownerId => ownerId.toString() === approverId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only owners can approve requests' });
    }

    // Check if user has a pending request
    const pendingIndex = item.pendingOwners.findIndex(
      pendingId => pendingId.toString() === userId
    );
    if (pendingIndex === -1) {
      return res.status(404).json({ error: 'No pending ownership request found for this user' });
    }

    // Remove from pending and add to owners
    item.pendingOwners.splice(pendingIndex, 1);
    if (!item.owners.includes(userId)) {
      item.owners.push(userId);
    }

    await item.save();
    const updatedItem = await Item.findById(itemId)
      .populate('owners', 'name')
      .populate('pendingOwners', 'name');

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// Reject ownership request
// POST /api/items/:id/reject-ownership/:userId
// Body: { approverId: ObjectId }
router.post('/:id/reject-ownership/:userId', async (req, res, next) => {
  try {
    const { approverId } = req.body;
    const { id: itemId, userId } = req.params;

    if (!approverId) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if approver is an owner
    const isOwner = item.owners.some(ownerId => ownerId.toString() === approverId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only owners can reject requests' });
    }

    // Remove from pending owners
    const pendingIndex = item.pendingOwners.findIndex(
      pendingId => pendingId.toString() === userId
    );
    if (pendingIndex === -1) {
      return res.status(404).json({ error: 'No pending ownership request found for this user' });
    }

    item.pendingOwners.splice(pendingIndex, 1);
    await item.save();

    const updatedItem = await Item.findById(itemId)
      .populate('owners', 'name')
      .populate('pendingOwners', 'name');

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// Remove self as owner (if all owners remove themselves, item is deleted)
// DELETE /api/items/:id/remove-owner/:userId
router.delete('/:id/remove-owner/:userId', async (req, res, next) => {
  try {
    const { id: itemId, userId } = req.params;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user is an owner
    const ownerIndex = item.owners.findIndex(ownerId => ownerId.toString() === userId);
    if (ownerIndex === -1) {
      return res.status(400).json({ error: 'User is not an owner of this item' });
    }

    // Remove user from owners
    item.owners.splice(ownerIndex, 1);

    // If no owners remain, delete the item
    if (item.owners.length === 0) {
      await Item.findByIdAndDelete(itemId);
      return res.json({ message: 'Item deleted because all owners removed themselves' });
    }

    await item.save();
    const updatedItem = await Item.findById(itemId)
      .populate('owners', 'name')
      .populate('pendingOwners', 'name');

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

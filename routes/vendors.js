import express from 'express';
import Vendor from '../models/Vendor.js';
import { authMiddleware, roleMiddleware } from '../utils/authUtils.js';

const router = express.Router();

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find({ isVerified: true })
      .populate('userId', 'firstName lastName email');

    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get vendor profile
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone');

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create/Update vendor profile (Vendor only)
router.post('/profile', authMiddleware, roleMiddleware(['vendor']), async (req, res) => {
  try {
    const { storeName, storeDescription, category, businessRegistration } = req.body;

    if (!storeName || !category) {
      return res.status(400).json({ success: false, message: 'storeName and category are required' });
    }

    let vendor = await Vendor.findOne({ userId: req.user.userId });

    if (!vendor) {
      vendor = new Vendor({
        userId: req.user.userId,
        storeName,
        storeDescription,
        category,
        businessRegistration
      });
    } else {
      Object.assign(vendor, { storeName, storeDescription, category, businessRegistration });
    }

    await vendor.save();
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

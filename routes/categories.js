import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

const CATEGORIES = [
  { name: 'Electronics', icon: '📱', color: '#FF6B35' },
  { name: 'Fashion', icon: '👗', color: '#FF6B35' },
  { name: 'Home', icon: '🏠', color: '#FFA500' },
  { name: 'Food', icon: '🍔', color: '#FFD700' },
  { name: 'Beauty', icon: '💄', color: '#FF69B4' },
  { name: 'Sports', icon: '⚽', color: '#1E90FF' },
  { name: 'Books', icon: '📚', color: '#8B4513' },
  { name: 'Toys', icon: '🎮', color: '#FF1493' }
];

// Get all categories
router.get('/', async (req, res) => {
  try {
    res.json({ success: true, data: CATEGORIES });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get category products
router.get('/:category/products', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const products = await Product.find({ category, isActive: true })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('vendorId', 'storeName rating')
      .exec();

    const total = await Product.countDocuments({ category, isActive: true });

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

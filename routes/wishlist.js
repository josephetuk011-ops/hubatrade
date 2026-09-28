import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { authMiddleware } from '../utils/authUtils.js';

const router = express.Router();

// Get wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.userId, items: [] });
    }
    res.json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add to wishlist
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user.userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.userId, items: [] });
    }

    const itemExists = wishlist.items.some(item => item.productId.toString() === productId);
    if (!itemExists) {
      wishlist.items.push({
        productId,
        name: product.name,
        price: product.price,
        image: product.images[0] || ''
      });
      await wishlist.save();
    }

    res.json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove from wishlist
router.delete('/remove/:productId', authMiddleware, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== req.params.productId);
    await wishlist.save();

    res.json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

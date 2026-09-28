import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { authMiddleware } from '../utils/authUtils.js';

const router = express.Router();

// Get cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.userId }).populate('items.productId');
    if (!cart) {
      cart = await Cart.create({ userId: req.user.userId, items: [] });
    }
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add to cart
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid product or quantity' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      cart = await Cart.create({ userId: req.user.userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        vendorId: product.vendorId,
        name: product.name,
        price: product.price,
        image: product.images[0] || '',
        quantity
      });
    }

    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update cart item
router.put('/update/:productId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    if (quantity === 0) {
      cart.items = cart.items.filter(item => item.productId.toString() !== req.params.productId);
    } else {
      const item = cart.items.find(item => item.productId.toString() === req.params.productId);
      if (item) item.quantity = quantity;
    }

    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear cart
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

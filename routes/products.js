import express from 'express';
import Product from '../models/Product.js';
import { authMiddleware, roleMiddleware } from '../utils/authUtils.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    let filter = { isActive: true };

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('vendorId', 'storeName rating')
      .exec();

    const total = await Product.countDocuments(filter);

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

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendorId');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create product (Vendor only)
router.post('/', authMiddleware, roleMiddleware(['vendor']), async (req, res) => {
  try {
    const { name, description, category, price, stock, images, tags } = req.body;

    if (!name || !category || !price || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const product = new Product({
      vendorId: req.user.userId,
      name,
      description,
      category,
      price,
      stock,
      images: images || [],
      tags: tags || []
    });

    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update product (Vendor only)
router.put('/:id', authMiddleware, roleMiddleware(['vendor']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.vendorId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    Object.assign(product, req.body);
    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

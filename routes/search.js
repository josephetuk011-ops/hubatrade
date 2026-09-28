import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Search products
router.get('/', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, rating, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    let filter = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    };

    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: parseInt(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseInt(maxPrice) };
    if (rating) filter.rating = { $gte: parseInt(rating) };

    const products = await Product.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('vendorId', 'storeName rating')
      .sort({ rating: -1 })
      .exec();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      query: q,
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

// Trending products
router.get('/trending', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ rating: -1, reviews: -1 })
      .limit(10)
      .populate('vendorId', 'storeName rating');

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

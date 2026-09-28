import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { authMiddleware } from '../utils/authUtils.js';

const router = express.Router();

// Get product reviews
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Invalid rating or product' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = new Review({
      productId,
      userId: req.user.userId,
      rating,
      title,
      comment,
      isVerifiedPurchase: true
    });

    await review.save();

    // Update product rating
    const allReviews = await Review.find({ productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: avgRating.toFixed(1),
      reviews: allReviews.length
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update review
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    Object.assign(review, req.body);
    await review.save();

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

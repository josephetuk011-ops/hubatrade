import express from 'express';
import Order from '../models/Order.js';
import { authMiddleware } from '../utils/authUtils.js';

const router = express.Router();

// Get user orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.userId })
      .populate('vendorId', 'storeName')
      .populate('dispatcherId', 'companyName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId')
      .populate('vendorId')
      .populate('dispatcherId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create order
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { vendorId, items, shippingAddress, paymentMethod } = req.body;

    if (!vendorId || !items || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = `ORD-${Date.now()}`;

    const order = new Order({
      orderId,
      customerId: req.user.userId,
      vendorId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'paystack'
    });

    await order.save();
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

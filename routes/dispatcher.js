import express from 'express';
import Dispatcher from '../models/Dispatcher.js';
import Order from '../models/Order.js';
import { authMiddleware, roleMiddleware } from '../utils/authUtils.js';

const router = express.Router();

// Get all available dispatchers
router.get('/', async (req, res) => {
  try {
    const dispatchers = await Dispatcher.find({ isVerified: true })
      .populate('userId', 'firstName lastName email phone');
    res.json({ success: true, data: dispatchers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create/Update dispatcher profile
router.post('/profile', authMiddleware, roleMiddleware(['dispatcher']), async (req, res) => {
  try {
    const { companyName, fleetSize, baseRate, perKmRate } = req.body;

    if (!companyName || !baseRate || !perKmRate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let dispatcher = await Dispatcher.findOne({ userId: req.user.userId });

    if (!dispatcher) {
      dispatcher = new Dispatcher({
        userId: req.user.userId,
        companyName,
        fleetSize: fleetSize || 1,
        baseRate,
        perKmRate
      });
    } else {
      Object.assign(dispatcher, { companyName, fleetSize, baseRate, perKmRate });
    }

    await dispatcher.save();
    res.json({ success: true, data: dispatcher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get dispatcher deliveries
router.get('/deliveries', authMiddleware, roleMiddleware(['dispatcher']), async (req, res) => {
  try {
    const dispatcher = await Dispatcher.findOne({ userId: req.user.userId });
    if (!dispatcher) {
      return res.status(404).json({ success: false, message: 'Dispatcher profile not found' });
    }

    const orders = await Order.find({ dispatcherId: dispatcher._id })
      .populate('customerId', 'firstName lastName phone')
      .populate('vendorId', 'storeName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update delivery status
router.put('/delivery/:orderId/status', authMiddleware, roleMiddleware(['dispatcher']), async (req, res) => {
  try {
    const { orderStatus, trackingNumber } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { orderStatus, trackingNumber, updatedAt: new Date() },
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

import express from 'express';
import ServiceProvider from '../models/ServiceProvider.js';
import { authMiddleware, roleMiddleware } from '../utils/authUtils.js';

const router = express.Router();

// Get all available service providers
router.get('/', async (req, res) => {
  try {
    const providers = await ServiceProvider.find({ availability: true, isVerified: true })
      .populate('userId', 'firstName lastName email phone');

    res.json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get provider by service type
router.get('/type/:serviceType', async (req, res) => {
  try {
    const providers = await ServiceProvider.find({
      serviceType: req.params.serviceType,
      availability: true,
      isVerified: true
    }).populate('userId', 'firstName lastName rating');

    res.json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create/Update provider profile (Provider only)
router.post('/profile', authMiddleware, roleMiddleware(['provider']), async (req, res) => {
  try {
    const { businessName, serviceType, hourlyRate, workingHours } = req.body;

    if (!businessName || !serviceType || !hourlyRate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let provider = await ServiceProvider.findOne({ userId: req.user.userId });

    if (!provider) {
      provider = new ServiceProvider({
        userId: req.user.userId,
        businessName,
        serviceType,
        hourlyRate,
        workingHours
      });
    } else {
      Object.assign(provider, { businessName, serviceType, hourlyRate, workingHours });
    }

    await provider.save();
    res.json({ success: true, data: provider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

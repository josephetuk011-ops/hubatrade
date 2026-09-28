import express from 'express';
import { initializePayment, verifyPayment } from '../services/paystackService.js';
import Order from '../models/Order.js';
import { authMiddleware } from '../utils/authUtils.js';
import { sendOrderConfirmation } from '../services/emailService.js';

const router = express.Router();

// Initialize Payment
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const { amount, email, reference, orderId } = req.body;

    if (!amount || !email || !reference) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const result = await initializePayment(amount, email, reference);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify Payment
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await verifyPayment(reference);

    if (result.status && result.data.status === 'success') {
      // Update order status
      // await Order.updateOne(
      //   { reference },
      //   { paymentStatus: 'completed' }
      // );

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Webhook - Paystack Payment Notification
router.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event === 'charge.success') {
      const { reference, amount, customer } = data;
      
      // Update order in database
      // await Order.updateOne(
      //   { reference },
      //   { 
      //     paymentStatus: 'completed',
      //     orderStatus: 'confirmed'
      //   }
      // );

      console.log(`✅ Payment confirmed for reference: ${reference}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

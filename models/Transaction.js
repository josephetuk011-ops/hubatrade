import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  reference: String,
  amount: Number,
  currency: {
    type: String,
    default: 'NGN'
  },
  paymentMethod: {
    type: String,
    enum: ['paystack', 'wallet', 'cod'],
    default: 'paystack'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  paystackData: mongoose.Schema.Types.Mixed,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Transaction', transactionSchema);

import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
      },
      name: String,
      price: Number,
      quantity: {
        type: Number,
        default: 1
      },
      image: String,
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  totalPrice: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Cart', cartSchema);

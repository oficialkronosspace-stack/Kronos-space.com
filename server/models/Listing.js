const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 2000, default: '' },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    category: {
      type: String,
      enum: ['ropa', 'electronica', 'hogar', 'deportes', 'arte', 'otro'],
      default: 'otro'
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'escrow', 'completed', 'cancelled'],
      default: 'active',
      index: true
    },
    escrow: {
      held: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      commission: { type: Number, default: 0 },      // plataforma retiene 7%
      sellerReceives: { type: Number, default: 0 },  // vendedor recibe 93%
      releasedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

listingSchema.index({ status: 1, category: 1, createdAt: -1 });
listingSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Listing', listingSchema);

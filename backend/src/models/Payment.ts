import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  subscription: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  transactionId?: string;
  invoice: {
    invoiceNumber?: string;
    dueDate?: Date;
    items?: Array<{
      description?: string;
      amount?: number;
      quantity?: number;
    }>;
  };
  billingAddress: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  refundInfo: {
    refundedAt?: Date;
    refundAmount?: number;
    reason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  stripePaymentIntentId: String,
  paypalOrderId: String,
  transactionId: String,
  invoice: {
    invoiceNumber: String,
    dueDate: Date,
    items: [{
      description: String,
      amount: Number,
      quantity: { type: Number, default: 1 }
    }]
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  refundInfo: {
    refundedAt: Date,
    refundAmount: Number,
    reason: String
  }
}, { timestamps: true });

export default mongoose.model<IPayment>('Payment', paymentSchema);
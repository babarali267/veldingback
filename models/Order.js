// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  // ========== Customer Information ==========
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  // ========== Order Items (Products/Services) ==========
  items: [{
    itemName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      default: ''
    }
  }],

  // ========== Payment Details ==========
  finalTotal: {
    type: Number,
    required: true,
    min: 0
  },
  advancePayment: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  }],

  // ========== Order Details ==========
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: false,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },

  // ========== Notes ==========
  notes: {
    type: String,
    default: ''
  },

  // ========== Reference to Quotation (if created from quotation) ==========
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quotation",
    required: false
  },

  // ========== Timestamps ==========
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// ========== Pre-save Middleware ==========
orderSchema.pre('save', async function() {
  try {
    console.log("🔄 Order pre-save middleware running for:", this._id || 'new order');
    
    // If items are provided, calculate total from items
    if (this.items && this.items.length > 0) {
      const calculatedTotal = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      if (calculatedTotal > 0 && !this.finalTotal) {
        this.finalTotal = calculatedTotal;
      }
    }
    
    // Calculate remaining balance
    this.remainingBalance = (this.finalTotal || 0) - (this.advancePayment || 0);
    
    // Update payment status
    if (this.advancePayment >= this.finalTotal) {
      this.paymentStatus = 'paid';
    } else if (this.advancePayment > 0) {
      this.paymentStatus = 'partial';
    } else {
      this.paymentStatus = 'pending';
    }
    
    // Update updatedAt
    this.updatedAt = new Date();
    
    console.log("✅ Order pre-save completed");
    console.log("   Items:", this.items?.length || 0);
    console.log("   Final Total:", this.finalTotal);
    console.log("   Advance:", this.advancePayment);
    console.log("   Remaining:", this.remainingBalance);
    console.log("   Payment Status:", this.paymentStatus);
    console.log("   Due Date:", this.dueDate);
    
  } catch (error) {
    console.error("❌ Error in order pre-save middleware:", error);
    throw error;
  }
});

// ========== Post-save Middleware ==========
orderSchema.post('save', function(doc) {
  console.log("📦 Order saved successfully:", doc._id);
  console.log("   Bill Number:", doc.billNumber);
  console.log("   Items Count:", doc.items?.length || 0);
  console.log("   Due Date:", doc.dueDate);
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
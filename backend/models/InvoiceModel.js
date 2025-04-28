const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  poNumber: { type: String },
  invoiceNumber: { type: String },
  seller: { type: String },
  shippingMethod: { type: String },
  itemsPurchased: { type: Array },
  subtotal: { type: Number },
  taxes: { type: Number },
  totalAmount: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);

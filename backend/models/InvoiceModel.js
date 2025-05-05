const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  poNumber: { type: String },
  invoiceNumber: { type: String },
  seller: { type: String },
  buyer: { type: String },
  consignee: { type: String },
  shippingMethod: { type: String },
  incoterm: { type: String },
  portOfDischarge: { type: String },
  bankAccountHolder: { type: String },
  bankName: { type: String },
  bankAccountNumber: { type: String },
  bankIfscCode: { type: String },
  bankSwiftCode: { type: String },
  deliveryLocation: { type: String },
  invoiceDate: { type: Date },
  paymentTerms: { type: String },
  itemsPurchased: { type: Array },
  subtotal: { type: Number },
  taxes: { type: Number },
  totalAmount: { type: Number },
  fileType: { type: String },
  originalFileName: { type: String },
  extractedText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);

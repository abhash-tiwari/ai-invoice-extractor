const mongoose = require('mongoose');

const stockMasterItemSchema = new mongoose.Schema({
  // Item-level fields (for single item, for compatibility)
  itemCode: { type: String, unique: true, sparse: true  }, 
  name: { type: String },
  description: { type: String },
  materialNumber: { type: String },
  materialDescription: { type: String },
  quantity: { type: String },
  quantityUnit: { type: String },
  pricePerUnit: { type: String },
  netPrice: { type: String },
  totalWeight: { type: String },
  totalPrice: { type: String },
  poDeliveryDate: { type: String },
  hsnCode: { type: String },
  gstRate: { type: String },
  alias: { type: String },
  mfgDate: { type: String },
  expiryDate: { type: String },
  embedding: { type: [Number] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockMasterItem', stockMasterItemSchema); 
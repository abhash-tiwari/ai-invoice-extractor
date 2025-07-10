const mongoose = require('mongoose');

const stockMasterItemSchema = new mongoose.Schema({
  itemCode: { type: String, unique: true, sparse: true  }, 
  description: { type: String },
  poDeliveryDate: { type: String },
  netPrice: { type: String },
  name: { type: String }, // Optional, for compatibility
  embedding: { type: [Number] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockMasterItem', stockMasterItemSchema); 
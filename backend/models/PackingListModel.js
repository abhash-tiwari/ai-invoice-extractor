const mongoose = require('mongoose');

const packingListSchema = new mongoose.Schema({
  vendorNumber: { type: String },
  vendorNo: { type: String },
  invoiceNumber: { type: String },
  invoiceDate: { type: String },
  buyersOrderNo: { type: String },
  buyersOrderDate: { type: String },
  containerNo: { type: String },
  vesselFlightNo: { type: String },
  shippingMethod: { type: String },
  countryOfOrigin: { type: String },
  countryOfDestination: { type: String },
  portOfLoading: { type: String },
  portOfDischarge: { type: String },
  placeOfDelivery: { type: String },
  address: { type: String },
  deliveryLocation: { type: String },
  paymentTerms: { type: String },
  currency: { type: String },
  exporter: { type: String },
  buyer: { type: String },
  consignee: { type: String },
  notifyParty: { type: String },
  incoterm: { type: String },
  authorisedSignatory: { type: String },
  totalQty: { type: String },
  totalNetWeight: { type: String },
  totalGrossWeight: { type: String },
  itemsPurchased: { type: Array },
  bankDetails: {
    accountHolder: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    swiftCode: { type: String }
  },
  invoiceType: { type: String },
  fileType: { type: String },
  originalFileName: { type: String },
  extractedText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PackingList', packingListSchema); 
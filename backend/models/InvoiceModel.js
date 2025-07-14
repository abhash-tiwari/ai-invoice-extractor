const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  poNumber: { type: String },
  invoiceNumber: { type: String },
  seller: { type: String },
  buyer: { type: String },
  consignee: { type: String },
  address: { type: String },
  notifyParty: { type: String },
  shippingMethod: { type: String },
  incoterm: { type: String },
  portOfDischarge: { type: String },
  portOfLoading: { type: String },
  placeOfDelivery: { type: String },
  bankAccountHolder: { type: String },
  bankName: { type: String },
  bankAccountNumber: { type: String },
  bankIfscCode: { type: String },
  bankSwiftCode: { type: String },
  deliveryLocation: { type: String },
  invoiceDate: { type: Date },
  paymentTerms: { type: String },

  exporter: { type: String },
  transporter: { type: String },
  shipTo: { type: String },
  billTo: { type: String },
  GSTNo: { type: String },
  PANNo: { type: String },

  itemsPurchased: { type: Array },
  subtotal: { type: String },
  taxes: { type: String },
  totalAmount: { type: String },
  currency: { type: String },
  fileType: { type: String },
  originalFileName: { type: String },
  extractedText: { type: String },
  // Packing list specific fields
  vendorNumber: { type: String },
  vendorNo: { type: String },
  exporter: { type: String },
  buyersOrderNo: { type: String },
  buyersOrderDate: { type: String },
  containerNo: { type: String },
  vesselFlightNo: { type: String },
  countryOfOrigin: { type: String },
  countryOfDestination: { type: String },
  authorisedSignatory: { type: String },
  totalQty: { type: String },
  totalNetWeight: { type: String },
  totalGrossWeight: { type: String },
  bankDetails: {
    accountHolder: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    swiftCode: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);

const mongoose = require('mongoose');

const PurchaseOrderSchema = new mongoose.Schema({
  vendor: String,
  purchaseOrderNo: String,
  purchaseOrderDate: String,
  vendorNo: String,
  currency: String,
  customerContact: mongoose.Schema.Types.Mixed,



  buyerName: String,
  buyerEmail: String,
  buyerTelephone: String,
  otherReference: String,
  contractOrOfferNo: String,
  customerProjRef: String,
  termsOfPayment: String,
  incoterm: String,
  incotermLocation: String,
  deliveryDate: String,
  goodsMarked: String,
  billTo: mongoose.Schema.Types.Mixed,
  shipTo: mongoose.Schema.Types.Mixed,
  vendorContact: String,
  vendorEmail: String,
  vendorTelephone: String,
  vendorName: String,
  taxId: String,
  totalNetValue: String,
  additionalInformation: String,
  allowanceAmount: String,
  allowances: String,
  projectNumber: String,
  salesOrderNr: String,
  salesOrderItemNr: String,
  itemsOrdered: [{
    position: String,
    lineNo: String,
    itemCode: { type: String, unique: true, sparse: true },
    name: String,
    description: String,
    quantity: String,
    quantityUnit: String,
    pricePerUnit: String,
    netPrice: String,
    totalWeight: String,
    totalPrice: String,
    poDeliveryDate: String,
    hsnCode: String,
    gstRate: String,
    alias: String,
    mfgDate: String,
    expiryDate: String,
    embedding: {
      type: [Number],
      default: undefined
    }
  }],
  invoiceType: String,
  fileType: String,
  originalFileName: String,
  extractedText: String
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema); 
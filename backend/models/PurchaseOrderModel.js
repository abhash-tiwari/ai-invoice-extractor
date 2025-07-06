const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  vendor: { type: String },
  purchaseOrderNo: { type: String },
  purchaseOrderDate: { type: String },
  vendorNo: { type: String },
  currency: { type: String },
  customerContact: {
    name: { type: String },
    email: { type: String },
    telephone: { type: String },
    fax: { type: String }
  },
  buyerName: { type: String },
  buyerEmail: { type: String },
  buyerTelephone: { type: String },
  otherReference: { type: String },
  contractOrOfferNo: { type: String },
  customerProjRef: { type: String },
  termsOfPayment: { type: String },
  incoterm: { type: String },
  incotermLocation: { type: String },
  deliveryDate: { type: String },
  goodsMarked: { type: String },
  billTo: { type: Object },
  shipTo: { type: Object },
  vendorContact: { type: String },
  vendorEmail: { type: String },
  vendorTelephone: { type: String },
  vendorName: { type: String },
  taxId: { type: String },
  totalNetValue: { type: String },
  additionalInformation: { type: String },
  allowanceAmount: { type: String },
  allowances: { type: String },
  projectNumber: { type: String },
  salesOrderNr: { type: String },
  salesOrderItemNr: { type: String },
  itemsOrdered: { type: Array },
  invoiceType: { type: String },
  fileType: { type: String },
  originalFileName: { type: String },
  extractedText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema); 
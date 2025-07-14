import './InvoiceSummary.css';
import PurchaseOrderItemsTable from './PurchaseOrderItemsTable';

const renderInput = (name, value, onChange, label, isLong = false) => (
  <div className="summary-field">
    <span className="summary-label">{label}</span>
    {isLong ? (
      <textarea
        className="summary-textarea"
        value={value || ''}
        onChange={e => onChange(name, e.target.value)}
        rows={2}
      />
    ) : (
      <input
        className="summary-input"
        type="text"
        value={value || ''}
        onChange={e => onChange(name, e.target.value)}
      />
    )}
  </div>
);

const renderBankDetails = (bankDetails, onChange) => {
  if (!bankDetails) bankDetails = {};
  const { accountHolder, bankName, accountNumber, ifscCode, swiftCode } = bankDetails;
  return (
    <div className="bank-details-subbox">
      {renderInput('bankDetails.accountHolder', accountHolder, onChange, 'Account Holder')}
      {renderInput('bankDetails.bankName', bankName, onChange, 'Bank Name')}
      {renderInput('bankDetails.accountNumber', accountNumber, onChange, 'Account Number')}
      {renderInput('bankDetails.ifscCode', ifscCode, onChange, 'IFSC Code')}
      {renderInput('bankDetails.swiftCode', swiftCode, onChange, 'SWIFT Code')}
    </div>
  );
};

const twoCol = (fields) => (
  <div className="details-grid">
    {fields.map((field, idx) => (
      <div key={idx}>{field}</div>
    ))}
  </div>
);

const InvoiceSummary = ({
  // PO/Invoice/Party fields
  invoiceNumber,
  invoiceDate,
  poNumber,
  purchaseOrderNo,
  purchaseOrderDate,
  projectNumber,
  otherReference,
  salesOrderNr,
  salesOrderItemNr,
  customerProjRef,
  additionalInformation,
  billTo,
  shipTo,
  address,
  consignee,
  seller,
  exporter,
  vendor,
  vendorName,
  vendorNo,
  vendorContact,
  vendorEmail,
  vendorTelephone,
  buyer,
  buyerName,
  buyerEmail,
  buyerTelephone,
  GSTNo,
  PANNo,
  taxId,
  // Shipping/Logistics
  portOfLoading,
  portOfDischarge,
  vesselFlightNo,
  containerNo,
  transporter,
  countryOfOrigin,
  countryOfDestination,
  deliveryDate,
  shippingMethod,
  incoterm,
  incotermLocation,
  goodsMarked,
  contractOrOfferNo,
  // Bank/Payment
  bankDetails,
  termsOfPayment,
  authorisedSignatory,
  // Totals
  currency,
  totalNetValue,
  totalQty,
  totalGrossWeight,
  totalNetWeight,
  allowances,
  allowanceAmount,
  // Items
  itemsOrdered = [],
  // Misc
  onFieldChange,
  onSave,
  ...props
}) => {
  return (
    <div className="invoice-summary-container">
      {/* Row for Purchase Order Details and Financial Details side by side */}
      <div className="row">
        <div className="box po-details">
          <h2>Purchase Order Details</h2>
          {twoCol([
            renderInput('invoiceNumber', invoiceNumber, onFieldChange, 'Invoice Number'),
            renderInput('invoiceDate', invoiceDate, onFieldChange, 'Invoice Date'),
            renderInput('poNumber', poNumber, onFieldChange, 'PO Number'),
            renderInput('purchaseOrderNo', purchaseOrderNo, onFieldChange, 'Purchase Order No'),
            renderInput('purchaseOrderDate', purchaseOrderDate, onFieldChange, 'PO Date'),
            renderInput('projectNumber', projectNumber, onFieldChange, 'Project Number'),
            renderInput('otherReference', otherReference, onFieldChange, 'Other Reference'),
            renderInput('salesOrderNr', salesOrderNr, onFieldChange, 'Sales Order No'),
            renderInput('salesOrderItemNr', salesOrderItemNr, onFieldChange, 'Sales Order Item No'),
            renderInput('customerProjRef', customerProjRef, onFieldChange, 'Customer Project Ref'),
            renderInput('additionalInformation', additionalInformation, onFieldChange, 'Additional Information', true),
          ])}
        </div>
        <div className="box financial-details">
          <h2>Financial Details</h2>
          {twoCol([
            renderInput('currency', currency, onFieldChange, 'Currency'),
            renderInput('totalNetValue', totalNetValue, onFieldChange, 'Total Net Value'),
            renderInput('totalQty', totalQty, onFieldChange, 'Total Quantity'),
            renderInput('totalGrossWeight', totalGrossWeight, onFieldChange, 'Total Gross Weight'),
            renderInput('totalNetWeight', totalNetWeight, onFieldChange, 'Total Net Weight'),
            renderInput('allowances', allowances, onFieldChange, 'Allowances'),
            renderInput('allowanceAmount', allowanceAmount, onFieldChange, 'Allowance Amount'),
          ])}
        </div>
      </div>

      {/* Addresses */}
      <div className="box addresses-details">
        <h2>Addresses</h2>
        {twoCol([
          renderInput('billTo', billTo, onFieldChange, 'Bill To', true),
          renderInput('shipTo', shipTo, onFieldChange, 'Ship To', true),
          renderInput('address', address, onFieldChange, 'Address', true),
          renderInput('consignee', consignee, onFieldChange, 'Consignee', true),
        ])}
      </div>

      {/* Other Details */}
      <div className="box other-details">
        <h2>Other Details</h2>
        {twoCol([
          renderInput('additionalInformation', additionalInformation, onFieldChange, 'Additional Information', true),
          renderInput('customerProjRef', customerProjRef, onFieldChange, 'Customer Project Ref'),
          renderInput('deliveryDate', deliveryDate, onFieldChange, 'Delivery Date'),
          renderInput('goodsMarked', goodsMarked, onFieldChange, 'Goods Marked'),
          renderInput('contractOrOfferNo', contractOrOfferNo, onFieldChange, 'Contract/Offer No'),
          renderInput('salesOrderNr', salesOrderNr, onFieldChange, 'Sales Order No'),
          renderInput('salesOrderItemNr', salesOrderItemNr, onFieldChange, 'Sales Order Item No'),
        ])}
      </div>

      {/* Party Details: Vendor, Buyer, Consignee, Seller, Exporter */}
      <div className="row">
        <div className="box party-details">
          <h2>Vendor</h2>
          {twoCol([
            renderInput('vendor', vendor, onFieldChange, 'Vendor'),
            renderInput('vendorName', vendorName, onFieldChange, 'Vendor Name'),
            renderInput('vendorNo', vendorNo, onFieldChange, 'Vendor No'),
            renderInput('vendorContact', vendorContact, onFieldChange, 'Vendor Contact'),
            renderInput('vendorEmail', vendorEmail, onFieldChange, 'Vendor Email'),
            renderInput('vendorTelephone', vendorTelephone, onFieldChange, 'Vendor Telephone'),
          ])}
        </div>
        <div className="box party-details">
          <h2>Buyer</h2>
          {twoCol([
            renderInput('buyer', buyer, onFieldChange, 'Buyer'),
            renderInput('buyerName', buyerName, onFieldChange, 'Buyer Name'),
            renderInput('buyerEmail', buyerEmail, onFieldChange, 'Buyer Email'),
            renderInput('buyerTelephone', buyerTelephone, onFieldChange, 'Buyer Telephone'),
          ])}
        </div>
        <div className="box party-details">
          <h2>Consignee</h2>
          {twoCol([
            renderInput('consignee', consignee, onFieldChange, 'Consignee', true),
          ])}
        </div>
        <div className="box party-details">
          <h2>Seller / Exporter</h2>
          {twoCol([
            renderInput('seller', seller, onFieldChange, 'Seller'),
            renderInput('exporter', exporter, onFieldChange, 'Exporter'),
          ])}
        </div>
        <div className="box party-details">
          <h2>GST/PAN/Tax</h2>
          {twoCol([
            renderInput('GSTNo', GSTNo, onFieldChange, 'GST No'),
            renderInput('PANNo', PANNo, onFieldChange, 'PAN No'),
            renderInput('taxId', taxId, onFieldChange, 'Tax ID'),
          ])}
        </div>
      </div>

      {/* Shipping Details */}
      <div className="box shipping-details">
        <h2>Shipping Details</h2>
        {twoCol([
          renderInput('portOfLoading', portOfLoading, onFieldChange, 'Port of Loading'),
          renderInput('portOfDischarge', portOfDischarge, onFieldChange, 'Port of Discharge'),
          renderInput('vesselFlightNo', vesselFlightNo, onFieldChange, 'Vessel/Flight No'),
          renderInput('containerNo', containerNo, onFieldChange, 'Container No'),
          renderInput('transporter', transporter, onFieldChange, 'Transporter'),
          renderInput('countryOfOrigin', countryOfOrigin, onFieldChange, 'Country of Origin'),
          renderInput('countryOfDestination', countryOfDestination, onFieldChange, 'Country of Destination'),
          renderInput('shippingMethod', shippingMethod, onFieldChange, 'Shipping Method'),
          renderInput('incoterm', incoterm, onFieldChange, 'Incoterm'),
          renderInput('incotermLocation', incotermLocation, onFieldChange, 'Incoterm Location'),
        ])}
      </div>

      {/* Payment & Terms */}
      <div className="box payment-terms">
        <h2>Payment & Terms</h2>
        {twoCol([
          renderInput('termsOfPayment', termsOfPayment, onFieldChange, 'Terms of Payment'),
          renderInput('authorisedSignatory', authorisedSignatory, onFieldChange, 'Authorised Signatory'),
        ])}
      </div>

      {/* Bank Details */}
      <div className="box bank-details">
        <h2>Bank Details</h2>
        {renderBankDetails(bankDetails, onFieldChange)}
      </div>

      {/* Items Table (unchanged) */}
      <div className="box">
        <h2>Items Ordered</h2>
        <PurchaseOrderItemsTable
          items={itemsOrdered}
          onItemsChange={updatedItems => onFieldChange('itemsOrdered', updatedItems)}
        />
      </div>

      {/* Save Button */}
      <div style={{ marginTop: 32, textAlign: 'right' }}>
        <button className="upload-button" onClick={() => onSave && onSave()}>Save</button>
      </div>
    </div>
  );
};

export default InvoiceSummary; 
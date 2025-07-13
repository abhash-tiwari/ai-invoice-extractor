import React from 'react';
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

const InvoiceSummary = ({
  type = 'invoice',
  poNumber,
  invoiceDate,
  currency,
  subtotal,
  taxes,
  totalAmount,
  seller,
  buyer,
  consignee,
  shippingMethod,
  incoterm,
  portOfDischarge,
  deliveryLocation,
  notifyParty,
  paymentTerms,
  bankAccountHolder,
  bankName,
  bankAccountNumber,
  bankSwiftCode,
  bankIfscCode,
  totalItems,
  totalQuantity,
  totalWeight,
  totalPrice,
  // PO-specific
  vendor,
  vendorName,
  vendorContact,
  vendorNo,
  vendorEmail,
  vendorTelephone,
  buyerName,
  buyerTelephone,
  billTo,
  shipTo,
  incotermLocation,
  termsOfPayment,
  taxId,
  totalNetValue,
  additionalInformation,
  customerContact,
  customerProjRef,
  deliveryDate,
  goodsMarked,
  onFieldChange,
  onSave,
  isPurchaseOrder,
  itemsOrdered = [],
  items,
  ...props
}) => {
  const poItems = itemsOrdered || items || [];
  return (
    <div className="invoice-summary-container">
      <div className="row">
        <div className="box po-details">
          <h2>{type === 'purchase_order' ? 'Purchase Order Details' : 'Purchase Order details'}</h2>
          <div className="details-grid">
            {type === 'purchase_order' ? (
              <>
                {renderInput('poNumber', poNumber, onFieldChange, 'PO No')}
                {renderInput('invoiceDate', invoiceDate, onFieldChange, 'Invoice Date')}
                {renderInput('vendor', vendor, onFieldChange, 'Vendor')}
                {renderInput('incoterm', incoterm, onFieldChange, 'Incoterm')}
                {renderInput('incotermLocation', incotermLocation, onFieldChange, 'Incoterm Location')}
              </>
            ) : (
              <>
                {renderInput('poNumber', poNumber, onFieldChange, 'PO No')}
                {renderInput('invoiceDate', invoiceDate, onFieldChange, 'Invoice Date')}
                {renderInput('currency', currency, onFieldChange, 'Currency')}
              </>
            )}
          </div>
        </div>
        <div className="box financial-details">
          <h2>Financial Details</h2>
          <div className="details-grid">
            {type === 'purchase_order' ? (
              <>
                {renderInput('totalNetValue', totalNetValue, onFieldChange, 'Total Net Value')}
              </>
            ) : (
              <>
                {renderInput('subtotal', subtotal, onFieldChange, 'Subtotal')}
                {renderInput('taxes', taxes, onFieldChange, 'Taxes')}
                {renderInput('totalAmount', totalAmount, onFieldChange, 'Total Amount')}
              </>
            )}
          </div>
        </div>
      </div>
      {type === 'purchase_order' && (billTo || shipTo) && (
        <div className="row">
          <div className="box addresses-details">
            <h2>Addresses</h2>
            <div className="details-grid">
              {billTo && <div><span>Bill To</span>{renderInput('billTo', billTo, onFieldChange, 'Bill To', true)}</div>}
              {shipTo && <div><span>Ship To</span>{renderInput('shipTo', shipTo, onFieldChange, 'Ship To', true)}</div>}
            </div>
          </div>
        </div>
      )}
      {type === 'purchase_order' && (
        <div className="row">
          <div className="box other-details">
            <h2>Other Details</h2>
            <div className="details-grid">
              {renderInput('additionalInformation', additionalInformation, onFieldChange, 'Additional Information', true)}
              {renderInput('customerContact', customerContact, onFieldChange, 'Customer Contact', true)}
              {renderInput('customerProjRef', customerProjRef, onFieldChange, 'Customer Project Reference', true)}
              {renderInput('deliveryDate', deliveryDate, onFieldChange, 'Delivery Date')}
              {renderInput('goodsMarked', goodsMarked, onFieldChange, 'Goods Marked', true)}
            </div>
          </div>
        </div>
      )}
      <div className="row">
        {type === 'purchase_order' ? (
          <>
            <div className="box party-details">
              <h2>Vendor</h2>
              <div className="party-subfields">
                <div><strong>Name:</strong> {renderInput('vendorName', vendorName, onFieldChange, 'Vendor Name')}</div>
                {vendorNo && <div><strong>No:</strong> {renderInput('vendorNo', vendorNo, onFieldChange, 'Vendor No')}</div>}
                {vendorContact && <div><strong>Contact:</strong> {renderInput('vendorContact', vendorContact, onFieldChange, 'Vendor Contact')}</div>}
                {vendorEmail && <div><strong>Email:</strong> {renderInput('vendorEmail', vendorEmail, onFieldChange, 'Vendor Email')}</div>}
                {vendorTelephone && <div><strong>Telephone:</strong> {renderInput('vendorTelephone', vendorTelephone, onFieldChange, 'Vendor Telephone')}</div>}
              </div>
            </div>
            <div className="box party-details">
              <h2>Buyer</h2>
              <div className="party-subfields">
                <div><strong>Name:</strong> {renderInput('buyerName', buyerName, onFieldChange, 'Buyer Name')}</div>
                <div><strong>Telephone:</strong> {renderInput('buyerTelephone', buyerTelephone, onFieldChange, 'Buyer Telephone')}</div>
              </div>
            </div>
            <div className="box party-details">
              <h2>Consignee</h2>
              <div className="party-subfields">
                {renderInput('consignee', consignee, onFieldChange, 'Consignee', true)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="box party-details"><h2>Seller</h2><div className="party-line">{renderInput('seller', seller, onFieldChange, 'Seller', true)}</div></div>
            <div className="box party-details"><h2>Buyer</h2><div className="party-line">{renderInput('buyer', buyer, onFieldChange, 'Buyer', true)}</div></div>
            <div className="box party-details"><h2>Consignee</h2><div className="party-line">{renderInput('consignee', consignee, onFieldChange, 'Consignee', true)}</div></div>
          </>
        )}
      </div>
      <div className="row">
        <div className="box shipping-details">
          <h2>Shipping Details</h2>
          <div className="details-grid">
            {renderInput('shippingMethod', shippingMethod, onFieldChange, 'Shipping Method')}
            {renderInput('incoterm', incoterm, onFieldChange, 'Incoterm')}
            {renderInput('portOfDischarge', portOfDischarge, onFieldChange, 'Port of Discharge')}
            {renderInput('deliveryLocation', deliveryLocation, onFieldChange, 'Delivery Location')}
            {renderInput('notifyParty', notifyParty, onFieldChange, 'Notify Party')}
          </div>
        </div>
        <div className="box payment-terms">
          <h2>Payment & Terms</h2>
          <div className="details-grid">
            {renderInput('termsOfPayment', termsOfPayment, onFieldChange, 'Terms of Payment')}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="box bank-details">
          <h2>Bank Details</h2>
          <div className="details-grid bank-grid">
            {renderInput('bankAccountHolder', bankAccountHolder, onFieldChange, 'Bank Account Holder')}
            {renderInput('bankName', bankName, onFieldChange, 'Bank Name')}
            {renderInput('bankAccountNumber', bankAccountNumber, onFieldChange, 'Bank Account Number')}
            {renderInput('bankSwiftCode', bankSwiftCode, onFieldChange, 'Bank Swift Code')}
            {renderInput('bankIfscCode', bankIfscCode, onFieldChange, 'Bank IFSC Code')}
          </div>
        </div>
      </div>
      <div className="row summary-row">
        <div className="summary-box">Total Items<div className="line">{totalItems || ''}</div></div>
        <div className="summary-box">Total Quantity<div className="line">{totalQuantity || ''}</div></div>
        <div className="summary-box">Total Weight<div className="line">{totalWeight || ''}</div></div>
        <div className="summary-box">Total Price<div className="line">{totalPrice || ''}</div></div>
      </div>
      {isPurchaseOrder && (
        <>
          <PurchaseOrderItemsTable
            items={poItems}
            onItemsChange={updatedItems => onFieldChange('itemsOrdered', updatedItems)}
          />
          <div style={{ marginTop: 32, textAlign: 'right' }}>
            <button className="upload-button" onClick={() => onSave && onSave()}>Save</button>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceSummary; 
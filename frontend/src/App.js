import React, { useState } from 'react';
import axios from 'axios';
import InvoiceForm from './components/InvoiceForm';
import './components/InvoiceForm.css';
import './App.css';
import StockMaster from './components/StockMaster';
import InvoiceSummary from './components/InvoiceSummary';
import PurchaseOrderItemsTable from './components/PurchaseOrderItemsTable';

function App() {
  const [file, setFile] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [invoiceType, setInvoiceType] = useState('regular');
  const [expectedItemCount, setExpectedItemCount] = useState('');
  const [activeTab, setActiveTab] = useState('extractor');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file!");

    setIsLoading(true);
    console.log('Selected file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const formData = new FormData();
    formData.append('invoice', file);
    formData.append('invoiceType', invoiceType);
    if (expectedItemCount) {
      formData.append('expectedItemCount', expectedItemCount);
    }

    try {
      console.log('Sending request to:', `/api/invoices/upload`);
      const res = await axios.post(
        `/api/invoices/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      console.log('Response received:', res.data);
      setInvoiceData(res.data.data);
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedData) => {
    console.log('handleSave called with:', updatedData);
    let url = '/api/invoices/save';
    if (updatedData.invoiceType === 'packing_list') {
      url = '/api/invoices/save-packing-list';
    } else if (updatedData.invoiceType === 'purchase_order') {
      url = '/api/invoices/save-purchase-order';
    }
    console.log('Saving to URL:', url);
    try {
      await axios.post(url, updatedData);
      alert('Invoice saved successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error:', error.message);
      alert('Failed to save invoice');
    }
  };

  // Handler for summary field changes
  const handleSummaryFieldChange = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('extractor')}
          style={{
            marginRight: 12,
            padding: '8px 16px',
            background: activeTab === 'extractor' ? '#007bff' : '#eee',
            color: activeTab === 'extractor' ? '#fff' : '#333',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: activeTab === 'extractor' ? 'bold' : 'normal'
          }}
        >
          Invoice Extractor
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'stock' ? '#007bff' : '#eee',
            color: activeTab === 'stock' ? '#fff' : '#333',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: activeTab === 'stock' ? 'bold' : 'normal'
          }}
        >
          Stock Master
        </button>
      </div>
      {activeTab === 'extractor' && (
        <>
          <h1>Invoice Extractor</h1>
          <div className='upload-container'>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Invoice Type:</label>
              <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
                <option value="regular">Regular Invoice</option>
                <option value="packing_list">Packing List</option>
                <option value="purchase_order">Purchase Order</option>
              </select>
            </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Expected Number of Items:</label>
                <input
                  type="number"
                  min="1"
                  value={expectedItemCount}
                  onChange={e => setExpectedItemCount(e.target.value)}
                  placeholder="e.g. 22"
                />
              </div>
            <div className='file-input-container'>
              <label className="file-input-label">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="file-input"
                />
                <span className="file-input-text">
                  {fileName || 'Choose PDF or Image file'}
                </span>
                <span className="file-input-button">Browse</span>
              </label>
            </div>
            <button 
              className="upload-button"
              onClick={handleUpload}
              disabled={!file || isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Extracting...
                </span>
              ) : (
                'Upload Invoice'
              )}
            </button>
          </div>
          {invoiceData && (
            invoiceData.purchaseOrderNo || invoiceData.itemsOrdered ? (
              <>
                <InvoiceSummary
                  type="purchase_order"
                  poNumber={invoiceData.poNumber || invoiceData.purchaseOrderNo || invoiceData.invoiceNumber}
                  invoiceDate={invoiceData.invoiceDate || invoiceData.purchaseOrderDate}
                  currency={invoiceData.currency}
                  subtotal={invoiceData.subtotal}
                  taxes={invoiceData.taxes}
                  totalAmount={invoiceData.totalAmount}
                  seller={invoiceData.seller}
                  buyer={invoiceData.buyer}
                  consignee={invoiceData.consignee}
                  shippingMethod={invoiceData.shippingMethod}
                  incoterm={invoiceData.incoterm}
                  portOfDischarge={invoiceData.portOfDischarge}
                  deliveryLocation={invoiceData.deliveryLocation}
                  notifyParty={invoiceData.notifyParty}
                  paymentTerms={invoiceData.paymentTerms}
                  bankAccountHolder={invoiceData.bankAccountHolder}
                  bankName={invoiceData.bankName}
                  bankAccountNumber={invoiceData.bankAccountNumber}
                  bankSwiftCode={invoiceData.bankSwiftCode}
                  bankIfscCode={invoiceData.bankIfscCode}
                  totalItems={(invoiceData.itemsPurchased && invoiceData.itemsPurchased.length) || (invoiceData.itemsOrdered && invoiceData.itemsOrdered.length) || 0}
                  totalQuantity={((invoiceData.itemsPurchased && invoiceData.itemsPurchased.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)) || (invoiceData.itemsOrdered && invoiceData.itemsOrdered.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)) || 0)}
                  totalWeight={((invoiceData.itemsPurchased && invoiceData.itemsPurchased.reduce((sum, item) => sum + (Number(item.totalWeight) || 0), 0)) || (invoiceData.itemsOrdered && invoiceData.itemsOrdered.reduce((sum, item) => sum + (Number(item.totalWeight) || 0), 0)) || 0)}
                  totalPrice={((invoiceData.itemsPurchased && invoiceData.itemsPurchased.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0)) || (invoiceData.itemsOrdered && invoiceData.itemsOrdered.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0)) || 0)}
                  vendor={invoiceData.vendor}
                  vendorName={invoiceData.vendorName}
                  vendorContact={invoiceData.vendorContact}
                  vendorNo={invoiceData.vendorNo}
                  vendorEmail={invoiceData.vendorEmail}
                  vendorTelephone={invoiceData.vendorTelephone}
                  buyerName={invoiceData.buyerName}
                  buyerTelephone={invoiceData.buyerTelephone}
                  billTo={invoiceData.billTo}
                  shipTo={invoiceData.shipTo}
                  incotermLocation={invoiceData.incotermLocation}
                  termsOfPayment={invoiceData.termsOfPayment}
                  taxId={invoiceData.taxId}
                  totalNetValue={invoiceData.totalNetValue}
                  additionalInformation={invoiceData.additionalInformation}
                  customerContact={invoiceData.customerContact}
                  customerProjRef={invoiceData.customerProjRef}
                  deliveryDate={invoiceData.deliveryDate}
                  goodsMarked={invoiceData.goodsMarked}
                  address={invoiceData.address}
                  GSTNo={invoiceData.GSTNo}
                  PANNo={invoiceData.PANNo}
                  countryOfOrigin={invoiceData.countryOfOrigin}
                  countryOfDestination={invoiceData.countryOfDestination}
                  bankDetails={invoiceData.bankDetails}
                  onFieldChange={(field, value) => {
                    setInvoiceData(prev => ({
                      ...prev,
                      [field]: value,
                      invoiceType: 'purchase_order', // Always set invoiceType for PO
                    }));
                  }}
                  onSave={() => {
                    // Always set invoiceType before saving
                    handleSave({ ...invoiceData, invoiceType: 'purchase_order' });
                  }}
                  isPurchaseOrder={true}
                  itemsOrdered={invoiceData.itemsOrdered}
                  items={invoiceData.items}
                />
                {/* InvoiceForm removed for purchase orders */}
              </>
            ) : (
              <>
                <InvoiceSummary
                  type={invoiceType}
                  poNumber={invoiceData.poNumber || invoiceData.purchaseOrderNo || invoiceData.invoiceNumber}
                  invoiceDate={invoiceData.invoiceDate || invoiceData.purchaseOrderDate}
                  currency={invoiceData.currency}
                  subtotal={invoiceData.subtotal}
                  taxes={invoiceData.taxes}
                  totalAmount={invoiceData.totalAmount}
                  seller={invoiceData.seller}
                  buyer={invoiceData.buyer}
                  consignee={invoiceData.consignee}
                  shippingMethod={invoiceData.shippingMethod}
                  incoterm={invoiceData.incoterm}
                  portOfDischarge={invoiceData.portOfDischarge}
                  deliveryLocation={invoiceData.deliveryLocation}
                  notifyParty={invoiceData.notifyParty}
                  paymentTerms={invoiceData.paymentTerms}
                  bankAccountHolder={invoiceData.bankAccountHolder}
                  bankName={invoiceData.bankName}
                  bankAccountNumber={invoiceData.bankAccountNumber}
                  bankSwiftCode={invoiceData.bankSwiftCode}
                  bankIfscCode={invoiceData.bankIfscCode}
                  totalItems={(invoiceData.itemsPurchased && invoiceData.itemsPurchased.length) || (invoiceData.itemsOrdered && invoiceData.itemsOrdered.length) || 0}
                  totalQuantity={((invoiceData.itemsPurchased && invoiceData.itemsPurchased.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)) || (invoiceData.itemsOrdered && invoiceData.itemsOrdered.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)) || 0)}
                  totalWeight={((invoiceData.itemsPurchased && invoiceData.itemsPurchased.reduce((sum, item) => sum + (Number(item.totalWeight) || 0), 0)) || (invoiceData.itemsOrdered && invoiceData.itemsOrdered.reduce((sum, item) => sum + (Number(item.totalWeight) || 0), 0)) || 0)}
                  totalPrice={((invoiceData.itemsPurchased && invoiceData.itemsPurchased.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0)) || (invoiceData.itemsOrdered && invoiceData.itemsOrdered.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0)) || 0)}
                  vendor={invoiceData.vendor}
                  vendorName={invoiceData.vendorName}
                  vendorContact={invoiceData.vendorContact}
                  vendorNo={invoiceData.vendorNo}
                  vendorEmail={invoiceData.vendorEmail}
                  vendorTelephone={invoiceData.vendorTelephone}
                  buyerName={invoiceData.buyerName}
                  buyerTelephone={invoiceData.buyerTelephone}
                  billTo={invoiceData.billTo}
                  shipTo={invoiceData.shipTo}
                  incotermLocation={invoiceData.incotermLocation}
                  termsOfPayment={invoiceData.termsOfPayment}
                  taxId={invoiceData.taxId}
                  totalNetValue={invoiceData.totalNetValue}
                  additionalInformation={invoiceData.additionalInformation}
                  customerContact={invoiceData.customerContact}
                  customerProjRef={invoiceData.customerProjRef}
                  deliveryDate={invoiceData.deliveryDate}
                  goodsMarked={invoiceData.goodsMarked}
                  onFieldChange={handleSummaryFieldChange}
                />
                <InvoiceForm
                  invoiceData={invoiceData}
                  onSave={handleSave}
                  invoiceType={invoiceType}
                />
              </>
            )
          )}
        </>
      )}
      {activeTab === 'stock' && <StockMaster />}
    </div>
  );
}

export default App;

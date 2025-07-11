import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FIELD_LABELS = {
  itemCode: 'Item Code',
  name: 'Name',
  description: 'Description',
  materialNumber: 'Material Number',
  materialDescription: 'Material Description',
  quantity: 'Quantity',
  quantityUnit: 'Quantity Unit',
  pricePerUnit: 'Price Per Unit',
  netPrice: 'Net Price',
  totalWeight: 'Total Weight',
  totalPrice: 'Total Price',
  poDeliveryDate: 'PO Delivery Date',
  hsnCode: 'HSN Code',
  gstRate: 'GST Rate',
  alias: 'Alias',
  mfgDate: 'Manufacturing Date',
  expiryDate: 'Expiry Date',
  matchStatus: 'Match Status',
  confidence: 'Confidence',
  method: 'Match Method',
  vendor: 'Vendor',
  purchaseOrderNo: 'Purchase Order No',
  purchaseOrderDate: 'Purchase Order Date',
  vendorNo: 'Vendor No',
  currency: 'Currency',
  customerContact: 'Customer Contact',
  buyerName: 'Buyer Name',
  buyerEmail: 'Buyer Email',
  buyerTelephone: 'Buyer Telephone',
  otherReference: 'Other Reference',
  contractOrOfferNo: 'Contract/Offer No',
  customerProjRef: 'Customer Project Ref',
  termsOfPayment: 'Terms of Payment',
  incoterm: 'Incoterm',
  incotermLocation: 'Incoterm Location',
  deliveryDate: 'Delivery Date',
  goodsMarked: 'Goods Marked',
  billTo: 'Bill To',
  shipTo: 'Ship To',
  vendorContact: 'Vendor Contact',
  vendorEmail: 'Vendor Email',
  vendorTelephone: 'Vendor Telephone',
  vendorName: 'Vendor Name',
  taxId: 'Tax ID',
  totalNetValue: 'Total Net Value',
  additionalInformation: 'Additional Information',
  allowanceAmount: 'Allowance Amount',
  allowances: 'Allowances',
  projectNumber: 'Project Number',
  salesOrderNr: 'Sales Order Nr',
  salesOrderItemNr: 'Sales Order Item Nr',
};
const EXCLUDE_FIELDS = ['embedding', '_id', '__v', 'createdAt'];

const ITEM_FIELDS = [
  'itemCode','name','description','materialNumber','materialDescription','quantity','quantityUnit','pricePerUnit','netPrice','totalWeight','totalPrice','poDeliveryDate','hsnCode','gstRate','alias','mfgDate','expiryDate','matchStatus','confidence','method','matchedMasterItem'
];

const StockMaster = () => {
  const [masterItems, setMasterItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAllFields, setShowAllFields] = useState({});
  const [extractedDocInfo, setExtractedDocInfo] = useState({});

  useEffect(() => {
    fetchMasterItems();
  }, []);

  const fetchMasterItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/stockmasteritems');
      setMasterItems(res.data.items || []);
    } catch (err) {
      setError('Failed to fetch Stock Master items');
    } finally {
      setLoading(false);
    }
  };

  // PDF upload handler
  const handlePdfChange = (e) => setPdfFile(e.target.files[0]);

  // Call backend to extract items
  const handleExtract = async (e) => {
    e.preventDefault();
    if (!pdfFile) return;
    const formData = new FormData();
    formData.append('file', pdfFile);
    const res = await axios.post('/api/stockmasteritems/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log('Extract response:', res.data); // DEBUG: log the full response
    // Separate root-level fields from items
    const { items, extractedText, ...docInfo } = res.data;
    setExtractedItems(items);
    setExtractedText(extractedText);
    // Remove array/object fields and technical fields
    const docFields = {};
    Object.entries(docInfo).forEach(([key, value]) => {
      if (!Array.isArray(value) && typeof value !== 'object' && !ITEM_FIELDS.includes(key) && !EXCLUDE_FIELDS.includes(key)) {
        docFields[key] = value;
      }
    });
    setExtractedDocInfo(docFields);
    setExtractModalOpen(true);
  };

  // Handle edits in modal
  const handleItemChange = (idx, field, value) => {
    setExtractedItems(items =>
      items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    );
  };

  // Save reviewed items to DB
  const handleSaveExtracted = async () => {
    setSaving(true);
    await axios.post('/api/stockmasteritems/add', { items: extractedItems });
    setSaving(false);
    setExtractModalOpen(false);
    setPdfFile(null);
    fetchMasterItems();
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Stock Master</h2>
      {/* PDF Upload for Stock Master */}
      <form onSubmit={handleExtract} style={{ marginBottom: 24 }}>
        <input type="file" accept=".pdf" onChange={handlePdfChange} />
        <button type="submit" disabled={!pdfFile}>Extract Items from PDF</button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Item Code</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {masterItems.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.itemCode || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.name || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal for review/edit */}
      {extractModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 350, maxWidth: 700 }}>
            <h3>Review Extracted Items</h3>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {extractedItems.map((item, idx) => (
                <div key={idx} style={{ marginBottom: 12, borderBottom: '1px solid #ccc', paddingBottom: 8, background: '#eaffea' }}>
                  <label>
                    Description:
                    <input
                      value={item.description || ''}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      style={{ marginLeft: 8, width: 120 }}
                    />
                  </label>
                  <label style={{ marginLeft: 12 }}>
                    Item Code:
                    <input
                      value={item.itemCode || ''}
                      onChange={e => handleItemChange(idx, 'itemCode', e.target.value)}
                      style={{ marginLeft: 8, width: 120 }}
                    />
                  </label>
                  <label style={{ marginLeft: 12 }}>
                    PO Delivery Date:
                    <input
                      value={item.poDeliveryDate || ''}
                      onChange={e => handleItemChange(idx, 'poDeliveryDate', e.target.value)}
                      style={{ marginLeft: 8, width: 90 }}
                    />
                  </label>
                  <label style={{ marginLeft: 12 }}>
                    Net Price:
                    <input
                      value={item.netPrice || ''}
                      onChange={e => handleItemChange(idx, 'netPrice', e.target.value)}
                      style={{ marginLeft: 8, width: 80 }}
                    />
                  </label>
                  {/* Match info */}
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <b>Match Status:</b> {item.matchStatus || '-'}
                    {item.confidence !== undefined && (
                      <span> | <b>Confidence:</b> {Math.round((item.confidence || 0) * 100)}%</span>
                    )}
                    {item.method && (
                      <span> | <b>Method:</b> {item.method}</span>
                    )}
                    {item.matchedMasterItem && (
                      <span> | <b>Matched Item:</b> {item.matchedMasterItem.itemCode} - {item.matchedMasterItem.description}</span>
                    )}
                  </div>
                  <button
                    style={{ marginTop: 8 }}
                    onClick={() => setShowAllFields(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  >
                    {showAllFields[idx] ? 'Hide All Fields' : 'Show All Fields'}
                  </button>
                  {showAllFields[idx] && (
                    <div style={{ marginTop: 8, background: '#f7f7f7', padding: 8, borderRadius: 4, fontSize: 13 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {Object.entries(item)
                            .filter(([key, value]) => !EXCLUDE_FIELDS.includes(key) && key !== 'matchedMasterItem')
                            .map(([key, value]) => (
                              <tr key={key}>
                                <td style={{ fontWeight: 600, padding: '4px 8px', border: '1px solid #eee', width: 160 }}>{FIELD_LABELS[key] || key}</td>
                                <td style={{ padding: '4px 8px', border: '1px solid #eee' }}>{value === null || value === undefined ? '' : value}</td>
                              </tr>
                            ))}
                          {item.matchedMasterItem && (
                            <tr>
                              <td style={{ fontWeight: 600, padding: '4px 8px', border: '1px solid #eee' }}>Matched Master Item</td>
                              <td style={{ padding: '4px 8px', border: '1px solid #eee' }}>
                                {['itemCode', 'description', 'netPrice', 'name'].map(f =>
                                  item.matchedMasterItem && item.matchedMasterItem[f] ? (
                                    <div key={f}><b>{FIELD_LABELS[f] || f}:</b> {item.matchedMasterItem[f]}</div>
                                  ) : null
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Render root-level doc info at the bottom */}
            {/* Object.keys(extractedDocInfo).length > 0 && (
              <div style={{ marginTop: 24, marginBottom: 8, background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
                <h4 style={{ margin: '0 0 8px 0' }}>Document Info</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {Object.entries(extractedDocInfo).map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ fontWeight: 600, padding: '4px 8px', border: '1px solid #eee', width: 160 }}>{FIELD_LABELS[key] || key}</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #eee' }}>{value === null || value === undefined ? '' : value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) */}
            <button onClick={handleSaveExtracted} disabled={saving} style={{ marginTop: 12 }}>
              {saving ? 'Saving...' : 'Save to DB'}
            </button>
            <button onClick={() => setExtractModalOpen(false)} style={{ marginLeft: 12, marginTop: 12 }}>Cancel</button>
            <details style={{ marginTop: 16 }}>
              <summary>Show Extracted Text</summary>
              {/* Move Document Info here */}
              {Object.keys(extractedDocInfo).length > 0 && (
                <div style={{ margin: '12px 0', background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>Document Info</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {Object.entries(extractedDocInfo).map(([key, value]) => (
                        <tr key={key}>
                          <td style={{ fontWeight: 600, padding: '4px 8px', border: '1px solid #eee', width: 160 }}>{FIELD_LABELS[key] || key}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #eee' }}>{value === null || value === undefined ? '' : value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <pre style={{ maxHeight: 100, overflowY: 'auto' }}>{extractedText}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMaster; 
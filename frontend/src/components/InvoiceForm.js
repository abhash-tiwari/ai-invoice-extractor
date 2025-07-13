import React, { useState, useCallback, useMemo } from 'react';

const REGULAR_FIELDS = [
  { label: 'PO Number', key: 'poNumber', type: 'text' },
  { label: 'Invoice Number', key: 'invoiceNumber', type: 'text' },
  { label: 'Invoice Date', key: 'invoiceDate', type: 'date' },
  { label: 'Seller', key: 'seller', type: 'textarea' },
  { label: 'Buyer', key: 'buyer', type: 'textarea' },
  { label: 'Consignee', key: 'consignee', type: 'textarea' },
  { label: 'Address', key: 'address', type: 'textarea' },
  { label: 'Notify Party', key: 'notifyParty', type: 'textarea' },
  { label: 'Delivery Location', key: 'deliveryLocation', type: 'text' },
  { label: 'Shipping Method', key: 'shippingMethod', type: 'text' },
  { label: 'Incoterm', key: 'incoterm', type: 'text' },
  { label: 'Port of Discharge', key: 'portOfDischarge', type: 'text' },
  { label: 'Payment Terms', key: 'paymentTerms', type: 'text' },
  { label: 'Bank Account Holder', key: 'bankAccountHolder', type: 'text' },
  { label: 'Bank Name', key: 'bankName', type: 'text' },
  { label: 'Bank Account Number', key: 'bankAccountNumber', type: 'text' },
  { label: 'Bank IFSC Code', key: 'bankIfscCode', type: 'text' },
  { label: 'Bank SWIFT Code', key: 'bankSwiftCode', type: 'text' },
  { label: 'Subtotal', key: 'subtotal', type: 'text' },
  { label: 'Taxes', key: 'taxes', type: 'text' },
  { label: 'Total Amount', key: 'totalAmount', type: 'text' },
  { label: 'Currency', key: 'currency', type: 'text' },
];

const PACKING_LIST_FIELDS = [
  { label: 'Exporter', key: 'exporter', type: 'textarea' },
  { label: 'Invoice No', key: 'invoiceNumber', type: 'text' },
  { label: 'Invoice Date', key: 'invoiceDate', type: 'date' },
  { label: "Buyer's Order No", key: 'buyersOrderNo', type: 'text' },
  { label: "Buyer's Order Date", key: 'buyersOrderDate', type: 'text' },
  { label: 'Vendor Number', key: 'vendorNumber', type: 'text' },
  { label: 'Vendor No', key: 'vendorNo', type: 'text' },
  { label: 'Container No', key: 'containerNo', type: 'text' },
  { label: 'Consignee', key: 'consignee', type: 'textarea' },
  { label: 'Buyer', key: 'buyer', type: 'textarea' },
  { label: 'Vessel/Flight No', key: 'vesselFlightNo', type: 'text' },
  { label: 'Country of Origin of Goods', key: 'countryOfOrigin', type: 'text' },
  { label: 'Country of Final Destination', key: 'countryOfDestination', type: 'text' },
  { label: 'Port of Discharge', key: 'portOfDischarge', type: 'text' },
  { label: 'Port of Loading', key: 'portOfLoading', type: 'text' },
  { label: 'Place of Delivery', key: 'placeOfDelivery', type: 'text' },
  { label: 'Authorised Signatory', key: 'authorisedSignatory', type: 'text' },
  { label: 'Total Qty', key: 'totalQty', type: 'text' },
  { label: 'Total Net Weight', key: 'totalNetWeight', type: 'text' },
  { label: 'Total Gross Weight', key: 'totalGrossWeight', type: 'text' },
];

const PACKING_LIST_TABLE_COLUMNS = [
  { label: 'Packages', key: 'packages' },
  { label: 'Item Ref', key: 'itemRef' },
  { label: 'Description', key: 'description' },
  { label: 'Box Size', key: 'boxSize' },
  { label: 'Quantity', key: 'quantity' },
  { label: 'Unit', key: 'quantityUnit' },
  { label: 'Gross Weight', key: 'grossWeight' },
  { label: 'Net Weight', key: 'netWeight' },
  { label: 'HSN Code', key: 'hsnCode' },
];

const PURCHASE_ORDER_FIELDS = [
  { label: 'Vendor', key: 'vendor', type: 'textarea' },
  { label: 'Purchase Order No', key: 'purchaseOrderNo', type: 'text' },
  { label: 'Purchase Order Date', key: 'purchaseOrderDate', type: 'date' },
  { label: 'Vendor No', key: 'vendorNo', type: 'text' },
  { label: 'Currency', key: 'currency', type: 'text' },
  { label: 'Customer Contact', key: 'customerContact', type: 'object-customerContact' },
  { label: 'Buyer Name', key: 'buyerName', type: 'text' },
  { label: 'Buyer Email', key: 'buyerEmail', type: 'text' },
  { label: 'Buyer Telephone', key: 'buyerTelephone', type: 'text' },
  // { label: 'Other Reference', key: 'otherReference', type: 'text' },
  { label: 'Contract/Offer No', key: 'contractOrOfferNo', type: 'text' },
  { label: 'Customer Proj Ref', key: 'customerProjRef', type: 'text' },
  { label: 'Terms of Payment', key: 'termsOfPayment', type: 'text' },
  { label: 'Incoterm', key: 'incoterm', type: 'text' },
  { label: 'Incoterm Location', key: 'incotermLocation', type: 'text' },
  { label: 'Delivery Date', key: 'deliveryDate', type: 'date' },
  { label: 'Goods Marked', key: 'goodsMarked', type: 'text' },
  { label: 'Bill To', key: 'billTo', type: 'object' },
  { label: 'Ship To', key: 'shipTo', type: 'object' },
  // { label: 'Vendor Contact', key: 'vendorContact', type: 'text' },
  // { label: 'Vendor Email', key: 'vendorEmail', type: 'text' },
  // { label: 'Vendor Telephone', key: 'vendorTelephone', type: 'text' },
  // { label: 'Vendor Name', key: 'vendorName', type: 'text' },
  { label: 'Tax ID', key: 'taxId', type: 'text' },
  { label: 'Total Net Value', key: 'totalNetValue', type: 'text' },
  { label: 'Additional Information', key: 'additionalInformation', type: 'text' },
  { label: 'Allowance Amount', key: 'allowanceAmount', type: 'text' },
  { label: 'Allowances', key: 'allowances', type: 'text' },
  { label: 'Project Number', key: 'projectNumber', type: 'text' },
  { label: 'Sales Order Nr', key: 'salesOrderNr', type: 'text' },
  { label: 'Sales Order Item Nr', key: 'salesOrderItemNr', type: 'text' },
];

const PURCHASE_ORDER_ITEMS_COLUMNS = [
  { label: 'Position', key: 'position' },
  { label: 'Line Number', key: 'lineNo' },
  { label: 'Item Code', key: 'itemCode' },
  { label: 'Name', key: 'name' },
  { label: 'Description', key: 'description' },
  { label: 'Quantity', key: 'quantity' },
  { label: 'Unit', key: 'quantityUnit' },
  { label: 'Price Per Unit', key: 'pricePerUnit' },
  { label: 'Net Price', key: 'netPrice' },
  { label: 'Total Weight', key: 'totalWeight' },
  { label: 'Total Price', key: 'totalPrice' },
  { label: 'PO Delivery Date', key: 'poDeliveryDate' },
  { label: 'HSN Code', key: 'hsnCode' },
  { label: 'GST Rate', key: 'gstRate' },
  { label: 'Alias', key: 'alias' },
  { label: 'Mfg Date', key: 'mfgDate' },
  { label: 'Expiry Date', key: 'expiryDate' }
];

// NEW: PO Master Match Status Component
const POMasterMatchStatus = ({ item }) => {
  const getMatchStatusColor = (status, confidence) => {
    if (status === 'already_exists') return '#dc3545'; // red
    if (status === 'matched' && confidence < 1) return '#ffc107'; // yellow
    if (status === 'suggested') return '#ffc107'; // yellow
    if (status === 'unmatched') return '#28a745'; // green
    if (status === 'matched' && confidence === 1) return '#dc3545'; // red (already exists)
    return '#6c757d';
  };

  const getMatchStatusText = (status) => {
    switch (status) {
      case 'matched': return ' Matched';
      case 'suggested': return '⚠️ Suggested';
      case 'already_exists': return '🔄 Already Exists';
      case 'unmatched': return ' Unmatched';
      default: return '❓ Unknown';
    }
  };

  if (!item.matchStatus) {
    return null;
  }

  return (
    <div className="po-match-status" style={{
      marginTop: '8px',
      padding: '8px',
      borderRadius: '4px',
      backgroundColor: getMatchStatusColor(item.matchStatus, item.confidence) + '20',
      border: `1px solid ${getMatchStatusColor(item.matchStatus, item.confidence)}`,
      fontSize: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontWeight: 'bold', color: getMatchStatusColor(item.matchStatus, item.confidence) }}>
          {getMatchStatusText(item.matchStatus)}
        </span>
        {item.confidence && (
          <span style={{ color: '#666' }}>
            Confidence: {(item.confidence * 100).toFixed(1)}%
          </span>
        )}
      </div>
      {item.method && (
        <div style={{ color: '#666', fontSize: '11px' }}>
          Method: {item.method === 'vector' ? 'Vector Search' : item.method === 'fuzzy' ? 'Fuzzy Match' : item.method}
        </div>
      )}
      {/* Matched Item Section */}
      {item.matchStatus === 'already_exists' && item.matchedPOItem && (
        <div style={{ marginTop: '4px', padding: '4px', backgroundColor: '#f8f9fa', borderRadius: '2px', fontSize: '11px' }}>
          <div><strong>Matched Item:</strong></div>
          <div>Item Code: {item.matchedPOItem.itemCode || 'N/A'}</div>
        </div>
      )}
      {item.matchStatus !== 'already_exists' && item.matchedPOItem && (
        <div style={{ marginTop: '4px', padding: '4px', backgroundColor: '#f8f9fa', borderRadius: '2px', fontSize: '11px' }}>
          <div><strong>Matched Item:</strong></div>
          <div>Name: {item.matchedPOItem.name || 'N/A'}</div>
          <div>Description: {item.matchedPOItem.description || 'N/A'}</div>
        </div>
      )}
    </div>
  );
};

// Helper to parse various date formats to YYYY-MM-DD
function parseToDateInputFormat(dateStr) {
  if (!dateStr) return '';
  // If already in YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Try to parse formats like 'APRIL-10-2025' or 'April 10, 2025'
  let d = new Date(dateStr);
  if (!isNaN(d)) {
    return d.toISOString().split('T')[0];
  }
  // Try to parse 'APRIL-10-2025' manually
  const match = dateStr.match(/([A-Za-z]+)[-\s](\d{1,2})[-,\s](\d{4})/);
  if (match) {
    const month = match[1];
    const day = match[2];
    const year = match[3];
    const months = [
      'january','february','march','april','may','june','july','august','september','october','november','december'
    ];
    const mIdx = months.findIndex(m => m === month.toLowerCase());
    if (mIdx !== -1) {
      const mm = String(mIdx + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  }
  // Fallback: return empty string (will show text input)
  return '';
}

// Helper to render address fields that may be string, object, or array
function renderAddressField(value) {
  if (!value) return <span style={{ color: '#aaa' }}>Not captured</span>;
  if (typeof value === 'string') {
    return <span>{value}</span>;
  }
  if (Array.isArray(value)) {
    return (
      <ul>
        {value.map((v, i) => <li key={i}>{typeof v === 'string' ? v : JSON.stringify(v)}</li>)}
      </ul>
    );
  }
  if (typeof value === 'object') {
    return (
      <div>
        {Object.entries(value).map(([k, v]) => (
          <div key={k}><strong>{k}:</strong> {v}</div>
        ))}
      </div>
    );
  }
  return <span>{JSON.stringify(value)}</span>;
}

const InvoiceForm = ({ invoiceData, onSave, invoiceType: propInvoiceType }) => {
  const [formData, setFormData] = useState({
    ...(invoiceData || {}),
    invoiceType: (invoiceData && invoiceData.invoiceType) || propInvoiceType || 'regular',
  });

  // Sync packingListItems with itemsPurchased for packing_list invoices
  React.useEffect(() => {
    if ((propInvoiceType || formData.invoiceType) === 'packing_list' && invoiceData && Array.isArray(invoiceData.itemsPurchased)) {
      setFormData(prev => ({
        ...prev,
        packingListItems: invoiceData.itemsPurchased
      }));
    }
  }, [invoiceData, propInvoiceType]);

  // Sync itemsOrdered for purchase_order invoices
  React.useEffect(() => {
    if ((propInvoiceType || formData.invoiceType) === 'purchase_order' && invoiceData && Array.isArray(invoiceData.itemsOrdered)) {
      setFormData(prev => ({
        ...prev,
        itemsOrdered: invoiceData.itemsOrdered
      }));
    }
  }, [invoiceData, propInvoiceType]);

  // Helper function to format object string to readable text
  const formatObjectString = (str) => {
    if (!str) return '';
    try {
      // If it's already a string and not JSON, return as is
      if (typeof str === 'string' && !str.includes('{') && !str.includes('}')) {
        return str;
      }

      // Try to parse as JSON
      const obj = JSON.parse(str);
      
      // If it's a string, return it directly
      if (typeof obj === 'string') {
        return obj;
      }

      // If it's an object, format it
      return Object.entries(obj)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    } catch (e) {
      // If parsing fails, return the original string
      return str;
    }
  };

  // Helper function to format array string to readable text
  const formatArrayString = (str) => {
    if (!str) return '';
    try {
      // Handle case where it's already an array
      if (Array.isArray(str)) {
        return str.join('\n');
      }

      // Remove escaped quotes if present
      let cleanStr = str.replace(/\\"/g, '"');
      
      // Try to parse as JSON
      const arr = JSON.parse(cleanStr);
      
      // If it's a string, return it directly
      if (typeof arr === 'string') {
        return arr;
      }

      // If it's an array, format it
      return arr.map(item => {
        if (typeof item === 'object') {
          return Object.entries(item)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        }
        return item;
      }).join('\n\n');
    } catch (e) {
      // If parsing fails, return the original string
      return str;
    }
  };

  // Helper function to convert formatted text back to JSON string
  const convertToJsonString = (text) => {
    if (!text) return '';
    try {
      // If it's already a JSON string, return it
      if (text.startsWith('{') && text.endsWith('}')) {
        return text;
      }

      // If it's a simple string, return it as is
      if (!text.includes('\n')) {
        return text;
      }

      // Parse the formatted text back to an object
      const lines = text.split('\n');
      const obj = {};
      lines.forEach(line => {
        const [key, ...values] = line.split(': ');
        if (key && values.length > 0) {
          obj[key.trim()] = values.join(': ').trim();
        }
      });
      return JSON.stringify(obj);
    } catch (e) {
      // If parsing fails, return the text as is
      return text;
    }
  };

  // Memoize handlers to prevent unnecessary re-renders
  const handleChange = useCallback((e, field) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleItemChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.itemsPurchased];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return {
        ...prev,
        itemsPurchased: newItems
      };
    });
  }, []);

  const addNewItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      itemsPurchased: [
        ...prev.itemsPurchased,
        {
          itemRef: '',
          description: '',
          quantity: '',
          pricePerUnit: '',
          totalPrice: '',
          quantityUnit: ''
        }
      ]
    }));
  }, []);

  const removeItem = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      itemsPurchased: prev.itemsPurchased.filter((_, i) => i !== index)
    }));
  }, []);

  // Memoize the save handler
  const handleSave = useCallback(() => {
    // Ensure _id is present if available in invoiceData
    const dataToSave = { ...formData };
    if (invoiceData && invoiceData._id) {
      dataToSave._id = invoiceData._id;
    }
    onSave(dataToSave);
  }, [formData, onSave, invoiceData]);

  // Memoize the price formatter
  const formatPrice = useCallback((value) => {
    if (!value) return 'Not captured';
    return `${value} ${formData.currency || ''}`;
  }, [formData.currency]);

  // Memoize the numeric value extractor
  const extractNumericValue = useCallback((priceString) => {
    if (!priceString) return '';
    return priceString.replace(/[^0-9.]/g, '');
  }, []);

  // Memoize the key press handler for numeric inputs
  const handleNumericKeyPress = useCallback((e) => {
    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
    }
  }, []);

  // Memoize the date formatter
  const formatDate = useMemo(() => {
    return formData.invoiceDate ? new Date(formData.invoiceDate).toISOString().split('T')[0] : '';
  }, [formData.invoiceDate]);

  // Use propInvoiceType or formData.invoiceType for rendering
  const invoiceType = propInvoiceType || formData.invoiceType || 'regular';

  // For packing_list, sort packingListItems by serialNumber before rendering
  const sortedPackingListItems = (formData.packingListItems || []).slice().sort(
    (a, b) => Number(a.serialNumber) - Number(b.serialNumber)
  );

  // When user clicks save, always include invoiceType
  const handleSaveClick = () => {
    onSave({ ...formData, invoiceType: formData.invoiceType || propInvoiceType || 'regular' });
  };

  return (
    <div className="invoice-form">
      <h2>Invoice Details</h2>
      <div className="form-section">
        {(invoiceType === 'regular'
          ? REGULAR_FIELDS
          : invoiceType === 'packing_list'
            ? PACKING_LIST_FIELDS
            : PURCHASE_ORDER_FIELDS
        ).map(field => (
          <div className="form-group" key={field.key}>
            <label>{field.label}:</label>
            {field.type === 'object' && invoiceType === 'purchase_order' ? (
              <div className="object-group">
                {['name', 'address', 'city', 'postalCode', 'country'].map(subKey => (
                  <div className="form-group" key={subKey} style={{ marginLeft: 16 }}>
                    <label style={{ fontWeight: 400 }}>{subKey.charAt(0).toUpperCase() + subKey.slice(1)}:</label>
                    <input
                      type="text"
                      value={(formData[field.key] && formData[field.key][subKey]) || ''}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          [field.key]: {
                            ...(prev[field.key] || {}),
                            [subKey]: e.target.value
                          }
                        }));
                      }}
                      placeholder={`Not captured`}
                    />
                  </div>
                ))}
              </div>
            ) : field.type === 'object-customerContact' && invoiceType === 'purchase_order' ? (
              <div className="object-group">
                {['name', 'email', 'telephone', 'fax'].map(subKey => (
                  <div className="form-group" key={subKey} style={{ marginLeft: 16 }}>
                    <label style={{ fontWeight: 400 }}>{subKey.charAt(0).toUpperCase() + subKey.slice(1)}:</label>
                    <input
                      type="text"
                      value={(formData[field.key] && formData[field.key][subKey]) || ''}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          [field.key]: {
                            ...(prev[field.key] || {}),
                            [subKey]: e.target.value
                          }
                        }));
                      }}
                      placeholder={`Not captured`}
                    />
                  </div>
                ))}
              </div>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={e => handleChange(e, field.key)}
                rows="3"
                placeholder="Not captured"
              />
            ) : field.type === 'date' ? (
              parseToDateInputFormat(formData[field.key]) ? (
                <input
                  type="date"
                  value={parseToDateInputFormat(formData[field.key])}
                  onChange={e => handleChange(e, field.key)}
                  placeholder="Not captured"
                />
              ) : (
                <input
                  type="text"
                  value={formData[field.key] || ''}
                  onChange={e => handleChange(e, field.key)}
                  placeholder="Not captured"
                />
              )
            ) : (
              <input
                type={field.type}
                value={formData[field.key] || ''}
                onChange={e => handleChange(e, field.key)}
                placeholder="Not captured"
              />
            )}
          </div>
        ))}
      </div>
      {invoiceType === 'regular' && (
        <>
      <h3>Items Purchased</h3>
      <div className="items-section">
        {formData.itemsPurchased.map((item, index) => (
          <div key={index} className="item-row detailed-format">
            <div className="form-group">
              <label>Item Reference:</label>
              <input
                type="text"
                value={item.itemRef || ''}
                onChange={(e) => handleItemChange(index, 'itemRef', e.target.value)}
                placeholder="Not captured"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                value={item.description || ''}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                placeholder="Not captured"
              />
            </div>
            <div className="form-group">
              <label>Quantity:</label>
              <input
                type="number"
                value={item.quantity || ''}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                placeholder="Not captured"
              />
            </div>
            <div className="form-group">
              <label>Unit:</label>
              <input
                type="text"
                value={item.quantityUnit || ''}
                onChange={(e) => handleItemChange(index, 'quantityUnit', e.target.value)}
                placeholder="Not captured"
              />
            </div>
            <div className="form-group">
              <label>Price Per Unit:</label>
              <input
                type="text"
                value={item.pricePerUnit || ''}
                onChange={(e) => handleItemChange(index, 'pricePerUnit', e.target.value)}
                placeholder="Not captured"
                onKeyPress={handleNumericKeyPress}
              />
            </div>
            <div className="form-group">
              <label>Total Price:</label>
              <input
                type="text"
                value={item.totalPrice || ''}
                onChange={(e) => handleItemChange(index, 'totalPrice', e.target.value)}
                placeholder="Not captured"
                onKeyPress={handleNumericKeyPress}
              />
            </div>
            <button onClick={() => removeItem(index)}>Remove</button>
          </div>
        ))}
        <button onClick={addNewItem}>Add Item</button>
      </div>
        </>
      )}
      {invoiceType === 'packing_list' && (
        <>
          <h3>Packing List Table</h3>
          <div className="items-section">
            <table className="packing-list-table">
              <thead>
                <tr>
                  {PACKING_LIST_TABLE_COLUMNS.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPackingListItems.map((item, index) => (
                  <tr key={index}>
                    {PACKING_LIST_TABLE_COLUMNS.map(col => (
                      <td key={col.key}>
                        <input
                          type="text"
                          value={item[col.key] || ''}
                          onChange={e => {
                            setFormData(prev => {
                              const newItems = [...prev.packingListItems];
                              newItems[index] = {
                                ...newItems[index],
                                [col.key]: e.target.value
                              };
                              return {
                                ...prev,
                                packingListItems: newItems
                              };
                            });
                          }}
                          placeholder="Not captured"
                        />
                      </td>
                    ))}
                    <td>
                      <button onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          packingListItems: prev.packingListItems.filter((_, i) => i !== index)
                        }));
                      }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => {
              setFormData(prev => ({
                ...prev,
                packingListItems: [
                  ...prev.packingListItems,
                  PACKING_LIST_TABLE_COLUMNS.reduce((acc, col) => {
                    acc[col.key] = '';
                    return acc;
                  }, {})
                ]
              }));
            }}>Add Row</button>
          </div>
        </>
      )}
      {invoiceType === 'purchase_order' && (
        <>
          <h3>Items Ordered</h3>
          <div className="items-section">
            <table className="packing-list-table">
              <thead>
                <tr>
                  {PURCHASE_ORDER_ITEMS_COLUMNS.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>Currency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(formData.itemsOrdered || []).map((item, index) => (
                  <tr key={index}>
                    {PURCHASE_ORDER_ITEMS_COLUMNS.map(col => (
                      <td key={col.key}>
                        <input
                          type="text"
                          value={item[col.key] || ''}
                          onChange={e => {
                            setFormData(prev => {
                              const newItems = [...(prev.itemsOrdered || [])];
                              newItems[index] = {
                                ...newItems[index],
                                [col.key]: e.target.value
                              };
                              return {
                                ...prev,
                                itemsOrdered: newItems
                              };
                            });
                          }}
                          placeholder="Not captured"
                        />
                        {/* NEW: Show PO Master Match Status */}
                        {col.key === 'itemCode' && <POMasterMatchStatus item={item} />}
                      </td>
                    ))}
                    <td>
                      {/* Show currency symbol or code next to netValue */}
                      {item.netValue && /[€$₹]/.test(item.netValue)
                        ? item.netValue.match(/[€$₹]/)[0]
                        : (formData.currency || invoiceData?.currency || '')}
                    </td>
                    <td>
                      <button onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          itemsOrdered: prev.itemsOrdered.filter((_, i) => i !== index)
                        }));
                      }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => {
              setFormData(prev => ({
                ...prev,
                itemsOrdered: [
                  ...(prev.itemsOrdered || []),
                  PURCHASE_ORDER_ITEMS_COLUMNS.reduce((acc, col) => {
                    acc[col.key] = '';
                    return acc;
                  }, {})
                ]
              }));
            }}>Add Row</button>
          </div>
        </>
      )}
      <div className="verification-note">
        <p>⚠️ Please verify all fields before saving. Make sure all information is accurate and complete.</p>
      </div>
      <button className="save-button" onClick={handleSaveClick}>
        Save Changes
      </button>
      <style jsx>{`
        .price-input-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .currency-display {
          color: #666;
          font-size: 0.9em;
          min-width: 40px;
        }
        .price-input-container input {
          width: calc(100% - 50px);
        }
        .verification-note {
          margin: 20px 0;
          padding: 10px;
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 4px;
          color: #856404;
        }
        .verification-note p {
          margin: 0;
          font-size: 0.9em;
        }
        .packing-list-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .packing-list-table th, .packing-list-table td {
          border: 1px solid #ccc;
          padding: 6px 8px;
          text-align: left;
        }
        .packing-list-table th {
          background: #f5f5f5;
        }
        .po-match-status {
          margin-top: 8px;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          max-width: 200px;
        }
        .po-match-status input {
          margin-bottom: 8px;
        }
        .po-match-status .match-details {
          margin-top: 4px;
          padding: 4px;
          background-color: #f8f9fa;
          border-radius: 2px;
          font-size: 11px;
        }
        .po-match-status .match-details div {
          margin-bottom: 2px;
        }
        .po-match-status .match-details strong {
          color: #333;
        }
      `}</style>
    </div>
  );
};

// Memoize the entire component
export default React.memo(InvoiceForm); 
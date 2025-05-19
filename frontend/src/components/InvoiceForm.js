import React, { useState, useCallback, useMemo } from 'react';

const InvoiceForm = ({ invoiceData, onSave }) => {
  const [formData, setFormData] = useState(invoiceData || {
    poNumber: '',
    invoiceNumber: '',
    seller: '',
    buyer: '',
    consignee: '',
    address: '',
    notifyParty: '',
    shippingMethod: '',
    incoterm: '',
    portOfDischarge: '',
    bankAccountHolder: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    bankSwiftCode: '',
    deliveryLocation: '',
    invoiceDate: '',
    paymentTerms: '',
    itemsPurchased: [],
    subtotal: '',
    taxes: '',
    totalAmount: '',
    currency: ''
  });

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
    onSave(formData);
  }, [formData, onSave]);

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

  return (
    <div className="invoice-form">
      <h2>Invoice Details</h2>
      <div className="form-section">
        <div className="form-group">
          <label>PO Number:</label>
          <input
            type="text"
            value={formData.poNumber || ''}
            onChange={(e) => handleChange(e, 'poNumber')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Invoice Number:</label>
          <input
            type="text"
            value={formData.invoiceNumber || ''}
            onChange={(e) => handleChange(e, 'invoiceNumber')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Invoice Date:</label>
          <input
            type="date"
            value={formatDate}
            onChange={(e) => handleChange(e, 'invoiceDate')}
          />
        </div>
        <div className="form-group">
          <label>Seller:</label>
          <textarea
            value={formData.seller || ''}
            onChange={(e) => handleChange(e, 'seller')}
            rows="4"
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Buyer:</label>
          <textarea
            value={formData.buyer || ''}
            onChange={(e) => handleChange(e, 'buyer')}
            rows="4"
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Consignee:</label>
          <textarea
            value={formData.consignee || ''}
            onChange={(e) => handleChange(e, 'consignee')}
            rows="4"
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Address:</label>
          <textarea
            value={formData.address || ''}
            onChange={(e) => handleChange(e, 'address')}
            rows="4"
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Notify Party:</label>
          <textarea
            value={formData.notifyParty || ''}
            onChange={(e) => handleChange(e, 'notifyParty')}
            rows="4"
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Delivery Location:</label>
          <input
            type="text"
            value={formData.deliveryLocation || ''}
            onChange={(e) => handleChange(e, 'deliveryLocation')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Shipping Method:</label>
          <input
            type="text"
            value={formData.shippingMethod || ''}
            onChange={(e) => handleChange(e, 'shippingMethod')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Incoterm:</label>
          <input
            type="text"
            value={formData.incoterm || ''}
            onChange={(e) => handleChange(e, 'incoterm')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Port of Discharge:</label>
          <input
            type="text"
            value={formData.portOfDischarge || ''}
            onChange={(e) => handleChange(e, 'portOfDischarge')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Payment Terms:</label>
          <input
            type="text"
            value={formData.paymentTerms || ''}
            onChange={(e) => handleChange(e, 'paymentTerms')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Bank Account Holder:</label>
          <input
            type="text"
            value={formData.bankAccountHolder || ''}
            onChange={(e) => handleChange(e, 'bankAccountHolder')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Bank Name:</label>
          <input
            type="text"
            value={formData.bankName || ''}
            onChange={(e) => handleChange(e, 'bankName')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Bank Account Number:</label>
          <input
            type="text"
            value={formData.bankAccountNumber || ''}
            onChange={(e) => handleChange(e, 'bankAccountNumber')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Bank IFSC Code:</label>
          <input
            type="text"
            value={formData.bankIfscCode || ''}
            onChange={(e) => handleChange(e, 'bankIfscCode')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Bank SWIFT Code:</label>
          <input
            type="text"
            value={formData.bankSwiftCode || ''}
            onChange={(e) => handleChange(e, 'bankSwiftCode')}
            placeholder="Not captured"
          />
        </div>
        <div className="form-group">
          <label>Subtotal:</label>
          <div className="price-input-container">
            <input
              type="text"
              value={formData.subtotal || ''}
              onChange={(e) => handleChange(e, 'subtotal')}
              placeholder="Not captured"
            />
            <span className="currency-display">{formData.currency}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Taxes:</label>
          <div className="price-input-container">
            <input
              type="text"
              value={formData.taxes || ''}
              onChange={(e) => handleChange(e, 'taxes')}
              placeholder="Not captured"
            />
            <span className="currency-display">{formData.currency}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Total Amount:</label>
          <div className="price-input-container">
            <input
              type="text"
              value={formData.totalAmount || ''}
              onChange={(e) => handleChange(e, 'totalAmount')}
              placeholder="Not captured"
            />
            <span className="currency-display">{formData.currency}</span>
          </div>
        </div>
        <div className="form-group">
          <label className="currency-container">
            Currency
          </label>
          <input
            type="text"
            name="currency"
            value={formData.currency || ''}
            onChange={(e) => handleChange(e, 'currency')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Currency (e.g., EUR, USD, INR)"
          />
        </div>
      </div>

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

      <div className="verification-note">
        <p>⚠️ Please verify all fields before saving. Make sure all information is accurate and complete.</p>
      </div>

      <button className="save-button" onClick={handleSave}>
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
      `}</style>
    </div>
  );
};

// Memoize the entire component
export default React.memo(InvoiceForm); 
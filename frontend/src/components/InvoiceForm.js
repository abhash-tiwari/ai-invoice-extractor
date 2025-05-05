import React, { useState } from 'react';

const InvoiceForm = ({ invoiceData, onSave }) => {
  // Helper function to format object string to readable text
  const formatObjectString = (str) => {
    if (!str) return '';
    try {
      // Handle case where string is already in readable format
      if (typeof str === 'string' && !str.includes('{') && !str.includes('}')) {
        return str;
      }

      // Remove escaped quotes if present
      let cleanStr = str.replace(/\\"/g, '"');
      
      // Handle case where it's a simple string with quotes
      if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) {
        return cleanStr.slice(1, -1);
      }

      // Try to parse as JSON
      const obj = JSON.parse(cleanStr);
      
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

      // If it's a simple string, wrap it in quotes
      if (!text.includes('\n')) {
        return JSON.stringify(text);
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
      // If parsing fails, return the text as a simple string
      return JSON.stringify(text);
    }
  };

  const [formData, setFormData] = useState(invoiceData || {
    poNumber: '',
    invoiceNumber: '',
    seller: '',
    buyer: '',
    consignee: '',
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
    totalAmount: ''
  });

  const handleChange = (e, field) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'seller' || field === 'buyer' || field === 'consignee'
        ? convertToJsonString(value)
        : value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.itemsPurchased];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      itemsPurchased: newItems
    }));
  };

  const addNewItem = () => {
    setFormData(prev => ({
      ...prev,
      itemsPurchased: [
        ...prev.itemsPurchased,
        {
          itemRef: '',
          description: '',
          quantity: '',
          pricePerUnit: '',
          totalPrice: ''
        }
      ]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      itemsPurchased: prev.itemsPurchased.filter((_, i) => i !== index)
    }));
  };

  // Helper function to check if an item is a string
  const isStringItem = (item) => typeof item === 'string';

  return (
    <div className="invoice-form">
      <h2>Invoice Details</h2>
      <div className="form-section">
        <div className="form-group">
          <label>PO Number:</label>
          <input
            type="text"
            value={formData.poNumber}
            onChange={(e) => handleChange(e, 'poNumber')}
          />
        </div>
        <div className="form-group">
          <label>Invoice Number:</label>
          <input
            type="text"
            value={formData.invoiceNumber}
            onChange={(e) => handleChange(e, 'invoiceNumber')}
          />
        </div>
        <div className="form-group">
          <label>Invoice Date:</label>
          <input
            type="date"
            value={formData.invoiceDate ? new Date(formData.invoiceDate).toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange(e, 'invoiceDate')}
          />
        </div>
        <div className="form-group">
          <label>Seller:</label>
          <textarea
            value={formatObjectString(formData.seller)}
            onChange={(e) => handleChange(e, 'seller')}
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>Buyer:</label>
          <textarea
            value={formatObjectString(formData.buyer)}
            onChange={(e) => handleChange(e, 'buyer')}
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>Consignee:</label>
          <textarea
            value={formatObjectString(formData.consignee)}
            onChange={(e) => handleChange(e, 'consignee')}
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>Delivery Location:</label>
          <input
            type="text"
            value={formData.deliveryLocation}
            onChange={(e) => handleChange(e, 'deliveryLocation')}
          />
        </div>
        <div className="form-group">
          <label>Shipping Method:</label>
          <input
            type="text"
            value={formData.shippingMethod}
            onChange={(e) => handleChange(e, 'shippingMethod')}
          />
        </div>
        <div className="form-group">
          <label>Incoterm:</label>
          <input
            type="text"
            value={formData.incoterm}
            onChange={(e) => handleChange(e, 'incoterm')}
          />
        </div>
        <div className="form-group">
          <label>Port of Discharge:</label>
          <input
            type="text"
            value={formData.portOfDischarge}
            onChange={(e) => handleChange(e, 'portOfDischarge')}
          />
        </div>
        <div className="form-group">
          <label>Payment Terms:</label>
          <input
            type="text"
            value={formData.paymentTerms}
            onChange={(e) => handleChange(e, 'paymentTerms')}
          />
        </div>
        <div className="form-group">
          <label>Bank Account Holder:</label>
          <input
            type="text"
            value={formData.bankAccountHolder}
            onChange={(e) => handleChange(e, 'bankAccountHolder')}
          />
        </div>
        <div className="form-group">
          <label>Bank Name:</label>
          <input
            type="text"
            value={formData.bankName}
            onChange={(e) => handleChange(e, 'bankName')}
          />
        </div>
        <div className="form-group">
          <label>Bank Account Number:</label>
          <input
            type="text"
            value={formData.bankAccountNumber}
            onChange={(e) => handleChange(e, 'bankAccountNumber')}
          />
        </div>
        <div className="form-group">
          <label>Bank IFSC Code:</label>
          <input
            type="text"
            value={formData.bankIfscCode}
            onChange={(e) => handleChange(e, 'bankIfscCode')}
          />
        </div>
        <div className="form-group">
          <label>Bank SWIFT Code:</label>
          <input
            type="text"
            value={formData.bankSwiftCode}
            onChange={(e) => handleChange(e, 'bankSwiftCode')}
          />
        </div>
        <div className="form-group">
          <label>Subtotal:</label>
          <input
            type="number"
            value={formData.subtotal}
            onChange={(e) => handleChange(e, 'subtotal')}
          />
        </div>
        <div className="form-group">
          <label>Taxes:</label>
          <input
            type="number"
            value={formData.taxes}
            onChange={(e) => handleChange(e, 'taxes')}
          />
        </div>
        <div className="form-group">
          <label>Total Amount:</label>
          <input
            type="number"
            value={formData.totalAmount}
            onChange={(e) => handleChange(e, 'totalAmount')}
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
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                value={item.description || ''}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Quantity:</label>
              <input
                type="number"
                value={item.quantity || ''}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Price Per Unit:</label>
              <input
                type="number"
                value={item.pricePerUnit || ''}
                onChange={(e) => handleItemChange(index, 'pricePerUnit', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Total Price:</label>
              <input
                type="number"
                value={item.totalPrice || ''}
                onChange={(e) => handleItemChange(index, 'totalPrice', e.target.value)}
              />
            </div>
            <button onClick={() => removeItem(index)}>Remove</button>
          </div>
        ))}
        <button onClick={addNewItem}>Add Item</button>
      </div>

      <button className="save-button" onClick={() => onSave(formData)}>
        Save Changes
      </button>
    </div>
  );
};

export default InvoiceForm; 
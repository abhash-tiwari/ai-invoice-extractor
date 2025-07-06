import React, { useState } from 'react';
import axios from 'axios';
import InvoiceForm from './components/InvoiceForm';
import './components/InvoiceForm.css';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [invoiceType, setInvoiceType] = useState('regular');

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

    try {
      console.log('Sending request to:', `http://localhost:5000/api/invoices/upload`);
      const res = await axios.post(
        `http://localhost:5000/api/invoices/upload`,
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
    try {
      await axios.post(
        `http://localhost:5000/api/invoices/save`,
        updatedData
      );
      alert('Invoice saved successfully!');

      window.location.reload();
    } catch (error) {
      console.error('Error:', error.message);
      alert('Failed to save invoice');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
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
        <InvoiceForm
          invoiceData={invoiceData}
          onSave={handleSave}
          invoiceType={invoiceType}
        />
      )}
    </div>
  );
}

export default App;

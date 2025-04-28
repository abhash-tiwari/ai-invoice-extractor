import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');

  const handleUpload = async () => {
    if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append('invoice', file);

    try {
      const res = await axios.post(
        `http://localhost:5000/api/invoices/upload`,
        formData
      );
      setResult(JSON.stringify(res.data.data, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
      alert('Failed to upload');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Invoice Extractor</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button style={{ marginLeft: '1rem' }} onClick={handleUpload}>
        Upload Invoice
      </button>

      {result && (
        <pre style={{ background: '#f5f5f5', padding: '1rem', marginTop: '2rem' }}>
          {result}
        </pre>
      )}
    </div>
  );
}

export default App;

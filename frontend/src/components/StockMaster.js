import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StockMaster = () => {
  const [masterItems, setMasterItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [keepFlags, setKeepFlags] = useState([]);

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
    setExtractedItems(res.data.items);
    setExtractedText(res.data.extractedText);
    setKeepFlags(res.data.items.map(() => true));
    setExtractModalOpen(true);
  };

  // Handle edits in modal
  const handleItemChange = (idx, field, value) => {
    setExtractedItems(items =>
      items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    );
  };

  const handleKeepToggle = (idx) => {
    setKeepFlags(flags => flags.map((f, i) => i === idx ? !f : f));
  };

  // Save reviewed items to DB
  const handleSaveExtracted = async () => {
    setSaving(true);
    const itemsToSave = extractedItems.filter((_, idx) => keepFlags[idx]);
    await axios.post('/api/stockmasteritems/add', { items: itemsToSave });
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
                <div key={idx} style={{ marginBottom: 12, borderBottom: '1px solid #ccc', paddingBottom: 8, background: keepFlags[idx] ? '#eaffea' : '#ffeaea' }}>
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
                      onChange={e => handleItemChange(idx, 'netPriceEUR', e.target.value)}
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
                  <button onClick={() => handleKeepToggle(idx)} style={{ marginTop: 6 }}>
                    {keepFlags[idx] ? 'Remove' : 'Keep'}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleSaveExtracted} disabled={saving} style={{ marginTop: 12 }}>
              {saving ? 'Saving...' : 'Save to DB'}
            </button>
            <button onClick={() => setExtractModalOpen(false)} style={{ marginLeft: 12, marginTop: 12 }}>Cancel</button>
            <details style={{ marginTop: 16 }}>
              <summary>Show Extracted Text</summary>
              <pre style={{ maxHeight: 100, overflowY: 'auto' }}>{extractedText}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMaster; 
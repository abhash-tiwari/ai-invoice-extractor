import React from 'react';

const COLUMNS = [
  { label: 'Position', key: 'position' },
  { label: 'Line No', key: 'lineNo' },
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

const GAP_AFTER = ['position', 'lineNo', 'description', 'quantityUnit', 'netPrice', 'totalPrice'];

const renderMatchStatus = (item) => {
  if (!item.matchStatus) return null;
  const getColor = (status) => {
    if (status === 'already_exists') return '#dc3545';
    if (status === 'matched') return '#ffc107';
    if (status === 'suggested') return '#ffc107';
    if (status === 'unmatched') return '#28a745';
    return '#6c757d';
  };
  return (
    <div className="match-status-cell">
      <div><strong>Status:</strong> {item.matchStatus}</div>
      {item.confidence !== undefined && <div><strong>Confidence:</strong> {(item.confidence * 100).toFixed(1)}%</div>}
      {item.method && <div><strong>Method:</strong> {item.method}</div>}
      {item.matchedPOItem && (
        <div style={{ marginTop: 2 }}>
          <strong>Matched Item:</strong>
          <div>Item Code: {item.matchedPOItem.itemCode || ''}</div>
          <div>Name: {item.matchedPOItem.name || ''}</div>
          <div>Description: {item.matchedPOItem.description || ''}</div>
        </div>
      )}
    </div>
  );
};

const PurchaseOrderItemsTable = ({ items, onItemsChange }) => {
  const handleCellChange = (rowIdx, key, value) => {
    const newItems = items.map((item, idx) => idx === rowIdx ? { ...item, [key]: value } : item);
    onItemsChange(newItems);
  };
  const handleAddRow = () => {
    onItemsChange([
      ...items,
      Object.fromEntries(COLUMNS.map(col => [col.key, '']))
    ]);
  };
  const handleRemoveRow = (rowIdx) => {
    onItemsChange(items.filter((_, idx) => idx !== rowIdx));
  };
  return (
    <div style={{ marginTop: 32 }}>
      <h2>Items Ordered</h2>
      <div className="po-items-table-container">
        <table className="po-items-table">
          <thead>
            <tr>
              {COLUMNS.map((col, idx) => (
                <th
                  key={col.key}
                  className={GAP_AFTER.includes(col.key) ? 'po-items-table-gap' : ''}
                >
                  {col.label}
                </th>
              ))}
              <th>Match Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIdx) => (
              <tr
                key={rowIdx}
                className={
                  item.matchStatus === 'already_exists' ? 'po-row-already-exists' :
                  item.matchStatus === 'unmatched' ? 'po-row-unmatched' :
                  item.matchStatus === 'suggested' ? 'po-row-suggested' : ''
                }
              >
                {COLUMNS.map((col, idx) => (
                  <td
                    key={col.key}
                    className={GAP_AFTER.includes(col.key) ? 'po-items-table-gap' : ''}
                  >
                    <input
                      type="text"
                      value={item[col.key] || ''}
                      onChange={e => handleCellChange(rowIdx, col.key, e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                ))}
                <td>{renderMatchStatus(item)}</td>
                <td>
                  <button onClick={() => handleRemoveRow(rowIdx)}>-</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={handleAddRow} style={{ marginTop: 8 }}>Add Row</button>
    </div>
  );
};

export default PurchaseOrderItemsTable; 
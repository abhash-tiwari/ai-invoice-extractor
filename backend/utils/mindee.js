const axios = require('axios');
const fs = require('fs');

async function extractInvoiceData(filePath) {
  const file = fs.readFileSync(filePath);

  const response = await axios.post('https://api.mindee.net/v1/products/mindee/invoice/v4/predict', file, {
    headers: {
      'Authorization': `Token ${process.env.MINDEE_API_KEY}`,
      'Content-Type': 'application/pdf',
    }
  });

  const doc = response.data.document.inference.prediction;
  
  // Collect all key-value pairs dynamically
  const fields = [];
  doc.forEach(entity => {
    const key = entity.label || 'unknown_field'; // Use label or a default name if not available
    const value = entity.value || 'N/A'; // Use value or 'N/A' if not available
    fields.push({ key, value });
  });

  return { fields };
}

module.exports = { extractInvoiceData };

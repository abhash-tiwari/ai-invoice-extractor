const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const fs = require('fs').promises;
require('dotenv').config();

const client = new DocumentProcessorServiceClient();

async function extractInvoiceData(filePath) {
  const name = `projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}/processors/${process.env.GCP_PROCESSOR_ID}`;
  const fileData = await fs.readFile(filePath);

  const request = {
    name,
    rawDocument: {
      content: fileData.toString('base64'),
      mimeType: 'application/pdf',
    },
  };

  const [result] = await client.processDocument(request);
  const fields = result.document.entities.reduce((acc, entity) => {
    const type = entity.type?.toLowerCase();
    if (type === 'line_item') {
      acc.items = acc.items || [];
      const line = {};
      for (const prop of entity.properties) {
        const k = prop.type?.toLowerCase();
        const v = prop.mentionText;
        if (k === 'description') line.description = v;
        if (k === 'quantity') line.quantity = v;
        if (k === 'unit_price') line.unitPrice = v;
        if (k === 'amount') line.totalPrice = v;
      }
      acc.items.push(line);
    } else {
      acc[type] = entity.mentionText || '';
    }
    return acc;
  }, {});

  return {
    invoiceNumber: fields['invoice_id'] || '',
    date: fields['invoice_date'] || '',
    seller: fields['supplier_name'] || '',
    total: fields['total_amount'] || '',
    tax: fields['tax_amount'] || '',
    incoterm: fields['incoterm'] || '',
    items: fields.items || [],
  };
}

module.exports = { extractInvoiceData };
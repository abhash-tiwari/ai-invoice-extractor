const axios = require('axios');
const parsePDF = require('../utils/pdfParser');
const Invoice = require('../models/invoiceModel');

const uploadInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const extractedText = await parsePDF(req.file.buffer);

    const prompt = `
Extract the following fields from the invoice and return JSON without any explanation:
- poNumber
- invoiceNumber
- seller
- shippingMethod
- itemsPurchased
- subtotal
- taxes
- totalAmount

Give pure JSON only, no backticks, no markdown.

Invoice Text:
${extractedText}
`;

    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let extractedData = response.data.choices[0].message.content.trim();

    if (extractedData.startsWith('```')) {
      extractedData = extractedData.replace(/```json|```/g, '').trim();
    }

    const parsedData = JSON.parse(extractedData);

    const invoiceData = {
      poNumber: parsedData.poNumber || null,
      invoiceNumber: parsedData.invoiceNumber || null,
      seller: parsedData.seller || null,
      shippingMethod: parsedData.shippingMethod || null,
      itemsPurchased: parsedData.itemsPurchased || [],
      subtotal: parsedData.subtotal || 0,
      taxes: parsedData.taxes || 0,
      totalAmount: parsedData.totalAmount || 0,
    };

    const invoice = await Invoice.create(invoiceData);

    res.status(200).json({ message: 'Invoice extracted and saved', data: invoice });

  } catch (error) {
    console.error('Error uploading invoice:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { uploadInvoice };
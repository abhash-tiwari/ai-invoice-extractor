const axios = require('axios');
const parsePDF = require('../utils/pdfParser');
const processImage = require('../utils/imageProcessor');
const Invoice = require('../models/invoiceModel');

const uploadInvoice = async (req, res) => {
  try {
    console.log('Received upload request:', {
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file received',
      headers: req.headers
    });

    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      console.log('Invalid file type:', req.file.mimetype);
      return res.status(400).json({ message: 'Only PDF and image files (JPEG, PNG) are allowed' });
    }

    // Validate file size (10MB limit)
    if (req.file.size > 10 * 1024 * 1024) {
      console.log('File too large:', req.file.size);
      return res.status(400).json({ message: 'File size should be less than 10MB' });
    }

    let extractedText;
    if (req.file.mimetype === 'application/pdf') {
      console.log('Processing PDF file...');
      extractedText = await parsePDF(req.file.buffer);
    } else {
      console.log('Processing image file...');
      extractedText = await processImage(req.file.buffer);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    console.log('Text extracted successfully, length:', extractedText.length);
    console.log('Sample of extracted text:', extractedText.substring(0, 200) + '...');

    const prompt = `
Extract the following fields from the invoice and return JSON without any explanation:
- poNumber
- invoiceNumber
- seller
- buyer
- consignee
- shippingMethod
- itemsPurchased (make sure to extract ALL items from the invoice, no matter how many there are)
- subtotal (include currency if mentioned, e.g., "1000 EUR" or "1000 USD")
- taxes (include currency if mentioned)
- totalAmount (include currency if mentioned)
- incoterm
- portOfDischarge
- notifyParty
- bankDetails (extract as an object with fields: accountHolder, bankName, accountNumber, ifscCode, swiftCode)
- deliveryLocation
- invoiceDate
- paymentTerms
- currency (the currency used in the invoice, e.g., EUR, USD, INR)

IMPORTANT: For itemsPurchased, extract ALL items from the invoice, even if there are many. Do not limit the number of items.
Each item in itemsPurchased MUST have these EXACT field names:
{
  "itemRef": "item reference or code",
  "description": "item description",
  "quantity": "quantity as a number",
  "quantityUnit": "unit of quantity (e.g., bags, pieces, kg, grams, etc.)",
  "pricePerUnit": "price per unit with currency if mentioned (e.g., '10 EUR' or '10 USD')",
  "totalPrice": "total price with currency if mentioned"
}

Note: If you find similar fields with different names (like unitPrice instead of pricePerUnit, or amount instead of totalPrice), 
always use the standardized field names above.

IMPORTANT: For all price-related fields (subtotal, taxes, totalAmount, pricePerUnit, totalPrice), include the currency if it's mentioned in the invoice.
Look for currency symbols (€, $, ₹, etc.) or currency codes (EUR, USD, INR, etc.) near the price values.
If the same currency is used throughout the invoice, use that currency for all price fields.

For bankDetails, look for patterns like:
- Bank name followed by account details
- SWIFT code, account number, and IFSC code
- Account holder name (often found near "BENEFICIARY" or "ACCOUNT HOLDER")
- Look for these patterns in the entire document, not just specific sections

The bankDetails object should be structured like this:
{
  "accountHolder": "The account holder name from the invoice",
  "bankName": "The bank name from the invoice",
  "accountNumber": "The account number from the invoice",
  "ifscCode": "The IFSC code from the invoice",
  "swiftCode": "The SWIFT code from the invoice"
}

Below are examples to help you understand the format and type of data to extract:

---

EXAMPLE 1

Invoice Text:
"TAX INVOICE
INVOICE NO: 192425123115INVOICE DATE: 07.02.2025
SO NO: 320007726DNO NO: M5-24-70R-1385
DUE DATE: 08.04.2025TRANSP NAME: SAFEXPRESS PVT.LTD-WAY BILL
LR NO: 581068002011LR DATE: 07.02.2025
EWB NO: 182518229876353EWB DATE: 07.02.2025
SOLD TO: Crossword Bookstores Pvt Ltd
ADDRESS: 603-608 6th Floor Shorab Hall Opp Jahangir Hospital, Behind Pune Railway Station, Pune
GSTIN: 27AAACPC7596G1ZZ   PAN NO: AAACPC7596G   PLACE OF SUPPLY: MAHARASHTRA
SHIP TO: Crossword Bookstores Pvt Ltd
ADDRESS: CBL D&C AAJ Bhiwandi C/O AAJ Enterprises Richland Commercial Hub, Build No 7, Gala No 1, Opp Grande Hotel, Mumbai Nashik - 421302
GSTIN: 27AAACPC7596G1ZZ   PLACE OF SUPPLY: MAHARASHTRA
HSN CODEITEM DESCRIPTIONQTY/UOMUNIT RATEDISC AMTTAXABLE AMTIGST AMT
96081099RP UNI UB 150 BLU 12 T96.000/PC37.29/PC0.003579.84644.37
96081099RP UNI UB 157 BLK 12 T48.000/PC37.29/PC0.001789.92322.19
96081099RP UNI UB 157 BLK 12 T36.000/PC37.29/PC0.001342.44241.64
96081099RP UNI UB 150 BLK 12 T12.000/PC37.29/PC0.00447.4880.55
96081099RP UNI UB 188 M BLU 12 T48.000/PC37.29/PC0.001789.92322.19
96082000OT UNI MRKING POSCA SM AST 8 T24.000/PC37.29/PC0.00894.96161.09
96081099RP UNI UB 157 VLT 12 T36.000/PC37.29/PC0.001342.44241.64
96081099RP UNI UB 188 M BLU 12 T36.000/PC37.29/PC0.001342.44241.64
96081099RP UNI UB 157 M BLU WHT BLU 12 T96.000/PC37.29/PC0.003132.96563.93
96081099RP UNI UB 157 LGY 12 T12.000/PC37.29/PC0.00447.4880.55
96081099RP UNI UB 157 LGY 12 T12.000/PC37.29/PC0.00447.4880.55
96081099RP UNI UB188 EM BDY ORN BLU 12 T36.000/PC37.29/PC0.001342.44241.64
96081099RP UNI UB188 EM BDY LIME GRN BLU 12 T12.000/PC37.29/PC0.00447.4880.55
96081099RP UNI UB 150 BLK 12 T24.000/PC37.29/PC0.00894.96161.09
96081099RP UNI UB188 EM BDY PNK BLU 12 T24.000/PC37.29/PC0.00894.96161.09
96082000OT UNI MRKING PEN PIN01 200S BLK 12 T72.000/PC46.61/PC0.003355.92604.07
96081099EP UNI UB 157 LGR 12 T48.000/PC37.29/PC0.001789.92322.19
96082000OT UNI MRKING PEN PIN01 200S BLK 12 T24.000/PC46.61/PC0.001118.64201.36

96082000OT UNI MRKING PEN PIN01 200S BLK 12 T12.000/PC46.61/PC0.00559.32100.67
96082000OT UNI MRKING PEN PIN01 200S BLK 12 T48.000/PC46.61/PC0.002237.28402.71
96082000OT UNI MRKING PEN PIN02 200S BLK 12 T24.000/PC46.61/PC0.001118.64201.36
96082000OT UNI MRKING PEN PIN02 200S BLK 12 T24.000/PC46.61/PC0.001118.64201.36
96082000OT UNI MRKING PEN PIN02 200S BLK 12 T24.000/PC46.61/PC0.001118.64201.36
96082000OT UNI MRKING PEN PIN02 200S BLK 12 T24.000/PC46.61/PC0.001118.64201.36
96082000OT UNI MRKING PEN PIN02 200S BLK 12 T24.000/PC46.61/PC0.001118.64201.36"

Expected JSON:
poNumber: '320007726',
  invoiceNumber: '192425123115',
  seller: '',
  buyer: 'Crossword Bookstores Pvt Ltd',
  consignee: 'Crossword Bookstores Pvt Ltd',
  shippingMethod: 'SAFEXPRESS PVT.LTD-WAY BILL',
  itemsPurchased: [
    {
      itemRef: 'RP UNI UB 150 BLU 12 T',
      description: 'RP UNI UB 150 BLU 12 T',
      quantity: 96,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '3579.84 INR'
    },
    {
      itemRef: 'RP UNI UB 157 BLU 12 T',
      description: 'RP UNI UB 157 BLK 12 T',
      quantity: 48,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '1789.92 INR'
    },
    {
      itemRef: 'RP UNI UB 157 BLK 12 T',
      description: 'RP UNI UB 157 BLK 12 T',
      quantity: 36,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '1342.44 INR'
    },
    {
      itemRef: 'RP UNI UB 150 BLK 12 T',
      description: 'RP UNI UB 150 BLK 12 T',
      quantity: 12,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '447.48 INR'
    },
    {
      itemRef: 'RP UNI UB 188 M BLU 12 T',
      description: 'RP UNI UB 188 M BLU 12 T',
      quantity: 48,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '1789.92 INR'
    },
    {
      itemRef: 'OT UNI MRKING POSCA SM AST 8 T',
      description: 'OT UNI MRKING POSCA SM AST 8 T',
      quantity: 24,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '894.96 INR'
    },
    {
      itemRef: 'RP UNI UB 157 VLT 12 T',
      description: 'RP UNI UB 157 VLT 12 T',
      quantity: 36,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '1342.44 INR'
    },
    {
      itemRef: 'RP UNI UB 188 M BLU 12 T',
      description: 'RP UNI UB 188 M BLU 12 T',
      quantity: 36,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '1342.44 INR'
    },
    {
      itemRef: 'RP UNI UB 157 M BLU WHT BLU 12 T',
      description: 'RP UNI UB 157 M BLU WHT BLU 12 T',
      quantity: 96,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '3132.96 INR'
    },
    {
      itemRef: 'RP UNI UB 157 LGY 12 T',
      description: 'RP UNI UB 157 LGY 12 T',
      quantity: 12,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '447.48 INR'
    },
    {
      itemRef: 'RP UNI UB 157 LGY 12 T',
      description: 'RP UNI UB 157 LGY 12 T',
      quantity: 12,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '447.48 INR'
    },
    {
      itemRef: 'RP UNI UB188 EM BDY ORN BLU 12 T',
      description: 'RP UNI UB188 EM BDY ORN BLU 12 T',
      quantity: 36,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '1342.44 INR'
    },
    {
      itemRef: 'RP UNI UB188 EM BDY LIME GRN BLU 12 T',
      description: 'RP UNI UB188 EM BDY LIME GRN BLU 12 T',
      quantity: 12,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '447.48 INR'
    },
    {
      itemRef: 'RP UNI UB 150 BLK 12 T',
      description: 'RP UNI UB 150 BLK 12 T',
      quantity: 24,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '894.96 INR'
    },
    {
      itemRef: 'RP UNI UB188 EM BDY PNK BLU 12 T',
      description: 'RP UNI UB188 EM BDY PNK BLU 12 T',
      quantity: 24,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '894.96 INR'
    },
    {
      itemRef: 'OT UNI MRKING PEN PIN01 200S BLK 12 T',
      description: 'OT UNI MRKING PEN PIN01 200S BLK 12 T',
      quantity: 72,
      quantityUnit: 'PC',
      pricePerUnit: '46.61 INR',
      totalPrice: '3355.92 INR'
    },
    {
      itemRef: 'RP UNI UB 157 LGR 12 T',
      description: 'RP UNI UB 157 LGR 12 T',
      quantity: 48,
      quantityUnit: 'PC',
      pricePerUnit: '37.29 INR',
      totalPrice: '1789.92 INR'
    },
    {
      itemRef: 'OT UNI MRKING PEN PIN01 200S BLK 12 T',
      description: 'OT UNI MRKING PEN PIN01 200S BLK 12 T',
      quantity: 24,
      quantityUnit: 'PC',
      pricePerUnit: '46.61 INR',
      totalPrice: '1118.64 INR'
    },
    {
      itemRef: 'OT UNI MRKING PEN PIN01 200S BLK 12 T',
      description: 'OT UNI MRKING PEN PIN01 200S BLK 12 T',
      quantity: 12,
      quantityUnit: 'PC',
      pricePerUnit: '46.61 INR',
      totalPrice: '559.32 INR'
    },
    {
      itemRef: 'OT UNI MRKING PEN PIN01 200S BLK 12 T',
      description: 'OT UNI MRKING PEN PIN01 200S BLK 12 T',
      quantity: 48,
      quantityUnit: 'PC',
      pricePerUnit: '46.61 INR',
      totalPrice: '2237.28 INR'
    },
    {
      itemRef: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      description: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      quantity: 24,
      quantityUnit: 'PC',
      pricePerUnit: '46.61 INR',
      totalPrice: '1118.64 INR'
    },
    {
      itemRef: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      description: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      quantity: 24,
      quantityUnit: 'PC',
      pricePerUnit: '46.61 INR',
      totalPrice: '1118.64 INR'
    },
    {
      itemRef: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      description: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      quantity: 24,
      quantityUnit: 'PC',
      pricePerUnit: '46.61 INR',
      totalPrice: '1118.64 INR'
    },
    {
      itemRef: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      description: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      quantity: 24,
      quantityUnit: 'PC',
      pricePerUnit: '46.61 INR',
      totalPrice: '1118.64 INR'
    },
    {
      itemRef: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      description: 'OT UNI MRKING PEN PIN02 200S BLK 12 T',
      quantity: 24,
      quantityUnit: 'PC',
      pricePerUnit: '46.61 INR',
      totalPrice: '1118.64 INR'
    }
  ],
  subtotal: '',
  taxes: '',
  totalAmount: '',
  incoterm: '',
  portOfDischarge: '',
  notify: '',
  bankDetails: {
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    swiftCode: ''
  },
  deliveryLocation: 'CBL D&C AAJ Bhiwandi C/O AAJ Enterprises Richland Commercial Hub, Build No 7, Gala No 1, Opp Grande Hotel, Mumbai Nashik - 421302',
  invoiceDate: '07.02.2025',
  paymentTerms: '08.04.2025',
  currency: 'INR'
}

---

Give pure JSON only, no backticks, no markdown.

Invoice Text:
${extractedText}
`;

    console.log('Sending request to Mistral API...');
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
    console.log('Received response from Mistral API');

    let extractedData = response.data.choices[0].message.content.trim();

    if (extractedData.startsWith('```')) {
      extractedData = extractedData.replace(/```json|```/g, '').trim();
    }

    console.log('Parsing extracted data...');
    const parsedData = JSON.parse(extractedData);
    console.log('Data parsed successfully:', parsedData);

    const invoiceData = {
      poNumber: parsedData.poNumber || null,
      invoiceNumber: parsedData.invoiceNumber || null,
      seller: parsedData.seller ? JSON.stringify(parsedData.seller) : null,
      buyer: parsedData.buyer ? JSON.stringify(parsedData.buyer) : null,
      consignee: parsedData.consignee ? JSON.stringify(parsedData.consignee) : null,
      notifyParty: parsedData.notifyParty ? JSON.stringify(parsedData.notifyParty) : null,
      shippingMethod: parsedData.shippingMethod || null,
      incoterm: parsedData.incoterm || null,
      portOfDischarge: parsedData.portOfDischarge || null,
      bankAccountHolder: parsedData.bankDetails?.accountHolder || null,
      bankName: parsedData.bankDetails?.bankName || null,
      bankAccountNumber: parsedData.bankDetails?.accountNumber || null,
      bankIfscCode: parsedData.bankDetails?.ifscCode || null,
      bankSwiftCode: parsedData.bankDetails?.swiftCode || null,
      deliveryLocation: parsedData.deliveryLocation || null,
      invoiceDate: parsedData.invoiceDate ? new Date(parsedData.invoiceDate.split('-').reverse().join('-')) : null,
      paymentTerms: parsedData.paymentTerms || null,
      itemsPurchased: parsedData.itemsPurchased || [],
      subtotal: parsedData.subtotal || 0,
      taxes: parsedData.taxes || 0,
      totalAmount: parsedData.totalAmount || 0,
      currency: parsedData.currency || 'not specified',
      fileType: req.file.mimetype,
      originalFileName: req.file.originalname,
      extractedText: extractedText
    };

    console.log('Creating invoice in database...');
    const invoice = await Invoice.create(invoiceData);
    console.log('Invoice created successfully');

    res.status(200).json({ message: 'Invoice extracted and saved', data: invoice });

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      code: error.code
    });

    let errorMessage = 'Server Error';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message.includes('Unexpected token')) {
      errorMessage = 'Failed to parse invoice data. Please ensure the document contains valid invoice information.';
    } else if (error.message.includes('ENOENT')) {
      errorMessage = 'Error accessing the file. Please try again.';
    } else if (error.message.includes('Mistral')) {
      errorMessage = 'Error processing the invoice with AI. Please try again.';
    } else if (error.message.includes('No text could be extracted')) {
      errorMessage = 'Could not extract any text from the document. Please ensure the document is clear and readable.';
    }

    res.status(500).json({ 
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const saveInvoice = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json({ message: 'Invoice updated successfully', data: updatedInvoice });
  } catch (error) {
    console.error('Error saving invoice:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { uploadInvoice, saveInvoice };
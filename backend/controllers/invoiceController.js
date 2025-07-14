const axios = require('axios');
const parsePDF = require('../utils/pdfParser');
const processImage = require('../utils/imageProcessor');
const Invoice = require('../models/invoiceModel');
const PackingList = require('../models/PackingListModel');
const PurchaseOrder = require('../models/PurchaseOrderModel');

const uploadInvoice = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const invoiceType = req.body.invoiceType || 'regular';
    const expectedItemCount = req.body.expectedItemCount ? parseInt(req.body.expectedItemCount) : null;
    console.log('Received upload request:', {
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file received',
      headers: req.headers,
      invoiceType: invoiceType
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

    let prompt;
    if (invoiceType === 'packing_list') {
      prompt = `Extract the following fields from the packing list and return JSON without any explanation:
- vendorNumber
- vendorNo
- invoiceNumber
- invoiceDate
- buyersOrderNo
- buyersOrderDate
- containerNo
- vesselFlightNo
- shippingMethod
- countryOfOrigin
- countryOfDestination
- portOfLoading
- portOfDischarge
- placeOfDelivery
- address
- deliveryLocation
- paymentTerms
- currency
- exporter
- buyer
- consignee
- notifyParty
- incoterm
- authorisedSignatory
- totalQty
- totalNetWeight
- totalGrossWeight
- itemsPurchased (extract ALL items, no matter how many there are)

${expectedItemCount ? `There are exactly ${expectedItemCount} items in the table. Extract exactly ${expectedItemCount} items. Ignore any row that contains the word 'TOTAL' or is a summary row. Maintain the Items as from start to ${expectedItemCount}.` : ''}

IMPORTANT: Packing list tables may have different column headers for the same data. For each item, map the table columns to the following standard field names, even if the column header is different:
- "MARKS & NOS ON PACKAGES", "SR.NO", "S.NO", "NO." → serialNumber
- "BOX SIZE", "BOX SIZE (IN MM)" → boxSize
- "DESCRIPTION OF GOODS", "DESCRIPTION" → description
- "HSN CODE" → hsnCode
- "QTY", "QUANTITY", "QTY. (NOS)" → quantity
- "NET WEIGHT", "NET WEIGHT IN K.G." → netWeight
- "GROSS WEIGHT", "GROSS WEIGHT IN K.G." → grossWeight

For each row in the table, extract the values exactly as they appear in that row. Do not copy, infer, or repeat values from other rows. Each item in itemsPurchased must correspond to one and only one row in the table, and must use the values from that row only. Each extracted item must be unique and match the corresponding row in the table.

The first column is always the serial number for each item (e.g., 1, 2, 3, ...). Use this as the "serialNumber" field.

Do not extract any row that is a summary or total row (e.g., if the description contains 'TOTAL' or the serial number is not a number).

If a value is missing in a row, set it to null or an empty string. If a row has merged or missing cells, do your best to align the values to the correct fields.

Example:
If the table has rows:
|  1 MFCPL/ABB/VAASA | 1200 x 800 x 1016 | STATOR FRAME 225 FLANGE M/CED | ... | 356.32 | 426.32 |
| 2  MFCPL/ABB/VAASA|                   | STATOR FRAME 200 FOOT M/CED   | ... |        | 395.248 |
| TOTAL | ... | ... | ... | 98 | 7874.020 | 9364.020 |

The extracted items should be:
[
  {
    "serialNumber": "1 MFCL/ABB/VAASA",
    "boxSize": "1200 x 800 x 1016",
    "description": "STATOR FRAME 225 FLANGE M/CED",
    ...,
    "netWeight": "356.32",
    "grossWeight": "426.32"
  },
  {
    "serialNumber": "2 MFCPL/ABB/VAASA",
    "boxSize": null,
    "description": "STATOR FRAME 200 FOOT M/CED",
    ...,
    "netWeight": null,
    "grossWeight": "395.248"
  }
  // Do not extract the TOTAL row!
]

Extract EVERY row from the table, even if some fields are missing. If a value is missing, set it to null or an empty string. Do not skip or merge rows, except for summary/total rows which must be ignored.

CRITICAL: For itemsPurchased, you MUST:
1. Extract EVERY single item from the packing list, from the first item to the last item
2. Maintain the exact order as they appear in the document (top to bottom)
3. Do not skip any items, even if they appear similar
4. Count each row/item separately, even if descriptions are similar
5. If there are multiple items with the same description but different quantities or positions, list them separately
6. Ensure you capture the total number of items that matches the totalQty field
7. Double-check that you haven't missed any items before finalizing the response
8. The first column in the table is the serial number for each item (e.g., 1, 2, 3, ...). For each item in itemsPurchased, extract this serial number as the field "serialNumber". Do not skip or merge rows, even if other fields are similar.

Each item in itemsPurchased MUST have these EXACT field names:
{
  "serialNumber": "serial number that is in Marks and Packages section",
  "boxSize": "box size if available",
  "description": "item description",
  "hsnCode": "hsn code along with the text that has under hsn code",
  "quantity": "quantity as a number",
  "quantityUnit": "unit of quantity (e.g., bags, pieces, kg, grams, etc.)",
  "netWeight": "net weight for the item, if available",
  "grossWeight": "gross weight for the item, if available"
}

IMPORTANT: For all quantity and weight fields, include units if mentioned (e.g., kg, pieces).

Give pure JSON only, no backticks, no markdown.

Packing List Text:
${extractedText}
`;
    } else if (invoiceType === 'purchase_order') {
      prompt = `Extract the following fields from the purchase order and return JSON without any explanation:
- vendor
- poNumber
- invoiceNumber
- invoiceDate
- purchaseOrderNo
- purchaseOrderDate
- vendorNo
- currency
- seller
- buyer
- consignee
- exporter
- transporter
- address
- shippingMethod
- portOfDischarge
- portOfLoading
- GSTNo
- PANNo
- vesselFlightNo
- containerNo
- customerContact
- buyerName
- buyerEmail
- buyerTelephone
- otherReference
- contractOrOfferNo
- customerProjRef
- termsOfPayment
- incoterm
- incotermLocation
- deliveryDate
- goodsMarked
- billTo
- shipTo
- vendorContact
- vendorEmail
- vendorTelephone
- vendorName
- countryOfDestination
- countryOfOrigin
- authorisedSignatory
- totalNetWeight
- totalGrossWeight
- bankDetails (extract as an object with fields: accountHolder, bankName, accountNumber, ifscCode, swiftCode)
- totalQty
- taxId
- totalNetValue
- additionalInformation
- allowanceAmount
- allowances
- projectNumber
- salesOrderNr
- salesOrderItemNr
- itemsOrdered (extract ALL items, no matter how many)

${expectedItemCount ? `There are exactly ${expectedItemCount} items in the table. Extract exactly ${expectedItemCount} items. Ignore any row that contains the word 'TOTAL' or is a summary row. If you extract more than ${expectedItemCount}, remove the extras from the end.` : ''}

IMPORTANT: There must be more than 1 page so extract every item and the details properly.
Each item in itemsOrdered MUST have these EXACT field names:
{
  "position": "item position number do not give serial number in position",
  "lineNo": "include line number in which column from top the item has placed do not give po line no.",
  "itemCode": "item code is important always include. In case you cant find it then paste hsn/sac code in itemcode",
  "name": "name or description of the item",
  "description": "item description",
  "quantity": "quantity as a number",
  "quantityUnit": "unit of quantity (e.g., PCE, PC, etc.)",
  "pricePerUnit": "price per unit with currency if mentioned",
  "netPrice": "net price with currency if mentioned",
  "totalWeight": "total weight with unit if mentioned",
  "totalPrice": "total price with currency if mentioned",
  "poDeliveryDate": "PO delivery date if available",
  "hsnCode": "HSN code if available",
  "gstRate": "GST rate if available",
  "alias": "alias if available",
  "mfgDate": "manufacturing date if available",
  "expiryDate": "expiry date if available"
}

IMPORTANT: For each item, extract all fields as they appear in the table or document. If a value is missing, set it to null or an empty string. Do not infer or copy values from other rows. Map table columns to the above standard field names, even if the column header is different. If a field is not present, leave it blank or null.

IMPORTANT: Purchase order tables may have different column headers for the same data. For each item, map the table columns to the following standard field names, even if the column header is different:
- "item code", "hsn code", "material number", "hs code" → itemCode.

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

Give pure JSON only, no backticks, no markdown.

Purchase Order Text:
${extractedText}
`;
    } else {
      prompt = `Extract the following fields from the invoice and return JSON without any explanation:
- poNumber
- invoiceNumber
- seller
- buyer
- consignee
- exporter
- transporter
- address
- shippingMethod
- itemsPurchased (make sure to extract ALL items from the invoice, no matter how many there are, do not limit yourself)
- subtotal (include currency if mentioned, e.g., "1000 EUR" or "1000 USD")
- taxes (include currency if mentioned)
- totalAmount (include currency if mentioned)
- incoterm
- portOfDischarge
- portOfLoading
- GSTNo
- PANNo
- billTo
- shipTo
- notifyParty
- bankDetails (extract as an object with fields: accountHolder, bankName, accountNumber, ifscCode, swiftCode)
- deliveryLocation
- invoiceDate
- paymentTerms
- currency (the currency used in the invoice, e.g., EUR, USD, INR)

${expectedItemCount ? `There are exactly ${expectedItemCount} items in the table. Extract exactly ${expectedItemCount} items. Ignore any row that contains the word 'TOTAL' or is a summary row. If you extract more than ${expectedItemCount}, remove the extras from the end.` : ''}

IMPORTANT: Invoice tables may have different column headers for the same data. For each item, map the table columns to the following standard field names, even if the column header is different:
- "QTY", "QTY. (NOS)", "QUANTITY" → quantity
- "RATE", "RATE PER P/C.", "PRICE PER UNIT" → pricePerUnit
- "TOTAL WEIGHT", "WEIGHT", "NET WEIGHT" → totalWeight
- "AMOUNT", "AMOUNT € (EUR)", "TOTAL PRICE" → totalPrice
- "DESCRIPTION OF GOODS", "DESCRIPTION" → description
- "HSN CODE" → hsnCode
- "ITEM CODE", "ITEM REF", "ITEM REFERENCE" → itemRef

If the column header is not an exact match, use your best judgment to map it to the correct field based on its meaning and the data in the column. If a value is missing, set the field to null or an empty string.

Example:
If the table has columns:
| QTY. (NOS) | RATE PER P/C. € (EUR) | TOTAL WEIGHT | AMOUNT € (EUR) |
and a row:
| 20 | 120.00 | 1781.60 | € 2,400.00 |

The extracted item should be:
{
  "quantity": 20,
  "pricePerUnit": "120.00 EUR",
  "totalWeight": "1781.60",
  "totalPrice": "2400.00 EUR"
  // ...other fields as available
}

Each item in itemsPurchased MUST have these EXACT field names:
{
  "itemRef": "item reference or code",
  "description": "item description",
  "quantity": "look for quantity/qty as a number",
  "quantityUnit": "unit of quantity (e.g., bags, pieces, kg, grams, etc.)",
  "pricePerUnit": "look for price per unit/ rate per p/c with currency if mentioned (e.g., '10 EUR' or '10 USD')",
  "totalWeight": "total weight if mentioned",
  "totalPrice": "look for total price/amount with currency if mentioned, always look for last column value of price mentioned that is the total price/amount"
}

IMPORTANT: For every item, always include the "totalWeight" field, even if it is not found. If not found, set it to null or an empty string.

Note: If you find similar fields with different names (like unitPrice instead of pricePerUnit, or amount instead of totalPrice), always use the standardized field names above.

IMPORTANT: For all price-related fields (subtotal, taxes, totalAmount, pricePerUnit, totalPrice), include the currency if it's mentioned in the invoice. Look for currency symbols (€, $, ₹, etc.) or currency codes (EUR, USD, INR, etc.) near the price values. If the same currency is used throughout the invoice, use that currency for all price fields.

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

---

Give pure JSON only, no backticks, no markdown.

Invoice Text:
${extractedText}
`;
    }

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

    // Validation and enforcement for packing list items
    if (invoiceType === 'packing_list' && Array.isArray(parsedData.itemsPurchased)) {
      // Remove any item with 'TOTAL' in serialNumber or description
      parsedData.itemsPurchased = parsedData.itemsPurchased.filter(
        item =>
          !(item.serialNumber && item.serialNumber.toUpperCase().includes('TOTAL')) &&
          !(item.description && item.description.toUpperCase().includes('TOTAL'))
      );
      // If expectedItemCount is set, truncate or warn
      if (expectedItemCount) {
        if (parsedData.itemsPurchased.length > expectedItemCount) {
          parsedData.itemsPurchased = parsedData.itemsPurchased.slice(0, expectedItemCount);
        } else if (parsedData.itemsPurchased.length < expectedItemCount) {
          console.warn(`WARNING: Fewer items extracted (${parsedData.itemsPurchased.length}) than expected (${expectedItemCount})`);
        }
      }
      // Sort itemsPurchased by serialNumber (as a number)
      parsedData.itemsPurchased.sort((a, b) => {
        const numA = parseInt((a.serialNumber || '').match(/^\d+/)?.[0] || '0', 10);
        const numB = parseInt((b.serialNumber || '').match(/^\d+/)?.[0] || '0', 10);
        return numA - numB;
      });
      if (parsedData.totalQty) {
        const extractedItemCount = parsedData.itemsPurchased.length;
        const expectedQty = parseInt(parsedData.totalQty) || 0;
        console.log(`Item count validation: Expected ${expectedQty}, Extracted ${extractedItemCount}`);
        if (extractedItemCount !== expectedQty) {
          console.warn(`WARNING: Item count mismatch! Expected ${expectedQty} items but extracted ${extractedItemCount} items.`);
          console.warn('This may indicate incomplete extraction. Consider re-uploading the document.');
        }
      }
    }

    // NEW: PO Master Matching for Purchase Orders
    if (invoiceType === 'purchase_order' && Array.isArray(parsedData.itemsOrdered)) {
      console.log('Starting PO Master matching for', parsedData.itemsOrdered.length, 'items...');
      
      // Fetch all existing PO items for matching
      const allPOItems = await PurchaseOrder.find({});
      const poItemsByItemCode = {};
      const allPOItemTexts = [];
      
      // Extract all items from all POs and create lookup
      allPOItems.forEach(po => {
        if (po.itemsOrdered && Array.isArray(po.itemsOrdered)) {
          po.itemsOrdered.forEach(item => {
            if (item.itemCode) {
              poItemsByItemCode[item.itemCode.toLowerCase()] = item;
            }
            // Create text for fuzzy matching
            const itemText = `${item.itemCode || ''} ${item.name || ''} ${item.description || ''}`.trim();
            if (itemText) {
              allPOItemTexts.push({ text: itemText, item: item });
            }
          });
        }
      });

      console.log(`Found ${Object.keys(poItemsByItemCode).length} unique item codes in PO database`);
      console.log(`Found ${allPOItemTexts.length} items for fuzzy matching`);

      // Match each extracted item
      const matchedItems = [];
      const itemsToMatch = [];

      parsedData.itemsOrdered.forEach((item, idx) => {
        const code = (item.itemCode || '').toLowerCase();
        
        if (code && poItemsByItemCode[code]) {
          // Exact itemCode match
          matchedItems.push({
            ...item,
            matchStatus: 'already_exists',
            confidence: 1.0,
            method: 'itemCode',
            matchedPOItem: poItemsByItemCode[code],
          });
        } else {
          // No itemCode match, add to match queue
          itemsToMatch.push({ idx, item });
          matchedItems.push(null); // placeholder
        }
      });

      // Call Python /match for unmatched items
      if (itemsToMatch.length > 0) {
        const descriptions = itemsToMatch.map(i => `${i.item.itemCode || ''} ${i.item.name || ''} ${i.item.description || ''}`.trim());
        
        try {
          console.log('Calling Python /match service for', descriptions.length, 'items...');
          const pyRes = await axios.post('http://127.0.0.1:8000/match-po', {
            descriptions,
            top_n: 1
          });
          
          pyRes.data.forEach((result, i) => {
            const idx = itemsToMatch[i].idx;
            const match = result.matches && result.matches[0];
            let matchStatus = 'unmatched';
            let confidence = 0;
            let method = result.method;
            let matchedPOItem = null;
            
            if (match && match.score >= 0.8) {
              matchStatus = 'matched';
              confidence = match.score;
              matchedPOItem = match.item;
            } else if (match && match.score >= 0.6) {
              matchStatus = 'suggested';
              confidence = match.score;
              matchedPOItem = match.item;
            }
            
            matchedItems[idx] = {
              ...itemsToMatch[i].item,
              matchStatus,
              confidence,
              method,
              matchedPOItem,
            };
          });
        } catch (error) {
          console.error('Error calling Python /match service:', error.message);
          // Fallback: mark all as unmatched
          itemsToMatch.forEach(({ idx }, i) => {
            matchedItems[idx] = {
              ...itemsToMatch[i].item,
              matchStatus: 'unmatched',
              confidence: 0,
              method: 'error',
              matchedPOItem: null,
            };
          });
        }
      }

      // Update parsedData with matched items
      parsedData.itemsOrdered = matchedItems;
      console.log('PO Master matching completed');
    }

    // Do NOT save to DB for purchase_order, just return extracted data
    if (invoiceType === 'purchase_order') {
      return res.status(200).json({
        message: 'Purchase order extracted and matched',
        data: parsedData
      });
    }

    let savedDoc;
    if (invoiceType === 'packing_list') {
      const packingListData = {
        vendorNumber: parsedData.vendorNumber || null,
        vendorNo: parsedData.vendorNo || null,
        invoiceNumber: parsedData.invoiceNumber || null,
        invoiceDate: parsedData.invoiceDate || null,
        buyersOrderNo: parsedData.buyersOrderNo || null,
        buyersOrderDate: parsedData.buyersOrderDate || null,
        containerNo: parsedData.containerNo || null,
        vesselFlightNo: parsedData.vesselFlightNo || null,
        shippingMethod: parsedData.shippingMethod || null,
        countryOfOrigin: parsedData.countryOfOrigin || null,
        countryOfDestination: parsedData.countryOfDestination || null,
        portOfLoading: parsedData.portOfLoading || null,
        portOfDischarge: parsedData.portOfDischarge || null,
        placeOfDelivery: parsedData.placeOfDelivery || null,
        address: parsedData.address || null,
        deliveryLocation: parsedData.deliveryLocation || null,
        paymentTerms: parsedData.paymentTerms || null,
        currency: parsedData.currency || null,
        exporter: parsedData.exporter ? JSON.stringify(parsedData.exporter) : null,
        buyer: parsedData.buyer ? JSON.stringify(parsedData.buyer) : null,
        consignee: parsedData.consignee ? JSON.stringify(parsedData.consignee) : null,
        notifyParty: parsedData.notifyParty ? JSON.stringify(parsedData.notifyParty) : null,
        incoterm: parsedData.incoterm || null,
        authorisedSignatory: parsedData.authorisedSignatory || null,
        totalQty: parsedData.totalQty || null,
        totalNetWeight: parsedData.totalNetWeight || null,
        totalGrossWeight: parsedData.totalGrossWeight || null,
        itemsPurchased: parsedData.itemsPurchased || [],
        bankDetails: parsedData.bankDetails || {},
        invoiceType: invoiceType,
        fileType: req.file.mimetype,
        originalFileName: req.file.originalname,
        extractedText: extractedText
      };
      console.log('Creating packing list in database...');
      savedDoc = await PackingList.create(packingListData);
      console.log('Packing list created successfully');
    } else {
    const invoiceData = {
      poNumber: parsedData.poNumber || null,
      invoiceNumber: parsedData.invoiceNumber || null,
      seller: parsedData.seller ? JSON.stringify(parsedData.seller) : null,
      buyer: parsedData.buyer ? JSON.stringify(parsedData.buyer) : null,
      exporter: parsedData.exporter ? JSON.stringify(parsedData.exporter) : null,
      transporter: parsedData.transporter ? JSON.stringify(parsedData.transporter) : null,
      consignee: parsedData.consignee ? JSON.stringify(parsedData.consignee) : null,
      address: parsedData.address ? JSON.stringify(parsedData.address) : null,
      notifyParty: parsedData.notifyParty ? JSON.stringify(parsedData.notifyParty) : null,
      shipTo: parsedData.shipTo || null,
      billTo: parsedData.billTo || null,
      GSTNo: parsedData.GSTNo || null,
      PANNo: parsedData.PANNo || null,
      shippingMethod: parsedData.shippingMethod || null,
      incoterm: parsedData.incoterm || null,
      portOfDischarge: parsedData.portOfDischarge || null,
      portOfLoading: parsedData.portOfLoading || null,
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
        extractedText: extractedText,
        invoiceType: invoiceType
    };
    console.log('Creating invoice in database...');
      savedDoc = await Invoice.create(invoiceData);
    console.log('Invoice created successfully');
    }

    res.status(200).json({ message: invoiceType === 'packing_list' ? 'Packing list extracted and saved' : invoiceType === 'purchase_order' ? 'Purchase order extracted and saved' : 'Invoice extracted and saved', data: savedDoc });

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

const savePackingList = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    if (!_id) {
      return res.status(400).json({ message: 'Packing List ID is required' });
    }
    const updatedPackingList = await PackingList.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedPackingList) {
      return res.status(404).json({ message: 'Packing List not found' });
    }
    res.status(200).json({ message: 'Packing List updated successfully', data: updatedPackingList });
  } catch (error) {
    console.error('Error saving packing list:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

const savePurchaseOrder = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    let items = updateData.itemsOrdered || [];
    const seenCodes = new Set();
    const itemsToSave = [];
    for (const item of items) {
      const code = (item.itemCode || '').trim().toLowerCase();
      if (item.matchStatus !== 'already_exists' && code && !seenCodes.has(code)) {
        seenCodes.add(code);
        itemsToSave.push(item);
      }
    }
    updateData.itemsOrdered = itemsToSave;

    let savedDoc;
    if (!_id) {
      // Create new purchase order
      savedDoc = await PurchaseOrder.create(updateData);
    } else {
      // Update existing purchase order
      savedDoc = await PurchaseOrder.findByIdAndUpdate(
        _id,
        updateData,
        { new: true, runValidators: true }
      );
      if (!savedDoc) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }
    }

    // Automatically trigger embedding refresh for PO items
    try {
      await axios.post('http://127.0.0.1:8000/refresh-po');
      console.log('Triggered /refresh-po for PO embeddings');
    } catch (refreshErr) {
      console.error('Failed to trigger /refresh-po:', refreshErr.message);
    }

    return res.status(200).json({
      message: `Purchase Order saved. ${itemsToSave.length} items saved, ${items.length - itemsToSave.length} items skipped (already exist).`,
      data: savedDoc,
      skipped: items.filter(item => item.matchStatus === 'already_exists').map(item => item.itemCode)
    });
  } catch (error) {
    console.error('Error saving purchase order:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { uploadInvoice, saveInvoice, savePackingList, savePurchaseOrder };
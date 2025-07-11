const express = require('express');
const router = express.Router();
const StockMasterItem = require('../models/StockMasterItem');
const multer = require('multer');
const upload = multer();
const parsePDF = require('../utils/pdfParser');
const axios = require('axios');
const pdf2table = require('pdf2table');
const pdfParse = require('pdf-parse');
// const { Configuration, OpenAIApi } = require('openai');
// const openai = new OpenAIApi(
//   new Configuration({ apiKey: process.env.OPEN_API_KEY })
// );
// You may need to implement or import your AI extraction logic here

// async function pdfBufferToCSV(buffer) {
//   return new Promise((resolve, reject) => {
//     pdf2table.parse(buffer, async (err, rows) => {
//       if (err || !rows || rows.length === 0) {
//         // Fallback to full text extraction using pdf-parse
//         try {
//           const data = await pdfParse(buffer);
//           resolve(data.text); // Return plain text
//         } catch (textErr) {
//           reject(textErr);
//         }
//       } else {
//         // Convert all rows to CSV
//         const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
//         resolve(csv);
//       }
//     });
//   });
// }

// --- New Mistral OCR logic for table extraction ---
async function pdfBufferToCSV(buffer) {
  console.log('[Mistral OCR] Using Mistral OCR for table extraction...');
  const text = await parsePDF(buffer);
  console.log('[Mistral OCR] Extracted text preview:', text.slice(0, 500));
  // You may want to implement table parsing from markdown here if needed
  return text;
}

// Add new stock master items (bulk insert)
router.post('/add', async (req, res) => {
  let codes = [];
  try {
    let items = req.body.items; // Expecting an array of { itemCode, name, description, matchStatus }
    console.log('Received items to add:', items);
    if (!Array.isArray(items) || items.length === 0) {
      console.log('No items provided');
      return res.status(400).json({ error: 'No items provided' });
    }

    // Only keep items with matchStatus 'unmatched' or 'suggested' (if matchStatus exists)
    if (items[0] && items[0].matchStatus !== undefined) {
      items = items.filter(item => item.matchStatus === 'unmatched' || item.matchStatus === 'suggested');
      console.log('Filtered to unmatched/suggested items:', items);
    }

    // Deduplicate by itemCode (keep first occurrence)
    const seenCodes = new Set();
    items = items.filter(item => {
      if (!item.itemCode) return false;
      const code = item.itemCode.toLowerCase();
      if (seenCodes.has(code)) return false;
      seenCodes.add(code);
      return true;
    });
    console.log('Deduplicated items:', items);

    codes = items.map(item => item.itemCode.toLowerCase());
    const existing = await StockMasterItem.find({ itemCode: { $in: codes } });
    const existingCodes = new Set(existing.map(item => item.itemCode.toLowerCase()));
    const toInsert = items.filter(item => !existingCodes.has(item.itemCode.toLowerCase()));
    const skipped = items.filter(item => existingCodes.has(item.itemCode.toLowerCase()));
    console.log('To insert:', toInsert);
    console.log('Skipped (already exist):', skipped);

    // Insert only new items
    let result = [];
    if (toInsert.length > 0) {
      result = await StockMasterItem.insertMany(toInsert);
      console.log('Successfully inserted items:', result.length);
      // Trigger embedding refresh in Python service
      try {
        await axios.post('http://127.0.0.1:8000/refresh');
        console.log('Triggered /refresh for embeddings');
      } catch (refreshErr) {
        console.error('Failed to trigger /refresh:', refreshErr.message);
      }
    }

    // Respond with inserted count and skipped codes
    if (skipped.length > 0) {
      return res.status(207).json({
        success: true,
        inserted: result.length,
        skipped: skipped.map(item => item.itemCode),
        message: 'Some items were not added because their itemCode already exists.'
      });
    } else {
      return res.json({ success: true, inserted: result.length });
    }
  } catch (err) {
    // If error is a duplicate key error, respond as if those items were skipped
    if (err.code === 11000 || (err.message && err.message.includes('duplicate key'))) {
      return res.status(207).json({
        success: true,
        inserted: 0,
        skipped: codes || [],
        message: 'Some items were not added because their itemCode already exists.'
      });
    }
    console.error('Error in /add:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Get all stock master items
router.get('/', async (req, res) => {
  try {
    const items = await StockMasterItem.find({});
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Extract items from uploaded PDF (does not save to DB)
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    console.log('Received /extract request');
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('File received:', req.file.originalname, req.file.mimetype, req.file.size);
    // 1. Convert the whole PDF to CSV
    const csvTable = await pdfBufferToCSV(req.file.buffer);
    console.log('Extracted CSV table:', csvTable.slice(0, 500));
    // 2. Send CSV to AI extraction logic
    let extractedItems = await aiExtractStockMasterItems(csvTable);
    if (extractedItems && extractedItems.itemsTable && Array.isArray(extractedItems.itemsTable)) {
      extractedItems = extractedItems.itemsTable;
    }
    console.log('Extracted items:', extractedItems);

    // 3. Fetch all existing stock master items for matching
    const allMasterItems = await StockMasterItem.find({});
    const masterByItemCode = {};
    allMasterItems.forEach(item => {
      if (item.itemCode) masterByItemCode[item.itemCode.toLowerCase()] = item;
    });

    // 4. Prepare items for matching
    const itemsToMatch = [];
    const matchResults = [];
    extractedItems.forEach((item, idx) => {
      const code = (item.itemCode || '').toLowerCase();
      if (code && masterByItemCode[code]) {
        // Exact itemCode match
        matchResults.push({
          ...item,
          matchStatus: 'already_exists',
          confidence: 1.0,
          method: 'itemCode',
          matchedMasterItem: masterByItemCode[code],
        });
      } else {
        // No itemCode match, add to match queue
        itemsToMatch.push({ idx, description: item.description || '' });
        matchResults.push(null); // placeholder
      }
    });

    // 5. Call Python /match for unmatched items
    if (itemsToMatch.length > 0) {
      const descriptions = itemsToMatch.map(i => i.description);
      try {
        const pyRes = await axios.post('http://127.0.0.1:8000/match', {
          descriptions,
          top_n: 1
        });
        pyRes.data.forEach((result, i) => {
          const idx = itemsToMatch[i].idx;
          const match = result.matches && result.matches[0];
          let matchStatus = 'unmatched';
          let confidence = 0;
          let method = result.method;
          let matchedMasterItem = null;
          if (match && match.score >= 0.8) {
            matchStatus = 'matched';
            confidence = match.score;
            matchedMasterItem = match.item;
          } else if (match && match.score >= 0.6) {
            matchStatus = 'suggested';
            confidence = match.score;
            matchedMasterItem = match.item;
          }
          matchResults[idx] = {
            ...extractedItems[idx],
            matchStatus,
            confidence,
            method,
            matchedMasterItem
          };
        });
      } catch (err) {
        // Handle case where Python service has no master items loaded
        if (
          err.response &&
          err.response.status === 500 &&
          err.response.data &&
          err.response.data.detail === 'Master items or embeddings not loaded.'
        ) {
          itemsToMatch.forEach(({ idx }) => {
            matchResults[idx] = {
              ...extractedItems[idx],
              matchStatus: 'unmatched',
              confidence: 0,
              method: 'none',
              matchedMasterItem: null
            };
          });
        } else {
          throw err;
        }
      }
    }

    // Fix: Only spread root-level fields, not the items array, into the response
    let rootFields = {};
    if (extractedItems && typeof extractedItems === 'object' && !Array.isArray(extractedItems)) {
      Object.entries(extractedItems).forEach(([key, value]) => {
        if (!Array.isArray(value) && typeof value !== 'object') {
          rootFields[key] = value;
        }
      });
    }
    res.json({ ...rootFields, items: matchResults, extractedText: csvTable });
  } catch (err) {
    console.error('StockMaster /extract error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Real AI extraction function for stock master items using OpenAI GPT-4 via axios
async function aiExtractStockMasterItems(csvTable) {
  // Add a clear page break marker if not already present
  const pages = csvTable.split(/\n(?=\| )/g); // crude split on markdown table start
  const csvWithPageBreaks = pages.join('\n--- PAGE BREAK ---\n');
  const prompt = `\nExtract the following fields from the given csv (it can be an invoice, purchase order, or stock master) and return JSON without any explanation.\n\nIMPORTANT: The following text may contain multiple tables across multiple pages. Extract ALL items from ALL tables, across ALL pages. Do not stop at the first table or page. If a table is split across pages, merge the rows into a single list.\n\nExtract these fields at the root level:\n- vendor\n- purchaseOrderNo\n- purchaseOrderDate\n- vendorNo\n- currency\n- customerContact\n- buyerName\n- buyerEmail\n- buyerTelephone\n- otherReference\n- contractOrOfferNo\n- customerProjRef\n- termsOfPayment\n- incoterm\n- incotermLocation\n- deliveryDate\n- goodsMarked\n- billTo\n- shipTo\n- vendorContact\n- vendorEmail\n- vendorTelephone\n- vendorName\n- taxId\n- totalNetValue\n- additionalInformation\n- allowanceAmount\n- allowances\n- projectNumber\n- salesOrderNr\n- salesOrderItemNr\n- itemsTable (extract ALL items, no matter how many)\n\nEach item in itemsTable MUST have these EXACT field names:\n{\n  "itemCode": "item code or reference",\n  "name": "item name",\n  "description": "item description",\n  "materialNumber": "material number if available",\n  "materialDescription": "material description if available",\n  "quantity": "quantity as a number",\n  "quantityUnit": "unit of quantity (e.g., pieces, kg, etc.)",\n  "pricePerUnit": "price per unit with currency if mentioned",\n  "netPrice": "net price with currency if mentioned",\n  "totalWeight": "total/net/gross weight if mentioned",\n  "totalPrice": "total price/amount with currency if mentioned",\n  "poDeliveryDate": "delivery date if available",\n  "hsnCode": "HSN code if available",\n  "gstRate": "GST rate/percentage if available",\n  "alias": "any alias or alternate name for the item",\n  "mfgDate": "manufacturing date if available",\n  "expiryDate": "expiry date if available"\n}\n\nIMPORTANT: For every item, always include all the above fields. If a value is missing, set it to null or an empty string. Do not skip or merge rows, even if other fields are similar. For all price-related fields, include the currency if it's mentioned. Look for currency symbols (€, $, ₹, etc.) or currency codes (EUR, USD, INR, etc.) near the price values. If the same currency is used throughout, use that currency for all price fields.\n\nGive pure JSON only, no backticks, no markdown.\n${csvWithPageBreaks}\n`;
  console.log('Sending prompt to OpenAI (axios). Prompt length:', prompt.length);
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2048
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPEN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  let extracted = response.data.choices[0].message.content.trim();
  console.log('Raw OpenAI response:', extracted.slice(0, 500));
  if (extracted.startsWith('```')) {
    extracted = extracted.replace(/```json|```/g, '').trim();
  }
  try {
    const parsed = JSON.parse(extracted);
    return parsed;
  } catch (err) {
    console.error('Error parsing OpenAI response as JSON:', extracted);
    throw new Error('OpenAI response was not valid JSON');
  }
}

module.exports = router; 
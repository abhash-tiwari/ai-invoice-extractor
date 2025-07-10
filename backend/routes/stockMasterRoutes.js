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

async function pdfBufferToCSV(buffer) {
  return new Promise((resolve, reject) => {
    pdf2table.parse(buffer, async (err, rows) => {
      if (err || !rows || rows.length === 0) {
        // Fallback to full text extraction using pdf-parse
        try {
          const data = await pdfParse(buffer);
          resolve(data.text); // Return plain text
        } catch (textErr) {
          reject(textErr);
        }
      } else {
        // Convert all rows to CSV
        const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
        resolve(csv);
      }
    });
  });
}

// Add new stock master items (bulk insert)
router.post('/add', async (req, res) => {
  try {
    const items = req.body.items; // Expecting an array of { itemCode, name, description }
    console.log('Received items to add:', items);
    if (!Array.isArray(items) || items.length === 0) {
      console.log('No items provided');
      return res.status(400).json({ error: 'No items provided' });
    }
    const result = await StockMasterItem.insertMany(items);
    console.log('Successfully inserted items:', result.length);
    // Trigger embedding refresh in Python service
    try {
      await axios.post('http://127.0.0.1:8000/refresh');
      console.log('Triggered /refresh for embeddings');
    } catch (refreshErr) {
      console.error('Failed to trigger /refresh:', refreshErr.message);
    }
    res.json({ success: true, inserted: result.length });
  } catch (err) {
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

    res.json({ items: matchResults, extractedText: csvTable });
  } catch (err) {
    console.error('StockMaster /extract error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Real AI extraction function for stock master items using OpenAI GPT-4 via axios
async function aiExtractStockMasterItems(csvTable) {
  const prompt = `\nExtract the following fields from the given csv it can be anything like an invoice or a purchase order and return JSON without any explanation:
- itemsTable (extract ALL items, no matter how many)

Each item in itemsOrdered MUST have these EXACT field names:
{
  "itemCode": "look for item code",
  "description": "description",
  "netPrice": "look for price",
  "poDliveryDate": "delivery date",
  "name": "item name",
}

Give pure JSON only, no backticks, no markdown.\n${csvTable}\n`;
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
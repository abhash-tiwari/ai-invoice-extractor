// const pdfParse = require('pdf-parse');
const axios = require('axios');
const FormData = require('form-data');

/**
 * Extracts text from a PDF buffer using the Mistral OCR API.
 * The old pdf-parse logic is commented out below for reference.
 * To revert, uncomment the old code and comment out the new logic.
 */
const parsePDF = async (buffer) => {
  // --- Old pdf-parse logic (commented out) ---
  // try {
  //   const data = await pdfParse(buffer);
  //   console.log('PDF parsed successfully', data.text);
  //   return data.text;
  // } catch (error) {
  //   throw new Error('Error parsing PDF');
  // }

  // --- New Mistral OCR logic ---
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY not set in environment');

  console.log('[Mistral OCR] Starting PDF extraction using Mistral OCR API...');

  // 1. Upload PDF to Mistral
  const formData = new FormData();
  formData.append('purpose', 'ocr');
  formData.append('file', buffer, { filename: 'uploaded.pdf' });

  let fileId;
  try {
    const uploadRes = await axios.post(
      'https://api.mistral.ai/v1/files',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    fileId = uploadRes.data.id;
    console.log(`[Mistral OCR] PDF uploaded successfully. File ID: ${fileId}`);
  } catch (err) {
    console.error('[Mistral OCR] Failed to upload PDF:', err.message);
    throw new Error('Failed to upload PDF to Mistral OCR: ' + err.message);
  }

  // 2. Get signed URL
  let signedUrl;
  try {
    const urlRes = await axios.get(
      `https://api.mistral.ai/v1/files/${fileId}/url?expiry=24`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      }
    );
    signedUrl = urlRes.data.url;
    console.log('[Mistral OCR] Signed URL retrieved successfully.');
  } catch (err) {
    console.error('[Mistral OCR] Failed to get signed URL:', err.message);
    throw new Error('Failed to get signed URL from Mistral: ' + err.message);
  }

  // 3. Request OCR
  try {
    const ocrRes = await axios.post(
      'https://api.mistral.ai/v1/ocr',
      {
        model: 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          document_url: signedUrl,
        },
        include_image_base64: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Combine markdown from all pages
    const pages = ocrRes.data.pages || [];
    const text = pages.map(page => page.markdown).join('\n');
    console.log('[Mistral OCR] Text extracted from Mistral OCR. Preview:');
    console.log(text.slice(0, 500)); // Log first 500 chars as a preview
    return text;
  } catch (err) {
    console.error('[Mistral OCR] Failed to extract text:', err.message);
    throw new Error('Failed to extract text with Mistral OCR: ' + err.message);
  }
};

module.exports = parsePDF;

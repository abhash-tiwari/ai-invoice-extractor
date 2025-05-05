const Tesseract = require('tesseract.js');

const processImage = async (imageBuffer) => {
  try {
    console.log('Starting image processing with Tesseract.js...');
    
    const result = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: m => console.log(m),
        tessjs_create_pdf: '0',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
        tessjs_create_box: '0',
        tessjs_create_unlv: '0',
        tessjs_create_osd: '0',
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,$/-()%#@!&*:; ',
        tessedit_pageseg_mode: '6' // Assume a uniform block of text
      }
    );

    console.log('Image processing completed');
    const extractedText = result.data.text;
    
    // Clean up the extracted text
    const cleanedText = extractedText
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    console.log('Extracted text length:', cleanedText.length);
    return cleanedText;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image: ' + error.message);
  }
};

module.exports = processImage; 
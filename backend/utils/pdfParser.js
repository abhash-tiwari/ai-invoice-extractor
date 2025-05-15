const pdfParse = require('pdf-parse');

const parsePDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    console.log('PDF parsed successfully', data.text);
    return data.text;
  } catch (error) {
    throw new Error('Error parsing PDF');
  }
};

module.exports = parsePDF;

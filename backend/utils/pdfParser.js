const pdfParse = require('pdf-parse');

const parsePDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Error parsing PDF');
  }
};

module.exports = parsePDF;

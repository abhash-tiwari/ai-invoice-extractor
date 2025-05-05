const axios = require('axios');
const Invoice = require('../../models/invoiceModel');
const parsePDF = require('../../utils/pdfParser');
const { uploadInvoice, saveInvoice } = require('../../controllers/invoiceController');

// Mock dependencies
jest.mock('axios');
jest.mock('../../models/invoiceModel');
jest.mock('../../utils/pdfParser');

describe('Invoice Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Set environment variable
    process.env.MISTRAL_API_KEY = 'test-api-key';
  });

  describe('uploadInvoice', () => {
    beforeEach(() => {
      // Mock request object for upload
      req = {
        file: {
          buffer: Buffer.from('mock pdf content')
        }
      };
    });

    it('should successfully upload and process an invoice', async () => {
      // Mock PDF parser response
      parsePDF.mockResolvedValue('Extracted PDF text');

      // Mock Mistral API response
      const mockExtractedData = {
        poNumber: 'PO123',
        invoiceNumber: 'INV456',
        seller: 'Test Seller',
        shippingMethod: 'Air',
        incoterm: 'FOB',
        itemsPurchased: ['Item 1', 'Item 2'],
        subtotal: 1000,
        taxes: 100,
        totalAmount: 1100
      };

      axios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify(mockExtractedData)
            }
          }]
        }
      });

      // Mock Invoice.create
      Invoice.create.mockResolvedValue(mockExtractedData);

      await uploadInvoice(req, res);

      expect(parsePDF).toHaveBeenCalledWith(req.file.buffer);
      expect(axios.post).toHaveBeenCalled();
      expect(Invoice.create).toHaveBeenCalledWith(mockExtractedData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invoice extracted and saved',
        data: mockExtractedData
      });
    });

    it('should handle missing file error', async () => {
      req.file = null;

      await uploadInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No file uploaded'
      });
    });

    it('should handle API error', async () => {
      parsePDF.mockResolvedValue('Extracted PDF text');
      axios.post.mockRejectedValue(new Error('API Error'));

      await uploadInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server Error'
      });
    });
  });

  describe('saveInvoice', () => {
    beforeEach(() => {
      // Mock request object for save
      req = {
        body: {
          _id: '123',
          poNumber: 'PO123',
          totalAmount: 1100
        }
      };
    });

    it('should successfully update an invoice', async () => {
      const updatedInvoice = {
        _id: '123',
        poNumber: 'PO123',
        totalAmount: 1100
      };

      Invoice.findByIdAndUpdate.mockResolvedValue(updatedInvoice);

      await saveInvoice(req, res);

      expect(Invoice.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { poNumber: 'PO123', totalAmount: 1100 },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invoice updated successfully',
        data: updatedInvoice
      });
    });

    it('should handle missing invoice ID', async () => {
      req.body = { poNumber: 'PO123' }; // No _id

      await saveInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invoice ID is required'
      });
    });

    it('should handle non-existent invoice', async () => {
      Invoice.findByIdAndUpdate.mockResolvedValue(null);

      await saveInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invoice not found'
      });
    });

    it('should handle database error', async () => {
      Invoice.findByIdAndUpdate.mockRejectedValue(new Error('Database Error'));

      await saveInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server Error'
      });
    });
  });
}); 
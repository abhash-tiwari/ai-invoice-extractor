const express = require('express');
const multer = require('multer');
const { uploadInvoice, saveInvoice, savePackingList, savePurchaseOrder } = require('../controllers/invoiceController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('invoice'), (req, res) => {
  uploadInvoice(req, res);
});
router.post('/save', saveInvoice);
router.post('/save-packing-list', savePackingList);
router.post('/save-purchase-order', savePurchaseOrder);

module.exports = router;

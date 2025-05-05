const express = require('express');
const multer = require('multer');
const { uploadInvoice, saveInvoice } = require('../controllers/invoiceController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('invoice'), uploadInvoice);
router.post('/save', saveInvoice);

module.exports = router;

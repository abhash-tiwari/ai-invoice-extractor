const express = require('express');
const multer = require('multer');
const { uploadInvoice } = require('../controllers/invoiceController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('invoice'), uploadInvoice);

module.exports = router;

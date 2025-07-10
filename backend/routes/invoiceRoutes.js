const express = require('express');
const multer = require('multer');
const { uploadInvoice, saveInvoice, savePackingList, savePurchaseOrder } = require('../controllers/invoiceController');
const PurchaseOrder = require('../models/PurchaseOrderModel');
const StockMasterItem = require('../models/StockMasterItem');
const Fuse = require('fuse.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('invoice'), (req, res) => {
  uploadInvoice(req, res);
});
router.post('/save', saveInvoice);
router.post('/save-packing-list', savePackingList);
router.post('/save-purchase-order', savePurchaseOrder);

router.get('/po-items', async (req, res) => {
  try {
    const allPOs = await PurchaseOrder.find({}, 'itemsOrdered purchaseOrderNo vendor');
    // Flatten all itemsOrdered with PO context
    const allItems = allPOs.flatMap(po =>
      (po.itemsOrdered || []).map(item => ({
        ...item,
        purchaseOrderNo: po.purchaseOrderNo,
        vendor: po.vendor,
        poId: po._id
      }))
    );
    res.json({ items: allItems });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PO items', error: err.message });
  }
});

router.post('/po-items/add', async (req, res) => {
  try {
    const { poId, newItems } = req.body;
    if (!poId || !Array.isArray(newItems)) {
      return res.status(400).json({ message: 'poId and newItems are required' });
    }
    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    // Fetch all master items for matching
    const masterItems = await StockMasterItem.find({});
    const fuse = new Fuse(masterItems, {
      keys: ['name', 'description'],
      threshold: 0.4 // Adjust for strictness
    });
    const matchedItems = newItems.map(item => {
      // 1. Exact match on itemRef
      let matchStatus = 'unmatched';
      let confidence = 0;
      let matchedMasterItem = null;
      if (item.itemRef) {
        const exact = masterItems.find(m => m.itemRef && m.itemRef.toLowerCase() === item.itemRef.toLowerCase());
        if (exact) {
          matchStatus = 'matched';
          confidence = 100;
          matchedMasterItem = exact;
        }
      }
      // 2. Fuzzy match if no exact
      if (!matchedMasterItem && (item.description || item.name)) {
        const fuseResults = fuse.search(item.description || item.name || '');
        if (fuseResults.length > 0) {
          const best = fuseResults[0];
          confidence = Math.round((1 - best.score) * 100);
          if (confidence >= 80) {
            matchStatus = 'matched';
          } else if (confidence >= 60) {
            matchStatus = 'suggested';
          } else {
            matchStatus = 'unmatched';
          }
          matchedMasterItem = best.item;
        }
      }
      return {
        ...item,
        matchStatus,
        confidence,
        matchedMasterItem: matchedMasterItem ? {
          _id: matchedMasterItem._id,
          itemRef: matchedMasterItem.itemRef,
          name: matchedMasterItem.name,
          description: matchedMasterItem.description
        } : null
      };
    });
    po.itemsOrdered = [...(po.itemsOrdered || []), ...matchedItems];
    await po.save();
    res.json({ message: 'Items added', itemsOrdered: po.itemsOrdered });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add PO items', error: err.message });
  }
});

module.exports = router;

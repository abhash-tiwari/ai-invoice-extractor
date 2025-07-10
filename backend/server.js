const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const invoiceRoutes = require('./routes/invoiceRoutes');
const stockMasterRoutes = require('./routes/stockMasterRoutes');
const createAtlasVectorIndex = require('./utils/createAtlasVectorIndex');

dotenv.config();
connectDB();

// Ensure Atlas Vector Search index exists at startup
createAtlasVectorIndex();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/invoices', invoiceRoutes);
app.use('/api/stockmasteritems', stockMasterRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

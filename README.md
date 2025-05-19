# AI Invoice Extractor

A MERN stack application that uses AI to extract structured data from invoice documents (PDFs and images).

## Features

- **Document Upload**: Support for PDF and image files (JPEG, PNG)
- **AI-Powered Extraction**: Uses fine-tuned Mistral model for accurate data extraction
- **Data Management**: Store and manage extracted invoice data
- **User-Friendly Interface**: Clean and intuitive form interface for data verification
- **Customizable Fields**: Edit and verify extracted data before saving
- **Multiple Item Support**: Handle invoices with multiple line items
- **Currency Support**: Automatic currency detection and handling

## Tech Stack

### Frontend
- React.js
- Modern JavaScript (ES6+)
- CSS for styling
- Optimized performance with React.memo and useCallback

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Mistral AI API integration

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Mistral AI API key
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/abhash-tiwari/ai-invoice-extractor.git
cd ai-invoice-extractor
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Create environment files:

Backend (.env):
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
MISTRAL_API_KEY=your_mistral_api_key
```


## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
ai-invoice-extractor/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── model/
│   │   └── invoiceModel.js
│   ├── controllers/
│   │   └── invoiceController.js
│   │── utils/
│   │       └── pdfParser.js
│   │       └── imageProcessor.js
│   ├── routes/
│   │   └── invoiceRoutes.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── InvoiceForm.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Component Documentation

### InvoiceForm Component

The main form component for displaying and editing invoice data.

#### Props
- `invoiceData` (Object): Initial invoice data
- `onSave` (Function): Callback function when form is saved

#### Features
- Form field validation
- Dynamic item management
- Currency handling
- Data formatting
- Performance optimized with React.memo and useCallback

#### State Management
```javascript
const [formData, setFormData] = useState({
  poNumber: '',
  invoiceNumber: '',
  seller: '',
  buyer: '',
  consignee: '',
  address: '',
  notifyParty: '',
  shippingMethod: '',
  incoterm: '',
  portOfDischarge: '',
  bankAccountHolder: '',
  bankName: '',
  bankAccountNumber: '',
  bankIfscCode: '',
  bankSwiftCode: '',
  deliveryLocation: '',
  invoiceDate: '',
  paymentTerms: '',
  itemsPurchased: [],
  subtotal: '',
  taxes: '',
  totalAmount: '',
  currency: ''
});
```

#### Key Functions
- `handleChange`: Handles input field changes
- `handleItemChange`: Manages item field updates
- `addNewItem`: Adds new item to the invoice
- `removeItem`: Removes item from the invoice
- `formatPrice`: Formats price with currency
- `handleSave`: Saves form data

## API Documentation

### Upload Invoice
```http
POST /api/invoices/upload
Content-Type: multipart/form-data

Response:
{
  "message": "Invoice extracted and saved",
  "data": {
    // Invoice data
  }
}
```

### Save Invoice
```http
POST /api/invoices/save
Content-Type: application/json

Response:
{
  "message": "Invoice saved successfully",
  "data": {
    // invoice data
  }
}
```

## Performance Optimizations

1. **Memoization**
   - Component memoization with React.memo
   - Event handler memoization with useCallback
   - Computed value memoization with useMemo

2. **State Updates**
   - Optimized state updates
   - Efficient array handling
   - Reduced re-renders

3. **Form Handling**
   - Efficient input handling
   - Optimized validation
   - Smart field updates

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@example.com or create an issue in the repository.

## Acknowledgments

- Mistral AI for the AI model
- MongoDB for the database
- React.js community for the amazing framework 
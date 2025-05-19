# AI Invoice Extractor - Technical Documentation

## System Architecture

### Overview
The AI Invoice Extractor is a MERN stack application designed to automate invoice data extraction using AI. The system follows a microservices architecture with clear separation of concerns between frontend and backend services.

### Architecture Diagram
```
[Client Layer]
    React Frontend
        ↓
[API Layer]
    Express Backend
        ↓
[Service Layer]
    AI Processing
    Data Validation
        ↓
[Data Layer]
    MongoDB Database
```

## Technical Implementation

### 1. Frontend Architecture

#### Core Components
- **InvoiceForm**: Main component handling data display and user interactions
  - Implements React.memo for performance optimization
  - Uses useCallback for event handler memoization
  - Implements controlled components for form state management

#### State Management
```javascript
// Form State Structure
{
  // Basic Information
  poNumber: string,
  invoiceNumber: string,
  invoiceDate: string,
  
  // Party Information
  seller: string,
  buyer: string,
  consignee: string,
  address: string,
  notifyParty: string,
  
  // Shipping Details
  shippingMethod: string,
  incoterm: string,
  portOfDischarge: string,
  deliveryLocation: string,
  
  // Banking Information
  bankAccountHolder: string,
  bankName: string,
  bankAccountNumber: string,
  bankIfscCode: string,
  bankSwiftCode: string,
  
  // Financial Information
  paymentTerms: string,
  itemsPurchased: Array<Item>,
  subtotal: string,
  taxes: string,
  totalAmount: string,
  currency: string
}
```

#### Performance Optimizations
1. **Component Memoization**
   ```javascript
   export default React.memo(InvoiceForm);
   ```

2. **Event Handler Optimization**
   ```javascript
   const handleChange = useCallback((e, field) => {
     setFormData(prev => ({
       ...prev,
       [field]: e.target.value
     }));
   }, []);
   ```

3. **Computed Value Memoization**
   ```javascript
   const formatDate = useMemo(() => {
     return formData.invoiceDate ? 
       new Date(formData.invoiceDate).toISOString().split('T')[0] : '';
   }, [formData.invoiceDate]);
   ```

### 2. Backend Architecture

#### API Endpoints

1. **Invoice Upload**
   ```http
   POST /api/invoices/upload
   Content-Type: multipart/form-data
   
   Request Body:
   - file: File (PDF/Image)
   
   Response:
   {
     "success": boolean,
     "message": string,
     "data": {
       "invoiceId": string,
       "extractedData": object
     }
   }
   ```

2. **Invoice Save**
   ```http
   POST /api/invoices/save
   Content-Type: application/json
   
   Request Body:
   {
     // invoice data
   }
   
   Response:
   {
     "success": boolean,
     "message": string,
     "data": {
       "updatedInvoice": object
     }
   }
   ```

#### Data Processing Pipeline

1. **Document Processing**
   - PDF text extraction using pdf-parse
   - Image text extraction using Tesseract.js
   - Text normalization and cleaning

2. **AI Processing**
   - Text segmentation
   - Entity recognition using Mistral model
   - Data structure mapping

3. **Data Validation**
   - Schema validation

### 3. Database Schema

#### Invoice Collection
```javascript
{
  _id: ObjectId,
  poNumber: String,
  invoiceNumber: String,
  invoiceDate: Date,
  seller: String,
  buyer: String,
  consignee: String,
  address: String,
  notifyParty: String,
  shippingMethod: String,
  incoterm: String,
  portOfDischarge: String,
  bankAccountHolder: String,
  bankName: String,
  bankAccountNumber: String,
  bankIfscCode: String,
  bankSwiftCode: String,
  deliveryLocation: String,
  paymentTerms: String,
  itemsPurchased: [{
    itemRef: String,
    description: String,
    quantity: Number,
    quantityUnit: String,
    pricePerUnit: Number,
    totalPrice: Number
  }],
  subtotal: Number,
  taxes: Number,
  totalAmount: Number,
  currency: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Implementation

### 1. Input Validation
- Sanitization of user inputs
- Schema validation using Mongoose
- File type validation for uploads

### 2. Data Protection
- Secure file storage
- Data encryption at rest
- Secure API key management

## Performance Metrics

### Frontend
- Initial load time: < 2s
- Form render time: < 100ms
- State update time: < 50ms

### Backend
- API response time: < 500ms
- Document processing time: < 1s
- AI processing time: < 5s

## Scalability Considerations

### 1. Horizontal Scaling
- Stateless API design
- Load balancer ready
- Database sharding support

## Deployment Requirements

### 1. Infrastructure
- Node.js v16+
- MongoDB 4.4+
- 2GB RAM minimum
- 10GB storage

### 2. Environment Variables
```env
# Backend
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invoices
MISTRAL_API_KEY=your_api_key

```

### 3. Dependencies
- See package.json for complete list
- Key dependencies:
  - React 18.x
  - Express 4.x
  - Mongoose 6.x
  - Mistral AI SDK
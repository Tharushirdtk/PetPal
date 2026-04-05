# 🐾 PetPal

**PetPal** is an AI-powered pet health diagnosis platform that helps pet owners understand and monitor their pets' health through intelligent symptom analysis, image-based diagnosis, and personalized consultations.

## 🌟 Features

- **AI-Powered Diagnosis**: Advanced pet health diagnosis using machine learning and AI
- **Emergency Detection System**: Database-driven emergency detection for critical pet health conditions
- **Skin Condition Analysis**: Image-based skin condition detection using TensorFlow models
- **Interactive Chat**: Real-time chat with AI-powered pet health consultation
- **Pet Profile Management**: Create and manage multiple pet profiles
- **Health History Tracking**: Keep track of diagnoses and consultations over time
- **Questionnaire System**: Guided symptom assessment for accurate diagnosis
- **Vector Database Integration**: ChromaDB for intelligent context retrieval and embeddings
- **Secure Authentication**: JWT-based authentication with bcrypt hashing
- **Admin Dashboard**: Comprehensive administrative interface for system management
- **API Documentation**: Interactive Swagger/OpenAPI documentation

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library (JSX, not TypeScript)
- **Vite 8** - Fast build tool and dev server
- **React Router DOM** - Client-side routing
- **TailwindCSS 4** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Headless UI** - Accessible UI components

### Backend
- **Node.js** + **Express 4** - RESTful API server (CommonJS)
- **MySQL** - Primary database with structured schema
- **ChromaDB** - Vector database for intelligent embeddings
- **Google Gemini API** - AI-powered chat and analysis
- **JWT** - Authentication tokens with bcrypt (12 salt rounds)
- **Swagger/OpenAPI** - Interactive API documentation
- **Multer** - Secure file upload handling
- **Jest** - Testing framework with comprehensive test suite

### Python Sidecar (Port 5001)
- **Flask** - Lightweight microservice API
- **TensorFlow** - ML model inference for image analysis
- **Sentence Transformers** - Advanced text embeddings
- **Pillow** - Image processing and manipulation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Python** (v3.8 or higher)
- **MySQL** (v8.0 or higher)
- **pip** (Python package manager)
- **ChromaDB** server (optional, for vector database features)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PetPal_T2
```

### 2. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE petpal;
```

Run the database migrations (if available) or set up your schema.

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration (see Configuration section)

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 4. Python Sidecar Setup

```bash
cd backend/python-sidecar

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix/MacOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Python sidecar
python app.py
```

The Python sidecar will run on `http://localhost:5001`

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env .env.local
# Edit if needed

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=5000

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=petpal

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_change_this

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# File Uploads
UPLOAD_DIR=./uploads

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Python Sidecar
PYTHON_SIDECAR_URL=http://localhost:5001

# CORS
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📦 Running the Application

### Development Mode

You need to run three services:

1. **Backend Server** (Port 5000):
   ```bash
   cd backend
   npm run dev
   ```

2. **Python Sidecar** (Port 5001):
   ```bash
   cd backend/python-sidecar
   python app.py
   ```

3. **Frontend** (Port 5173):
   ```bash
   cd frontend
   npm run dev
   ```

### Production Mode

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 📖 Documentation

### Frontend Scenarios & API Guide
For detailed user flow scenarios and API integration examples, see:
**`other/docs/frontend-scenarios-api-guide.md`**

This comprehensive guide covers:
- **Guest User Journey**: Browse without registration
- **Registration & Authentication**: User signup and login flows
- **Pet Management**: Creating and managing pet profiles
- **Enhanced Diagnosis**: Complete diagnosis workflow with questionnaires
- **AI Chat & Consultations**: Interactive chat features
- **Medical History**: Tracking and viewing past diagnoses
- **Admin Dashboard**: Administrative interface and features

### API Documentation

Once the backend is running, access the interactive API documentation at:

**Swagger UI**: `http://localhost:5000/api/docs`

### Available API Endpoints:

- **Authentication** (`/api/auth`)
  - User registration and login
  - JWT token management
  - Password reset functionality

- **Pet Management** (`/api/pets`)
  - Create, read, update, delete pet profiles
  - Pet health records management

- **Diagnosis System** (`/api/diagnosis`)
  - Symptom-based diagnosis
  - Medical history tracking
  - Emergency condition detection

- **Questionnaire** (`/api/questionnaire`)
  - Guided health assessment
  - Symptom evaluation forms

- **Chat & Consultations** (`/api/chat`, `/api/consultations`)
  - Real-time AI chat support
  - Consultation scheduling and management
  - Chat history persistence

- **Image Processing** (`/api/images`)
  - Secure image upload handling
  - Skin condition analysis via TensorFlow

- **Admin Operations** (`/api/admin`)
  - User management (admin access required)
  - System monitoring and statistics
  - Content moderation tools

- **Contact & Support** (`/api/contact`)
  - Support ticket management
  - Contact form submissions

### Authentication Middleware:
- `requireAuth`: Strict authentication for protected routes
- `optionalAuth`: Permissive authentication for enhanced features
- `requireAdmin`: Admin-only access control

## 📁 Project Structure

```
PetPal_T2/
├── backend/
│   ├── config/           # Configuration files (CORS, Swagger, DB)
│   ├── controllers/      # Request handlers with asyncHandler wrapper
│   ├── middleware/       # Express middleware (auth, error handling, rate limiting)
│   ├── models/          # Database models and schema definitions
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (vector DB, AI services, response helpers)
│   ├── utils/           # Utility functions (asyncHandler, response helpers)
│   ├── tests/           # Jest test suites (*.spec.js files)
│   ├── python-sidecar/  # Python ML service (Flask + TensorFlow)
│   │   ├── app.py       # Flask server (port 5001)
│   │   ├── requirements.txt
│   │   └── models/      # TensorFlow model files
│   ├── uploads/         # User-uploaded files (secure handling)
│   ├── jest.config.js   # Jest testing configuration
│   ├── server.js        # Main entry point
│   └── package.json
│
├── frontend/
│   ├── public/          # Static assets and favicon
│   ├── src/
│   │   ├── api/         # API client functions and axios configuration
│   │   ├── assets/      # Images, fonts, and static resources
│   │   ├── components/  # Reusable React components (JSX)
│   │   ├── context/     # React Context providers (Auth, Theme)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components and route handlers
│   │   ├── App.jsx      # Main App component with routing
│   │   └── main.jsx     # React 19 entry point
│   ├── index.html       # HTML template
│   ├── vite.config.js   # Vite 8 configuration
│   ├── tailwind.config.js # TailwindCSS 4 configuration
│   └── package.json
│
├── other/
│   └── docs/            # Project documentation
│       └── frontend-scenarios-api-guide.md # Complete user scenarios guide
│
└── README.md
```

## 🔑 Key Features Overview

### 1. Pet Health Diagnosis
- Symptom-based assessment through guided questionnaires
- AI-powered analysis using Google Gemini
- Historical diagnosis tracking

### 2. Skin Condition Detection
- Upload pet images for analysis
- TensorFlow-based model for skin condition classification
- Visual results with confidence scores

### 3. AI Chat Consultation
- Real-time chat with AI veterinary assistant
- Context-aware responses using vector embeddings
- Chat history persistence

### 4. User Management
- Secure registration and login
- Profile management
- Multiple pet profiles per user

### 5. Admin Panel
- User management
- System monitoring
- Content moderation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication system
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Rate Limiting**: API endpoint protection against abuse
- **CORS Configuration**: Cross-origin resource sharing control
- **Input Validation**: Comprehensive request validation and sanitization
- **Secure File Uploads**: Protected file handling with type validation
- **Role-Based Access**: Admin and user-level authorization controls
- **SQL Injection Protection**: Parameterized queries and ORM security
- **Environment Variables**: Sensitive configuration management
- **Error Handling**: Secure error responses without information leakage

### Authentication Layers:
- **Guest Access**: Limited read-only functionality
- **User Authentication**: Full platform access with personal data
- **Admin Authorization**: System administration and user management

## 🧪 Testing

The project includes a comprehensive testing suite using Jest:

### Backend Testing
```bash
cd backend
npm test
```

**Test Coverage:**
- **155 test cases** across **10 test suites** (all passing ✅)
- Complete API endpoint testing
- Authentication middleware testing
- Database model testing with mocking
- Service layer unit tests
- Error handling validation

**Testing Configuration:**
- Jest configuration: `backend/jest.config.js`
- Test files: `backend/tests/*.spec.js`
- Mocked dependencies: Models, database config, services
- Custom `asyncHandler` mocking for controller tests

### Frontend Testing
```bash
cd frontend
npm test
```

**Test Structure:**
- Component unit tests
- Integration tests for API interactions
- User flow testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

PetPal Development Team

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- TensorFlow for machine learning models
- ChromaDB for vector database functionality
- The open-source community

## 📞 Support

For support, email support@petpal.com or open an issue in the repository.

---

**Made with ❤️ for pet lovers everywhere**

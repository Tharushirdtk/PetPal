# 🐾 PetPal

**PetPal** is an AI-powered pet health diagnosis platform that helps pet owners understand and monitor their pets' health through intelligent symptom analysis, image-based diagnosis, and personalized consultations.

## 🌟 Features

- **AI-Powered Diagnosis**: Advanced pet health diagnosis using machine learning and AI
- **Skin Condition Analysis**: Image-based skin condition detection using TensorFlow models
- **Interactive Chat**: Real-time chat with AI-powered pet health consultation
- **Pet Profile Management**: Create and manage multiple pet profiles
- **Health History Tracking**: Keep track of diagnoses and consultations over time
- **Questionnaire System**: Guided symptom assessment for accurate diagnosis
- **Vector Database Integration**: ChromaDB for intelligent context retrieval
- **Secure Authentication**: JWT-based authentication system
- **Admin Dashboard**: Administrative interface for system management
- **API Documentation**: Interactive Swagger/OpenAPI documentation

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **Vite** - Fast build tool and dev server
- **React Router DOM** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Headless UI** - Accessible UI components

### Backend
- **Node.js** + **Express** - RESTful API server
- **MySQL** - Primary database
- **ChromaDB** - Vector database for embeddings
- **Google Gemini API** - AI-powered chat and analysis
- **JWT** - Authentication tokens
- **Swagger** - API documentation
- **Multer** - File upload handling
- **Bcrypt** - Password hashing

### Python Sidecar
- **Flask** - Microservice API
- **TensorFlow** - ML model inference
- **Sentence Transformers** - Text embeddings
- **Pillow** - Image processing

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

## 📚 API Documentation

Once the backend is running, access the interactive API documentation at:

**Swagger UI**: `http://localhost:5000/api/docs`

The API includes endpoints for:
- Authentication (`/api/auth`)
- Pet management (`/api/pets`)
- Diagnosis (`/api/diagnosis`)
- Chat/Consultations (`/api/chat`, `/api/consultations`)
- Image uploads (`/api/images`)
- Admin operations (`/api/admin`)
- Contact/Support (`/api/contact`)

## 📁 Project Structure

```
PetPal_T2/
├── backend/
│   ├── config/           # Configuration files (CORS, Swagger, DB)
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware (auth, error handling, rate limiting)
│   ├── models/          # Database models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (vector DB, AI services)
│   ├── utils/           # Utility functions
│   ├── python-sidecar/  # Python ML service
│   │   ├── app.py
│   │   └── requirements.txt
│   ├── uploads/         # User-uploaded files
│   ├── server.js        # Main entry point
│   └── package.json
│
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── api/         # API client functions
│   │   ├── assets/      # Images, fonts, etc.
│   │   ├── components/  # Reusable React components
│   │   ├── context/     # React Context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   ├── App.jsx      # Main App component
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
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

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Secure file upload handling

## 🧪 Testing

```bash
# Backend tests (if configured)
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

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

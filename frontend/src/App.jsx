import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ConsultationProvider } from './context/ConsultationContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PetDashboard from './pages/PetDashboard';
import MedicalHistory from './pages/MedicalHistory';
import ChatbotPage from './pages/ChatbotPage';
import QuestionnairePage from './pages/QuestionnairePage';
import PetSelectorPage from './pages/PetSelectorPage';
import ImageUploadStep from './pages/ImageUploadStep';
import DiagnosisReportPage from './pages/DiagnosisReportPage';
import PetProfilePage from './pages/PetProfilePage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ConsultationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><PetDashboard /></ProtectedRoute>} />
              <Route path="/records" element={<ProtectedRoute><MedicalHistory /></ProtectedRoute>} />
              <Route path="/diagnosis" element={<PetSelectorPage />} />
              <Route path="/chat" element={<ChatbotPage />} />
              <Route path="/questionnaire" element={<QuestionnairePage />} />
              <Route path="/image-upload" element={<ImageUploadStep />} />
              <Route path="/report" element={<DiagnosisReportPage />} />
              <Route path="/pet/:id" element={<ProtectedRoute><PetProfilePage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </ConsultationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

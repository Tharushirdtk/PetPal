import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ConsultationProvider } from './context/ConsultationContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
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
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';

function RedirectIfAdmin({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (isAuthenticated && user?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function HomeRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LandingPage />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ConsultationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/login" element={<RedirectIfAdmin><LoginPage /></RedirectIfAdmin>} />
                <Route path="/register" element={<RedirectIfAdmin><RegisterPage /></RedirectIfAdmin>} />
                <Route path="/dashboard" element={<ProtectedRoute><PetDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/records" element={<ProtectedRoute><MedicalHistory /></ProtectedRoute>} />
                <Route path="/diagnosis" element={<RedirectIfAdmin><PetSelectorPage /></RedirectIfAdmin>} />
                <Route path="/chat" element={<RedirectIfAdmin><ChatbotPage /></RedirectIfAdmin>} />
                <Route path="/questionnaire" element={<RedirectIfAdmin><QuestionnairePage /></RedirectIfAdmin>} />
                <Route path="/image-upload" element={<RedirectIfAdmin><ImageUploadStep /></RedirectIfAdmin>} />
                <Route path="/report" element={<RedirectIfAdmin><DiagnosisReportPage /></RedirectIfAdmin>} />
                <Route path="/pet/:id" element={<ProtectedRoute><PetProfilePage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                <Route path="*" element={<HomeRoute />} />
              </Routes>
            </BrowserRouter>
          </ConsultationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

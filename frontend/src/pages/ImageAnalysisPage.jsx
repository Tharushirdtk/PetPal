import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Upload,
  Check,
  AlertCircle,
  X,
  Camera,
  Menu,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import LangToggle from '../components/LangToggle';
import { useImageUpload } from '../hooks/useImageUpload';
import { useConsultation } from '../context/ConsultationContext';
import ErrorAlert from '../components/ErrorAlert';

/* Inline Paw Icon (matches project convention) */
const PawIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#7C3AED]">
    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4.5-2c-.83 0-1.5.67-1.5 1.5S6.67 11 7.5 11 9 10.33 9 9.5 8.33 8 7.5 8zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5S17.33 8 16.5 8zM12 4c-.83 0-1.5.67-1.5 1.5S11.17 7 12 7s1.5-.67 1.5-1.5S12.83 4 12 4zm0 12c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4z" />
  </svg>
);

const ImageAnalysisPage = () => {
  const { t } = useLang();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const { consultationId, selectedPetId } = useConsultation();
  const { upload, uploading, imageAssetId, analysis, status, error, reset } = useImageUpload();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/dashboard', label: t('img_nav_dashboard') },
    { to: '/upload', label: t('img_nav_upload') },
    { to: '/history', label: t('img_nav_history') },
    { to: '/settings', label: t('img_nav_settings') },
  ];

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    try {
      await upload(file, { consultation_id: consultationId, pet_id: selectedPetId });
    } catch {
      // error is set inside the hook
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    try {
      await upload(file, { consultation_id: consultationId, pet_id: selectedPetId });
    } catch {
      // error is set inside the hook
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleCancel = () => {
    reset();
    setSelectedFile(null);
  };

  // Determine progress percentage based on status
  const getProgressPercent = () => {
    switch (status) {
      case 'uploading': return 25;
      case 'queued': return 40;
      case 'analyzing': return 72;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'uploading': return t('img_uploading');
      case 'queued': return 'Queued...';
      case 'analyzing': return t('img_processing');
      case 'complete': return t('img_completed');
      default: return '';
    }
  };

  /* ================================================
     Custom Navbar
     ================================================ */
  const Nav = () => (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 no-underline">
          <PawIcon />
          <span className="font-display font-bold text-lg text-gray-900">PetPal</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium no-underline transition-colors ${
                isActive(link.to)
                  ? 'text-[#7C3AED]'
                  : 'text-gray-600 hover:text-[#7C3AED]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LangToggle />
          <Link
            to="/upload"
            className="hidden sm:inline-flex items-center gap-2 bg-[#7C3AED] text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-[#6D28D9] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 no-underline"
          >
            <Upload className="w-4 h-4" />
            {t('img_upload_new')}
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-sm font-semibold cursor-pointer">
            S
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-gray-600 no-underline"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );

  /* ================================================
     Component Render
     ================================================ */
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Nav />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">
            {t('img_title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('img_subtitle')}</p>
        </div>

        {/* Error Alert */}
        {error && <div className="mt-4"><ErrorAlert message={error} onClose={reset} /></div>}

        {/* Upload Zone */}
        <div
          className="mt-6 border-2 border-dashed border-[#E5E7EB] rounded-2xl p-12 flex flex-col items-center justify-center hover:border-[#7C3AED] transition-colors cursor-pointer bg-white"
          onClick={handleBrowseClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="w-12 h-12 text-[#7C3AED]" />
          <p className="font-medium text-lg mt-4 text-gray-900">{t('img_drag')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('img_supports')}</p>
          <button
            className="bg-gray-900 text-white rounded-full px-6 py-2.5 font-semibold mt-4 hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}
          >
            {t('img_browse')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Active Analysis Card - shown when uploading or analyzing */}
        {(uploading || status) && status !== 'complete' && (
          <div className="mt-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left - Scan Preview */}
              <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl h-48 relative overflow-hidden">
                {/* AI Active Scan badge */}
                <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full absolute top-3 left-3 font-semibold z-10">
                  {t('img_ai_scan')}
                </span>

                {/* Simulated green scan line */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                  <div className="animate-pulse bg-green-400/30 h-0.5 w-full absolute" />
                  <div className="animate-pulse bg-green-400/50 h-px w-full absolute mt-1" />
                </div>

                {/* Placeholder pet silhouette */}
                <div className="flex items-center justify-center h-full">
                  <Camera className="w-16 h-16 text-amber-300/60" />
                </div>
              </div>

              {/* Right - Analysis Details */}
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-semibold text-lg text-gray-900">
                    {getStatusLabel()}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedFile?.name || 'image.jpg'}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 font-medium">
                        {getStatusLabel()}
                      </span>
                      <span className="text-xs font-semibold text-[#7C3AED]">{getProgressPercent()}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#7C3AED] h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${getProgressPercent()}%` }}
                      />
                    </div>
                  </div>

                  {/* Fun Fact */}
                  <div className="mt-4 flex items-start gap-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {t('img_fun_fact')}
                    </span>
                    <p className="text-sm text-gray-500">{t('img_fun_fact_text')}</p>
                  </div>
                </div>

                {/* Cancel link */}
                <button
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors mt-4 self-start cursor-pointer"
                  onClick={handleCancel}
                >
                  {t('img_cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Complete Card - shown when status is complete */}
        {status === 'complete' && analysis && (
          <div className="mt-8 bg-white rounded-2xl border border-green-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-gray-900">
                  {t('img_completed')}
                </h3>
                <p className="text-sm text-gray-400">{selectedFile?.name || 'image.jpg'}</p>
              </div>
            </div>

            {/* ML Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {analysis.top_label && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">Top Label</p>
                  <p className="text-sm font-semibold text-gray-900">{analysis.top_label}</p>
                </div>
              )}
              {analysis.top_confidence != null && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">Confidence</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {Math.round(analysis.top_confidence * 100)}%
                  </p>
                </div>
              )}
              {analysis.prediction_text && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">Prediction</p>
                  <p className="text-sm font-semibold text-gray-900">{analysis.prediction_text}</p>
                </div>
              )}
            </div>

            {/* Upload another button */}
            <button
              className="mt-4 text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer"
              onClick={() => { reset(); setSelectedFile(null); }}
            >
              Upload another image
            </button>
          </div>
        )}

        {/* Upload Queue - only show when no active upload */}
        {!uploading && !status && (
          <div className="mt-8">
            <h2 className="font-display font-semibold text-lg text-gray-900">
              {t('img_queue')}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {/* Empty state */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 col-span-full flex flex-col items-center justify-center py-8">
                <Upload className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No images in queue. Upload an image to get started.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-400 py-6 border-t border-[#E5E7EB]">
        {t('img_footer')}
      </footer>
    </div>
  );
};

export default ImageAnalysisPage;

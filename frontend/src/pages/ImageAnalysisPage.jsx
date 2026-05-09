import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Upload,
  Check,
  AlertCircle,
  AlertTriangle,
  X,
  Camera,
  Menu,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import LangToggle from '../components/LangToggle';
import { useImageUpload } from '../hooks/useImageUpload';
import { useConsultation } from '../context/ConsultationContext';
import ErrorAlert from '../components/ErrorAlert';
import petpalPaw from '../assets/petpal-icon.svg';

/* Inline Paw Icon (matches project convention) */
const PawIcon = () => (
  <img src={petpalPaw} alt="PetPal" className="w-7 h-7" />
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

  const getConfidenceStyle = (confidence) => {
    const pct = Math.round((confidence ?? 0) * 100);
    if (pct >= 60) return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', label: 'High', border: 'border-green-200 dark:border-green-800' };
    if (pct >= 35) return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', label: 'Moderate', border: 'border-amber-200 dark:border-amber-800' };
    return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: 'Low', border: 'border-red-200 dark:border-red-800' };
  };

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
    <nav className="bg-white dark:bg-gray-800 border-b border-[#E5E7EB] dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 no-underline">
          <PawIcon />
          <span className="font-display font-bold text-lg text-gray-900 dark:text-white">PetPal</span>
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
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#7C3AED]'
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
        <div className="md:hidden border-t border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 no-underline"
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
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Nav />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
            {t('img_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('img_subtitle')}</p>
        </div>

        {/* Error Alert */}
        {error && <div className="mt-4"><ErrorAlert message={error} onClose={reset} /></div>}

        {/* Upload Zone */}
        <div
          className="mt-6 border-2 border-dashed border-[#E5E7EB] dark:border-gray-700 rounded-2xl p-12 flex flex-col items-center justify-center hover:border-[#7C3AED] transition-colors cursor-pointer bg-white dark:bg-gray-800"
          onClick={handleBrowseClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="w-12 h-12 text-[#7C3AED]" />
          <p className="font-medium text-lg mt-4 text-gray-900 dark:text-white">{t('img_drag')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('img_supports')}</p>
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
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 shadow-sm p-6">
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
                  <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">
                    {getStatusLabel()}
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {selectedFile?.name || 'image.jpg'}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {getStatusLabel()}
                      </span>
                      <span className="text-xs font-semibold text-[#7C3AED]">{getProgressPercent()}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#7C3AED] h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${getProgressPercent()}%` }}
                      />
                    </div>
                  </div>

                  {/* Fun Fact */}
                  <div className="mt-4 flex items-start gap-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {t('img_fun_fact')}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('img_fun_fact_text')}</p>
                  </div>
                </div>

                {/* Cancel link */}
                <button
                  className="text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors mt-4 self-start cursor-pointer"
                  onClick={handleCancel}
                >
                  {t('img_cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Complete Card - shown when status is complete */}
        {status === 'complete' && analysis && (() => {
          const confStyle = getConfidenceStyle(analysis.top_confidence);
          const confPct = Math.round((analysis.top_confidence ?? 0) * 100);
          const isLowConfidence = confPct < 60;
          const top5 = analysis.raw_result_json?.top5 || analysis.top5;

          return (
            <div className={`mt-8 bg-white dark:bg-gray-800 rounded-2xl border ${confStyle.border} shadow-sm p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full ${confPct >= 60 ? 'bg-green-100' : confPct >= 35 ? 'bg-amber-100' : 'bg-red-100'} flex items-center justify-center`}>
                  {confPct >= 60
                    ? <Check className="w-5 h-5 text-green-600" />
                    : <AlertTriangle className={`w-5 h-5 ${confPct >= 35 ? 'text-amber-600' : 'text-red-600'}`} />
                  }
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">
                    {confPct >= 60
                      ? t('img_completed')
                      : (t('img_analysis_uncertain') || 'Analysis Complete — Low Confidence')
                    }
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500">{selectedFile?.name || 'image.jpg'}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#F5F3FF] to-white dark:from-purple-900/30 dark:to-gray-800/50 border-2 border-[#7C3AED]/20 p-5 shadow-sm">
                <span className="inline-flex items-center gap-1.5 bg-[#7C3AED] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <Check className="w-3 h-3" />
                  {t('img_suspected_diagnosis') || 'Suspected Diagnosis'}
                </span>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mt-3">
                  {analysis.disease_name}
                </p>
              </div>

              {/* Low confidence warning */}
              {isLowConfidence && (
                <div className={`mt-4 flex items-start gap-3 ${confPct >= 35 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'} rounded-lg p-3`}>
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${confPct >= 35 ? 'text-amber-500' : 'text-red-500'}`} />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('img_low_confidence_warning') || 'Our AI model is not fully confident about this prediction. The AI veterinarian will also consider your questionnaire answers for a more accurate assessment.'}
                  </p>
                </div>
              )}

              {/* Top alternative predictions */}
              {top5 && top5.length > 1 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                    {t('img_other_possibilities') || 'Other possibilities'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {top5.slice(1, 4).map((alt, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1.5 rounded-full"
                      >
                        {alt.label} <span className="text-gray-400 dark:text-gray-500">{alt.confidence}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload another button */}
              <button
                className="mt-4 text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer"
                onClick={() => { reset(); setSelectedFile(null); }}
              >
                Upload another image
              </button>
            </div>
          );
        })()}

        {/* Upload Queue - only show when no active upload */}
        {!uploading && !status && (
          <div className="mt-8">
            <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white">
              {t('img_queue')}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {/* Empty state */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 col-span-full flex flex-col items-center justify-center py-8">
                <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No images in queue. Upload an image to get started.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-400 dark:text-gray-500 py-6 border-t border-[#E5E7EB] dark:border-gray-700">
        {t('img_footer')}
      </footer>
    </div>
  );
};

export default ImageAnalysisPage;

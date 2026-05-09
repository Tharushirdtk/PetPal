import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Check,
  Camera,
  ArrowRight,
  SkipForward,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useConsultation } from '../context/ConsultationContext';
import { useImageUpload } from '../hooks/useImageUpload';
import Navbar from '../components/Navbar';
import ErrorAlert from '../components/ErrorAlert';

const ImageUploadStep = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const { consultationId, selectedPetId } = useConsultation();
  const { upload, uploading, analysis, status, error, reset } = useImageUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const getConfidenceStyle = (confidence) => {
    const pct = Math.round((confidence ?? 0) * 100);
    if (pct >= 60) return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', label: 'High', border: 'border-green-200 dark:border-green-800' };
    if (pct >= 35) return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', label: 'Moderate', border: 'border-amber-200 dark:border-amber-800' };
    return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: 'Low', border: 'border-red-200 dark:border-red-800' };
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    try {
      await upload(file, { consultation_id: consultationId, pet_id: selectedPetId });
    } catch {
      /* error is set inside the hook */
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    try {
      await upload(file, { consultation_id: consultationId, pet_id: selectedPetId });
    } catch {
      /* error is set inside the hook */
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const getProgressPercent = () => {
    switch (status) {
      case 'uploading': return 25;
      case 'queued': return 40;
      case 'analyzing': return 72;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const goToChat = () => navigate('/chat');

  const isProcessing = uploading || (status && status !== 'complete' && status !== 'error');
  const isComplete = status === 'complete' && analysis;

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
              <Check size={16} />
            </div>
            <span className="text-sm font-medium text-green-600">{t('quest_title') || 'Questionnaire'}</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-sm font-bold">
              2
            </div>
            <span className="text-sm font-medium text-[#7C3AED]">{t('img_step_title') || 'Photo Upload'}</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-sm font-bold">
              3
            </div>
            <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{t('chat_title') || 'AI Chat'}</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F3FF] flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('img_step_heading') || 'Upload a Photo of Your Pet'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
            {t('img_step_desc') || 'Our AI can analyze photos of skin conditions, injuries, or unusual symptoms for a more accurate diagnosis. This step is optional.'}
          </p>
        </div>

        {/* Error */}
        {error && <div className="mb-6"><ErrorAlert message={error} onClose={reset} /></div>}

        {/* Upload zone — only show when no active upload/result */}
        {!isProcessing && !isComplete && (
          <div
            className="border-2 border-dashed border-[#7C3AED]/40 rounded-2xl p-12 flex flex-col items-center justify-center hover:border-[#7C3AED] hover:bg-[#F5F3FF]/50 transition-all cursor-pointer bg-white dark:bg-gray-800"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="w-16 h-16 rounded-full bg-[#F5F3FF] flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <p className="font-medium text-lg text-gray-900 dark:text-white">{t('img_drag') || 'Drag & Drop Photos Here'}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('img_supports') || 'Supports JPG, PNG, HEIC up to 15MB'}</p>
            <button
              className="bg-[#7C3AED] text-white rounded-full px-6 py-2.5 font-semibold mt-4 hover:bg-[#6D28D9] transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              {t('img_browse') || 'Browse Files'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full absolute top-1 left-1 font-semibold z-10">
                  {t('img_ai_scan') || 'AI ACTIVE SCAN'}
                </span>
                <Camera className="w-8 h-8 text-amber-300/60" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{t('img_analyzing') || 'Analyzing Image'}...</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">{selectedFile?.name || 'image.jpg'}</p>
              </div>
              <span className="text-lg font-bold text-[#7C3AED]">{getProgressPercent()}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#7C3AED] h-2.5 rounded-full transition-all duration-1000"
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>
            <div className="mt-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                {t('img_fun_fact') || 'Fun Fact'}
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('img_fun_fact_text') || "Did you know? A dog's nose print is unique, much like a human fingerprint!"}</p>
            </div>
          </div>
        )}

        {/* Analysis complete */}
        {isComplete && (() => {
          const confStyle = getConfidenceStyle(analysis.top_confidence);
          const confPct = Math.round((analysis.top_confidence ?? 0) * 100);
          const isLowConfidence = confPct < 60;
          const top5 = analysis.raw_result_json?.top5 || analysis.top5;

          return (
            <div className={`bg-white dark:bg-gray-800 rounded-2xl border ${confStyle.border} shadow-sm p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full ${confPct >= 60 ? 'bg-green-100' : confPct >= 35 ? 'bg-amber-100' : 'bg-red-100'} flex items-center justify-center`}>
                  {confPct >= 60
                    ? <Check className="w-5 h-5 text-green-600" />
                    : <AlertTriangle className={`w-5 h-5 ${confPct >= 35 ? 'text-amber-600' : 'text-red-600'}`} />
                  }
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {confPct >= 60
                      ? (t('img_completed') || 'Analysis Complete')
                      : (t('img_analysis_uncertain') || 'Analysis Complete — Low Confidence')
                    }
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500">{selectedFile?.name}</p>
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

              <button
                className="mt-4 text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer"
                onClick={() => { reset(); setSelectedFile(null); }}
              >
                {t('img_upload_another') || 'Upload another image'}
              </button>
            </div>
          );
        })()}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={goToChat}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <SkipForward size={16} />
            {t('img_skip') || 'Skip, go to chat'}
          </button>

          <button
            onClick={goToChat}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {t('img_continue_chat') || 'Continue to AI Chat'}
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
          {t('img_step_note') || 'Image analysis results will automatically be included in your AI consultation for a more accurate diagnosis.'}
        </p>
      </main>
    </div>
  );
};

export default ImageUploadStep;

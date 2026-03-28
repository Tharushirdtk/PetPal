import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Check,
  Camera,
  ArrowRight,
  SkipForward,
  AlertCircle,
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
    <div className="min-h-screen bg-[#F9FAFB]">
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
          <div className="flex-1 h-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-sm font-bold">
              2
            </div>
            <span className="text-sm font-medium text-[#7C3AED]">{t('img_step_title') || 'Photo Upload'}</span>
          </div>
          <div className="flex-1 h-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">
              3
            </div>
            <span className="text-sm font-medium text-gray-400">{t('chat_title') || 'AI Chat'}</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F3FF] flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('img_step_heading') || 'Upload a Photo of Your Pet'}
          </h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {t('img_step_desc') || 'Our AI can analyze photos of skin conditions, injuries, or unusual symptoms for a more accurate diagnosis. This step is optional.'}
          </p>
        </div>

        {/* Error */}
        {error && <div className="mb-6"><ErrorAlert message={error} onClose={reset} /></div>}

        {/* Upload zone — only show when no active upload/result */}
        {!isProcessing && !isComplete && (
          <div
            className="border-2 border-dashed border-[#7C3AED]/40 rounded-2xl p-12 flex flex-col items-center justify-center hover:border-[#7C3AED] hover:bg-[#F5F3FF]/50 transition-all cursor-pointer bg-white"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="w-16 h-16 rounded-full bg-[#F5F3FF] flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <p className="font-medium text-lg text-gray-900">{t('img_drag') || 'Drag & Drop Photos Here'}</p>
            <p className="text-sm text-gray-400 mt-1">{t('img_supports') || 'Supports JPG, PNG, HEIC up to 15MB'}</p>
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
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full absolute top-1 left-1 font-semibold z-10">
                  {t('img_ai_scan') || 'AI ACTIVE SCAN'}
                </span>
                <Camera className="w-8 h-8 text-amber-300/60" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{t('img_analyzing') || 'Analyzing Image'}...</h3>
                <p className="text-sm text-gray-400">{selectedFile?.name || 'image.jpg'}</p>
              </div>
              <span className="text-lg font-bold text-[#7C3AED]">{getProgressPercent()}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#7C3AED] h-2.5 rounded-full transition-all duration-1000"
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>
            <div className="mt-4 flex items-start gap-2 bg-blue-50 rounded-lg p-3">
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                {t('img_fun_fact') || 'Fun Fact'}
              </span>
              <p className="text-sm text-gray-500">{t('img_fun_fact_text') || "Did you know? A dog's nose print is unique, much like a human fingerprint!"}</p>
            </div>
          </div>
        )}

        {/* Analysis complete */}
        {isComplete && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{t('img_completed') || 'Analysis Complete'}</h3>
                <p className="text-sm text-gray-400">{selectedFile?.name}</p>
              </div>
            </div>
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
            <button
              className="mt-4 text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer"
              onClick={() => { reset(); setSelectedFile(null); }}
            >
              {t('img_upload_another') || 'Upload another image'}
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={goToChat}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
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
        <p className="text-xs text-gray-400 text-center mt-4">
          {t('img_step_note') || 'Image analysis results will automatically be included in your AI consultation for a more accurate diagnosis.'}
        </p>
      </main>
    </div>
  );
};

export default ImageUploadStep;

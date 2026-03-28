import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Camera,
  Plus,
  Calendar,
  Activity,
  Shield,
  ArrowRight,
  MessageCircle,
  AlertTriangle,
  ImagePlus,
  X,
  Loader2,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useConsultation } from '../context/ConsultationContext';
import { useAuth } from '../context/AuthContext';
import { sendMessage, getChatHistory } from '../api/chat';
import { getConsultationHistory } from '../api/consultation';
import { useStartConsultation } from '../hooks/useConsultation';
import { useImageUpload } from '../hooks/useImageUpload';
import StatusBadge from '../components/StatusBadge';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const ChatbotPage = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const { consultationId, conversationId } = useConsultation();
  const { user } = useAuth();
  const { start: startNewConsultation } = useStartConsultation();

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatHistoryList, setChatHistoryList] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [noConsultation, setNoConsultation] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState(null);

  /* ── Image upload state ── */
  const { upload, uploading, analysis, status: imgStatus, error: imgError, reset: resetImg } = useImageUpload();
  const [selectedImages, setSelectedImages] = useState([]); // { file, preview }[]
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const welcomeSentRef = useRef(false);

  /* ── Auto-scroll to bottom when messages change ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ── Load chat history on mount ── */
  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      if (!consultationId) {
        setNoConsultation(true);
        setLoadingHistory(false);
        return;
      }

      try {
        setLoadingHistory(true);
        const res = await getChatHistory(consultationId);
        if (cancelled) return;
        const history = res.data?.messages || res.data || [];
        const mapped = history.map((msg, idx) => ({
          id: msg.id || idx,
          role: msg.sender_type === 'ai' || msg.role === 'assistant' || msg.role === 'ai' ? 'ai' : 'user',
          text: msg.content || msg.message || msg.text || '',
          time: msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
        }));
        setMessages(mapped);
      } catch (err) {
        if (!cancelled) {
          if (err?.response?.status !== 404 && err?.status !== 404) {
            setError(err?.response?.data?.message || err?.error || 'Failed to load chat history.');
          }
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, [consultationId]);

  /* ── Auto-send welcome message when chat first loads with no messages ── */
  useEffect(() => {
    if (welcomeSentRef.current) return;
    if (noConsultation || loadingHistory || !consultationId || !conversationId) return;
    if (messages.length > 0) return;

    welcomeSentRef.current = true;

    const sendWelcome = async () => {
      setIsTyping(true);
      try {
        const res = await sendMessage({
          conversation_id: conversationId,
          message: 'Hello, I just completed the questionnaire. Please review my answers and help me understand what might be going on with my pet.',
          consultation_id: consultationId,
        });
        const data = res.data;

        const userMsg = {
          id: Date.now(),
          role: 'user',
          text: 'Hello, I just completed the questionnaire. Please review my answers and help me understand what might be going on with my pet.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const aiMsg = {
          id: Date.now() + 1,
          role: 'ai',
          text: data.reply || data.message || data.content || '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([userMsg, aiMsg]);

        if (data.is_emergency) setShowEmergency(true);
        if (data.is_final && data.diagnosis_data) {
          setDiagnosisData({
            condition: data.diagnosis_data.primary_label || 'Diagnosis Ready',
            description: data.diagnosis_data.explanation || '',
            confidence: data.diagnosis_data.confidence ? Math.round(data.diagnosis_data.confidence * 100) : null,
            reportId: data.diagnosis_id || null,
          });
        }
      } catch {
        /* Non-critical — user can still type */
      } finally {
        setIsTyping(false);
      }
    };

    sendWelcome();
  }, [noConsultation, loadingHistory, consultationId, conversationId, messages.length]);

  /* ── Load consultation history for sidebar ── */
  useEffect(() => {
    let cancelled = false;
    const loadConsultationHistory = async () => {
      try {
        const res = await getConsultationHistory();
        if (cancelled) return;
        const list = res.data?.consultations || res.data || [];
        setChatHistoryList(
          list.map((item) => ({
            id: item.id,
            title: item.title || item.pet_name || `Consultation #${item.id}`,
            date: item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : '',
            active: item.id === consultationId,
          }))
        );
      } catch {
        /* Sidebar history is non-critical — fail silently */
      }
    };
    loadConsultationHistory();
    return () => { cancelled = true; };
  }, [consultationId]);

  /* ── Send message ── */
  const handleSend = async () => {
    const text = inputText.trim();
    if ((!text && selectedImages.length === 0) || isTyping) return;

    /* Upload images first if any */
    if (selectedImages.length > 0) {
      for (const img of selectedImages) {
        try {
          await upload(img.file, { consultation_id: consultationId });
        } catch {
          /* continue — error shown via imgError */
        }
      }
      setSelectedImages([]);
    }

    const msgText = text || '(Uploaded image for analysis)';

    /* Add user message to local state immediately */
    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setError(null);

    try {
      const res = await sendMessage({
        conversation_id: conversationId,
        message: msgText,
        consultation_id: consultationId,
      });
      const data = res.data;

      /* Add AI response to local state */
      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: data.reply || data.message || data.content || '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);

      /* Handle emergency */
      if (data.is_emergency) {
        setShowEmergency(true);
      }

      /* Handle final diagnosis */
      if (data.is_final && data.diagnosis_data) {
        setDiagnosisData({
          condition: data.diagnosis_data.primary_label || 'Diagnosis Ready',
          description: data.diagnosis_data.explanation || '',
          confidence: data.diagnosis_data.confidence ? Math.round(data.diagnosis_data.confidence * 100) : null,
          reportId: data.diagnosis_id || null,
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.error || 'Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  /* ── Handle Enter key ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Image selection ── */
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setSelectedImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  /* ── Start new consultation ── */
  const handleNewConsultation = async () => {
    try {
      await startNewConsultation();
      navigate('/questionnaire');
    } catch {
      navigate('/questionnaire');
    }
  };

  /* ───────── Left Sidebar ───────── */
  const LeftSidebar = () => (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E5E7EB] h-screen overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="relative">
          <span className="text-xl font-bold text-[#7C3AED]">PetPal</span>
          <span className="absolute -right-2 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
        </div>
      </div>

      {/* New Consultation button */}
      <div className="px-4">
        <button
          onClick={handleNewConsultation}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-[#7C3AED] text-white text-sm font-medium py-2.5 hover:bg-[#6D28D9] transition-colors"
        >
          <Plus size={16} />
          {t('chat_new_consult')}
        </button>
      </div>

      {/* History label */}
      <p className="px-5 mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {t('chat_history')}
      </p>

      {/* Chat history items */}
      <nav className="mt-2 flex-1 px-2 space-y-1">
        {chatHistoryList.length === 0 && (
          <p className="px-3 py-3 text-sm text-gray-400">{t('chat_no_history') || 'No previous consultations.'}</p>
        )}
        {chatHistoryList.map((item) => (
          <button
            key={item.id}
            className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors ${
              item.active
                ? 'bg-[#F5F3FF] text-[#7C3AED] border-l-2 border-[#7C3AED] font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <p className={`truncate ${item.active ? 'text-[#7C3AED]' : 'text-gray-800'}`}>
              {item.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
          </button>
        ))}
      </nav>
    </aside>
  );

  /* ───────── Diagnosis Card ───────── */
  const DiagnosisCard = ({ data }) => (
    <div className="max-w-lg ml-12 mt-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      {/* Badges */}
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
          {t('chat_potential_match')}
        </span>
        {data.confidence && (
        <span className="text-sm font-semibold text-[#7C3AED]">
          {data.confidence}% {t('chat_confidence')}
        </span>
        )}
      </div>

      {/* Condition */}
      <h4 className="text-base font-bold text-gray-900 mb-1">
        {data.condition}
      </h4>
      {data.description && (
      <p className="text-sm text-gray-500 mb-4">
        {data.description}
      </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => data.reportId ? navigate(`/report/${data.reportId}`) : navigate('/report')}
          className="px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-colors"
        >
          {t('chat_view_clinical')}
        </button>
        <button
          onClick={() => setDiagnosisData(null)}
          className="px-4 py-2 rounded-lg text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
        >
          {t('chat_not_this')} &#x2715;
        </button>
      </div>
    </div>
  );

  /* ───────── Center Chat Panel ───────── */
  const CenterChat = () => (
    <section className="flex-1 flex flex-col bg-[#F9FAFB] h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-3 bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="h-9 w-9 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-sm font-bold">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            PetPal AI
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
          </p>
          <p className="text-xs text-gray-400">
            {consultationId ? `Consultation #${consultationId}` : t('chat_no_active') || 'No active consultation'}
          </p>
        </div>
      </div>

      {/* Emergency Warning */}
      {showEmergency && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">{t('chat_emergency_title') || 'Emergency Detected'}</p>
            <p className="text-xs text-red-600">{t('chat_emergency_desc') || 'Please contact a veterinarian immediately. This situation may require urgent attention.'}</p>
          </div>
          <button onClick={() => setShowEmergency(false)} className="text-red-500 hover:text-red-700 text-lg font-bold">&times;</button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4">
          <ErrorAlert message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* No consultation message */}
      {noConsultation && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('chat_no_consultation_title') || 'No Active Consultation'}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('chat_no_consultation_desc') || 'Please start a new consultation by completing the questionnaire first.'}</p>
            <button
              onClick={handleNewConsultation}
              className="px-6 py-3 rounded-full bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-colors"
            >
              {t('chat_start_questionnaire') || 'Start Questionnaire'}
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!noConsultation && loadingHistory && <LoadingSpinner />}

      {/* Messages area */}
      {!noConsultation && !loadingHistory && (
      <>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Date divider */}
        {messages.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400">{t('chat_today')}</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>
        )}

        {/* Empty state — while waiting for auto-welcome */}
        {messages.length === 0 && !isTyping && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">{t('chat_empty') || 'Start a conversation...'}</p>
          </div>
        )}

        {/* Render messages */}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'ai' ? (
              /* AI message */
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#F5F3FF] flex items-center justify-center">
                  <span className="text-[#7C3AED] text-sm">&#128062;</span>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm max-w-lg">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-xs text-gray-400 mt-2">{msg.time}</p>
                </div>
              </div>
            ) : (
              /* User message */
              <div className="flex justify-end">
                <div className="bg-[#7C3AED] text-white rounded-2xl p-4 max-w-lg">
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className="text-xs text-purple-200 mt-2">{msg.time}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#F5F3FF] flex items-center justify-center">
              <span className="text-[#7C3AED] text-sm">&#128062;</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm max-w-lg">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Diagnosis card */}
        {diagnosisData && <DiagnosisCard data={diagnosisData} />}

        {/* Important note */}
        {messages.length > 0 && (
          <p className="text-sm italic text-[#7C3AED] mt-4">{t('chat_important_note')}</p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom area */}
      <div className="bg-[#F9FAFB] px-6 pb-5">
        {/* Quick action pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors">
            <Activity size={14} />
            {t('chat_check_symptoms')}
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors">
            <Shield size={14} />
            {t('chat_past_reports')}
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors">
            <Calendar size={14} />
            {t('chat_book_vet')}
          </button>
        </div>

        {/* Image preview strip */}
        {selectedImages.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.preview}
                  alt={`Selected ${idx + 1}`}
                  className="h-16 w-16 object-cover rounded-lg border-2 border-[#7C3AED]"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload status */}
        {(uploading || imgStatus === 'queued' || imgStatus === 'processing') && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
            <Loader2 size={16} className="text-[#7C3AED] animate-spin" />
            <span className="text-sm text-[#7C3AED] font-medium">
              {uploading ? t('chat_img_uploading') || 'Uploading image...' : t('chat_img_analyzing') || 'Analyzing image...'}
            </span>
          </div>
        )}

        {/* Image upload error */}
        {imgError && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
            <span className="text-sm text-red-600">{imgError}</span>
            <button onClick={resetImg} className="text-xs text-red-500 underline">{t('common_close')}</button>
          </div>
        )}

        {/* Image analysis result notification */}
        {analysis && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm text-green-700">{t('chat_img_complete') || 'Image analysis complete! The AI can now see your image results.'}</span>
            <button onClick={resetImg} className="text-xs text-green-600 underline">{t('common_close')}</button>
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
          {/* Highlighted image upload button  */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white hover:from-[#6D28D9] hover:to-[#9333EA] transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex-shrink-0"
            title={t('chat_img_upload_title') || 'Upload pet photo for AI analysis (optional)'}
          >
            <ImagePlus size={18} />
            {/* Pulsing dot to draw attention */}
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat_placeholder')}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
            disabled={isTyping}
          />

          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && selectedImages.length === 0) || isTyping}
            className="h-9 w-9 rounded-full bg-[#7C3AED] flex items-center justify-center text-white hover:bg-[#6D28D9] transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Optional hint under input */}
        <p className="text-xs text-gray-400 mt-2 text-center">
          {t('chat_img_hint') || 'Upload a photo of your pet\'s condition for AI-powered visual analysis (optional)'}
        </p>
      </div>
      </>
      )}
    </section>
  );

  /* ───────── Right Panel ───────── */
  const RightPanel = () => (
    <aside className="hidden xl:flex flex-col w-72 bg-white border-l border-[#E5E7EB] h-screen overflow-y-auto p-4">
      {/* Pet photo placeholder */}
      <div className="h-44 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-5xl mb-4">
        &#128049;
      </div>

      {/* Pet info */}
      <h3 className="text-lg font-bold text-gray-900">Whiskers</h3>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-0.5">
        DOMESTIC SHORTHAIR
      </p>
      <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium w-fit">
        2 years
      </span>

      <div className="mt-3">
        <StatusBadge status="healthy" />
      </div>

      {/* Medical Snapshot */}
      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {t('chat_medical_snapshot')}
      </p>

      <div className="mt-3 space-y-3">
        {/* Weight */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('chat_weight')}</span>
          <span className="text-sm font-semibold text-gray-900">4.2 kg</span>
        </div>

        {/* Vaccines */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('chat_vaccines')}</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            {t('chat_current')}
          </span>
        </div>
      </div>

      {/* Next Appointment */}
      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {t('chat_next_appointment')}
      </p>

      <div className="mt-3 bg-[#F9FAFB] rounded-xl p-4">
        <div className="flex items-start gap-3">
          {/* Date circle */}
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[#F5F3FF] flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-[#7C3AED] leading-none">NOV</span>
            <span className="text-lg font-bold text-[#7C3AED] leading-none">20</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Annual Check-up</p>
            <p className="text-xs text-gray-500 mt-0.5">Dr. Sarah Jenkins</p>
            <p className="text-xs text-gray-400 mt-0.5">10:00 AM</p>
          </div>
        </div>

        <button className="mt-3 w-full text-center text-sm font-medium text-[#7C3AED] hover:text-[#6D28D9] transition-colors">
          {t('chat_reschedule')}
        </button>
      </div>
    </aside>
  );

  /* ───────── Page Layout ───────── */
  return (
    <div className="flex h-screen overflow-hidden">
      <LeftSidebar />
      <CenterChat />
      <RightPanel />
    </div>
  );
};

export default ChatbotPage;

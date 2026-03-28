import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar,
  Activity,
  Shield,
  ArrowRight,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useConsultation } from '../context/ConsultationContext';
import { useAuth } from '../context/AuthContext';
import { sendMessage, getChatHistory } from '../api/chat';
import { getConsultationHistory } from '../api/consultation';
import { useStartConsultation } from '../hooks/useConsultation';
import StatusBadge from '../components/StatusBadge';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const ChatbotPage = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const { consultationId, conversationId, petInfo } = useConsultation();
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

  const messagesEndRef = useRef(null);
  const welcomeSentRef = useRef(false);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ── Reset state when consultation changes ── */
  useEffect(() => {
    setMessages([]);
    setError(null);
    setShowEmergency(false);
    setDiagnosisData(null);
    welcomeSentRef.current = false;
  }, [consultationId]);

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
            setError('Failed to load chat history.');
          }
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, [consultationId]);

  /* ── Auto-send welcome message on first load with 0 messages ── */
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
        setError('Unable to connect to PetPal AI right now. Please try again in a moment.');
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
            date: item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
            active: item.id === consultationId,
          }))
        );
      } catch { /* non-critical */ }
    };
    loadConsultationHistory();
    return () => { cancelled = true; };
  }, [consultationId]);

  /* ── Send message ── */
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setError(null);

    try {
      const res = await sendMessage({
        conversation_id: conversationId,
        message: text,
        consultation_id: consultationId,
      });
      const data = res.data;
      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: data.reply || data.message || data.content || '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
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
      setError('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConsultation = async () => {
    try {
      await startNewConsultation();
      navigate('/questionnaire');
    } catch {
      navigate('/questionnaire');
    }
  };

  /* ── Pet info for right sidebar (from questionnaire context) ── */
  const petName = petInfo?.breed || petInfo?.type || 'Your Pet';
  const petType = petInfo?.type || '';
  const petBreed = petInfo?.breed || 'Unknown Breed';
  const petAge = petInfo?.age || '?';
  const petGender = petInfo?.gender || '';
  const petVaccinated = petInfo?.vaccinated;
  const petEmoji = petType === 'cat' ? '\u{1F431}' : petType === 'dog' ? '\u{1F436}' : '\u{1F43E}';

  /* ───────── RENDER ───────── */
  return (
    <div className="flex h-screen overflow-hidden">

      {/* ═══════ LEFT SIDEBAR ═══════ */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E5E7EB] h-screen overflow-y-auto">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="relative">
            <span className="text-xl font-bold text-[#7C3AED]">PetPal</span>
            <span className="absolute -right-2 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
          </div>
        </div>

        <div className="px-4">
          <button
            onClick={handleNewConsultation}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#7C3AED] text-white text-sm font-medium py-2.5 hover:bg-[#6D28D9] transition-colors"
          >
            <Plus size={16} />
            {t('chat_new_consult')}
          </button>
        </div>

        <p className="px-5 mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('chat_history')}
        </p>

        <nav className="mt-2 flex-1 px-2 space-y-1">
          {chatHistoryList.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-400">{t('chat_no_history') || 'No consultation history yet'}</p>
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

      {/* ═══════ CENTER CHAT ═══════ */}
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
              <p className="text-xs text-red-600">{t('chat_emergency_desc') || 'Please contact a veterinarian immediately.'}</p>
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

        {/* No consultation placeholder */}
        {noConsultation && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('chat_no_consultation_title') || 'No Active Consultation'}</h3>
              <p className="text-sm text-gray-500 mb-6">{t('chat_no_consultation_desc') || 'Start a new consultation by completing the questionnaire first.'}</p>
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

        {/* Messages + input */}
        {!noConsultation && !loadingHistory && (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400">{t('chat_today')}</span>
                <span className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {messages.length === 0 && !isTyping && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">{t('chat_empty') || 'Start a conversation...'}</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'ai' ? (
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
            {diagnosisData && (
              <div className="max-w-lg ml-12 mt-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                    {t('chat_potential_match')}
                  </span>
                  {diagnosisData.confidence && (
                    <span className="text-sm font-semibold text-[#7C3AED]">
                      {diagnosisData.confidence}% {t('chat_confidence')}
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-1">{diagnosisData.condition}</h4>
                {diagnosisData.description && <p className="text-sm text-gray-500 mb-4">{diagnosisData.description}</p>}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => diagnosisData.reportId ? navigate(`/report/${diagnosisData.reportId}`) : navigate('/report')}
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
            )}

            {messages.some((m) => m.role === 'ai') && (
              <p className="text-sm italic text-[#7C3AED] mt-4">{t('chat_important_note')}</p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input area */}
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

            {/* Input bar */}
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
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
                disabled={!inputText.trim() || isTyping}
                className="h-9 w-9 rounded-full bg-[#7C3AED] flex items-center justify-center text-white hover:bg-[#6D28D9] transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
        )}
      </section>

      {/* ═══════ RIGHT PANEL — dynamic pet info ═══════ */}
      <aside className="hidden xl:flex flex-col w-72 bg-white border-l border-[#E5E7EB] h-screen overflow-y-auto p-4">
        {/* Pet avatar */}
        <div className="h-44 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-5xl mb-4">
          {petEmoji}
        </div>

        {/* Pet info from questionnaire */}
        <h3 className="text-lg font-bold text-gray-900">{petName}</h3>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-0.5">
          {petBreed.toUpperCase()}
        </p>
        <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium w-fit">
          {petAge} {petAge === '1' ? 'year' : 'years'}
        </span>

        {petGender && (
          <span className="inline-flex items-center gap-1 mt-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium w-fit capitalize">
            {petGender}
          </span>
        )}

        <div className="mt-3">
          <StatusBadge status={petInfo ? 'pending' : 'healthy'} />
        </div>

        {/* Medical Snapshot */}
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('chat_medical_snapshot')}
        </p>

        <div className="mt-3 space-y-3">
          {/* Vaccines */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('chat_vaccines')}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              petVaccinated === 'yes'
                ? 'bg-green-50 text-green-700 border-green-200'
                : petVaccinated === 'no'
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              {petVaccinated === 'yes' ? (t('chat_current') || 'CURRENT')
                : petVaccinated === 'no' ? 'NOT CURRENT'
                : 'UNKNOWN'}
            </span>
          </div>

          {/* Neutered */}
          {petInfo?.neutered && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('chat_neutered') || 'Neutered'}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                petInfo.neutered === 'yes'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                {petInfo.neutered === 'yes' ? 'YES' : 'NO'}
              </span>
            </div>
          )}
        </div>

        {/* Consultation info */}
        {consultationId && (
        <>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t('chat_consultation_info') || 'CONSULTATION'}
          </p>
          <div className="mt-3 bg-[#F9FAFB] rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900">Consultation #{consultationId}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
          </div>
        </>
        )}
      </aside>
    </div>
  );
};

export default ChatbotPage;

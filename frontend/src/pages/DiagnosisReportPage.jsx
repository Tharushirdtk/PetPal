import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Share2,
  CheckCircle,
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  PawPrint,
  Home,
  FileText,
  Clock,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Thermometer,
  Loader2,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useConsultation } from '../context/ConsultationContext';
import { getDiagnosis } from '../api/diagnosis';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

/* ── helpers ─────────────────────────────────────────── */
const scoreColor = (pct) =>
  pct >= 75 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';

const scoreLabel = (pct, t) =>
  pct >= 75 ? t('report_score_high') : pct >= 50 ? t('report_score_mid') : t('report_score_low');

/* ═══════════════════════════════════════════════════════ */
const DiagnosisReportPage = () => {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const { consultationId: ctxConsultationId, petInfo, clearSession } = useConsultation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const [diagnosis, setDiagnosis] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const consultationId = ctxConsultationId || searchParams.get('consultation_id');

  useEffect(() => {
    if (!consultationId) {
      setError('No consultation ID found. Please start a consultation first.');
      setLoading(false);
      return;
    }

    const fetchDiagnosis = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getDiagnosis(consultationId);
        setDiagnosis(res.data.diagnosis || res.data);
        setSymptoms(res.data.symptoms || []);
      } catch (err) {
        setError(err.error || 'Failed to load diagnosis report.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosis();
  }, [consultationId]);

  /* ── derived ──────────────────────────────────────── */
  const confidencePercent = diagnosis?.confidence
    ? Math.round(diagnosis.confidence * 100)
    : 0;

  const observations = [];
  if (diagnosis?.severity_flags?.length > 0) {
    diagnosis.severity_flags.forEach((flag) => {
      observations.push({
        title: typeof flag === 'string' ? flag : flag.label || flag.title || '',
        desc: typeof flag === 'string' ? '' : flag.description || flag.desc || '',
      });
    });
  }
  if (diagnosis?.secondary_labels?.length > 0) {
    diagnosis.secondary_labels.forEach((label) => {
      observations.push({
        title: typeof label === 'string' ? label : label.label || label.name || '',
        desc: typeof label === 'string' ? '' : label.description || '',
      });
    });
  }
  if (observations.length === 0 && diagnosis?.explanation) {
    observations.push({ title: diagnosis.primary_label || 'Analysis', desc: diagnosis.explanation });
  }

  /* split recommended actions into do / don't */
  const dosAndDonts = { dos: [], donts: [] };
  if (diagnosis?.recommended_actions?.length > 0) {
    diagnosis.recommended_actions.forEach((action) => {
      const text = typeof action === 'string' ? action : action.text || action.description || '';
      const lower = text.toLowerCase();
      if (lower.startsWith('avoid') || lower.startsWith("don't") || lower.startsWith('do not') || lower.startsWith('never') || lower.startsWith('stop')) {
        dosAndDonts.donts.push(text);
      } else {
        dosAndDonts.dos.push(text);
      }
    });
  }
  // If nothing fell into don'ts, split evenly for better visual balance
  if (dosAndDonts.donts.length === 0 && dosAndDonts.dos.length > 2) {
    // keep all in "dos" — we'll still show the section with a friendly note
  }

  /* ── handlers ─────────────────────────────────────── */
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const el = reportRef.current;
      // hide action buttons during capture
      const hiddenEls = el.querySelectorAll('[data-no-pdf]');
      hiddenEls.forEach((e) => (e.style.display = 'none'));

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `PetPal_Report_${diagnosis?.primary_label || 'Diagnosis'}_${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(el)
        .save();

      hiddenEls.forEach((e) => (e.style.display = ''));
    } catch {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `PetPal – ${diagnosis?.primary_label || 'Report'}`, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewDiagnosis = () => { clearSession(); navigate('/diagnosis'); };

  const timelineSteps = [
    { label: t('report_quest_complete'), icon: ClipboardList },
    { label: t('report_image_uploads'), icon: FileText },
    { label: t('report_analysis_fin'), icon: ShieldCheck },
  ];

  /* ── loading / error ─────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-gray-900">
        <Navbar variant="default" />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-gray-900">
        <Navbar variant="default" />
        <div className="max-w-2xl mx-auto px-6 py-12 w-full">
          <ErrorAlert message={error} onClose={() => setError(null)} />
          <div className="mt-6 flex justify-center">
            <button onClick={() => navigate('/diagnosis')} className="inline-flex items-center gap-2 bg-[#7C3AED] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer">
              <Stethoscope className="w-4 h-4" />
              {t('report_start_new')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-gray-900" ref={reportRef}>
      <Navbar variant="default" />

      {/* ─── HERO ──────────────────────────────────── */}
      <section className="relative bg-[#1a1a2e] w-full py-14 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.18)_0%,_transparent_70%)]" />

        <div className="relative max-w-6xl mx-auto px-6">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full inline-flex items-center gap-1.5 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              {t('report_ai_complete')}
            </span>
            <span className="text-gray-500 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {diagnosis?.created_at ? new Date(diagnosis.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
            </span>
            {petInfo?.name && (
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <PawPrint className="w-3 h-3" />
                {petInfo.name}
              </span>
            )}
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            {t('report_potential')}{' '}
            <span className="text-[#F59E0B]">{diagnosis?.primary_label || t('report_condition')}</span>
          </h1>

          {/* Explanation */}
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mb-8 leading-relaxed">
            {diagnosis?.explanation || t('report_ai_analyzed')}{' '}
            <span className="font-semibold text-white">{confidencePercent}%</span>{' '}
            {t('report_ai_analyzed2')}
          </p>

          {/* Hero buttons */}
          <div className="flex flex-wrap gap-3" data-no-pdf>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full px-6 py-2.5 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? t('report_downloading') : t('report_download')}
            </button>
            <button
              onClick={handleShare}
              className="border border-white/30 text-white rounded-full px-6 py-2.5 hover:bg-white/10 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              {copied ? t('report_copied') : t('report_share')}
            </button>
          </div>
        </div>
      </section>

      {/* ─── STATS ROW ──────────────────────────────── */}
      <div className="relative z-10 -mt-8 max-w-5xl mx-auto w-full px-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg grid grid-cols-1 sm:grid-cols-3 p-6 gap-6 sm:gap-0 sm:divide-x sm:divide-[#E5E7EB] sm:dark:divide-gray-700">
          {/* Wellness Score */}
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={scoreColor(confidencePercent)}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34 * (confidencePercent / 100)} ${2 * Math.PI * 34}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-xl font-bold text-gray-900 dark:text-white">{confidencePercent}%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('report_wellness_score')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{scoreLabel(confidencePercent, t)}</p>
            </div>
          </div>

          {/* Similar Cases */}
          <div className="flex flex-col items-center justify-center gap-1 px-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#7C3AED]" />
              <span className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                {diagnosis?.secondary_labels?.length || 0}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('report_similar_cases')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('report_matched')}</p>
          </div>

          {/* Severity */}
          <div className="flex flex-col items-center justify-center gap-1 px-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                {diagnosis?.severity_flags?.length || 0}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('report_severity_flags')}</p>
            {diagnosis?.severity_flags?.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {t('report_active')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── CONDITION OVERVIEW (detailed) ────────── */}
      <section className="max-w-5xl mx-auto w-full px-6 pt-10 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="bg-gradient-to-r from-[#7C3AED]/5 to-transparent px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-[#7C3AED]" />
              <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">{t('report_condition_overview')}</h2>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Primary diagnosis */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">{t('report_primary_diagnosis')}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{diagnosis?.primary_label || t('report_condition')}</p>
            </div>

            {/* Explanation */}
            {diagnosis?.explanation && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">{t('report_about_condition')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{diagnosis.explanation}</p>
              </div>
            )}

            {/* Symptoms Reported */}
            {symptoms.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">{t('report_symptoms_reported')}</p>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium px-3 py-1.5 rounded-full">
                      <Heart className="w-3 h-3" />
                      {s.symptom_name || s.name || s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Current state of pet */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">{t('report_current_state')}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-900 leading-relaxed">
                  {t('report_current_state_desc', {
                    condition: diagnosis?.primary_label || t('report_condition'),
                    confidence: confidencePercent,
                    severity: diagnosis?.severity_flags?.length || 0,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── KEY OBSERVATIONS ─────────────────────── */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-6">
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-1">{t('report_why_title')}</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">{t('report_observations')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {observations.map((obs, idx) => {
            const colors = [
              'bg-red-50 border-red-200', 'bg-orange-50 border-orange-200',
              'bg-teal-50 border-teal-200', 'bg-blue-50 border-blue-200'
            ];
            const dots = ['bg-red-500', 'bg-orange-400', 'bg-teal-500', 'bg-blue-500'];
            return (
              <div key={idx} className={`rounded-xl border p-4 ${colors[idx % 4]} hover:shadow-md transition-shadow`}>
                <div className="flex items-start gap-3">
                  <span className={`${dots[idx % 4]} w-2.5 h-2.5 rounded-full mt-1.5 shrink-0`} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">{obs.title}</h3>
                    {obs.desc && <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{obs.desc}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── DO's & DON'Ts ────────────────────────── */}
      {(dosAndDonts.dos.length > 0 || dosAndDonts.donts.length > 0) && (
        <section className="max-w-5xl mx-auto w-full px-6 pb-6">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">{t('report_recommendations')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DO's */}
            {dosAndDonts.dos.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <ThumbsUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-green-800 text-base">{t('report_do_this')}</h3>
                </div>
                <ul className="space-y-2.5">
                  {dosAndDonts.dos.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-700" />
                      </span>
                      <span className="text-sm text-green-900 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* DON'Ts */}
            {dosAndDonts.donts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <ThumbsDown className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-red-800 text-base">{t('report_dont_do')}</h3>
                </div>
                <ul className="space-y-2.5">
                  {dosAndDonts.donts.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-3 h-3 text-red-700" />
                      </span>
                      <span className="text-sm text-red-900 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* If no don'ts were detected, show all as numbered recommended steps */}
            {dosAndDonts.donts.length === 0 && dosAndDonts.dos.length === 0 && diagnosis?.recommended_actions?.length > 0 && (
              <div className="md:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
                <div className="space-y-2">
                  {diagnosis.recommended_actions.map((action, idx) => {
                    const text = typeof action === 'string' ? action : action.text || action.description || '';
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="w-6 h-6 rounded-full bg-[#7C3AED]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-[#7C3AED]">{idx + 1}</span>
                        </span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── JOURNEY TIMELINE ─────────────────────── */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-8">
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-8">{t('report_journey')}</h2>

        <div className="relative pl-8">
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-green-200" />
          <div className="flex flex-col gap-8">
            {timelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className="absolute -left-8 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0 z-10">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{step.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {idx === 0 && t('report_time_5min')}
                      {idx === 1 && t('report_time_2min')}
                      {idx === 2 && t('report_time_now')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── WHAT'S NEXT – Navigation ─────────────── */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-4" data-no-pdf>
        <div className="bg-gradient-to-br from-[#7C3AED]/5 to-purple-50 border border-[#7C3AED]/10 rounded-2xl p-6 sm:p-8">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-1">{t('report_whats_next')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('report_whats_next_sub')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {isAuthenticated && (
              <Link to="/dashboard" className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-[#7C3AED]/30 transition-all no-underline group">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-[#7C3AED]/10 transition-colors">
                  <Home className="w-5 h-5 text-[#7C3AED]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('report_go_dashboard')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('report_go_dashboard_sub')}</p>
                </div>
              </Link>
            )}

            {isAuthenticated && petInfo?.id && (
              <Link to={`/pet/${petInfo.id}`} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-[#7C3AED]/30 transition-all no-underline group">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                  <PawPrint className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('report_view_pet')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{petInfo.name || t('report_view_pet_sub')}</p>
                </div>
              </Link>
            )}

            <button onClick={handleNewDiagnosis} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-[#7C3AED]/30 transition-all cursor-pointer text-left group">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                <Stethoscope className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('report_new_diagnosis')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('report_new_diagnosis_sub')}</p>
              </div>
            </button>

            {isAuthenticated && (
              <Link to="/records" className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-[#7C3AED]/30 transition-all no-underline group">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('report_view_history')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('report_view_history_sub')}</p>
                </div>
              </Link>
            )}
          </div>

          {/* CTA for unauthenticated */}
          {!isAuthenticated && (
            <div className="mt-6 pt-6 border-t border-[#7C3AED]/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('report_save_title')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('report_save_desc')}</p>
              </div>
              <div className="flex gap-2">
                <Link to="/register" className="inline-flex items-center gap-2 bg-[#7C3AED] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-[#6D28D9] transition-colors no-underline">
                  {t('report_save_btn')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors no-underline">
                  {t('report_login')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── DISCLAIMER ───────────────────────────── */}
      <footer className="max-w-5xl mx-auto w-full px-6 pb-8">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
          {t('report_disclaimer')}
        </p>
      </footer>
    </div>
  );
};

export default DiagnosisReportPage;

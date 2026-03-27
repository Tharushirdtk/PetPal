import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Download,
  Share2,
  Check,
  CheckCircle,
  Activity,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import { useConsultation } from '../context/ConsultationContext';
import { getDiagnosis } from '../api/diagnosis';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const DiagnosisReportPage = () => {
  const { t } = useLang();
  const { consultationId: ctxConsultationId } = useConsultation();
  const [searchParams] = useSearchParams();

  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setDiagnosis(res.data);
      } catch (err) {
        setError(err.error || 'Failed to load diagnosis report.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosis();
  }, [consultationId]);

  const confidencePercent = diagnosis?.confidence
    ? Math.round(diagnosis.confidence * 100)
    : 0;

  const timelineSteps = [
    t('report_analysis_fin'),
    t('report_image_uploads'),
    t('report_quest_complete'),
  ];

  const benefits = [
    t('report_benefit1'),
    t('report_benefit2'),
    t('report_benefit3'),
    t('report_benefit4'),
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
        <Navbar variant="report" />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
        <Navbar variant="report" />
        <div className="max-w-2xl mx-auto px-6 py-12 w-full">
          <ErrorAlert message={error} onClose={() => setError(null)} />
        </div>
      </div>
    );
  }

  // Build observation cards from API data
  const observations = [];
  const severityColors = ['bg-red-500', 'bg-orange-400', 'bg-teal-500', 'bg-blue-500'];

  if (diagnosis?.severity_flags && diagnosis.severity_flags.length > 0) {
    diagnosis.severity_flags.forEach((flag, idx) => {
      observations.push({
        color: severityColors[idx % severityColors.length],
        title: typeof flag === 'string' ? flag : flag.label || flag.title || '',
        desc: typeof flag === 'string' ? '' : flag.description || flag.desc || '',
      });
    });
  }

  if (diagnosis?.secondary_labels && diagnosis.secondary_labels.length > 0) {
    diagnosis.secondary_labels.forEach((label, idx) => {
      observations.push({
        color: severityColors[(observations.length + idx) % severityColors.length],
        title: typeof label === 'string' ? label : label.label || label.name || '',
        desc: typeof label === 'string' ? '' : label.description || '',
      });
    });
  }

  // Fallback: if no observations were built from API data, show explanation
  if (observations.length === 0 && diagnosis?.explanation) {
    observations.push({
      color: 'bg-teal-500',
      title: diagnosis.primary_label || 'Analysis',
      desc: diagnosis.explanation,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Navbar variant="report" />

      {/* Hero Section */}
      <section className="relative bg-[#1a1a2e] w-full py-16 overflow-hidden">
        {/* Subtle radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.15)_0%,_transparent_70%)]" />

        <div className="relative max-w-7xl mx-auto px-6">
          {/* Green badge */}
          <div className="mb-6">
            <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full inline-flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {t('report_ai_complete')}
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            {t('report_potential')}{' '}
            <span className="text-[#F59E0B]">{diagnosis?.primary_label || t('report_condition')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mb-8 leading-relaxed">
            {diagnosis?.explanation || t('report_ai_analyzed')}{' '}
            <span className="font-semibold text-white">{confidencePercent}%</span>{' '}
            {t('report_ai_analyzed2')}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <button className="bg-white text-gray-900 rounded-full px-6 py-2.5 font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2 cursor-pointer">
              {t('report_full_details')}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="border border-white/30 text-white rounded-full px-6 py-2.5 hover:bg-white/10 transition-colors inline-flex items-center gap-2 cursor-pointer">
              <Share2 className="w-4 h-4" />
              {t('report_share')}
            </button>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="relative z-10 -mt-8 max-w-4xl mx-auto w-full px-6">
        <div className="bg-white rounded-2xl shadow-lg grid grid-cols-1 sm:grid-cols-3 p-6 gap-6 sm:gap-0 sm:divide-x sm:divide-[#E5E7EB]">
          {/* Wellness Score */}
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34 * (confidencePercent / 100)} ${2 * Math.PI * 34}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-xl font-bold text-gray-900">{confidencePercent}%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">{t('report_wellness_score')}</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${confidencePercent}%` }} />
              </div>
            </div>
          </div>

          {/* Secondary Labels Count */}
          <div className="flex flex-col items-center justify-center gap-1 px-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#7C3AED]" />
              <span className="font-display text-2xl font-bold text-gray-900">
                {diagnosis?.secondary_labels?.length || 0}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{t('report_similar_cases')}</p>
            <p className="text-xs text-gray-400">{t('report_matched')}</p>
          </div>

          {/* Severity */}
          <div className="flex flex-col items-center justify-center gap-1 px-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="font-display text-2xl font-bold text-gray-900">
                {diagnosis?.severity_flags?.length > 0
                  ? (typeof diagnosis.severity_flags[0] === 'string'
                      ? diagnosis.severity_flags[0]
                      : diagnosis.severity_flags[0]?.label || t('report_inflammation'))
                  : t('report_inflammation')}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {t('report_inflammation_label')}
            </p>
            {diagnosis?.severity_flags?.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Why This Result / Observations */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="font-display font-bold text-xl text-gray-900">
            {t('report_why_title')}
          </h2>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-[#7C3AED] text-sm font-semibold hover:underline no-underline"
          >
            <Download className="w-4 h-4" />
            {t('report_download')}
          </a>
        </div>

        {/* Observations label */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          {t('report_observations')}
        </p>

        {/* Observation cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {observations.map((obs, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`${obs.color} w-3 h-3 rounded-full mt-1.5 shrink-0`}
                />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{obs.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{obs.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended Actions */}
        {diagnosis?.recommended_actions && diagnosis.recommended_actions.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Recommended Actions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnosis.recommended_actions.map((action, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <span className="bg-[#7C3AED] w-3 h-3 rounded-full mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {typeof action === 'string' ? action : action.text || action.description || ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Journey Timeline */}
      <section className="max-w-7xl mx-auto px-6 py-8 w-full">
        <h2 className="font-display font-bold text-xl text-gray-900 mb-8">
          {t('report_journey')}
        </h2>

        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-green-200" />

          <div className="flex flex-col gap-8">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                {/* Circle with check */}
                <div className="absolute -left-8 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0 z-10">
                  <Check className="w-4 h-4 text-white" />
                </div>

                <div className="ml-4">
                  <p className="font-semibold text-gray-900">{step}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {idx === 0 && 'Just now'}
                    {idx === 1 && '2 minutes ago'}
                    {idx === 2 && '5 minutes ago'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#1a1a2e] mt-8 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left side */}
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
                {t('report_save_title')}
              </h2>
              <p className="text-gray-400 leading-relaxed max-w-lg">
                {t('report_save_desc')}
              </p>
            </div>

            {/* Right side */}
            <div>
              {/* Benefits list */}
              <ul className="flex flex-col gap-3 mb-6">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-400" />
                    </span>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="bg-white text-gray-900 rounded-full px-6 py-2.5 font-semibold hover:bg-gray-100 transition-colors no-underline inline-flex items-center gap-2"
                >
                  {t('report_save_btn')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="border border-white/30 text-white rounded-full px-6 py-2.5 hover:bg-white/10 transition-colors no-underline inline-flex items-center gap-2"
                >
                  {t('report_login')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DiagnosisReportPage;

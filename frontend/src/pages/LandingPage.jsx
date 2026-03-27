import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  MessageCircle,
  FileText,
  Moon,
  Leaf,
  Phone,
  ChevronRight,
  ArrowRight,
  Send,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import { submitContact } from '../api/contact';
import ErrorAlert from '../components/ErrorAlert';

const PawIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4.5-2c-.83 0-1.5.67-1.5 1.5S6.67 11 7.5 11 9 10.33 9 9.5 8.33 8 7.5 8zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5S17.33 8 16.5 8zM12 4c-.83 0-1.5.67-1.5 1.5S11.17 7 12 7s1.5-.67 1.5-1.5S12.83 4 12 4zm0 12c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4z" />
  </svg>
);

const LandingPage = () => {
  const { t } = useLang();

  const [contactForm, setContactForm] = useState({ heading: '', email: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState(null);

  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      setContactLoading(true);
      setContactError(null);
      setContactSuccess(false);
      await submitContact(contactForm);
      setContactSuccess(true);
      setContactForm({ heading: '', email: '', message: '' });
    } catch (err) {
      setContactError(err.error || 'Failed to send message. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="landing" />

      {/* ───────────────── Hero Section ───────────────── */}
      <section className="bg-gradient-to-b from-[#F5F3FF] to-white">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Copy */}
          <div className="flex flex-col gap-6">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-gray-900">{t('landing_hero_title')}</span>
              <br />
              <span className="text-[#7C3AED]">{t('landing_hero_title2')}</span>
            </h1>

            <p className="text-gray-500 text-lg max-w-lg leading-relaxed">
              {t('landing_hero_subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mt-2">
              <Link
                to="/chat"
                className="bg-[#7C3AED] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#6D28D9] transition-colors no-underline inline-flex items-center gap-2"
              >
                {t('landing_cta_start')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="border border-[#E5E7EB] rounded-full px-6 py-3 font-semibold text-gray-700 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors no-underline"
              >
                {t('landing_cta_signup')}
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-3 mt-4">
              {/* Stacked avatar circles */}
              <div className="flex -space-x-2">
                {['bg-[#7C3AED]', 'bg-[#F59E0B]', 'bg-[#10B981]', 'bg-[#3B82F6]'].map(
                  (bg, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-xs font-semibold`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ),
                )}
              </div>
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">10k+</span>{' '}
                {t('landing_pet_parents')}
              </span>
            </div>
          </div>

          {/* Right — Floating Card */}
          <div className="relative flex items-center justify-center">
            {/* Background decorative blob */}
            <div className="absolute w-72 h-72 bg-[#7C3AED]/10 rounded-full blur-3xl -z-10" />

            <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xl p-8 w-full max-w-sm flex flex-col items-center gap-6">
              {/* Accuracy ring */}
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52 * 0.988} ${2 * Math.PI * 52}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-bold text-gray-900">
                    98.8%
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {t('landing_ai_accuracy')}
                  </span>
                </div>
              </div>

              {/* Professional Results tag */}
              <div className="flex items-center gap-2 bg-[#F0FDF4] px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-sm font-medium text-[#15803D]">
                  {t('landing_professional_results')}
                </span>
              </div>

              {/* Mini stat row */}
              <div className="w-full grid grid-cols-2 gap-4 text-center">
                <div className="bg-[#F5F3FF] rounded-xl p-3">
                  <p className="font-display text-lg font-bold text-[#7C3AED]">10k+</p>
                  <p className="text-xs text-gray-500">{t('landing_pet_parents')}</p>
                </div>
                <div className="bg-[#F5F3FF] rounded-xl p-3">
                  <p className="font-display text-lg font-bold text-[#7C3AED]">24/7</p>
                  <p className="text-xs text-gray-500">{t('landing_feature3_title')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── How It Works ───────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          {/* Label pill */}
          <span className="inline-block bg-[#F5F3FF] text-[#7C3AED] text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            {t('landing_method')}
          </span>

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t('landing_how_title')}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-14">
            {t('landing_how_subtitle')}
          </p>

          {/* Steps grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                num: 1,
                icon: <Camera className="w-6 h-6 text-[#7C3AED]" />,
                title: t('landing_step1_title'),
                desc: t('landing_step1_desc'),
              },
              {
                num: 2,
                icon: <MessageCircle className="w-6 h-6 text-[#7C3AED]" />,
                title: t('landing_step2_title'),
                desc: t('landing_step2_desc'),
              },
              {
                num: 3,
                icon: <FileText className="w-6 h-6 text-[#7C3AED]" />,
                title: t('landing_step3_title'),
                desc: t('landing_step3_desc'),
              },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center gap-4">
                {/* Number circle */}
                <div className="w-10 h-10 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-sm font-bold">
                  {step.num}
                </div>
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] flex items-center justify-center">
                  {step.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Explore link */}
          <Link
            to="/chat"
            className="inline-flex items-center gap-1 mt-12 text-[#7C3AED] font-semibold text-sm hover:underline no-underline"
          >
            {t('landing_explore_tech')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ───────────────── Features Section ───────────────── */}
      <section className="bg-[#F9FAFB] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Moon className="w-6 h-6 text-[#7C3AED]" />,
                title: t('landing_feature1_title'),
                desc: t('landing_feature1_desc'),
              },
              {
                icon: <Leaf className="w-6 h-6 text-[#7C3AED]" />,
                title: t('landing_feature2_title'),
                desc: t('landing_feature2_desc'),
              },
              {
                icon: <Phone className="w-6 h-6 text-[#7C3AED]" />,
                title: t('landing_feature3_title'),
                desc: t('landing_feature3_desc'),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#F5F3FF] flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── Contact Us Section ───────────────── */}
      <section className="bg-white py-20" id="contact">
        <div className="max-w-3xl mx-auto px-6">
          {/* Label pill */}
          <div className="text-center mb-8">
            <span className="inline-block bg-[#F5F3FF] text-[#7C3AED] text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
              {t('nav_contact') || 'Contact Us'}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {t('contact_title') || 'Get in Touch'}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {t('contact_subtitle') || 'Have a question or feedback? We would love to hear from you.'}
            </p>
          </div>

          {contactSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-center text-sm">
              {t('contact_success') || 'Your message has been sent successfully! We will get back to you soon.'}
            </div>
          )}

          {contactError && (
            <ErrorAlert message={contactError} onClose={() => setContactError(null)} />
          )}

          <form onSubmit={handleContactSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('contact_heading') || 'Subject'}
              </label>
              <input
                type="text"
                name="heading"
                value={contactForm.heading}
                onChange={handleContactChange}
                required
                placeholder={t('contact_heading_placeholder') || 'What is this about?'}
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('contact_email') || 'Email'}
              </label>
              <input
                type="email"
                name="email"
                value={contactForm.email}
                onChange={handleContactChange}
                required
                placeholder={t('contact_email_placeholder') || 'your@email.com'}
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('contact_message') || 'Message'}
              </label>
              <textarea
                name="message"
                value={contactForm.message}
                onChange={handleContactChange}
                required
                rows={5}
                placeholder={t('contact_message_placeholder') || 'Tell us what you need help with...'}
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={contactLoading}
              className="bg-[#7C3AED] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#6D28D9] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {contactLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('contact_sending') || 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('contact_send') || 'Send Message'}
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="bg-[#111827] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <PawIcon className="w-7 h-7 text-[#7C3AED]" />
                <span className="font-display font-bold text-xl">PetPal</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                {t('landing_footer_tagline')}
              </p>
            </div>

            {/* Quick Links column */}
            <div className="flex flex-col gap-4">
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-gray-400">
                {t('landing_quick_links')}
              </h4>
              <nav className="flex flex-col gap-2">
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white text-sm transition-colors no-underline"
                >
                  {t('nav_aboutus')}
                </Link>
                <Link
                  to="/chat"
                  className="text-gray-300 hover:text-white text-sm transition-colors no-underline"
                >
                  {t('nav_diagnosis')}
                </Link>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white text-sm transition-colors no-underline"
                >
                  {t('nav_contact')}
                </Link>
                <Link
                  to="/register"
                  className="text-gray-300 hover:text-white text-sm transition-colors no-underline"
                >
                  {t('nav_register')}
                </Link>
              </nav>
            </div>

            {/* Social icons column */}
            <div className="flex flex-col gap-4">
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-gray-400">
                {t('landing_social_play')}
              </h4>
              <div className="flex items-center gap-3">
                {/* Twitter / X */}
                <a
                  href="#"
                  aria-label="Twitter"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#7C3AED] flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#7C3AED] flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#7C3AED] flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} PetPal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

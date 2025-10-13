import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Register GSAP plugin
gsap.registerPlugin(SplitText);

const SupportPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const versionRef = useRef(null);

  // Animate text with GSAP SplitText
  const animateText = (ref, text, splitType = 'chars', delay = 100, duration = 0.6) => {
    if (!ref.current || !text) return;
    ref.current.textContent = text;
    const splitter = new SplitText(ref.current, { type: splitType, linesClass: 'split-line' });
    const targets = splitType === 'chars' ? splitter.chars : splitter.words;
    if (!targets || targets.length === 0) {
      console.warn('No targets for animation:', ref.current);
      splitter.revert();
      return;
    }

    gsap.fromTo(
      targets,
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger: delay / 1000,
        ease: 'power2.out',
        onComplete: () => {
          splitter.revert();
        },
      }
    );
  };

  useEffect(() => {
    animateText(headerRef, 'Tax Laws - Ghana', 'chars');
    animateText(titleRef, 'Support Center', 'words', 50, 0.5);
    animateText(versionRef, 'v1.0.0', 'words', 50, 0.5);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate form submission (e.g., send to email service like EmailJS or backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Thank you! Your message has been sent. We\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: 'How do I access the full tax laws content?',
      answer: 'Once you\'ve made the one-time payment of 100 GHS, your account will be activated, granting full access to all tax laws and updates.'
    },
    {
      question: 'What payment methods are supported?',
      answer: 'We support card, bank transfer, USSD, and mobile money via Paystack for secure transactions.'
    },
    {
      question: 'Can I use the app on multiple devices?',
      answer: 'Your account is device-bound for security. Please log out from other devices before switching.'
    },
    {
      question: 'How do I update my payment status if it\'s not reflecting?',
      answer: 'Use the "Check Status" button in your dashboard or contact support if issues persist.'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden font-inter">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/welcome.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/20 via-gray-900/10 to-gray-900/30 z-10" />
      <div className="min-h-screen flex items-center justify-center pt-12 sm:pt-16 p-4 sm:p-6 relative z-20">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontSize: '0.875rem',
              padding: '1rem 1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            },
            success: { style: { background: '#059669', color: '#fff' } },
            error: { style: { background: '#DC2626', color: '#fff' } },
          }}
        />
        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="fixed inset-0 bg-gray-800/90 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center space-y-4">
                <motion.div
                  className="h-12 w-12 border-4 border-t-blue-500 border-gray-300 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-white text-base font-semibold tracking-wide">Sending...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 pb-4 relative">
            <div className="flex justify-center mb-4">
              <img
                src="/icon.png"
                alt="Logo"
                className="w-12 h-12 rounded-full"
              />
            </div>
            <motion.div
              className="text-center space-y-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1
                ref={headerRef}
                className="text-2xl font-bold text-white"
              />
              <p
                ref={versionRef}
                className="text-white/80 text-sm"
              />
              <h2
                ref={titleRef}
                className="text-xl font-bold text-white"
              />
            </motion.div>
          </div>
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* FAQ Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
                    whileHover={{ y: -2 }}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full text-left flex items-center justify-between py-2"
                    >
                      <span className="font-semibold text-gray-900">{faq.question}</span>
                      <motion.svg
                        className={`w-5 h-5 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: activeFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>
                    <AnimatePresence>
                      {activeFaq === index && (
                        <motion.p
                          className="text-sm text-gray-600 mt-2 pl-4"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {faq.answer}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Report Form Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Report a Problem</h3>
              <p className="text-sm text-gray-600 mb-4">Or contact us directly at <a href="mailto:support@sbmindtechnologies.com" className="text-blue-600 hover:underline">support@sbmindtechnologies.com</a></p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-200 border border-gray-200"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-200 border border-gray-200"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-200 border border-gray-200"
                    placeholder="Describe your issue..."
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition duration-200 shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </motion.button>
              </form>
            </motion.section>
          </div>
          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500 mb-2">SBMind Technologies</p>
            <motion.a
              href="/"
              className="inline-block text-sm text-blue-600 hover:text-blue-800 font-semibold underline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Home
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SupportPage;
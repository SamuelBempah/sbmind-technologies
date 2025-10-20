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
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle, submitting, success, error
  const [ticketId, setTicketId] = useState(null); // Store ticket ID from backend
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const versionRef = useRef(null);

  // Check server status on mount
  const checkServerStatus = async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET', 
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5s timeout
      });
      if (response.ok) {
        const data = await response.json();
        setServerStatus(data.resendConfigured ? 'online' : 'partial');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      console.warn('Server status check failed:', error.message);
      setServerStatus('offline');
    }
  };

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
    // Initial animations
    animateText(headerRef, 'Tax Laws - Ghana', 'chars');
    animateText(titleRef, 'Support Center', 'words', 50, 0.5);
    animateText(versionRef, 'v1.0.0', 'words', 50, 0.5);
    
    // Check server status
    checkServerStatus();
    
    // Periodic server health check
    const interval = setInterval(checkServerStatus, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Reset status when user starts typing again
    if (submitStatus === 'success') {
      setSubmitStatus('idle');
      setTicketId(null);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Please enter your full name.';
    if (!formData.email.trim()) return 'Please enter your email address.';
    if (!formData.message.trim()) return 'Please describe your issue.';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }
    
    if (formData.message.length > 5000) { // Match backend limit
      return 'Message is too long. Please keep it under 5000 characters.';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus('submitting');

    // Check server status before submit
    if (serverStatus === 'offline') {
      toast.error('Server is currently offline. Please try again in a moment.', { id: 'server-offline' });
      setLoading(false);
      setSubmitStatus('idle');
      return;
    }

    try {
      const validationError = validateForm();
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Show loading toast
      const sendingToastId = toast.loading('Sending your support request...', { id: 'sending-toast' });

      // Call backend API
      const response = await fetch('/api/send-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Metadata for backend
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timestamp: new Date().toISOString(),
          // Frontend version for tracking
          appVersion: '1.0.0',
          screenResolution: `${window.screen.width}x${window.screen.height}`,
        }),
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      const result = await response.json();
      toast.dismiss(sendingToastId);

      if (response.ok && result.success) {
        // Success! Store ticket ID
        setTicketId(result.ticketId);
        setSubmitStatus('success');
        
        const successMessage = ticketId 
          ? `✅ Request #${result.ticketId} sent successfully! Check your email for confirmation.`
          : '✅ Your support request has been sent successfully!';
          
        toast.success(successMessage, {
          id: 'success-toast',
          duration: 8000,
          icon: '📧',
          position: 'top-center',
        });
        
        // Auto-reset form after 3s
        setTimeout(() => {
          setFormData({ name: '', email: '', message: '' });
          setSubmitStatus('idle');
          setTicketId(null);
        }, 3000);
        
      } else {
        // Backend returned error
        const errorMsg = result.error || 'Failed to send your request';
        throw new Error(errorMsg);
      }

    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      
      let errorMessage = 'Failed to send your request. Please try again.';
      let errorId = 'generic-error';
      
      // Enhanced error handling for backend responses
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout. Please check your connection and try again.';
        errorId = 'timeout-error';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid request. Please check your information and try again.';
        errorId = 'validation-error';
      } else if (error.message.includes('429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
        errorId = 'rate-limit-error';
      } else if (error.message.includes('500') || error.message.includes('503')) {
        errorMessage = 'Server error. Our team has been notified. Please try again in a few minutes.';
        errorId = 'server-error';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
        errorId = 'network-error';
      } else if (error.message.includes('email') || error.message.includes('Resend')) {
        errorMessage = 'Email service temporarily unavailable. Your request is saved and will be processed.';
        errorId = 'email-service-error';
      } else {
        errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      toast.error(errorMessage, { id: errorId, duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Server status indicator
  const getServerStatusIndicator = () => {
    switch (serverStatus) {
      case 'online':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            Server Online
          </div>
        );
      case 'partial':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></div>
            Partial Service
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
            Server Offline
          </div>
        );
    }
  };

  const faqs = [
    {
      question: 'How do I access the full tax laws content?',
      answer: 'Once you\'ve made the one-time payment of 100 GHS, your account will be activated, granting full access to all tax laws and updates. You can access content from the "Library" section in the app menu.'
    },
    {
      question: 'What payment methods are supported?',
      answer: 'We support secure payments via Paystack including: Visa/Mastercard, Mobile Money (MTN, Vodafone, AirtelTigo), Bank Transfer, and USSD. All transactions are encrypted and secure.'
    },
    {
      question: 'Can I use the app on multiple devices?',
      answer: 'Your account is device-bound for security reasons. You can log out from one device in Settings → Security → Manage Devices, then log in on another device.'
    },
    {
      question: 'How do I update my payment status if it\'s not reflecting?',
      answer: '1. Go to Dashboard → Payment Status\n2. Click "Check Status"\n3. If still pending, contact support with your transaction reference. Most payments reflect within 5 minutes.'
    },
    {
      question: 'How often is the tax laws content updated?',
      answer: 'We update the content whenever there are official changes from Ghana Revenue Authority or Ministry of Finance. You\'ll receive notifications for major updates.'
    },
    {
      question: 'What is my support ticket number?',
      answer: `After submitting a request, you'll see your ticket ID (e.g., "abc12345") in the success message. Reference this number in follow-up emails to support@sbmindtechnologies.com for faster resolution.`
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden font-inter">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/welcome.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/20 via-gray-900/10 to-gray-900/30 z-10" />
      
      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center pt-12 sm:pt-16 p-4 sm:p-6 relative z-20">
        
        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontSize: '0.875rem',
              padding: '1rem 1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            },
            success: { 
              style: { 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                color: '#fff',
                border: '1px solid #10b981'
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            error: { 
              style: { 
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                color: '#fff',
                border: '1px solid #ef4444'
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
            loading: { 
              style: { 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                color: '#fff',
                border: '1px solid #3b82f6'
              },
            },
          }}
        />

        {/* Main Card */}
        <motion.div
          className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 pb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent" />
            <div className="relative flex justify-between items-start mb-4">
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              >
                <img
                  src="/icon.png"
                  alt="Tax Laws Ghana Logo"
                  className="w-16 h-16 rounded-2xl shadow-lg ring-2 ring-white/20"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-2xl blur opacity-75 animate-pulse" />
              </motion.div>
              {getServerStatusIndicator()}
            </div>
            
            <motion.div
              className="text-center space-y-2 relative"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1
                ref={headerRef}
                className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
              />
              <p
                ref={versionRef}
                className="text-blue-100/80 text-sm font-mono bg-black/10 px-2 py-1 rounded-full inline-block"
              />
              <h2
                ref={titleRef}
                className="text-2xl font-bold text-white/95"
              />
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Success Message with Ticket ID */}
            <AnimatePresence>
              {submitStatus === 'success' && (
                <motion.div
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm relative overflow-hidden"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="absolute inset-0 bg-green-500/5" />
                  <div className="relative flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">Request Sent Successfully!</h3>
                      <p className="text-green-700 text-sm mb-3">
                        Our support team has received your request and will respond within 24 hours.
                      </p>
                      {ticketId && (
                        <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-lg p-3 mb-3">
                          <p className="text-sm font-mono text-green-800 bg-green-50 px-3 py-1 rounded-md inline-block">
                            📋 Ticket ID: <strong>{ticketId}</strong>
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Save this ID for reference in follow-up emails
                          </p>
                        </div>
                      )}
                      <p className="text-green-700 text-sm">
                        Check your email ({formData.email}) for confirmation with full details.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FAQ Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                <span className="flex items-center">
                  <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Frequently Asked Questions
                </span>
                <span className="text-sm text-gray-500">Click to expand</span>
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 shadow-sm border border-gray-200 hover:border-gray-300 transition-all duration-200"
                    whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full text-left flex items-start justify-between py-2 pr-2"
                    >
                      <span className="font-semibold text-gray-900 text-sm leading-relaxed flex-1 pr-4">
                        {faq.question}
                      </span>
                      <motion.svg
                        className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform duration-200`}
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
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="pl-1 mt-2 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Support Form Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Report Issue or Get Help
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      🔒 Secure
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ⚡ Fast
                    </span>
                  </div>
                </div>

                {/* Server Status Warning */}
                {serverStatus !== 'online' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-yellow-800">
                          {serverStatus === 'partial' 
                            ? 'Email service is limited. Requests will be queued and processed soon.' 
                            : 'Server is temporarily offline. Please try again shortly.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* How it works */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How it works
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-blue-800">
                    <div className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600">1.</span>
                      <span>Fill out the form</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600">2.</span>
                      <span>Click Send</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600">3.</span>
                      <span>Get ticket ID + email</span>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={loading || serverStatus === 'offline'}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed placeholder-gray-400 text-base"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={loading || serverStatus === 'offline'}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed placeholder-gray-400 text-base"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                      Your Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      disabled={loading || serverStatus === 'offline'}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed placeholder-gray-400 resize-y text-base"
                      placeholder="Please describe your issue or question in as much detail as possible. Include any error messages, transaction IDs, or screenshots if available..."
                    />
                    <p className="text-xs text-gray-500 flex justify-between">
                      <span>{formData.message.length}/5000 characters</span>
                      <span className={`font-medium ${formData.message.length > 4500 ? 'text-red-600' : 'text-gray-500'}`}>
                        {formData.message.length > 4500 ? 'Approaching limit' : 'Plenty of space'}
                      </span>
                    </p>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading || submitStatus === 'success' || serverStatus === 'offline'}
                    className="group relative w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg transform transition-all duration-200 flex items-center justify-center space-x-3 overflow-hidden disabled:cursor-not-allowed disabled:transform-none"
                    whileHover={{ scale: loading || submitStatus === 'success' || serverStatus === 'offline' ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          className="flex items-center space-x-3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </motion.div>
                      ) : submitStatus === 'success' ? (
                        <motion.div
                          key="success"
                          className="flex items-center space-x-3"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Request Sent!</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="ready"
                          className="flex items-center space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Send Support Request</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Background shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  </motion.button>

                  {/* Form tips */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tips for faster resolution
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        Include transaction IDs, error messages, or screenshots
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        Write "URGENT" at the start for priority processing
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        Payment issues get immediate attention
                      </li>
                    </ul>
                  </div>
                </form>

                {/* Response Time Info */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                  <h4 className="font-semibold text-emerald-900 mb-3">Expected Response Times</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></span>
                      <div>
                        <p className="text-xs font-medium text-amber-800">Standard</p>
                        <p className="text-sm font-semibold text-amber-900">24 hours</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20">
                      <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
                      <div>
                        <p className="text-xs font-medium text-blue-800">URGENT</p>
                        <p className="text-sm font-semibold text-blue-900">4 hours</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20">
                      <span className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></span>
                      <div>
                        <p className="text-xs font-medium text-red-800">Payments</p>
                        <p className="text-sm font-semibold text-red-900">Immediate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-200 px-6 py-6">
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                © 2025 SBMind Technologies. All rights reserved. |{' '}
                <a href="mailto:info@sbmindtechnologies.com" className="text-blue-600 hover:text-blue-800 underline">
                  Contact Support
                </a>
              </p>
              <motion.a
                href="/"
                className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Home</span>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SupportPage;
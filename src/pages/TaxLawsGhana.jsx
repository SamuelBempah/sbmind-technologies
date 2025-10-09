import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Register GSAP plugin
gsap.registerPlugin(SplitText);

// Supabase configuration
const supabaseUrl = 'https://nenvormxclecqlmsaarv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbnZvcm14Y2xlY3FsbXNhYXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Nzg4NDIsImV4cCI6MjA3NDQ1NDg0Mn0.7w6Vn8WydyExodTMfLIRbzhBl8D1BvIGY3ShYBDqMKY';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storage: localStorage,
    autoRefreshToken: true,
  },
});
console.log('Supabase client initialized');

// Constants
const PAYSTACK_PUBLIC_KEY = 'pk_live_23b761b22189926aae2d75c17e3e09de593a264f';
const WEB_PAYMENT_URL = 'https://sbmindtechnologies.com';

const TaxLaws = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [paymentMade, setPaymentMade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(!!window.PaystackPop);
  const [activeTab, setActiveTab] = useState('login'); // For tab switching
  const headerRef = useRef(null);
  const loginTitleRef = useRef(null);
  const signupTitleRef = useRef(null);
  const welcomeRef = useRef(null);
  const statusRef = useRef(null);

  // Generate unique reference for Paystack
  const generateReference = () => {
    return `TX_${Math.floor(Math.random() * 1000000)}`;
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

  // Load Paystack script and initialize animations
  useEffect(() => {
    if (!paystackLoaded && !window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v2/inline.js';
      script.async = true;
      script.onload = () => {
        setPaystackLoaded(true);
        console.log('Paystack script loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Paystack script');
        toast.error('Payment script failed to load. Please try again.');
      };
      document.body.appendChild(script);
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
    animateText(headerRef, 'Tax Laws - Ghana', 'chars');
    if (activeTab === 'login') {
      animateText(loginTitleRef, 'Log In', 'words', 50, 0.5);
    } else {
      animateText(signupTitleRef, 'Sign Up', 'words', 50, 0.5);
    }
    if (user) {
  animateText(welcomeRef, `Welcome, ${user.email.split('@')[0]}!`, 'words', 50, 0.5);
  animateText(statusRef, 'Account Status', 'words', 50, 0.5);
}
  }, [user, paystackLoaded, activeTab]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const deleted = localStorage.getItem('accountDeleted') === 'true';
      if (deleted) {
        setAccountDeleted(true);
        return;
      }
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.log('No user found, redirecting to login');
          return;
        }
        setEmail(user.email);
        console.log('User fetched:', user.email);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('payment_made')
          .eq('id', user.id)
          .single();
        if (profileError) {
          console.error('Profile fetch error:', profileError.message);
          toast.error('Failed to fetch account status.');
        } else if (profile.payment_made) {
          setPaymentMade(true);
          toast.success('Account is active!');
        }
      } catch (error) {
        console.error('Payment status check error:', error.message);
        toast.error('Failed to verify account status.');
      }
    };
    init();
  }, []);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) {
      toast.error('Authentication service unavailable.');
      return;
    }
    setLoading(true);
    console.log('Login attempt with email:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('Login successful, user:', data.user.email);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('payment_made')
        .eq('id', data.user.id)
        .single();
      if (profileError) throw profileError;
      setUser(data.user);
      setPaymentMade(profile.payment_made);
      animateText(welcomeRef, `Welcome, ${data.user.email}`, 'words', 50, 0.5);
      animateText(statusRef, 'Account Status', 'words', 50, 0.5);
      toast.success('Logged in successfully!');
    } catch (err) {
      console.error('Login error:', err.message);
      toast.error(err.message.includes('Invalid login') ? 'Invalid email or password.' : 'Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    if (!supabase) {
      toast.error('Authentication service unavailable.');
      return;
    }
    setLoading(true);
    console.log('Logging out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Logout successful');
      setUser(null);
      setPaymentMade(false);
      setEmail('');
      setPassword('');
      setActiveTab('login');
      toast.success('Logged out successfully.');
    } catch (err) {
      console.error('Logout error:', err.message);
      toast.error('Failed to log out: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete account handler - Simulated
  const handleDeleteAccount = async () => {
    if (!supabase) {
      toast.error('Authentication service unavailable.');
      return;
    }
    setLoading(true);
    setDeleteModalOpen(false);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('User not authenticated');
      console.log('Simulating account deletion for user:', user.email);

      // Simulate delay for deletion process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success
      localStorage.setItem('accountDeleted', 'true');
      toast('Account deletion is in progress. This process may take up to an hour to complete. You will be notified once it is finalized.', { duration: 10000 });
      await supabase.auth.signOut();
      setUser(null);
      setPaymentMade(false);
      setEmail('');
      setPassword('');
      setAccountDeleted(true);
    } catch (err) {
      console.error('Account deletion simulation error:', err);
      toast.error('Failed to process deletion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Payment handler
  const handlePayment = async () => {
    if (!supabase) {
      toast.error('Authentication service unavailable.');
      return;
    }
    if (!paystackLoaded || !window.PaystackPop) {
      toast.error('Paystack SDK not loaded. Please try again.');
      return;
    }
    if (!PAYSTACK_PUBLIC_KEY) {
      toast.error('Paystack configuration error. Please contact support.');
      return;
    }
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('User not authenticated');
      console.log('Initializing Paystack payment with email:', user.email);

      const reference = generateReference();
      console.log('Generated Paystack reference:', reference);

      window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: 10000,
        currency: 'GHS',
        ref: reference,
        channels: ['card', 'bank', 'ussd', 'mobile_money'],
        callback: async (response) => {
          try {
            console.log('Paystack callback:', response);
            // For testing, assume success without server verification
            const { error } = await supabase
              .from('profiles')
              .update({ payment_made: true })
              .eq('id', user.id);
            if (error) throw error;
            setPaymentMade(true);
            toast.success('Payment successful! Your account is now active.');
          } catch (err) {
            console.error('Payment update error:', err.message);
            toast.error('Failed to update payment status. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        onClose: () => {
          console.log('Paystack popup closed');
          toast.error('Payment cancelled.');
          setLoading(false);
        },
      }).openIframe();
    } catch (err) {
      console.error('Payment initialization error:', err.message);
      toast.error(`Failed to initialize payment: ${err.message || 'Please check your network and try again.'}`);
      setLoading(false);
    }
  };

  // Check payment status after redirect
  const checkPaymentStatus = async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('User not found');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('payment_made')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      if (profile.payment_made) {
        setPaymentMade(true);
        toast.success('Account is active!');
      } else {
        toast.error('Your account does not currently have access. Please complete payment.');
      }
    } catch (error) {
      console.error('Payment status check error:', error.message);
      toast.error('Failed to verify account status.');
    } finally {
      setLoading(false);
    }
  };

  if (accountDeleted) {
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
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/20 to-gray-900/40 z-10" />
        <div className="min-h-screen flex items-center justify-center pt-16 sm:pt-20 p-4 sm:p-6 relative z-20">
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontSize: '0.875rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              },
              success: { style: { background: '#059669', color: '#fff' } },
              error: { style: { background: '#DC2626', color: '#fff' } },
            }}
          />
          <motion.div
            className="w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-6 text-center">
              <motion.div
                className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <p className="text-xl font-bold text-gray-900">
                Account Deleted
              </p>
              <p className="text-sm text-gray-600">
                Your account deletion is in progress or has been completed.
              </p>
              <motion.a
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition duration-200 shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back to Home
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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
                <span className="text-white text-base font-semibold tracking-wide">Processing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteModalOpen && (
            <motion.div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalOpen(false)}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Are you sure? This will permanently delete your account and all data. No turning back!
                </p>
                <div className="flex space-x-3 justify-end">
                  <motion.button
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleDeleteAccount}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 pb-4">
            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p
                ref={headerRef}
                className="text-2xl font-bold text-white"
              >
                Tax Laws - Ghana
              </p>
              {user && (
                <motion.button
                  onClick={handleLogout}
                  className="text-white/90 hover:text-white font-semibold text-sm flex items-center space-x-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Log Out</span>
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Login Section */}
            {!user && (
              <>
                <div className="flex space-x-1 mb-6">
                  <motion.button
                    onClick={() => setActiveTab('login')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                      activeTab === 'login'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: activeTab === 'login' ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Log In
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveTab('signup')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                      activeTab === 'signup'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: activeTab === 'signup' ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign Up
                  </motion.button>
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'login' && (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.p
                        ref={loginTitleRef}
                        className="text-xl font-bold text-gray-900 text-center mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Welcome Back
                      </motion.p>
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-200 border border-gray-200"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                            Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-200 border border-gray-200"
                            placeholder="••••••••"
                          />
                        </div>
                        <motion.button
                          type="submit"
                          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition duration-200 shadow-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={loading}
                        >
                          {loading ? 'Signing In...' : 'Log In'}
                        </motion.button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Device-bound account. Log out first on other devices.
                        </p>
                      </form>
                    </motion.div>
                  )}
                  {activeTab === 'signup' && (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.p
                        ref={signupTitleRef}
                        className="text-xl font-bold text-gray-900 text-center mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Get Started
                      </motion.p>
                      <p className="text-sm text-gray-600 text-center mb-6">
                        Download the app for seamless signup!
                      </p>
                      <div className="flex space-x-3">
                        <motion.a
                          href="https://www.apple.com/app-store/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-black text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 transition duration-200 text-center"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          App Store
                        </motion.a>
                        <motion.a
                          href="https://play.google.com/store/apps/details?id=com.sbmindtechnologies.taxlawsghana"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-black text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 transition duration-200 text-center"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Play Store
                        </motion.a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Dashboard Section */}
            {user && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 shadow-lg"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <p
                    ref={welcomeRef}
                    className="text-lg font-bold text-gray-900 mb-1"
                  >
                    Welcome, {user.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Ready to dive into Tax Laws?
                  </p>
                </motion.div>
                <motion.div
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <p
                    ref={statusRef}
                    className="text-lg font-bold text-gray-900 mb-4"
                  >
                    Account Status
                  </p>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl mb-4">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                          paymentMade ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {paymentMade ? (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Active
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Inactive
                          </>
                        )}
                      </motion.div>
                      <p className="text-sm text-gray-600 flex-1">
                        {paymentMade
                          ? 'Full access unlocked! 🚀'
                          : 'One-time payment to activate.'}
                      </p>
                    </div>
                  </div>
                  {!paymentMade && (
                    <div className="space-y-3">
                      <motion.button
                        onClick={handlePayment}
                        className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 disabled:bg-green-400 transition duration-200 shadow-lg flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading || !paystackLoaded}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{paystackLoaded ? 'Pay 100 GHS' : 'Loading...'}</span>
                      </motion.button>
                      <motion.button
                        onClick={checkPaymentStatus}
                        className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 disabled:text-gray-400 transition duration-200 border border-gray-200 shadow-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                      >
                        Check Status
                      </motion.button>
                    </div>
                  )}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <motion.button
                      onClick={() => setDeleteModalOpen(true)}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition duration-200 shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Delete Account'}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200">
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
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaxLaws;
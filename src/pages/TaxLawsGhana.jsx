import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
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
const PAYSTACK_PUBLIC_KEY = 'pk_test_e08fd67e82c3ab835092c9451086a9df0b0492d7';
const VERIFY_PAYMENT_URL = `${supabaseUrl}/functions/v1/verify-payment`;
const WEB_PAYMENT_URL = 'https://sbmindtechnologies.com';

const TaxLaws = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [paymentMade, setPaymentMade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(!!window.PaystackPop);
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
      { opacity: 0, y: 40, force3D: true },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger: delay / 1000,
        ease: 'power3.out',
        force3D: true,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 90%',
          toggleActions: 'play none none none',
          once: true,
        },
        onComplete: () => {
          gsap.set(targets, { clearProps: 'willChange' });
          splitter.revert();
          if (ref.current.id === 'header-text') {
            console.log('Header animation completed!');
          }
        },
      }
    );
  };

  // Load Paystack script, preload fonts, and initialize animations
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = '/fonts/general.woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

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
        toast.error('Payment script failed to load. Please check your network and try again.');
      };
      document.body.appendChild(script);
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
    }
    animateText(headerRef, 'Tax Laws - Ghana Account', 'chars');
    animateText(loginTitleRef, 'Log In', 'words', 50, 0.5);
    animateText(signupTitleRef, 'Sign Up', 'words', 50, 0.5);
    if (user) {
      animateText(welcomeRef, `Welcome, ${user.email}`, 'words', 50, 0.5);
      animateText(statusRef, 'Account Status', 'words', 50, 0.5);
    }
  }, [user, paystackLoaded]);

  // Check payment status on mount
  useEffect(() => {
    const checkPaymentStatus = async () => {
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
    checkPaymentStatus();
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
      toast.success('Logged out successfully.');
    } catch (err) {
      console.error('Logout error:', err.message);
      toast.error('Failed to log out: ' + err.message);
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
            let attempts = 0;
            const maxAttempts = 3;
            let verifyResponse;
            while (attempts < maxAttempts) {
              try {
                console.log(`Verification attempt ${attempts + 1} to ${VERIFY_PAYMENT_URL}`);
                verifyResponse = await fetch(VERIFY_PAYMENT_URL, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({ reference: response.reference }),
                });
                console.log(`Verification attempt ${attempts + 1} status: ${verifyResponse.status}`);
                if (verifyResponse.ok) break;
                attempts++;
                console.warn(`Verification attempt ${attempts} failed with status: ${verifyResponse.status}`);
                if (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
                }
              } catch (err) {
                attempts++;
                console.warn(`Verification attempt ${attempts} failed with error: ${err.message}`);
                if (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                }
              }
            }

            if (!verifyResponse || !verifyResponse.ok) {
              console.error('All verification attempts failed');
              const paymentUrl = `${WEB_PAYMENT_URL}?email=${encodeURIComponent(user.email)}`;
              toast.error(
                `Failed to verify payment after ${maxAttempts} attempts. Please complete payment at ${WEB_PAYMENT_URL}.`,
                { duration: 5000 }
              );
              window.open(paymentUrl, '_blank');
              throw new Error('All verification attempts failed');
            }

            const verifyResult = await verifyResponse.json();
            console.log('Verification response:', verifyResult);
            if (verifyResult.data.status === 'success') {
              const { error } = await supabase
                .from('profiles')
                .update({ payment_made: true })
                .eq('id', user.id);
              if (error) throw error;
              setPaymentMade(true);
              toast.success('Payment successful! Your account is now active.');
            } else {
              throw new Error(`Transaction status: ${verifyResult.data.status}`);
            }
          } catch (err) {
            console.error('Payment verification error:', err.message);
            toast.error(`Failed to verify payment: ${err.message}. Please complete payment at ${WEB_PAYMENT_URL}.`, {
              duration: 5000,
            });
            window.open(`${WEB_PAYMENT_URL}?email=${encodeURIComponent(user.email)}`, '_blank');
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: '0.875rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.5rem',
            maxWidth: '95%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: { style: { background: '#10B981', color: '#fff' } },
          error: { style: { background: '#EF4444', color: '#fff' } },
        }}
      />
      {/* Loading Overlay */}
      {loading && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-6 w-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-white text-sm sm:text-base">Processing...</span>
          </div>
        </motion.div>
      )}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10">
        {/* Header */}
        <motion.p
          ref={headerRef}
          id="header-text"
          className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 sm:mb-8 text-center ${user ? 'mt-8' : 'mt-8'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Tax Laws - Ghana
        </motion.p>

        {/* Login Section */}
        {!user && (
          <div className="space-y-6">
            <motion.p
              ref={loginTitleRef}
              className="text-xl sm:text-2xl font-semibold text-gray-800 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Log In
            </motion.p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="Enter your password"
                />
              </div>
              <motion.button
                type="submit"
                className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                Log In
              </motion.button>
            </form>
          </div>
        )}

        {/* Signup Section */}
        {!user && (
          <div className="mt-8 space-y-6">
            <motion.p
              ref={signupTitleRef}
              className="text-xl sm:text-2xl font-semibold text-gray-800 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Sign Up
            </motion.p>
            <p className="text-sm text-gray-600 text-center">
              Sign up is only available through our mobile app. Download the Tax Laws - Ghana app from the App Store or Google Play to create an account.
            </p>
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 justify-center">
              <motion.a
                href="https://www.apple.com/app-store/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white p-3 rounded-lg font-semibold hover:bg-gray-900 transition duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                App Store
              </motion.a>
              <motion.a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white p-3 rounded-lg font-semibold hover:bg-gray-900 transition duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Google Play
              </motion.a>
            </div>
          </div>
        )}

        {/* Dashboard Section */}
        {user && (
          <motion.div
            className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-6 rounded-xl shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.p
              ref={welcomeRef}
              className="text-xl sm:text-2xl font-semibold text-gray-800 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Welcome, {user.email}
            </motion.p>
            <p className="text-sm text-gray-600 text-center">
              Manage your Tax Laws - Ghana account below.
            </p>
            <div>
              <motion.p
                ref={statusRef}
                className="text-xl sm:text-2xl font-semibold text-gray-800 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                Account Status
              </motion.p>
              <motion.div
                className={`mt-4 p-4 rounded-lg shadow-md border border-gray-200 bg-gradient-to-r ${
                  paymentMade ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'
                } flex items-center justify-between`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <p
                  className={`text-sm font-medium ${
                    paymentMade ? 'text-green-700' : 'text-red-700'
                  } flex-1`}
                >
                  {paymentMade
                    ? 'Active: You have full access to Tax Laws - Ghana.'
                    : 'Inactive: Please complete the one-time payment to unlock full access.'}
                </p>
                {paymentMade ? (
                  <motion.svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                ) : (
                  <motion.div
                    className="h-6 w-6 rounded-full bg-red-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </motion.div>
              {!paymentMade && (
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-4">
                  <motion.button
                    onClick={handlePayment}
                    className="w-full sm:w-auto bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !paystackLoaded}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {paystackLoaded ? 'Pay Now (100 GHS)' : 'Loading Payment...'}
                  </motion.button>
                  <motion.button
                    onClick={checkPaymentStatus}
                    className="w-full sm:w-auto bg-gray-600 text-white p-3 rounded-lg font-semibold hover:bg-gray-700 disabled:bg-gray-300 transition duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    Check Access
                  </motion.button>
                </div>
              )}
            </div>
            <motion.button
              onClick={handleLogout}
              className="w-full sm:w-auto bg-gray-600 text-white p-3 rounded-lg font-semibold hover:bg-gray-700 disabled:bg-gray-300 transition duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              Log Out
            </motion.button>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">Effective Date: August 30, 2025</p>
          <motion.a
            href="/"
            className="mt-4 inline-block bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back to Home
          </motion.a>
        </div>
      </div>
    </div>
  );
};

export default TaxLaws;
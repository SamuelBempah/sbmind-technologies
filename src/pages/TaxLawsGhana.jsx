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
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger: delay / 1000,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
          once: true,
        },
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16 sm:pt-20 p-4 sm:p-6 font-inter">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: '0.875rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          success: { style: { background: '#059669', color: '#fff' } },
          error: { style: { background: '#DC2626', color: '#fff' } },
        }}
      />
      {/* Loading Overlay */}
      {loading && (
        <motion.div
          className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center space-y-3">
            <motion.div
              className="h-10 w-10 border-3 border-t-blue-600 border-gray-300 rounded-full animate-spin"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-white text-sm font-medium tracking-wide">Processing...</span>
          </div>
        </motion.div>
      )}
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-6 sm:p-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p
            ref={headerRef}
            id="header-text"
            className="text-2xl font-bold text-gray-900"
          >
            Tax Laws - Ghana
          </p>
          {user && (
            <motion.button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Log Out
            </motion.button>
          )}
        </motion.div>

        {/* Login Section */}
        {!user && (
          <div className="space-y-6">
            <motion.p
              ref={loginTitleRef}
              className="text-xl font-semibold text-gray-800 text-center"
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
                  className="mt-1 w-full p-2.5 bg-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
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
                  className="mt-1 w-full p-2.5 bg-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-300 transition duration-200 shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  Log In
                </motion.button>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Note: Your account is tied to your device. Passwords cannot be reset. You must log out from your current device before logging into a new one.
              </p>
            </form>
          </div>
        )}

        {/* Signup Section */}
        {!user && (
          <div className="mt-6 pt-6 space-y-4">
            <motion.p
              ref={signupTitleRef}
              className="text-xl font-semibold text-gray-800 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Sign Up
            </motion.p>
            <p className="text-sm text-gray-600 text-center">
              Sign up is available through our mobile app. Download the Tax Laws - Ghana app to get started.
            </p>
            <div className="flex justify-center space-x-4">
              <motion.a
                href="https://www.apple.com/app-store/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-900 transition duration-200 shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                App Store
              </motion.a>
              <motion.a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-900 transition duration-200 shadow-sm"
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
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-sm p-6"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <p
                ref={welcomeRef}
                className="text-lg font-semibold text-gray-800"
              >
                Welcome, {user.email}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Manage your account and access Tax Laws - Ghana features.
              </p>
            </motion.div>
            <motion.div
              className="bg-white rounded-lg shadow-sm p-6"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <p
                ref={statusRef}
                className="text-lg font-semibold text-gray-800"
              >
                Account Status
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-md flex items-center space-x-3">
                <motion.div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    paymentMade ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {paymentMade ? (
                    <>
                      <svg
                        className="h-5 w-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Active
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Inactive
                    </>
                  )}
                </motion.div>
                <p className="text-sm text-gray-600 flex-1">
                  {paymentMade
                    ? 'You have full access to Tax Laws - Ghana.'
                    : 'Complete the one-time payment to unlock full access.'}
                </p>
              </div>
              {!paymentMade && (
                <div className="mt-4 flex space-x-4">
                  <motion.button
                    onClick={handlePayment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-300 transition duration-200 shadow-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !paystackLoaded}
                  >
                    {paystackLoaded ? 'Pay Now (100 GHS)' : 'Loading Payment...'}
                  </motion.button>
                  <motion.button
                    onClick={checkPaymentStatus}
                    className="bg-white text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-100 disabled:text-gray-400 disabled:bg-gray-50 transition duration-200 shadow-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                  >
                    Check Access
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Effective Date: August 30, 2025</p>
          <motion.a
            href="/"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Home
          </motion.a>
        </div>
      </div>
    </div>
  );
};

export default TaxLaws;
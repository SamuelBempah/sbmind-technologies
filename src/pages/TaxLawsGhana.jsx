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

// Use environment variable to determine Edge Function URL
const EDGE_FUNCTION_URL = import.meta.env.VITE_EDGE_FUNCTION_URL || 'https://nenvormxclecqlmsaarv.supabase.co/functions/v1/initialize-payment';
const VERIFY_PAYMENT_URL = import.meta.env.VITE_VERIFY_PAYMENT_URL || 'https://nenvormxclecqlmsaarv.supabase.co/functions/v1/verify-payment';
const PAYSTACK_PUBLIC_KEY = 'pk_test_e08fd67e82c3ab835092c9451086a9df0b0492d7';

const TaxLawsGhana = () => {
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
    // Preload font to avoid SplitText warning
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
        toast.error('Payment script failed to load. Check your network.');
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
    animateText(headerRef, 'Tax Laws Account', 'chars');
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
      console.log('Edge Function URL:', EDGE_FUNCTION_URL);

      let reference;
      try {
        console.log('Attempting to fetch payment reference');
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ email: user.email }),
        });

        console.log('Initialize response status:', response.status);
        console.log('Initialize response headers:', Object.fromEntries(response.headers));
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: 'Failed to parse error response' };
          }
          console.error('Initialize error:', errorData, 'Status:', response.status);
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        const result = await response.json();
        console.log('Initialize result:', result);
        reference = result.data?.reference;
        if (!reference) throw new Error('No transaction reference returned');
      } catch (err) {
        console.error('Failed to initialize payment:', err.message);
        toast.error('Failed to initialize payment: ' + err.message);
        throw err; // Temporarily disable fallback for debugging
        // reference = `TAXLAWS_${Math.floor(Math.random() * 1000000)}`;
        // console.log('Generated fallback reference:', reference);
        // toast('Using fallback transaction reference due to server error.', {
        //   style: { background: '#f59e0b', color: '#fff' },
        // });
      }

      console.log('Paystack reference:', reference);

      window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: 10000, // 100 GHS in kobo
        currency: 'GHS',
        ref: reference,
        channels: ['card', 'bank', 'ussd', 'mobile_money'],
        callback: async (response) => {
          try {
            console.log('Paystack callback:', response);
            console.log('Attempting to verify payment with reference:', response.reference);
            const verifyResponse = await fetch(VERIFY_PAYMENT_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({ reference: response.reference, email: user.email }),
            });

            console.log('Verify response status:', verifyResponse.status);
            console.log('Verify response headers:', Object.fromEntries(verifyResponse.headers));
            if (!verifyResponse.ok) {
              let verifyErrorData;
              try {
                verifyErrorData = await verifyResponse.json();
              } catch (e) {
                verifyErrorData = { error: 'Failed to parse error response' };
              }
              console.error('Verify error:', verifyErrorData, 'Status:', verifyResponse.status);
              throw new Error(verifyErrorData.error || `HTTP error ${verifyResponse.status}`);
            }

            const verifyResult = await verifyResponse.json();
            console.log('Verify result:', verifyResult);
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
            toast.error('Failed to verify payment: ' + err.message);
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
      toast.error('Failed to initialize payment: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center p-4">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontSize: '14px', padding: '12px 20px', borderRadius: '8px', maxWidth: '90%' },
          success: { style: { background: '#059669', color: '#fff' } },
          error: { style: { background: '#f87171', color: '#fff' } },
        }}
      />
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-3xl flex flex-col items-center">
        {/* Header */}
        <p
          ref={headerRef}
          id="header-text"
          className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 sm:mb-8 text-center"
        >
          Tax Laws Account
        </p>

        {/* Loading State */}
        {loading && <div className="text-sm sm:text-base text-gray-600">Loading...</div>}

        {/* Login Section */}
        {!user && (
          <div className="w-full space-y-6 sm:space-y-8">
            <p
              ref={loginTitleRef}
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 text-center"
            >
              Log In
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm sm:text-base font-medium text-gray-600"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm sm:text-base font-medium text-gray-600"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
              <motion.button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 sm:p-3 rounded-lg font-semibold hover:bg-blue-700"
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95, rotate: -2 }}
                disabled={loading}
              >
                Log In
              </motion.button>
            </form>
          </div>
        )}

        {/* Signup Section */}
        {!user && (
          <div className="w-full space-y-6 sm:space-y-8 mt-6 sm:mt-8">
            <p
              ref={signupTitleRef}
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 text-center"
            >
              Sign Up
            </p>
            <p className="text-sm sm:text-base text-gray-600 text-center">
              Sign up is only available through our mobile app. Please download the Tax Laws app from
              the App Store or Google Play to create an account.
            </p>
            <div className="mt-4 flex space-x-4 justify-center">
              <motion.a
                href="https://www.apple.com/app-store/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white p-2 sm:p-3 rounded-lg font-semibold hover:bg-gray-900"
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95, rotate: -2 }}
              >
                App Store
              </motion.a>
              <motion.a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white p-2 sm:p-3 rounded-lg font-semibold hover:bg-gray-900"
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95, rotate: -2 }}
              >
                Google Play
              </motion.a>
            </div>
          </div>
        )}

        {/* Dashboard Section */}
        {user && (
          <div className="w-full space-y-6 sm:space-y-8">
            <p
              ref={welcomeRef}
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 text-center"
            >
              Welcome, {user.email}
            </p>
            <p className="text-sm sm:text-base text-gray-600 text-center">
              Manage your Tax Laws account below.
            </p>
            <div>
              <p
                ref={statusRef}
                className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 text-center"
              >
                Account Status
              </p>
              <p
                className={`text-sm sm:text-base text-center ${
                  paymentMade ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
                }`}
              >
                {paymentMade
                  ? 'Active: You have full access to Tax Laws.'
                  : 'Inactive: Please complete the one-time payment to unlock full access.'}
              </p>
              {!paymentMade && (
                <motion.button
                  onClick={handlePayment}
                  className="mt-4 w-full sm:w-auto bg-blue-600 text-white p-2 sm:p-3 rounded-lg font-semibold hover:bg-blue-700"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  whileTap={{ scale: 0.95, rotate: -2 }}
                  disabled={loading || !paystackLoaded}
                >
                  {paystackLoaded ? 'Pay Now (100 GHS)' : 'Loading Payment...'}
                </motion.button>
              )}
            </div>
            <motion.button
              onClick={handleLogout}
              className="w-full sm:w-auto bg-gray-600 text-white p-2 sm:p-3 rounded-lg font-semibold hover:bg-gray-700"
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95, rotate: -2 }}
              disabled={loading}
            >
              Log Out
            </motion.button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm sm:text-base text-gray-600">Effective Date: August 30, 2025</p>
          <motion.a
            href="/"
            className="mt-4 inline-block bg-blue-600 text-white p-2 sm:p-3 rounded-lg font-semibold hover:bg-blue-700"
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95, rotate: -2 }}
          >
            Back to Home
          </motion.a>
        </div>
      </div>
    </div>
  );
};

export default TaxLawsGhana;
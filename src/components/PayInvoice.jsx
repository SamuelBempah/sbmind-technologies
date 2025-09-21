import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const PayInvoice = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const handleMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  // Animation variants for the logo
  const logoVariants = {
    initial: {
      scale: 0.5,
      opacity: 0,
      y: '40vh', // Center vertically in viewport
    },
    zoom: {
      scale: 1.2, // Zoom in
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
    move: {
      scale: 1, // Settle to normal size
      y: 0, // Move to top-center
      transition: { duration: 0.5, delay: 2 }, // 2-second delay after zoom
    },
  };

  // Animation variants for the modal container (border)
  const modalVariants = {
    initial: {
      opacity: 0,
      height: 0, // Start as a horizontal line
    },
    animate: {
      opacity: 1,
      height: 'auto', // Expand to original size
      transition: { duration: 0.5, delay: 2.5 }, // Start after logo moves
    },
  };

  // Animation variants for the content
  const contentVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.5, delay: 3 }, // Start after modal expands
    },
  };

  return (
    <>
      <Helmet>
        <title>Pay Invoice - SBMind Technologies</title>
        <meta name="description" content="Easily pay your invoice with SBMind Technologies using Mobile Money (MoMo). Choose between initial deposit or full payment options. Secure and hassle-free!" />
        <meta property="og:title" content="Pay Your Invoice with SBMind Technologies" />
        <meta property="og:description" content="Make secure payments for your SBMind Technologies invoice via Mobile Money (MoMo). Select initial deposit (30%) or full payment." />
        <meta property="og:image" content="https://lh3.googleusercontent.com/p/AF1QipM4dnMQhxz3SBcm218GU8LOHw7NEvGOkPTr-gR8=s1360-w1360-h1020-rw" />
        <meta property="og:image:alt" content="SBMind Technologies Logo" />
        <meta property="og:url" content="https://www.sbmindtechnologies.com/pay-invoice" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SBMind Technologies" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pay Your Invoice with SBMind Technologies" />
        <meta name="twitter:description" content="Pay your SBMind Technologies invoice securely via MoMo. Choose initial deposit or full payment and complete your transaction in minutes!" />
        <meta name="twitter:image" content="https://lh3.googleusercontent.com/p/AF1QipM4dnMQhxz3SBcm218GU8LOHw7NEvGOkPTr-gR8=s1360-w1360-h1020-rw" />
        <meta name="twitter:image:alt" content="SBMind Technologies Logo" />
        <meta name="twitter:site" content="@sbmindtech" />
      </Helmet>

      <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
        {/* Logo */}
        <div className="flex justify-center pt-4 sm:pt-6 absolute top-0 w-full">
          <motion.div
            variants={logoVariants}
            initial="initial"
            animate={['zoom', 'move']} // Run zoom, then move
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-md overflow-hidden"
          >
            <img
              src="https://lh3.googleusercontent.com/p/AF1QipM4dnMQhxz3SBcm218GU8LOHw7NEvGOkPTr-gR8=s1360-w1360-h1020-rw"
              alt="SBMind Technologies Logo"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Modal Container */}
        <motion.div
          variants={modalVariants}
          initial="initial"
          animate="animate"
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden relative"
        >
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            className="p-4 sm:p-6"
          >
            <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4 sm:mb-6">
              Pay Invoice
            </h1>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Select Payment Option</h2>
              <div className="space-y-3">
                <label className="flex items-center text-gray-600 text-sm sm:text-base">
                  <input
                    type="radio"
                    value="initial"
                    checked={selectedOption === 'initial'}
                    onChange={handleOptionChange}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  Initial Deposit (30% of total)
                </label>
                <label className="flex items-center text-gray-600 text-sm sm:text-base">
                  <input
                    type="radio"
                    value="full"
                    checked={selectedOption === 'full'}
                    onChange={handleOptionChange}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  Full Payment
                </label>
              </div>

              {selectedOption && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 sm:mt-6"
                >
                  <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Method of Payment</h2>
                  <div className="space-y-3">
                    <label className="flex items-center text-gray-600 text-sm sm:text-base">
                      <input
                        type="radio"
                        value="momo"
                        checked={paymentMethod === 'momo'}
                        onChange={handleMethodChange}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 mr-2 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRG9B9evkMqW3N020EhTPZ6J4tNs8X2BMHllYbIV4D4xzm7pWzqq3mB25egGbGltGv5o6c&usqp=CAU"
                            alt="MoMo Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        Mobile Money (MoMo)
                      </div>
                    </label>
                  </div>

                  {selectedOption === 'initial' && paymentMethod === 'momo' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg"
                    >
                      <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">
                        How to Pay Initial Deposit with No Charges
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        To avoid charges, make the deposit directly to a MoMo agent or via Momo Pay using the following details:
                      </p>
                      <ul className="text-xs sm:text-sm text-gray-600 list-disc pl-5 space-y-1">
                        <li>Phone Number: 0595114549</li>
                        <li>Name: SBMind Technologies / Samuel Boakye-Bempah</li>
                        <li>MoMo Pay Merchant ID: 955440 - SBMind Technologies</li>
                      </ul>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">
                        After payment, please send a screenshot or confirmation to our WhatsApp at +233559118581 for verification.
                      </p>
                    </motion.div>
                  )}

                  {selectedOption === 'full' && paymentMethod === 'momo' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 rounded-lg"
                    >
                      <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2">
                        How to Make Full Payment
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        Use the following details for full payment via MoMo:
                      </p>
                      <ul className="text-xs sm:text-sm text-gray-600 list-disc pl-5 space-y-1">
                        <li>Phone Number: 0595114549</li>
                        <li>Name: SBMind Technologies / Samuel Boakye-Bempah</li>
                        <li>MoMo Pay Merchant ID: 955440 - SBMind Technologies</li>
                      </ul>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">
                        After payment, please send a screenshot or confirmation to our WhatsApp at +233559118581 for verification.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default PayInvoice;
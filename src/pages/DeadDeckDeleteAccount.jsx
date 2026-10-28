import React from 'react';
import { motion } from 'framer-motion';

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">{title}</h2>
    {children}
  </section>
);

const P = ({ children, className = "" }) => (
  <p className={`text-sm sm:text-base text-gray-600 ${className}`}>{children}</p>
);

const UL = ({ children }) => (
  <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-2 space-y-2">{children}</ul>
);

const MAIL_SUBJECT = encodeURIComponent('Delete my Dead Deck account');
const MAIL_BODY = encodeURIComponent('Please delete my Dead Deck account and the data linked to it.\n\nMy Dead Deck tag: \nThe email address on my account: \n');

const DeadDeckDeleteAccount = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="p-4 sm:p-6 md:p-8 w-full max-w-3xl flex flex-col items-center"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">
          Dead Deck - Delete Your Account
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full space-y-6 sm:space-y-8"
        >
          <section>
            <P>
              This page explains how to delete your Dead Deck account and the data linked to it. Dead Deck is published by SBMind Technologies. The Game only needs an account for multiplayer and ranked play; the single-player modes work without one.
            </P>
          </section>

          <Section title="How to request deletion">
            <UL>
              <li>Send an email to <strong>info@sbmindtechnologies.com</strong> from the email address on your Dead Deck account, with the subject "Delete my Dead Deck account". If you signed in with Google, use the Google email address.</li>
              <li>Include your Dead Deck tag so we can find the account.</li>
              <li>We will confirm the request and delete the account within <strong>30 days</strong>.</li>
            </UL>
            <motion.div className="text-center mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <motion.a
                href={`mailto:info@sbmindtechnologies.com?subject=${MAIL_SUBJECT}&body=${MAIL_BODY}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block bg-blue-600 text-white p-2 sm:p-3 rounded-lg font-semibold"
              >
                Email a deletion request
              </motion.a>
            </motion.div>
          </Section>

          <Section title="What we delete">
            <UL>
              <li>Your account (sign-in email or Google link) and your Dead Deck tag.</li>
              <li>Your game profile: progress, cosmetics, in-game currency, statistics, ranked points and rank.</li>
              <li>Your friends list, friend requests, invitations and online status.</li>
            </UL>
          </Section>

          <Section title="What we may keep">
            <UL>
              <li>Limited records needed to prevent abuse and ban evasion (for example that an account was suspended), and records we must keep to meet legal obligations.</li>
              <li>Purchase records are held by Google Play, not by us. Deleting your account does not cancel or refund purchases.</li>
              <li>Backups are overwritten on our normal schedule, so deleted data may remain in a backup for a short time before it is erased.</li>
            </UL>
          </Section>

          <Section title="Data on your device">
            <P>
              Progress saved only on your device is not held by us. You can remove it by clearing the Game's storage in your Android settings or by uninstalling the Game.
            </P>
          </Section>

          <Section title="More information">
            <P>
              See our <a href="/deaddeck/privacy-policy" className="text-blue-600 hover:underline">Dead Deck Privacy Policy</a> for details about the data we collect and your rights. Questions? Contact <strong>info@sbmindtechnologies.com</strong>.
            </P>
          </Section>

          <motion.div className="text-center mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <motion.a
              href="/"
              whileHover={{ scale: 1.1, rotate: 2, backgroundColor: '#1d4ed8' }}
              whileTap={{ scale: 0.9, rotate: -2 }}
              className="mt-4 inline-block bg-blue-600 text-white p-2 sm:p-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </motion.a>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DeadDeckDeleteAccount;

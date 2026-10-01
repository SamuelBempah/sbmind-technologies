import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

const SplitText = ({
  text,
  className = "",
  delay = 100,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  onLetterAnimationComplete,
}) => {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const scrollTriggerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current || !text) return;

    const el = ref.current;
    animationCompletedRef.current = false;

    const absoluteLines = splitType === "lines";
    if (absoluteLines) el.style.position = "relative";

    let splitter;
    try {
      splitter = new GSAPSplitText(el, {
        type: splitType,
        absolute: absoluteLines,
        linesClass: "split-line",
      });
    } catch (error) {
      console.error("Failed to create SplitText:", error);
      return;
    }

    let targets;
    switch (splitType) {
      case "lines":
        targets = splitter.lines;
        break;
      case "words":
        targets = splitter.words;
        break;
      case "chars":
        targets = splitter.chars;
        break;
      default:
        targets = splitter.chars;
    }

    if (!targets || targets.length === 0) {
      console.warn("No targets found for SplitText animation");
      splitter.revert();
      return;
    }

    targets.forEach((t) => {
      t.style.willChange = "transform, opacity";
    });

    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? (marginMatch[2] || "px") : "px";
    const sign = marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
    const start = `top ${startPct}%${sign}`;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: "play none none none",
        once: true,
        onToggle: (self) => {
          scrollTriggerRef.current = self;
        },
      },
      smoothChildTiming: true,
      onComplete: () => {
        animationCompletedRef.current = true;
        gsap.set(targets, {
          ...to,
          clearProps: "willChange",
          immediateRender: true,
        });
        onLetterAnimationComplete?.();
      },
    });

    tl.set(targets, { ...from, immediateRender: false, force3D: true });
    tl.to(targets, {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
      force3D: true,
    });

    return () => {
      tl.kill();
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
      gsap.killTweensOf(targets);
      if (splitter) {
        splitter.revert();
      }
    };
  }, [
    text,
    delay,
    duration,
    ease,
    splitType,
    from,
    to,
    threshold,
    rootMargin,
    onLetterAnimationComplete,
  ]);

  return (
    <p
      ref={ref}
      className={`split-parent overflow-hidden inline-block whitespace-normal ${className}`}
      style={{
        textAlign,
        wordWrap: "break-word",
      }}
    >
      {text}
    </p>
  );
};

const VeltoqPrivacyPolicy = () => {
  const handleAnimationComplete = () => {
    console.log('Header animation completed!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="p-4 sm:p-6 md:p-8 w-full max-w-3xl flex flex-col items-center"
      >
        <SplitText
          text="Veltoq - Privacy Policy"
          className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 sm:mb-8"
          delay={100}
          duration={0.6}
          ease="power3.out"
          splitType="words"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full space-y-6 sm:space-y-8"
        >
          <section>
            <p className="text-sm sm:text-base text-gray-600">
              <strong>Last Updated:</strong> October 2026
            </p>
            <p className="text-sm sm:text-base text-gray-600 mt-4">
              Welcome to Veltoq. We respect your privacy and are committed to protecting it. This Privacy Policy explains how we handle your data when you use the Veltoq mobile application ("the App").
            </p>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Our core philosophy is simple: <strong>Veltoq operates locally on your device. We do not collect, store, or transmit your personal data, transaction history, or PINs.</strong>
            </p>
          </section>

          <section>
            <SplitText
              text="1. The AccessibilityService API (Important Disclosure)"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              Veltoq requires the use of the Android <strong>AccessibilityService API</strong> to function.
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-2 space-y-2">
              <li><strong>Why we use it:</strong> The AccessibilityService API is used exclusively to automate USSD (Unstructured Supplementary Service Data) sessions on your behalf. It allows the App to read USSD menus presented by your network operator and automatically select the correct options, providing a fast, zero-latency automation experience for mobile money and airtime transactions.</li>
              <li><strong>What data it accesses:</strong> The service only observes the USSD dialogue boxes on your screen during an active automation session to know which menu option to click next.</li>
              <li><strong>Data Privacy:</strong> <strong>None of the data observed by the AccessibilityService API is collected, stored, or transmitted.</strong> All automation is executed strictly on your local device. We do not monitor your screen outside of active Veltoq USSD sessions, and we never access, save, or share your security PINs.</li>
            </ul>
          </section>

          <section>
            <SplitText
              text="2. Data Collection and Offline Operation"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              Veltoq is designed to be an offline-first application. We do not require you to create an account, and we do not maintain servers that collect your personal information, phone numbers, contacts, or transaction history. Any information you input into the app (such as saved recipient numbers or PINs) is encrypted and stored <strong>only locally on your device</strong> using secure local storage.
            </p>
          </section>

          <section>
            <SplitText
              text="3. Third-Party Services (Advertising)"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              While Veltoq itself does not collect personal data, we use Google AdMob to display advertisements, which allows us to offer you free credits.
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-2 space-y-2">
              <li><strong>Google AdMob:</strong> Google may use advertising IDs and automatically collected device data (such as IP address and device identifiers) to serve personalized or non-personalized ads.</li>
              <li>For more information on how Google collects and uses data, please review the <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Privacy & Terms</a>.</li>
            </ul>
          </section>

          <section>
            <SplitText
              text="4. Security"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We value your trust in using Veltoq. By processing all USSD automations locally on your device, we eliminate the risks associated with transmitting sensitive transaction data over the internet. However, please remember that you are responsible for keeping your physical device and any saved local PINs secure.
            </p>
          </section>

          <section>
            <SplitText
              text="5. Changes to This Privacy Policy"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <SplitText
              text="6. Contact Us"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              If you have any questions or suggestions about our Privacy Policy, please contact us at: <strong>info@sbmindtechnologies.com</strong>
            </p>
          </section>

          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
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

export default VeltoqPrivacyPolicy;

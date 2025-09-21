import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

// SplitText Component (unchanged from provided code)
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

const PrivacyPolicy = () => {
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
          text="Privacy Policy"
          className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 sm:mb-8"
          delay={100}
          duration={0.6}
          ease="power3.out"
          splitType="chars"
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
            <SplitText
              text="1. Introduction"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services, including our website and service request form. Please read this policy carefully.
            </p>
          </section>

          <section>
            <SplitText
              text="2. Information We Collect"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We may collect the following types of information:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, company name, and other details provided through our service request form.</li>
              <li><strong>Project Information:</strong> Details about your project, including services selected, project goals, budget, timeline, and additional notes.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our website, such as IP address, browser type, and pages visited.</li>
            </ul>
          </section>

          <section>
            <SplitText
              text="3. How We Use Your Information"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-2">
              <li>Process and respond to your service requests.</li>
              <li>Communicate with you via email, phone, or WhatsApp, as per your preferred contact method.</li>
              <li>Improve our services and website functionality.</li>
              <li>Analyze usage trends to enhance user experience.</li>
            </ul>
          </section>

          <section>
            <SplitText
              text="4. How We Share Your Information"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We do not sell or rent your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-2">
              <li>Service providers who assist in processing your requests (e.g., EmailJS for sending emails).</li>
              <li>Legal authorities, if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <SplitText
              text="5. Data Security"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We implement reasonable security measures to protect your information, such as encryption and secure data storage. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <SplitText
              text="6. Your Rights"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-2">
              <li>Access, update, or delete your personal information.</li>
              <li>Opt out of communications by contacting us.</li>
              <li>Request information about how your data is used.</li>
            </ul>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              To exercise these rights, please contact us at <a href="mailto:info@sbmindtechnologies.com" className="text-blue-600 hover:underline">info@sbmindtechnologies.com</a>.
            </p>
          </section>

          <section>
            <SplitText
              text="7. Third-Party Services"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We use third-party services like EmailJS to process form submissions. These services have their own privacy policies, and we encourage you to review them. For EmailJS, visit their privacy policy for more details.
            </p>
          </section>

          <section>
            <SplitText
              text="8. Cookies and Tracking"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              Our website may use cookies to enhance user experience and track usage data. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <SplitText
              text="9. Changes to This Policy"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. Please check back periodically for updates.
            </p>
          </section>

          <section>
            <SplitText
              text="10. Payment and Refund Policy"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              To initiate a project, clients are required to make an initial deposit of 30% of the total project cost. Of this deposit, 7.5% will be remitted to the Tax Payers Office upon project approval to formalize the agreement between both parties. Upon satisfactory completion of the project, the remaining balance must be paid in full. If you are not satisfied with the final work, we offer a full refund of the initial deposit, which will be returned to your account promptly.
            </p>
          </section>

          <section>
            <SplitText
              text="11. Contact Us"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              Our main operations are based in Ghana, with dedicated remote agents available in Namibia, South Africa, and the United States to serve you. If you have questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Email: <a href="mailto:info@sbmindtechnologies.com" className="text-blue-600 hover:underline">info@sbmindtechnologies.com</a>
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              Phone: +233 559 118 581
            </p>
          </section>

          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-sm sm:text-base text-gray-600">
              Effective Date: August 30, 2025
            </p>
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

export default PrivacyPolicy;
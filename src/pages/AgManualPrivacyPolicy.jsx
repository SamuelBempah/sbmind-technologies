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

const AgManualPrivacyPolicy = () => {
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
          text="Privacy Policy for AG Manual"
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
            <SplitText
              text="1. Introduction"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              SBMind Technologies built the AG Manual app as a free-to-download app. While downloading the app is free, accessing certain manuals or content within the app requires a purchase. If you already own a physical copy of a manual, you may apply to redeem the digital version for free.
            </p>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              This page is used to inform visitors regarding our policies with the collection, use, and disclosure of Personal Information if anyone decided to use our Service.
            </p>
          </section>

          <section>
            <SplitText
              text="2. Information Collection and Use"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              For a better experience, while using our Service, we may require you to provide us with certain personally identifiable information. The information that we request will be retained by us and used as described in this privacy policy.
            </p>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              The app does use third-party services that may collect information used to identify you.
            </p>
          </section>

          <section>
            <SplitText
              text="3. Log Data"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We want to inform you that whenever you use our Service, in a case of an error in the app we collect data and information (through third-party products) on your phone called Log Data. This Log Data may include information such as your device Internet Protocol (“IP”) address, device name, operating system version, the configuration of the app when utilizing our Service, the time and date of your use of the Service, and other statistics.
            </p>
          </section>

          <section>
            <SplitText
              text="4. Cookies"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              Cookies are files with a small amount of data that are commonly used as anonymous unique identifiers. These are sent to your browser from the websites that you visit and are stored on your device's internal memory.
            </p>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              This Service does not use these “cookies” explicitly. However, the app may use third-party code and libraries that use “cookies” to collect information and improve their services. You have the option to either accept or refuse these cookies and know when a cookie is being sent to your device. If you choose to refuse our cookies, you may not be able to use some portions of this Service.
            </p>
          </section>

          <section>
            <SplitText
              text="5. Service Providers"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We may employ third-party companies and individuals due to the following reasons:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-2">
              <li>To facilitate our Service;</li>
              <li>To provide the Service on our behalf;</li>
              <li>To perform Service-related services; or</li>
              <li>To assist us in analyzing how our Service is used.</li>
            </ul>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              We want to inform users of this Service that these third parties have access to their Personal Information. The reason is to perform the tasks assigned to them on our behalf. However, they are obligated not to disclose or use the information for any other purpose.
            </p>
          </section>

          <section>
            <SplitText
              text="6. Security"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <SplitText
              text="7. Links to Other Sites"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              This Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us. Therefore, we strongly advise you to review the Privacy Policy of these websites. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
            </p>
          </section>

          <section>
            <SplitText
              text="8. Children’s Privacy"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              These Services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13 years of age. In the case we discover that a child under 13 has provided us with personal information, we immediately delete this from our servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we will be able to do the necessary actions.
            </p>
          </section>

          <section>
            <SplitText
              text="9. Changes to This Privacy Policy"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              We may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
          </section>

          <section>
            <SplitText
              text="10. Contact Us"
              className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
              delay={50}
              duration={0.5}
              splitType="words"
            />
            <p className="text-sm sm:text-base text-gray-600">
              If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us.
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
              Effective Date: August 23, 2026
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

export default AgManualPrivacyPolicy;

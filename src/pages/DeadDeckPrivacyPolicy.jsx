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

const Section = ({ title, children }) => (
  <section>
    <SplitText
      text={title}
      className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4"
      delay={50}
      duration={0.5}
      splitType="words"
    />
    {children}
  </section>
);

const P = ({ children, className = "" }) => (
  <p className={`text-sm sm:text-base text-gray-600 ${className}`}>{children}</p>
);

const UL = ({ children }) => (
  <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-2 space-y-2">{children}</ul>
);

const DeadDeckPrivacyPolicy = () => {
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
          text="Dead Deck - Privacy Policy"
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
            <P><strong>Last Updated:</strong> October 2026</P>
            <P className="mt-4">
              Dead Deck ("the Game") is published by SBMind Technologies ("we", "us", "our"), based in Ghana. This Privacy Policy explains what information the Game collects, how we use it, who we share it with, and the choices you have.
            </P>
            <P className="mt-2">
              <strong>Dead Deck contains intense violence, gore and horror and is for adults only (18+).</strong> You can play the single-player modes without an account. An account is only required if you choose to play multiplayer or ranked matches.
            </P>
          </section>

          <Section title="1. Information We Collect">
            <P>What we collect depends on how you play:</P>
            <UL>
              <li><strong>Single-player (no account):</strong> your progress, settings and purchases are stored on your device. We do not ask for your name or email. The advertising and technical data described below may still be collected.</li>
              <li><strong>Account (multiplayer and ranked only):</strong> you create an account on our website with an email address and password, or with your Google account. We receive your email address, a unique user ID and, for Google sign-in, your Google profile name. Passwords are handled by Google Firebase Authentication; we never see or store your password in readable form. You also choose a public username, your "Dead Deck tag".</li>
              <li><strong>Game profile:</strong> your tag, progress, cosmetics, in-game currency, statistics, ranked points, rank, season results and any account suspension status. This is stored in our cloud database (Google Firebase Firestore) so it follows you between devices.</li>
              <li><strong>Friends and presence:</strong> your friends list, friend requests, party invitations and whether you are online.</li>
              <li><strong>Matches, voice and text chat:</strong> party codes, lobby and match information, and the voice and text messages you send to other players in your party or match. We do not record or keep voice chat. Voice and text are delivered to the other players while you play.</li>
              <li><strong>Connection data:</strong> to find a match near you, the Game measures the connection delay to our servers and to cloud regions. Your IP address is processed for this and when you connect to online services. Because some matches are hosted on a player's device or connect peer to peer, other players in your match, or the relay service, may receive your IP address.</li>
              <li><strong>Advertising data:</strong> the Game shows ads through Google AdMob. Google may collect your advertising ID, IP address (which can indicate approximate location), device information and how you interact with ads.</li>
              <li><strong>Purchases:</strong> payments are processed by Google Play. We receive confirmation of what you bought, not your payment card details.</li>
              <li><strong>Device and diagnostic data:</strong> device model, operating system version, app version, crash logs and performance diagnostics.</li>
            </UL>
          </Section>

          <Section title="2. How We Use Your Information">
            <UL>
              <li>To run the Game, sign you in, save your progress and let you play with friends and other players.</li>
              <li>To match you with other players, run ranked seasons, leaderboards and rewards.</li>
              <li>To show ads, including rewarded ads, and to process purchases.</li>
              <li>To find and fix bugs, measure performance and keep the Game secure.</li>
              <li>To prevent cheating and abuse, including suspending accounts that break the rules.</li>
              <li>To respond to your questions and requests, and to meet legal obligations.</li>
            </UL>
          </Section>

          <Section title="3. Services We Use and Who Receives Data">
            <P>We do not sell your personal data. We share data only with the providers that help us run the Game, and with other players as described below:</P>
            <UL>
              <li><strong>Google Firebase (Authentication and Firestore):</strong> accounts, profile, friends, ranked data and settings. Our database is hosted in Europe.</li>
              <li><strong>Epic Online Services (Epic Games):</strong> player identity for online play, lobbies, peer-to-peer connections and voice chat.</li>
              <li><strong>Google AdMob and Google Play:</strong> advertising and purchases.</li>
              <li><strong>Fly.io:</strong> ranked match servers and matchmaking, hosted in South Africa.</li>
              <li><strong>Vercel and Amazon Web Services:</strong> website hosting and connection-delay measurement.</li>
              <li><strong>Unity Technologies:</strong> the game engine. If our main online services are unavailable, the Game may fall back to Unity Gaming Services for sign-in, friends, saves, multiplayer and voice.</li>
              <li><strong>Other players:</strong> in matches and parties, other players can see your tag, rank and cosmetics, and can hear and read what you send in chat.</li>
              <li><strong>Legal and safety:</strong> we may disclose information if the law requires it, or to protect players, our rights and the Game.</li>
            </UL>
            <P className="mt-2">
              For more on how Google uses data, see the <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Privacy &amp; Terms</a> page. Epic Games explains its practices in the <a href="https://www.epicgames.com/site/en-US/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Epic Games Privacy Policy</a>.
            </P>
          </Section>

          <Section title="4. Permissions the Game Asks For">
            <UL>
              <li><strong>Microphone:</strong> only for voice chat with other players. You can decline; the rest of the Game still works.</li>
              <li><strong>Internet and network state:</strong> to play online, show ads and save to your account.</li>
              <li><strong>Advertising ID:</strong> used by Google AdMob to serve and measure ads.</li>
              <li><strong>Notifications and vibration:</strong> where the Game offers them, for match alerts and feedback.</li>
            </UL>
          </Section>

          <Section title="5. Advertising Choices">
            <P>
              Where required (for example in the European Economic Area and the United Kingdom), the Game asks for your consent before showing personalised ads. You can reset your advertising ID or opt out of ad personalisation at any time in your Android settings (Settings, Google, Ads). If you opt out you will still see ads, but they will be less relevant to you.
            </P>
          </Section>

          <Section title="6. Chat, Conduct and Safety">
            <P>
              Voice and text chat connect you with other people. Please do not share personal information such as your address, phone number or passwords in chat. We may suspend or ban accounts for cheating, harassment or other abuse. To report a player or a problem, email us at the address below with the player's tag and what happened.
            </P>
          </Section>

          <Section title="7. How Long We Keep Information, and Deleting It">
            <P>
              We keep your account and game profile for as long as your account is active. Uninstalling the Game does not delete your account data.
            </P>
            <UL>
              <li><strong>To delete your account and data:</strong> email <strong>info@sbmindtechnologies.com</strong> from the email address on your account (or tell us your Dead Deck tag). We will delete your account, tag, profile, friends and social data within 30 days.</li>
              <li>We may keep limited records where needed to prevent abuse and ban evasion, to resolve disputes, or to meet legal obligations. Purchase records are also held by Google.</li>
              <li>Data held on your device can be removed by clearing the Game's storage or uninstalling it.</li>
            </UL>
          </Section>

          <Section title="8. Children's Privacy">
            <P>
              Dead Deck is not intended for anyone under 18, and we do not knowingly collect personal information from children. If you believe a child has given us personal information, contact us and we will delete it.
            </P>
          </Section>

          <Section title="9. International Transfers">
            <P>
              Our service providers operate in several countries, including in Europe, South Africa and the United States. Your information may be processed outside the country where you live. We use providers that apply appropriate safeguards to protect it.
            </P>
          </Section>

          <Section title="10. Security">
            <P>
              We use encrypted connections to our online services, and account passwords are handled by Google Firebase Authentication. No method of storage or transmission is completely secure, so we cannot guarantee absolute security. Please keep your account details private.
            </P>
          </Section>

          <Section title="11. Your Rights">
            <P>
              Under the Ghana Data Protection Act, 2012 (Act 843) and, where they apply to you, other laws such as the GDPR and the UK GDPR, you may have the right to access your personal data, correct it, delete it, receive a copy, object to or restrict how we use it, and withdraw consent you have given. To use any of these rights, contact us using the details below. You may also complain to your local data protection authority.
            </P>
          </Section>

          <Section title="12. Changes to This Privacy Policy">
            <P>
              We may update this Privacy Policy as the Game changes (for example when we add new features or services). We will post the new version on this page and update the "Last Updated" date.
            </P>
          </Section>

          <Section title="13. Contact Us">
            <P>
              If you have any questions about this Privacy Policy or want to use your rights, contact SBMind Technologies at: <strong>info@sbmindtechnologies.com</strong>
            </P>
          </Section>

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

export default DeadDeckPrivacyPolicy;

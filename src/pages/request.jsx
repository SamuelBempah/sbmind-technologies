import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { init, send } from '@emailjs/browser';
import { useNavigate } from 'react-router';
import styled from 'styled-components';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

// Initialize EmailJS with your public key
init('ngWWLaMMYSPgwJvXN');

// SplitText Component (unchanged)
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

// RotatingText Component (unchanged)
const RotatingText = React.forwardRef((props, ref) => {
  const {
    texts,
    transition = { type: "spring", damping: 25, stiffness: 300 },
    initial = { y: "100%", opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: "-120%", opacity: 0 },
    animatePresenceMode = "wait",
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = "first",
    loop = true,
    auto = true,
    splitBy = "characters",
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const textRefs = useRef(texts.map(() => React.createRef()));
  const containerRef = useRef(null);

  const splitIntoCharacters = (text) => {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (segment) => segment.segment);
    }
    return Array.from(text);
  };

  const elements = React.useMemo(() => {
    const currentText = texts[currentTextIndex];
    if (splitBy === "characters") {
      const words = currentText.split(" ");
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1,
      }));
    }
    if (splitBy === "words") {
      return currentText.split(" ").map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1,
      }));
    }
    if (splitBy === "lines") {
      return currentText.split("\n").map((line, i, arr) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1,
      }));
    }

    return currentText.split(splitBy).map((part, i, arr) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1,
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = React.useCallback(
    (index, totalChars) => {
      const total = totalChars;
      if (staggerFrom === "first") return index * staggerDuration;
      if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
      if (staggerFrom === "center") {
        const center = Math.floor(total / 2);
        return Math.abs(center - index) * staggerDuration;
      }
      if (staggerFrom === "random") {
        const randomIndex = Math.floor(Math.random() * total);
        return Math.abs(randomIndex - index) * staggerDuration;
      }
      return Math.abs(staggerFrom - index) * staggerDuration;
    },
    [staggerFrom, staggerDuration]
  );

  const handleIndexChange = React.useCallback(
    (newIndex) => {
      setCurrentTextIndex(newIndex);
      if (onNext) onNext(newIndex);
    },
    [onNext]
  );

  const next = React.useCallback(() => {
    const nextIndex =
      currentTextIndex === texts.length - 1
        ? loop
          ? 0
          : currentTextIndex
        : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) {
      handleIndexChange(nextIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = React.useCallback(() => {
    const prevIndex =
      currentTextIndex === 0
        ? loop
          ? texts.length - 1
          : currentTextIndex
        : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) {
      handleIndexChange(prevIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = React.useCallback(
    (index) => {
      const validIndex = Math.max(0, Math.min(index, texts.length - 1));
      if (validIndex !== currentTextIndex) {
        handleIndexChange(validIndex);
      }
    },
    [texts.length, currentTextIndex, handleIndexChange]
  );

  const reset = React.useCallback(() => {
    if (currentTextIndex !== 0) {
      handleIndexChange(0);
    }
  }, [currentTextIndex, handleIndexChange]);

  React.useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      jumpTo,
      reset,
    }),
    [next, previous, jumpTo, reset]
  );

  useEffect(() => {
    const measureWidths = () => {
      const currentRef = textRefs.current[currentTextIndex].current;
      if (currentRef) {
        const width = currentRef.getBoundingClientRect().width;
        setContainerWidth(width);
      }
    };

    measureWidths();
    window.addEventListener('resize', measureWidths);
    return () => window.removeEventListener('resize', measureWidths);
  }, [currentTextIndex]);

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(next, rotationInterval);
    return () => clearInterval(intervalId);
  }, [next, rotationInterval, auto]);

  function cn(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <motion.span
      ref={containerRef}
      className={cn(
        "relative inline-block whitespace-nowrap",
        mainClassName
      )}
      animate={{ width: containerWidth }}
      transition={{ type: "spring", damping: 30, stiffness: 400 }}
      {...rest}
    >
      <span className="sr-only">{texts[currentTextIndex]}</span>
      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.span
          key={currentTextIndex}
          className={cn(
            splitBy === "lines"
              ? "flex flex-col w-full"
              : "flex whitespace-nowrap relative"
          )}
          layout
          aria-hidden="true"
        >
          {elements.map((wordObj, wordIndex, array) => {
            const previousCharsCount = array
              .slice(0, wordIndex)
              .reduce((sum, word) => sum + word.characters.length, 0);
            return (
              <span key={wordIndex} className={cn("inline-flex", splitLevelClassName)}>
                {wordObj.characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(
                        previousCharsCount + charIndex,
                        array.reduce((sum, word) => sum + word.characters.length, 0)
                      ),
                    }}
                    className={cn("inline-block", elementLevelClassName)}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && <span className="whitespace-pre"> </span>}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
      {texts.map((text, index) => (
        <span
          key={index}
          ref={textRefs.current[index]}
          className={cn(
            "absolute pointer-events-none",
            mainClassName,
            splitLevelClassName
          )}
          style={{ whiteSpace: 'nowrap' }}
        >
          {text}
        </span>
      ))}
    </motion.span>
  );
});

RotatingText.displayName = "RotatingText";

const services = [
  'Website Development',
  'AI Integration',
  'LiveChat Integration',
  'Graphic Design',
  'Video Editing',
  'Management System',
  'Digital Marketing',
  'SEO Optimization',
  'Mobile App Development',
  'Custom Software'
];

const FirstLoader = () => {
  return (
    <StyledWrapper1>
      <div>
        <div className="ring-3">
          <div className="ring-2">
            <div className="ring-1">
              <div className="black-hole" />
              <div className="glow" />
            </div>
          </div>
        </div>
        <div className="container">
          <svg className="crescent crescent-1" viewBox="0 0 50 50">
            <path d="M 0 0 C 54 50 185 57 226 0 C 198 39 35 32 0 0" fill="#ffffff55" />
          </svg>
          <svg className="crescent crescent-2" viewBox="0 0 50 50">
            <path d="M 0 0 C 54 50 185 57 226 0 C 198 39 35 32 0 0" fill="#ffffff55" />
          </svg>
          <svg className="crescent crescent-3" viewBox="0 0 50 50">
            <path d="M 0 0 C 54 50 185 57 226 0 C 198 39 35 32 0 0" fill="#ffffff55" />
          </svg>
          <svg className="crescent crescent-4" viewBox="0 0 50 50">
            <path d="M 0 0 C 54 50 185 57 226 0 C 198 39 35 32 0 0" fill="#ffffff55" />
          </svg>
          <svg className="crescent crescent-5" viewBox="0 0 50 50">
            <path d="M 0 0 C 54 50 185 57 226 0 C 198 39 35 32 0 0" fill="#ffffff55" />
          </svg>
          <svg className="crescent crescent-6" viewBox="0 0 50 50">
            <path d="M 0 0 C 54 50 185 57 226 0 C 198 39 35 32 0 0" fill="#ffffff55" />
          </svg>
        </div>
      </div>
    </StyledWrapper1>
  );
}

const StyledWrapper1 = styled.div`
  .ring-3 {
    box-shadow: 0px 0px 10px 15px #fff;
    border-radius: 50%;
    padding: 2px;
  }
  .ring-2 {
    box-shadow: 0px 0px 2px 10px #000;
    border-radius: 50%;
    padding: 2px;
  }
  .ring-1 {
    box-shadow: 0px 0px 10px 15px #fff;
    border-radius: 50%;
    padding: 2px;
  }
  .black-hole {
    height: 128px;
    aspect-ratio: 1;
    background-color: black;
    border-radius: 50%;
    box-shadow:
      0px 0px 20px 10px #000,
      inset 0px 0px 10px #ffffff88;
  }
  .glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 350px;
    height: 350px;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.2) 5%,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0) 70%
    );
    border-radius: 50%;
    z-index: -1;
  }
  .container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotateX(75deg);
  }
  .crescent {
    filter: drop-shadow(0px 0px 5px #fff) drop-shadow(0px 0px 15px #fff)
      drop-shadow(0px 0px 25px #fff) drop-shadow(0px 0px 50px #fff);
    position: absolute;
    color: transparent !important;
    top: 50%;
    left: 50%;
    transform: rotate(180deg);
    width: 200px;
    height: 12px;
    clip-path: ellipse(60% 100% at 100% 50%); /* Hilal şekli */
    offset-path: path("M 0,-100 A 100,100 0 1,1 0,100 A 100,100 0 1,1 0,-100 Z");
    offset-distance: 0%;
    opacity: 0;
  }

  .crescent-1 {
    animation: moveOval 500ms ease-in-out 0ms infinite;
  }
  .crescent-2 {
    animation: moveOval 500ms ease-in-out 83ms infinite;
  }
  .crescent-3 {
    animation: moveOval 500ms ease-in-out 167ms infinite;
  }
  .crescent-4 {
    animation: moveOval 500ms ease-in-out 250ms infinite;
  }
  .crescent-5 {
    animation: moveOval 500ms ease-in-out 333ms infinite;
  }
  .crescent-6 {
    animation: moveOval 500ms ease-in-out 417ms infinite;
  }

  @keyframes moveOval {
    18% {
      offset-distance: 25%;
      opacity: 0;
    }
    25% {
      opacity: 1;
    }

    75% {
      opacity: 1;
    }
    100% {
      offset-distance: 90%;
      opacity: 0;
    }
  }
`;

const SecondLoader = () => {
  return (
    <StyledWrapper2>
      <div>
        <div className="clouds">
          <div className="cloud cloud1" />
          <div className="cloud cloud2" />
          <div className="cloud cloud3" />
          <div className="cloud cloud4" />
          <div className="cloud cloud5" />
        </div>
        <div className="loader">
          <span><span /><span /><span /><span /></span>
          <div className="base">
            <span />
            <div className="face" />
          </div>
        </div>
        <div className="longfazers">
          <span /><span /><span /><span />
        </div>
      </div>
    </StyledWrapper2>
  );
}

const StyledWrapper2 = styled.div`
  .loader {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-left: -50px;
    animation: speeder 0.4s linear infinite;
  }

  .loader > span {
    height: 5px;
    width: 35px;
    background: #f51313;
    position: absolute;
    top: -19px;
    left: 60px;
    border-radius: 2px 10px 1px 0;
  }

  .base span {
    position: absolute;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-right: 100px solid #f3cfcf;
    border-bottom: 6px solid transparent;
  }

  .base span:before {
    content: "";
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background: #f3cfcf;
    position: absolute;
    right: -110px;
    top: -16px;
  }

  .base span:after {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-top: 0 solid transparent;
    border-right: 55px solid #f3cfcf;
    border-bottom: 16px solid transparent;
    top: -16px;
    right: -98px;
  }

  .face {
    position: absolute;
    height: 12px;
    width: 20px;
    background: #f3cfcf;
    border-radius: 20px 20px 0 0;
    transform: rotate(-40deg);
    right: -125px;
    top: -15px;
  }

  .face:after {
    content: "";
    height: 12px;
    width: 12px;
    background: #f51313;
    right: 4px;
    top: 7px;
    position: absolute;
    transform: rotate(40deg);
    transform-origin: 50% 50%;
    border-radius: 0 0 2px 2px;
  }

  .loader > span > span {
    width: 30px;
    height: 1px;
    background: #ffffff;
    position: absolute;
  }

  .loader > span > span:nth-child(1) {
    animation: fazer1 0.2s linear infinite;
  }

  .loader > span > span:nth-child(2) {
    top: 3px;
    animation: fazer2 0.4s linear infinite;
  }

  .loader > span > span:nth-child(3) {
    top: 1px;
    animation: fazer3 0.4s linear infinite;
    animation-delay: -1s;
  }

  .loader > span > span:nth-child(4) {
    top: 4px;
    animation: fazer4 1s linear infinite;
    animation-delay: -1s;
  }

  @keyframes fazer1 {
    0% {
      left: 0;
    }
    100% {
      left: -80px;
      opacity: 0;
    }
  }

  @keyframes fazer2 {
    0% {
      left: 0;
    }
    100% {
      left: -100px;
      opacity: 0;
    }
  }

  @keyframes fazer3 {
    0% {
      left: 0;
    }
    100% {
      left: -50px;
      opacity: 0;
    }
  }

  @keyframes fazer4 {
    0% {
      left: 0;
    }
    100% {
      left: -150px;
      opacity: 0;
    }
  }

  @keyframes speeder {
    0% {
      transform: translate(2px, 1px) rotate(0deg);
    }
    10% {
      transform: translate(-1px, -3px) rotate(-1deg);
    }
    20% {
      transform: translate(-2px, 0px) rotate(1deg);
    }
    30% {
      transform: translate(1px, 2px) rotate(0deg);
    }
    40% {
      transform: translate(1px, -1px) rotate(1deg);
    }
    50% {
      transform: translate(-1px, 3px) rotate(-1deg);
    }
    60% {
      transform: translate(-1px, 1px) rotate(0deg);
    }
    70% {
      transform: translate(3px, 1px) rotate(-1deg);
    }
    80% {
      transform: translate(-2px, -1px) rotate(1deg);
    }
    90% {
      transform: translate(2px, 1px) rotate(0deg);
    }
    100% {
      transform: translate(1px, -2px) rotate(-1deg);
    }
  }

  .longfazers {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .longfazers span {
    position: absolute;
    height: 2px;
    width: 20%;
    background: #ffffff;
  }

  .longfazers span:nth-child(1) {
    top: 20%;
    animation: lf 0.6s linear infinite;
    animation-delay: -5s;
  }

  .longfazers span:nth-child(2) {
    top: 40%;
    animation: lf2 0.8s linear infinite;
    animation-delay: -1s;
  }

  .longfazers span:nth-child(3) {
    top: 60%;
    animation: lf3 0.6s linear infinite;
  }

  .longfazers span:nth-child(4) {
    top: 80%;
    animation: lf4 0.5s linear infinite;
    animation-delay: -3s;
  }

  @keyframes lf {
    0% {
      left: 200%;
    }
    100% {
      left: -200%;
      opacity: 0;
    }
  }

  @keyframes lf2 {
    0% {
      left: 200%;
    }
    100% {
      left: -200%;
      opacity: 0;
    }
  }

  @keyframes lf3 {
    0% {
      left: 200%;
    }
    100% {
      left: -100%;
      opacity: 0;
    }
  }

  @keyframes lf4 {
    0% {
      left: 200%;
    }
    100% {
      left: -100%;
      opacity: 0;
    }
  }

  /* ✅ CLOUDS - moving right to left with px values */
  .clouds {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
  }

  .cloud {
    position: absolute;
    background: #fff;
    border-radius: 50%;
    opacity: 0.25;
    animation: moveClouds linear infinite;
  }

  .cloud::before,
  .cloud::after {
    content: "";
    position: absolute;
    background: #fff;
    border-radius: 50%;
  }

  .cloud::before {
    width: 60%;
    height: 60%;
    top: -30%;
    left: 10%;
  }

  .cloud::after {
    width: 40%;
    height: 40%;
    top: -20%;
    left: 50%;
  }

  /* Clouds start off-screen (right) and move left */
  .cloud1 {
    width: 100px;
    height: 60px;
    top: 15%;
    left: 1400px; /* off-screen to the right */
    animation-duration: 2s;
  }

  .cloud2 {
    width: 150px;
    height: 80px;
    top: 35%;
    left: 1600px;
    animation-duration: 3s;
  }

  .cloud3 {
    width: 80px;
    height: 50px;
    top: 20%;
    left: 2000px;
    animation-duration: 4s;
  }
  .cloud4 {
    width: 100px;
    height: 80px;
    top: 70%;
    left: 1100px;
    animation-duration: 3s;
  }
  .cloud5 {
    width: 170px;
    height: 50px;
    top: 80%;
    left: 1500px;
    animation-duration: 2s;
  }

  @keyframes moveClouds {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-2000px);
    }
  }
`;

const ServiceRequestForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    contactMethod: '',
    selectedServices: [],
    projectDetails: '',
    projectGoals: [],
    budget: '',
    timeline: '',
    urgency: '',
    inspiration: '',
    additionalInfo: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const [emailStatus, setEmailStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isButtonSent, setIsButtonSent] = useState(false);
  const [showRingsOverlay, setShowRingsOverlay] = useState(false);
  const [showFirstLoader, setShowFirstLoader] = useState(true);
  const [showSecondLoader, setShowSecondLoader] = useState(false);
  const [showBlinkingText, setShowBlinkingText] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetPolicyAccepted, setBudgetPolicyAccepted] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callLanguage, setCallLanguage] = useState('English');
  const [callPhone, setCallPhone] = useState('');
  const [callErrors, setCallErrors] = useState({});
  const [callStatus, setCallStatus] = useState(null);
  const [isCallSubmitting, setIsCallSubmitting] = useState(false);

  useEffect(() => {
    if (showFirstLoader) {
      const timer1 = setTimeout(() => {
        setShowFirstLoader(false);
        setShowSecondLoader(true);
        setShowBlinkingText(true);
      }, 3000);
      return () => clearTimeout(timer1);
    } else if (showSecondLoader) {
      const timer2 = setTimeout(() => {
        setShowSecondLoader(false);
        setShowBlinkingText(false);
      }, 9000);
      return () => clearTimeout(timer2);
    }
  }, [showFirstLoader, showSecondLoader]);

  useEffect(() => {
    if (step === 9 && !budgetPolicyAccepted) {
      setShowBudgetModal(true);
    }
  }, [step, budgetPolicyAccepted]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleServiceToggle = (service) => {
    setFormData((prev) => {
      const selectedServices = prev.selectedServices.includes(service)
        ? prev.selectedServices.filter((s) => s !== service)
        : [...prev.selectedServices, service];
      return { ...formData, selectedServices };
    });
    setErrors((prev) => ({ ...prev, selectedServices: '' }));
  };

  const handleGoalToggle = (goal) => {
    setFormData((prev) => {
      const projectGoals = prev.projectGoals.includes(goal)
        ? prev.projectGoals.filter((g) => g !== goal)
        : [...prev.projectGoals, goal];
      return { ...formData, projectGoals };
    });
    setErrors((prev) => ({ ...prev, projectGoals: '' }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    switch (currentStep) {
      case 1:
        if (!formData.name) newErrors.name = 'I need your name to get started!';
        break;
      case 2:
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
          newErrors.email = 'Please provide a valid email address.';
        break;
      case 4:
        if (!formData.phone || !/^\+?\d{7,15}$/.test(formData.phone))
          newErrors.phone = 'Please provide a valid phone number.';
        break;
      case 5:
        if (!formData.contactMethod)
          newErrors.contactMethod = 'How should I reach out to you?';
        break;
      case 6:
        if (formData.selectedServices.length === 0)
          newErrors.selectedServices = 'Pick at least one service to proceed!';
        break;
      case 7:
        if (!formData.projectDetails)
          newErrors.projectDetails = 'Tell me about your project!';
        break;
      case 8:
        if (formData.projectGoals.length === 0)
          newErrors.projectGoals = 'What are you aiming to achieve?';
        break;
      case 9:
        if (!formData.budget || isNaN(formData.budget) || formData.budget < 100)
          newErrors.budget = 'Please enter a valid budget of at least 100 GHS.';
        break;
      case 10:
        if (!formData.timeline)
          newErrors.timeline = 'How soon do you need this project completed?';
        break;
      case 11:
        if (!formData.urgency)
          newErrors.urgency = 'How urgent is this project?';
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step < 14 && validateStep(step)) {
      if (step === 9 && !budgetPolicyAccepted) {
        setShowBudgetModal(true);
        return;
      }
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleAcceptPolicy = () => {
    setBudgetPolicyAccepted(true);
    setShowBudgetModal(false);
  };

  const handleSubmit = async () => {
    if (validateStep(step)) {
      setIsButtonSent(true);
      setTimeout(async () => {
        setIsSubmitting(true);
        setIsDarkMode(true);
        try {
          const emailData = {
            to_email: 'ixy.chase@gmail.com',
            from_name: formData.name || 'Service Request Form',
            subject: 'New Service Request Submission',
            message: `
              New Service Request Submitted:
              Name: ${formData.name}
              Email: ${formData.email}
              Company: ${formData.company || 'N/A'}
              Phone: ${formData.phone}
              Contact Method: ${formData.contactMethod}
              Selected Services: ${formData.selectedServices.join(', ') || 'None'}
              Project Details: ${formData.projectDetails}
              Project Goals: ${formData.projectGoals.join(', ') || 'None'}
              Budget: ${formData.budget} GHS
              Timeline: ${formData.timeline}
              Urgency: ${formData.urgency}
              Inspiration: ${formData.inspiration || 'N/A'}
              Additional Info: ${formData.additionalInfo || 'N/A'}
            `,
          };

          await send('service_h7eab5v', 'template_jkio1vf', emailData);
          setTimeout(() => {
            setEmailStatus('success');
            setFormSubmitted(true);
            setIsSubmitting(false);
            setIsDarkMode(false);
            setIsButtonSent(false);
            // Delay for 5 seconds after showing success message
            setTimeout(() => {
              setShowRingsOverlay(true);
              // Show rings overlay for 5 seconds, then navigate to homepage
              setTimeout(() => {
                navigate('/');
              }, 6000);
            }, 6000);
          }, 3000);
        } catch (error) {
          console.error('Email sending failed:', error);
          setEmailStatus('error');
          setIsSubmitting(false);
          setIsDarkMode(false);
          setIsButtonSent(false);
        }
      }, 1000);
    }
  };

  const handleSubmitCall = async () => {
    const newErrors = {};
    if (!callPhone || !/^\+?\d{7,15}$/.test(callPhone)) {
      newErrors.phone = 'Please provide a valid phone number.';
    }
    setCallErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsCallSubmitting(true);
    try {
      const emailData = {
        to_email: 'ixy.chase@gmail.com',
        from_name: 'Call Request',
        subject: 'New Call Request',
        message: `A call request made to you.\nLanguage: ${callLanguage}\nPhone: ${callPhone}`,
      };
      await send('service_h7eab5v', 'template_jkio1vf', emailData);
      setCallStatus('success');
      setTimeout(() => {
        setShowCallModal(false);
        setCallLanguage('English');
        setCallPhone('');
        setCallErrors({});
        setCallStatus(null);
        setIsCallSubmitting(false);
      }, 3000);
    } catch (error) {
      console.error('Call request email failed:', error);
      setCallStatus('error');
      setIsCallSubmitting(false);
    }
  };

  const handleAnimationComplete = () => {
    console.log('Welcome message animation completed!');
  };

  const getSectionHeader = () => {
    if (step >= 1 && step <= 5) {
      return (
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg sm:text-xl font-semibold text-gray-800 mb-4"
        >
          Tell us about yourself
        </motion.h2>
      );
    } else if (step >= 6 && step <= 8) {
      return (
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg sm:text-xl font-semibold text-gray-800 mb-4"
        >
          What’s your project about?
        </motion.h2>
      );
    } else if (step >= 9 && step <= 11) {
      return (
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg sm:text-xl font-semibold text-gray-800 mb-4"
        >
          Budget and timeline details
        </motion.h2>
      );
    } else if (step >= 12 && step <= 13) {
      return (
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg sm:text-xl font-semibold text-gray-800 mb-4"
        >
          Any extra details?
        </motion.h2>
      );
    }
    return null;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="text-center relative bg-gradient-to-r from-cyan-100 to-blue-100 p-4 sm:p-6 rounded-lg w-full"
          >
            <SplitText
              text="Hey there! Ready to create something awesome?"
              className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={1}
              textAlign="center"
              onLetterAnimationComplete={handleAnimationComplete}
            />
            <motion.button
              whileHover={{ scale: 1.1, rotate: 2, backgroundColor: '#1d4ed8' }}
              whileTap={{ scale: 0.9, rotate: -2 }}
              onClick={handleNext}
              className="bg-blue-600 text-white p-2 sm:p-3 rounded-lg font-semibold transition-colors w-full sm:w-auto"
            >
              Let's Get Started!
            </motion.button>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Hey, what's your name?
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 ${
                errors.name ? 'ring-2 ring-red-500' : ''
              }`}
              placeholder="Your Name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name}</p>
            )}
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              What's the best email to reach you at?
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 ${
                errors.email ? 'ring-2 ring-red-500' : ''
              }`}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</p>
            )}
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Do you have a company name? (Optional)
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
              placeholder="Your Company"
            />
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              What's your phone number? (Preferably WhatsApp)
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 ${
                errors.phone ? 'ring-2 ring-red-500' : ''
              }`}
              placeholder="+233123456789"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone}</p>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Please include country code (e.g., +233 for Ghana).
            </p>
          </motion.div>
        );
      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              How should we contact you?
            </label>
            <div className="mt-2 space-y-2">
              {['Email', 'Phone', 'Both'].map((method) => (
                <label key={method} className="flex items-center text-sm sm:text-base">
                  <input
                    type="radio"
                    name="contactMethod"
                    value={method.toLowerCase()}
                    checked={formData.contactMethod === method.toLowerCase()}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  {method}
                </label>
              ))}
            </div>
            {errors.contactMethod && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.contactMethod}</p>
            )}
          </motion.div>
        );
      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Which services are you interested in?
            </label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {services.map((service) => (
                <motion.div
                  key={service}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 sm:p-3 rounded-lg cursor-pointer text-center text-sm sm:text-base ${
                    formData.selectedServices.includes(service)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => handleServiceToggle(service)}
                >
                  {service}
                </motion.div>
              ))}
            </div>
            {errors.selectedServices && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.selectedServices}</p>
            )}
          </motion.div>
        );
      case 7:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Tell us about your dream project!
            </label>
            <motion.textarea
              whileFocus={{ scale: 1.02 }}
              name="projectDetails"
              value={formData.projectDetails}
              onChange={handleInputChange}
              className={`mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 ${
                errors.projectDetails ? 'ring-2 ring-red-500' : ''
              }`}
              rows="4"
              placeholder="What's your vision?"
            />
            {errors.projectDetails && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.projectDetails}</p>
            )}
          </motion.div>
        );
      case 8:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              What are your main goals for this project?
            </label>
            <div className="mt-2 space-y-2">
              {['Increase Sales', 'Improve User Experience', 'Brand Awareness', 'Launch New Product'].map((goal) => (
                <label key={goal} className="flex items-center text-sm sm:text-base">
                  <input
                    type="checkbox"
                    value={goal}
                    checked={formData.projectGoals.includes(goal)}
                    onChange={() => handleGoalToggle(goal)}
                    className="mr-2"
                  />
                  {goal}
                </label>
              ))}
            </div>
            {errors.projectGoals && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.projectGoals}</p>
            )}
          </motion.div>
        );
      case 9:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              What's your budget for this project? (in GHS)
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="number"
              name="budget"
              min="100"
              value={formData.budget}
              onChange={handleInputChange}
              className={`mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 ${
                errors.budget ? 'ring-2 ring-red-500' : ''
              }`}
              placeholder="Enter amount in Ghana Cedi (min 100)"
            />
            {errors.budget && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.budget}</p>
            )}
          </motion.div>
        );
      case 10:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              How soon do you need this project completed?
            </label>
            <select
              name="timeline"
              value={formData.timeline}
              onChange={handleInputChange}
              className={`mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 ${
                errors.timeline ? 'ring-2 ring-red-500' : ''
              }`}
            >
              <option value="">Select Timeline</option>
              <option value="1-2">1-2 Weeks</option>
              <option value="2-4">2-4 Weeks</option>
              <option value="1-3">1-3 Months</option>
              <option value="3+">3+ Months</option>
            </select>
            {errors.timeline && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.timeline}</p>
            )}
          </motion.div>
        );
      case 11:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              How urgent is this project?
            </label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleInputChange}
              className={`mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 ${
                errors.urgency ? 'ring-2 ring-red-500' : ''
              }`}
            >
              <option value="">Select Urgency</option>
              <option value="low">Low (Can wait)</option>
              <option value="medium">Medium (Sooner is better)</option>
              <option value="high">High (Need it ASAP)</option>
            </select>
            {errors.urgency && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.urgency}</p>
            )}
          </motion.div>
        );
      case 12:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Got any websites or projects that inspire you? (Optional)
            </label>
            <motion.textarea
              whileFocus={{ scale: 1.02 }}
              name="inspiration"
              value={formData.inspiration}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
              rows="3"
              placeholder="Share links or ideas that excite you!"
            />
          </motion.div>
        );
      case 13:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              Anything else we should know? (Optional)
            </label>
            <motion.textarea
              whileFocus={{ scale: 1.02 }}
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
              rows="3"
              placeholder="Any final thoughts or details?"
            />
          </motion.div>
        );
      case 14:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="text-center relative"
          >
            <p className="text-base sm:text-lg font-medium text-gray-700 mb-4">
              Looks great! Ready to submit your request?
            </p>
            <motion.button
              className="button w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 1 }} 
            >
              <div className="outline"></div>
              <div className={`state state--default ${isButtonSent ? 'absolute' : ''}`}>
                <div className="icon">
                  <svg
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g style={{ filter: 'url(#shadow)' }}>
                      <path
                        d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                        fill="currentColor"
                      ></path>
                    </g>
                    <defs>
                      <filter id="shadow">
                        <feDropShadow
                          dx="0"
                          dy="1"
                          stdDeviation="0.6"
                          floodOpacity="0.5"
                        />
                      </filter>
                    </defs>
                  </svg>
                </div>
                <p>
                  <span style={{ '--i': 0 }}>Y</span>
                  <span style={{ '--i': 1 }}>e</span>
                  <span style={{ '--i': 2 }}>s</span>
                  <span style={{ '--i': 3 }}>!</span>
                  
                  <span style={{ '--i': 7 }}>S</span>
                  <span style={{ '--i': 8 }}>u</span>
                  <span style={{ '--i': 9 }}>b</span>
                  <span style={{ '--i': 10 }}>m</span>
                  <span style={{ '--i': 11 }}>i</span>
                  <span style={{ '--i': 12 }}>t</span>
                  <span style={{ '--i': 13 }}>!</span>
                </p>
              </div>
              <div className={`state state--sent ${isButtonSent ? 'flex' : 'hidden'}`}>
                <div className="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    height="1em"
                    width="1em"
                    strokeWidth="0.5px"
                    stroke="black"
                  >
                    <g style={{ filter: 'url(#shadow)' }}>
                      <path
                        fill="currentColor"
                        d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
                      ></path>
                      <path
                        fill="currentColor"
                        d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
                      ></path>
                    </g>
                  </svg>
                </div>
                <p>
                  <span style={{ '--i': 5 }}>B</span>
                  <span style={{ '--i': 6 }}>H</span>
                  <span style={{ '--i': 7 }}>A</span>
                  <span style={{ '--i': 8 }}>M</span>
                </p>
              </div>
            </motion.button>
            {emailStatus === 'success' && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-green-600 text-sm mt-2"
              >
                Email sent successfully!
              </motion.p>
            )}
            {emailStatus === 'error' && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-red-600 text-sm mt-2"
              >
                Failed to send email. Please try again.
              </motion.p>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen">
      <AnimatePresence>
        {showFirstLoader && (
          <motion.div
            key="first-loader"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 flex items-center justify-center bg-black z-50"
          >
            <FirstLoader />
          </motion.div>
        )}
        {showSecondLoader && (
          <motion.div
            key="second-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50"
          >
            <SecondLoader />
            {showBlinkingText && (
              <motion.p
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white text-xl sm:text-2xl font-bold text-center"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                SBMind Technologies: Hang tight, we’re rolling in soon! 🚀
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!showFirstLoader && !showSecondLoader && (
        <motion.div
          className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}
          animate={{ opacity: isDarkMode ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="p-4 sm:p-6 md:p-8 w-full max-w-2xl flex flex-col items-center"
          >
            <RotatingText
              texts={services}
              mainClassName="px-2 sm:px-3 md:px-4 bg-cyan-300 text-black overflow-hidden py-0.5 sm:py-1 md:py-2 rounded-lg text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
            <motion.div
              className="w-full mb-4"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 14) * 100}%` }}
              transition={{ duration: 0.5 }}
            >
              <div className="h-2 bg-blue-500 rounded-full" />
            </motion.div>
            <div className="text-center text-xs sm:text-sm text-gray-600 mb-4">
              Step {step + 1} of 15
            </div>
            <AnimatePresence mode="wait">
              {formSubmitted ? (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-green-600 text-base sm:text-lg"
                >
                  Awesome! Your request has been submitted! An agent will contact you within 24 hours.
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  className="w-full space-y-4 sm:space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {getSectionHeader()}
                  {renderStep()}
                  {step < 14 && step > 0 && (
                    <div className="flex justify-between">
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 2, backgroundColor: '#4b5563' }}
                        whileTap={{ scale: 0.9, rotate: -2 }}
                        onClick={handleBack}
                        className="bg-gray-300 text-gray-700 p-2 sm:p-3 rounded-lg font-semibold transition-colors w-full sm:w-auto"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 2, backgroundColor: '#1d4ed8' }}
                        whileTap={{ scale: 0.9, rotate: -2 }}
                        onClick={handleNext}
                        className="bg-blue-600 text-white p-2 sm:p-3 rounded-lg font-semibold transition-colors w-full sm:w-auto"
                      >
                        Next
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {!showFirstLoader && !showSecondLoader && !isSubmitting && !showRingsOverlay && (
              <motion.p
                className="mt-6 text-blue-600 cursor-pointer text-sm sm:text-base"
                onClick={() => setShowCallModal(true)}
                whileHover={{ scale: 1.05 }}
              >
                Wanna talk to us? Request a call
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
        >
          <div className="orwellian-container">
            <div className="orwellian-loader">
              <div className="eye">
                <div className="pupil"></div>
                <div className="eyelid"></div>
              </div>
              <div className="spotlight"></div>
              <div className="text">BIG BROTHER IS SUBMITTING</div>
              <div className="scan-lines"></div>
              <div className="tv-effect"></div>
            </div>
          </div>
        </motion.div>
      )}
      {showRingsOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
        >
          <div className="rings anim-pan">
            <div style={{ "--delay": "06" }} className="ring anim-zoomIn"></div>
            <div style={{ "--delay": "04" }} className="ring anim-zoomIn"></div>
            <div style={{ "--delay": "03" }} className="ring anim-zoomIn"></div>
            <div style={{ "--delay": "02" }} className="ring anim-zoomIn"></div>
            <div style={{ "--delay": "01" }} className="ring anim-zoomIn"></div>
            <div style={{ "--delay": "00" }} className="ring anim-zoomIn"></div>
          </div>
        </motion.div>
      )}
      <AnimatePresence>
        {showBudgetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg max-w-md w-full text-center"
            >
              <h3 className="text-lg font-bold mb-4">Deposit Policy</h3>
              <p className="text-sm text-gray-700 mb-6">
                To initiate a project, clients are required to make an initial deposit of 30% of the total project cost. Of this deposit, 7.5% will be remitted to the Tax Payers Office upon project approval to formalize the agreement between both parties. Upon satisfactory completion of the project, the remaining balance must be paid in full. If you are not satisfied with the final work, we offer a full refund of the initial deposit, which will be returned to your account promptly.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAcceptPolicy}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                I Accept
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg max-w-md w-full text-center space-y-4"
            >
              {callStatus === 'success' ? (
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4"
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                  <p className="text-green-600 text-lg">
                    Your request has been sent, an agent will call you soon.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-4">Request a Call</h3>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Language
                  </label>
                  <select
                    value={callLanguage}
                    onChange={(e) => setCallLanguage(e.target.value)}
                    className="mt-1 block w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                  >
                    <option value="English">English</option>
                    <option value="TWI">TWI</option>
                  </select>
                  <label className="block text-sm font-medium text-gray-700 mt-4">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={callPhone}
                    onChange={(e) => {
                      setCallPhone(e.target.value);
                      setCallErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    className={`mt-1 block w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 ${
                      callErrors.phone ? 'ring-2 ring-red-500' : ''
                    }`}
                    placeholder="+233123456789"
                  />
                  {callErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{callErrors.phone}</p>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmitCall}
                    disabled={isCallSubmitting}
                    className={`bg-blue-600 text-white font-semibold mt-4 flex items-center justify-center transition-all duration-300 ${isCallSubmitting ? 'rounded-full w-12 h-12 p-0' : 'px-4 py-2 rounded-lg'}`}
                  >
                    {isCallSubmitting ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="text-2xl"
                      >
                        ↻
                      </motion.span>
                    ) : (
                      'Request Call'
                    )}
                  </motion.button>
                  {callStatus === 'error' && (
                    <p className="text-red-600 text-sm mt-2">
                      Failed to send request. Please try again.
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>
        {`
          /* Orwellian Loader Styles (optimized for performance: reduced filter/blur usage, simplified animations) */
          .orwellian-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            margin: 0;
            overflow: hidden;
            font-family: "Arial Black", "Helvetica Neue", Arial, sans-serif;
            font-weight: 900;
          }
          .orwellian-container .orwellian-loader {
            width: 280px;
            height: 280px;
            background-color: #000;
            border: 10px solid #333;
            position: relative;
            overflow: hidden;
            padding: 20px;
            box-sizing: border-box;
            will-change: transform;
          }
          .orwellian-container .eye {
            width: 160px;
            height: 60px;
            background-color: #fff;
            border-radius: 50%;
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -60%);
            animation: pulse 2s infinite;
            overflow: hidden;
            z-index: 10;
          }
          .orwellian-container .pupil {
            width: 50px;
            height: 50px;
            background-color: #000;
            border-radius: 50%;
            position: absolute;
            top: 33%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: look-diagonal 4s infinite ease-in-out;
          }
          .orwellian-container .pupil::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 30px;
            height: 30px;
            background: radial-gradient(circle, rgb(255, 0, 0) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.7;
          }
          .orwellian-container .eyelid {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: #000;
            animation: blink 4s infinite;
          }
          .orwellian-container .spotlight {
            position: absolute;
            top: 30%;
            left: 50%;
            width: 47px;
            height: 200px;
            background: linear-gradient(to bottom, rgba(255, 0, 0, 0.8), transparent);
            transform-origin: top;
            animation: spotlight-sweep-diagonal 4s infinite ease-in-out;
          }
          .orwellian-container .text {
            position: absolute;
            bottom: 20px;
            left: 10px;
            right: 10px;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            color: #f8d17c;
            text-transform: uppercase;
            letter-spacing: 1px;
            animation: glitch 1s infinite;
            z-index: 20;
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
            user-select: none;
          }
          .orwellian-container .scan-lines {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              to bottom,
              transparent 50%,
              rgba(0, 0, 0, 0.3) 50%
            );
            background-size: 100% 4px;
            animation: scan 10s linear infinite;
            z-index: 30;
            opacity: 0.3;
            pointer-events: none;
          }
          .orwellian-container .tv-effect {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
              linear-gradient(
                90deg,
                rgba(255, 0, 0, 0.06),
                rgba(0, 255, 0, 0.02),
                rgba(0, 0, 255, 0.06)
              );
            background-size: 100% 2px, 3px 100%;
            animation: tv-flicker 0.15s infinite;
            z-index: 35;
            pointer-events: none;
            opacity: 0.5;
          }
          .orwellian-container .tv-effect::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
                circle at center,
                rgba(255, 255, 255, 0.1) 0%,
                transparent 80%
              ),
              repeating-radial-gradient(
                circle at center,
                rgba(0, 0, 0, 0) 0,
                rgba(0, 0, 0, 0.1) 1px,
                transparent 1px,
                transparent 4px
              );
            background-size: 100% 100%, 3px 3px;
            pointer-events: none;
          }
          .orwellian-container .orwellian-loader::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              0deg,
              rgba(255, 255, 255, 0.03),
              rgba(255, 255, 255, 0.03) 1px,
              transparent 1px,
              transparent 2px
            );
            pointer-events: none;
            z-index: 40;
          }
          .orwellian-container .orwellian-loader::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              circle at center,
              transparent 30%,
              rgba(0, 0, 0, 0.5) 90%
            );
            z-index: 35;
            pointer-events: none;
          }
          .orwellian-container .spotlight::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              circle at top,
              rgba(255, 255, 255, 0.2) 0%,
              transparent 70%
            );
          }
          .orwellian-container .orwellian-loader {
            animation: subtle-rotate 6s infinite ease-in-out;
          }
          @keyframes look-diagonal {
            0%, 100% {
              transform: translateX(-50%) rotate(0deg);
            }
            25% {
              transform: translateX(-40%) rotate(-15deg);
            }
            75% {
              transform: translateX(-60%) rotate(15deg);
            }
          }
          @keyframes spotlight-sweep-diagonal {
            0%, 100% {
              transform: translateX(-50%) rotate(0deg);
            }
            25% {
              transform: translateX(-40%) rotate(-15deg);
            }
            75% {
              transform: translateX(-60%) rotate(15deg);
            }
          }
          @keyframes pulse {
            0%, 100% {
              transform: translate(-50%, -60%) scale(1);
            }
            50% {
              transform: translate(-50%, -60%) scale(1.05);
            }
          }
          @keyframes glitch {
            0%, 100% {
              transform: translate(0, 0);
              opacity: 1;
            }
            25% {
              transform: translate(-2px, 2px);
              opacity: 0.75;
            }
            50% {
              transform: translate(2px, -2px);
              opacity: 0.5;
            }
            75% {
              transform: translate(-2px, -2px);
              opacity: 0.75;
            }
          }
          @keyframes blink {
            0%, 90%, 100% {
              height: 0;
            }
            95% {
              height: 100%;
            }
          }
          @keyframes scan {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 0 100%;
            }
          }
          @keyframes tv-flicker {
            0% { opacity: 0.27049; }
            5% { opacity: 0.34801; }
            10% { opacity: 0.23175; }
            15% { opacity: 0.40923; }
            20% { opacity: 0.29481; }
            25% { opacity: 0.38584; }
            30% { opacity: 0.24928; }
            35% { opacity: 0.32451; }
            40% { opacity: 0.37031; }
            45% { opacity: 0.26941; }
            50% { opacity: 0.35755; }
            55% { opacity: 0.29288; }
            60% { opacity: 0.31821; }
            65% { opacity: 0.39726; }
            70% { opacity: 0.25294; }
            75% { opacity: 0.36898; }
            80% { opacity: 0.28995; }
            85% { opacity: 0.3398; }
            90% { opacity: 0.38703; }
            95% { opacity: 0.24619; }
            100% { opacity: 0.35762; }
          }
          @keyframes subtle-rotate {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(5deg); }
            100% { transform: rotate(0deg); }
          }
          @media (max-width: 480px) {
            .orwellian-container .orwellian-loader {
              width: 240px;
              height: 240px;
            }
            .orwellian-container .eye {
              width: 140px;
              height: 50px;
            }
            .orwellian-container .pupil {
              width: 40px;
              height: 40px;
            }
            .orwellian-container .spotlight {
              width: 40px;
              height: 160px;
            }
            .orwellian-container .text {
              font-size: 16px;
            }
          }

          /* New Button Styles (optimized for touch: larger padding, no heavy shadows on mobile) */
          .button {
            --primary: #ff5569;
            --neutral-1: #f7f8f7;
            --neutral-2: #e7e7e7;
            --radius: 14px;

            cursor: pointer;
            border-radius: var(--radius);
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
            border: none;
            box-shadow: 0 0.5px 0.5px 1px rgba(255, 255, 255, 0.2),
              0 10px 20px rgba(0, 0, 0, 0.2), 0 4px 5px 0px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.3s ease;
            min-width: 200px;
            padding: 20px;
            height: 68px;
            font-family: "Galano Grotesque", Poppins, Montserrat, sans-serif;
            font-style: normal;
            font-size: 18px;
            font-weight: 600;
            touch-action: manipulation; /* Improve touch responsiveness */
          }
          @media (max-width: 480px) {
            .button {
              padding: 16px;
              height: 60px;
              font-size: 16px;
              box-shadow: 0 0.5px 0.5px 1px rgba(255, 255, 255, 0.2); /* Reduced shadow for performance */
            }
          }
          .button:hover {
            transform: scale(1.02);
            box-shadow: 0 0 1px 2px rgba(255, 255, 255, 0.3),
              0 15px 30px rgba(0, 0, 0, 0.3), 0 10px 3px -3px rgba(0, 0, 0, 0.04);
          }
          .button:active {
            transform: scale(1);
            box-shadow: 0 0 1px 2px rgba(255, 255, 255, 0.3),
              0 10px 3px -3px rgba(0, 0, 0, 0.2);
          }
          .button:after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: var(--radius);
            border: 2.5px solid transparent;
            background: linear-gradient(var(--neutral-1), var(--neutral-2)) padding-box,
              linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.45))
                border-box;
            z-index: 0;
            transition: all 0.4s ease;
          }
          .button:hover::after {
            transform: scale(1.05, 1.1);
            box-shadow: inset 0 -1px 3px 0 rgba(255, 255, 255, 1);
          }
          .button::before {
            content: "";
            inset: 7px 6px 6px 6px;
            position: absolute;
            background: linear-gradient(to top, var(--neutral-1), var(--neutral-2));
            border-radius: 30px;
            z-index: 2;
          }
          .state p {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .state .icon {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            margin: auto;
            transform: scale(1.25);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .state .icon svg {
            overflow: visible;
          }

          /* Outline (simplified animation for performance) */
          .outline {
            position: absolute;
            border-radius: inherit;
            overflow: hidden;
            z-index: 1;
            opacity: 0;
            transition: opacity 0.4s ease;
            inset: -2px -3.5px;
          }
          .outline::before {
            content: "";
            position: absolute;
            inset: -100%;
            background: conic-gradient(
              from 180deg,
              transparent 60%,
              white 80%,
              transparent 100%
            );
            animation: spin 2s linear infinite;
            animation-play-state: paused;
          }
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          .button:hover .outline {
            opacity: 1;
          }
          .button:hover .outline::before {
            animation-play-state: running;
          }

          /* Letters (optimized: reduced blur/filter usage) */
          .state p span {
            display: block;
            opacity: 0;
            animation: slideDown 0.8s ease forwards calc(var(--i) * 0.03s);
          }
          .button:hover p span {
            opacity: 1;
            animation: wave 0.5s ease forwards calc(var(--i) * 0.02s);
          }
          .button:focus p span, .button.sent p span {
            opacity: 1;
            animation: disapear 0.6s ease forwards calc(var(--i) * 0.03s);
          }
          @keyframes wave {
            30% {
              opacity: 1;
              transform: translateY(4px) translateX(0) rotate(0);
            }
            50% {
              opacity: 1;
              transform: translateY(-3px) translateX(0) rotate(0);
              color: var(--primary);
            }
            100% {
              opacity: 1;
              transform: translateY(0) translateX(0) rotate(0);
            }
          }
          @keyframes slideDown {
            0% {
              opacity: 0;
              transform: translateY(-20px) translateX(5px) rotate(-90deg);
              color: var(--primary);
            }
            30% {
              opacity: 1;
              transform: translateY(4px) translateX(0) rotate(0);
            }
            50% {
              opacity: 1;
              transform: translateY(-3px) translateX(0) rotate(0);
            }
            100% {
              opacity: 1;
              transform: translateY(0) translateX(0) rotate(0);
            }
          }
          @keyframes disapear {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
              transform: translateX(5px) translateY(20px);
              color: var(--primary);
            }
          }

          /* Plane */
          .state--default .icon svg {
            animation: land 0.6s ease forwards;
          }
          .button:hover .state--default .icon {
            transform: rotate(45deg) scale(1.25);
          }
          .button:focus .state--default svg, .button.sent .state--default svg {
            animation: takeOff 0.8s linear forwards;
          }
          .button:focus .state--default .icon, .button.sent .state--default .icon {
            transform: rotate(0) scale(1.25);
          }
          @keyframes takeOff {
            0% {
              opacity: 1;
            }
            60% {
              opacity: 1;
              transform: translateX(70px) rotate(45deg) scale(2);
            }
            100% {
              opacity: 0;
              transform: translateX(160px) rotate(45deg) scale(0);
            }
          }
          @keyframes land {
            0% {
              transform: translateX(-60px) translateY(30px) rotate(-50deg) scale(2);
              opacity: 0;
            }
            100% {
              transform: translateX(0) translateY(0) rotate(0);
              opacity: 1;
            }
          }

          /* Contrail */
          .state--default .icon:before {
            content: "";
            position: absolute;
            top: 50%;
            height: 2px;
            width: 0;
            left: -5px;
            background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.5));
          }
          .button:focus .state--default .icon:before, .button.sent .state--default .icon:before {
            animation: contrail 0.8s linear forwards;
          }
          @keyframes contrail {
            0% {
              width: 0;
              opacity: 1;
            }
            8% {
              width: 15px;
            }
            60% {
              opacity: 0.7;
              width: 80px;
            }
            100% {
              opacity: 0;
              width: 160px;
            }
          }

          /* States */
          .state {
            padding-left: 29px;
            z-index: 2;
            display: flex;
            position: relative;
          }
          .state--default span:nth-child(4) {
            margin-right: 5px;
          }
          .state--sent {
            display: none;
          }
          .state--sent svg {
            transform: scale(1.25);
            margin-right: 8px;
          }
          .button:focus .state--default, .button.sent .state--default {
            position: absolute;
          }
          .button:focus .state--sent, .button.sent .state--sent {
            display: flex;
          }
          .button:focus .state--sent span, .button.sent .state--sent span {
            opacity: 0;
            animation: slideDown 0.8s ease forwards calc(var(--i) * 0.2s);
          }
          .button:focus .state--sent .icon svg, .button.sent .state--sent .icon svg {
            opacity: 0;
            animation: appear 1.2s ease forwards 0.8s;
          }
          @keyframes appear {
            0% {
              opacity: 0;
              transform: scale(4) rotate(-40deg);
              color: var(--primary);
            }
            30% {
              opacity: 1;
              transform: scale(0.6);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          /* Rings Overlay Styles (optimized: reduced shadows/filters, simpler keyframes) */
          .rings {
            --border-width: 2px;
            --border-style: solid;
            --animation-duration: 4s;
            --animation-delay: 100ms;
            --animation-count: infinite;
            --animation-direction: normal;
            --animation-fill-mode: both;
            --animation-timing: ease-in-out;
            position: relative;
            width: 400px;
            aspect-ratio: 1/1;
            animation-delay: var(--animation-delay);
            animation-duration: var(--animation-duration);
            animation-iteration-count: var(--animation-count);
            animation-timing-function: var(--animation-timing);
          }

          .rings > .ring {
            position: absolute;
            top: 50%;
            left: 50%;
            aspect-ratio: 1/1;
            border-width: var(--border-width);
            border-style: var(--border-style);
            border-radius: 50%;
            transform-origin: center;
            animation-duration: var(--animation-duration);
            animation-delay: calc(0.4s * var(--delay));
            animation-iteration-count: var(--animation-count);
            animation-direction: var(--animation-direction);
            animation-fill-mode: var(--animation-fill-mode);
            filter: opacity(0);
            will-change: transform;
            overflow: hidden;
          }

          .rings > .ring:nth-child(even) {
            border-color: whitesmoke;
            box-shadow: 0 0 4px cyan; /* Reduced shadows */
          }

          .rings > .ring:nth-child(odd) {
            border-color: whitesmoke;
            box-shadow: 0 0 4px magenta; /* Reduced shadows */
          }

          .rings > .ring:first-child {
            width: 50px;
            margin: -25px 0 0 -25px;
          }

          .rings > .ring:nth-child(2) {
            width: 64px;
            margin: -32px 0 0 -32px;
          }

          .rings > .ring:nth-child(3) {
            width: 78px;
            margin: -39px 0 0 -39px;
          }

          .rings > .ring:nth-child(4) {
            width: 92px;
            margin: -46px 0 0 -46px;
          }

          .rings > .ring:nth-child(5) {
            width: 104px;
            margin: -52px 0 0 -52px;
          }

          .rings > .ring:nth-child(6) {
            width: 118px;
            margin: -59px 0 0 -59px;
          }

          .anim-zoomIn {
            animation-name: zoomIn;
          }

          .anim-pan {
            animation-name: anim-pan;
          }

          @keyframes zoomIn {
            0% {
              transform: perspective(200px) translatez(0);
              filter: opacity(0);
            }
            60% {
              filter: opacity(100%);
            }
            100% {
              transform: perspective(200px) translatez(200px);
            }
          }

          @keyframes anim-pan {
            0% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(-50%, -45%, 0);
            }
            75% {
              transform: translate3d(45%, 35%, 0);
            }
            85% {
              transform: translate3d(-60%, 25%, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ServiceRequestForm;
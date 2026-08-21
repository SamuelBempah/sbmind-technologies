import React from 'react';

import yunikLogo from '../assets/clients/yunik.png';
import tlgLogo from '../assets/clients/tlg.webp';
import dwenliteLogo from '../assets/clients/dwenlite.png';
import paysubLogo from '../assets/clients/paysub.png';
import echelonLogo from '../assets/clients/echelon.png';
import spotybetLogo from '../assets/clients/spotybet.png';
import acuLogo from '../assets/clients/acu.png';
import sbmLogo from '../assets/clients/sbm.png';
import egoTicketsLogo from '../assets/clients/ego-tickets.png';
import imgUpscalerLogo from '../assets/clients/img-upscaler.png';
import barterFundsLogo from '../assets/clients/barter-funds.png';
import panzoidLogo from '../assets/clients/panzoid.png';

const clientLogos = [
  { type: 'image', src: yunikLogo },
  { type: 'image', src: tlgLogo },
  { type: 'image', src: dwenliteLogo },
  { type: 'image', src: paysubLogo },
  { type: 'image', src: echelonLogo },
  { type: 'image', src: spotybetLogo },
  { type: 'image', src: acuLogo },
  { type: 'image', src: sbmLogo },
  { type: 'image', src: egoTicketsLogo },
  { type: 'image', src: imgUpscalerLogo },
  { type: 'image', src: barterFundsLogo },
  { type: 'image', src: panzoidLogo },
  { type: 'text', content: 'J.K OKOTA FINANCIAL SERVICES' }
];

const LogoItem = ({ item }) => (
  <div className="px-8 md:px-16 flex-shrink-0 cursor-pointer flex items-center justify-center">
    {item.type === 'image' ? (
      <img 
        src={item.src} 
        alt="Client Logo" 
        className="h-16 w-auto object-contain grayscale brightness-150 opacity-40 hover:opacity-100 hover:grayscale-0 hover:brightness-100 hover:scale-110 hover:drop-shadow-[0_0_25px_rgba(85,66,255,0.8)] transition-all duration-500 select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    ) : (
      <span 
        className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-400 opacity-60 hover:opacity-100 hover:from-white hover:to-gray-200 hover:scale-105 hover:drop-shadow-[0_0_25px_rgba(85,66,255,0.8)] transition-all duration-500 select-none whitespace-nowrap"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {item.content}
      </span>
    )}
  </div>
);

const ClientMarquee = () => {
  return (
    <div className="w-full overflow-hidden bg-zinc-950 py-16 border-y border-zinc-900 shadow-2xl relative z-10">
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee {
            animation: marquee 40s linear infinite;
          }
          .marquee-container:hover .animate-marquee,
          .marquee-container:active .animate-marquee,
          .marquee-container:focus-within .animate-marquee {
            animation-play-state: paused;
          }
        `}
      </style>

      <div className="mb-10 text-center px-4">
        <h3 
          className="text-lg md:text-xl font-bold uppercase tracking-widest text-[#5542ff] opacity-80"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Systems We've Built & Companies We Host
        </h3>
      </div>
      
      <div 
        className="relative flex overflow-hidden items-center h-32 marquee-container cursor-pointer"
        tabIndex="0"
      >
        {/* Left and Right Fade masks to make the scrolling smooth at edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

        {/* The Marquee Track */}
        <div className="flex items-center flex-shrink-0 animate-marquee">
          {clientLogos.map((item, index) => (
            <LogoItem key={index} item={item} />
          ))}
        </div>
        
        {/* Duplicate track for flawless, seamless loop */}
        <div className="flex items-center flex-shrink-0 animate-marquee" aria-hidden="true">
          {clientLogos.map((item, index) => (
            <LogoItem key={index + 'dup'} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientMarquee;

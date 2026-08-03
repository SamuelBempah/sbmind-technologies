import React, { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import Footer from '../components/Footer';

import companyBuildingImg from '../assets/images/company-building.png';
import teamImg from '../assets/images/team.png';
import ceoImg from '../assets/images/samuel-bempah.png';

const AboutCompany = () => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 800], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  const teamRef = useRef(null);
  const { scrollYProgress: teamScroll } = useScroll({
    target: teamRef,
    offset: ["start end", "end start"]
  });
  const teamY = useTransform(teamScroll, [0, 1], [-150, 150]);
  const teamOpacity = useTransform(teamScroll, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const fadeUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: false, margin: "-50px" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": "Samuel Boakye-Bempah",
      "alternateName": "Samuel Bempah",
      "jobTitle": "Chief Executive Officer",
      "description": "Samuel Boakye-Bempah is the CEO and Lead Developer at SBMind Technologies in Ghana. He is known for creating educational mobile applications like Tax Laws - Ghana and building complex IT systems like Echelon GH Management System. We also host major company systems and websites.",
      "image": "https://placehold.co/400x400?text=Samuel+Bempah",
      "url": "https://sbmindtechnologies.com/about-company",
      "worksFor": {
        "@type": "Organization",
        "name": "SBMind Technologies",
        "url": "https://sbmindtechnologies.com"
      },
      "alumniOf": {
        "@type": "Organization",
        "name": "Kwame Nkrumah University of Science and Technology" // Placeholder if needed
      },
      "sameAs": [
        "https://www.linkedin.com/in/samuel-bempah-b97308326/",
        "https://www.instagram.com/boakye_bempah_samuel/",
        "https://github.com/SamuelBempah"
      ]
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        <title>About SBMind Technologies & CEO Samuel Bempah</title>
        <meta name="description" content="Learn more about SBMind Technologies, our mission, and our CEO, Samuel Boakye-Bempah. We specialize in custom software development and IT consulting in Ghana." />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-[80vh] md:h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute -top-[20%] -bottom-[20%] left-0 right-0 z-0"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <img 
            src={companyBuildingImg} 
            alt="SBMind Technologies Building" 
            className="w-full h-full object-cover object-bottom opacity-70 select-none"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
          {/* Gradient overlay for smooth transition to black */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </motion.div>
        
        <motion.div className="relative z-10 text-center px-6 mt-10" {...fadeUp}>
          <h1 
            className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-white mb-6 drop-shadow-2xl pb-2 leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5542ff] to-[#00d2ff]">SBMind</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-200 text-lg md:text-xl font-light drop-shadow-lg">
            We are a premier technology and software development company operating remotely across Accra, Namibia, and the USA, with our main office located in the Airport Residential Area, Accra. We are dedicated to providing innovative IT solutions, custom software, and robust mobile applications, and we also host major company systems and websites for businesses across the globe.
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-24 pb-20 pt-10 relative z-20">
        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-10 mb-20">
          <motion.div {...fadeUp} className="bg-zinc-900/80 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800/50 hover:border-[#5542ff]/50 transition-colors duration-300 shadow-2xl">
            <h2 
              className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#5542ff] to-[#00d2ff] pb-1 leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Our Vision
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              To be the leading software development agency in Africa and beyond, shaping the digital future by building world-class platforms that optimize business operations and elevate user experiences.
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="bg-zinc-900/80 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800/50 hover:border-[#5542ff]/50 transition-colors duration-300 shadow-2xl">
            <h2 
              className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#5542ff] to-[#00d2ff] pb-1 leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Our Mission
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              We empower organizations through scalable software, seamless management systems like Echelon GH, and tailored mobile solutions such as the Tax Laws - Ghana app. We also host major company systems and websites to ensure our clients operate securely and efficiently.
            </p>
          </motion.div>
        </div>

      </div>

      {/* Team Parallax Section */}
      <div ref={teamRef} className="relative h-[80vh] md:h-screen w-full flex flex-col items-center justify-center overflow-hidden mb-20 bg-black">
        <motion.div 
          className="absolute -top-[20%] -bottom-[20%] left-0 right-0 z-0"
          style={{ y: teamY, opacity: teamOpacity }}
        >
          <img 
            src={teamImg} 
            alt="SBMind Technologies Team" 
            className="w-full h-full object-cover object-center opacity-70 select-none"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
        </motion.div>
        
        <motion.div className="relative z-10 text-center px-6" {...fadeUp}>
          <h2 
            className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 pb-2 leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Meet the Team
          </h2>
          <p className="max-w-xl mx-auto text-gray-200 text-lg md:text-xl font-light drop-shadow-lg">
            The brilliant minds driving innovation and crafting the future of technology at SBMind Technologies.
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-24 pb-20 relative z-20">

        {/* CEO Profile Section - Optimized for SEO */}
        <motion.div {...fadeUp} className="bg-zinc-900/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-zinc-800/50 shadow-2xl flex flex-col md:flex-row items-center gap-10 hover:border-[#5542ff]/30 transition-colors duration-500">
          <div className="w-full md:w-1/3 flex justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-[#5542ff] shadow-[0_0_30px_rgba(85,66,255,0.6)]">
              <img 
                src={ceoImg} 
                alt="Samuel Boakye-Bempah, CEO of SBMind Technologies" 
                className="w-full h-full object-cover select-none"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          </div>
          <div className="w-full md:w-2/3">
            <h3 className="text-sm font-bold text-[#00d2ff] tracking-widest uppercase mb-2">Chief Executive Officer</h3>
            <h2 
              className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-500 pb-2 leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Samuel Boakye-Bempah
            </h2>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-6">
              As the CEO and Lead Developer at SBMind Technologies, Samuel Bempah has spearheaded the creation of multiple flagship products that impact thousands of users daily. With a profound expertise in modern software architecture, he has driven the successful launch of apps like <strong>Tax Laws - Ghana</strong> and the <strong>Yunik browser</strong>.
            </p>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
              Samuel's vision is deeply rooted in utilizing technology to solve real-world problems in Ghana and across the globe. Under his leadership, SBMind Technologies continues to expand its reach, creating custom solutions that bridge the gap between businesses and digital innovation.
            </p>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutCompany;

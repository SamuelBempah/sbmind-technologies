import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router';
import styled from 'styled-components';
import About from './components/About';
import Hero from './components/Hero';
import NavBar from './components/Navbar';
import Features from './components/Features';
import Story from './components/Story';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ClientMarquee from './components/ClientMarquee';
import ServiceRequestForm from './pages/request';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PayInvoice from './components/PayInvoice';
import TaxLaws from './pages/TaxLawsGhana';
import SupportPage from './pages/Support';
import AboutCompany from './pages/AboutCompany';
import AgManualPrivacyPolicy from './pages/AgManualPrivacyPolicy';
import VeltoqPrivacyPolicy from './pages/VeltoqPrivacyPolicy';
import DeadDeckPrivacyPolicy from './pages/DeadDeckPrivacyPolicy';
import DeadDeckLogin from './pages/DeadDeckLogin';
import DeadDeckAdmin from './pages/DeadDeckAdmin';
const CookieCard = () => {
  const [isCookieAccepted, setIsCookieAccepted] = useState(localStorage.getItem('cookieAccepted') === 'true');
  const [showCookie, setShowCookie] = useState(false);
  const [isHiding, setIsHiding] = useState(false); // New state to track hiding animation

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCookie(true);
    }, 30000); // 30-second delay
    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);

  const handleAccept = () => {
    setIsHiding(true); // Trigger slide-out animation
    setTimeout(() => {
      localStorage.setItem('cookieAccepted', 'true');
      setIsCookieAccepted(true); // Update state after animation
    }, 500); // Match the animation duration (0.5s)
  };

  if (isCookieAccepted || !showCookie) return null;

  return (
    <StyledWrapper isHiding={isHiding}>
      <div className="card">
        <svg xmlSpace="preserve" viewBox="0 0 122.88 122.25" y="0px" x="0px" id="cookieSvg" version="1.1">
          <g>
            <path d="M101.77,49.38c2.09,3.1,4.37,5.11,6.86,5.78c2.45,0.66,5.32,0.06,8.7-2.01c1.36-0.84,3.14-0.41,3.97,0.95 c0.28,0.46,0.42,0.96,0.43,1.47c0.13,1.4,0.21,2.82,0.24,4.26c0.03,1.46,0.02,2.91-0.05,4.35h0v0c0,0.13-0.01,0.26-0.03,0.38 c-0.91,16.72-8.47,31.51-20,41.93c-11.55,10.44-27.06,16.49-43.82,15.69v0.01h0c-0.13,0-0.26-0.01-0.38-0.03 c-16.72-0.91-31.51-8.47-41.93-20C5.31,90.61-0.73,75.1,0.07,58.34H0.07v0c0-0.13,0.01-0.26,0.03-0.38 C1,41.22,8.81,26.35,20.57,15.87C32.34,5.37,48.09-0.73,64.85,0.07V0.07h0c1.6,0,2.89,1.29,2.89,2.89c0,0.4-0.08,0.78-0.23,1.12 c-1.17,3.81-1.25,7.34-0.27,10.14c0.89,2.54,2.7,4.51,5.41,5.52c1.44,0.54,2.2,2.1,1.74,3.55l0.01,0 c-1.83,5.89-1.87,11.08-0.52,15.26c0.82,2.53,2.14,4.69,3.88,6.4c1.74,1.72,3.9,3,6.39,3.78c4.04,1.26,8.94,1.18,14.31-0.55 C99.73,47.78,101.08,48.3,101.77,49.38L101.77,49.38z M59.28,57.86c2.77,0,5.01,2.24,5.01,5.01c0,2.77-2.24,5.01-5.01,5.01 c-2.77,0-5.01-2.24-5.01-5.01C54.27,60.1,56.52,57.86,59.28,57.86L59.28,57.86z M37.56,78.49c3.37,0,6.11,2.73,6.11,6.11 s-2.73,6.11-6.11,6.11s-6.11-2.73-6.11-6.11S34.18,78.49,37.56,78.49L37.56,78.49z M50.72,31.75c2.65,0,4.79,2.14,4.79,4.79 c0,2.65-2.14,4.79-4.79,4.79c-2.65,0-4.79-2.14-4.79-4.79C45.93,33.89,48.08,31.75,50.72,31.75L50.72,31.75z M119.3,32.4 c1.98,0,3.58,1.6,3.58,3.58c0,1.98-1.6,3.58-3.58,3.58s-3.58-1.6-3.58-3.58C115.71,34.01,117.32,32.4,119.3,32.4L119.3,32.4z M93.62,22.91c2.98,0,5.39,2.41,5.39,5.39c0,2.98-2.41,5.39-5.39,5.39c-2.98,0-5.39-2.41-5.39-5.39 C88.23,25.33,90.64,22.91,93.62,22.91L93.62,22.91z M97.79,0.59c3.19,0,5.78,2.59,5.78,5.78c0,3.19-2.59,5.78-5.78,5.78 c-3.19,0-5.78-2.59-5.78-5.78C92.02,3.17,94.6,0.59,97.79,0.59L97.79,0.59z M76.73,80.63c4.43,0,8.03,3.59,8.03,8.03 c0,4.43-3.59,8.03-8.03,8.03s-8.03-3.59-8.03-8.03C68.7,84.22,72.29,80.63,76.73,80.63L76.73,80.63z M31.91,46.78 c4.8,0,8.69,3.89,8.69,8.69c0,4.8-3.89,8.69-8.69,8.69s-8.69-3.89-8.69-8.69C23.22,50.68,27.11,46.78,31.91,46.78L31.91,46.78z M107.13,60.74c-3.39-0.91-6.35-3.14-8.95-6.48c-5.78,1.52-11.16,1.41-15.76-0.02c-3.37-1.05-6.32-2.81-8.71-5.18 c-2.39-2.37-4.21-5.32-5.32-8.75c-1.51-4.66-1.69-10.2-0.18-16.32c-3.1-1.8-5.25-4.53-6.42-7.88c-1.06-3.05-1.28-6.59-0.61-10.35 C47.27,5.95,34.3,11.36,24.41,20.18C13.74,29.69,6.66,43.15,5.84,58.29l0,0.05v0h0l-0.01,0.13v0C5.07,73.72,10.55,87.82,20.02,98.3 c9.44,10.44,22.84,17.29,38,18.1l0.05,0h0v0l0.13,0.01h0c15.24,0.77,29.35-4.71,39.83-14.19c10.44-9.44,17.29-22.84,18.1-38l0-0.05 v0h0l0.01-0.13v0c0.07-1.34,0.09-2.64,0.06-3.91C112.98,61.34,109.96,61.51,107.13,60.74L107.13,60.74z M116.15,64.04L116.15,64.04 L116.15,64.04L116.15,64.04z M58.21,116.42L58.21,116.42L58.21,116.42L58.21,116.42z" />
          </g>
        </svg>
        <p className="cookieHeading">We use cookies.</p>
        <p className="cookieDescription">
          We use cookies to ensure that we give you the best experience on our website. <br />
          <a href="/privacy-policy">Read cookies policies</a>.
        </p>
        <div className="buttonContainer">
          <button className="acceptButton" onClick={handleAccept}>Allow</button>
          <button className="declineButton">Decline</button>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  animation: ${({ isHiding }) => (isHiding ? 'slideOut 0.5s ease-out forwards' : 'slideIn 0.5s ease-out forwards')};

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .card {
    width: 300px;
    height: 220px;
    background-color: rgb(255, 255, 255);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 30px;
    gap: 13px;
    overflow: hidden;
    box-shadow: 2px 2px 20px rgba(0, 0, 0, 0.062);
  }

  #cookieSvg {
    width: 50px;
  }

  #cookieSvg g path {
    fill: rgb(97, 81, 81);
  }

  .cookieHeading {
    font-size: 1.2em;
    font-weight: 800;
    color: rgb(26, 26, 26);
  }

  .cookieDescription {
    text-align: center;
    font-size: 0.7em;
    font-weight: 600;
    color: rgb(99, 99, 99);
  }

  .cookieDescription a {
    --tw-text-opacity: 1;
    color: rgb(59 130 246);
  }

  .cookieDescription a:hover {
    -webkit-text-decoration-line: underline;
    text-decoration-line: underline;
  }

  .buttonContainer {
    display: flex;
    gap: 20px;
    flex-direction: row;
  }

  .acceptButton {
    width: 80px;
    height: 30px;
    background-color: #7b57ff;
    transition-duration: .2s;
    border: none;
    color: rgb(241, 241, 241);
    cursor: pointer;
    font-weight: 600;
    border-radius: 20px;
    box-shadow: 0 4px 6px -1px #977ef3, 0 2px 4px -1px #977ef3;
    transition: all .6s ease;
  }

  .declineButton {
    width: 80px;
    height: 30px;
    background-color: #dadada;
    transition-duration: .2s;
    color: rgb(46, 46, 46);
    border: none;
    cursor: not-allowed;
    font-weight: 600;
    border-radius: 20px;
    box-shadow: 0 4px 6px -1px #bebdbd, 0 2px 4px -1px #bebdbd;
    transition: all .6s ease;
  }

  .declineButton:hover {
    background-color: #ebebeb;
    box-shadow: 0 10px 15px -3px #bebdbd, 0 4px 6px -2px #bebdbd;
    transition-duration: .2s;
  }

  .acceptButton:hover {
    background-color: #9173ff;
    box-shadow: 0 10px 15px -3px #977ef3, 0 4px 6px -2px #977ef3;
    transition-duration: .2s;
  }
`;

function App() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/request') {
      document.title = 'Request Our Services | SBMind Technologies';
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Request innovative software development and IT solutions from SBM Cory Technologies. Fill out our service request form to get started.');
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    } else if (location.pathname === '/privacy-policy') {
      document.title = 'Privacy Policy | SBMind Technologies';
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Read the Privacy Policy of SBMind Technologies to understand how we handle your data and protect your privacy.');
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    } else if (location.pathname === '/tax-laws-ghana') {
      document.title = 'Tax Laws in Ghana | SBMind Technologies';
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Explore the tax laws in Ghana and how they impact your business. Stay informed with SBMind Technologies.');
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    } else if (location.pathname === '/support') {
      document.title = 'Support | SBMind Technologies';
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Get support for your software and IT solutions from SBMind Technologies. We are here to help you succeed.');
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    } else if (location.pathname === '/about-company') {
      document.title = 'About SBMind Technologies & CEO Samuel Bempah';
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Learn more about SBMind Technologies, our mission, and our CEO, Samuel Boakye-Bempah. We specialize in custom software development and IT consulting in Ghana.');
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    } else if (location.pathname === '/ag-manual/privacy-policy') {
      document.title = 'AG Manual Privacy Policy | SBMind Technologies';
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Read the Privacy Policy for the AG Manual app by SBMind Technologies.');
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    } else if (location.pathname === '/veltoq/privacy-policy') {
      document.title = 'Veltoq Privacy Policy | SBMind Technologies';
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Read the Privacy Policy for the Veltoq app by SBMind Technologies.');
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    } else if (location.pathname === '/deaddeck/privacy-policy') {
      document.title = 'Dead Deck Privacy Policy | SBMind Technologies';
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Read the Privacy Policy for the Dead Deck game by SBMind Technologies.');
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    } else {
      document.title = 'SBMind Technologies | Software Development & IT Solutions';
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'SBMind Technologies offers innovative software development, IT consulting, and custom tech solutions to drive business success. Contact us today!');
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    }
  }, [location.pathname]);

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden">
      {!location.pathname.startsWith('/deaddeck') && <NavBar />}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <About />
              <Features />
              <ClientMarquee />
              <Story />
              <Contact />
              <Footer />
            </>
          }
        />
        <Route path="/request" element={<ServiceRequestForm />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/pay-invoice" element={<PayInvoice />} />
        <Route path="/tax-laws-ghana" element={<TaxLaws />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/about-company" element={<AboutCompany />} />
        <Route path="/ag-manual/privacy-policy" element={<AgManualPrivacyPolicy />} />
        <Route path="/veltoq/privacy-policy" element={<VeltoqPrivacyPolicy />} />
        <Route path="/deaddeck/privacy-policy" element={<DeadDeckPrivacyPolicy />} />
        <Route path="/deaddeck/login" element={<DeadDeckLogin />} />
        <Route path="/deaddeck/admin" element={<DeadDeckAdmin />} />
      </Routes>
      {!location.pathname.startsWith('/deaddeck') && <CookieCard />}
    </main>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
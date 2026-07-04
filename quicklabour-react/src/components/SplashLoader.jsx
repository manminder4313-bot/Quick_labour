import React, { useState, useEffect } from 'react';
import './SplashLoader.css';

const SplashLoader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [logoZoom, setLogoZoom] = useState(false);

  useEffect(() => {
    // Disable scrolling when splash is active
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Re-enable scrolling when splash is removed
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    // Simulate loading progress
    const duration = 2400; // 2.4 seconds total animation
    const intervalTime = 30; // Update every 30ms
    const totalSteps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min(
        Math.round((currentStep / totalSteps) * 100),
        100
      );
      
      setProgress(nextProgress);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        // Add a small delay at 100% for satisfying complete animation
        setTimeout(() => {
          setLogoZoom(true); // Trigger the logo zoom animation (small -> large)
          
          // Wait for the logo zoom-out/expand animation to complete before hiding screen
          setTimeout(() => {
            setIsFadingOut(true);
            // Wait for CSS fade-out transition of the background to complete
            setTimeout(() => {
              if (onComplete) {
                onComplete();
              }
            }, 600); // Matches the background CSS transition duration
          }, 850); // Matches the logo zoom duration in CSS
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className={`splash-overlay ${isFadingOut ? 'fade-out' : ''}`}>
      {/* Center Stack: Lightning, Orbits, Outline Icons, Logo Text, Slogan, and Loader */}
      <div className={`splash-center-content ${logoZoom ? 'logo-zoom-active' : ''}`}>
        
        {/* Central Graphic (Lightning & Orbiting Rings & Floating Icons) */}
        <svg 
          viewBox="0 0 600 360" 
          className={`splash-center-svg ${logoZoom ? '' : 'ill-float-item'}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Central Orbiting Rings & Core */}
          <circle cx="300" cy="180" r="70" className="ill-orbit-core" />
          <circle cx="300" cy="180" r="54" className="ill-orbit-ring-inner" />
          <circle cx="300" cy="180" r="95" className="ill-orbit-ring-outer" />
          
          {/* Orbital glowing dots */}
          <circle cx="382" cy="227" r="3.5" className="ill-orbit-dot" />
          <circle cx="218" cy="227" r="3.5" className="ill-orbit-dot" />
          <circle cx="300" cy="85" r="4.5" className="ill-orbit-dot" />

          {/* Central Lightning Bolt */}
          <path 
            className="ill-lightning-bolt-center" 
            d="M 304 125 L 284 175 H 300 L 292 235 L 320 165 H 302 Z" 
          />

          {/* Floating Outline Icons - Styled to match mockup */}
          
          {/* Wrench (Top Left) */}
          <g className="ill-wrench">
            <path 
              d="M102 68a4 4 0 0 0-5.657 0L83 81.343a2 2 0 0 0 0 2.828l2.828 2.828a2 2 0 0 0 2.828 0l13.344-13.343a4 4 0 0 0 0-5.656zm-4.242 4.242a1 1 0 1 1-1.415-1.414 1 1 0 0 1 1.415 1.414z" 
              className="ill-outline-icon" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none" 
            />
          </g>

          {/* Paint Roller (Top Right) */}
          <g className="ill-roller">
            <rect x="460" y="55" width="22" height="12" rx="2" className="ill-outline-icon" strokeWidth="1.5" fill="none" />
            <path d="M 460 61 L 448 61 L 448 78 L 456 78 L 456 86" className="ill-outline-icon" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>

          {/* Safety Helmet (Middle Left) */}
          <g className="ill-helmet">
            <path d="M 44 186 A 12 12 0 0 1 68 186" className="ill-outline-icon" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="56" cy="187.5" rx="15" ry="2.2" className="ill-outline-icon" strokeWidth="1.5" fill="none" />
            <path d="M 56 174 L 56 186" className="ill-outline-icon" strokeWidth="1.5" fill="none" />
            <path d="M 50 178 A 12 12 0 0 1 62 178" className="ill-outline-icon" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />
          </g>

          {/* Gear (Middle Right) */}
          <g className="ill-gear">
            <circle cx="520" cy="180" r="9" className="ill-outline-icon" strokeWidth="1.5" fill="none" />
            <circle cx="520" cy="180" r="4" className="ill-outline-icon" strokeWidth="1.5" fill="none" />
            <path d="M 520 167 L 520 171 M 520 189 L 520 193 M 507 180 L 511 180 M 529 180 L 533 180 M 511 171 L 514 174 M 526 186 L 529 189 M 511 189 L 514 186 M 526 174 L 529 171" className="ill-outline-icon" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Shovel (Bottom Left) */}
          <g className="ill-shovel">
            <path d="M 82 298 L 92 308 L 86 314 L 76 304 Z" className="ill-outline-icon" strokeWidth="1.5" fill="none" />
            <line x1="89" y1="301" x2="105" y2="285" className="ill-outline-icon" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 103 287 L 109 281 L 112 284 L 106 290 Z" className="ill-outline-icon" strokeWidth="1.5" fill="none" />
          </g>

          {/* Hammer (Bottom Right) */}
          <g className="ill-hammer">
            <path d="M 462 284 L 471 275 L 476 280 L 467 289 Z" className="ill-outline-icon" strokeWidth="1.5" fill="none" />
            <line x1="469" y1="282" x2="455" y2="296" className="ill-outline-icon" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 467 279 L 460 272" className="ill-outline-icon" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>

        {/* Logo Text & Slogan (Will scale during zoom phase along with the graphics) */}
        <h1 className="splash-logo-text">
          Quick<span>Labour</span>
        </h1>
        <p className={`splash-slogan ${logoZoom ? 'zoom-phase-hide' : ''}`}>
          Find Skills. Find Trust.
        </p>

        {/* Loading Progress Bar */}
        <div className={`splash-progress-container ${logoZoom ? 'zoom-phase-hide' : ''}`}>
          <span className="splash-loading-label">Loading...</span>
          <div className="splash-progress-track">
            <div 
              className="splash-progress-bar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="splash-progress-percentage">{progress}%</span>
        </div>
      </div>

      {/* Bottom Area: skyline silhouette, curved bottom ground line, and platform slogan */}
      <div className={`splash-bottom-area ${logoZoom ? 'zoom-phase-hide' : ''}`}>
        <svg 
          viewBox="0 0 600 150" 
          className="splash-skyline-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Skyline skyscrapers */}
          <rect x="130" y="70" width="24" height="70" rx="1.5" className="ill-building" />
          <rect x="165" y="85" width="20" height="55" rx="1.5" className="ill-building" />
          <rect x="195" y="55" width="28" height="85" rx="2" className="ill-building" />
          <rect x="235" y="80" width="22" height="60" rx="1.5" className="ill-building" />
          
          <rect x="345" y="75" width="26" height="65" rx="1.5" className="ill-building" />
          <rect x="380" y="60" width="24" height="80" rx="2" className="ill-building" />
          <rect x="415" y="90" width="20" height="50" rx="1.5" className="ill-building" />
          <rect x="445" y="70" width="28" height="70" rx="1.5" className="ill-building" />

          {/* Construction Cranes */}
          {/* Left Crane */}
          <line x1="90" y1="140" x2="90" y2="50" className="ill-crane-part" strokeWidth="1.5" />
          <line x1="60" y1="50" x2="130" y2="50" className="ill-crane-part" strokeWidth="1.5" />
          <path d="M 87 50 L 90 42 L 93 50 Z" className="ill-crane-part" strokeWidth="1" fill="none" />
          <line x1="120" y1="50" x2="120" y2="75" className="ill-crane-part" strokeWidth="1" />
          <line x1="90" y1="42" x2="120" y2="50" className="ill-crane-part" strokeWidth="1" />

          {/* Right Crane */}
          <line x1="505" y1="140" x2="505" y2="40" className="ill-crane-part" strokeWidth="1.5" />
          <line x1="465" y1="40" x2="555" y2="40" className="ill-crane-part" strokeWidth="1.5" />
          <path d="M 502 40 L 505 32 L 508 40 Z" className="ill-crane-part" strokeWidth="1" fill="none" />
          <line x1="480" y1="40" x2="480" y2="65" className="ill-crane-part" strokeWidth="1" />
          <line x1="505" y1="32" x2="465" y2="40" className="ill-crane-part" strokeWidth="1" />

          {/* Curved glowing ground line */}
          <path d="M -10 140 Q 300 115 610 140" fill="none" className="ill-ground-arc" strokeWidth="2.5" />
        </svg>
        <p className="splash-bottom-text">
          Building Connections. Building Futures.
        </p>
      </div>
    </div>
  );
};

export default SplashLoader;

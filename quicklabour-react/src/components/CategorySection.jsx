import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LABOUR_INDUSTRIES } from '../utils/api';

// Pastel background colors that cycle across cards
const BG_COLORS = [
  '#e8f0fe', '#fff8e1', '#e8f5e9', '#fce4ec',
  '#ede7f6', '#e0f2f1', '#fff3e0', '#e3f2fd',
  '#f3e5f5', '#e8eaf6', '#fbe9e7', '#e0f7fa',
];

// Bootstrap icon per industry
const INDUSTRY_ICONS = {
  "Construction Labour":         "bi-building-gear",
  "Factory / Industrial Labour": "bi-gear-wide-connected",
  "Agricultural Labour":         "bi-tree",
  "Transport & Delivery":        "bi-truck-front",
  "Cleaning & Maintenance":      "bi-brush",
  "Domestic Labour":             "bi-house-heart",
  "Skilled Technical Labour":    "bi-cpu",
  "Daily Wage / General Labour": "bi-person-arms-up",
  "Mining & Heavy Work":         "bi-hammer",
};

// Flatten all specialties into a single list with metadata
const allCategories = [];
Object.entries(LABOUR_INDUSTRIES).forEach(([industry, info], industryIdx) => {
  info.specialties.forEach((spec, specIdx) => {
    allCategories.push({
      name: spec.name,
      formValue: spec.name,
      industry,
      industryIcon: info.icon,
      bsIcon: INDUSTRY_ICONS[industry] || 'bi-person-gear',
      bg: BG_COLORS[(industryIdx * 4 + specIdx) % BG_COLORS.length],
      baseRate: spec.baseRate,
    });
  });
});

// Duplicate for seamless infinite scroll
const scrollItems = [...allCategories, ...allCategories];

const CategorySection = () => {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const animRef  = useRef(null);
  const pausedRef = useRef(false);
  const posRef   = useRef(0);

  const handleCardClick = (category) => {
    navigate(`/post-job?category=${encodeURIComponent(category)}`);
  };

  // Auto-scroll animation (right → left)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const speed = 0.6; // px per frame — increase for faster scroll

    const animate = () => {
      if (!pausedRef.current) {
        posRef.current += speed;
        // When we've scrolled exactly half (one copy), reset to 0
        const halfWidth = track.scrollWidth / 2;
        if (posRef.current >= halfWidth) {
          posRef.current = 0;
        }
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <section className="py-5 bg-light" id="categories">
      <div className="container-fluid px-0">

        {/* Title */}
        <div className="text-center mb-4 reveal visible px-3">
          <h2 className="section-title">Browse by Category</h2>
          <p className="section-sub">
            {allCategories.length}+ skilled trade categories across{' '}
            {Object.keys(LABOUR_INDUSTRIES).length} industries — scroll to explore
          </p>
        </div>

        {/* Scrolling strip */}
        <div
          style={{
            overflow: 'hidden',
            position: 'relative',
            cursor: 'grab',
            paddingBottom: 12,
            userSelect: 'none',
          }}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {/* Left fade */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 60,
            background: 'linear-gradient(to right, #f8f9fb, transparent)',
            zIndex: 2, pointerEvents: 'none',
          }} />
          {/* Right fade */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 60,
            background: 'linear-gradient(to left, #f8f9fb, transparent)',
            zIndex: 2, pointerEvents: 'none',
          }} />

          {/* Track — contains 2× items for seamless loop */}
          <div
            ref={trackRef}
            style={{
              display: 'flex',
              gap: 16,
              width: 'max-content',
              willChange: 'transform',
              padding: '8px 24px',
            }}
          >
            {scrollItems.map((cat, index) => (
              <div
                key={index}
                onClick={() => handleCardClick(cat.formValue)}
                className="cat-card"
                style={{
                  width: 140,
                  minWidth: 140,
                  flexShrink: 0,
                  cursor: 'pointer',
                  padding: '20px 12px',
                }}
              >
                {/* Icon circle */}
                <div className="cat-icon" style={{ background: cat.bg, margin: '0 auto 12px' }}>
                  <i className={`bi ${cat.bsIcon}`} style={{ fontSize: '1.6rem', color: '#0a2540' }}></i>
                </div>

                {/* Name */}
                <h6 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>
                  {cat.name}
                </h6>

                {/* Industry chip */}
                <span style={{
                  fontSize: '0.7rem',
                  color: '#6c7a8d',
                  display: 'block',
                  lineHeight: 1.3,
                }}>
                  {cat.industryIcon} {cat.industry.split(' ')[0]}
                </span>

                {/* Rate */}
                <div style={{
                  marginTop: 8,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#0d6efd',
                }}>
                  ₹{cat.baseRate}/day
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View all link */}
        <div className="text-center mt-3">
          <button
            className="btn btn-outline-primary rounded-pill px-4 fw-bold"
            onClick={() => navigate('/categories')}
            style={{ fontSize: '0.9rem' }}
          >
            View All Categories <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>

      </div>
    </section>
  );
};

export default CategorySection;

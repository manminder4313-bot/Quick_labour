import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LABOUR_INDUSTRIES } from '../utils/api';

// Map industry names to Bootstrap Icons (used inside .category-icon)
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

const Categories = () => {
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem('userRole');
  const [activeIndustry, setActiveIndustry] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const industryNames = ['All', ...Object.keys(LABOUR_INDUSTRIES)];

  const handleHire = (specialtyName) => {
    navigate(`/post-job?category=${encodeURIComponent(specialtyName)}`);
  };

  // Filter by active industry tab and search term
  const filteredIndustries = Object.entries(LABOUR_INDUSTRIES)
    .filter(([industryName]) =>
      activeIndustry === 'All' || activeIndustry === industryName
    )
    .map(([industryName, info]) => {
      const filteredSpecs = searchTerm.trim()
        ? info.specialties.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.desc.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : info.specialties;
      return { industryName, info, filteredSpecs };
    })
    .filter(({ filteredSpecs }) => filteredSpecs.length > 0);

  const totalWorkerTypes = Object.values(LABOUR_INDUSTRIES)
    .reduce((acc, info) => acc + info.specialties.length, 0);

  return (
    <div>
      {/* ── Hero (uses existing .category-hero CSS) ── */}
      <section className="category-hero">
        <div className="container">
          <h1>Browse Worker Categories</h1>
          <p>
            Discover {totalWorkerTypes}+ verified trades across{' '}
            {Object.keys(LABOUR_INDUSTRIES).length} industries. Find the right
            professional and hire in minutes.
          </p>

          {/* Search */}
          <div className="mt-4" style={{ maxWidth: 480, margin: '24px auto 0' }}>
            <div className="input-group" style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <span className="input-group-text bg-white border-0 ps-3">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 py-3"
                placeholder="Search e.g. Welder, Cook, Miner..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.95rem' }}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary border-0 bg-white pe-3"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="bi bi-x-lg text-muted"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Industry Filter Pills ── */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid #e8edf5', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div className="container">
          <div className="d-flex gap-2 py-3" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
            {industryNames.map(name => {
              const isActive = activeIndustry === name;
              return (
                <button
                  key={name}
                  onClick={() => setActiveIndustry(name)}
                  className={isActive ? 'btn btn-primary rounded-pill fw-bold px-3 py-2' : 'btn btn-outline-secondary rounded-pill fw-600 px-3 py-2'}
                  style={{
                    flexShrink: 0,
                    fontSize: '0.82rem',
                    whiteSpace: 'nowrap',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.2s',
                  }}
                >
                  {name === 'All'
                    ? '🌐 All Industries'
                    : `${LABOUR_INDUSTRIES[name]?.icon} ${name}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Industry Sections ── */}
      <section className="py-5" style={{ background: '#f8f9fb' }}>
        <div className="container">

          {filteredIndustries.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
              <h5 className="text-muted">No results for "{searchTerm}"</h5>
              <p className="text-muted small">Try a different keyword like "plumber", "cook", or "miner".</p>
              <button className="btn btn-primary rounded-3 mt-2" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            </div>
          ) : (
            filteredIndustries.map(({ industryName, info, filteredSpecs }) => (
              <div key={industryName} className="mb-5">

                {/* Industry Section Header */}
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="category-icon mb-0 flex-shrink-0"
                    style={{ fontSize: '1.6rem', background: 'rgba(13,110,253,0.07)', color: '#0d6efd' }}
                  >
                    {info.icon}
                  </div>
                  <div>
                    <h4 className="fw-800 mb-0" style={{ fontWeight: 800, color: '#0a2540' }}>
                      {industryName}
                    </h4>
                    <small className="text-muted">
                      <i className={`bi ${INDUSTRY_ICONS[industryName] || 'bi-person-gear'} me-1`}></i>
                      {filteredSpecs.length} worker type{filteredSpecs.length !== 1 ? 's' : ''} available
                    </small>
                  </div>
                  {/* Divider line */}
                  <div className="flex-fill ms-2" style={{ height: 1.5, background: 'linear-gradient(to right,#e8edf5,transparent)' }} />
                </div>

                {/* Worker Cards — uses existing .category-box CSS classes */}
                <div className="row g-4">
                  {filteredSpecs.map((spec) => (
                    <div key={spec.name} className="col-md-4 col-lg-3">
                      <div className="category-box">

                        {/* Icon */}
                        <div className="category-icon">
                          <i className={`bi ${INDUSTRY_ICONS[industryName] || 'bi-person-gear'}`}></i>
                        </div>

                        {/* Name */}
                        <h5>{spec.name}</h5>

                        {/* Description */}
                        <p>{spec.desc}</p>

                        {/* Skill Tags — rate & visit charge */}
                        <div className="mb-3">
                          <span className="skill-tag">
                            <i className="bi bi-currency-rupee"></i>{spec.baseRate}/day
                          </span>
                          <span className="skill-tag">
                            <i className="bi bi-geo-alt me-1"></i>Visit ₹{spec.visitCharge}
                          </span>
                        </div>

                        {/* Hire Button */}
                        {userRole === 'worker' ? (
                          <button
                            className="btn-category"
                            disabled
                            style={{
                              background: '#cbd5e1',
                              borderColor: '#cbd5e1',
                              color: '#64748b',
                              cursor: 'not-allowed',
                              boxShadow: 'none'
                            }}
                          >
                            Hiring Restricted
                          </button>
                        ) : (
                          <button
                            className="btn-category"
                            onClick={() => handleHire(spec.name)}
                          >
                            Hire {spec.name}
                          </button>
                        )}

                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))
          )}

        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section style={{ background: 'linear-gradient(135deg,#0a2540,#173d63)', padding: '48px 0' }}>
        <div className="container">
          <div className="row g-4 text-center text-white">
            {[
              { label: 'Industries',     value: Object.keys(LABOUR_INDUSTRIES).length, icon: 'bi-building' },
              { label: 'Worker Types',   value: totalWorkerTypes,                      icon: 'bi-people' },
              { label: 'Cities Covered', value: '50+',                                 icon: 'bi-geo-alt' },
              { label: 'Verified Workers',value: '5,000+',                             icon: 'bi-patch-check' },
            ].map(stat => (
              <div key={stat.label} className="col-6 col-md-3">
                <i className={`bi ${stat.icon} fs-2 mb-2 d-block`} style={{ color: '#f5a623' }}></i>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f5a623' }}>{stat.value}</div>
                <div style={{ fontSize: '0.88rem', opacity: 0.75 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Categories;

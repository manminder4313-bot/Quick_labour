import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, LABOUR_INDUSTRIES } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const INDUSTRY_AVATARS = {
  "Construction Labour": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=60&q=80",
  "Factory / Industrial Labour": "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=60&q=80",
  "Agricultural Labour": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=60&q=80",
  "Transport & Delivery": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=60&q=80",
  "Cleaning & Maintenance": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&q=80",
  "Domestic Labour": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=60&q=80",
  "Skilled Technical Labour": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=60&q=80",
  "Daily Wage / General Labour": "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=60&q=80",
  "Mining & Heavy Work": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&q=80",
};

const CATEGORY_COLORS = [
  { bg: '#eff6ff', border: '#bfdbfe', accent: '#1d4ed8' },
  { bg: '#fdf4ff', border: '#e9d5ff', accent: '#7c3aed' },
  { bg: '#fff7ed', border: '#fed7aa', accent: '#c2410c' },
  { bg: '#f0fdf4', border: '#bbf7d0', accent: '#15803d' },
  { bg: '#fefce8', border: '#fde68a', accent: '#b45309' },
  { bg: '#fff1f2', border: '#fecdd3', accent: '#be123c' },
  { bg: '#f0fdfa', border: '#99f6e4', accent: '#0f766e' },
  { bg: '#f8fafc', border: '#cbd5e1', accent: '#475569' },
  { bg: '#fffbeb', border: '#fcd34d', accent: '#92400e' },
];

const IndustryDashboard = () => {
  const { theme } = useTheme();
  const [workerCounts, setWorkerCounts] = useState({});
  const [selections, setSelections] = useState({}); // { specialty: qty }
  const [activeCategory, setActiveCategory] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({ companyName: '', contact: '', location: '', startDate: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = Object.entries(LABOUR_INDUSTRIES);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const allWorkers = await api.getWorkers();
        const counts = {};
        (allWorkers || []).forEach(w => {
          if (w.occupation) counts[w.occupation] = (counts[w.occupation] || 0) + 1;
        });
        setWorkerCounts(counts);
      } catch (e) {
        console.error('Could not load worker counts', e);
      }
    };
    fetchCounts();
  }, []);

  const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);
  const totalCost = Object.entries(selections).reduce((sum, [name, qty]) => {
    for (const cat of Object.values(LABOUR_INDUSTRIES)) {
      const sp = cat.specialties.find(s => s.name === name);
      if (sp) return sum + sp.baseRate * qty;
    }
    return sum;
  }, 0);

  const updateQty = (specialty, delta) => {
    setSelections(prev => {
      const cur = prev[specialty] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) {
        const { [specialty]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [specialty]: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowOrderModal(false); setSelections({}); setOrderForm({ companyName: '', contact: '', location: '', startDate: '', notes: '' }); }, 3000);
  };

  return (
    <>
      {/* ── Hero Banner ── */}
      <div style={{ background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5c 60%, #0d6efd 100%)', padding: '60px 0 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80) center/cover', opacity: 0.08 }} />
        <div className="container position-relative">
          <div className="d-flex align-items-center gap-3 mb-3">
            <span style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.4)', color: '#f5a623', borderRadius: '50px', padding: '6px 18px', fontSize: '0.82rem', fontWeight: 700 }}>
              🏭 Industry Portal
            </span>
          </div>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '2.6rem', lineHeight: 1.2 }}>
            Hire a <span style={{ color: '#f5a623' }}>Workforce</span> at Scale
          </h1>
          <p style={{ color: '#b0c4de', fontSize: '1.05rem', marginTop: 12, maxWidth: 560 }}>
            Browse all trade categories, set exact quantities per role, and submit a single bulk workforce request for your project or factory.
          </p>
          <div className="d-flex gap-4 mt-4 flex-wrap">
            {[['9', 'Trade Categories'], ['40+', 'Specialties'], ['500+', 'Available Workers']].map(([val, label]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 50, padding: '10px 22px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ color: '#f5a623', fontSize: '1.1rem' }}>{val}</strong>
                <span style={{ fontSize: '0.88rem' }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="d-flex gap-3 mt-5 flex-wrap">
            <Link to="/industry-register" style={{ background: '#f5a623', color: '#0a2540', borderRadius: 50, padding: '12px 28px', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-building-add"></i> Register Your Company
            </Link>
            <Link to="/login" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 50, padding: '12px 28px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-box-arrow-in-right"></i> Login to Account
            </Link>
          </div>
        </div>
      </div>

      {/* ── Sticky Cart Bar ── */}
      {totalSelected > 0 && (
        <div style={{ position: 'sticky', top: 60, zIndex: 100, background: 'var(--bg-surface)', padding: '12px 0', borderBottom: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <div className="container d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span style={{ color: '#f5a623', fontWeight: 800, fontSize: '1rem' }}>
                <i className="bi bi-people-fill me-2"></i>{totalSelected} Workers Selected
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Est. daily cost: <strong style={{ color: 'var(--text-main)' }}>₹{totalCost.toLocaleString('en-IN')}/day</strong></span>
            </div>
            <button
              onClick={() => setShowOrderModal(true)}
              style={{ background: '#f5a623', color: '#0a2540', border: 'none', borderRadius: 50, padding: '10px 28px', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer' }}
            >
              <i className="bi bi-send-fill me-2"></i>Request This Workforce
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div style={{ background: 'var(--bg-app)', minHeight: '60vh', padding: '40px 0 80px' }}>
        <div className="container">

          {/* Category filter tabs */}
          <div className="d-flex gap-2 flex-wrap mb-5">
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                border: '1px solid var(--border-color)', borderRadius: 50, padding: '8px 20px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                background: !activeCategory ? 'var(--primary)' : 'var(--card-bg)',
                color: !activeCategory ? '#fff' : 'var(--text-main)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >All Categories</button>
            {categories.map(([name, data]) => (
              <button
                key={name}
                onClick={() => setActiveCategory(activeCategory === name ? null : name)}
                style={{
                  border: '1px solid var(--border-color)', borderRadius: 50, padding: '8px 20px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  background: activeCategory === name ? 'var(--primary)' : 'var(--card-bg)',
                  color: activeCategory === name ? '#fff' : 'var(--text-main)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {data.icon} {name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Category Cards Grid */}
          <div className="row g-4">
            {categories
              .filter(([name]) => !activeCategory || activeCategory === name)
              .map(([catName, catData], idx) => {
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                const isDark = theme === 'dark';
                const dynamicColor = {
                  accent: color.accent,
                  bg: isDark ? 'rgba(255,255,255,0.03)' : color.bg,
                  border: isDark ? 'var(--border-color)' : color.border
                };
                const catSelected = catData.specialties.reduce((sum, sp) => sum + (selections[sp.name] || 0), 0);
                const catWorkers = catData.specialties.reduce((sum, sp) => sum + (workerCounts[sp.name] || 0), 0);

                return (
                  <div key={catName} className="col-lg-6 col-xl-4">
                    <div style={{ background: 'var(--card-bg)', borderRadius: 20, overflow: 'hidden', border: `1.5px solid ${catSelected > 0 ? dynamicColor.accent : 'var(--border-color)'}`, boxShadow: catSelected > 0 ? `0 8px 24px ${dynamicColor.accent}22` : 'var(--shadow-sm)', transition: 'all 0.3s' }}>
                      {/* Category Header */}
                      <div style={{ background: dynamicColor.bg, borderBottom: `1px solid ${dynamicColor.border}`, padding: '18px 20px' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <div style={{ width: 48, height: 48, background: dynamicColor.border, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                              {catData.icon}
                            </div>
                            <div>
                              <h6 style={{ margin: 0, fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem' }}>{catName}</h6>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <i className="bi bi-people-fill me-1"></i>{catWorkers} workers available
                              </span>
                            </div>
                          </div>
                          {catSelected > 0 && (
                            <span style={{ background: dynamicColor.accent, color: '#fff', borderRadius: 50, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 800 }}>
                              {catSelected} selected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specialties List */}
                      <div style={{ padding: '4px 0' }}>
                        {catData.specialties.map((sp) => {
                          const count = selections[sp.name] || 0;
                          const available = workerCounts[sp.name] || 0;
                          return (
                            <div key={sp.name} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>{sp.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sp.desc}</div>
                                <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                                  <span style={{ fontSize: '0.72rem', color: dynamicColor.accent, fontWeight: 700 }}>₹{sp.baseRate}/day</span>
                                  <span style={{ width: 3, height: 3, background: 'var(--border-color)', borderRadius: '50%', display: 'inline-block' }}></span>
                                  <span style={{ fontSize: '0.7rem', color: available > 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                                    {available > 0 ? `${available} online` : 'None online'}
                                  </span>
                                </div>
                              </div>
                              {/* Qty control */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <button
                                  onClick={() => updateQty(sp.name, -1)}
                                  disabled={count === 0}
                                  style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${count > 0 ? dynamicColor.accent : 'var(--border-color)'}`, background: count > 0 ? dynamicColor.bg : 'var(--bg-surface-hover)', color: count > 0 ? dynamicColor.accent : 'var(--text-muted)', fontWeight: 800, fontSize: '1rem', cursor: count > 0 ? 'pointer' : 'default', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >−</button>
                                <span style={{ fontWeight: 800, color: count > 0 ? dynamicColor.accent : 'var(--text-muted)', fontSize: '0.95rem', minWidth: 20, textAlign: 'center' }}>{count}</span>
                                <button
                                  onClick={() => updateQty(sp.name, 1)}
                                  style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${dynamicColor.accent}`, background: dynamicColor.accent, color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Empty state */}
          {totalSelected === 0 && (
            <div className="text-center mt-5 pt-3">
              <i className="bi bi-people" style={{ fontSize: '3rem', color: 'var(--border-color)', display: 'block', marginBottom: 12 }}></i>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Use the + buttons above to select workers by role and quantity</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Order Summary Modal ── */}
      {showOrderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--bg-surface-hover), var(--primary))', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h5 style={{ color: '#fff', fontWeight: 800, margin: 0 }}><i className="bi bi-briefcase-fill me-2"></i>Workforce Request</h5>
                <p style={{ color: '#b0c4de', margin: 0, fontSize: '0.82rem', marginTop: 4 }}>{totalSelected} workers · Est. ₹{totalCost.toLocaleString('en-IN')}/day</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {submitted ? (
                <div className="text-center py-5 px-4">
                  <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🎉</div>
                  <h5 style={{ fontWeight: 800, color: 'var(--text-main)' }}>Request Submitted!</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Our team will contact you within 2 hours to confirm worker assignments.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Selection Summary */}
                  <div style={{ padding: '16px 24px', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, fontSize: '0.85rem' }}>Selected Workers</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {Object.entries(selections).map(([name, qty]) => (
                        <div key={name} style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border-color)', borderRadius: 50, padding: '4px 14px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{qty}</span>
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Company Form */}
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      { label: 'Company / Industry Name', key: 'companyName', placeholder: 'e.g. Sharma Construction Ltd.', icon: 'bi-building' },
                      { label: 'Contact Number', key: 'contact', placeholder: '+91 98765 43210', icon: 'bi-telephone' },
                      { label: 'Work Location / Site Address', key: 'location', placeholder: 'e.g. Andheri East, Mumbai', icon: 'bi-geo-alt' },
                      { label: 'Start Date', key: 'startDate', placeholder: '', icon: 'bi-calendar', type: 'date' },
                    ].map(({ label, key, placeholder, icon, type }) => (
                      <div key={key}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6, display: 'block' }}>{label}</label>
                        <div style={{ position: 'relative' }}>
                          <i className={`bi ${icon}`} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                          <input
                            type={type || 'text'}
                            required
                            placeholder={placeholder}
                            value={orderForm[key]}
                            onChange={e => setOrderForm(p => ({ ...p, [key]: e.target.value }))}
                            style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, border: '1.5px solid var(--border-color)', borderRadius: 12, fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', background: 'var(--input-bg)', color: 'var(--text-main)' }}
                          />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6, display: 'block' }}>Additional Notes (optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Any special requirements, shift timings, tools needed..."
                        value={orderForm.notes}
                        onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))}
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border-color)', borderRadius: 12, fontSize: '0.88rem', resize: 'none', outline: 'none', fontFamily: 'inherit', background: 'var(--input-bg)', color: 'var(--text-main)' }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '16px 24px', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12 }}>
                    <button type="button" onClick={() => setShowOrderModal(false)} style={{ flex: 1, padding: '11px', border: '1.5px solid var(--border-color)', borderRadius: 12, fontWeight: 700, background: 'var(--card-bg)', cursor: 'pointer', color: 'var(--text-main)' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 12, fontWeight: 800, background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>
                      {submitting ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Submitting...</>
                      ) : (
                        <><i className="bi bi-send-fill me-2"></i>Submit Workforce Request</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IndustryDashboard;

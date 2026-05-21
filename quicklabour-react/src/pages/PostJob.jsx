import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

// ─────────────────────────────────────────────
//  PRICING CONFIG — edit rates here anytime
// ─────────────────────────────────────────────
const SERVICE_PRICING = {
  'Electric Work': { visitCharge: 80, baseRate: 800, icon: '⚡', desc: 'Wiring, switches, appliance repairs' },
  'Plumbing': { visitCharge: 80, baseRate: 700, icon: '🔧', desc: 'Leakages, pipes, taps & faucets' },
  'Painting': { visitCharge: 80, baseRate: 650, icon: '🎨', desc: 'Wall painting, textures, polishing' },
  'Carpenter': { visitCharge: 80, baseRate: 750, icon: '🪚', desc: 'Furniture, doors, wood fittings' },
  'Welder': { visitCharge: 80, baseRate: 900, icon: '🔥', desc: 'Metal work, grills, fabrication' },
  'Driver': { visitCharge: 80, baseRate: 500, icon: '🚗', desc: 'Personal/commercial driving service' },
  'Cleaning': { visitCharge: 50, baseRate: 450, icon: '🧹', desc: 'Deep cleaning, housekeeping' },
  'Mason': { visitCharge: 80, baseRate: 850, icon: '🧱', desc: 'Brick laying, plastering, flooring' },
};


const PostJob = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'Electric Work';

  // ── Form State ────────────────────────────── 
  const [formData, setFormData] = useState({
    name: sessionStorage.getItem('userName') || '',
    location: sessionStorage.getItem('userAddress') || '',
    fullAddress: '',
    latitude: null,
    longitude: null,
    repair: initialCategory,
    days: 1,
    money: '',        // auto-calculated but editable
  });

  const [locStatus, setLocStatus] = useState('idle');
  const [locError, setLocError] = useState('');
  const [section, setSection] = useState('form');     // form | confirm | submitted
  const [dbJob, setDbJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Pricing Calculations ─────────────────────
  const pricing = SERVICE_PRICING[formData.repair] || SERVICE_PRICING['Electric Work'];
  const days = Math.max(1, Number(formData.days) || 1);
  const visitCharge = pricing.visitCharge;
  const laborCost = pricing.baseRate * days;
  const totalCost = visitCharge + laborCost;

  // Sync money field with auto-calculation
  useEffect(() => {
    setFormData(prev => ({ ...prev, money: totalCost }));
  }, [formData.repair, formData.days, totalCost]);

  useEffect(() => {
    if (!sessionStorage.getItem('userRole')) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const cat = queryParams.get('category');
    if (cat && SERVICE_PRICING[cat]) {
      setFormData(prev => ({ ...prev, repair: cat }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // ── Live GPS ─────────────────────────────────
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported.'); return; }
    setLocStatus('fetching'); setLocError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Your Area';
          setFormData(prev => ({ ...prev, location: city, fullAddress: data.display_name || '', latitude, longitude }));
          setLocStatus('success');
        } catch {
          setFormData(prev => ({ ...prev, location: `${latitude.toFixed(5)},${longitude.toFixed(5)}`, latitude, longitude }));
          setLocStatus('success');
        }
      },
      (err) => { setLocStatus('error'); setLocError(err.code === 1 ? 'Permission denied. Allow location access.' : 'Could not get location.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapsLink = formData.latitude && formData.longitude
    ? `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`
    : formData.fullAddress
      ? `https://www.google.com/maps/search/${encodeURIComponent(formData.fullAddress)}`
      : null;

  // ── Submit ────────────────────────────────────
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const created = await api.createJob({ ...formData, money: totalCost });
      setDbJob(created);
      setSection('submitted');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
    setSubmitting(false);
  };

  // ── Reusable price row ────────────────────────
  const PriceRow = ({ label, amount, bold, color, border }) => (
    <div className="d-flex justify-content-between align-items-center py-2" style={{ borderTop: border ? '1.5px dashed #dee2e6' : 'none' }}>
      <span className={`small ${bold ? 'fw-bold' : 'text-muted'}`} style={{ color: color || 'inherit' }}>{label}</span>
      <span className={`fw-bold ${bold ? 'fs-6' : 'small'}`} style={{ color: color || '#1a1a2e' }}>₹{amount.toLocaleString('en-IN')}</span>
    </div>
  );

  return (
    <div className="container py-5 mt-4" style={{ maxWidth: '700px' }}>

      {/* ═══════════════ FORM SECTION ═══════════════ */}
      {section === 'form' && (
        <>
          {/* Header */}
          <div className="text-center mb-4">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#0d6efd,#6610f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(13,110,253,.3)' }}>
              🛠️
            </div>
            <h2 style={{ fontWeight: 800, color: '#1a1a2e' }}>Book a Service</h2>
            <p className="text-muted small">Select your service, see the exact cost, then confirm your booking.</p>
          </div>

          <div className="row g-4">
            {/* ── LEFT: Form fields ── */}
            <div className="col-lg-7">
              <div className="p-4 rounded-4 shadow-sm" style={{ background: '#fff', border: '1.5px solid #e8ecf8' }}>

                {/* Name */}
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">👤 Your Name</label>
                  <input type="text" className="form-control rounded-3 py-2" id="name" placeholder="Full name" value={formData.name} onChange={handleChange} required />
                </div>

                {/* Service Type */}
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">🔧 Service Required</label>
                  <div className="row g-2">
                    {Object.entries(SERVICE_PRICING).map(([svc, info]) => (
                      <div className="col-6" key={svc}>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, repair: svc }))}
                          className="w-100 rounded-3 border-0 py-2 px-2 text-start"
                          style={{
                            background: formData.repair === svc ? 'linear-gradient(135deg,#0d6efd,#6610f2)' : '#f8f9ff',
                            color: formData.repair === svc ? '#fff' : '#495057',
                            fontWeight: formData.repair === svc ? 700 : 500,
                            fontSize: '0.82rem',
                            transition: 'all 0.2s',
                            border: formData.repair === svc ? 'none' : '1.5px solid #e0e7ff',
                          }}
                        >
                          <span style={{ fontSize: '1.1rem', marginRight: 6 }}>{info.icon}</span>{svc}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 small text-muted" style={{ fontSize: '0.75rem' }}>
                    {pricing.icon} <em>{pricing.desc}</em>
                  </div>
                </div>

                {/* Days */}
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">📅 Number of Days Required</label>
                  <div className="d-flex align-items-center gap-2">
                    <button type="button" className="btn btn-outline-secondary rounded-3 px-3 fw-bold" style={{ fontSize: '1.2rem' }}
                      onClick={() => setFormData(prev => ({ ...prev, days: Math.max(1, (Number(prev.days) || 1) - 1) }))}
                    >−</button>
                    <input
                      type="number" id="days" min={1} max={30}
                      className="form-control rounded-3 text-center fw-bold py-2" style={{ width: 70, fontSize: '1.1rem' }}
                      value={formData.days}
                      onChange={e => setFormData(prev => ({ ...prev, days: Math.max(1, Number(e.target.value) || 1) }))}
                    />
                    <button type="button" className="btn btn-outline-secondary rounded-3 px-3 fw-bold" style={{ fontSize: '1.2rem' }}
                      onClick={() => setFormData(prev => ({ ...prev, days: Math.min(30, (Number(prev.days) || 1) + 1) }))}
                    >+</button>
                    <span className="text-muted small ms-1">day{days > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">📍 Area / City</label>
                  <div className="input-group">
                    <input type="text" className="form-control rounded-start-3 py-2" id="location" placeholder="e.g. Amritsar" value={formData.location} onChange={handleChange} required />
                    <button type="button"
                      className="btn px-2 fw-bold"
                      style={{ background: locStatus === 'success' ? 'linear-gradient(135deg,#198754,#0f5132)' : 'linear-gradient(135deg,#0d6efd,#6610f2)', color: '#fff', borderRadius: '0 12px 12px 0', fontSize: '0.75rem', minWidth: 120, whiteSpace: 'nowrap' }}
                      onClick={handleGetLiveLocation}
                      disabled={locStatus === 'fetching'}
                    >
                      {locStatus === 'fetching' && <span className="spinner-border spinner-border-sm me-1" />}
                      {locStatus === 'success' ? '✅ Set' : '📡 Live Location'}
                    </button>
                  </div>
                  {locError && <div className="text-danger small mt-1">⚠️ {locError}</div>}
                </div>

                {/* Full Address */}
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">🏠 Full Address <span className="fw-normal text-muted">(House, Street, Landmark)</span></label>
                  <textarea className="form-control rounded-3 py-2" id="fullAddress" rows={2} placeholder="e.g. House No. 12, Ranjit Avenue, Near DAV School, Amritsar" value={formData.fullAddress} onChange={handleChange} style={{ resize: 'none', fontSize: '0.88rem' }} />
                  {mapsLink && (
                    <a href={mapsLink} target="_blank" rel="noreferrer" className="small fw-bold d-inline-block mt-1 text-decoration-none" style={{ color: '#0d6efd' }}>🗺️ Preview on Maps →</a>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Price Calculator ── */}
            <div className="col-lg-5">
              <div className="rounded-4 shadow-sm overflow-hidden" style={{ border: '1.5px solid #e8ecf8', position: 'sticky', top: '90px' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', padding: '16px 20px', color: '#fff' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>💰 Price Estimate</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Auto-calculated based on your selection</div>
                </div>

                {/* Breakdown */}
                <div className="p-3 bg-white">
                  <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded-3" style={{ background: '#f0f4ff' }}>
                    <span style={{ fontSize: '1.5rem' }}>{pricing.icon}</span>
                    <div>
                      <div className="fw-bold small" style={{ color: '#0d6efd' }}>{formData.repair}</div>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>{pricing.desc}</div>
                    </div>
                  </div>

                  <PriceRow label={`🚗 Visiting / Inspection Charge`} amount={visitCharge} />
                  <PriceRow label={`👷 Labour: ₹${pricing.baseRate.toLocaleString('en-IN')} × ${days} day${days > 1 ? 's' : ''}`} amount={laborCost} />

                  <div className="rounded-3 p-3 mt-2 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg,#0d6efd15,#6610f215)', border: '1.5px solid #c7d7ff' }}>
                    <span className="fw-bold" style={{ color: '#1a1a2e' }}>💳 Total Payable</span>
                    <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#0d6efd' }}>₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="text-muted mt-2" style={{ fontSize: '0.68rem', lineHeight: 1.5 }}>
                    * Visiting charge is one-time. Final labour cost may vary based on work scope.
                  </div>
                </div>

                {/* Confirm Button */}
                <div className="p-3 border-top bg-white">
                  <button
                    className="btn w-100 py-3 fw-bold rounded-3"
                    style={{ background: !formData.name || !formData.location ? '#dee2e6' : 'linear-gradient(135deg,#0d6efd,#6610f2)', color: !formData.name || !formData.location ? '#6c757d' : '#fff', border: 'none', fontSize: '1rem', transition: 'all .2s' }}
                    disabled={!formData.name || !formData.location}
                    onClick={() => setSection('confirm')}
                  >
                    Review &amp; Confirm →
                  </button>
                  {(!formData.name || !formData.location) && (
                    <div className="text-center text-danger small mt-1" style={{ fontSize: '0.75rem' }}>Please fill Name and Location first.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ CONFIRM SECTION ═══════════════ */}
      {section === 'confirm' && (
        <div className="mx-auto" style={{ maxWidth: '520px' }}>
          <div className="text-center mb-4">
            <div style={{ fontSize: '2.5rem' }}>📋</div>
            <h3 style={{ fontWeight: 800, color: '#1a1a2e' }}>Confirm Your Booking</h3>
            <p className="text-muted small">Review all details before sending your request to our workers.</p>
          </div>

          <div className="rounded-4 shadow-sm overflow-hidden" style={{ border: '1.5px solid #e8ecf8' }}>
            {/* Service summary block */}
            <div style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', padding: '20px 24px', color: '#fff' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{pricing.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{formData.repair}</div>
              <div style={{ opacity: 0.85, fontSize: '0.82rem' }}>{pricing.desc}</div>
            </div>

            <div className="p-4 bg-white">
              {/* Detail rows */}
              {[
                ['👤 Client Name', formData.name],
                ['📍 Area', formData.location],
                ['📅 Duration', `${days} day${days > 1 ? 's' : ''}`],
              ].map(([label, val]) => (
                <div key={label} className="d-flex justify-content-between py-2 border-bottom small">
                  <span className="text-muted fw-bold">{label}</span>
                  <span className="fw-bold text-dark">{val}</span>
                </div>
              ))}

              {formData.fullAddress && (
                <div className="py-2 border-bottom">
                  <div className="text-muted fw-bold small mb-1">🏠 Full Address</div>
                  <div className="small fw-bold" style={{ lineHeight: 1.6 }}>{formData.fullAddress}</div>
                  {mapsLink && (
                    <a href={mapsLink} target="_blank" rel="noreferrer" className="d-inline-flex align-items-center gap-1 mt-2 fw-bold" style={{ background: '#0d6efd', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: '0.75rem', textDecoration: 'none' }}>
                      🗺️ Open in Maps
                    </a>
                  )}
                </div>
              )}

              {/* Price breakdown in confirm */}
              <div className="mt-3 p-3 rounded-3" style={{ background: '#f8f9ff', border: '1px solid #e0e7ff' }}>
                <div className="fw-bold small mb-2 text-muted">💰 Cost Breakdown</div>
                <PriceRow label="🚗 Visiting Charge" amount={visitCharge} />
                <PriceRow label={`👷 Labour (${days}d × ₹${pricing.baseRate.toLocaleString('en-IN')})`} amount={laborCost} />
                <div className="d-flex justify-content-between align-items-center mt-2 pt-2" style={{ borderTop: '2px solid #c7d7ff' }}>
                  <span className="fw-bold" style={{ color: '#1a1a2e' }}>💳 Total Payable</span>
                  <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#0d6efd' }}>₹{totalCost.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-outline-secondary flex-fill py-2 rounded-3 fw-bold" onClick={() => setSection('form')}>
                  ← Edit Details
                </button>
                <button
                  className="btn flex-fill py-2 rounded-3 fw-bold"
                  style={{ background: 'linear-gradient(135deg,#198754,#0f5132)', color: '#fff', border: 'none' }}
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                >
                  {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</> : '✅ Confirm & Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ SUBMITTED SECTION ═══════════════ */}
      {section === 'submitted' && (
        <div className="mx-auto text-center" style={{ maxWidth: '480px' }}>
          <div className="rounded-4 shadow-sm p-5 bg-white" style={{ border: '1.5px solid #e8ecf8' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontWeight: 800, color: '#1a1a2e' }}>Request Sent!</h3>
            <p className="text-muted small mb-4">Your {formData.repair} request has been broadcast to nearby verified workers. You'll be notified once a worker accepts.</p>

            {/* Summary chip */}
            <div className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill mb-4" style={{ background: 'linear-gradient(135deg,#0d6efd15,#6610f215)', border: '1.5px solid #c7d7ff' }}>
              <span style={{ fontSize: '1.2rem' }}>{pricing.icon}</span>
              <span className="fw-bold" style={{ color: '#0d6efd' }}>{formData.repair}</span>
              <span className="text-muted">•</span>
              <span style={{ fontWeight: 900, color: '#0d6efd' }}>₹{totalCost.toLocaleString('en-IN')}</span>
            </div>

            {mapsLink && (
              <div className="mb-3">
                <a href={mapsLink} target="_blank" rel="noreferrer" className="btn fw-bold" style={{ background: 'linear-gradient(135deg,#198754,#0f5132)', color: '#fff', borderRadius: 10, textDecoration: 'none', padding: '10px 24px' }}>
                  🗺️ View Your Location on Maps
                </a>
              </div>
            )}

            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary rounded-3 px-4 fw-bold" onClick={() => { setSection('form'); setDbJob(null); }}>
                📋 New Request
              </button>
              <button className="btn rounded-3 px-4 fw-bold" style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', color: '#fff', border: 'none' }} onClick={() => navigate('/client-dashboard')}>
                🏠 Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostJob;

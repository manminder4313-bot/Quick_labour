import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, LABOUR_INDUSTRIES } from '../utils/api';

// Helper to get pricing, icon and description for any specialty dynamically
const getServicePricing = (specialtyName) => {
  for (const [industryName, info] of Object.entries(LABOUR_INDUSTRIES)) {
    const spec = info.specialties.find(s => s.name === specialtyName);
    if (spec) {
      return {
        visitCharge: spec.visitCharge,
        baseRate: spec.baseRate,
        icon: info.icon,
        desc: spec.desc
      };
    }
  }
  // Fallback default pricing
  return { visitCharge: 80, baseRate: 600, icon: '🛠️', desc: 'General professional support services' };
};

// Itemized list of works with rates for each main occupation type
const SPECIALTY_SUB_SERVICES = {
  "Electrician": [
    { id: "elec_switch", name: "Switchboard Installation & Repairs", rate: 250 },
    { id: "elec_fan", name: "Ceiling Fan Repair & Fitting", rate: 350 },
    { id: "elec_light", name: "LED/Tube Light Mounting & Repairs", rate: 180 },
    { id: "elec_wiring", name: "Complete Room Re-wiring Service", rate: 600 },
    { id: "elec_appliance", name: "Home Appliance Circuit Diagnosis", rate: 450 }
  ],
  "Plumber": [
    { id: "plumb_tap", name: "Tap/Faucet Leak Repair & Fitting", rate: 150 },
    { id: "plumb_clog", name: "Kitchen Sink/Drain Blockage Clearing", rate: 300 },
    { id: "plumb_pipe", name: "PVC/GI Pipeline Leak Patching", rate: 400 },
    { id: "plumb_toilet", name: "Toilet Flush Tank Component Overhaul", rate: 380 },
    { id: "plumb_geyser", name: "Water Geyser Pipeline Fixing", rate: 500 }
  ],
  "Carpenter": [
    { id: "carp_handle", name: "Door Handle & Lock Installation", rate: 280 },
    { id: "carp_hinge", name: "Cabinet Hinges Alignment & Repair", rate: 180 },
    { id: "carp_furniture", name: "Wooden Chairs & Sofa Frame Polish/Fix", rate: 450 },
    { id: "carp_door", name: "Wooden Door Frame Repair & Trimming", rate: 500 },
    { id: "carp_drawer", name: "Kitchen Drawer Runner Replacement", rate: 350 }
  ],
  "Painter": [
    { id: "paint_touchup", name: "Minor Wall Stains Patch Painting", rate: 300 },
    { id: "paint_room", name: "Single Bedroom Complete Coat Painting", rate: 1200 },
    { id: "paint_stencil", name: "Designer Accent Wall Painting", rate: 850 },
    { id: "paint_polish", name: "Teak Wood Door Varnish/Polishing", rate: 550 },
    { id: "paint_putty", name: "Wall Cracks Putty Application & Sanding", rate: 400 }
  ],
  "Mason": [
    { id: "mason_plaster", name: "Wall Plastering Crack Remediation", rate: 450 },
    { id: "mason_tile", name: "Broken Tile/Marble Replacement", rate: 380 },
    { id: "mason_brick", name: "Cement Brick Boundary Construction (per sqft)", rate: 750 },
    { id: "mason_flooring", name: "Bathroom Concrete Slope Correction", rate: 600 }
  ],
  "Construction Labour": [
    { id: "const_load", name: "Heavy Sand/Cement Bag Manual Loading", rate: 350 },
    { id: "const_debris", name: "Post-Renovation Debris Cleaning & Disposal", rate: 300 },
    { id: "const_digging", name: "Ground Excavation & Trench Digging", rate: 400 }
  ]
};

// Fallback dynamic sub-services mapping for other occupations
const getSubServices = (specialty) => {
  return SPECIALTY_SUB_SERVICES[specialty] || [
    { id: "gen_inspect", name: `General ${specialty} Inspection & Diagnosis`, rate: 200 },
    { id: "gen_standard", name: `Standard ${specialty} Repair Job`, rate: 450 },
    { id: "gen_install", name: `Standard ${specialty} Mounting / Fitting`, rate: 550 }
  ];
};

const PostJob = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || '';

  // Direct booking parameters from Worker Card click
  const [directWorker] = useState(() => {
    const workerId = queryParams.get('workerId');
    const workerName = queryParams.get('workerName');
    const workerAvatar = queryParams.get('workerAvatar');
    return workerId ? { id: workerId, name: workerName, avatar: workerAvatar } : null;
  });

  // ── Form State ────────────────────────────── 
  const [formData, setFormData] = useState({
    name: sessionStorage.getItem('userName') || '',
    phone: sessionStorage.getItem('userPhone') || '',
    location: sessionStorage.getItem('userAddress') || '',
    fullAddress: '',
    latitude: null,
    longitude: null,
    repair: initialCategory,
    days: 1,
    money: '',
  });

  const [selectedWorks, setSelectedWorks] = useState([]);
  const [locStatus, setLocStatus] = useState('idle');
  const [locError, setLocError] = useState('');
  const [section, setSection] = useState('form');     // form | confirm | submitted
  const [dbJob, setDbJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selections, setSelections] = useState(() => {
    return initialCategory ? { [initialCategory]: 1 } : {};
  });
  const [workersNeeded, setWorkersNeeded] = useState(1);
  const [workersInArea, setWorkersInArea] = useState([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // Derive initial industry from initialCategory
  const getInitialIndustry = () => {
    for (const [ind, info] of Object.entries(LABOUR_INDUSTRIES)) {
      if (info.specialties.some(s => s.name === initialCategory)) return ind;
    }
    return Object.keys(LABOUR_INDUSTRIES)[0];
  };
  const [selectedIndustry, setSelectedIndustry] = useState(getInitialIndustry);

  // Sync selections with repair description and workersNeeded count
  useEffect(() => {
    const sum = Object.values(selections).reduce((a, b) => a + b, 0);
    setWorkersNeeded(sum > 0 ? sum : 1);

    const description = Object.entries(selections)
      .map(([trade, qty]) => `${qty} ${trade}`)
      .join(', ');
    
    setFormData(prev => ({
      ...prev,
      repair: description || initialCategory
    }));
  }, [selections, initialCategory]);

  // Reset and auto-select first sub-service when repair specialty changes
  useEffect(() => {
    const selectedTrades = Object.keys(selections);
    const allServices = selectedTrades.flatMap(trade => getSubServices(trade));
    if (allServices.length > 0) {
      setSelectedWorks(prev => {
        const valid = prev.filter(id => allServices.some(s => s.id === id));
        if (valid.length === 0) return [allServices[0].id];
        return valid;
      });
    } else {
      setSelectedWorks([]);
    }
  }, [selections]);

  // Pricing calculations
  const selectedTrades = Object.keys(selections);
  const visitCharge = selectedTrades.length > 0 
    ? Math.max(...selectedTrades.map(t => getServicePricing(t).visitCharge)) 
    : 80;
  const currentSubServices = selectedTrades.length > 0 
    ? selectedTrades.flatMap(trade => getSubServices(trade))
    : getSubServices(formData.repair);
  
  const pricing = getServicePricing(selectedTrades[0] || formData.repair);
  
  // Calculate selected sub-services cost
  const selectedSubServicesData = currentSubServices.filter(s => selectedWorks.includes(s.id));
  const laborCost = selectedSubServicesData.reduce((sum, item) => sum + item.rate, 0);
  const totalCost = selectedTrades.length > 0 
    ? visitCharge + (laborCost * (directWorker ? 1 : Number(workersNeeded)))
    : 0;

  // Sync money field with auto-calculation
  useEffect(() => {
    setFormData(prev => ({ ...prev, money: totalCost }));
  }, [totalCost]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const fetchMatchingWorkers = async () => {
      setLoadingWorkers(true);
      try {
        const all = await api.getWorkers();
        const activeTrades = Object.keys(selections).map(t => t.toLowerCase());
        
        // Filter by occupation and matching role
        const matching = (all || []).filter(w => 
          w.role === 'worker' &&
          w.occupation &&
          (activeTrades.length === 0 || activeTrades.some(trade => w.occupation.toLowerCase().includes(trade)))
        );

        // Map and compute real distance
        const mapped = matching.map(w => {
          const dist = calculateDistance(
            formData.latitude,
            formData.longitude,
            w.latitude,
            w.longitude
          );
          return {
            ...w,
            distance: dist,
            distanceText: dist !== null ? `${dist.toFixed(1)} km away` : 'Location not shared'
          };
        });

        // Sort by distance (closest first)
        mapped.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

        setWorkersInArea(mapped);
        setSelectedWorkerIds([]);
      } catch (err) {
        console.error('Error fetching workers matching specialty:', err);
      } finally {
        setLoadingWorkers(false);
      }
    };

    if (Object.keys(selections).length > 0) {
      fetchMatchingWorkers();
    }
  }, [selections, formData.latitude, formData.longitude]);

  useEffect(() => {
    if (!sessionStorage.getItem('userRole')) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const cat = queryParams.get('category');
    if (cat && getServicePricing(cat).desc !== 'General professional support services') {
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
      const selectedTaskNames = selectedSubServicesData.map(s => s.name).join(', ');
      const payload = {
        ...formData,
        repair: selectedTaskNames ? `${formData.repair} (${selectedTaskNames})` : formData.repair,
        money: totalCost,
        workersNeeded: directWorker ? 1 : Number(workersNeeded),
        invitedWorkers: directWorker ? [] : selectedWorkerIds
      };
      if (directWorker) {
        payload.workerId = directWorker.id;
      }
      const created = await api.createJob(payload);
      setDbJob(created);
      setSection('submitted');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
    setSubmitting(false);
  };

  const handleToggleWork = (workId) => {
    setSelectedWorks(prev => {
      if (prev.includes(workId)) {
        // Keep at least one selected so the bill isn't completely empty
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== workId);
      }
      return [...prev, workId];
    });
  };

  // ── Reusable price row ────────────────────────
  const PriceRow = ({ label, amount, bold, color, border }) => (
    <div className="d-flex justify-content-between align-items-center py-2" style={{ borderTop: border ? '1.5px dashed #dee2e6' : 'none' }}>
      <span className={`small ${bold ? 'fw-bold' : 'text-muted'}`} style={{ color: color || 'inherit' }}>{label}</span>
      <span className={`fw-bold ${bold ? 'fs-6' : 'small'}`} style={{ color: color || '#1a1a2e' }}>₹{amount.toLocaleString('en-IN')}</span>
    </div>
  );

  return (
    <div className="container py-5 mt-4" style={{ maxWidth: '850px' }}>

      {/* ═══════════════ FORM SECTION ═══════════════ */}
      {section === 'form' && (
        <>
          {/* Header */}
          <div className="text-center mb-4">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: directWorker ? 'linear-gradient(135deg,#198754,#0f5132)' : 'linear-gradient(135deg,#0d6efd,#6610f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 12px', boxShadow: directWorker ? '0 8px 24px rgba(25,135,84,.3)' : '0 8px 24px rgba(13,110,253,.3)' }}>
              {directWorker ? '⚡' : '🛠️'}
            </div>
            <h2 style={{ fontWeight: 800, color: '#1a1a2e' }}>
              {directWorker ? `Hire ${directWorker.name}` : 'Book a Service'}
            </h2>
            <p className="text-muted small">
              {directWorker ? `Fill in your task details below to hire ${directWorker.name} directly.` : 'Fill in your details, select your industry, choose occupation, and pick your tasks.'}
            </p>
          </div>

          {/* Direct Worker Alert Card */}
          {directWorker && (
            <div className="mb-4 p-3 rounded-4 border d-flex align-items-center gap-3 animate-fade-in" style={{ background: 'linear-gradient(135deg, rgba(25,135,84,0.06), rgba(15,81,50,0.06))', borderColor: '#19875440' }}>
              <img src={directWorker.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&q=80'} alt={directWorker.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '3px solid #198754' }} />
              <div>
                <span className="badge bg-success rounded-pill fw-bold small mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>⚡ DIRECT HIRE REQUEST</span>
                <h5 className="mb-0 fw-800 text-dark" style={{ fontSize: '1rem', fontWeight: 800 }}>{directWorker.name}</h5>
                <p className="mb-0 text-muted small" style={{ fontSize: '0.8rem' }}>The worker will receive your request immediately. Their default specialty matches your service type.</p>
              </div>
            </div>
          )}

          {/* 1. TOP BOX: Client & Location Details */}
          <div className="p-4 rounded-4 shadow-sm mb-4" style={{ background: '#fff', border: '1.5px solid #e8ecf8' }}>
            <h5 className="fw-800 mb-3" style={{ color: '#0a2540', fontSize: '1.05rem' }}>
              <span className="me-2">👤</span> 1. Client &amp; Location Details
            </h5>
            
            <div className="row g-3">
              {/* Client Name */}
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted">Client Full Name</label>
                <input type="text" className="form-control rounded-3 py-2" id="name" placeholder="Full name" value={formData.name} onChange={handleChange} required />
              </div>

              {/* Contact Number */}
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted">Contact Mobile Number</label>
                <input type="tel" className="form-control rounded-3 py-2" id="phone" placeholder="e.g. +91 98765 43210" value={formData.phone} onChange={handleChange} required />
              </div>

              {/* Area / City + Live Location button */}
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted">Area / City Location</label>
                <div className="input-group">
                  <input type="text" className="form-control rounded-start-3 py-2" id="location" placeholder="e.g. Amritsar" value={formData.location} onChange={handleChange} required />
                  <button type="button"
                    className="btn px-2 fw-bold"
                    style={{ background: locStatus === 'success' ? 'linear-gradient(135deg,#198754,#0f5132)' : 'linear-gradient(135deg,#0d6efd,#6610f2)', color: '#fff', borderRadius: '0 12px 12px 0', fontSize: '0.75rem', minWidth: 120, whiteSpace: 'nowrap' }}
                    onClick={handleGetLiveLocation}
                    disabled={locStatus === 'fetching'}
                  >
                    {locStatus === 'fetching' && <span className="spinner-border spinner-border-sm me-1" />}
                    {locStatus === 'success' ? '✅ Set GPS' : '📡 Live Location'}
                  </button>
                </div>
                {locError && <div className="text-danger small mt-1">⚠️ {locError}</div>}
              </div>

              {/* Full Address */}
              <div className="col-md-6">
                <label className="form-label fw-bold small text-muted">Full Address (House, Street, Landmark)</label>
                <textarea className="form-control rounded-3 py-1" id="fullAddress" rows={2} placeholder="e.g. House No. 12, Ranjit Avenue, Near DAV School, Amritsar" value={formData.fullAddress} onChange={handleChange} style={{ resize: 'none', fontSize: '0.88rem' }} />
                {mapsLink && (
                  <a href={mapsLink} target="_blank" rel="noreferrer" className="small fw-bold d-inline-block mt-1 text-decoration-none" style={{ color: directWorker ? '#198754' : '#0d6efd' }}>🗺️ Preview on Maps →</a>
                )}
              </div>
            </div>
          </div>

          {/* 2. MIDDLE BOXES: Select Industry & Occupation */}
          {!directWorker && (
            <div className="row g-3 mb-4">
              {/* Box 1: Select Industry */}
              <div className="col-md-5">
                <div className="p-4 rounded-4 shadow-sm h-100" style={{ background: '#fff', border: '1.5px solid #e8ecf8' }}>
                  <h5 className="fw-800 mb-3" style={{ color: '#0a2540', fontSize: '1.02rem' }}>
                    <span className="me-2">🏢</span> 2.1. Select Industry
                  </h5>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '5px' }}>
                    {Object.entries(LABOUR_INDUSTRIES).map(([industry, info]) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => {
                          setSelectedIndustry(industry);
                          setSelections({});
                        }}
                        className={`text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 transition ${selectedIndustry === industry ? 'text-white' : 'text-dark'}`}
                        style={{
                          background: selectedIndustry === industry ? 'linear-gradient(135deg,#0d6efd,#6610f2)' : '#f8f9ff',
                          fontWeight: selectedIndustry === industry ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          boxShadow: selectedIndustry === industry ? '0 4px 12px rgba(13,110,253,.2)' : 'none',
                          border: selectedIndustry === industry ? 'none' : '1px solid #e0e7ff',
                          transition: 'all 0.18s'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{info.icon}</span>
                        <span>{industry}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 2: Specialties list with custom quantities */}
              <div className="col-md-7">
                <div className="p-4 rounded-4 shadow-sm h-100" style={{ background: '#fff', border: '1.5px solid #e8ecf8' }}>
                  <h5 className="fw-800 mb-1" style={{ color: '#0a2540', fontSize: '1.02rem' }}>
                    <span className="me-2">👷</span> 2.2. Select Occupations &amp; Worker Quantities
                  </h5>
                  <p className="text-muted small mb-3">Set the number of workers needed for each trade below.</p>
                  
                  {selectedIndustry ? (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '5px' }}>
                      {LABOUR_INDUSTRIES[selectedIndustry].specialties.map((spec) => {
                        const count = selections[spec.name] || 0;
                        return (
                          <div
                            key={spec.name}
                            className="d-flex align-items-center justify-content-between p-2 px-3 rounded-3 border transition"
                            style={{
                              border: count > 0 ? '1.8px solid #0d6efd' : '1px solid #e2e8f0',
                              background: count > 0 ? 'rgba(13,110,253,0.03)' : '#fff',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div className="min-w-0 flex-grow-1 me-2">
                              <div className="fw-800 text-dark small" style={{ fontSize: '0.86rem' }}>
                                {count > 0 ? '✅ ' : '🔧 '} {spec.name}
                              </div>
                              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                Standard: ₹{spec.baseRate}/day · {spec.desc || 'Verified support'}
                              </div>
                            </div>
                            
                            <div className="d-flex align-items-center gap-2 bg-light p-1 rounded-pill border" style={{ minWidth: 92, justifyContent: 'space-between' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelections(prev => {
                                    const cur = prev[spec.name] || 0;
                                    const next = Math.max(0, cur - 1);
                                    if (next === 0) {
                                      const { [spec.name]: _, ...rest } = prev;
                                      return rest;
                                    }
                                    return { ...prev, [spec.name]: next };
                                  });
                                }}
                                className="btn btn-sm btn-white d-flex align-items-center justify-content-center shadow-sm"
                                style={{ width: 26, height: 26, borderRadius: '50%', fontWeight: '900', border: '1px solid #dee2e6', background: '#fff', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}
                              >−</button>
                              <span className="fw-900 text-dark" style={{ minWidth: 16, textAlign: 'center', fontSize: '0.88rem' }}>
                                {count}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelections(prev => ({
                                    ...prev,
                                    [spec.name]: (prev[spec.name] || 0) + 1
                                  }));
                                }}
                                className="btn btn-sm btn-white d-flex align-items-center justify-content-center shadow-sm"
                                style={{ width: 26, height: 26, borderRadius: '50%', fontWeight: '900', border: '1px solid #dee2e6', background: '#fff', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}
                              >+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted small">Please select an industry first.</div>
                  )}
                </div>
              </div>
            </div>
          )}



          {/* 3. BOTTOM SECTION: Tasks Required and Hired Bill Breakdown */}
          <div className="row g-4">
            
            {/* LEFT: Specific Tasks Required */}
            <div className="col-md-7">
              <div className="p-4 rounded-4 shadow-sm h-100" style={{ background: '#fff', border: '1.5px solid #e8ecf8' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-800 mb-0" style={{ color: '#0a2540', fontSize: '1.05rem' }}>
                    <span className="me-2">🛠️</span> 3. Select Tasks Needed
                  </h5>
                  <span className="badge bg-secondary rounded-pill small" style={{ fontSize: '0.72rem' }}>
                    {currentSubServices.length} options
                  </span>
                </div>

                <p className="text-muted small mb-3">Choose the specific type of works you need. Check or uncheck tasks below:</p>

                <div className="d-flex flex-column gap-3">
                  {selectedTrades.length === 0 ? (
                    <div className="text-center py-4 text-muted small">Please select occupations first in Step 2.2 to view tasks.</div>
                  ) : (
                    selectedTrades.map((trade) => {
                      const tradeTasks = getSubServices(trade);
                      return (
                        <div key={trade} className="p-3 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                          <h6 className="fw-800 text-primary mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                            <span>{getServicePricing(trade).icon}</span>
                            <span>{trade} Tasks Needed:</span>
                          </h6>
                          <div className="d-flex flex-column gap-2">
                            {tradeTasks.map((task) => {
                              const isChecked = selectedWorks.includes(task.id);
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => handleToggleWork(task.id)}
                                  className="p-3 rounded-3 bg-white border d-flex align-items-center justify-content-between transition"
                                  style={{
                                    cursor: 'pointer',
                                    border: isChecked ? '1.8px solid #0d6efd' : '1px solid #dee2e6',
                                    boxShadow: isChecked ? '0 4px 10px rgba(13,110,253,0.04)' : 'none',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-3">
                                    <input
                                      type="checkbox"
                                      className="form-check-input mb-0"
                                      checked={isChecked}
                                      onChange={() => {}} // handled by parent div click
                                      style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                                    />
                                    <div>
                                      <span className="fw-bold d-block text-dark" style={{ fontSize: '0.84rem' }}>{task.name}</span>
                                      <span className="text-muted small" style={{ fontSize: '0.7rem' }}>Standard service call item</span>
                                    </div>
                                  </div>
                                  <div className="text-end">
                                    <span className="badge rounded-pill px-3 py-2 fw-800" style={{ background: isChecked ? 'linear-gradient(135deg,#0d6efd,#6610f2)' : '#e9ecef', color: isChecked ? '#fff' : '#495057', fontSize: '0.75rem' }}>
                                      ₹{task.rate}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 4. Select & Invite Workers Section */}
              {!directWorker && workersInArea.length > 0 && (
                <div className="p-4 rounded-4 shadow-sm mt-4 animate-fade-in" style={{ background: '#fff', border: '1.5px solid #e8ecf8' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-800 mb-0" style={{ color: '#0a2540', fontSize: '1.05rem', fontWeight: 800 }}>
                      <span className="me-2">👷‍♂️</span> 4. Select &amp; Invite Workers
                    </h5>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary px-2 py-1 fw-bold"
                        style={{ fontSize: '0.72rem', borderRadius: '8px' }}
                        onClick={() => setSelectedWorkerIds(workersInArea.map(w => w._id))}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary px-2 py-1 fw-bold"
                        style={{ fontSize: '0.72rem', borderRadius: '8px' }}
                        onClick={() => setSelectedWorkerIds([])}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <p className="text-muted small mb-3">
                    We found <strong>{workersInArea.length} matching workers</strong> in your area. Check the workers you want to invite to bid on this request:
                  </p>

                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                    {workersInArea.map((worker) => {
                      const isSelected = selectedWorkerIds.includes(worker._id);
                      return (
                        <div
                          key={worker._id}
                          onClick={() => {
                            setSelectedWorkerIds(prev => 
                              prev.includes(worker._id)
                                ? prev.filter(id => id !== worker._id)
                                : [...prev, worker._id]
                            );
                          }}
                          className="p-3 rounded-3 border d-flex align-items-center justify-content-between transition"
                          style={{
                            cursor: 'pointer',
                            border: isSelected ? '1.8px solid #0d6efd' : '1px solid #dee2e6',
                            background: isSelected ? 'rgba(13,110,253,0.02)' : '#fff',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <input
                              type="checkbox"
                              className="form-check-input mb-0"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div click
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <img
                              src={worker.avatar}
                              alt={worker.fullName}
                              className="rounded-circle"
                              style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid #dee2e6' }}
                            />
                            <div>
                              <span className="fw-bold d-block text-dark" style={{ fontSize: '0.85rem', fontWeight: 800 }}>{worker.fullName}</span>
                              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                {worker.occupation} · ⭐ <span className="text-warning fw-bold">{worker.rating}</span> ({worker.distanceText})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Live Bill & Breakdown */}
            <div className="col-md-5">
              <div className="rounded-4 shadow-sm overflow-hidden sticky-top" style={{ border: '1.5px solid #e8ecf8', top: '90px', zIndex: 90 }}>
                <div style={{ background: directWorker ? 'linear-gradient(135deg,#198754,#0f5132)' : 'linear-gradient(135deg,#0d6efd,#6610f2)', padding: '16px 20px', color: '#fff' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>📋 Live Service Bill</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Itemized pricing estimate</div>
                </div>

                <div className="p-3 bg-white">
                  {/* Selected Trades Breakdown Badge */}
                  <div className="mb-3 p-2 rounded-3" style={{ background: '#f0f4ff' }}>
                    <span className="fw-bold small d-block mb-1 text-primary">👥 Selected Occupations:</span>
                    <div className="d-flex flex-column gap-1">
                      {Object.entries(selections).map(([trade, qty]) => (
                        <div key={trade} className="d-flex justify-content-between align-items-center bg-white p-1 px-2 rounded border" style={{ fontSize: '0.75rem' }}>
                          <span className="fw-bold text-dark">{getServicePricing(trade).icon} {trade}</span>
                          <span className="badge bg-primary rounded-pill fw-bold">{qty} worker{qty > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Breakdown items */}
                  <PriceRow label="🚗 Visiting / Inspection Fee" amount={visitCharge} />

                  <div className="my-2 border-top border-bottom py-2">
                    <span className="fw-bold small text-muted d-block mb-1">Standard Tasks ({selectedSubServicesData.length}):</span>
                    {selectedSubServicesData.map(s => (
                      <div key={s.id} className="d-flex justify-content-between text-muted small py-1" style={{ fontSize: '0.78rem' }}>
                        <span>• {s.name}</span>
                        <span className="fw-bold">₹{s.rate}</span>
                      </div>
                    ))}
                  </div>

                  {!directWorker && workersNeeded > 1 && (
                    <div className="my-2 border-bottom py-2" style={{ fontSize: '0.8rem' }}>
                      <div className="d-flex justify-content-between text-dark fw-bold">
                        <span>👥 Worker Count</span>
                        <span>{workersNeeded} workers</span>
                      </div>
                      <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                        <span>Standard Labor Subtotal (per worker)</span>
                        <span>₹{laborCost}</span>
                      </div>
                      <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                        <span>Total Labor Cost ({workersNeeded} workers)</span>
                        <span>₹{laborCost * workersNeeded}</span>
                      </div>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="rounded-3 p-3 mt-3 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg,#19875410,#0f513210)', border: '1.5px solid #a3cfbb' }}>
                    <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>💳 Grand Total</span>
                    <span style={{ fontWeight: 900, fontSize: '1.35rem', color: '#198754' }}>₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="text-muted mt-2" style={{ fontSize: '0.68rem', lineHeight: 1.4 }}>
                    * Visiting fee is fixed. Task rates are scaled by the number of workers requested.
                  </div>
                </div>

                {/* Confirm Button */}
                <div className="p-3 border-top bg-white">
                  <button
                    className="btn w-100 py-3 fw-bold rounded-3 transition"
                    style={{
                      background: !formData.name || !formData.phone || !formData.location || selectedWorks.length === 0 ? '#dee2e6' : (directWorker ? 'linear-gradient(135deg,#198754,#0f5132)' : 'linear-gradient(135deg,#0d6efd,#6610f2)'),
                      color: !formData.name || !formData.phone || !formData.location || selectedWorks.length === 0 ? '#6c757d' : '#fff',
                      border: 'none',
                      fontSize: '1rem'
                    }}
                    disabled={!formData.name || !formData.phone || !formData.location || selectedWorks.length === 0}
                    onClick={() => setSection('confirm')}
                  >
                    Confirm Booking Details →
                  </button>
                  {(!formData.name || !formData.phone || !formData.location || selectedWorks.length === 0) && (
                    <div className="text-center text-danger small mt-2" style={{ fontSize: '0.72rem' }}>
                      Please fill Name, Contact, Area & select at least 1 task.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ═══════════════ CONFIRM SECTION ═══════════════ */}
      {section === 'confirm' && (
        <div className="mx-auto" style={{ maxWidth: '560px' }}>
          <div className="text-center mb-4">
            <div style={{ fontSize: '2.5rem' }}>📋</div>
            <h3 style={{ fontWeight: 800, color: '#1a1a2e' }}>Confirm Your Service Booking</h3>
            <p className="text-muted small">Please review the itemized task checklist and contact details below.</p>
          </div>

          <div className="rounded-4 shadow-sm overflow-hidden" style={{ border: '1.5px solid #e8ecf8' }}>
            {/* Summary Header */}
            <div style={{ background: directWorker ? 'linear-gradient(135deg,#198754,#0f5132)' : 'linear-gradient(135deg,#0d6efd,#6610f2)', padding: '20px 24px', color: '#fff' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{pricing.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{formData.repair}</div>
              <div style={{ opacity: 0.85, fontSize: '0.82rem' }}>{pricing.desc}</div>
            </div>

            <div className="p-4 bg-white">
              {/* Detailed Summary Row */}
              {[
                ['👤 Client Name', formData.name],
                ['📞 Contact Phone', formData.phone],
                ['📍 Location Area', formData.location],
              ].map(([label, val]) => (
                <div key={label} className="d-flex justify-content-between py-2 border-bottom small">
                  <span className="text-muted fw-bold">{label}</span>
                  <span className="fw-bold text-dark">{val}</span>
                </div>
              ))}

              {formData.fullAddress && (
                <div className="py-2 border-bottom">
                  <div className="text-muted fw-bold small mb-1">🏠 Full Work Address</div>
                  <div className="small fw-bold text-dark" style={{ lineHeight: 1.6 }}>{formData.fullAddress}</div>
                  {mapsLink && (
                    <a href={mapsLink} target="_blank" rel="noreferrer" className="d-inline-flex align-items-center gap-1 mt-2 fw-bold" style={{ background: directWorker ? '#198754' : '#0d6efd', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: '0.75rem', textDecoration: 'none' }}>
                      🗺️ Open in Maps
                    </a>
                  )}
                </div>
              )}

              {!directWorker && (
                <div className="py-2 border-bottom small">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted fw-bold">👥 Workers Requested</span>
                    <span className="fw-bold text-dark">{workersNeeded} worker{workersNeeded > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}

              {/* Service list checklist */}
              <div className="mt-3 p-3 rounded-3" style={{ background: '#f8f9ff', border: '1px solid #e0e7ff' }}>
                <div className="fw-bold small mb-2 text-primary">📋 Task Checklist:</div>
                {selectedSubServicesData.map(s => (
                  <div key={s.id} className="d-flex justify-content-between text-dark py-1 border-bottom border-light" style={{ fontSize: '0.8rem' }}>
                    <span className="fw-600">✓ {s.name}</span>
                    <span className="fw-bold text-muted">₹{s.rate}</span>
                  </div>
                ))}

                <PriceRow label="Inspection / Visiting Price" amount={visitCharge} />
                <div className="d-flex justify-content-between align-items-center mt-2 pt-2" style={{ borderTop: '2px solid #c7d7ff' }}>
                  <span className="fw-bold" style={{ color: '#1a1a2e' }}>💳 Total Amount</span>
                  <span style={{ fontWeight: 950, fontSize: '1.45rem', color: '#198754' }}>₹{totalCost.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {directWorker && (
                <div className="mt-3 p-3 rounded-3 text-success small fw-600 border" style={{ background: 'rgba(25,135,84,0.06)', borderColor: '#a3cfbb', lineHeight: '1.5' }}>
                  ⚡ <strong>Note:</strong> Direct booking request. {directWorker.name} will be assigned immediately and details exchanged in your chat widget.
                </div>
              )}

              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-outline-secondary flex-fill py-2 rounded-3 fw-bold" onClick={() => setSection('form')}>
                  ← Edit Form
                </button>
                <button
                  className="btn flex-fill py-2 rounded-3 fw-bold"
                  style={{ background: 'linear-gradient(135deg,#198754,#0f5132)', color: '#fff', border: 'none' }}
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                >
                  {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Posting...</> : (directWorker ? '⚡ Confirm & Direct Hire' : '✅ Confirm & Book Request')}
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
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>{directWorker ? '⚡' : '🎉'}</div>
            <h3 style={{ fontWeight: 800, color: '#1a1a2e' }}>
              {directWorker ? 'Worker Hired!' : 'Request Sent!'}
            </h3>
            <p className="text-muted small mb-4">
              {directWorker 
                ? `Congratulations! Your direct hire request has been accepted. ${directWorker.name} has been assigned to your service call. A contact detail exchange has been sent to your inbox.`
                : `Your ${formData.repair} request has been broadcast to nearby verified workers. You'll be notified once a worker accepts.`}
            </p>

            {/* Summary chip */}
            <div className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill mb-4" style={{ background: directWorker ? 'linear-gradient(135deg,rgba(25,135,84,0.08),rgba(15,81,50,0.08))' : 'linear-gradient(135deg,#0d6efd15,#6610f215)', border: directWorker ? '1.5px solid #a3cfbb' : '1.5px solid #c7d7ff' }}>
              <span style={{ fontSize: '1.2rem' }}>{pricing.icon}</span>
              <span className="fw-bold" style={{ color: directWorker ? '#198754' : '#0d6efd' }}>{formData.repair}</span>
              <span className="text-muted">•</span>
              <span style={{ fontWeight: 900, color: directWorker ? '#198754' : '#0d6efd' }}>₹{totalCost.toLocaleString('en-IN')}</span>
            </div>

            {mapsLink && (
              <div className="mb-3">
                <a href={mapsLink} target="_blank" rel="noreferrer" className="btn fw-bold text-white" style={{ background: 'linear-gradient(135deg,#198754,#0f5132)', borderRadius: 10, textDecoration: 'none', padding: '10px 24px' }}>
                  🗺️ View Your Location on Maps
                </a>
              </div>
            )}

            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary rounded-3 px-4 fw-bold" onClick={() => { setSection('form'); setDbJob(null); }}>
                📋 New Request
              </button>
              <button className="btn rounded-3 px-4 fw-bold text-white" style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', border: 'none' }} onClick={() => navigate('/client-dashboard')}>
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

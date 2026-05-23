import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const INDUSTRY_TYPES = [
  "Construction & Real Estate",
  "Manufacturing & Factory",
  "Agriculture & Farming",
  "Logistics & Transport",
  "Hospitality & Hotel",
  "Mining & Heavy Industry",
  "Healthcare & Facility",
  "Retail & Warehousing",
  "IT & Infrastructure",
  "Other",
];

const COMPANY_SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "500+ employees",
];

const IndustryRegister = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Company Info, 2 = Account Details, 3 = Confirm
  const [form, setForm] = useState({
    companyName: '',
    industryType: '',
    companySize: '',
    gstNumber: '',
    website: '',
    contactPerson: '',
    phone: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.companyName.trim()) e.companyName = 'Company name is required';
      if (!form.industryType) e.industryType = 'Select an industry type';
      if (!form.companySize) e.companySize = 'Select company size';
      if (!form.contactPerson.trim()) e.contactPerson = 'Contact person name is required';
      if (!form.phone.trim()) e.phone = 'Phone number is required';
      if (!form.address.trim()) e.address = 'Business address is required';
    }
    if (step === 2) {
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
      if (!form.password) e.password = 'Password is required';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setLoading(true);
    try {
      await api.register({
        fullName: form.contactPerson,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
        role: 'client',
        occupation: `Industry: ${form.companyName} (${form.industryType})`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.companyName)}&background=0a2540&color=f5a623&size=150&bold=true`,
      });
      navigate('/industry-dashboard');
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (key) => ({
    width: '100%',
    padding: '12px 14px 12px 40px',
    border: `1.5px solid ${errors[key] ? '#dc2626' : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'Poppins, sans-serif',
    background: errors[key] ? '#fff5f5' : '#fff',
    transition: 'border 0.2s',
  });

  const selectStyle = (key) => ({
    ...inputStyle(key),
    paddingLeft: 40,
    appearance: 'none',
    cursor: 'pointer',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5c 50%, #0d6efd 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative', overflow: 'hidden' }}>
      {/* Background texture */}
      <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80) center/cover', opacity: 0.06 }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 580 }}>

        {/* Logo + Back */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Link to="/" style={{ color: '#f5a623', fontWeight: 800, fontSize: '1.3rem', textDecoration: 'none' }}>
            Quick<span style={{ color: '#fff' }}>Labour</span>
          </Link>
          <Link to="/login" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', textDecoration: 'none' }}>
            Already registered? <strong style={{ color: '#f5a623' }}>Login →</strong>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0a2540, #1a3a5c)', padding: '28px 32px' }}>
            <div className="d-flex align-items-center gap-3 mb-2">
              <div style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🏭</div>
              <div>
                <h4 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '1.25rem' }}>Industry Registration</h4>
                <p style={{ color: '#b0c4de', margin: 0, fontSize: '0.82rem' }}>Register your company to hire bulk workforces</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="d-flex align-items-center gap-2 mt-4">
              {['Company Info', 'Account', 'Confirm'].map((label, i) => {
                const num = i + 1;
                const active = step === num;
                const done = step > num;
                return (
                  <React.Fragment key={label}>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#22c55e' : active ? '#f5a623' : 'rgba(255,255,255,0.15)', color: done || active ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                        {done ? '✓' : num}
                      </div>
                      <span style={{ color: active ? '#f5a623' : done ? '#22c55e' : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.75rem' }}>{label}</span>
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 1, background: done ? '#22c55e' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s' }} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '28px 32px' }}>

              {/* ── Step 1: Company Info ── */}
              {step === 1 && (
                <div>
                  <h6 style={{ color: '#0a2540', fontWeight: 800, marginBottom: 20 }}>🏢 Company Details</h6>

                  {/* Company Name */}
                  <div className="mb-3">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Company / Organization Name *</label>
                    <div style={{ position: 'relative' }}>
                      <i className="bi bi-building" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="text" style={inputStyle('companyName')} placeholder="e.g. Sharma Construction Ltd." value={form.companyName} onChange={e => update('companyName', e.target.value)} />
                    </div>
                    {errors.companyName && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.companyName}</span>}
                  </div>

                  {/* Industry Type */}
                  <div className="mb-3">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Industry / Sector Type *</label>
                    <div style={{ position: 'relative' }}>
                      <i className="bi bi-diagram-3" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                      <select style={selectStyle('industryType')} value={form.industryType} onChange={e => update('industryType', e.target.value)}>
                        <option value="">Select industry type...</option>
                        {INDUSTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {errors.industryType && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.industryType}</span>}
                  </div>

                  {/* Company Size */}
                  <div className="mb-3">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Company Size *</label>
                    <div style={{ position: 'relative' }}>
                      <i className="bi bi-people" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                      <select style={selectStyle('companySize')} value={form.companySize} onChange={e => update('companySize', e.target.value)}>
                        <option value="">Select company size...</option>
                        {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {errors.companySize && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.companySize}</span>}
                  </div>

                  {/* GST + Website in row */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>GST Number (optional)</label>
                      <div style={{ position: 'relative' }}>
                        <i className="bi bi-file-earmark-text" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" style={inputStyle('gstNumber')} placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={e => update('gstNumber', e.target.value.toUpperCase())} />
                      </div>
                    </div>
                    <div className="col-6">
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Website (optional)</label>
                      <div style={{ position: 'relative' }}>
                        <i className="bi bi-globe" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" style={inputStyle('website')} placeholder="www.yourcompany.com" value={form.website} onChange={e => update('website', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="mb-3">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Contact Person Name *</label>
                    <div style={{ position: 'relative' }}>
                      <i className="bi bi-person" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="text" style={inputStyle('contactPerson')} placeholder="HR Manager / Owner name" value={form.contactPerson} onChange={e => update('contactPerson', e.target.value)} />
                    </div>
                    {errors.contactPerson && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.contactPerson}</span>}
                  </div>

                  {/* Phone */}
                  <div className="mb-3">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Business Phone *</label>
                    <div style={{ position: 'relative' }}>
                      <i className="bi bi-telephone" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="text" style={inputStyle('phone')} placeholder="+91 98765 43210" value={form.phone} onChange={e => update('phone', e.target.value)} />
                    </div>
                    {errors.phone && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.phone}</span>}
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Business Address *</label>
                    <div style={{ position: 'relative' }}>
                      <i className="bi bi-geo-alt" style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
                      <textarea rows={2} style={{ ...inputStyle('address'), paddingTop: 12, resize: 'none', lineHeight: 1.5 }} placeholder="Factory / office full address" value={form.address} onChange={e => update('address', e.target.value)} />
                    </div>
                    {errors.address && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.address}</span>}
                  </div>
                </div>
              )}

              {/* ── Step 2: Account Details ── */}
              {step === 2 && (
                <div>
                  <h6 style={{ color: '#0a2540', fontWeight: 800, marginBottom: 20 }}>🔐 Login Credentials</h6>

                  <div className="mb-3">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Business Email Address *</label>
                    <div style={{ position: 'relative' }}>
                      <i className="bi bi-envelope" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="email" style={inputStyle('email')} placeholder="contact@yourcompany.com" value={form.email} onChange={e => update('email', e.target.value)} />
                    </div>
                    {errors.email && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.email}</span>}
                  </div>

                  <div className="mb-3">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <i className="bi bi-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type={showPassword ? 'text' : 'password'} style={inputStyle('password')} placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol" value={form.password} onChange={e => update('password', e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`} />
                      </button>
                    </div>
                    {errors.password && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.password}</span>}
                    {/* Password strength hint */}
                    <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                      {['1 uppercase', '1 number', '1 symbol', '8+ chars'].map((hint, i) => {
                        const checks = [/[A-Z]/.test(form.password), /\d/.test(form.password), /[@$!%*?&#]/.test(form.password), form.password.length >= 8];
                        return <span key={hint} style={{ flex: 1, height: 4, borderRadius: 4, background: checks[i] ? '#22c55e' : '#e2e8f0', transition: 'all 0.3s' }} />;
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      {['Uppercase', 'Number', 'Symbol', '8+ chars'].map((label, i) => {
                        const checks = [/[A-Z]/.test(form.password), /\d/.test(form.password), /[@$!%*?&#]/.test(form.password), form.password.length >= 8];
                        return <span key={label} style={{ flex: 1, fontSize: '0.6rem', color: checks[i] ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>{label}</span>;
                      })}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Confirm Password *</label>
                    <div style={{ position: 'relative' }}>
                      <i className="bi bi-shield-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="password" style={inputStyle('confirmPassword')} placeholder="Re-enter your password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                    </div>
                    {errors.confirmPassword && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{errors.confirmPassword}</span>}
                  </div>

                  {/* Security note */}
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', fontSize: '0.78rem', color: '#1d4ed8', lineHeight: 1.6 }}>
                    <i className="bi bi-shield-check me-2"></i>
                    Your credentials are encrypted and stored securely. QuickLabour will never share your company data with third parties.
                  </div>
                </div>
              )}

              {/* ── Step 3: Confirm & Submit ── */}
              {step === 3 && (
                <div>
                  <h6 style={{ color: '#0a2540', fontWeight: 800, marginBottom: 20 }}>✅ Review & Confirm</h6>

                  {/* Summary cards */}
                  {[
                    { label: 'Company Name', value: form.companyName, icon: 'bi-building' },
                    { label: 'Industry Type', value: form.industryType, icon: 'bi-diagram-3' },
                    { label: 'Size', value: form.companySize, icon: 'bi-people' },
                    { label: 'Contact Person', value: form.contactPerson, icon: 'bi-person' },
                    { label: 'Phone', value: form.phone, icon: 'bi-telephone' },
                    { label: 'Email', value: form.email, icon: 'bi-envelope' },
                    { label: 'Address', value: form.address, icon: 'bi-geo-alt' },
                    ...(form.gstNumber ? [{ label: 'GST Number', value: form.gstNumber, icon: 'bi-file-earmark-text' }] : []),
                    ...(form.website ? [{ label: 'Website', value: form.website, icon: 'bi-globe' }] : []),
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <i className={`bi ${icon}`} style={{ color: '#0d6efd', marginTop: 2, width: 16, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: '0.88rem', color: '#0a2540', fontWeight: 700 }}>{value}</div>
                      </div>
                    </div>
                  ))}

                  {apiError && (
                    <div style={{ background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginTop: 16, color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
                      <i className="bi bi-exclamation-circle me-2" />
                      {apiError}
                    </div>
                  )}

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginTop: 16, fontSize: '0.78rem', color: '#15803d', lineHeight: 1.6 }}>
                    <i className="bi bi-check-circle me-2" />
                    By registering, you agree to QuickLabour's Terms of Service and confirm this is a legitimate business entity.
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="d-flex gap-3 mt-4">
                {step > 1 && (
                  <button type="button" onClick={prevStep} style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontWeight: 700, background: '#fff', cursor: 'pointer', color: '#475569', fontSize: '0.88rem' }}>
                    ← Back
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" onClick={nextStep} style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 12, fontWeight: 800, background: 'linear-gradient(135deg, #0a2540, #0d6efd)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Continue →
                  </button>
                ) : (
                  <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 12, fontWeight: 800, background: loading ? '#94a3b8' : 'linear-gradient(135deg, #15803d, #22c55e)', color: '#fff', cursor: loading ? 'default' : 'pointer', fontSize: '0.9rem' }}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" />{' '}Creating Account...</>
                    ) : (
                      <><i className="bi bi-check-circle me-2" />Complete Registration</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer links */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: 20 }}>
          Registering as individual? <Link to="/login" style={{ color: '#f5a623', fontWeight: 700 }}>Client / Worker signup →</Link>
        </p>
      </div>
    </div>
  );
};

export default IndustryRegister;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';


const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('client'); // 'client' or 'worker'
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign Up Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idFile, setIdFile] = useState(null);
  const [idFileName, setIdFileName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [occupation, setOccupation] = useState('Professional Plumber');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification States
  const [showOtp, setShowOtp] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpNotification, setOtpNotification] = useState('');

  // Notification States
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  // Handle Photo Upload & Create Preview URL
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Handle ID Proof Upload
  const handleIdFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdFile(file);
      setIdFileName(file.name);
    }
  };

  // Helper to convert File to Base64 for database storage
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = await api.login(email, password);
      setSuccessMessage(`🎉 Login Successful! Redirecting to your dashboard...`);
      setTimeout(() => {
        if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (data.role === 'client') {
          navigate('/client-dashboard');
        } else {
          navigate('/worker-dashboard');
        }
      }, 1500);
    } catch (error) {
      setErrorMessage(`❌ ${error.message}`);
    }
  };

  // Sign Up handler - Generates & Displays OTP
  const handleSignUp = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (signUpPassword !== confirmPassword) {
      setErrorMessage('❌ Passwords do not match!');
      return;
    }

    // Client-side strong password validation check
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(signUpPassword)) {
      setErrorMessage('❌ Password is too weak! It must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).');
      return;
    }

    // Generate a random 4 digit code
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setMockOtp(generatedOtp);
    setShowOtp(true);
    setEnteredOtp('');
    
    // Simulate SMS notification banner
    setOtpNotification(`📱 SMS Received on ${phone}: Your QuickLabour verification OTP is: ${generatedOtp}`);
  };

  // OTP Verification Submit Handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (enteredOtp === mockOtp) {
      try {
        setSuccessMessage('⏳ Encrypting files and registering...');
        
        let avatarBase64 = '';
        let idFileBase64 = '';

        if (photo) {
          avatarBase64 = await convertToBase64(photo);
        }
        if (idFile) {
          idFileBase64 = await convertToBase64(idFile);
        }

        const userData = {
          fullName,
          email: `${phone.replace(/[^0-9]/g, '')}@quicklabour.com`, // Create standard unique email from phone
          password: signUpPassword,
          phone,
          address,
          role: activeTab,
          occupation: activeTab === 'worker' ? occupation : '',
          avatar: avatarBase64 || undefined,
          idType,
          idFile: idFileBase64,
        };

        const res = await api.register(userData);

        setSuccessMessage(`🎉 OTP Verified & Account Created Successfully! Your ${activeTab === 'client' ? 'Client' : 'Worker'} profile is now active. Redirecting to your dashboard...`);
        setOtpNotification('');
        setShowOtp(false);

        // Redirect after 2 seconds
        setTimeout(() => {
          if (res.role === 'client') {
            navigate('/client-dashboard');
          } else {
            navigate('/worker-dashboard');
          }
        }, 2000);
      } catch (error) {
        setErrorMessage(`❌ Registration failed: ${error.message}`);
      }
    } else {
      setErrorMessage('❌ Incorrect OTP! Please check the code in the SMS Notification banner and try again.');
    }
  };

  // Resend OTP Action
  const handleResendOtp = () => {
    setErrorMessage('');
    setEnteredOtp('');
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setMockOtp(newOtp);
    setOtpNotification(`📱 SMS Received on ${phone}: Your new QuickLabour verification OTP is: ${newOtp}`);
  };




  return (
    <div className="login-section">
      <div className="container d-flex justify-content-center">
        <div className="login-card p-4 p-md-5 reveal visible" style={{ maxWidth: showOtp ? '480px' : isSignUp ? '650px' : '500px' }}>
          
          {showOtp ? (
            /* ──────────────── SIMULATED OTP VERIFICATION STEP ──────────────── */
            <div>
              <div className="text-center mb-4">
                <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-inline-flex mb-3" style={{ fontSize: '2rem', width: '64px', height: '64px', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-shield-lock-fill text-primary"></i>
                </div>
                <h4 className="fw-800" style={{ color: '#0a2540', fontWeight: 800 }}>Phone OTP Verification</h4>
                <p className="text-muted small">
                  We have simulated sending a 4-digit verification code to your registered contact number <strong>{phone}</strong>.
                </p>
              </div>

              {/* Simulated SMS Notification banner */}
              {otpNotification && (
                <div className="alert alert-warning py-3 px-3 rounded-16 border-warning mb-4 shadow-sm" role="alert" style={{ fontSize: '0.88rem', borderLeft: '5px solid #ffc107' }}>
                  <div className="fw-800 text-dark mb-1" style={{ fontWeight: 800 }}>
                    <i className="bi bi-chat-left-dots-fill text-warning me-2"></i>Simulated SMS Banner:
                  </div>
                  <div className="font-monospace text-dark bg-white p-2 rounded border mt-2 small" style={{ fontWeight: 600 }}>
                    {otpNotification}
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="alert alert-danger py-2 px-3 rounded-12 mb-3 small fw-700 text-center" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div className="form-input-group mb-4 text-center">
                  <label className="text-muted small fw-700 mb-2">ENTER 4-DIGIT VERIFICATION CODE</label>
                  <input
                    type="text"
                    maxLength="4"
                    className="form-control text-center font-monospace fw-800 fs-3"
                    style={{ letterSpacing: '0.5rem', height: '54px', border: '2px solid #cbd5e1', borderRadius: '12px' }}
                    placeholder="••••"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="login-submit-btn mb-3">
                  Verify & Activate My Account
                </button>

                <div className="text-center mt-3">
                  <button 
                    type="button" 
                    className="btn btn-link text-decoration-none small fw-700" 
                    style={{ color: '#0d6efd', fontSize: '0.85rem' }}
                    onClick={handleResendOtp}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> Resend OTP Code
                  </button>
                </div>

                <div className="text-center mt-2 border-top pt-3">
                  <span 
                    className="toggle-auth-link small text-muted text-decoration-underline"
                    style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                    onClick={() => {
                      setShowOtp(false);
                      setErrorMessage('');
                      setSuccessMessage('');
                      setEnteredOtp('');
                    }}
                  >
                    ← Back to Registration Details
                  </span>
                </div>
              </form>
            </div>
          ) : (
            /* ──────────────── NORMAL SIGN IN / REGISTRATION LAYOUT ──────────────── */
            <div>
              <div className="text-center mb-4">
                <h3 className="fw-800" style={{ color: '#0a2540', fontWeight: 800 }}>
                  {isSignUp ? 'Create an Account' : 'Portal Login'}
                </h3>
                <p className="text-muted small">
                  {isSignUp ? 'Fill in your details below to register as a partner' : 'Choose your account type to access your dashboard'}
                </p>
              </div>



              {/* Notifications */}
              {errorMessage && (
                <div className="alert alert-danger py-2 px-3 rounded-12 mb-3 small fw-700 text-center" role="alert" style={{ fontSize: '0.82rem' }}>
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="alert alert-success py-3 px-3 rounded-16 mb-3 small fw-700 shadow" role="alert" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {successMessage}
                </div>
              )}

              {/* Toggle Tabs (Switch Client vs Worker Role) */}
              <div className="login-tab-container">
                <button
                  className={`login-tab-btn ${activeTab === 'client' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('client');
                    setErrorMessage('');
                  }}
                >
                  <i className="bi bi-person-fill me-2"></i>{isSignUp ? 'Register Client' : 'Client Portal'}
                </button>
                <button
                  className={`login-tab-btn ${activeTab === 'worker' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('worker');
                    setErrorMessage('');
                  }}
                >
                  <i className="bi bi-tools me-2"></i>{isSignUp ? 'Register Worker' : 'Worker Portal'}
                </button>
              </div>

              {isSignUp ? (
                /* ──────────────── REGISTRATION FORM ──────────────── */
                <form onSubmit={handleSignUp}>
                  <div className="row g-3">
                    {/* Profile Photo Upload */}
                    <div className="col-12 text-center mb-2">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="image-preview-circle border border-primary border-3" />
                      ) : (
                        <div className="image-preview-circle bg-light d-flex align-items-center justify-content-center text-muted">
                          <i className="bi bi-camera-fill fs-4"></i>
                        </div>
                      )}
                      <label className="btn-action-outline px-3 py-1 btn-sm position-relative mt-2" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                        <i className="bi bi-cloud-arrow-up-fill me-1"></i> Upload Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="position-absolute top-0 start-0 opacity-0 w-100 h-100" 
                          onChange={handlePhotoChange}
                          required
                        />
                      </label>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>Add a clear face photo for your profile</div>
                    </div>

                    {/* Name */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0">
                        <label>Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Priya Sharma"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Phone */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0">
                        <label>Contact Number</label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="col-12">
                      <div className="form-input-group mb-0">
                        <label>Complete Address</label>
                        <input
                          type="text"
                          placeholder="e.g. Flat 302, Sea Breeze, Bandra West, Mumbai"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Occupation / Skills (Worker Only) */}
                    {activeTab === 'worker' && (
                      <div className="col-12">
                        <div className="form-input-group mb-0">
                          <label>Primary Occupation / Trade</label>
                          <select
                            className="form-select border-1.5 p-2 rounded-12 text-muted"
                            style={{ height: '50px', fontSize: '0.95rem', border: '1.5px solid #e2e8f0' }}
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                            required
                          >
                            <option value="Professional Plumber">Plumber</option>
                            <option value="Master Painter">Painter</option>
                            <option value="Electrician">Electrician</option>
                            <option value="Carpenter">Carpenter</option>
                            <option value="Mason / Concrete Worker">Mason / Concrete Worker</option>
                            <option value="General Labour">General Labour</option>
                            <option value="Cleaning Specialist">Cleaning Specialist</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ID Card Selection */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0">
                        <label>Select ID Proof Document</label>
                        <select 
                          className="form-select border-1.5 p-2 rounded-12 text-muted" 
                          style={{ height: '50px', fontSize: '0.95rem', border: '1.5px solid #e2e8f0' }}
                          value={idType}
                          onChange={(e) => setIdType(e.target.value)}
                        >
                          <option value="Aadhaar">Aadhaar Card (UIDAI)</option>
                          <option value="PAN">PAN Card (Income Tax)</option>
                        </select>
                      </div>
                    </div>

                    {/* ID Verification File Upload */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0">
                        <label>Upload ID Card Proof</label>
                        <div className="file-upload-wrapper" style={{ height: '50px', padding: '10px 15px' }}>
                          <span className="small text-muted text-truncate d-block fw-700">
                            {idFileName ? `✔️ ${idFileName.substring(0, 18)}...` : '📎 Upload ID PDF/Image'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*,application/pdf" 
                            className="file-upload-input" 
                            onChange={handleIdFileChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0 position-relative">
                        <label>Password</label>
                        <input
                          type={showSignUpPassword ? "text" : "password"}
                          placeholder="At least 8 chars with uppercase, lowercase, number & symbol..."
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          className="btn position-absolute border-0 bg-transparent"
                          style={{ right: '10px', top: '32px', zIndex: 10, padding: '5px' }}
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        >
                          <i className={`bi ${showSignUpPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted fs-5`}></i>
                        </button>
                        <div className="text-muted small mt-1" style={{ fontSize: '0.72rem', lineHeight: '1.2' }}>
                          Must be at least 8 characters, and contain uppercase, lowercase, numbers, and symbols.
                        </div>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0 position-relative">
                        <label>Confirm Password</label>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repeat password..."
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          className="btn position-absolute border-0 bg-transparent"
                          style={{ right: '10px', top: '32px', zIndex: 10, padding: '5px' }}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted fs-5`}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="login-submit-btn mt-4">
                    Register as {activeTab === 'client' ? 'Client' : 'Worker'} Partner
                  </button>
                </form>
              ) : (
                /* ──────────────── SIGN IN FORM ──────────────── */
                <form onSubmit={handleLogin}>
                  <div className="form-input-group">
                    <label>Email Address or Phone Number</label>
                    <input
                      type="text"
                      placeholder={activeTab === 'client' ? "e.g. client@quicklabour.com" : "e.g. worker@quicklabour.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-input-group position-relative">
                    <label>Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password (e.g. client123 / worker123)..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      className="btn position-absolute border-0 bg-transparent"
                      style={{ right: '10px', top: '35px', zIndex: 10, padding: '5px' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted fs-5`}></i>
                    </button>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="rememberMe" />
                      <label className="form-check-label text-muted small fw-600" htmlFor="rememberMe">
                        Remember Me
                      </label>
                    </div>
                    <a href="#" className="small fw-700 text-decoration-none" style={{ color: '#0d6efd' }}>
                      Forgot Password?
                    </a>
                  </div>

                  <button type="submit" className="login-submit-btn">
                    Sign In as {activeTab === 'client' ? 'Client' : 'Worker'}
                  </button>
                </form>
              )}

              {/* Toggle link to switch SignIn/SignUp */}
              <div className="text-center mt-4">
                <span className="text-muted small fw-600">
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </span>
                <span 
                  className="toggle-auth-link small" 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                >
                  {isSignUp ? 'Sign In' : 'Register / Sign Up Now'}
                </span>
              </div>


            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, LABOUR_INDUSTRIES } from '../utils/api';
import Tesseract from 'tesseract.js';

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};


const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('client'); // 'client', 'worker', or 'industry'

  // Industry-specific states
  const [companyName, setCompanyName] = useState('');
  const [industryType, setIndustryType] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign Up Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [idType, setIdType] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [idFileName, setIdFileName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [occupation, setOccupation] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // OTP Verification States
  const [showOtp, setShowOtp] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpNotification, setOtpNotification] = useState('');

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmailOrPhone, setForgotEmailOrPhone] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = request, 2 = verify & reset
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotOtpNotification, setForgotOtpNotification] = useState('');
  const [forgotMockOtp, setForgotMockOtp] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');

  // Notification States
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [idFileError, setIdFileError] = useState('');
  const [isScanningID, setIsScanningID] = useState(false);
  
  // Geolocation and Live Location states
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const navigate = useNavigate();

  // Handle Photo Upload & Create Preview URL
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateIdFile = (type, fileName) => {
    if (!type || !fileName) return true;
    const nameLower = fileName.toLowerCase();
    if (type === 'Aadhaar') {
      return nameLower.includes('aadhaar') || nameLower.includes('adhar') || nameLower.includes('ahdaar') || nameLower.includes('uidai') || nameLower.includes('aadhar');
    }
    if (type === 'PAN') {
      return nameLower.includes('pan') || nameLower.includes('pen') || nameLower.includes('income') || nameLower.includes('permanent');
    }
    return true;
  };

  const validateIdContent = (type, text, fileName) => {
    // 1. First check if the filename contains the correct keywords (very fast fallback)
    if (validateIdFile(type, fileName)) {
      return true;
    }
    
    // 2. Perform text check from OCR
    const textLower = text.toLowerCase();
    if (type === 'Aadhaar') {
      return (
        textLower.includes('government') ||
        textLower.includes('india') ||
        textLower.includes('unique') ||
        textLower.includes('identification') ||
        textLower.includes('aadhaar') ||
        textLower.includes('aadhar') ||
        textLower.includes('yob') ||
        textLower.includes('dob') ||
        textLower.includes('male') ||
        textLower.includes('female')
      );
    }
    if (type === 'PAN') {
      return (
        textLower.includes('income') ||
        textLower.includes('tax') ||
        textLower.includes('permanent') ||
        textLower.includes('account') ||
        textLower.includes('number') ||
        textLower.includes('card') ||
        textLower.includes('govt') ||
        textLower.includes('dept')
      );
    }
    return true;
  };

  const handleIdTypeChange = (newType) => {
    setIdType(newType);
    if (!newType) {
      setIdFileError('');
      setIdFile(null);
      setIdFileName('');
      return;
    }
    if (idFile && !validateIdFile(newType, idFile.name)) {
      setIdFileError(`❌ The uploaded file does not appear to be a valid ${newType === 'Aadhaar' ? 'Aadhaar Card' : 'PAN Card'}. Please ensure you upload a clear photo of your ${newType === 'Aadhaar' ? 'Aadhaar' : 'PAN'} card.`);
      setIdFile(null);
      setIdFileName('');
    } else {
      setIdFileError('');
    }
  };

  // Handle ID Proof Upload
  const handleIdFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!idType) {
        setIdFileError(`❌ Please select the ID Proof Document type first!`);
        e.target.value = null; // Reset file input
        setIdFile(null);
        setIdFileName('');
        return;
      }

      setIsScanningID(true);
      setIdFileError('');
      
      try {
        // Run OCR on the image
        const result = await Tesseract.recognize(
          file,
          'eng'
        );
        const text = result.data.text || '';
        const nameLower = file.name.toLowerCase();
        
        // Check if OCR text OR filename validates the ID
        const isValid = validateIdContent(idType, text, nameLower);
        
        if (!isValid) {
          setIdFileError(`❌ The uploaded file does not appear to be a valid ${idType === 'Aadhaar' ? 'Aadhaar Card' : 'PAN Card'}. Please ensure you upload a clear photo of your ${idType === 'Aadhaar' ? 'Aadhaar' : 'PAN'} card.`);
          e.target.value = null; // Reset file input
          setIdFile(null);
          setIdFileName('');
        } else {
          setIdFileError('');
          setIdFile(file);
          setIdFileName(file.name);
        }
      } catch (err) {
        console.error("OCR validation error, falling back to filename check", err);
        // Fallback: If OCR fails or is not an image (e.g. PDF), check filename
        const nameLower = file.name.toLowerCase();
        if (!validateIdFile(idType, nameLower)) {
          setIdFileError(`❌ The uploaded file does not appear to be a valid ${idType === 'Aadhaar' ? 'Aadhaar Card' : 'PAN Card'}. Please ensure the filename contains "${idType === 'Aadhaar' ? 'aadhaar' : 'pan'}".`);
          e.target.value = null; // Reset file input
          setIdFile(null);
          setIdFileName('');
        } else {
          setIdFileError('');
          setIdFile(file);
          setIdFileName(file.name);
        }
      } finally {
        setIsScanningID(false);
      }
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
      const loginRole = activeTab === 'worker' ? 'worker' : 'client';
      const data = await api.login(email, password, loginRole);
      setSuccessMessage(`Login successful. Redirecting to your dashboard...`);
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

    if (!agreedToTerms) {
      setErrorMessage('❌ You must agree to the QuickLabour Terms & Conditions to create an account.');
      return;
    }

    if (activeTab === 'worker' && !occupation) {
      setErrorMessage('❌ Please select your Primary Occupation / Trade!');
      return;
    }

    if (!idType) {
      setErrorMessage('❌ Please select an ID Proof Document!');
      return;
    }

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

        const isIndustry = activeTab === 'industry';
        const userData = {
          fullName: isIndustry ? companyName : fullName,
          email: phone.replace(/[^0-9]/g, ''),
          password: signUpPassword,
          phone,
          address,
          latitude,
          longitude,
          role: isIndustry ? 'client' : activeTab,
          occupation: isIndustry
            ? `Industry: ${companyName} (${industryType})`
            : activeTab === 'worker' ? occupation : '',
          avatar: avatarBase64 || (isIndustry
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=0a2540&color=f5a623&size=150&bold=true`
            : undefined),
          idType,
          idFile: idFileBase64,
        };

        const res = await api.register(userData);

        setSuccessMessage(`OTP verified. Account created successfully. Redirecting to your dashboard...`);
        setOtpNotification('');
        setShowOtp(false);

        // Redirect after 2 seconds
        setTimeout(() => {
          if (activeTab === 'industry') {
            navigate('/industry-dashboard');
          } else if (res.role === 'client') {
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

  // Fetch current GPS location and automatically reverse geocode to human address
  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ Geolocation is not supported by your browser.');
      return;
    }
    
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`GPS Location: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setAddress(`GPS Location: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(`❌ Failed to retrieve your location: ${error.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Forgot Password handlers
  const handleRequestForgotOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.forgotPasswordOtp(forgotEmailOrPhone);
      setForgotPhone(res.phone);
      setForgotMockOtp(res.otp);
      setForgotOtpNotification(`📱 SMS Received on ${res.phone}: Your password reset OTP is: ${res.otp}`);
      setForgotStep(2);
      setSuccessMessage(res.message);
    } catch (error) {
      setErrorMessage(`❌ ${error.message}`);
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.verifyForgotPasswordOtp(forgotPhone, forgotOtp);
      setForgotStep(3);
      setSuccessMessage(res.message);
    } catch (error) {
      setErrorMessage(`❌ ${error.message}`);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('❌ Passwords do not match!');
      return;
    }

    // Client-side strong password validation check
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(forgotNewPassword)) {
      setErrorMessage('❌ Password is too weak! It must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).');
      return;
    }

    try {
      const res = await api.resetPassword(forgotPhone, forgotOtp, forgotNewPassword);
      setSuccessMessage(`✅ ${res.message}`);
      
      // Clear forgot password states and return to login screen
      setTimeout(() => {
        setIsForgotPassword(false);
        setForgotStep(1);
        setForgotEmailOrPhone('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotOtpNotification('');
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      setErrorMessage(`❌ ${error.message}`);
    }
  };

  const handleResendForgotOtp = async () => {
    setErrorMessage('');
    setForgotOtp('');
    try {
      const res = await api.forgotPasswordOtp(forgotEmailOrPhone);
      setForgotMockOtp(res.otp);
      setForgotOtpNotification(`📱 SMS Received on ${res.phone}: Your new password reset OTP is: ${res.otp}`);
    } catch (error) {
      setErrorMessage(`❌ ${error.message}`);
    }
  };


  return (
    <div className="login-section">
      <div className="container d-flex justify-content-center">
        <div className="login-card p-4 p-md-5 reveal visible" style={{ maxWidth: (showOtp || (isForgotPassword && (forgotStep === 2 || forgotStep === 3))) ? '480px' : isSignUp ? '650px' : '500px' }}>
          
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
          ) : isForgotPassword ? (
            /* ──────────────── FORGOT PASSWORD FLOW ──────────────── */
            <div>
              {/* Header */}
              <div className="text-center mb-4">
                <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-inline-flex mb-3" style={{ fontSize: '2rem', width: '64px', height: '64px', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-shield-lock-fill text-primary"></i>
                </div>
                <h4 className="fw-800" style={{ color: '#0a2540', fontWeight: 800 }}>
                  {forgotStep === 1 ? 'Reset Password' : forgotStep === 2 ? 'Verify OTP Code' : 'Create New Password'}
                </h4>
                <p className="text-muted small">
                  {forgotStep === 1 
                    ? 'Enter your registered email address or contact number to receive a 4-digit verification OTP.' 
                    : forgotStep === 2 
                      ? 'Please enter the OTP sent to your contact number.'
                      : 'Please set your new secure password below.'}
                </p>
              </div>

              {/* Simulated SMS Notification banner */}
              {forgotStep === 2 && forgotOtpNotification && (
                <div className="alert alert-warning py-3 px-3 rounded-16 border-warning mb-4 shadow-sm" role="alert" style={{ fontSize: '0.88rem', borderLeft: '5px solid #ffc107' }}>
                  <div className="fw-800 text-dark mb-1" style={{ fontWeight: 800 }}>
                    <i className="bi bi-chat-left-dots-fill text-warning me-2"></i>Simulated SMS Banner:
                  </div>
                  <div className="font-monospace text-dark bg-white p-2 rounded border mt-2 small" style={{ fontWeight: 600 }}>
                    {forgotOtpNotification}
                  </div>
                </div>
              )}

              {/* Alerts */}
              {errorMessage && (
                <div className="alert alert-danger py-2 px-3 rounded-12 mb-3 small fw-700 text-center" role="alert">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="alert alert-success py-2 px-3 rounded-12 mb-3 small fw-700 text-center" role="alert">
                  {successMessage}
                </div>
              )}

              {forgotStep === 1 ? (
                /* Step 1: Request OTP */
                <form onSubmit={handleRequestForgotOtp}>
                  <div className="form-input-group mb-4">
                    <label>Email Address or Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210 or your email..."
                      value={forgotEmailOrPhone}
                      onChange={(e) => setForgotEmailOrPhone(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="login-submit-btn mb-3">
                    Send Verification OTP
                  </button>

                  <div className="text-center mt-3 pt-2 border-top">
                    <button 
                      type="button" 
                      className="btn btn-link text-decoration-none small fw-700" 
                      style={{ color: '#0d6efd', fontSize: '0.85rem' }}
                      onClick={() => {
                        setIsForgotPassword(false);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              ) : forgotStep === 2 ? (
                /* Step 2: Verify OTP */
                <form onSubmit={handleVerifyForgotOtp}>
                  <div className="form-input-group mb-4 text-center">
                    <label className="text-muted small fw-700 mb-2">ENTER 4-DIGIT VERIFICATION CODE</label>
                    <input
                      type="text"
                      maxLength="4"
                      className="form-control text-center font-monospace fw-800 fs-3"
                      style={{ letterSpacing: '0.5rem', height: '54px', border: '2px solid #cbd5e1', borderRadius: '12px' }}
                      placeholder="••••"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="login-submit-btn mb-3">
                    Verify OTP Code
                  </button>

                  <div className="text-center mt-3">
                    <button 
                      type="button" 
                      className="btn btn-link text-decoration-none small fw-700" 
                      style={{ color: '#0d6efd', fontSize: '0.85rem' }}
                      onClick={handleResendForgotOtp}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i> Resend OTP Code
                    </button>
                  </div>

                  <div className="text-center mt-2 border-top pt-3">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none small text-muted"
                      style={{ fontSize: '0.82rem' }}
                      onClick={() => {
                        setForgotStep(1);
                        setForgotOtp('');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                    >
                      ← Back to Step 1
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 3: Create New Password */
                <form onSubmit={handleResetPassword}>
                  <div className="form-input-group mb-3 position-relative">
                    <label>New Password</label>
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      placeholder="Enter new password..."
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                      style={{ paddingRight: '45px' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn position-absolute border-0 bg-transparent"
                      style={{ right: '10px', top: '32px', zIndex: 10, padding: '5px' }}
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                    >
                      <i className={`bi ${showForgotNewPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted fs-5`}></i>
                    </button>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem', lineHeight: '1.2' }}>Must be at least 8 characters, and contain uppercase, lowercase, numbers, and symbols.</div>
                  </div>

                  <div className="form-input-group mb-4 position-relative">
                    <label>Confirm New Password</label>
                    <input
                      type={showForgotConfirmPassword ? "text" : "password"}
                      placeholder="Repeat new password..."
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      required
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      className="btn position-absolute border-0 bg-transparent"
                      style={{ right: '10px', top: '32px', zIndex: 10, padding: '5px' }}
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                    >
                      <i className={`bi ${showForgotConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted fs-5`}></i>
                    </button>
                    {forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword && (
                      <div className="text-danger small mt-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                        ❌ Passwords do not match!
                      </div>
                    )}
                  </div>

                  <button type="submit" className="login-submit-btn mb-3">
                    Update Password
                  </button>

                  <div className="text-center mt-2 border-top pt-3">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none small text-muted"
                      style={{ fontSize: '0.82rem' }}
                      onClick={() => {
                        setForgotStep(2);
                        setForgotNewPassword('');
                        setForgotConfirmPassword('');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                    >
                      ← Back to OTP Entry
                    </button>
                  </div>
                </form>
              )}
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

              {/* Toggle Tabs */}
              <div className="login-tab-container" style={{ display: 'flex', flexWrap: isSignUp ? 'wrap' : 'nowrap', gap: isSignUp ? '4px' : 0 }}>
                <button
                  className={`login-tab-btn ${activeTab === 'client' ? 'active' : ''}`}
                  style={{ flex: 1, fontSize: isSignUp ? '0.8rem' : undefined }}
                  onClick={() => { setActiveTab('client'); setErrorMessage(''); }}
                >
                  <i className="bi bi-person-fill me-1"></i>{isSignUp ? 'Register Client' : 'Client Portal'}
                </button>
                <button
                  className={`login-tab-btn ${activeTab === 'worker' ? 'active' : ''}`}
                  style={{ flex: 1, fontSize: isSignUp ? '0.8rem' : undefined }}
                  onClick={() => { setActiveTab('worker'); setErrorMessage(''); }}
                >
                  <i className="bi bi-tools me-1"></i>{isSignUp ? 'Register Worker' : 'Worker Portal'}
                </button>
                {isSignUp && (
                  <button
                    className={`login-tab-btn ${activeTab === 'industry' ? 'active' : ''}`}
                    style={{ flex: 1, fontSize: '0.8rem', background: activeTab === 'industry' ? 'linear-gradient(135deg,#0a2540,#0d6efd)' : undefined }}
                    onClick={() => { setActiveTab('industry'); setErrorMessage(''); }}
                  >
                    <i className="bi bi-building me-1"></i>Register Industry
                  </button>
                )}
              </div>

              {isSignUp ? (
                /* ──────────────── REGISTRATION FORM ──────────────── */
                <form onSubmit={handleSignUp}>
                  {/* Dummy inputs to absorb browser autofill */}
                  <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} autoComplete="new-password" />
                  <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} autoComplete="new-password" />
                  <div className="row g-3">

                    {/* Industry — Coming Soon Panel */}
                    {activeTab === 'industry' && (
                      <div className="col-12">
                        <div style={{ textAlign: 'center', padding: '36px 24px', background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5c 100%)', borderRadius: 20, position: 'relative', overflow: 'hidden' }}>
                          {/* Background glow */}
                          <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=60) center/cover', opacity: 0.06 }} />

                          <div style={{ position: 'relative' }}>
                            {/* Icon */}
                            <div style={{ width: 72, height: 72, background: 'rgba(245,166,35,0.15)', border: '2px solid rgba(245,166,35,0.35)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>🏭</div>

                            {/* Coming Soon badge */}
                            <span style={{ background: 'rgba(245,166,35,0.2)', border: '1px solid rgba(245,166,35,0.5)', color: '#f5a623', borderRadius: 50, padding: '4px 16px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Coming Soon</span>

                            <h5 style={{ color: '#fff', fontWeight: 800, marginTop: 16, marginBottom: 8 }}>Industry Account Registration</h5>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
                              We're building a powerful onboarding portal for factories, construction firms, and industries to register and manage large workforces seamlessly.
                            </p>

                            {/* Features preview */}
                            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
                              {['Bulk Hiring', 'GST Verified', 'Dedicated Manager', 'Priority Workers'].map(f => (
                                <span key={f} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', borderRadius: 50, padding: '5px 14px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  ✦ {f}
                                </span>
                              ))}
                            </div>

                            {/* CTA to Industry Dashboard */}
                            <Link
                              to="/industry-dashboard"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f5a623', color: '#0a2540', borderRadius: 50, padding: '12px 28px', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 8px 24px rgba(245,166,35,0.35)' }}
                            >
                              <i className="bi bi-building"></i> Explore Industry Dashboard
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Profile Photo Upload — shown for client/worker only */}
                    {activeTab !== 'industry' && (
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
                          required={activeTab !== 'industry'}
                        />
                      </label>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>Add a clear face photo for your profile</div>
                    </div>
                    )}

                    {/* Name — hidden for industry (uses company name) */}
                    {activeTab !== 'industry' && (
                    <div className="col-md-6">
                      <div className="form-input-group mb-0">
                        <label>Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Priya Sharma"
                          value={fullName}
                          onChange={(e) => setFullName(toTitleCase(e.target.value))}
                          required={activeTab !== 'industry'}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                    )}

                    {/* Contact Phone */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0">
                        <label>Contact Number</label>
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    {/* Address, Occupation, ID, Password — hidden when industry tab active */}
                    {activeTab !== 'industry' && (<>

                    {/* Address */}
                    <div className="col-12">
                      <div className="form-input-group mb-0">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="mb-0">Complete Address</label>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary py-1 px-2 rounded-pill fw-bold border-1.5"
                            style={{ fontSize: '0.75rem', borderColor: '#0d6efd' }}
                            onClick={handleUseLiveLocation}
                            disabled={isLocating}
                          >
                            {isLocating ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span>
                                Locating...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-geo-alt-fill me-1"></i> Use Live Location
                              </>
                            )}
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Flat 302, Sea Breeze, Bandra West, Mumbai"
                          value={address}
                          onChange={(e) => setAddress(toTitleCase(e.target.value))}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    {/* Occupation / Skills (Worker Only) */}
                    {activeTab === 'worker' && (
                      <div className="col-12">
                        <div className="form-input-group mb-0">
                          <label>Primary Occupation / Trade</label>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                              Step 1 — Select Industry
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {Object.entries(LABOUR_INDUSTRIES).map(([industry, info]) => (
                                <button
                                  key={industry}
                                  type="button"
                                  onClick={() => { setSelectedIndustry(industry); setOccupation(info.specialties[0].name); }}
                                  style={{ padding: '5px 12px', borderRadius: 20, border: selectedIndustry === industry ? 'none' : '1.5px solid #e2e8f0', background: selectedIndustry === industry ? 'linear-gradient(135deg,#0d6efd,#0b5ed7)' : '#f8fafc', color: selectedIndustry === industry ? '#fff' : '#475569', fontWeight: selectedIndustry === industry ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
                                >
                                  {info.icon} {industry}
                                </button>
                              ))}
                            </div>
                          </div>
                          {selectedIndustry && (
                            <div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Step 2 — Select Your Trade</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {LABOUR_INDUSTRIES[selectedIndustry].specialties.map((spec) => (
                                  <button key={spec.name} type="button" onClick={() => setOccupation(spec.name)}
                                    style={{ padding: '7px 14px', borderRadius: 10, border: occupation === spec.name ? 'none' : '1.5px solid #e2e8f0', background: occupation === spec.name ? 'linear-gradient(135deg,#1db97a,#16a34a)' : '#f8fafc', color: occupation === spec.name ? '#fff' : '#334155', fontWeight: occupation === spec.name ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.18s' }}
                                  >
                                    {occupation === spec.name && '✓ '}{spec.name}
                                  </button>
                                ))}
                              </div>
                              {selectedIndustry && occupation && (
                                <div style={{ marginTop: 10, padding: '8px 14px', background: '#f0fdf4', borderRadius: 10, border: '1.5px solid #bbf7d0', fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>
                                  ✅ Selected: <strong>{occupation}</strong> &nbsp;·&nbsp; ₹{LABOUR_INDUSTRIES[selectedIndustry]?.specialties.find(s => s.name === occupation)?.baseRate || '—'}/day base rate
                                </div>
                              )}
                            </div>
                          )}
                          <input type="hidden" value={occupation} required />
                        </div>
                      </div>
                    )}

                    {/* ID Card Selection */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0">
                        <label>Select ID Proof Document</label>
                        <select className="form-select border-1.5 p-2 rounded-12 text-muted" style={{ height: '50px', fontSize: '0.95rem', border: '1.5px solid #e2e8f0' }} value={idType} onChange={(e) => handleIdTypeChange(e.target.value)} required>
                          <option value="">-- Choose ID Document --</option>
                          <option value="Aadhaar">Aadhaar Card (UIDAI)</option>
                          <option value="PAN">PAN Card (Income Tax)</option>
                        </select>
                      </div>
                    </div>

                    {/* ID Verification File Upload */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0">
                        <label>Upload ID Card Proof</label>
                        <div className="file-upload-wrapper" style={{ height: '50px', padding: '10px 15px', position: 'relative' }}>
                          {isScanningID ? (
                            <span className="small text-primary text-truncate d-flex align-items-center gap-2 fw-700">
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px' }}></span>
                              🔍 Scanning ID Card...
                            </span>
                          ) : (
                            <span className="small text-muted text-truncate d-block fw-700">
                              {idFileName ? `✔️ ${idFileName.substring(0, 18)}...` : '📎 Upload ID PDF/Image'}
                            </span>
                          )}
                          <input type="file" accept="image/*,application/pdf" className="file-upload-input" onChange={handleIdFileChange} required disabled={isScanningID} />
                        </div>
                        {idFileError && (
                          <div className="text-danger small mt-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                            {idFileError}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0 position-relative">
                        <label>Password</label>
                        <input type={showSignUpPassword ? "text" : "password"} placeholder="At least 8 chars with uppercase, lowercase, number & symbol..." value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required style={{ paddingRight: '45px' }} autoComplete="new-password" />
                        <button type="button" className="btn position-absolute border-0 bg-transparent" style={{ right: '10px', top: '32px', zIndex: 10, padding: '5px' }} onClick={() => setShowSignUpPassword(!showSignUpPassword)}>
                          <i className={`bi ${showSignUpPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted fs-5`}></i>
                        </button>
                        <div className="text-muted small mt-1" style={{ fontSize: '0.72rem', lineHeight: '1.2' }}>Must be at least 8 characters, and contain uppercase, lowercase, numbers, and symbols.</div>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="col-md-6">
                      <div className="form-input-group mb-0 position-relative">
                        <label>Confirm Password</label>
                        <input type={showConfirmPassword ? "text" : "password"} placeholder="Repeat password..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ paddingRight: '45px' }} autoComplete="new-password" />
                        <button type="button" className="btn position-absolute border-0 bg-transparent" style={{ right: '10px', top: '32px', zIndex: 10, padding: '5px' }} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted fs-5`}></i>
                        </button>
                        {confirmPassword && signUpPassword !== confirmPassword && (
                          <div className="text-danger small mt-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                            ❌ Passwords do not match!
                          </div>
                        )}
                      </div>
                    </div>

                    </>)}
                  </div>

                  {activeTab !== 'industry' && (
                    <>
                      <div className="form-check mb-3 mt-4 text-start d-flex align-items-start gap-2">
                        <input 
                          className="form-check-input mt-1" 
                          type="checkbox" 
                          id="termsAgreementCheckbox" 
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          required
                          style={{ cursor: 'pointer', flexShrink: 0 }}
                        />
                        <label className="form-check-label text-muted small fw-600 mb-0" htmlFor="termsAgreementCheckbox" style={{ cursor: 'pointer', userSelect: 'none' }}>
                          I have read and agree to the <span className="text-primary fw-700 text-decoration-underline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} style={{ cursor: 'pointer' }}>QuickLabour Terms & Conditions</span>
                        </label>
                      </div>
                      
                      <button type="submit" className="login-submit-btn">
                        {activeTab === 'client' ? '🧑 Register as Client' : '🔧 Register as Worker'}
                      </button>
                    </>
                  )}
                </form>
              ) : (
                /* ──────────────── SIGN IN FORM ──────────────── */
                <form onSubmit={handleLogin}>
                  <div className="form-input-group">
                    <label>Email Address or Phone Number</label>
                    <input
                      type="text"
                      placeholder={activeTab === 'client' ? "e.g. 9874563210 or client123" : "e.g. 9874563210 or worker123"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="new-password"
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
                      autoComplete="new-password"
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
                    <a 
                      href="#" 
                      className="small fw-700 text-decoration-none" 
                      style={{ color: '#0d6efd' }}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsForgotPassword(true);
                        setForgotStep(1);
                        setForgotEmailOrPhone('');
                        setForgotOtp('');
                        setForgotNewPassword('');
                        setForgotConfirmPassword('');
                        setForgotOtpNotification('');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                    >
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

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ background: 'rgba(10, 37, 64, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg animate-fade-in" style={{ borderRadius: '24px' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-12 d-flex align-items-center justify-content-center text-primary" style={{ width: '38px', height: '38px' }}>
                    <i className="bi bi-file-earmark-text-fill fs-5"></i>
                  </div>
                  <h5 className="modal-title fw-800 m-0" style={{ color: '#0a2540', fontSize: '1.25rem' }}>
                    QuickLabour {activeTab === 'client' ? 'Client' : 'Worker'} Agreement & Policy
                  </h5>
                </div>
                <button 
                  type="button" 
                  className="btn-close shadow-none" 
                  style={{ fontSize: '0.9rem' }}
                  onClick={() => setShowTermsModal(false)}
                ></button>
              </div>

              <div className="modal-body px-4 py-3" style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                <div className="alert alert-info border-0 rounded-16 bg-light text-dark mb-4 p-3" style={{ borderLeft: '4px solid #0d6efd !important' }}>
                  <strong>Welcome to QuickLabour.</strong> By creating {activeTab === 'client' ? 'a Client' : 'a Worker'} account, you agree to the following terms:
                </div>

                {activeTab === 'client' && (
                  <div className="mb-4">
                    <h6 className="fw-800 text-dark mb-2 d-flex align-items-center gap-2">
                      <span className="badge bg-primary rounded-pill" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>Clients</span>
                      For Clients
                    </h6>
                    <ul className="ps-3 mb-0" style={{ listStyleType: 'disc' }}>
                      <li>Provide a correct address and contact number.</li>
                      <li>Be available at the job location at the agreed time.</li>
                      <li>Respond to worker calls and messages.</li>
                      <li>Do not create fake or misleading job requests.</li>
                      <li>Pay the agreed amount after work completion.</li>
                      <li>Repeated no-shows may result in account suspension.</li>
                    </ul>
                  </div>
                )}

                {activeTab === 'worker' && (
                  <div className="mb-4">
                    <h6 className="fw-800 text-dark mb-2 d-flex align-items-center gap-2">
                      <span className="badge bg-warning text-dark rounded-pill" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>Workers</span>
                      For Workers (Labours)
                    </h6>
                    <ul className="ps-3 mb-0" style={{ listStyleType: 'disc' }}>
                      <li>Accept jobs only when you are available.</li>
                      <li>Arrive at the job location on time.</li>
                      <li>Maintain professional behavior with clients.</li>
                      <li>Do not request extra payment outside the platform agreement.</li>
                      <li>Repeated cancellations or no-shows may result in account suspension.</li>
                      <li>Fraudulent activity may lead to permanent account termination.</li>
                    </ul>
                  </div>
                )}

                <div className="mb-4">
                  <h6 className="fw-800 text-dark mb-1.5" style={{ fontSize: '0.95rem' }}>Verification</h6>
                  <p className="mb-0">
                    QuickLabour may verify user identities through phone numbers, documents, or other verification methods.
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-800 text-dark mb-1.5" style={{ fontSize: '0.95rem' }}>Disputes</h6>
                  <p className="mb-0">
                    In case of a dispute, QuickLabour may review location data, communication records, photos, and job history to resolve the issue fairly.
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-800 text-dark mb-1.5" style={{ fontSize: '0.95rem' }}>Safety</h6>
                  <p className="mb-0">
                    Users must not engage in illegal activities, harassment, threats, violence, or fraud. Serious violations may be reported to the appropriate authorities.
                  </p>
                </div>

                <div className="mb-2">
                  <h6 className="fw-800 text-dark mb-1.5" style={{ fontSize: '0.95rem' }}>Acceptance</h6>
                  <p className="mb-0 fw-600 text-primary">
                    By checking "I Agree" and creating an account, you confirm that you have read and accepted these terms and policies.
                  </p>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="d-flex gap-2 flex-wrap">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm fw-700 px-3 py-1.5 rounded-10"
                    onClick={() => {
                      window.open('/privacy-policy', '_blank');
                    }}
                  >
                    View Full Policy
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm fw-700 px-3 py-1.5 rounded-10"
                    onClick={() => {
                      window.open('/refund-policy', '_blank');
                    }}
                  >
                    Refund Policy
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm fw-700 px-3 py-1.5 rounded-10"
                    onClick={() => {
                      window.open('/worker-conduct', '_blank');
                    }}
                  >
                    Worker Conduct
                  </button>
                </div>

                <div className="d-flex gap-2">
                  <button 
                    type="button" 
                    className="btn btn-light btn-sm fw-700 px-3.5 py-1.5 rounded-10 border"
                    onClick={() => setShowTermsModal(false)}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm fw-800 px-4 py-1.5 rounded-10 text-white"
                    onClick={() => {
                      setAgreedToTerms(true);
                      setShowTermsModal(false);
                    }}
                  >
                    I Agree
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

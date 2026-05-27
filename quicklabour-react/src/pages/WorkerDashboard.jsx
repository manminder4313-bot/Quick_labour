import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import ChatWidget from '../components/ChatWidget';

const WorkerDashboard = () => {
  const getPointsCost = (money) => {
    const cleanStr = String(money || '').replace(/[^\d.]/g, '');
    const val = parseFloat(cleanStr) || 0;
    if (val <= 500) return 10;
    if (val <= 1000) return 15;
    if (val <= 1500) return 20;
    if (val <= 2000) return 25;
    if (val <= 2500) return 30;
    if (val <= 3000) return 35;
    if (val <= 3500) return 40;
    if (val <= 4000) return 45;
    if (val <= 4500) return 50;
    if (val <= 5000) return 55;
    return 60;
  };

  const [hiredJobs, setHiredJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [isOnline, setIsOnline] = useState(sessionStorage.getItem('userOnlineStatus') === 'true');
  const [completedCount, setCompletedCount] = useState(Number(sessionStorage.getItem('userJobsCompleted')) || 18);
  const [workerRating, setWorkerRating] = useState(sessionStorage.getItem('userRating') || '4.9');
  const [actionAlert, setActionAlert] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'invitations', or 'past'

  // Subscriptions & Points states
  const [workerPoints, setWorkerPoints] = useState(Number(sessionStorage.getItem('userPoints')) || 0);
  const [acceptedJobs, setAcceptedJobs] = useState(Number(sessionStorage.getItem('userAcceptedJobs')) || 0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic'); // 'basic', 'standard', 'premium'
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(sessionStorage.getItem('userName') || '');
  const [cardError, setCardError] = useState('');

  // Profile reactive states
  const [profileName, setProfileName] = useState(sessionStorage.getItem('userName') || 'Ramesh Kumar');
  const [profilePhone, setProfilePhone] = useState(sessionStorage.getItem('userPhone') || '+91 99887 76655');
  const [profileAddress, setProfileAddress] = useState(sessionStorage.getItem('userAddress') || 'Bandra, Mumbai');
  const [profileAvatar, setProfileAvatar] = useState(sessionStorage.getItem('userAvatar') || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80');
  const [profileOccupation, setProfileOccupation] = useState(sessionStorage.getItem('userOccupation') || 'Professional Plumber');
  const [workerLat, setWorkerLat] = useState(Number(sessionStorage.getItem('userLatitude')) || null);
  const [workerLng, setWorkerLng] = useState(Number(sessionStorage.getItem('userLongitude')) || null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapJob, setMapJob] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);
  const prevAvailableIds = useRef([]);

  // Edit Profile Form States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editLat, setEditLat] = useState(null);
  const [editLng, setEditLng] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(profileName);
    setEditPhone(profilePhone);
    setEditAddress(profileAddress);
    setEditAvatar(profileAvatar);
    setEditOccupation(profileOccupation);
    setEditLat(workerLat);
    setEditLng(workerLng);
    setShowEditModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setEditLat(latitude);
        setEditLng(longitude);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data && data.display_name) {
            const addr = data.address;
            const shortAddress = [
              addr.suburb || addr.neighbourhood || addr.road,
              addr.city || addr.town || addr.village,
              addr.state,
              addr.country
            ].filter(Boolean).join(', ');
            
            setEditAddress(shortAddress || data.display_name);
          } else {
            setEditAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error("Geocoding failed", error);
          setEditAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error", error);
        alert("Failed to retrieve location: " + error.message);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await api.updateProfile({
        fullName: editName,
        phone: editPhone,
        address: editAddress,
        avatar: editAvatar,
        occupation: editOccupation,
        latitude: editLat,
        longitude: editLng
      });
      setProfileName(res.fullName);
      setProfilePhone(res.phone);
      setProfileAddress(res.address);
      setProfileAvatar(res.avatar);
      setProfileOccupation(res.occupation);
      if (res.latitude !== undefined) {
        setWorkerLat(res.latitude);
        sessionStorage.setItem('userLatitude', res.latitude);
      }
      if (res.longitude !== undefined) {
        setWorkerLng(res.longitude);
        sessionStorage.setItem('userLongitude', res.longitude);
      }
      setShowEditModal(false);
    } catch (error) {
      alert('❌ Error updating profile: ' + error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleOpenMap = (job) => {
    setMapJob(job);
    setShowMapModal(true);
  };

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      const sortedHired = [...(data.hiredJobs || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const sortedAvailable = [...(data.availableJobs || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Find new job invitations not currently in our tracking reference
      const newJobs = sortedAvailable.filter(
        job => !prevAvailableIds.current.includes(job._id)
      );
      if (newJobs.length > 0 && isOnline) {
        // Play clean soft notification sound chime!
        try {
          const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
          chime.volume = 0.4;
          chime.play().catch(() => {});
        } catch (e) {
          console.error(e);
        }
        
        // Trigger the beautiful floating card notification for the latest new job invitation
        const latestJob = newJobs[0];
        setActiveNotification({
          id: latestJob._id,
          client: latestJob.client?.fullName || 'Hiring Client',
          title: latestJob.title,
          money: latestJob.money,
          avatar: latestJob.client?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
          originalJob: latestJob
        });

        // Auto-hide the notification toast after 8 seconds
        setTimeout(() => {
          setActiveNotification(null);
        }, 8000);
      }

      // Initialize or update the reference ids
      prevAvailableIds.current = sortedAvailable.map(job => job._id);

      setHiredJobs(sortedHired);
      setAvailableJobs(sortedAvailable);
    } catch (error) {
      console.error('Error fetching jobs:', error.message);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Set up real-time polling to check for new requests every 5 seconds
    const intervalId = setInterval(fetchJobs, 5000);

    // Sync complete worker profile details from database on mount
    api.getProfile().then(user => {
      if (user.fullName) setProfileName(user.fullName);
      if (user.phone) setProfilePhone(user.phone);
      if (user.address) setProfileAddress(user.address);
      if (user.avatar) setProfileAvatar(user.avatar);
      if (user.occupation) setProfileOccupation(user.occupation);
      if (user.latitude !== undefined) {
        setWorkerLat(user.latitude);
        sessionStorage.setItem('userLatitude', user.latitude);
      }
      if (user.longitude !== undefined) {
        setWorkerLng(user.longitude);
        sessionStorage.setItem('userLongitude', user.longitude);
      }

      setCompletedCount(user.jobsCompleted);
      setWorkerRating(user.rating !== undefined ? user.rating : '4.9');
      setWorkerPoints(user.points !== undefined ? user.points : 0);
      setAcceptedJobs(user.acceptedJobsCount !== undefined ? user.acceptedJobsCount : 0);

      if (user.fullName) sessionStorage.setItem('userName', user.fullName);
      if (user.phone) sessionStorage.setItem('userPhone', user.phone);
      if (user.address) sessionStorage.setItem('userAddress', user.address);
      if (user.avatar) sessionStorage.setItem('userAvatar', user.avatar);
      if (user.occupation) sessionStorage.setItem('userOccupation', user.occupation);
      sessionStorage.setItem('userJobsCompleted', user.jobsCompleted);
      sessionStorage.setItem('userRating', user.rating !== undefined ? user.rating : '4.9');
      sessionStorage.setItem('userPoints', user.points !== undefined ? user.points : 0);
      sessionStorage.setItem('userAcceptedJobs', user.acceptedJobsCount !== undefined ? user.acceptedJobsCount : 0);
    }).catch(err => console.error(err));

    return () => clearInterval(intervalId);
  }, []);

  const handleToggleOnline = async () => {
    try {
      const nextStatus = !isOnline;
      const res = await api.updateOnlineStatus(nextStatus);
      setIsOnline(res.isOnline);
      sessionStorage.setItem('userOnlineStatus', String(res.isOnline));
      if (res.isOnline) {
        await fetchJobs();
      }
    } catch (error) {
      alert('❌ Error updating availability status: ' + error.message);
    }
  };

  // Map database waiting requests as invitations
  const invitations = availableJobs.map((job, idx) => ({
    id: job._id,
    client: job.client?.fullName || 'Hiring Client',
    title: job.title,
    rate: `₹${job.money}/day`,
    money: job.money,
    distance: job.distanceText || `${(idx + 1.2).toFixed(1)} km away`,
    location: job.location,
    fullAddress: job.fullAddress || '',
    latitude: job.latitude || null,
    longitude: job.longitude || null,
    avatar: job.client?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80'
  }));

  const activeHiredJobs = hiredJobs.filter(job => job.status === 'Accepted');
  const pastHiredJobs = hiredJobs.filter(job => job.status === 'Completed');

  // Calculate dynamic monthly earnings based on actual job budget and fallback base rate
  const completedHiredJobs = hiredJobs.filter(j => j.status === 'Completed');
  const actualEarnings = completedHiredJobs.reduce((sum, job) => sum + (job.money || 0), 0);
  const baseMockEarnings = (completedCount > completedHiredJobs.length)
    ? (completedCount - completedHiredJobs.length) * 880
    : 0;
  const totalEarnings = baseMockEarnings + actualEarnings;

  // Calculate dynamic stats
  const stats = {
    completedJobs: completedCount,
    monthlyEarnings: `₹${totalEarnings.toLocaleString('en-IN')}`,
    activeJobsToday: hiredJobs.filter(j => j.status === 'Accepted').length,
    rating: workerRating
  };

  const handleAcceptJob = async (id, clientName, money) => {
    const pointsCost = getPointsCost(money);
    if (workerPoints < pointsCost) {
      setActionAlert(`⚠️ This job requires ${pointsCost} points, but you only have ${workerPoints} points. Please purchase a subscription plan.`);
      setShowSubscriptionModal(true);
      return;
    }
    try {
      await api.updateJobStatus(id, 'Accepted');
      setActionAlert(`✅ Accepted job invitation from ${clientName}! Check your phone for details.`);
      
      // Refresh profile to get updated points and accepted jobs count
      const updatedProfile = await api.getProfile();
      setWorkerPoints(updatedProfile.points || 0);
      setAcceptedJobs(updatedProfile.acceptedJobsCount || 0);
      
      fetchJobs(); // Reload jobs from database
      setTimeout(() => setActionAlert(''), 5000);
    } catch (error) {
      if (error.message.includes('INSUFFICIENT_POINTS')) {
        setActionAlert('⚠️ Insufficient points! Please purchase a subscription to accept more jobs.');
        setShowSubscriptionModal(true);
      } else {
        alert('❌ Error accepting job: ' + error.message);
      }
    }
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted.substring(0, 19));
  };

  const handleCardExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    if (value.length > 2) {
      formatted = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    }
    setCardExpiry(formatted.substring(0, 5));
  };

  const handleCardCvcChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardCvc(value.substring(0, 4));
  };

  const handlePurchaseSubscription = async (e) => {
    if (e) e.preventDefault();
    
    // Step 1: Transition view to card entries if not visible yet
    if (!showCardForm) {
      setShowCardForm(true);
      setCardError('');
      return;
    }

    // Step 2: Validate card inputs
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 16) {
      setCardError('❌ Please enter a valid 16-digit credit card number.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setCardError('❌ Expiry date must match the format MM / YY (e.g. 12/28).');
      return;
    }
    if (cardCvc.length < 3) {
      setCardError('❌ Please enter a valid 3 or 4-digit card security code (CVC).');
      return;
    }
    if (!cardName.trim()) {
      setCardError('❌ Cardholder name is required.');
      return;
    }

    setCardError('');
    setIsSubscribing(true);

    try {
      // 1. Exchange secure Payment Intent token with MERN Server
      const intentRes = await api.createPaymentIntent(selectedPlan);
      
      // Visualize premium secure transaction checks
      setActionAlert('🔒 Connecting to secure payment network...');
      await new Promise(r => setTimeout(r, 1200));

      setActionAlert('🔐 Authorizing card parameters...');
      await new Promise(r => setTimeout(r, 1200));

      // 2. Validate and claim points credits on the database
      const verifyRes = await api.verifyPaymentAndCredit(intentRes.intentId, selectedPlan, intentRes.isSimulated);

      setWorkerPoints(verifyRes.user.points || 0);
      setAcceptedJobs(verifyRes.user.acceptedJobsCount || 0);
      sessionStorage.setItem('userPoints', verifyRes.user.points || 0);
      sessionStorage.setItem('userAcceptedJobs', verifyRes.user.acceptedJobsCount || 0);

      setPaymentSuccess(true);
      setActionAlert(`🎉 Successful! Subscribed to ${selectedPlan.toUpperCase()} plan. Added ${verifyRes.pointsAdded} points.`);

      setTimeout(() => {
        setPaymentSuccess(false);
        setShowSubscriptionModal(false);
        setShowCardForm(false);
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        setActionAlert('');
      }, 3500);

    } catch (error) {
      setCardError('❌ Transaction Declined: ' + error.message);
      setActionAlert('');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDeclineJob = async (id, clientName) => {
    try {
      await api.updateJobStatus(id, 'Rejected');
      setActionAlert(`❌ Declined invitation from ${clientName}.`);
      fetchJobs(); // Reload jobs from database
      setTimeout(() => setActionAlert(''), 4000);
    } catch (error) {
      alert('❌ Error declining job: ' + error.message);
    }
  };

  return (
    <>
      {/* ⚡ Glowing Floating Notification Toast */}
      {activeNotification && (
        <div
          className="position-fixed p-4 shadow-2xl animate-notification-toast"
          style={{
            top: '24px',
            right: '24px',
            zIndex: 9999,
            width: '410px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            webkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px 2px rgba(99, 102, 241, 0.25)',
            color: '#ffffff',
            fontFamily: "'Outfit', 'Poppins', sans-serif",
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            borderRadius: '24px'
          }}
        >
          <style>{`
            @keyframes springSlideIn {
              0% { opacity: 0; transform: translateX(50px) scale(0.9) translateY(-10px); }
              70% { transform: translateX(-5px) scale(1.02) translateY(2px); }
              100% { opacity: 1; transform: translateX(0) scale(1) translateY(0); }
            }
            .animate-notification-toast {
              animation: springSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .glow-btn-success {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
              box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4) !important;
              transition: all 0.3s ease !important;
              border: none !important;
              color: #ffffff !important;
            }
            .glow-btn-success:hover {
              transform: translateY(-2px) !important;
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6) !important;
            }
            .glow-btn-outline {
              background: rgba(255, 255, 255, 0.06) !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
              color: #f8fafc !important;
              transition: all 0.3s ease !important;
            }
            .glow-btn-outline:hover {
              background: rgba(255, 255, 255, 0.12) !important;
              transform: translateY(-2px) !important;
              border-color: rgba(255, 255, 255, 0.3) !important;
            }
            .pulsing-dot {
              box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
              animation: pulseRing 1.8s infinite cubic-bezier(0.66, 0, 0, 1);
            }
            @keyframes pulseRing {
              0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
              70% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
              100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
            }
          `}</style>
          
          <div className="d-flex align-items-start gap-3">
            <div className="position-relative" style={{ flexShrink: 0 }}>
              <div style={{
                padding: '3px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f5a623, #ff007f)',
                boxShadow: '0 4px 10px rgba(245, 166, 35, 0.3)'
              }}>
                <img
                  src={activeNotification.avatar}
                  alt={activeNotification.client}
                  className="rounded-circle"
                  style={{ width: '60px', height: '60px', objectFit: 'cover', display: 'block', border: '2px solid #0f172a' }}
                />
              </div>
              <span className="position-absolute bottom-0 end-0 bg-warning rounded-circle pulsing-dot" style={{ width: '14px', height: '14px', border: '2px solid #0f172a' }}></span>
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="badge px-3 py-1.5 rounded-pill fw-800 d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', letterSpacing: '0.8px', background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)', color: '#0f172a', textTransform: 'uppercase' }}>
                  <i className="bi bi-lightning-charge-fill animate-pulse"></i> New Invitation
                </span>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  style={{ padding: '0.2rem', fontSize: '0.75rem', opacity: 0.6 }}
                  onClick={() => setActiveNotification(null)}
                ></button>
              </div>
              
              <h6 className="fw-800 text-white mb-2" style={{ fontSize: '1.02rem', lineHeight: '1.4', letterSpacing: '-0.3px', wordBreak: 'break-word' }}>
                {activeNotification.title}
              </h6>
              
              <p className="text-white-50 small mb-3 fw-600 d-flex align-items-center gap-1.5" style={{ fontSize: '0.82rem' }}>
                <i className="bi bi-person-badge-fill text-warning"></i> From <strong className="text-white fw-700">{activeNotification.client}</strong>
              </p>
              
              <div className="d-flex align-items-center justify-content-between mb-4 p-2.5 rounded-16" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span className="fw-900 text-success d-flex align-items-center gap-1" style={{ fontSize: '1.18rem' }}>
                  <span className="text-white-50 small fw-700" style={{ fontSize: '0.85rem' }}>Rate:</span> ₹{activeNotification.money}/day
                </span>
                <span className="badge bg-warning bg-opacity-10 text-warning px-2.5 py-1.5 rounded-pill fw-800 d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                  🪙 {getPointsCost(activeNotification.money)} pts
                </span>
              </div>
              
              <div className="d-flex gap-2.5">
                <button
                  type="button"
                  className="btn btn-success flex-fill rounded-16 fw-bold py-2.5 glow-btn-success d-flex align-items-center justify-content-center gap-1.5"
                  onClick={() => {
                    handleAcceptJob(activeNotification.id, activeNotification.client, activeNotification.money);
                    setActiveNotification(null);
                  }}
                >
                  <i className="bi bi-check-circle-fill"></i> Accept Job
                </button>
                <button
                  type="button"
                  className="btn flex-fill rounded-16 fw-bold py-2.5 glow-btn-outline d-flex align-items-center justify-content-center gap-1.5"
                  onClick={() => {
                    setActiveTab('invitations');
                    setActiveNotification(null);
                    setTimeout(() => {
                      const el = document.getElementById('manage-work-orders');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                  }}
                >
                  <i className="bi bi-eye-fill"></i> Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <div className="container">

          {/* Action Alert Banner */}
          {actionAlert && (
            <div className="alert alert-info alert-dismissible fade show rounded-16 shadow mb-4" role="alert">
              <strong className="fw-700">{actionAlert}</strong>
              <button type="button" className="btn-close" onClick={() => setActionAlert('')}></button>
            </div>
          )}

          {/* Dashboard Banner */}
          <div className="dashboard-banner reveal visible">
            <div>
              <div className="d-flex align-items-center gap-3">
                <h2>Welcome back, {profileName}! 🛠️</h2>
              </div>
              <p>You are logged in as a **{profileOccupation}**. Review nearby requests and build your schedule.</p>
            </div>

            {/* Availability Toggle Switch */}
            <div className="availability-switch-container">
              <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
              <span className="switch-label">
                {isOnline ? 'Online & Available' : 'Offline'}
              </span>
              <div className="form-check form-switch mb-0 ms-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="availabilitySwitch"
                  checked={isOnline}
                  onChange={handleToggleOnline}
                />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="row g-4 mb-5">
            <div className="col-xl col-md-4 col-sm-6">
              <div className="dashboard-stat-card">
                <div className="stat-icon-wrapper green">
                  <i className="bi bi-patch-check-fill"></i>
                </div>
                <div>
                  <div className="stat-number">{stats.completedJobs}</div>
                  <div className="stat-label">Jobs Completed</div>
                </div>
              </div>
            </div>
            <div className="col-xl col-md-4 col-sm-6">
              <div className="dashboard-stat-card">
                <div className="stat-icon-wrapper blue">
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div>
                  <div className="stat-number">{stats.monthlyEarnings}</div>
                  <div className="stat-label">This Month</div>
                </div>
              </div>
            </div>
            <div className="col-xl col-md-4 col-sm-6">
              <div className="dashboard-stat-card">
                <div className="stat-icon-wrapper purple">
                  <i className="bi bi-briefcase-fill"></i>
                </div>
                <div>
                  <div className="stat-number">{stats.activeJobsToday}</div>
                  <div className="stat-label">Active Today</div>
                </div>
              </div>
            </div>
            <div className="col-xl col-md-4 col-sm-6">
              <div className="dashboard-stat-card">
                <div className="stat-icon-wrapper orange">
                  <i className="bi bi-star-fill"></i>
                </div>
                <div>
                  <div className="stat-number">{stats.rating} ⭐</div>
                  <div className="stat-label">Worker Rating</div>
                </div>
              </div>
            </div>
            <div className="col-xl col-md-4 col-sm-6">
              <div 
                className="dashboard-stat-card position-relative overflow-hidden cursor-pointer d-flex align-items-center justify-content-between gap-2" 
                onClick={() => setShowSubscriptionModal(true)} 
                style={{ 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  border: '1.5px solid rgba(245, 166, 35, 0.2)',
                  background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.03), #ffffff)',
                  boxShadow: '0 4px 6px -1px rgba(245, 166, 35, 0.05)',
                  minHeight: '90px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(245, 166, 35, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(245, 166, 35, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(245, 166, 35, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(245, 166, 35, 0.2)';
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="stat-icon-wrapper orange" style={{ background: 'rgba(245, 166, 35, 0.12)', color: '#f5a623' }}>
                    <i className="bi bi-lightning-charge-fill animate-bounce"></i>
                  </div>
                  <div>
                    <div className="stat-number text-dark d-flex align-items-center gap-1">
                      {workerPoints} <span className="small text-muted fw-600" style={{ fontSize: '0.8rem' }}>PTS</span>
                    </div>
                    <div className="stat-label">Points Balance</div>
                  </div>
                </div>
                {/* Circle orange plus button representing add/adding points */}
                <div 
                  className="d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle shadow-sm" 
                  style={{ width: '32px', height: '32px', border: '1px solid rgba(245, 166, 35, 0.3)', transition: 'all 0.2s', flexShrink: 0 }}
                  title="Add more points"
                >
                  <i className="bi bi-plus-lg fw-900" style={{ color: '#f5a623', fontSize: '0.85rem' }}></i>
                </div>
              </div>
            </div>
          </div>

          {/* Main Work Area */}
          <div className="row g-4">
            <div className="col-lg-8">
              <div id="manage-work-orders" className="dashboard-card position-relative h-100">
                <div className="dashboard-card-title mb-1 pb-1">
                  <span>Manage Work Orders</span>
                </div>

                {/* Tab Selector */}
                <div className="d-flex border-bottom mb-4" style={{ gap: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className="pb-2 fw-700 position-relative border-0 bg-transparent text-start px-0"
                    style={{
                      color: activeTab === 'active' ? '#0d6efd' : '#64748b',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      borderRadius: 0
                    }}
                  >
                    Active Jobs
                    <span className="badge bg-primary-subtle text-primary ms-2 rounded-pill" style={{ fontSize: '0.75rem' }}>
                      {activeHiredJobs.length}
                    </span>
                    {activeTab === 'active' && (
                      <div className="position-absolute bottom-0 start-0 end-0" style={{ height: '3px', background: '#0d6efd', borderRadius: '3px' }}></div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('invitations')}
                    className="pb-2 fw-700 position-relative border-0 bg-transparent text-start px-0"
                    style={{
                      color: activeTab === 'invitations' ? '#0d6efd' : '#64748b',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      borderRadius: 0
                    }}
                  >
                    Nearby Invitations
                    <span className="badge bg-warning-subtle text-warning ms-2 rounded-pill" style={{ fontSize: '0.75rem' }}>
                      {invitations.length}
                    </span>
                    {activeTab === 'invitations' && (
                      <div className="position-absolute bottom-0 start-0 end-0" style={{ height: '3px', background: '#0d6efd', borderRadius: '3px' }}></div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('past')}
                    className="pb-2 fw-700 position-relative border-0 bg-transparent text-start px-0"
                    style={{
                      color: activeTab === 'past' ? '#0d6efd' : '#64748b',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      borderRadius: 0
                    }}
                  >
                    Work History
                    <span className="badge bg-secondary-subtle text-secondary ms-2 rounded-pill" style={{ fontSize: '0.75rem' }}>
                      {pastHiredJobs.length}
                    </span>
                    {activeTab === 'past' && (
                      <div className="position-absolute bottom-0 start-0 end-0" style={{ height: '3px', background: '#0d6efd', borderRadius: '3px' }}></div>
                    )}
                  </button>
                </div>

                {/* Active Hired Jobs */}
                {activeTab === 'active' && (
                  activeHiredJobs.length > 0 ? (
                    <div className="dashboard-scroll-container">
                      {activeHiredJobs.map(job => (
                        <div key={job._id} className="dashboard-list-item d-flex flex-column align-items-stretch py-4 border-bottom">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <span className="badge bg-primary-subtle text-primary small fw-700" style={{ fontSize: '0.7rem' }}>ONGOING PROJECT</span>
                              <h5 className="fw-700 mb-1 mt-1" style={{ color: '#0a2540' }}>{job.title}</h5>
                              <span className="text-muted small fw-600">
                                <i className="bi bi-calendar3 me-1"></i>Hired on {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <span className="badge-status success">
                              In Progress
                            </span>
                          </div>

                          {/* Client info and actions inside active job card */}
                          {job.client && (
                            <div className="bg-light p-3 rounded-16 border d-flex justify-content-between align-items-center flex-wrap gap-3">
                              <div className="d-flex align-items-center gap-3">
                                <img src={job.client.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'} alt={job.client.fullName} className="bidder-profile-img" />
                                <div>
                                  <span className="small text-muted fw-700">Hiring Client</span>
                                  <h6 className="mb-0 mt-1">{job.client.fullName}</h6>
                                  <p className="text-muted small mt-1"><i className="bi bi-telephone-fill me-1"></i>{job.client.phone || 'N/A'}</p>
                                </div>
                              </div>

                              <div className="text-end">
                                <div className="fw-800 text-success mb-1" style={{ fontSize: '1.05rem' }}>₹{job.money || 0}/day</div>
                                <div className="d-flex gap-2 justify-content-end align-items-center">
                                  <button className="btn-action-outline py-1 px-3" style={{ height: '34px', fontSize: '0.85rem' }}><i className="bi bi-chat-dots-fill me-1"></i>Message</button>
                                  {(job.latitude && job.longitude) || job.fullAddress || (job.client && job.client.address) ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenMap(job)}
                                      className="d-inline-flex align-items-center gap-1 fw-bold btn-action-solid py-1 px-3 text-white"
                                      style={{ height: '34px', fontSize: '0.85rem', background: 'linear-gradient(135deg,#0d6efd,#6610f2)', border: 'none', borderRadius: '12px' }}
                                    >
                                      🗺️ GPS Route
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-activity fs-1 mb-3 text-muted opacity-50 d-block"></i>
                      <h6 className="fw-700">No active ongoing jobs</h6>
                      <p className="small mb-0">Accept a nearby invitation in the next tab to get started!</p>
                    </div>
                  )
                )}

                {/* Nearby Invitations Tab */}
                {activeTab === 'invitations' && (
                  !isOnline ? (
                    <div
                      className="d-flex flex-column align-items-center justify-content-center text-center p-5 my-4"
                      style={{
                        background: 'rgba(239, 68, 68, 0.04)',
                        border: '2px dashed rgba(239, 68, 68, 0.2)',
                        borderRadius: '20px',
                      }}
                    >
                      <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-circle mb-3" style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                        <i className="bi bi-cloud-slash-fill"></i>
                      </div>
                      <h5 className="fw-800 text-danger">You are currently Offline</h5>
                      <p className="text-muted max-width-400 small mt-2">
                        Toggle your status to **Online & Available** at the top right to start receiving local job invitations from hiring clients in Mumbai.
                      </p>
                      <button
                        className="btn-action-solid mt-3 px-4 py-2"
                        style={{ background: '#ef4444' }}
                        onClick={handleToggleOnline}
                      >
                        Go Online Now
                      </button>
                    </div>
                  ) : (
                    invitations.length > 0 ? (
                      <div className="dashboard-scroll-container">
                        {invitations.map(inv => (
                          <div key={inv.id} className="dashboard-list-item">
                            <div className="d-flex align-items-center gap-3">
                              <img src={inv.avatar} alt={inv.client} className="bidder-profile-img" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span className="badge bg-primary-subtle text-primary small fw-700" style={{ fontSize: '0.7rem' }}>INVITATION</span>
                                <h6 className="mt-1 mb-1">{inv.title}</h6>
                                <div className="d-flex align-items-center gap-2 text-muted small fw-600 mb-1">
                                  <span><i className="bi bi-person-fill me-1"></i>{inv.client}</span>
                                  <span>|</span>
                                  <span><i className="bi bi-geo-alt-fill text-danger me-1"></i>{inv.location || inv.distance}</span>
                                </div>
                                {inv.fullAddress && (
                                  <div className="rounded-2 p-2 mt-1" style={{ background: '#f0f4ff', border: '1px solid #c7d7ff', fontSize: '0.75rem' }}>
                                    <span className="fw-bold text-primary">🏠 </span>
                                    <span className="text-dark">{inv.fullAddress}</span>
                                  </div>
                                )}
                                {(inv.latitude && inv.longitude) || inv.fullAddress ? (
                                  <a
                                    href={
                                      inv.latitude && inv.longitude
                                        ? `https://www.google.com/maps?q=${inv.latitude},${inv.longitude}`
                                        : `https://www.google.com/maps/search/${encodeURIComponent(inv.fullAddress)}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="d-inline-flex align-items-center gap-1 mt-2 fw-bold"
                                    style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', color: '#fff', borderRadius: '8px', padding: '4px 12px', fontSize: '0.72rem', textDecoration: 'none' }}
                                  >
                                    🗺️ Navigate to Client
                                  </a>
                                ) : null}
                              </div>
                            </div>

                            <div className="text-end">
                              <div className="fw-800 text-success mb-1" style={{ fontSize: '1.1rem' }}>{inv.rate}</div>
                              <div className="mb-2">
                                <span className="badge bg-warning bg-opacity-15 text-dark rounded-pill fw-bold" style={{ border: '1px solid #ffc107', fontSize: '0.72rem' }}>
                                  🪙 Cost: {getPointsCost(inv.money)} pts
                                </span>
                              </div>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn-action-solid py-1 px-3"
                                  style={{ background: '#1db97a' }}
                                  onClick={() => handleAcceptJob(inv.id, inv.client, inv.money)}
                                >
                                  Accept
                                </button>
                                <button
                                  className="btn-action-outline py-1 px-2 text-danger"
                                  onClick={() => handleDeclineJob(inv.id, inv.client)}
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-5 text-muted">
                        <i className="bi bi-clipboard-x fs-1 mb-3 text-muted opacity-50 d-block"></i>
                        <h6 className="fw-700">No active job invitations</h6>
                        <p className="small mb-0">Check back later or browse other open work orders.</p>
                      </div>
                    )
                  )
                )}

                {/* Work History Render */}
                {activeTab === 'past' && (
                  pastHiredJobs.length > 0 ? (
                    <div className="dashboard-scroll-container">
                      {pastHiredJobs.map(job => (
                        <div key={job._id} className="dashboard-list-item d-flex flex-column align-items-stretch py-4 border-bottom">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <span className="badge bg-secondary-subtle text-secondary small fw-700" style={{ fontSize: '0.7rem' }}>COMPLETED PROJECT</span>
                              <h5 className="fw-700 mb-1 mt-1" style={{ color: '#0a2540' }}>{job.title}</h5>
                              <span className="text-muted small fw-600">
                                <i className="bi bi-calendar-check me-1"></i>Completed on {new Date(job.updatedAt || job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <span className="badge-status success" style={{ background: '#ecfdf5', color: '#047857' }}>
                              Done & Paid
                            </span>
                          </div>

                          {/* Client info inside completed job card */}
                          {job.client && (
                            <div className="bg-light p-3 rounded-16 border d-flex justify-content-between align-items-center flex-wrap gap-3">
                              <div className="d-flex align-items-center gap-3">
                                <img src={job.client.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'} alt={job.client.fullName} className="bidder-profile-img" />
                                <div>
                                  <span className="small text-muted fw-700">Hiring Client</span>
                                  <h6 className="mb-0 mt-1">{job.client.fullName}</h6>
                                </div>
                              </div>

                              <div className="text-end">
                                <div className="fw-800 text-success mb-1" style={{ fontSize: '1.05rem' }}>₹{job.money || 0} Paid</div>
                                <span className="badge bg-success bg-opacity-10 text-success fw-700 rounded-pill px-3 py-1">Closed & Completed</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-clock-history fs-1 mb-3 text-muted opacity-50 d-block"></i>
                      <h6 className="fw-700">No completed jobs history</h6>
                      <p className="small mb-0">Your finished projects will show up here after clients mark them complete.</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="dashboard-card mb-4">
                <h5 className="fw-700 mb-3" style={{ color: '#0a2540' }}>Worker Profile</h5>
                <div className="text-center py-3 border-bottom mb-3">
                  <img
                    src={profileAvatar}
                    alt={profileName}
                    className="rounded-circle border border-3 border-success mb-3"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                  <h6 className="fw-800 mb-1">{profileName}</h6>
                  <span className="badge bg-primary-subtle text-primary fw-700">{profileOccupation}</span>
                </div>
                <ul className="list-unstyled mb-2">
                  <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-envelope text-muted"></i> {sessionStorage.getItem('userEmail') || 'worker@quicklabour.com'}</li>
                  <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-geo-alt text-muted"></i> {profileAddress}</li>
                  <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-telephone text-muted"></i> {profilePhone}</li>
                </ul>
                <button
                  onClick={handleOpenEditModal}
                  className="btn w-100 mt-2 d-flex align-items-center justify-content-center gap-2 py-2"
                  style={{
                    background: '#f1f5f9',
                    border: '1px dashed #cbd5e1',
                    color: '#475569',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="bi bi-pencil-square"></i> Edit Profile
                </button>
              </div>

              {/* Subscription and Points Card */}
              <div className="dashboard-card mb-4" style={{
                background: 'linear-gradient(135deg, #1e1b4b, #311042)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-800 m-0" style={{ color: '#fff', fontSize: '1.1rem' }}>
                    ⚡ Subscriptions & Points
                  </h5>
                  <span className="badge bg-warning text-dark fw-800" style={{ fontSize: '0.72rem' }}>
                    {acceptedJobs < 2 ? 'Free Account' : 'Paid Account'}
                  </span>
                </div>
                
                <div className="p-3 rounded-16 mb-3" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-white-50">Points Balance</span>
                    <span className="fw-900 text-warning" style={{ fontSize: '1.25rem' }}>{workerPoints} PTS</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-white-50">Free Jobs Accepted</span>
                    <span className="fw-800">{Math.min(acceptedJobs, 2)} / 2</span>
                  </div>
                  <div className="progress mt-2" style={{ height: '6px', background: 'rgba(255,255,255,0.1)' }}>
                    <div 
                      className="progress-bar bg-warning" 
                      role="progressbar" 
                      style={{ width: `${Math.min((acceptedJobs / 2) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <p className="small text-white-50 mb-3" style={{ lineHeight: '1.4' }}>
                  {acceptedJobs < 2 
                    ? `You can accept ${2 - acceptedJobs} more job requests for free! After that, purchase a subscription to get points.`
                    : workerPoints >= 10 
                      ? 'Each job acceptance costs 10 points. Buy more points to keep accepting jobs.'
                      : '⚠️ Insufficient points balance! Please purchase points to accept job invitations.'
                  }
                </p>

                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="btn btn-warning w-100 fw-800 d-flex align-items-center justify-content-center gap-2 py-2 text-dark rounded-12 transition-all border-0"
                  style={{
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                    fontSize: '0.9rem'
                  }}
                >
                  <i className="bi bi-gem"></i> Buy Points & Plans
                </button>
              </div>

              <div className="dashboard-card">
                <h5 className="fw-700 mb-3" style={{ color: '#0a2540' }}>Earnings Progress</h5>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small mb-1 fw-700 text-muted">
                    <span>Monthly Goal (₹30,000)</span>
                    <span>{Math.min(Math.round((totalEarnings / 30000) * 100), 100)}%</span>
                  </div>
                  <div className="progress rounded-pill" style={{ height: '8px' }}>
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${Math.min(Math.round((totalEarnings / 30000) * 100), 100)}%`, borderRadius: '50px' }}
                      aria-valuenow={Math.min(Math.round((totalEarnings / 30000) * 100), 100)}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
                <p className="small text-muted mb-0" style={{ lineHeight: '1.5' }}>
                  You have earned <strong className="fw-700 text-dark">₹{totalEarnings.toLocaleString('en-IN')}</strong> out of your monthly target of <strong className="fw-700 text-dark">₹30,000</strong>. Keep your status <strong className="fw-700 text-success">Online</strong> to hit your goal!
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Floating Chat Widget ── */}
      <ChatWidget
        currentUserId={sessionStorage.getItem('userId') || 'worker-demo'}
        currentUserName={profileName}
        currentUserRole="worker"
        currentUserAvatar={profileAvatar}
      />

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: '#ffffff' }}>
              
              {/* Header */}
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #0d6efd, #6610f2)', borderBottom: 'none' }}>
                <h5 className="modal-title fw-800 m-0"><i className="bi bi-person-gear me-2"></i>Edit Profile Info</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProfile}>
                <div className="modal-body px-4 py-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {/* Avatar Upload Container */}
                  <div className="text-center mb-4">
                    <div 
                      className="position-relative d-inline-block" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => document.getElementById('workerAvatarUploadInput').click()}
                    >
                      <img 
                        src={editAvatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80'} 
                        alt="Avatar Preview" 
                        className="rounded-circle border border-4 border-success shadow-sm" 
                        style={{ width: '100px', height: '100px', objectFit: 'cover', transition: 'all 0.2s' }}
                      />
                      <div 
                        className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow" 
                        style={{ width: '32px', height: '32px', border: '2px solid #ffffff' }}
                      >
                        <i className="bi bi-camera-fill" style={{ fontSize: '0.85rem' }}></i>
                      </div>
                      <input 
                        type="file" 
                        id="workerAvatarUploadInput" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                      />
                    </div>
                    <div className="small text-muted mt-2 fw-700">Click photo to upload from gallery</div>
                  </div>

                  {/* Full Name */}
                  <div className="mb-3">
                    <label className="form-label small fw-700 text-muted">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control rounded-12" 
                      placeholder="Enter full name" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Specialty / Occupation Dropdown */}
                  <div className="mb-3">
                    <label className="form-label small fw-700 text-muted">Specialty / Occupation</label>
                    <select
                      className="form-select rounded-12"
                      value={editOccupation}
                      onChange={(e) => setEditOccupation(e.target.value)}
                      required
                    >
                      <option value="">Select Specialty</option>
                      {[
                        "Construction Labour", "Mason", "Carpenter", "Electrician", "Plumber", "Welder", "Painter", "Tile worker", "Steel fixer", "Concrete worker", "Scaffolder",
                        "Machine operator", "Assembly line worker", "Packaging worker", "Warehouse loader", "Forklift operator", "Quality checker",
                        "Farmer helper", "Harvester", "Dairy worker", "Irrigation worker", "Tractor operator",
                        "Truck helper", "Delivery worker", "Driver", "Loader/unloader",
                        "Sweeper", "Housekeeping staff", "Garbage collector", "Maintenance worker",
                        "Cook", "Maid", "Caretaker", "Babysitter",
                        "HVAC technician", "Mechanic", "Mobile repair technician", "AC repair worker",
                        "Helper", "Road worker", "Excavation worker", "Security guard",
                        "Miner", "Drilling worker", "Crane operator"
                      ].map((specialty) => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div className="mb-3">
                    <label className="form-label small fw-700 text-muted">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-control rounded-12" 
                      placeholder="Enter phone number" 
                      value={editPhone} 
                      onChange={(e) => setEditPhone(e.target.value)}
                      required
                    />
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <label className="form-label small fw-700 text-muted">Address / City Location</label>
                    <div className="d-flex gap-2">
                      <input 
                        type="text" 
                        className="form-control rounded-12" 
                        placeholder="Enter address" 
                        value={editAddress} 
                        onChange={(e) => setEditAddress(e.target.value)}
                        required
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-success rounded-12 d-flex align-items-center gap-1 px-3"
                        onClick={handleGetLiveLocation}
                        disabled={detectingLocation}
                        style={{ whiteSpace: 'nowrap', fontWeight: '700' }}
                      >
                        {detectingLocation ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Detecting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-geo-alt-fill"></i> Live
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer px-4 py-3 bg-light border-0 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill rounded-12 py-2 fw-bold"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-fill rounded-12 py-2 fw-bold"
                    style={{ background: 'linear-gradient(135deg, #0d6efd, #6610f2)', border: 'none' }}
                    disabled={updatingProfile}
                  >
                    {updatingProfile ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ── GPS Map Modal ── */}
      {showMapModal && mapJob && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '850px' }}>
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: '#ffffff', height: '80vh', display: 'flex', flexDirection: 'column' }}>
              
              {/* Header */}
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5c 100%)', borderBottom: 'none' }}>
                <div>
                  <h5 className="modal-title fw-800 m-0 d-flex align-items-center gap-2">
                    <i className="bi bi-compass-fill text-warning animate-bounce" style={{ fontSize: '1.25rem' }}></i>
                    GPS Route Navigation
                  </h5>
                  <p className="text-white-50 small m-0 mt-1 fw-600">
                    Showing route to {mapJob.client?.fullName || 'Client'} • {mapJob.fullAddress || mapJob.client?.address || 'Chandigarh'}
                  </p>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowMapModal(false); setMapJob(null); }}></button>
              </div>

              {/* Map Iframe container */}
              <div className="modal-body p-0" style={{ flex: 1, overflow: 'hidden', background: '#f8fafc', position: 'relative' }}>
                <iframe
                  title="GPS Navigation Route"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  src={(() => {
                    const origin = (workerLat && workerLng)
                      ? `${workerLat},${workerLng}`
                      : (profileAddress || 'Current Location');
                    const destination = (mapJob.latitude && mapJob.longitude)
                      ? `${mapJob.latitude},${mapJob.longitude}`
                      : (mapJob.fullAddress || (mapJob.client && mapJob.client.address) || '');
                    return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&output=embed&iwloc=near`;
                  })()}
                  allowFullScreen
                ></iframe>
              </div>

              {/* Footer */}
              <div className="modal-footer px-4 py-3 bg-light border-0 d-flex gap-3 justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-800 d-flex align-items-center gap-1">
                    <span className="status-dot online p-1"></span> Live Google GPS Route
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <a
                    href={(() => {
                      const origin = (workerLat && workerLng)
                        ? `${workerLat},${workerLng}`
                        : (profileAddress || 'Current Location');
                      const destination = (mapJob.latitude && mapJob.longitude)
                        ? `${mapJob.latitude},${mapJob.longitude}`
                        : (mapJob.fullAddress || (mapJob.client && mapJob.client.address) || '');
                      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
                    })()}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary px-4 py-2 rounded-12 fw-bold d-flex align-items-center gap-2 text-decoration-none text-white"
                    style={{ background: 'linear-gradient(135deg, #0d6efd, #6610f2)', border: 'none' }}
                  >
                    <i className="bi bi-box-arrow-up-right"></i> Open in Maps App
                  </a>
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2 rounded-12 fw-bold"
                    onClick={() => { setShowMapModal(false); setMapJob(null); }}
                  >
                    Close Navigation
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Purchase Subscription Plan Modal ── */}
      {showSubscriptionModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1060, fontFamily: "'Poppins', sans-serif" }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.96) translateY(12px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes scaleUp {
              from { transform: scale(0.85); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            .animate-fade-in {
              animation: fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .animate-scale-up {
              animation: scaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .animate-bounce {
              animation: bounce 2s infinite ease-in-out;
            }
          `}</style>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: '#ffffff' }}>
              
              {/* Header */}
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5c 100%)', borderBottom: 'none' }}>
                <h5 className="modal-title fw-800 m-0 d-flex align-items-center gap-2">
                  <i className="bi bi-lightning-charge-fill animate-bounce" style={{ color: '#f5a623', fontSize: '1.25rem' }}></i>
                  Premium Subscriptions & Plans
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSubscriptionModal(false)} disabled={isSubscribing}></button>
              </div>

              {/* Body */}
              <div className="modal-body px-4 py-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                {paymentSuccess ? (
                  <div className="text-center py-5 animate-scale-up">
                    <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle mb-4" style={{ width: '96px', height: '96px', fontSize: '3rem' }}>
                      <i className="bi bi-check-circle-fill" style={{ color: '#1db97a' }}></i>
                    </div>
                    <h3 className="fw-900 text-success" style={{ color: '#1db97a' }}>Payment Successful!</h3>
                    <p className="text-muted mt-2 max-width-400 mx-auto">
                      Your transaction was completed securely. Your points balance has been updated instantly.
                    </p>
                    <div className="spinner-border text-success spinner-border-sm mt-3" role="status"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <h4 className="fw-900" style={{ color: '#0a2540', letterSpacing: '-0.02em' }}>⚡ Boost Your Workforce Profile</h4>
                      <p className="text-muted small mx-auto" style={{ maxWidth: '600px', fontSize: '0.92rem' }}>
                        You've enjoyed your <span className="badge bg-warning bg-opacity-20 text-warning-emphasis fw-800 px-2 py-1 rounded" style={{ color: '#0a2540', background: 'rgba(245, 166, 35, 0.15)', border: '1px solid rgba(245, 166, 35, 0.3)' }}>2 FREE job accepts</span>. 
                        Subscribe to a premium plan to gain high-priority points. Every manual job acceptance costs only <strong className="text-dark">10 points</strong>.
                      </p>
                    </div>

                    {/* Subscription Cards Grid */}
                    <div className="row g-4 mb-4">
                      {/* Basic Plan */}
                      <div className="col-md-4">
                        <div 
                          className="card rounded-24 p-4 text-center h-100 cursor-pointer position-relative animate-scale-up"
                          onClick={() => setSelectedPlan('basic')}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: selectedPlan === 'basic' ? '2.5px solid #0d6efd' : '1.5px solid #e8edf5',
                            background: selectedPlan === 'basic' ? 'linear-gradient(135deg, rgba(13, 110, 253, 0.04), #ffffff)' : '#ffffff',
                            boxShadow: selectedPlan === 'basic' ? '0 20px 25px -5px rgba(13, 110, 253, 0.15), 0 10px 10px -5px rgba(13, 110, 253, 0.08)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                            transform: selectedPlan === 'basic' ? 'translateY(-6px)' : 'none',
                          }}
                        >
                          <div className="fw-800 small uppercase mb-2 tracking-wider" style={{ fontSize: '0.75rem', color: '#0d6efd' }}>BASIC STARTER</div>
                          <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', fontSize: '1.25rem', color: '#0d6efd', background: 'rgba(13, 110, 253, 0.1)' }}>
                            <i className="bi bi-rocket-takeoff-fill"></i>
                          </div>
                          <h2 className="fw-900 mt-1 mb-0" style={{ color: '#0a2540', fontSize: '2rem' }}>₹100</h2>
                          <div className="small text-muted font-monospace mt-1">+ 5% GST (₹5)</div>
                          <hr className="my-3 opacity-10" />
                          <div className="d-flex flex-column align-items-center gap-2">
                            <div className="badge text-white fw-800 rounded-pill px-3 py-2" style={{ fontSize: '0.82rem', letterSpacing: '0.03em', background: '#0d6efd' }}>
                              +90 Points
                            </div>
                            <span className="small text-muted fw-600"><i className="bi bi-check2-circle me-1" style={{ color: '#0d6efd' }}></i>Accept 9 Jobs</span>
                          </div>
                        </div>
                      </div>

                      {/* Standard Plan (Popular) */}
                      <div className="col-md-4">
                        <div 
                          className="card rounded-24 p-4 text-center h-100 cursor-pointer position-relative animate-scale-up"
                          onClick={() => setSelectedPlan('standard')}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: selectedPlan === 'standard' ? '2.5px solid #f5a623' : '1.5px solid #e8edf5',
                            background: selectedPlan === 'standard' ? 'linear-gradient(135deg, rgba(245, 166, 35, 0.04), #ffffff)' : '#ffffff',
                            boxShadow: selectedPlan === 'standard' ? '0 25px 30px -5px rgba(245, 166, 35, 0.2), 0 12px 12px -5px rgba(245, 166, 35, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                            transform: selectedPlan === 'standard' ? 'translateY(-6px)' : 'none',
                          }}
                        >
                          <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill fw-800 px-3 py-2 text-dark shadow-sm" style={{ fontSize: '0.72rem', background: '#f5a623', letterSpacing: '0.05em', top: '-2px' }}>MOST POPULAR</span>
                          <div className="fw-800 small uppercase mb-2 tracking-wider" style={{ fontSize: '0.75rem', color: '#f5a623' }}>STANDARD GROW</div>
                          <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', fontSize: '1.25rem', color: '#f5a623', background: 'rgba(245, 166, 35, 0.1)' }}>
                            <i className="bi bi-shield-fill-check"></i>
                          </div>
                          <h2 className="fw-900 mt-1 mb-0" style={{ color: '#0a2540', fontSize: '2rem' }}>₹200</h2>
                          <div className="small text-muted font-monospace mt-1">+ 5% GST (₹10)</div>
                          <hr className="my-3 opacity-10" />
                          <div className="d-flex flex-column align-items-center gap-2">
                            <div className="badge text-dark fw-800 rounded-pill px-3 py-2" style={{ fontSize: '0.82rem', letterSpacing: '0.03em', background: '#f5a623' }}>
                              +190 Points
                            </div>
                            <span className="small text-muted fw-600"><i className="bi bi-check2-circle me-1" style={{ color: '#f5a623' }}></i>Accept 19 Jobs</span>
                          </div>
                        </div>
                      </div>

                      {/* Premium Plan */}
                      <div className="col-md-4">
                        <div 
                          className="card rounded-24 p-4 text-center h-100 cursor-pointer position-relative animate-scale-up"
                          onClick={() => setSelectedPlan('premium')}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: selectedPlan === 'premium' ? '2.5px solid #0a2540' : '1.5px solid #e8edf5',
                            background: selectedPlan === 'premium' ? 'linear-gradient(135deg, rgba(10, 37, 64, 0.04), #ffffff)' : '#ffffff',
                            boxShadow: selectedPlan === 'premium' ? '0 20px 25px -5px rgba(10, 37, 64, 0.15), 0 10px 10px -5px rgba(10, 37, 64, 0.08)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                            transform: selectedPlan === 'premium' ? 'translateY(-6px)' : 'none',
                          }}
                        >
                          <div className="fw-800 small uppercase mb-2 tracking-wider" style={{ fontSize: '0.75rem', color: '#0a2540' }}>PREMIUM ELITE</div>
                          <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', fontSize: '1.25rem', color: '#0a2540', background: 'rgba(10, 37, 64, 0.1)' }}>
                            <i className="bi bi-crown-fill"></i>
                          </div>
                          <h2 className="fw-900 mt-1 mb-0" style={{ color: '#0a2540', fontSize: '2rem' }}>₹500</h2>
                          <div className="small text-muted font-monospace mt-1">+ 5% GST (₹25)</div>
                          <hr className="my-3 opacity-10" />
                          <div className="d-flex flex-column align-items-center gap-2">
                            <div className="badge text-white fw-800 rounded-pill px-3 py-2" style={{ fontSize: '0.82rem', letterSpacing: '0.03em', background: '#0a2540' }}>
                              +460 Points
                            </div>
                            <span className="small text-muted fw-600"><i className="bi bi-check2-circle me-1" style={{ color: '#0a2540' }}></i>Accept 46 Jobs</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secure Card input fields directly inside checkout */}
                    {showCardForm && (
                      <div className="card border-0 p-4 mb-4 animate-scale-up text-white animate-notification-toast" style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                        borderRadius: '20px'
                      }}>
                        <div className="d-flex align-items-center justify-content-between mb-4">
                          <h6 className="fw-900 text-white m-0 d-flex align-items-center gap-2" style={{ fontSize: '1.05rem' }}>
                            <i className="bi bi-credit-card-2-front-fill text-warning"></i>
                            Stripe Elements Card Gateway
                          </h6>
                          <div className="d-flex gap-1.5 align-items-center bg-white bg-opacity-10 px-2.5 py-1.5 rounded-pill" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-shield-fill-check text-success"></i>
                            <span className="text-white-50">Secure Test Sandbox</span>
                          </div>
                        </div>

                        {/* Cardholder Name */}
                        <div className="mb-3">
                          <label className="form-label small fw-700 text-white-50">Cardholder Name</label>
                          <div className="input-group">
                            <span className="input-group-text bg-white bg-opacity-5 border-white border-opacity-10 text-white-50" style={{ borderRadius: '12px 0 0 12px' }}>
                              <i className="bi bi-person-fill"></i>
                            </span>
                            <input 
                              type="text" 
                              className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-white" 
                              style={{ borderRadius: '0 12px 12px 0', borderLeft: 'none', fontSize: '0.95rem' }}
                              placeholder="Enter name on card" 
                              value={cardName} 
                              onChange={(e) => setCardName(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        {/* Card Number */}
                        <div className="mb-3">
                          <label className="form-label small fw-700 text-white-50">Card Number</label>
                          <div className="input-group">
                            <span className="input-group-text bg-white bg-opacity-5 border-white border-opacity-10 text-white-50" style={{ borderRadius: '12px 0 0 12px' }}>
                              <i className="bi bi-credit-card-fill"></i>
                            </span>
                            <input 
                              type="text" 
                              className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-white font-monospace" 
                              style={{ borderRadius: '0 12px 12px 0', borderLeft: 'none', letterSpacing: '2px', fontSize: '0.95rem' }}
                              placeholder="4242 4242 4242 4242" 
                              value={cardNumber} 
                              onChange={handleCardNumberChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col-6">
                            <label className="form-label small fw-700 text-white-50">Expiration Date</label>
                            <input 
                              type="text" 
                              className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-white font-monospace text-center" 
                              style={{ borderRadius: '12px', fontSize: '0.95rem' }}
                              placeholder="MM / YY" 
                              value={cardExpiry} 
                              onChange={handleCardExpiryChange}
                              required
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-700 text-white-50">CVC / CVV</label>
                            <input 
                              type="password" 
                              className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-white font-monospace text-center" 
                              style={{ borderRadius: '12px', fontSize: '0.95rem' }}
                              placeholder="•••" 
                              value={cardCvc} 
                              onChange={handleCardCvcChange}
                              required
                            />
                          </div>
                        </div>

                        {cardError && (
                          <div className="alert alert-danger py-2.5 px-3 rounded-12 border-0 small fw-700 mb-0 d-flex align-items-center gap-1.5" style={{ background: 'rgba(220, 53, 69, 0.15)', color: '#ea868f' }}>
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            {cardError}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Receipt Breakdown & Simulate Payment */}
                    <div className="p-4 rounded-24 border mb-4" style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.02)'
                    }}>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="bg-white p-2 rounded-10 border shadow-sm d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '1rem', color: '#64748b' }}>
                          <i className="bi bi-receipt"></i>
                        </div>
                        <h6 className="fw-800 m-0" style={{ color: '#0a2540', fontSize: '1.05rem' }}>Order Invoice Breakdown</h6>
                      </div>

                      <div className="d-flex justify-content-between py-2 border-bottom border-dashed text-muted" style={{ fontSize: '0.88rem' }}>
                        <span>Plan Subscription:</span>
                        <strong className="text-dark fw-700">{selectedPlan.toUpperCase()} Premium</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-dashed text-muted" style={{ fontSize: '0.88rem' }}>
                        <span>Points Pack Added:</span>
                        <strong className="text-dark fw-700">+{selectedPlan === 'basic' ? '90' : selectedPlan === 'standard' ? '190' : '460'} PTS</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-dashed text-muted" style={{ fontSize: '0.88rem' }}>
                        <span>Subtotal Net Price:</span>
                        <strong className="text-dark fw-700">₹{selectedPlan === 'basic' ? '100' : selectedPlan === 'standard' ? '200' : '500'}.00</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-dashed text-muted" style={{ fontSize: '0.88rem' }}>
                        <span>Government GST (5%):</span>
                        <strong className="text-dark fw-700">₹{selectedPlan === 'basic' ? '5' : selectedPlan === 'standard' ? '10' : '25'}.00</strong>
                      </div>
                      <div className="d-flex justify-content-between pt-3 text-dark">
                        <span className="fw-900" style={{ fontSize: '1.05rem' }}>Total Payable Amount:</span>
                        <strong className="fw-900" style={{ fontSize: '1.35rem', letterSpacing: '-0.02em', color: '#0a2540' }}>
                          ₹{selectedPlan === 'basic' ? '105' : selectedPlan === 'standard' ? '210' : '525'}.00
                        </strong>
                      </div>
                    </div>

                    <div className="d-flex gap-3">
                      <button
                        type="button"
                        className="btn btn-outline-secondary flex-fill rounded-16 py-3 fw-bold transition-all"
                        onClick={() => {
                          if (showCardForm) {
                            setShowCardForm(false);
                            setCardError('');
                          } else {
                            setShowSubscriptionModal(false);
                          }
                        }}
                        disabled={isSubscribing}
                        style={{ fontSize: '0.95rem', borderRadius: '16px' }}
                      >
                        {showCardForm ? 'Back to Plans' : 'Cancel Transaction'}
                      </button>
                      <button
                        type="button"
                        className="btn flex-fill rounded-16 py-3 fw-bold transition-all border-0"
                        style={{ 
                          fontSize: '0.95rem', 
                          borderRadius: '16px',
                          background: selectedPlan === 'basic' 
                            ? 'linear-gradient(135deg, #0d6efd, #0b5ed7)' 
                            : selectedPlan === 'standard'
                              ? 'linear-gradient(135deg, #f5a623, #e09410)'
                              : 'linear-gradient(135deg, #0a2540, #1a3a5c)',
                          color: selectedPlan === 'standard' ? '#0a2540' : '#ffffff',
                          fontWeight: '800',
                          boxShadow: selectedPlan === 'basic'
                            ? '0 10px 15px -3px rgba(13, 110, 253, 0.3)'
                            : selectedPlan === 'standard'
                              ? '0 10px 15px -3px rgba(245, 166, 35, 0.3)'
                              : '0 10px 15px -3px rgba(10, 37, 64, 0.3)',
                        }}
                        onClick={handlePurchaseSubscription}
                        disabled={isSubscribing}
                      >
                        {isSubscribing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Authorizing Security...
                          </>
                        ) : showCardForm ? (
                          <>
                            <i className="bi bi-shield-lock-fill me-2" style={{ opacity: 0.8 }}></i> Confirm & Pay ₹{selectedPlan === 'basic' ? '105' : selectedPlan === 'standard' ? '210' : '525'}.00
                          </>
                        ) : (
                          <>
                            Proceed to Checkout <i className="bi bi-arrow-right-short ms-1" style={{ fontSize: '1.2rem' }}></i>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkerDashboard;

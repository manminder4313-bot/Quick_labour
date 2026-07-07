import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import ChatWidget from '../components/ChatWidget';

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const CountdownTimer = ({ job }) => {
  const [timeLeft, setTimeLeft] = useState('15:00');

  useEffect(() => {
    const storageKey = `job_accept_time_${job._id}`;
    let startTimeStr = localStorage.getItem(storageKey);
    
    if (!startTimeStr) {
      const initialTime = job.updatedAt ? new Date(job.updatedAt).getTime() : Date.now();
      startTimeStr = initialTime.toString();
      localStorage.setItem(storageKey, startTimeStr);
    }

    const startTimestamp = parseInt(startTimeStr, 10);

    const updateTimer = () => {
      const now = Date.now();
      const elapsedMs = now - startTimestamp;
      const totalMs = 15 * 60 * 1000;
      const remainingMs = totalMs - elapsedMs;

      if (remainingMs <= 0) {
        setTimeLeft('00:00');
        
        // Trigger travel timeout API call if not already done
        const timeoutKey = `job_timeout_triggered_${job._id}`;
        if (!localStorage.getItem(timeoutKey)) {
          localStorage.setItem(timeoutKey, 'true');
          api.post(`/jobs/${job._id}/travel-timeout`)
            .then(res => {
              console.log('Travel timeout policy updated:', res);
              if (res.penaltyResult) {
                alert(res.message || 'Travel confirmation timer expired. Worker Conduct Policy penalty applied.');
                window.location.reload();
              }
            })
            .catch(err => {
              console.error('Error triggering travel timeout:', err);
            });
        }
        return;
      }

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      
      const pad = (num) => num.toString().padStart(2, '0');
      setTimeLeft(`${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [job]);

  return <strong>{timeLeft}</strong>;
};

const WorkerDashboard = () => {
  const getTokensCost = (money) => {
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
  const [dbTransactions, setDbTransactions] = useState([]);
  const [isOnline, setIsOnline] = useState(sessionStorage.getItem('userOnlineStatus') === 'true');
  const [completedCount, setCompletedCount] = useState(() => {
    const val = sessionStorage.getItem('userJobsCompleted');
    if (val !== null) return Number(val);
    const email = sessionStorage.getItem('userEmail');
    return email === 'worker@quicklabour.com' ? 18 : 0;
  });
  const [workerRating, setWorkerRating] = useState(() => {
    const val = sessionStorage.getItem('userRating');
    if (val !== null) return val;
    const email = sessionStorage.getItem('userEmail');
    return email === 'worker@quicklabour.com' ? '4.9' : '0.0';
  });
  const [actionAlert, setActionAlert] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'invitations', or 'past'

  // Subscriptions & Tokens states
  const [workerTokens, setWorkerTokens] = useState(Number(sessionStorage.getItem('userTokens')) || 0);
  const [acceptedJobs, setAcceptedJobs] = useState(Number(sessionStorage.getItem('userAcceptedJobs')) || 0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(Number(sessionStorage.getItem('userWalletBalance') || 0));
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [policyViolations, setPolicyViolations] = useState(0);

  // Unified Wallet Hub Modal States
  const [showWalletHubModal, setShowWalletHubModal] = useState(false);
  const [activeWalletTab, setActiveWalletTab] = useState('scanner'); // 'scanner', 'add', 'withdraw', 'history'

  const [walletAmount, setWalletAmount] = useState('');
  const [walletMethod, setWalletMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [netBank, setNetBank] = useState('');
  const [netBankHolderName, setNetBankHolderName] = useState('');
  const [netBankCustomerId, setNetBankCustomerId] = useState('');
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [isPayingWithWallet, setIsPayingWithWallet] = useState(false);

  // Withdraw Form States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('SBI');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiWithdrawId, setUpiWithdrawId] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank'); // 'bank', 'upi'
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawOtp, setShowWithdrawOtp] = useState(false);
  const [withdrawOtp, setWithdrawOtp] = useState('');
  const [withdrawOtpNotification, setWithdrawOtpNotification] = useState('');
  const [classyAlert, setClassyAlert] = useState({ show: false, title: '', message: '', type: 'error' });
  const showClassyAlert = (message, title = 'Alert', type = 'danger') => {
    setClassyAlert({ show: true, title, message, type });
  };
  const [selectedPlan, setSelectedPlan] = useState('basic'); // 'basic', 'standard', 'premium'
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [subPaymentMethod, setSubPaymentMethod] = useState('card'); // 'card', 'wallet'
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [showCvc, setShowCvc] = useState(false);
  const [cardName, setCardName] = useState(sessionStorage.getItem('userName') || '');
  const [cardError, setCardError] = useState('');

  // Profile reactive states
  const initialName = sessionStorage.getItem('userName') || 'Ramesh Kumar';
  const [profileName, setProfileName] = useState(initialName);
  const [profilePhone, setProfilePhone] = useState(sessionStorage.getItem('userPhone') || '+91 99887 76655');
  const [profileAddress, setProfileAddress] = useState(sessionStorage.getItem('userAddress') || 'Bandra, Mumbai');
  const [profileAvatar, setProfileAvatar] = useState(() => {
    const stored = sessionStorage.getItem('userAvatar');
    if (!stored || stored.includes('images.unsplash.com/photo-1506794778202-cad84cf45f1d') || stored.includes('images.unsplash.com/photo-1534528741775-53994a69daeb')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initialName)}&background=random&color=fff&size=150`;
    }
    return stored;
  });
  const [profileOccupation, setProfileOccupation] = useState(sessionStorage.getItem('userOccupation') || 'Professional Plumber');
  const [workerLat, setWorkerLat] = useState(Number(sessionStorage.getItem('userLatitude')) || null);
  const [workerLng, setWorkerLng] = useState(Number(sessionStorage.getItem('userLongitude')) || null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapJob, setMapJob] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);
  const prevAvailableIds = useRef([]);
  const isFetchingRef = useRef(false);
  const localVersionRef = useRef(0);

  // Safety & Dispute features states
  const [jobSubStatuses, setJobSubStatuses] = useState(
    JSON.parse(localStorage.getItem('jobSubStatuses') || '{}')
  );
  const [disputes, setDisputes] = useState([]);
  const [noShowJob, setNoShowJob] = useState(null);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [selfieProof, setSelfieProof] = useState('');
  const [noShowCallLog, setNoShowCallLog] = useState('');
  const [gpsProof, setGpsProof] = useState('');
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosAlertTriggered, setSosAlertTriggered] = useState(false);
  const [sosJobId, setSosJobId] = useState('');
  const [sosEmergencyType, setSosEmergencyType] = useState('Physical Danger/Threat');
  const [sosCustomDescription, setSosCustomDescription] = useState('');
  const [claimRefund, setClaimRefund] = useState(false);
  const [mySosAlerts, setMySosAlerts] = useState([]);
  const [visibleSosAlerts, setVisibleSosAlerts] = useState([]);

  const handleDismissSosAlert = (alertId) => {
    setVisibleSosAlerts(prev => prev.filter(a => a._id !== alertId));
    const seenAlerts = JSON.parse(localStorage.getItem('quicklabour_seen_sos_alerts') || '[]');
    if (!seenAlerts.includes(alertId)) {
      localStorage.setItem('quicklabour_seen_sos_alerts', JSON.stringify([...seenAlerts, alertId]));
    }
  };
  const [showWorkerDisputeModal, setShowWorkerDisputeModal] = useState(false);
  const [disputeJob, setDisputeJob] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePhoto, setDisputePhoto] = useState('');
  const [disputeCallLog, setDisputeCallLog] = useState('');

  const updateJobSubStatus = async (jobId, subStatus) => {
    try {
      let lat = workerLat;
      let lng = workerLng;

      // Try to get latest geolocation coordinates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            setWorkerLat(currentLat);
            setWorkerLng(currentLng);
            await api.updateJobTracking(jobId, { latitude: currentLat, longitude: currentLng, subStatus });
          },
          async (error) => {
            console.warn('Geolocation error:', error);
            await api.updateJobTracking(jobId, { latitude: lat, longitude: lng, subStatus });
          }
        );
      } else {
        await api.updateJobTracking(jobId, { latitude: lat, longitude: lng, subStatus });
      }

      const updated = { ...jobSubStatuses, [jobId]: subStatus };
      setJobSubStatuses(updated);
      localStorage.setItem('jobSubStatuses', JSON.stringify(updated));
      setActionAlert(`🟢 Job status updated to: ${subStatus}`);
    } catch (err) {
      console.error('Error updating job tracking status:', err);
    }
  };

  // High-frequency location polling for active job in "On the Way" status
  useEffect(() => {
    const activeTrackingJobs = hiredJobs.filter(job => jobSubStatuses[job._id] === 'On the Way');
    if (activeTrackingJobs.length === 0) return;

    const intervalId = setInterval(() => {
      activeTrackingJobs.forEach(job => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const currentLat = position.coords.latitude;
              const currentLng = position.coords.longitude;
              setWorkerLat(currentLat);
              setWorkerLng(currentLng);
              api.updateJobTracking(job._id, { latitude: currentLat, longitude: currentLng })
                .catch(err => console.error('Error sending live coordinates:', err));
            },
            (error) => {
              console.warn('Geolocation error during live tracking:', error);
            }
          );
        }
      });
    }, 8000); // Poll and stream coordinates every 8 seconds

    return () => clearInterval(intervalId);
  }, [hiredJobs, jobSubStatuses]);

  const handleOpenNoShowModal = (job) => {
    setNoShowJob(job);
    setSelfieProof('');
    setNoShowCallLog('');
    setGpsProof('');
    setShowNoShowModal(true);
  };

  const handleSubmitNoShowClaim = async () => {
    if (!selfieProof) {
      alert("Please upload a Selfie Proof to confirm your presence at the location.");
      return;
    }
    if (!noShowCallLog) {
      alert("Please upload a Call Log Screenshot to confirm you tried to call the client.");
      return;
    }

    try {
      const disputeData = {
        jobId: noShowJob._id,
        jobTitle: noShowJob.title || 'General Labour Task',
        clientName: noShowJob.client?.fullName || 'Client',
        workerName: sessionStorage.getItem('userName') || 'Worker',
        submittedBy: 'worker',
        reason: 'Client No-Show: Client was not present at the job location and did not answer calls.',
        photo: selfieProof,
        callLog: noShowCallLog,
        gpsLocation: `Lat: ${workerLat || '19.0760'}° N, Lng: ${workerLng || '72.8777'}° E`
      };

      const newDispute = await api.submitDispute(disputeData);
      setDisputes(prev => [newDispute, ...prev]);

      // Update local job status to Disputed
      setHiredJobs(prev => prev.map(j => j._id === noShowJob._id ? { ...j, status: 'Disputed' } : j));

      setActionAlert("✅ Client No-Show dispute submitted successfully! Admin will verify proofs and resolve it.");
      setShowNoShowModal(false);
      setNoShowJob(null);
    } catch (err) {
      alert("❌ Failed to submit dispute: " + err.message);
    }
  };

  const fetchMySosAlerts = async () => {
    try {
      const data = await api.getMySos();
      setMySosAlerts(data);
    } catch (err) {
      console.error('Error fetching SOS alerts:', err);
    }
  };

  const fetchDisputes = async () => {
    try {
      const data = await api.getDisputes();
      setDisputes(data);
    } catch (err) {
      console.error('Error fetching disputes:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const data = await api.getWalletTransactions();
      setDbTransactions(data || []);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
      setDbTransactions(getTransactions());
    }
  };

  const handleTriggerSOS = async () => {
    const targetJobId = sosJobId || (activeHiredJobs[0] ? activeHiredJobs[0]._id : null);
    if (!targetJobId) {
      alert("❌ You don't have any active jobs to trigger SOS for.");
      return;
    }
    
    setSosAlertTriggered(true);
    try {
      await api.triggerSos(targetJobId, `${sosEmergencyType}: ${sosCustomDescription}`, workerLat, workerLng, claimRefund);
      setTimeout(() => {
        setShowSosModal(false);
        setSosAlertTriggered(false);
        setSosCustomDescription('');
        setClaimRefund(false);
        alert("🚨 SOS Alert sent successfully to Emergency Contacts & QuickLabour Safety desk. The request has been transferred.");
        fetchJobs();
        fetchMySosAlerts();
      }, 2000);
    } catch (err) {
      setSosAlertTriggered(false);
      alert("❌ Failed to trigger SOS: " + err.message);
    }
  };

  const handleOpenWorkerDispute = (job) => {
    setDisputeJob(job);
    setDisputeReason('');
    setDisputePhoto('');
    setDisputeCallLog('');
    setShowWorkerDisputeModal(true);
  };

  const handleSubmitWorkerDispute = async () => {
    if (!disputeReason) {
      alert("Please provide the reason for your dispute.");
      return;
    }
    try {
      const disputeData = {
        jobId: disputeJob._id,
        jobTitle: disputeJob.title,
        clientName: disputeJob.client?.fullName || 'Client',
        workerName: profileName,
        submittedBy: 'worker',
        reason: disputeReason,
        photo: disputePhoto || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=150&q=80',
        callLog: disputeCallLog || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=150&q=80',
        gpsLocation: `${workerLat || '19.0760'}° N, ${workerLng || '72.8777'}° E`,
      };

      const newDispute = await api.submitDispute(disputeData);
      setDisputes(prev => [newDispute, ...prev]);
      
      // Decrease worker trust score slightly for filing dispute
      const currentScore = Number(localStorage.getItem('quicklabour_worker_trust_score') || 95);
      localStorage.setItem('quicklabour_worker_trust_score', Math.max(70, currentScore - 2));

      setShowWorkerDisputeModal(false);
      alert("⚖️ Dispute registered successfully! QuickLabour Support will review photo evidence, GPS location, and call logs.");
    } catch (err) {
      alert("❌ Failed to submit dispute: " + err.message);
    }
  };

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
      
      // Sync with sessionStorage so header updates in real-time
      sessionStorage.setItem('userName', res.fullName);
      sessionStorage.setItem('userPhone', res.phone);
      sessionStorage.setItem('userAddress', res.address);
      sessionStorage.setItem('userAvatar', res.avatar);
      sessionStorage.setItem('userOccupation', res.occupation);
      
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

  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d.toFixed(2);
  };

  const handleOpenMap = (job) => {
    setMapJob(job);
    setShowMapModal(true);
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const playTone = (freq, startOffset, duration, volume) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startOffset);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.setValueAtTime(volume, now + startOffset);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration);
      };
      playTone(784, 0, 0.4, 0.15);      // G5
      playTone(1046.5, 0.08, 0.4, 0.15); // C6
      playTone(1318.5, 0.16, 0.5, 0.15); // E6
    } catch (err) {
      console.warn("Failed to play synthesized notification chime:", err);
    }
  };

  const fetchJobs = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const data = await api.getJobs();
      const sortedHired = [...(data.hiredJobs || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const sortedAvailable = [...(data.availableJobs || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Find new job invitations not currently in our tracking reference
      const newJobs = sortedAvailable.filter(
        job => !prevAvailableIds.current.includes(job._id)
      );
      if (newJobs.length > 0 && isOnline) {
        playChime();
        
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
      await fetchMySosAlerts();
      await fetchDisputes();
      await fetchTransactions();
    } catch (error) {
      console.error('Error fetching jobs:', error.message);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    let timerId;
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;
      try {
        const { version } = await api.getJobsStateVersion();
        if (version !== localVersionRef.current) {
          localVersionRef.current = version;
          await fetchJobs();
        }
      } catch (err) {
        console.error("Failed to check state version:", err);
      }
      if (isActive) {
        timerId = setTimeout(poll, 4000); // Check version every 4 seconds
      }
    };

    poll();

    return () => {
      isActive = false;
      clearTimeout(timerId);
    };
  }, [isOnline]);

  useEffect(() => {
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
      setWorkerTokens(user.tokens !== undefined ? user.tokens : 0);
      setAcceptedJobs(user.acceptedJobsCount !== undefined ? user.acceptedJobsCount : 0);
      if (user.walletBalance !== undefined) {
        setWalletBalance(user.walletBalance);
        sessionStorage.setItem('userWalletBalance', user.walletBalance);
      }
      const fetchedWarnings = user.warnings || [];
      setWarnings(fetchedWarnings);
      setPolicyViolations(user.policyViolations || 0);

      // Show policy warnings only once for 10 seconds
      const hasSeen = sessionStorage.getItem('seen_warnings_policy');
      if (fetchedWarnings.length > 0 && !hasSeen) {
        setShowWarnings(true);
        sessionStorage.setItem('seen_warnings_policy', 'true');
        setTimeout(() => {
          setShowWarnings(false);
        }, 10000);
      }

      if (user.fullName) sessionStorage.setItem('userName', user.fullName);
      if (user.phone) sessionStorage.setItem('userPhone', user.phone);
      if (user.address) sessionStorage.setItem('userAddress', user.address);
      if (user.avatar) sessionStorage.setItem('userAvatar', user.avatar);
      if (user.occupation) sessionStorage.setItem('userOccupation', user.occupation);
      sessionStorage.setItem('userJobsCompleted', user.jobsCompleted);
      sessionStorage.setItem('userRating', user.rating !== undefined ? user.rating : '4.9');
      sessionStorage.setItem('userTokens', user.tokens !== undefined ? user.tokens : 0);
      sessionStorage.setItem('userAcceptedJobs', user.acceptedJobsCount !== undefined ? user.acceptedJobsCount : 0);
      fetchMySosAlerts();
      fetchDisputes();
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (mySosAlerts && mySosAlerts.length > 0) {
      const seenAlerts = JSON.parse(localStorage.getItem('quicklabour_seen_sos_alerts') || '[]');
      const unseen = mySosAlerts.filter(alert => !seenAlerts.includes(alert._id));
      
      if (unseen.length > 0) {
        setVisibleSosAlerts(unseen);
        
        const timer = setTimeout(() => {
          setVisibleSosAlerts([]);
        }, 10000);
        
        const newSeenList = [...seenAlerts, ...unseen.map(a => a._id)];
        localStorage.setItem('quicklabour_seen_sos_alerts', JSON.stringify(newSeenList));
        
        return () => clearTimeout(timer);
      } else {
        setVisibleSosAlerts([]);
      }
    } else {
      setVisibleSosAlerts([]);
    }
  }, [mySosAlerts]);

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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = Jan, 5 = June
  const isDemoMonth = (currentYear === 2026 && currentMonth === 5);

  const completedHiredJobs = hiredJobs.filter(j => j.status === 'Completed');
  
  // Only include actual jobs completed in the current calendar month
  const completedThisMonth = hiredJobs.filter(j => {
    if (j.status !== 'Completed') return false;
    const date = new Date(j.updatedAt || j.createdAt);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  });

  const actualEarnings = completedThisMonth.reduce((sum, job) => sum + (job.money || 0), 0);
  const baseMockEarnings = isDemoMonth
    ? ((completedCount > completedHiredJobs.length) ? (completedCount - completedHiredJobs.length) * 880 : 0)
    : 0;
  const totalEarnings = baseMockEarnings + actualEarnings;

  const displayRating = (sessionStorage.getItem('userEmail') === 'worker@quicklabour.com' || completedCount > 0) ? workerRating : '0.0';

  // Calculate dynamic stats
  const stats = {
    completedJobs: completedCount,
    monthlyEarnings: `₹${totalEarnings.toLocaleString('en-IN')}`,
    activeJobsToday: hiredJobs.filter(j => j.status === 'Accepted').length,
    rating: displayRating
  };

  const handleAcceptJob = async (id, clientName, money) => {
    const tokensCost = getTokensCost(money);
    if (workerTokens < tokensCost) {
      setActionAlert(`⚠️ This job requires ${tokensCost} tokens, but you only have ${workerTokens} tokens. Please purchase a subscription plan.`);
      setShowSubscriptionModal(true);
      return;
    }
    try {
      await api.updateJobStatus(id, 'Accepted');
      setActionAlert(`✅ Accepted job invitation from ${clientName}! Check your phone for details.`);
      
      // Refresh profile to get updated tokens and accepted jobs count
      const updatedProfile = await api.getProfile();
      setWorkerTokens(updatedProfile.tokens || 0);
      setAcceptedJobs(updatedProfile.acceptedJobsCount || 0);
      
      fetchJobs(); // Reload jobs from database
      setTimeout(() => setActionAlert(''), 5000);
    } catch (error) {
      if (error.message.includes('INSUFFICIENT_TOKENS')) {
        setActionAlert('⚠️ Insufficient tokens! Please purchase a subscription to accept more jobs.');
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

  const getTransactions = () => {
    const userId = sessionStorage.getItem('userId') || 'default';
    const key = `quicklabour_transactions_${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) {
      const initialTxs = [
        {
          id: 'TXN-BONUS',
          date: new Date(Date.now() - 3600000).toLocaleString(),
          type: 'Sign-up Bonus',
          amount: 50,
          isCredit: true,
          status: 'Success'
        }
      ];
      localStorage.setItem(key, JSON.stringify(initialTxs));
      return initialTxs;
    }
    return JSON.parse(stored);
  };

  const addTransaction = (type, amount, isCredit, status = 'Success') => {
    const userId = sessionStorage.getItem('userId') || 'default';
    const key = `quicklabour_transactions_${userId}`;
    const txs = getTransactions();
    const newTx = {
      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      type,
      amount,
      isCredit,
      status,
      date: new Date().toLocaleString()
    };
    txs.unshift(newTx);
    localStorage.setItem(key, JSON.stringify(txs));
    fetchTransactions();
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
      showClassyAlert("Please enter a valid amount.", "Invalid Input");
      return;
    }
    const amt = Number(withdrawAmount);
    if (walletBalance - amt < 50) {
      showClassyAlert("Insufficient wallet balance. A minimum balance of ₹50 must be maintained in your wallet after withdrawal.", "Insufficient Balance");
      return;
    }

    if (!showWithdrawOtp) {
      setIsWithdrawing(true);
      try {
        const res = await api.requestWithdrawalOtp(amt);
        setShowWithdrawOtp(true);
        setWithdrawOtp('');
        setWithdrawOtpNotification(`📱 SMS Received on ${sessionStorage.getItem('userPhone') || 'registered phone number'}: Your withdrawal verification OTP is: ${res.otp}`);
        setActionAlert(`📱 A 4-digit verification code has been sent to your phone number.`);
        setTimeout(() => setActionAlert(''), 5000);
      } catch (err) {
        showClassyAlert("Failed to send verification OTP: " + err.message, "OTP Error");
      } finally {
        setIsWithdrawing(false);
      }
      return;
    }

    if (!withdrawOtp || withdrawOtp.length < 4) {
      showClassyAlert("Please enter the 4-digit verification OTP.", "Verification Required");
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await api.withdrawWalletMoney(amt, withdrawOtp);
      setWalletBalance(res.walletBalance);
      sessionStorage.setItem('userWalletBalance', res.walletBalance);

      addTransaction(`Withdrawal (${withdrawMethod.toUpperCase()})`, amt, false);

      setActionAlert(`💸 Withdrawal of ₹${amt} processed and transferred successfully!`);
      setWithdrawAmount('');
      setWithdrawOtp('');
      setShowWithdrawOtp(false);
      setWithdrawOtpNotification('');
      setTimeout(() => setActionAlert(''), 6000);
    } catch (err) {
      showClassyAlert("Withdrawal verification failed: " + err.message, "Verification Failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAddMoneySubmit = async (e) => {
    e.preventDefault();
    if (!walletAmount || isNaN(walletAmount) || Number(walletAmount) <= 0) {
      showClassyAlert("Please enter a valid amount.", "Invalid Input");
      return;
    }
    setIsAddingMoney(true);
    try {
      const res = await api.addWalletMoney(Number(walletAmount), walletMethod);
      setWalletBalance(res.walletBalance);
      sessionStorage.setItem('userWalletBalance', res.walletBalance);
      
      addTransaction('Wallet Deposit', Number(walletAmount), true);

      setActionAlert(`🎉 Successfully recharged ₹${walletAmount} to your wallet!`);
      setShowAddWalletModal(false);
      setWalletAmount('');
      setTimeout(() => setActionAlert(''), 6000);
    } catch (err) {
      showClassyAlert("Failed to add money: " + err.message, "Deposit Failed");
    } finally {
      setIsAddingMoney(false);
    }
  };

  const handleRechargeTokensWithWallet = async (planType) => {
    setIsPayingWithWallet(true);
    try {
      const res = await api.rechargeTokensWallet(planType);
      setWorkerTokens(res.updatedTokens || 0);
      setWalletBalance(res.walletBalance || 0);
      setPaymentSuccess(true);
      setActionAlert(`🎉 Successfully recharged tokens using wallet balance! Added ${res.tokensAdded} tokens.`);
      
      // Log transaction to admin wallet history in localStorage
      try {
        const adminTxs = JSON.parse(localStorage.getItem('quicklabour_transactions_admin') || '[]');
        const cost = planType === 'basic' ? 99 : planType === 'standard' ? 199 : 499;
        adminTxs.unshift({
          id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
          type: `Tokens Subscription (Wallet - ${planType.toUpperCase()})`,
          amount: cost,
          isCredit: true,
          status: 'Success',
          date: new Date().toLocaleString(),
          workerName: profileName || 'Worker'
        });
        localStorage.setItem('quicklabour_transactions_admin', JSON.stringify(adminTxs));
      } catch (err) {
        console.warn('Failed to log admin transaction:', err);
      }

      setTimeout(() => {
        setPaymentSuccess(false);
        setShowSubscriptionModal(false);
        setActionAlert('');
      }, 3500);
    } catch (err) {
      showClassyAlert("Recharge failed: " + err.message, "Recharge Failed");
    } finally {
      setIsPayingWithWallet(false);
    }
  };

  const handlePurchaseSubscription = async (e) => {
    if (e) e.preventDefault();
    
    // Step 1: Transition view to card entries if not visible yet
    if (!showCardForm) {
      setShowCardForm(true);
      setCardError('');
      return;
    }

    if (subPaymentMethod === 'wallet') {
      const cost = selectedPlan === 'basic' ? 99 : selectedPlan === 'standard' ? 199 : 499;
      if (walletBalance < cost) {
        setCardError(`❌ Insufficient wallet balance (Available: ₹${Number(walletBalance).toFixed(2)}).`);
        return;
      }
      setCardError('');
      await handleRechargeTokensWithWallet(selectedPlan);
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

      // 2. Validate and claim tokens credits on the database
      const verifyRes = await api.verifyPaymentAndCredit(intentRes.intentId, selectedPlan, intentRes.isSimulated);

      setWorkerTokens(verifyRes.user.tokens || 0);
      setAcceptedJobs(verifyRes.user.acceptedJobsCount || 0);
      sessionStorage.setItem('userTokens', verifyRes.user.tokens || 0);
      sessionStorage.setItem('userAcceptedJobs', verifyRes.user.acceptedJobsCount || 0);

      setPaymentSuccess(true);
      setActionAlert(`🎉 Successful! Subscribed to ${selectedPlan.toUpperCase()} plan. Added ${verifyRes.tokensAdded} tokens.`);

      // Log transaction to admin wallet history in localStorage
      try {
        const adminTxs = JSON.parse(localStorage.getItem('quicklabour_transactions_admin') || '[]');
        const cost = selectedPlan === 'basic' ? 105 : selectedPlan === 'standard' ? 210 : 525; // with GST
        adminTxs.unshift({
          id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
          type: `Tokens Subscription (Stripe - ${selectedPlan.toUpperCase()})`,
          amount: cost,
          isCredit: true,
          status: 'Success',
          date: new Date().toLocaleString(),
          workerName: profileName || 'Worker'
        });
        localStorage.setItem('quicklabour_transactions_admin', JSON.stringify(adminTxs));
      } catch (err) {
        console.warn('Failed to log admin transaction:', err);
      }

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
            WebkitBackdropFilter: 'blur(20px)',
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
                <span className="badge px-3 py-1.5 rounded-pill fw-800 d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', letterSpacing: '0.8px', background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)', color: 'var(--text-main)', textTransform: 'uppercase' }}>
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
                  🪙 {getTokensCost(activeNotification.money)} tkn
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

          {/* Policy warnings banner */}
          {showWarnings && warnings && warnings.length > 0 && (
            <div className="alert alert-danger alert-dismissible fade show rounded-24 border-danger bg-danger bg-opacity-10 text-danger-emphasis mb-4 shadow-sm py-3.5 px-4" role="alert">
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-exclamation-octagon-fill fs-5 text-danger"></i>
                <strong className="fw-800 text-danger fs-6">Worker Conduct Policy Notices ({policyViolations} Violation{policyViolations > 1 ? 's' : ''})</strong>
              </div>
              <ul className="mb-0 text-start ps-3" style={{ fontSize: '0.85rem' }}>
                {warnings.map((warn, index) => (
                  <li key={index} className="mb-1 fw-bold text-dark">{warn}</li>
                ))}
              </ul>
              <div className="mt-2.5 small fw-700 text-muted">
                ⚠️ Repeated timeouts will trigger automatic fines (₹50) and temporary account suspension (7 days).
              </div>
              <button type="button" className="btn-close" onClick={() => setShowWarnings(false)}></button>
            </div>
          )}

          {/* SOS pending/refunded alert notifications */}
          {visibleSosAlerts && visibleSosAlerts.length > 0 && (
            <div className="mb-4">
              {visibleSosAlerts.map(alert => (
                <div 
                  key={alert._id} 
                  className={`alert alert-dismissible fade show py-3.5 px-4 rounded-24 border mb-3 shadow-sm ${
                    !alert.claimRefund
                      ? 'alert-danger border-danger bg-danger bg-opacity-10 text-dark'
                      : alert.refundStatus === 'Pending' 
                      ? 'alert-warning border-warning bg-warning bg-opacity-10 text-dark' 
                      : alert.refundStatus === 'Refunded' 
                      ? 'alert-success border-success bg-success bg-opacity-10 text-dark'
                      : 'alert-secondary border-secondary bg-light text-muted'
                  }`}
                  role="alert"
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-800 fs-6">
                      {alert.claimRefund
                        ? (alert.refundStatus === 'Pending' ? '🚨 Pending 50% Token Refund' : alert.refundStatus === 'Refunded' ? '✅ SOS Refund Approved' : 'ℹ️ SOS Alert Closed')
                        : '🚨 SOS Alert Registered'
                      }
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge rounded-pill px-3 py-1 ${
                        alert.claimRefund
                          ? (alert.refundStatus === 'Pending' ? 'bg-warning text-dark' : alert.refundStatus === 'Refunded' ? 'bg-success text-white' : 'bg-secondary text-white')
                          : 'bg-danger text-white'
                      }`}>
                        {alert.claimRefund ? alert.refundStatus : 'SOS Alert'}
                      </span>
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => handleDismissSosAlert(alert._id)}
                        aria-label="Close"
                        style={{ position: 'static', padding: '0.5rem', margin: 0 }}
                      ></button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 550, paddingRight: '24px' }}>
                    Emergency SOS alert for <strong>{alert.job?.title || 'Job'}</strong> has been registered. 
                    {alert.claimRefund && alert.refundStatus === 'Pending' && ` 50% tokens refund (+${alert.refundAmount} tokens) is pending admin verification.`}
                    {alert.claimRefund && alert.refundStatus === 'Refunded' && ` 50% tokens refund of +${alert.refundAmount} tokens has been successfully credited to your account!`}
                    {alert.claimRefund && alert.refundStatus === 'No Refund' && ' Admin completed the review. Token refund is not applicable.'}
                  </div>
                </div>
              ))}
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
            <div className="col-xl-4 col-md-6 col-6">
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
            <div className="col-xl-4 col-md-6 col-6">
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
            <div className="col-xl-4 col-md-6 col-6">
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
            <div className="col-xl-4 col-md-6 col-6">
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
            <div className="col-xl-4 col-md-6 col-6">
              <div className="dashboard-stat-card cursor-pointer" onClick={() => { setActiveWalletTab('scanner'); setShowWalletHubModal(true); }} style={{ cursor: 'pointer' }}>
                <div className="stat-icon-wrapper purple">
                  <i className="bi bi-wallet-fill"></i>
                </div>
                <div>
                  <div className="stat-number">₹{Number(walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="stat-label">Wallet Balance (QR Hub)</div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-md-6 col-6">
              <div 
                className="dashboard-stat-card position-relative overflow-hidden cursor-pointer d-flex align-items-center justify-content-between gap-2" 
                onClick={() => setShowSubscriptionModal(true)} 
                style={{ 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  border: '1.5px solid rgba(245, 166, 35, 0.2)',
                  background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.05), var(--card-bg))',
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
                      {workerTokens} <span className="small text-muted fw-600" style={{ fontSize: '0.8rem' }}>TKN</span>
                    </div>
                    <div className="stat-label">Token Balance</div>
                  </div>
                </div>
                {/* Circle orange plus button representing add/adding tokens */}
                <div 
                  className="d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle shadow-sm" 
                  style={{ width: '24px', height: '24px', border: '1px solid rgba(245, 166, 35, 0.3)', transition: 'all 0.2s', flexShrink: 0 }}
                  title="Add more tokens"
                >
                  <i className="bi bi-plus-lg fw-900" style={{ color: '#f5a623', fontSize: '0.7rem' }}></i>
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

                  <button
                    type="button"
                    onClick={() => setActiveTab('disputes')}
                    className="pb-2 fw-700 position-relative border-0 bg-transparent text-start px-0"
                    style={{
                      color: activeTab === 'disputes' ? '#0d6efd' : '#64748b',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      borderRadius: 0
                    }}
                  >
                    ⚖️ Disputes Hub
                    <span className="badge bg-danger bg-opacity-10 text-danger ms-2 rounded-pill" style={{ fontSize: '0.75rem' }}>
                      {disputes.length}
                    </span>
                    {activeTab === 'disputes' && (
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
                              <h5 className="fw-700 mb-1 mt-1" style={{ color: 'var(--text-main)' }}>{job.title}</h5>
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
                                <img src={job.client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.client.fullName || 'Client')}&background=random&color=fff&size=128`} alt={job.client.fullName} className="bidder-profile-img" />
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

                          {/* Cancellation penalty policy progress trackers */}
                          <div className="mt-3 p-3 bg-light rounded-16 border">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="small fw-700 text-muted">📍 Job Travel Status</span>
                              <span className={`badge ${
                                (jobSubStatuses[job._id] || 'Accepted') === 'Arrived' ? 'bg-success' : 'bg-warning'
                              } text-white`}>
                                {jobSubStatuses[job._id] || 'Accepted'}
                              </span>
                            </div>

                            {/* Sub-status specific view */}
                            {(jobSubStatuses[job._id] || 'Accepted') === 'Accepted' && (
                              <div>
                                <div className="alert alert-warning py-2 px-3 rounded-12 mb-2 m-0" style={{ fontSize: '0.78rem' }}>
                                  ⚠️ <strong>15-Minute Acceptance Rule:</strong> Please confirm your travel. Failure to confirm or arrive on time can trigger warnings, ₹100 platform penalty, or 7-day suspension.
                                </div>
                                <div className="d-flex align-items-center justify-content-between mt-2">
                                  <span className="small text-muted"><i className="bi bi-clock-history me-1"></i>Confirm travel in: <CountdownTimer job={job} /></span>
                                  <button 
                                    onClick={() => updateJobSubStatus(job._id, 'On the Way')}
                                    className="btn btn-sm btn-primary fw-bold px-3 py-1 rounded-10"
                                    style={{ fontSize: '0.78rem' }}
                                  >
                                    🚀 Start Travel (On The Way)
                                  </button>
                                </div>
                              </div>
                            )}

                            {(jobSubStatuses[job._id] || 'Accepted') === 'On the Way' && (
                              <div>
                                <div className="alert alert-info py-2 px-3 rounded-12 mb-2 m-0" style={{ fontSize: '0.78rem' }}>
                                  📡 <strong>Live Location Sharing Active:</strong> Client is tracking your real-time coordinates. Keep moving! Auto-cancel will trigger if no movement is detected for 30 minutes.
                                </div>
                                <div className="d-flex align-items-center justify-content-between mt-2">
                                  <span className="small text-success"><i className="bi bi-geo-alt-fill animate-bounce me-1"></i>Sharing coordinates...</span>
                                  <button 
                                    onClick={() => updateJobSubStatus(job._id, 'Arrived')}
                                    className="btn btn-sm btn-success fw-bold px-3 py-1 rounded-10"
                                    style={{ fontSize: '0.78rem' }}
                                  >
                                    📍 Confirm Arrival
                                  </button>
                                </div>
                              </div>
                            )}

                            {(jobSubStatuses[job._id] || 'Accepted') === 'Arrived' && (
                              <div>
                                <div className="alert alert-success py-2 px-3 rounded-12 mb-2 m-0" style={{ fontSize: '0.78rem' }}>
                                  🎯 <strong>You Have Arrived:</strong> Please coordinate with the client to begin the work. Once completed, request the client to mark the job complete from their dashboard.
                                </div>
                                <div className="d-flex gap-2 mt-2 justify-content-end">
                                  <button 
                                    onClick={() => handleOpenNoShowModal(job)}
                                    className="btn btn-sm btn-outline-danger fw-bold px-3 py-1 rounded-10"
                                    style={{ fontSize: '0.78rem' }}
                                  >
                                    ⚠️ Client Not Available / No-Show
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
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
                                  🪙 Cost: {getTokensCost(inv.money)} tkn
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
                              <h5 className="fw-700 mb-1 mt-1" style={{ color: 'var(--text-main)' }}>{job.title}</h5>
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
                                <img src={job.client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.client.fullName || 'Client')}&background=random&color=fff&size=128`} alt={job.client.fullName} className="bidder-profile-img" />
                                <div>
                                  <span className="small text-muted fw-700">Hiring Client</span>
                                  <h6 className="mb-0 mt-1">{job.client.fullName}</h6>
                                </div>
                              </div>

                              <div className="text-end">
                                <div className="fw-800 text-success mb-1" style={{ fontSize: '1.05rem' }}>₹{job.money || 0} Paid</div>
                                <div className="d-flex flex-column align-items-end gap-2">
                                  <span className="badge bg-success bg-opacity-10 text-success fw-700 rounded-pill px-3 py-1">Closed & Completed</span>
                                  <button
                                    onClick={() => handleOpenWorkerDispute(job)}
                                    className="btn btn-sm btn-outline-danger py-1 px-2 border-1 rounded-12"
                                    style={{ fontSize: '0.72rem', fontWeight: 700 }}
                                  >
                                    ⚠️ File Dispute
                                  </button>
                                </div>
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

                {activeTab === 'disputes' && (
                  disputes.length > 0 ? (
                    <div className="dashboard-scroll-container">
                      <div className="alert alert-info py-2 px-3 rounded-12 mb-3" style={{ fontSize: '0.82rem' }}>
                        ⚖️ <strong>QuickLabour Dispute Resolution Policy:</strong> Our support desk reviews GPS location logs, phone call screenshots, and upload photos to resolve disputes. Decisions are made in 24-48 hours.
                      </div>
                      {disputes.map(disp => (
                        <div key={disp._id} className="dashboard-list-item d-flex flex-column align-items-stretch py-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <span className="badge bg-danger bg-opacity-10 text-danger small fw-700" style={{ fontSize: '0.7rem' }}>DISPUTE CASE</span>
                              <h6 className="fw-700 mb-1 mt-1">{disp.jobTitle}</h6>
                              <span className="text-muted small fw-600">
                                <i className="bi bi-clock me-1"></i>Filed on {disp.createdAt}
                              </span>
                            </div>
                            <span className={`badge ${
                              disp.status === 'Resolved' ? 'bg-success' :
                              disp.status === 'Under Review' ? 'bg-primary' : 'bg-warning'
                            } text-white`}>
                              {disp.status}
                            </span>
                          </div>
                          <div className="bg-light p-3 rounded-16 border mt-2">
                            <p className="small mb-2 text-dark"><strong>Reason:</strong> {disp.reason}</p>
                            <div className="d-flex gap-3 flex-wrap">
                              <div>
                                <span className="d-block small text-muted fw-700 mb-1">Selfie/Proof Photo</span>
                                <img src={disp.photo} alt="Selfie Proof" className="rounded-12 border shadow-sm" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                              </div>
                              <div>
                                <span className="d-block small text-muted fw-700 mb-1">Call Logs</span>
                                <img src={disp.callLog} alt="Call Logs Proof" className="rounded-12 border shadow-sm" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                              </div>
                              <div className="text-start">
                                <span className="d-block small text-muted fw-700 mb-1">GPS Location Recorded</span>
                                <span className="badge bg-secondary text-white font-monospace">{disp.gpsLocation}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-shield-check fs-1 mb-3 text-success opacity-75 d-block"></i>
                      <h6 className="fw-700">No active disputes</h6>
                      <p className="small mb-0">Your account standing is clean and 100% compliant!</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="dashboard-card mb-4">
                <h5 className="fw-700 mb-3" style={{ color: 'var(--text-main)' }}>Worker Profile</h5>
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
                  <li className="py-2 d-flex align-items-center gap-2">
                    <i className="bi bi-calendar-check text-muted"></i> 
                    <strong>Joined:</strong> {sessionStorage.getItem('userCreatedAt') 
                      ? new Date(sessionStorage.getItem('userCreatedAt')).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'June 15, 2026'}
                  </li>
                  <li className="py-2 d-flex align-items-center gap-2">
                    <i className="bi bi-briefcase text-muted"></i> 
                    <strong>Experience:</strong> {sessionStorage.getItem('userEmail') === 'worker@quicklabour.com' ? '5+ Years (Verified)' : 'Newly Joined (Entry Level)'}
                  </li>
                </ul>

                {/* Trust Score & Verification badge */}
                <div className="mt-3 p-3 bg-light rounded-16 border text-start mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-700 text-muted">🛡️ Safety Trust Score</span>
                    <span className="badge bg-success text-white fw-800">
                      {localStorage.getItem('quicklabour_worker_trust_score') || 95} / 100
                    </span>
                  </div>
                  <div className="progress mb-2" style={{ height: '6px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar" 
                      style={{ width: `${localStorage.getItem('quicklabour_worker_trust_score') || 95}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                    <span>On-time: 98%</span>
                    <span>Cancellations: 0</span>
                  </div>
                </div>

                <div className="mt-2.5 p-3 bg-light rounded-16 border text-start mb-3">
                  <span className="small fw-700 text-muted d-block mb-2">✅ Verification Badge</span>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 d-flex align-items-center gap-1 small" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-check-circle-fill"></i> Phone OTP
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 d-flex align-items-center gap-1 small" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-check-circle-fill"></i> Aadhaar Verified
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 d-flex align-items-center gap-1 small" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-check-circle-fill"></i> Profile Photo
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 d-flex align-items-center gap-1 small" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-check-circle-fill"></i> Skill Checked
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleOpenEditModal}
                  className="btn w-100 mt-2 d-flex align-items-center justify-content-center gap-2 py-2"
                  style={{
                    background: 'var(--bg-surface-hover)',
                    border: '1px dashed #cbd5e1',
                    color: 'var(--text-muted)',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="bi bi-pencil-square"></i> Edit Profile
                </button>
              </div>

              {/* Subscription and Tokens Card */}
              <div className="dashboard-card mb-4" style={{
                background: 'linear-gradient(135deg, #1e1b4b, #311042)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-800 m-0" style={{ color: '#fff', fontSize: '1.1rem' }}>
                    ⚡ Subscriptions & Tokens
                  </h5>
                  <span className="badge bg-warning text-dark fw-800" style={{ fontSize: '0.72rem' }}>
                    {workerTokens > 0 ? 'Active' : 'Tokens Exhausted'}
                  </span>
                </div>
                
                <div className="p-3 rounded-16 mb-3" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-white-50">Token Balance</span>
                    <span className="fw-900 text-warning" style={{ fontSize: '1.25rem' }}>{workerTokens} TKN</span>
                  </div>
                </div>

                <p className="small text-white-50 mb-3" style={{ lineHeight: '1.4' }}>
                  {workerTokens >= 10 
                    ? 'Each job acceptance costs 10 tokens. Buy more tokens to keep accepting jobs.'
                    : '⚠️ Insufficient token balance! Please purchase tokens to accept job invitations.'
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
                  <i className="bi bi-gem"></i> Buy Tokens & Plans
                </button>
              </div>

              <div className="dashboard-card">
                <h5 className="fw-700 mb-3" style={{ color: 'var(--text-main)' }}>Earnings Progress</h5>
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
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              
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
                      onChange={(e) => setEditName(toTitleCase(e.target.value))}
                      required
                    />
                  </div>

                  {/* Specialty / Occupation Dropdown */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-700 text-muted mb-0">Specialty / Occupation</label>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20 fw-700" style={{ fontSize: '0.68rem' }}>🔒 Verification Locked</span>
                    </div>
                    <select
                      className="form-select rounded-12 bg-light text-muted"
                      value={editOccupation}
                      onChange={(e) => setEditOccupation(e.target.value)}
                      required
                      disabled
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
                      onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
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
                        onChange={(e) => setEditAddress(toTitleCase(e.target.value))}
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
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '850px' }}>
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', height: '80vh', display: 'flex', flexDirection: 'column' }}>
              
              {/* Header */}
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'var(--navbar-bg)', borderBottom: '1px solid var(--border-color)', borderBottom: 'none' }}>
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
              <div className="modal-body p-0" style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-app)', position: 'relative' }}>
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
                  {workerLat && workerLng && mapJob.latitude && mapJob.longitude && (
                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-800">
                      📏 Distance: {getDistanceInKm(workerLat, workerLng, mapJob.latitude, mapJob.longitude)} km
                    </span>
                  )}
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
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060, fontFamily: "'Poppins', sans-serif" }}>
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
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              
              {/* Header */}
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'var(--navbar-bg)', borderBottom: '1px solid var(--border-color)', borderBottom: 'none' }}>
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
                      Your tokens balance has been updated instantly.
                    </p>
                    <div className="spinner-border text-success spinner-border-sm mt-3" role="status"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <h4 className="fw-900" style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}>⚡ Boost Your Workforce Profile</h4>
                      <p className="text-muted small mx-auto" style={{ maxWidth: '600px', fontSize: '0.92rem' }}>
                        You've enjoyed your <span className="badge bg-warning bg-opacity-20 text-warning-emphasis fw-800 px-2 py-1 rounded" style={{ color: 'var(--text-main)', background: 'rgba(245, 166, 35, 0.15)', border: '1px solid rgba(245, 166, 35, 0.3)' }}>2 FREE job accepts</span>. 
                        Subscribe to a premium plan to gain high-priority tokens. Every manual job acceptance costs only <strong className="text-dark">10 tokens</strong>.
                      </p>
                    </div>

                    {/* Subscription Cards Grid */}
                    <div className="row g-4 mb-4 subscription-modal-row">
                      {/* Basic Plan */}
                      <div className="col-md-4 subscription-modal-col">
                        <div 
                          className="card rounded-24 p-4 text-center h-100 cursor-pointer position-relative animate-scale-up subscription-card"
                          onClick={() => setSelectedPlan('basic')}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: selectedPlan === 'basic' ? '2.5px solid #0d6efd' : '1.5px solid #e8edf5',
                            background: selectedPlan === 'basic' ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), var(--card-bg))' : 'var(--card-bg)',
                            boxShadow: selectedPlan === 'basic' ? '0 20px 25px -5px rgba(13, 110, 253, 0.15), 0 10px 10px -5px rgba(13, 110, 253, 0.08)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                            transform: selectedPlan === 'basic' ? 'translateY(-6px)' : 'none',
                          }}
                        >
                          <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 plan-icon-container" style={{ width: '48px', height: '48px', fontSize: '1.25rem', color: '#0d6efd', background: 'rgba(13, 110, 253, 0.1)' }}>
                            <i className="bi bi-rocket-takeoff-fill"></i>
                          </div>
                          
                          <div className="plan-header-info">
                            <div className="fw-800 small uppercase mb-2 tracking-wider plan-title" style={{ fontSize: '0.75rem', color: '#0d6efd' }}>BASIC STARTER</div>
                            <div className="plan-badge-container">
                              <div className="badge text-white fw-800 rounded-pill px-3 py-2" style={{ fontSize: '0.82rem', letterSpacing: '0.03em', background: '#0d6efd' }}>
                                +90 Tokens
                              </div>
                            </div>
                          </div>
                          
                          <div className="plan-price-info">
                            <h2 className="fw-900 mt-1 mb-0 plan-price" style={{ color: 'var(--text-main)', fontSize: '2rem' }}>₹100</h2>
                            <div className="small text-muted font-monospace mt-1 plan-gst">+ 5% GST (₹5)</div>
                          </div>
                          
                          <hr className="my-3 opacity-10" />
                          <div className="d-flex flex-column align-items-center gap-2 plan-features-info">
                            <span className="small text-muted fw-600"><i className="bi bi-check2-circle me-1" style={{ color: '#0d6efd' }}></i>Accept 9 Jobs</span>
                          </div>
                        </div>
                      </div>
 
                      {/* Standard Plan (Popular) */}
                      <div className="col-md-4 subscription-modal-col">
                        <div 
                          className="card rounded-24 p-4 text-center h-100 cursor-pointer position-relative animate-scale-up subscription-card"
                          onClick={() => setSelectedPlan('standard')}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: selectedPlan === 'standard' ? '2.5px solid #f5a623' : '1.5px solid #e8edf5',
                            background: selectedPlan === 'standard' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--card-bg))' : 'var(--card-bg)',
                            boxShadow: selectedPlan === 'standard' ? '0 25px 30px -5px rgba(245, 166, 35, 0.2), 0 12px 12px -5px rgba(245, 166, 35, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                            transform: selectedPlan === 'standard' ? 'translateY(-6px)' : 'none',
                          }}
                        >
                          <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill fw-800 px-3 py-2 text-dark shadow-sm popular-badge" style={{ fontSize: '0.72rem', background: '#f5a623', letterSpacing: '0.05em', top: '-2px' }}>MOST POPULAR</span>
                          <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 plan-icon-container" style={{ width: '48px', height: '48px', fontSize: '1.25rem', color: '#f5a623', background: 'rgba(245, 166, 35, 0.1)' }}>
                            <i className="bi bi-shield-fill-check"></i>
                          </div>
                          
                          <div className="plan-header-info">
                            <div className="fw-800 small uppercase mb-2 tracking-wider plan-title" style={{ fontSize: '0.75rem', color: '#f5a623' }}>STANDARD GROW</div>
                            <div className="plan-badge-container">
                              <div className="badge text-dark fw-800 rounded-pill px-3 py-2" style={{ fontSize: '0.82rem', letterSpacing: '0.03em', background: '#f5a623' }}>
                                +190 Tokens
                              </div>
                            </div>
                          </div>
                          
                          <div className="plan-price-info">
                            <h2 className="fw-900 mt-1 mb-0 plan-price" style={{ color: 'var(--text-main)', fontSize: '2rem' }}>₹200</h2>
                            <div className="small text-muted font-monospace mt-1 plan-gst">+ 5% GST (₹10)</div>
                          </div>
                          
                          <hr className="my-3 opacity-10" />
                          <div className="d-flex flex-column align-items-center gap-2 plan-features-info">
                            <span className="small text-muted fw-600"><i className="bi bi-check2-circle me-1" style={{ color: '#f5a623' }}></i>Accept 19 Jobs</span>
                          </div>
                        </div>
                      </div>
 
                      {/* Premium Plan */}
                      <div className="col-md-4 subscription-modal-col">
                        <div 
                          className="card rounded-24 p-4 text-center h-100 cursor-pointer position-relative animate-scale-up subscription-card"
                          onClick={() => setSelectedPlan('premium')}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: selectedPlan === 'premium' ? '2.5px solid #0a2540' : '1.5px solid #e8edf5',
                            background: selectedPlan === 'premium' ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), var(--card-bg))' : 'var(--card-bg)',
                            boxShadow: selectedPlan === 'premium' ? '0 20px 25px -5px rgba(10, 37, 64, 0.15), 0 10px 10px -5px rgba(10, 37, 64, 0.08)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                            transform: selectedPlan === 'premium' ? 'translateY(-6px)' : 'none',
                          }}
                        >
                          <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 plan-icon-container" style={{ width: '48px', height: '48px', fontSize: '1.25rem', color: 'var(--text-main)', background: 'rgba(10, 37, 64, 0.1)' }}>
                            <i className="bi bi-crown-fill"></i>
                          </div>
                          
                          <div className="plan-header-info">
                            <div className="fw-800 small uppercase mb-2 tracking-wider plan-title" style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>PREMIUM ELITE</div>
                            <div className="plan-badge-container">
                              <div className="badge text-white fw-800 rounded-pill px-3 py-2" style={{ fontSize: '0.82rem', letterSpacing: '0.03em', background: '#0a2540' }}>
                                +460 Tokens
                              </div>
                            </div>
                          </div>
                          
                          <div className="plan-price-info">
                            <h2 className="fw-900 mt-1 mb-0 plan-price" style={{ color: 'var(--text-main)', fontSize: '2rem' }}>₹500</h2>
                            <div className="small text-muted font-monospace mt-1 plan-gst">+ 5% GST (₹25)</div>
                          </div>
                          
                          <hr className="my-3 opacity-10" />
                          <div className="d-flex flex-column align-items-center gap-2 plan-features-info">
                            <span className="small text-muted fw-600"><i className="bi bi-check2-circle me-1" style={{ color: 'var(--text-main)' }}></i>Accept 46 Jobs</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secure Card / Wallet input fields directly inside checkout */}
                    {showCardForm && (
                      <div className="card border-0 p-4 mb-4 animate-scale-up text-white animate-notification-toast" style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                        borderRadius: '20px'
                      }}>
                        <div className="d-flex align-items-center justify-content-between mb-4">
                          <h6 className="fw-900 text-white m-0 d-flex align-items-center gap-2" style={{ fontSize: '1.05rem' }}>
                            <i className="bi bi-shield-fill-check text-warning animate-pulse"></i>
                            Select Payment Method
                          </h6>
                          <div className="d-flex gap-1.5 align-items-center bg-white bg-opacity-10 px-2.5 py-1.5 rounded-pill" style={{ fontSize: '0.72rem' }}>
                            <span className="text-white-50">Secure Checkout</span>
                          </div>
                        </div>

                        {/* Payment Method Selector Tabs */}
                        <div className="d-flex gap-2 mb-4 p-1 rounded-12 bg-white bg-opacity-10" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <button
                            type="button"
                            className={`btn btn-sm flex-fill py-2 fw-bold rounded-10 border-0 ${subPaymentMethod === 'card' ? 'bg-warning text-dark shadow-sm' : 'text-white bg-transparent'}`}
                            onClick={() => setSubPaymentMethod('card')}
                            style={{ transition: 'all 0.25s' }}
                          >
                            <i className="bi bi-credit-card-2-front me-1.5"></i> Stripe Card
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm flex-fill py-2 fw-bold rounded-10 border-0 ${subPaymentMethod === 'wallet' ? 'bg-warning text-dark shadow-sm' : 'text-white bg-transparent'}`}
                            onClick={() => setSubPaymentMethod('wallet')}
                            style={{ transition: 'all 0.25s' }}
                          >
                            <i className="bi bi-wallet2 me-1.5"></i> Pay from Wallet
                          </button>
                        </div>

                        {subPaymentMethod === 'card' ? (
                          <>
                            {/* Cardholder Name */}
                            <div className="mb-3">
                              <label className="form-label small fw-700 text-white-50">Cardholder Name</label>
                              <div className="input-group">
                                <span className="input-group-text bg-white bg-opacity-5 border-white border-opacity-10 text-white-50" style={{ borderRadius: '12px 0 0 12px' }}>
                                  <i className="bi bi-person-fill"></i>
                                </span>
                                <input 
                                  type="text" 
                                  className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-dark" 
                                  style={{ borderRadius: '0 12px 12px 0', borderLeft: 'none', fontSize: '0.95rem', color: '#000000' }}
                                  placeholder="Enter name on card" 
                                  value={cardName} 
                                  onChange={(e) => setCardName(toTitleCase(e.target.value))}
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
                                  className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-dark font-monospace" 
                                  style={{ borderRadius: '0 12px 12px 0', borderLeft: 'none', letterSpacing: '2px', fontSize: '0.95rem', color: '#000000' }}
                                  placeholder="1234 5678 9012 3456" 
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
                                  className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-dark font-monospace text-center" 
                                  style={{ borderRadius: '12px', fontSize: '0.95rem', color: '#000000' }}
                                  placeholder="MM / YY" 
                                  value={cardExpiry} 
                                  onChange={handleCardExpiryChange}
                                  required
                                />
                              </div>
                              <div className="col-6">
                                <label className="form-label small fw-700 text-white-50">CVC / CVV</label>
                                <div className="input-group">
                                  <input 
                                    type={showCvc ? "text" : "password"} 
                                    className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-dark font-monospace text-center rounded-start-12" 
                                    style={{ fontSize: '0.95rem', color: '#000000' }}
                                    placeholder="•••" 
                                    value={cardCvc} 
                                    onChange={handleCardCvcChange}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="4"
                                    required
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline-light border-white border-opacity-10 bg-white bg-opacity-5 text-white-50 rounded-end-12 d-flex align-items-center justify-content-center"
                                    onClick={() => setShowCvc(!showCvc)}
                                    style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                                  >
                                    <i className={`bi ${showCvc ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4 px-2 animate-scale-up">
                            <i className="bi bi-wallet2 text-warning display-5 mb-3 d-block animate-bounce"></i>
                            <div className="small text-white-50 mb-1">Available Wallet Balance</div>
                            <h3 className="fw-extrabold text-white mb-2">₹{Number(walletBalance).toFixed(2)}</h3>
                            
                            <div className="p-3 rounded-12 bg-white bg-opacity-5 border border-white border-opacity-10 text-start mt-3">
                              <div className="d-flex justify-content-between text-white-50 small mb-1.5">
                                <span>Recharge Price:</span>
                                <span className="text-white fw-bold">₹{selectedPlan === 'basic' ? '100' : selectedPlan === 'standard' ? '200' : '500'}.00</span>
                              </div>
                              <div className="d-flex justify-content-between text-white-50 small mb-1.5">
                                <span>GST Waiver Discount:</span>
                                <span className="text-success fw-bold">- ₹{selectedPlan === 'basic' ? '5' : selectedPlan === 'standard' ? '10' : '25'}.00</span>
                              </div>
                              <hr className="my-2 border-white border-opacity-10" />
                              <div className="d-flex justify-content-between text-white small">
                                <span className="fw-bold">Total Wallet Debit:</span>
                                <span className="text-warning fw-extrabold fs-5">₹{selectedPlan === 'basic' ? '99' : selectedPlan === 'standard' ? '199' : '499'}.00</span>
                              </div>
                            </div>
                            
                            {walletBalance < (selectedPlan === 'basic' ? 99 : selectedPlan === 'standard' ? 199 : 499) && (
                              <div className="alert alert-danger py-2 px-3 mt-3 rounded-12 border-0 small fw-bold mb-0 text-start" style={{ background: 'rgba(220, 53, 69, 0.25)', color: '#ea868f' }}>
                                <i className="bi bi-exclamation-triangle-fill me-1.5"></i>
                                Insufficient wallet balance to purchase this plan. Please deposit money to your wallet or pay using a credit card.
                              </div>
                            )}
                          </div>
                        )}

                        {cardError && (
                          <div className="alert alert-danger py-2.5 px-3 rounded-12 border-0 small fw-700 mb-0 d-flex align-items-center gap-1.5" style={{ background: 'rgba(220, 53, 69, 0.15)', color: '#ea868f' }}>
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            {cardError}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pay with Wallet Balance option */}
                    {!showCardForm && (
                      <div className="card border-0 p-3 mb-4 text-white animate-scale-up" style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        borderRadius: '20px'
                      }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <div className="small text-white-50">Or pay instantly from wallet:</div>
                            <h6 className="fw-800 text-white m-0 mt-1">
                              Wallet Balance: ₹{Number(walletBalance).toFixed(2)}
                            </h6>
                          </div>
                          <button
                            type="button"
                            className="btn btn-warning px-3 py-2 fw-bold text-dark border-0 rounded-12"
                            onClick={() => handleRechargeTokensWithWallet(selectedPlan)}
                            disabled={isPayingWithWallet || walletBalance < (selectedPlan === 'basic' ? 99 : selectedPlan === 'standard' ? 199 : 499)}
                            style={{ fontSize: '0.85rem' }}
                          >
                            {isPayingWithWallet ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                Paying...
                              </>
                            ) : walletBalance < (selectedPlan === 'basic' ? 99 : selectedPlan === 'standard' ? 199 : 499) ? (
                              'Insufficient Wallet'
                            ) : (
                              `⚡ Pay ₹${selectedPlan === 'basic' ? 99 : selectedPlan === 'standard' ? 199 : 499} from Wallet`
                            )}
                          </button>
                        </div>
                        <div className="small text-warning mt-2" style={{ fontSize: '0.75rem' }}>
                          * Recharge via wallet qualifies for an automatic waiver of 5% GST! (Saves up to ₹25!)
                        </div>
                      </div>
                    )}

                    {/* Receipt Breakdown & Simulate Payment */}
                    <div className="p-4 rounded-24 border mb-4 order-invoice-card" style={{
                      background: 'var(--bg-app)',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.02)'
                    }}>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="bg-white p-2 rounded-10 border shadow-sm d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '1rem', color: 'var(--text-muted)' }}>
                          <i className="bi bi-receipt"></i>
                        </div>
                        <h6 className="fw-800 m-0" style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>Order Invoice Breakdown</h6>
                      </div>

                      <div className="d-flex justify-content-between py-2 border-bottom border-dashed text-muted" style={{ fontSize: '0.88rem' }}>
                        <span>Plan Subscription:</span>
                        <strong className="text-dark fw-700">{selectedPlan.toUpperCase()} Premium</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-dashed text-muted" style={{ fontSize: '0.88rem' }}>
                        <span>Tokens Pack Added:</span>
                        <strong className="text-dark fw-700">+{selectedPlan === 'basic' ? '90' : selectedPlan === 'standard' ? '190' : '460'} TKN</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-dashed text-muted" style={{ fontSize: '0.88rem' }}>
                        <span>Subtotal Net Price:</span>
                        <strong className="text-dark fw-700">₹{selectedPlan === 'basic' ? '100' : selectedPlan === 'standard' ? '200' : '500'}.00</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-dashed text-muted" style={{ fontSize: '0.88rem' }}>
                        <span>Government GST (5%):</span>
                        <strong className="text-dark fw-700">
                          {showCardForm && subPaymentMethod === 'wallet' ? '₹0.00 (Waived)' : `₹${selectedPlan === 'basic' ? '5' : selectedPlan === 'standard' ? '10' : '25'}.00`}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between pt-3 text-dark">
                        <span className="fw-900" style={{ fontSize: '1.05rem' }}>Total Payable Amount:</span>
                        <strong className="fw-900" style={{ fontSize: '1.35rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                          ₹{showCardForm && subPaymentMethod === 'wallet' 
                            ? (selectedPlan === 'basic' ? '99' : selectedPlan === 'standard' ? '199' : '499') 
                            : (selectedPlan === 'basic' ? '105' : selectedPlan === 'standard' ? '210' : '525')}.00
                        </strong>
                      </div>
                    </div>

                    <div className="d-flex gap-3 checkout-actions-row">
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
                        disabled={isSubscribing || isPayingWithWallet}
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
                          color: '#ffffff',
                          fontWeight: '800',
                          boxShadow: selectedPlan === 'basic'
                            ? '0 10px 15px -3px rgba(13, 110, 253, 0.3)'
                            : selectedPlan === 'standard'
                              ? '0 10px 15px -3px rgba(245, 166, 35, 0.3)'
                              : '0 10px 15px -3px rgba(10, 37, 64, 0.3)',
                        }}
                        onClick={handlePurchaseSubscription}
                        disabled={isSubscribing || isPayingWithWallet}
                      >
                        {isSubscribing || isPayingWithWallet ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Authorizing Security...
                          </>
                        ) : showCardForm ? (
                          <>
                            <i className="bi bi-shield-lock-fill me-2" style={{ opacity: 0.8 }}></i> Confirm & Pay ₹{subPaymentMethod === 'wallet' 
                              ? (selectedPlan === 'basic' ? '99' : selectedPlan === 'standard' ? '199' : '499') 
                              : (selectedPlan === 'basic' ? '105' : selectedPlan === 'standard' ? '210' : '525')}.00
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

      {/* ── Unified Wallet Hub Modal ── */}
      {showWalletHubModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              
              {/* Header */}
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', borderBottom: 'none' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 p-2 bg-white bg-opacity-20 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                    <i className="bi bi-wallet2 fs-4"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-800 m-0 text-white">Labour Wallet Hub</h5>
                    <p className="mb-0 text-white-50 small">Receive payments, manage balance, and payout earnings.</p>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="text-end d-none d-sm-block">
                    <span className="small text-white-50 d-block">Current Balance</span>
                    <strong className="text-white fs-5">₹{Number(walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowWalletHubModal(false)}></button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="bg-light border-bottom px-4 py-2 d-flex gap-2 overflow-x-auto">
                <button 
                  type="button" 
                  className={`btn rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 border-0 ${activeWalletTab === 'scanner' ? 'btn-primary text-white' : 'btn-light text-secondary'}`}
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setActiveWalletTab('scanner')}
                >
                  <i className="bi bi-qr-code"></i> Show QR / Receive
                </button>
                <button 
                  type="button" 
                  className={`btn rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 border-0 ${activeWalletTab === 'add' ? 'btn-primary text-white' : 'btn-light text-secondary'}`}
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setActiveWalletTab('add')}
                >
                  <i className="bi bi-plus-circle"></i> Add Money
                </button>
                <button 
                  type="button" 
                  className={`btn rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 border-0 ${activeWalletTab === 'withdraw' ? 'btn-primary text-white' : 'btn-light text-secondary'}`}
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setActiveWalletTab('withdraw')}
                >
                  <i className="bi bi-cash-stack"></i> Withdraw
                </button>
                <button 
                  type="button" 
                  className={`btn rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 border-0 ${activeWalletTab === 'history' ? 'btn-primary text-white' : 'btn-light text-secondary'}`}
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setActiveWalletTab('history')}
                >
                  <i className="bi bi-clock-history"></i> History
                </button>
              </div>

              <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                
                {/* 1. SHOW QR / RECEIVE TAB */}
                {activeWalletTab === 'scanner' && (
                  <div className="text-center animate-scale-up py-3">
                    <p className="text-muted small mb-4">
                      Show this QR code to hiring clients so they can scan and pay your labour fee directly to your wallet.
                    </p>

                    {/* QR Container */}
                    <div className="d-inline-block p-4 bg-white rounded-24 border mb-4 shadow-sm" style={{ border: '2px solid var(--border-color)' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${sessionStorage.getItem('userId') || 'worker-id-demo'}`}
                        alt="Labour Wallet QR Code"
                        style={{ width: '200px', height: '200px', display: 'block' }}
                      />
                    </div>

                    {/* Worker Quick info */}
                    <div className="p-3 bg-light rounded-16 border mx-auto" style={{ maxWidth: '320px' }}>
                      <h6 className="fw-800 mb-1">{profileName}</h6>
                      <span className="badge bg-primary-subtle text-primary fw-700">{profileOccupation || 'Trade Worker'}</span>
                      <div className="small text-muted mt-2 font-monospace">
                        ID: {sessionStorage.getItem('userId') || 'worker-id-demo'}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ADD MONEY TAB */}
                {activeWalletTab === 'add' && (
                  <form onSubmit={handleAddMoneySubmit} className="animate-scale-up">
                    {walletMethod !== 'netbanking' && (
                      <div className="mb-4">
                        <label className="form-label small fw-700 text-muted">Enter Deposit Amount (₹)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light fw-bold">₹</span>
                          <input
                            type="number"
                            className="form-control rounded-12 p-3 fw-bold"
                            style={{ fontSize: '1.25rem' }}
                            placeholder="e.g. 500"
                            value={walletAmount}
                            onChange={(e) => setWalletAmount(e.target.value)}
                            required
                            min="1"
                          />
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="form-label small fw-700 text-muted d-block mb-2.5">Select Payment Method</label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className={`btn flex-fill py-2.5 fw-bold rounded-12 border ${walletMethod === 'upi' ? 'bg-primary text-white border-primary' : 'bg-white text-dark'}`}
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => setWalletMethod('upi')}
                        >
                          📱 UPI
                        </button>
                        <button
                          type="button"
                          className={`btn flex-fill py-2.5 fw-bold rounded-12 border ${walletMethod === 'card' ? 'bg-primary text-white border-primary' : 'bg-white text-dark'}`}
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => setWalletMethod('card')}
                        >
                          💳 Card
                        </button>
                        <button
                          type="button"
                          className={`btn flex-fill py-2.5 fw-bold rounded-12 border ${walletMethod === 'netbanking' ? 'bg-primary text-white border-primary' : 'bg-white text-dark'}`}
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => setWalletMethod('netbanking')}
                        >
                          🌐 Net Banking
                        </button>
                      </div>
                    </div>

                    {walletMethod === 'upi' && (
                      <div className="mb-4 animate-scale-up">
                        <label className="form-label small fw-700 text-muted">UPI ID (VPA)</label>
                        <input
                          type="text"
                          className="form-control rounded-12"
                          placeholder="e.g. 98*********@paytm"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    {walletMethod === 'card' && (
                      <div className="animate-scale-up mb-4">
                        <div className="mb-3">
                          <label className="form-label small fw-700 text-muted">Cardholder Name</label>
                          <input
                            type="text"
                            className="form-control rounded-12 text-dark"
                            placeholder="Name on Card"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-700 text-muted">Card Number</label>
                          <input
                            type="text"
                            className="form-control rounded-12 font-monospace text-dark"
                            placeholder="1234 5678 9012 3456" 
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            required
                          />
                        </div>
                        <div className="row g-3">
                          <div className="col-6">
                            <label className="form-label small fw-700 text-muted">Expiry Date</label>
                            <input
                              type="text"
                              className="form-control rounded-12 font-monospace text-center text-dark"
                              placeholder="MM / YY"
                              value={cardExpiry}
                              onChange={handleCardExpiryChange}
                              required
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-700 text-muted">CVV / CVC</label>
                            <div className="input-group">
                              <input
                                type={showCvc ? "text" : "password"}
                                className="form-control rounded-start-12 font-monospace text-center text-dark"
                                placeholder="•••"
                                value={cardCvc}
                                onChange={handleCardCvcChange}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength="4"
                                required
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary rounded-end-12 d-flex align-items-center justify-content-center"
                                onClick={() => setShowCvc(!showCvc)}
                                style={{ borderColor: '#dee2e6' }}
                              >
                                <i className={`bi ${showCvc ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {walletMethod === 'netbanking' && (
                      <div className="netbanking-container border p-4 rounded-20 bg-light mb-4 animate-scale-up text-start">
                        <h5 className="fw-800 text-dark mb-3">Net Banking</h5>

                        <div className="mb-3">
                          <label className="form-label small fw-700 text-muted">Select Bank</label>
                          <select 
                            className="form-select rounded-12 py-2"
                            value={netBank}
                            onChange={(e) => setNetBank(e.target.value)}
                            required
                          >
                            <option value="">Choose Your Bank</option>
                            <option>State Bank of India (SBI)</option>
                            <option>HDFC Bank</option>
                            <option>ICICI Bank</option>
                            <option>Punjab National Bank (PNB)</option>
                            <option>Axis Bank</option>
                            <option>Kotak Mahindra Bank</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-700 text-muted">Account Holder Name</label>
                          <input 
                            type="text" 
                            className="form-control rounded-12" 
                            placeholder="Enter Name"
                            value={netBankHolderName}
                            onChange={(e) => setNetBankHolderName(toTitleCase(e.target.value))}
                            required 
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-700 text-muted">Customer ID / User ID</label>
                          <input 
                            type="text" 
                            className="form-control rounded-12" 
                            placeholder="Enter User ID"
                            value={netBankCustomerId}
                            onChange={(e) => setNetBankCustomerId(e.target.value)}
                            required 
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-700 text-muted">Amount</label>
                          <input 
                            type="number" 
                            className="form-control rounded-12 py-2 fw-bold" 
                            placeholder="Enter Amount"
                            value={walletAmount}
                            onChange={(e) => setWalletAmount(e.target.value)}
                            required 
                            min="1"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary w-100 rounded-12 py-2.5 fw-bold"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none' }}
                      disabled={isAddingMoney}
                    >
                      {isAddingMoney ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : (
                        walletMethod === 'netbanking' ? 'Proceed to Bank' : `Confirm & Add ₹${walletAmount || '0'}`
                      )}
                    </button>
                  </form>
                )}

                {/* 3. WITHDRAW MONEY TAB */}
                {activeWalletTab === 'withdraw' && (
                  <form onSubmit={handleWithdrawSubmit} className="animate-scale-up">
                    {/* Simulated SMS Notification banner */}
                    {withdrawOtpNotification && (
                      <div className="alert alert-warning py-3 px-3 rounded-16 border-warning mb-4 shadow-sm" role="alert" style={{ fontSize: '0.88rem', borderLeft: '5px solid #ffc107' }}>
                        <div className="fw-800 text-dark mb-1" style={{ fontWeight: 800 }}>
                          <i className="bi bi-chat-left-dots-fill text-warning me-2"></i>Simulated SMS Banner:
                        </div>
                        <div className="font-monospace text-dark bg-white p-2 rounded border mt-2 small" style={{ fontWeight: 600 }}>
                          {withdrawOtpNotification}
                        </div>
                      </div>
                    )}

                    {!showWithdrawOtp ? (
                      <>
                        <div className="mb-4">
                          <label className="form-label small fw-700 text-muted">Enter Withdrawal Amount (₹)</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light fw-bold">₹</span>
                            <input
                              type="number"
                              className="form-control rounded-12 p-3 fw-bold"
                              style={{ fontSize: '1.25rem' }}
                              placeholder="e.g. 500"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              required
                              min="1"
                            />
                          </div>
                          <div className="small text-muted mt-1.5 d-flex justify-content-between">
                            <span>Available Wallet Balance:</span>
                            <strong className="text-dark">₹{walletBalance.toFixed(2)}</strong>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="form-label small fw-700 text-muted d-block mb-2.5">Select Payout Option</label>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className={`btn flex-fill py-2.5 fw-bold rounded-12 border ${withdrawMethod === 'bank' ? 'bg-primary text-white border-primary' : 'bg-white text-dark'}`}
                              style={{ fontSize: '0.85rem' }}
                              onClick={() => setWithdrawMethod('bank')}
                            >
                              🏦 Bank Account
                            </button>
                            <button
                              type="button"
                              className={`btn flex-fill py-2.5 fw-bold rounded-12 border ${withdrawMethod === 'upi' ? 'bg-primary text-white border-primary' : 'bg-white text-dark'}`}
                              style={{ fontSize: '0.85rem' }}
                              onClick={() => setWithdrawMethod('upi')}
                            >
                              📱 UPI ID
                            </button>
                          </div>
                        </div>

                        {withdrawMethod === 'upi' && (
                          <div className="mb-4 animate-scale-up">
                            <label className="form-label small fw-700 text-muted">UPI ID for Withdrawal</label>
                            <input
                              type="text"
                              className="form-control rounded-12"
                              placeholder="e.g. name@upi"
                              value={upiWithdrawId}
                              onChange={(e) => setUpiWithdrawId(e.target.value)}
                              required
                            />
                          </div>
                        )}

                        {withdrawMethod === 'bank' && (
                          <div className="animate-scale-up mb-4">
                            <div className="mb-3">
                              <label className="form-label small fw-700 text-muted">Bank Name</label>
                              <select
                                className="form-select rounded-12"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                required
                              >
                                <option value="SBI">State Bank of India (SBI)</option>
                                <option value="HDFC">HDFC Bank</option>
                                <option value="ICICI">ICICI Bank</option>
                                <option value="AXIS">Axis Bank</option>
                                <option value="PNB">Punjab National Bank</option>
                              </select>
                            </div>
                            <div className="row g-3">
                              <div className="col-7">
                                <label className="form-label small fw-700 text-muted">Account Number</label>
                                <input
                                  type="text"
                                  className="form-control rounded-12 text-dark"
                                  placeholder="Account Number"
                                  value={accountNo}
                                  onChange={(e) => setAccountNo(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="col-5">
                                <label className="form-label small fw-700 text-muted">IFSC Code</label>
                                <input
                                  type="text"
                                  className="form-control rounded-12 text-center text-dark"
                                  placeholder="SBIN0001234"
                                  value={ifscCode}
                                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn btn-primary w-100 rounded-12 py-2.5 fw-bold"
                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                          disabled={isWithdrawing}
                        >
                          {isWithdrawing ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Sending OTP...
                            </>
                          ) : `Confirm Withdrawal of ₹${withdrawAmount || '0'}`}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="mb-4 text-center animate-scale-up">
                          <label className="form-label small fw-700 text-muted mb-2">ENTER 4-DIGIT VERIFICATION CODE</label>
                          <input
                            type="text"
                            maxLength="4"
                            className="form-control text-center font-monospace fw-800 fs-3"
                            style={{ letterSpacing: '0.5rem', height: '54px', border: '2px solid var(--border-color)', borderRadius: '12px' }}
                            placeholder="••••"
                            value={withdrawOtp}
                            onChange={(e) => setWithdrawOtp(e.target.value.replace(/\D/g, ''))}
                            required
                            autoFocus
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn btn-success w-100 rounded-12 py-2.5 fw-bold"
                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                          disabled={isWithdrawing}
                        >
                          {isWithdrawing ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Verifying & Transferring...
                            </>
                          ) : `Verify & Transfer ₹${withdrawAmount}`}
                        </button>

                        <div className="text-center mt-3">
                          <button
                            type="button"
                            className="btn btn-link text-decoration-none small fw-700 p-0"
                            style={{ color: '#0d6efd', fontSize: '0.85rem' }}
                            onClick={async () => {
                              try {
                                const res = await api.requestWithdrawalOtp(Number(withdrawAmount));
                                setWithdrawOtp('');
                                setWithdrawOtpNotification(`📱 SMS Received on ${sessionStorage.getItem('userPhone') || 'registered phone number'}: Your new withdrawal verification OTP is: ${res.otp}`);
                              } catch (err) {
                                showClassyAlert("Failed to resend OTP: " + err.message, "Resend Error");
                              }
                            }}
                          >
                            <i className="bi bi-arrow-clockwise me-1"></i> Resend OTP Code
                          </button>
                        </div>

                        <div className="text-center mt-2 border-top pt-3">
                          <span
                            className="toggle-auth-link small text-muted text-decoration-underline"
                            style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                            onClick={() => {
                              setShowWithdrawOtp(false);
                              setWithdrawOtp('');
                              setWithdrawOtpNotification('');
                            }}
                          >
                            ← Change Withdrawal Details
                          </span>
                        </div>
                      </>
                    )}
                  </form>
                )}

                {/* 4. TRANSACTION HISTORY TAB */}
                {activeWalletTab === 'history' && (
                  <div className="animate-scale-up">
                    <h6 className="fw-800 text-muted small text-uppercase mb-3">Transaction & Payout Logs</h6>
                    <div className="table-responsive rounded-16 border overflow-hidden">
                      <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="table-light text-muted fw-bold">
                          <tr>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Date & Time</th>
                            <th className="py-2.5 px-3 text-end">Amount</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbTransactions.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center py-4 text-muted">
                                <i className="bi bi-info-circle me-1"></i> No transactions recorded yet.
                              </td>
                            </tr>
                          ) : (
                            dbTransactions.map((tx) => (
                              <tr key={tx.id}>
                                <td className="py-3 px-3 fw-bold text-dark">
                                  {tx.isCredit ? '📥 ' : '📤 '} {tx.type}
                                </td>
                                <td className="py-3 px-3 text-muted" style={{ fontSize: '0.8rem' }}>{tx.date}</td>
                                <td className={`py-3 px-3 text-end fw-black ${tx.isCredit ? 'text-success' : 'text-danger'}`}>
                                  {tx.isCredit ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1" style={{ fontSize: '0.7rem' }}>
                                    {tx.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="modal-footer px-4 py-3 bg-light border-0">
                <button
                  type="button"
                  className="btn btn-secondary rounded-12 px-4 py-2 fw-bold w-100"
                  onClick={() => setShowWalletHubModal(false)}
                >
                  Close Wallet Hub
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating SOS button */}
      {activeHiredJobs.length > 0 && (
        <button
          onClick={() => setShowSosModal(true)}
          className="position-fixed shadow-lg d-flex align-items-center justify-content-center border-0 text-white"
          style={{
            bottom: '24px',
            left: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ff3b30 0%, #d32f2f 100%)',
            zIndex: 1000,
            fontSize: '1.4rem',
            animation: 'pulse 1.5s infinite',
            fontWeight: 'bold'
          }}
          title="Press SOS if in danger"
        >
          🚨
        </button>
      )}

      {/* SOS Modal */}
      {showSosModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: '#ff3b30', borderBottom: 'none' }}>
                <h5 className="modal-title fw-800 m-0">🚨 Emergency SOS safety system</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSosModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-4">
                <div className="text-center">
                  <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-circle mb-3 mx-auto" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                    🚨
                  </div>
                  <h5 className="fw-800 text-danger mb-2">Are you in immediate danger?</h5>
                  <p className="text-muted small mb-4">
                    Triggering the SOS alert will instantly transmit your live GPS coordinates to the QuickLabour Administrator desk, notify regional authorities, and alert emergency contacts.
                  </p>
                </div>

                {!sosAlertTriggered && (
                  <>
                    {activeHiredJobs.length > 1 ? (
                      <div className="mb-3 text-start">
                        <label className="form-label small fw-700 text-muted">Select Active Job</label>
                        <select
                          className="form-select rounded-12"
                          value={sosJobId}
                          onChange={(e) => setSosJobId(e.target.value)}
                          required
                        >
                          <option value="">-- Choose Job --</option>
                          {activeHiredJobs.map((job) => (
                            <option key={job._id} value={job._id}>{job.title} (₹{job.money})</option>
                          ))}
                        </select>
                      </div>
                    ) : activeHiredJobs.length === 1 ? (
                      <div className="mb-3 text-start p-3 bg-light rounded-12 border">
                        <span className="small text-muted d-block fw-700">Active Job:</span>
                        <strong className="text-dark">{activeHiredJobs[0].title} (₹{activeHiredJobs[0].money})</strong>
                      </div>
                    ) : null}

                    <div className="mb-3 text-start">
                      <label className="form-label small fw-700 text-muted">Type of Problem / Emergency</label>
                      <select
                        className="form-select rounded-12"
                        value={sosEmergencyType}
                        onChange={(e) => setSosEmergencyType(e.target.value)}
                        required
                      >
                        <option value="Physical Danger/Threat">⚠️ Physical Danger / Threat</option>
                        <option value="Medical Emergency">🚑 Medical Emergency</option>
                        <option value="Accident/Injury">🤕 Accident / Injury</option>
                        <option value="Client Harassment">🚫 Client Harassment</option>
                        <option value="Other">❓ Other</option>
                      </select>
                    </div>

                    <div className="mb-4 text-start">
                      <label className="form-label small fw-700 text-muted">Provide details of the emergency</label>
                      <textarea
                        rows="3"
                        className="form-control rounded-12"
                        placeholder="Briefly describe what is happening..."
                        value={sosCustomDescription}
                        onChange={(e) => setSosCustomDescription(e.target.value)}
                        required
                      ></textarea>
                    </div>

                    <div className="mb-4 form-check text-start">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="claimRefundCheckbox"
                        checked={claimRefund}
                        onChange={(e) => setClaimRefund(e.target.checked)}
                      />
                      <label className="form-check-label small fw-700 text-muted" htmlFor="claimRefundCheckbox">
                        Claim 50% subscription token refund for this emergency
                      </label>
                    </div>
                  </>
                )}

                {sosAlertTriggered ? (
                  <div className="alert alert-danger py-3 fw-bold text-center animate-pulse">
                    📡 TRANSMITTING GPS COORDINATES & ALERTS...
                  </div>
                ) : (
                  <button
                    onClick={handleTriggerSOS}
                    className="btn btn-danger w-100 rounded-16 py-3 fw-800 fs-5 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #ff3b30, #d32f2f)', border: 'none' }}
                  >
                    🚨 Trigger Safety SOS Alert
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client No-Show Modal */}
      {showNoShowModal && noShowJob && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderBottom: 'none' }}>
                <h5 className="modal-title fw-800 m-0">📷 Visit Compensation Proof</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowNoShowModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-4">
                <p className="text-muted small mb-3">
                  If the client is not present at the location or responding to calls, upload your photo proof and a call history screenshot to claim the <strong>₹50 visit compensation</strong>.
                </p>

                <div className="mb-3">
                  <label className="form-label small fw-700 text-muted">1. Upload Selfie/Photo Proof at Location</label>
                  <input
                    type="file"
                    className="form-control rounded-12"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSelfieProof(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    accept="image/*"
                    required
                  />
                  {selfieProof && (
                    <img src={selfieProof} alt="Selfie preview" className="img-thumbnail mt-2 rounded-12" style={{ maxHeight: '100px' }} />
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-700 text-muted">2. Upload Call Log Screenshot</label>
                  <input
                    type="file"
                    className="form-control rounded-12"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNoShowCallLog(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    accept="image/*"
                    required
                  />
                  {noShowCallLog && (
                    <img src={noShowCallLog} alt="Call log preview" className="img-thumbnail mt-2 rounded-12" style={{ maxHeight: '100px' }} />
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-700 text-muted">3. GPS Coordinates Autodetected</label>
                  <div className="p-3 bg-light rounded-12 border font-monospace small">
                    🗺️ Lat: {workerLat || '19.0760'}° N, Lng: {workerLng || '72.8777'}° E
                  </div>
                </div>
              </div>
              <div className="modal-footer px-4 py-3 bg-light border-0 d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary flex-fill rounded-12 fw-bold" onClick={() => setShowNoShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger flex-fill rounded-12 fw-bold" style={{ background: '#ef4444', border: 'none' }} onClick={handleSubmitNoShowClaim}>Submit to Admin</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Worker Dispute Modal */}
      {showWorkerDisputeModal && disputeJob && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderBottom: 'none' }}>
                <h5 className="modal-title fw-800 m-0">⚖️ File a Dispute Case</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowWorkerDisputeModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-4">
                <div className="alert alert-warning py-2 px-3 rounded-12 mb-3" style={{ fontSize: '0.78rem' }}>
                  ⚠️ Disputes are reviewed by administrators. Uploading fraudulent proofs will lead to permanent account ban.
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-700 text-muted">Reason for Complaint</label>
                  <textarea
                    rows="3"
                    className="form-control rounded-12"
                    placeholder="Describe exactly what happened (e.g. client refused payment, extra labor demanded)"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-700 text-muted">Upload Photo Proof (Selfie/Work Screenshot)</label>
                  <input
                    type="file"
                    className="form-control rounded-12"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setDisputePhoto(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    accept="image/*"
                  />
                  {disputePhoto && (
                    <img src={disputePhoto} alt="Dispute preview" className="img-thumbnail mt-2 rounded-12" style={{ maxHeight: '100px' }} />
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-700 text-muted">Upload Call Log Screenshot</label>
                  <input
                    type="file"
                    className="form-control rounded-12"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setDisputeCallLog(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    accept="image/*"
                  />
                  {disputeCallLog && (
                    <img src={disputeCallLog} alt="Call log preview" className="img-thumbnail mt-2 rounded-12" style={{ maxHeight: '100px' }} />
                  )}
                </div>
              </div>
              <div className="modal-footer px-4 py-3 bg-light border-0 d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary flex-fill rounded-12 fw-bold" onClick={() => setShowWorkerDisputeModal(false)}>Cancel</button>
                <button type="button" className="btn btn-warning flex-fill rounded-12 fw-bold text-white" style={{ background: '#f59e0b', border: 'none' }} onClick={handleSubmitWorkerDispute}>Submit Dispute</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Classy Custom Alert Modal ── */}
      {classyAlert.show && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden text-center p-4 animate-scale-up" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="mb-3">
                {classyAlert.type === 'danger' || classyAlert.type === 'error' ? (
                  <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle animate-pulse" style={{ width: '64px', height: '64px' }}>
                    <i className="bi bi-exclamation-triangle-fill fs-2"></i>
                  </div>
                ) : (
                  <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle" style={{ width: '64px', height: '64px' }}>
                    <i className="bi bi-check-circle-fill fs-2"></i>
                  </div>
                )}
              </div>
              <h5 className="fw-800 text-dark mb-2" style={{ fontWeight: 800 }}>{classyAlert.title}</h5>
              <p className="text-muted px-2 mb-4" style={{ fontSize: '0.92rem', lineHeight: '1.5', fontWeight: 500 }}>
                {classyAlert.message}
              </p>
              <button 
                type="button" 
                className="btn btn-primary w-100 rounded-12 py-2.5 fw-bold"
                style={{ background: classyAlert.type === 'danger' || classyAlert.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                onClick={() => setClassyAlert({ ...classyAlert, show: false })}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7);
          }
          70% {
            transform: scale(1.1);
            box-shadow: 0 0 0 15px rgba(255, 59, 48, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 59, 48, 0);
          }
        }
      `}</style>
    </>
  );
};

export default WorkerDashboard;

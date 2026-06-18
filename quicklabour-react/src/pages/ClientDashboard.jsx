import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
import ChatWidget from '../components/ChatWidget';

const ClientDashboard = () => {
  const [dbJobs, setDbJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hireMessage, setHireMessage] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'past'
  const [walletBalance, setWalletBalance] = useState(Number(sessionStorage.getItem('userWalletBalance') || 0));
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [showScanQrModal, setShowScanQrModal] = useState(false);

  // Unified Wallet Hub Modal States
  const [showWalletHubModal, setShowWalletHubModal] = useState(false);
  const [activeWalletTab, setActiveWalletTab] = useState('scanner'); // 'scanner', 'add', 'withdraw', 'history'

  // Add Wallet Form States
  const [walletAmount, setWalletAmount] = useState('');
  const [walletMethod, setWalletMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [showCvc, setShowCvc] = useState(false);
  const [cardName, setCardName] = useState('');
  const [netBank, setNetBank] = useState('');
  const [netBankHolderName, setNetBankHolderName] = useState('');
  const [netBankCustomerId, setNetBankCustomerId] = useState('');
  const [isAddingMoney, setIsAddingMoney] = useState(false);

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

  // Scan QR / Pay Labor Form States
  const [workersList, setWorkersList] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPayingLabour, setIsPayingLabour] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedWorker, setScannedWorker] = useState(null);
  const [paymentNote, setPaymentNote] = useState('');
  const [scanState, setScanState] = useState('idle'); // 'idle', 'scanning', 'success'
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [walletSuccessMsg, setWalletSuccessMsg] = useState('');

  // Safety, Penalty, and Dispute states
  const [disputes, setDisputes] = useState(
    JSON.parse(localStorage.getItem('quicklabour_disputes') || '[]')
  );
  const [showClientDisputeModal, setShowClientDisputeModal] = useState(false);
  const [disputeJob, setDisputeJob] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePhoto, setDisputePhoto] = useState('');
  const [disputeCallLog, setDisputeCallLog] = useState('');

  const prevTotalBids = React.useRef(0);

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

  // Sync disputes regularly with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setDisputes(JSON.parse(localStorage.getItem('quicklabour_disputes') || '[]'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleOpenClientDispute = (job) => {
    setDisputeJob(job);
    setDisputeReason('');
    setDisputePhoto('');
    setDisputeCallLog('');
    setShowClientDisputeModal(true);
  };

  const handleSubmitClientDispute = () => {
    if (!disputeReason) {
      alert("Please provide the reason for your dispute.");
      return;
    }
    const newDispute = {
      _id: `disp_${Date.now()}`,
      jobId: disputeJob._id,
      jobTitle: disputeJob.title,
      clientName: profileName,
      workerName: disputeJob.hiredLabour?.fullName || 'Worker',
      submittedBy: 'client',
      reason: disputeReason,
      photo: disputePhoto || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=150&q=80',
      callLog: disputeCallLog || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=150&q=80',
      gpsLocation: '19.0760° N, 72.8777° E',
      status: 'Pending',
      createdAt: new Date().toLocaleString()
    };
    const updatedDisputes = [newDispute, ...disputes];
    setDisputes(updatedDisputes);
    localStorage.setItem('quicklabour_disputes', JSON.stringify(updatedDisputes));

    // Deduct client trust score slightly for filing dispute
    const clientId = sessionStorage.getItem('userId') || 'client-demo';
    const clientTrustScores = JSON.parse(localStorage.getItem('quicklabour_client_trust_scores') || '{}');
    const currentScore = clientTrustScores[clientId] !== undefined ? clientTrustScores[clientId] : 88;
    clientTrustScores[clientId] = Math.max(70, currentScore - 2);
    localStorage.setItem('quicklabour_client_trust_scores', JSON.stringify(clientTrustScores));

    setShowClientDisputeModal(false);
    alert("⚖️ Dispute registered successfully! QuickLabour Support will review photo evidence, GPS location, and call logs.");
  };

  // Profile reactive states
  const initialName = sessionStorage.getItem('userName') || 'Raj Malhotra';
  const [profileName, setProfileName] = useState(initialName);
  const [profilePhone, setProfilePhone] = useState(sessionStorage.getItem('userPhone') || '+91 98765 43210');
  const [profileAddress, setProfileAddress] = useState(sessionStorage.getItem('userAddress') || 'Mumbai, Maharashtra');
  const [profileAvatar, setProfileAvatar] = useState(() => {
    const stored = sessionStorage.getItem('userAvatar');
    if (!stored || stored.includes('images.unsplash.com/photo-1534528741775-53994a69daeb') || stored.includes('images.unsplash.com/photo-1540569014015-19a7be504e3a')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initialName)}&background=random&color=fff&size=150`;
    }
    return stored;
  });

  // Edit Profile Form States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(profileName);
    setEditPhone(profilePhone);
    setEditAddress(profileAddress);
    setEditAvatar(profileAvatar);
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
        avatar: editAvatar
      });
      setProfileName(res.fullName);
      setProfilePhone(res.phone);
      setProfileAddress(res.address);
      setProfileAvatar(res.avatar);
      
      // Sync with sessionStorage so header updates in real-time
      sessionStorage.setItem('userName', res.fullName);
      sessionStorage.setItem('userPhone', res.phone);
      sessionStorage.setItem('userAddress', res.address);
      sessionStorage.setItem('userAvatar', res.avatar);
      
      setShowEditModal(false);
    } catch (error) {
      alert('❌ Error updating profile: ' + error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      // Sort jobs by createdAt descending so that newer posts show at the top
      const sorted = [...(data || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDbJobs(sorted);

      // Calculate total bids across all active jobs
      let currentBidsCount = 0;
      sorted.forEach(j => {
        if (j.status === 'Waiting...') {
          currentBidsCount += (j.bidders || []).length;
        }
      });

      if (currentBidsCount > prevTotalBids.current) {
        // Play notification sound!
        playChime();
      }
      prevTotalBids.current = currentBidsCount;
    } catch (error) {
      console.error('Error fetching jobs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await api.getProfileLite();
      if (data.walletBalance !== undefined) {
        setWalletBalance(data.walletBalance);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchProfile();
  }, []);

  // Map backend jobs into dashboard format
  const formattedJobs = dbJobs.map(job => ({
    id: job._id,
    title: job.title,
    date: `Posted ${new Date(job.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}`,
    workersNeeded: job.workersNeeded || 1,
    status: job.status === 'Waiting...' ? 'Open for Bids' : (job.status === 'Accepted' ? 'Hired & In Progress' : (job.status === 'Completed' ? 'Work Completed' : 'Rejected')),
    rawStatus: job.status,
    hiredWorker: job.hiredWorker ? {
      name: job.hiredWorker.fullName,
      role: job.hiredWorker.occupation || 'Trade Worker',
      rate: `₹${job.money}/day`,
      avatar: job.hiredWorker.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&q=80'
    } : null,
    bidders: (job.bidders || []).map(b => ({
      id: b.worker?._id,
      name: b.worker?.fullName || 'Anonymous Worker',
      role: b.worker?.occupation || 'Trade Worker',
      rating: b.worker?.rating || '4.8',
      jobs: b.worker?.jobsCompleted || '12',
      rate: b.rate,
      avatar: b.worker?.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&q=80',
      skills: b.worker?.skills || []
    }))
  }));

  const activeJobs = formattedJobs.filter(job => job.rawStatus === 'Waiting...' || job.rawStatus === 'Accepted');
  const pastJobs = formattedJobs.filter(job => job.rawStatus === 'Completed' || job.rawStatus === 'Rejected');

  // Calculate dynamic stats from MongoDB jobs
  const stats = {
    jobsPosted: dbJobs.length,
    activeHires: dbJobs.filter(j => j.status === 'Accepted').length,
    spending: '₹' + dbJobs
      .filter(j => j.status === 'Accepted' || j.status === 'Completed')
      .reduce((acc, curr) => acc + (curr.money || 0), 0)
      .toLocaleString('en-IN')
  };

  // Rating & Payment Modal States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobAmount, setSelectedJobAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' or 'online'
  const [onlineMethod, setOnlineMethod] = useState('wallet'); // 'wallet', 'gpay', 'paytm', 'phonepe', 'card'
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const openCompleteModal = (jobId) => {
    const matchedJob = dbJobs.find(j => j._id === jobId);
    setSelectedJobId(jobId);
    setSelectedJobAmount(matchedJob ? (matchedJob.money || 0) : 0);
    setPaymentMode('cash');
    setOnlineMethod('wallet');
    setRatingValue(5);
    setReviewText('');
    setShowRatingModal(true);
  };

  const handleCompleteJobSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJobId) return;

    if (paymentMode === 'online' && onlineMethod === 'wallet' && Number(walletBalance) < selectedJobAmount) {
      alert(`⚠️ Insufficient Wallet Balance! Please add money to your wallet or choose another online option.`);
      return;
    }

    setSubmittingRating(true);
    try {
      await api.completeJob(selectedJobId, ratingValue, reviewText, paymentMode, onlineMethod);
      
      // Update client's wallet balance locally if paid via wallet
      if (paymentMode === 'online' && onlineMethod === 'wallet') {
        const newBalance = walletBalance - selectedJobAmount;
        setWalletBalance(newBalance);
        sessionStorage.setItem('userWalletBalance', newBalance);
      }

      setHireMessage(`🎉 Thank you! The job has been completed successfully and payment of ₹${selectedJobAmount} has been processed.`);
      setShowRatingModal(false);
      setSelectedJobId(null);
      fetchJobs();
      setTimeout(() => setHireMessage(''), 5000);
    } catch (error) {
      alert('❌ Error completing job: ' + error.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleApproveHire = async (jobId, workerId, workerName, rateValue) => {
    try {
      await api.hireWorker(jobId, workerId, rateValue);
      setHireMessage(`🎉 Successfully hired ${workerName} for your job!`);
      fetchJobs(); // Reload real data from MongoDB Atlas
      setTimeout(() => setHireMessage(''), 5000);
    } catch (error) {
      alert('❌ Error hiring worker: ' + error.message);
    }
  };

  const handleDeclineBid = async (jobId, bidderId) => {
    try {
      await api.declineBid(jobId, bidderId);
      fetchJobs(); // Reload real data from MongoDB Atlas
    } catch (error) {
      alert('❌ Error declining bid: ' + error.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("⚠️ Are you sure you want to delete this job request? If a worker was hired, their points will be refunded.")) {
      try {
        await api.deleteJob(jobId);
        fetchJobs(); // Refresh jobs list
        fetchProfile(); // Refresh profile
      } catch (error) {
        alert("❌ Failed to delete job request: " + error.message);
      }
    }
  };

  const getTransactions = () => {
    const userId = sessionStorage.getItem('userId') || 'demo';
    const key = `quicklabour_transactions_${userId}`;
    let txs = localStorage.getItem(key);
    if (!txs) {
      const initialTxs = [
        {
          id: 'tx_001',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString('en-IN'),
          type: 'Sign-up Bonus',
          amount: 20,
          isCredit: true,
          status: 'Completed'
        },
        {
          id: 'tx_002',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleString('en-IN'),
          type: 'Initial Deposit',
          amount: 1000,
          isCredit: true,
          status: 'Completed'
        }
      ];
      localStorage.setItem(key, JSON.stringify(initialTxs));
      return initialTxs;
    }
    return JSON.parse(txs);
  };

  const addTransaction = (type, amount, isCredit) => {
    const userId = sessionStorage.getItem('userId') || 'demo';
    const key = `quicklabour_transactions_${userId}`;
    const txs = getTransactions();
    const newTx = {
      id: `tx_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toLocaleString('en-IN'),
      type,
      amount,
      isCredit,
      status: 'Completed'
    };
    txs.unshift(newTx);
    localStorage.setItem(key, JSON.stringify(txs));
  };

  const handleOpenScanModal = async () => {
    try {
      const data = await api.getWorkers();
      setWorkersList(data || []);
      if (data && data.length > 0) {
        setSelectedWorkerId(data[0]._id);
      }
      setActiveWalletTab('scanner');
      setShowWalletHubModal(true);
    } catch (err) {
      alert("Error fetching workers: " + err.message);
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
      addTransaction('Wallet Deposit', Number(walletAmount), true);
      setWalletSuccessMsg(`🎉 Successfully recharged ₹${walletAmount} to your wallet!`);
      setWalletAmount('');
      setActiveWalletTab('history');
      setTimeout(() => setWalletSuccessMsg(''), 6000);
    } catch (err) {
      showClassyAlert("Failed to add money: " + err.message, "Deposit Failed");
    } finally {
      setIsAddingMoney(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
      showClassyAlert("Please enter a valid withdrawal amount.", "Invalid Input");
      return;
    }
    const amt = Number(withdrawAmount);
    if (amt > walletBalance) {
      showClassyAlert("Insufficient wallet balance for withdrawal.", "Insufficient Balance");
      return;
    }

    if (!showWithdrawOtp) {
      setIsWithdrawing(true);
      try {
        const res = await api.requestWithdrawalOtp(amt);
        setShowWithdrawOtp(true);
        setWithdrawOtp('');
        setWithdrawOtpNotification(`📱 SMS Received on ${sessionStorage.getItem('userPhone') || 'registered phone number'}: Your withdrawal verification OTP is: ${res.otp}`);
        setWalletSuccessMsg(`📱 A 4-digit verification code has been sent to your phone number.`);
        setTimeout(() => setWalletSuccessMsg(''), 5000);
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

      addTransaction('Withdrawal', amt, false);
      setWalletSuccessMsg(`💸 Withdrawal of ₹${amt} processed and transferred successfully!`);
      setWithdrawAmount('');
      setWithdrawOtp('');
      setShowWithdrawOtp(false);
      setWithdrawOtpNotification('');
      setAccountNo('');
      setIfscCode('');
      setUpiWithdrawId('');
      setActiveWalletTab('history');
      setTimeout(() => setWalletSuccessMsg(''), 6000);
    } catch (err) {
      showClassyAlert("Withdrawal verification failed: " + err.message, "Verification Failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handlePayLabourSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId) {
      showClassyAlert("Please select a worker to pay.", "Selection Required");
      return;
    }
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      showClassyAlert("Please enter a valid payment amount.", "Invalid Input");
      return;
    }
    if (Number(paymentAmount) > walletBalance) {
      showClassyAlert("Insufficient wallet balance. Please add money first.", "Insufficient Balance");
      return;
    }
    setIsPayingLabour(true);
    try {
      const res = await api.transferWalletMoney(selectedWorkerId, Number(paymentAmount));
      setWalletBalance(res.walletBalance);
      addTransaction(`Paid Worker (${workersList.find(w => w._id === selectedWorkerId)?.fullName || 'Labour'})`, Number(paymentAmount), false);
      setWalletSuccessMsg(`💸 ${res.message}`);
      setPaymentAmount('');
      setActiveWalletTab('history');
      setTimeout(() => setWalletSuccessMsg(''), 6000);
    } catch (err) {
      showClassyAlert("Payment failed: " + err.message, "Payment Failed");
    } finally {
      setIsPayingLabour(false);
    }
  };
  // ── Camera and QR Code Scanner helpers ──
  const playPaytmBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 150);
    } catch (e) {
      console.warn('Audio beep failed:', e);
    }
  };

  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, startTime, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(523.25, audioCtx.currentTime, 0.25); // C5
      playTone(659.25, audioCtx.currentTime + 0.15, 0.4); // E5
    } catch (e) {
      console.warn('Success chime failed:', e);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setScanState('scanning');
    setScannedWorker(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access failed, falling back to gorgeous simulation mode:', err);
    }

    // Auto-simulate scanning complete after 2.5 seconds to ensure awesome UX even without camera feed
    setTimeout(() => {
      setScanState(prev => {
        if (prev === 'scanning') {
          // Select the worker currently picked in the dropdown, or fallback to first worker in list
          const targetId = selectedWorkerId || (workersList[0] && workersList[0]._id);
          if (targetId) {
            handleSimulatedScanSuccess(targetId);
          }
        }
        return prev;
      });
    }, 2800);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setScanState('idle');
  };

  const handleSimulatedScanSuccess = (workerId) => {
    const worker = workersList.find(w => w._id === workerId);
    if (worker) {
      playPaytmBeep();
      setScannedWorker(worker);
      setSelectedWorkerId(workerId);
      setScanState('success');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
    }
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length; i += 4) {
      if (i > 0) formatted += ' ';
      formatted += value.substring(i, i + 4);
    }
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

  return (
    <>
      <div className="dashboard-section">
        <div className="container">

          {/* Success message banner */}
          {hireMessage && (
            <div className="alert alert-success alert-dismissible fade show rounded-16 shadow mb-4" role="alert">
              <strong className="fw-700">{hireMessage}</strong>
              <button type="button" className="btn-close" onClick={() => setHireMessage('')}></button>
            </div>
          )}

          {walletSuccessMsg && (
            <div className="alert alert-success alert-dismissible fade show rounded-16 shadow mb-4" role="alert" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #10b981' }}>
              <strong className="fw-700">{walletSuccessMsg}</strong>
              <button type="button" className="btn-close" onClick={() => setWalletSuccessMsg('')}></button>
            </div>
          )}

          {/* Dashboard Banner */}
          <div className="dashboard-banner reveal visible">
            <div>
              <h2>Welcome back, {profileName}! 👋</h2>
              <p>Manage your worker postings, evaluate bids, and track your ongoing projects.</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                onClick={handleOpenScanModal}
                className="btn btn-warning fw-800 d-flex align-items-center justify-content-center gap-1.5 px-3 py-2 text-dark border-0 rounded-12"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
                }}
              >
                <i className="bi bi-qr-code-scan"></i> Scan & Pay Fee
              </button>
              <Link
                to="/post-job"
                className="btn-hero-primary border-0 rounded-12 d-flex align-items-center justify-content-center gap-1.5 px-3 py-2"
                style={{ background: '#0d6efd', color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(13, 110, 253, 0.15)' }}
              >
                <i className="bi bi-plus-circle-fill"></i> Post a New Job
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <div className="dashboard-stat-card">
                <div className="stat-icon-wrapper blue">
                  <i className="bi bi-file-earmark-text-fill"></i>
                </div>
                <div>
                  <div className="stat-number">{stats.jobsPosted}</div>
                  <div className="stat-label">Jobs Posted</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="dashboard-stat-card">
                <div className="stat-icon-wrapper orange">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div>
                  <div className="stat-number">{stats.activeHires}</div>
                  <div className="stat-label">Active Hires</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="dashboard-stat-card">
                <div className="stat-icon-wrapper green">
                  <i className="bi bi-wallet2"></i>
                </div>
                <div>
                  <div className="stat-number">{stats.spending}</div>
                  <div className="stat-label">Total Spendings</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="dashboard-stat-card cursor-pointer" onClick={() => { setActiveWalletTab('scanner'); setShowWalletHubModal(true); }} style={{ cursor: 'pointer' }}>
                <div className="stat-icon-wrapper purple">
                  <i className="bi bi-wallet-fill"></i>
                </div>
                <div>
                  <div className="stat-number">₹{Number(walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="stat-label">Wallet Balance</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Panel */}
          <div className="row g-4">
            <div className="col-lg-8">
              {/* No-show Penalty Banner */}
              {(() => {
                const clientId = sessionStorage.getItem('userId') || 'client-demo';
                const clientPenalties = JSON.parse(localStorage.getItem('quicklabour_client_penalties') || '{}');
                const pendingPenalty = clientPenalties[clientId] || 0;
                if (pendingPenalty <= 0) return null;
                return (
                  <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 rounded-20 mb-4 border border-danger border-opacity-20">
                    <div className="text-start">
                      <strong className="text-danger d-block mb-1">⚠️ Outstanding No-Show Penalty: ₹{pendingPenalty}</strong>
                      <span className="small text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        A visit compensation fee was charged because you were unavailable for a previous job. You must pay this fee to post/hire future labors.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (walletBalance >= pendingPenalty) {
                          const newBalance = walletBalance - pendingPenalty;
                          setWalletBalance(newBalance);
                          sessionStorage.setItem('userWalletBalance', newBalance);
                          clientPenalties[clientId] = 0;
                          localStorage.setItem('quicklabour_client_penalties', JSON.stringify(clientPenalties));
                          alert(`✅ Penalty of ₹${pendingPenalty} successfully paid from your wallet!`);
                        } else {
                           setActiveWalletTab('add');
                           setShowWalletHubModal(true);
                        }
                      }}
                      className="btn btn-danger btn-sm rounded-12 fw-bold px-3 py-2 flex-shrink-0"
                    >
                      Pay from Wallet
                    </button>
                  </div>
                );
              })()}

              <div className="dashboard-card h-100">
                <div className="dashboard-card-title mb-1 pb-1">
                  <span>Manage Postings</span>
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
                    Active Requests
                    <span className="badge bg-primary-subtle text-primary ms-2 rounded-pill" style={{ fontSize: '0.75rem' }}>
                      {activeJobs.length}
                    </span>
                    {activeTab === 'active' && (
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
                    Past Postings / History
                    <span className="badge bg-secondary-subtle text-secondary ms-2 rounded-pill" style={{ fontSize: '0.75rem' }}>
                      {pastJobs.length}
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

                {/* Active Jobs Render */}
                {activeTab === 'active' && (
                  activeJobs.length > 0 ? (
                    <div className="dashboard-scroll-container">
                      {activeJobs.map(job => (
                        <div key={job.id} className="mb-5 border-bottom pb-4" style={{ borderBottomStyle: 'dashed' }}>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="fw-700 mb-1" style={{ color: '#0a2540' }}>{job.title}</h5>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="text-muted small fw-600"><i className="bi bi-calendar3 me-1"></i>{job.date}</span>
                                {job.workersNeeded > 1 && (
                                  <span className="badge bg-primary rounded-pill fw-bold" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                                    👥 {job.workersNeeded} Workers Requested
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge-status ${job.rawStatus === 'Accepted' ? 'success' : 'info'}`}>
                                {job.status}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                                style={{ width: '28px', height: '28px', border: 'none', background: 'rgba(220, 53, 69, 0.08)', cursor: 'pointer' }}
                                onClick={() => handleDeleteJob(job.id)}
                                title="Delete Job Posting"
                              >
                                <i className="bi bi-trash-fill" style={{ fontSize: '0.9rem', color: '#dc3545' }}></i>
                              </button>
                            </div>
                          </div>

                          {/* Matched Hired Worker Information */}
                          {job.hiredWorker ? (
                            <div className="mt-3 bg-success-subtle p-3 rounded-16 border border-success border-opacity-25 d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center gap-3">
                                <img src={job.hiredWorker.avatar} alt={job.hiredWorker.name} className="bidder-profile-img border-success" />
                                <div>
                                  <span className="small text-success fw-700"><i className="bi bi-check-circle-fill me-1"></i>Hired Worker Matched</span>
                                  <h6 className="mb-0 mt-1">{job.hiredWorker.name}</h6>
                                  <p className="text-muted small mt-1">{job.hiredWorker.role}</p>
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="fw-800 text-success mb-1" style={{ fontSize: '1.05rem' }}>{job.hiredWorker.rate}</div>
                                <div className="d-flex gap-2 justify-content-end align-items-center">
                                  <button className="btn-action-outline py-1 px-3" style={{ height: '34px', fontSize: '0.85rem' }}><i className="bi bi-chat-dots-fill me-1"></i>Message</button>
                                  {job.rawStatus === 'Accepted' && (
                                    <button
                                      className="btn btn-success py-1 px-3 fw-bold rounded-12 shadow-sm d-inline-flex align-items-center justify-content-center"
                                      style={{ height: '34px', fontSize: '0.85rem', background: 'linear-gradient(135deg,#198754,#146c43)', border: 'none' }}
                                      onClick={() => openCompleteModal(job.id)}
                                    >
                                      <i className="bi bi-check-circle-fill me-1"></i>Yes, Work is Done
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-100">
                              <div className="mt-3 bg-light p-3 rounded-16 border d-flex align-items-center gap-3">
                                <div className="spinner-grow spinner-grow-sm text-warning" role="status"></div>
                                <span className="text-muted small fw-bold">🔍 Matching and routing this request to nearby {job.title.split(' ')[0]}s...</span>
                              </div>

                              {job.bidders && job.bidders.length > 0 ? (
                                <div className="mt-4">
                                  <h6 className="fw-800 text-primary mb-3" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                                    <i className="bi bi-people-fill me-2"></i>Available Proposals &amp; Bids ({job.bidders.length})
                                  </h6>
                                  <div className="d-flex flex-column gap-3">
                                    {job.bidders.map((bidder) => (
                                      <div
                                        key={bidder.id}
                                        className="p-3 rounded-16 border bg-white shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-3"
                                        style={{ borderLeft: '4px solid #0d6efd', transition: 'all 0.2s' }}
                                      >
                                        <div className="d-flex align-items-center gap-3">
                                          <img
                                            src={bidder.avatar}
                                            alt={bidder.name}
                                            className="bidder-profile-img rounded-circle"
                                            style={{ width: '48px', height: '48px', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                                          />
                                          <div>
                                            <h6 className="mb-0 fw-800 text-dark" style={{ fontSize: '0.92rem', fontWeight: 800 }}>{bidder.name}</h6>
                                            <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
                                              {bidder.role} · ⭐ <span className="text-warning fw-bold">{bidder.rating}</span> ({bidder.jobs} jobs completed)
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-end d-flex align-items-center gap-3 ms-auto">
                                          <div className="fw-800 text-success" style={{ fontSize: '1.05rem', fontWeight: 800 }}>{bidder.rate}</div>
                                          <button
                                            className="btn btn-primary px-3 py-1.5 fw-bold rounded-12 shadow-sm border-0 transition text-white d-flex align-items-center justify-content-center"
                                            style={{ background: 'linear-gradient(135deg, #0d6efd, #6610f2)', fontSize: '0.82rem', height: '34px', cursor: 'pointer' }}
                                            onClick={() => handleApproveHire(job.id, bidder.id, bidder.name, bidder.rate)}
                                          >
                                            🤝 Hire Worker
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 bg-light p-3 rounded-16 border text-center text-muted small">
                                  <i className="bi bi-clock-history me-1"></i> Waiting for matching workers to place bids on your request...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-clipboard-x fs-1 mb-3 text-muted opacity-50 d-block"></i>
                      <h6 className="fw-700">No active service requests</h6>
                      <p className="small mb-0">Post a new job above to get started with nearby workers.</p>
                    </div>
                  )
                )}

                {/* Past Jobs Render */}
                {activeTab === 'past' && (
                  pastJobs.length > 0 ? (
                    <div className="dashboard-scroll-container">
                      {pastJobs.map(job => (
                        <div key={job.id} className="mb-5 border-bottom pb-4" style={{ borderBottomStyle: 'dashed' }}>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="fw-700 mb-1" style={{ color: '#0a2540' }}>{job.title}</h5>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="text-muted small fw-600"><i className="bi bi-calendar3 me-1"></i>{job.date}</span>
                                {job.workersNeeded > 1 && (
                                  <span className="badge bg-secondary rounded-pill fw-bold" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                                    👥 {job.workersNeeded} Workers Requested
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`badge-status ${job.rawStatus === 'Completed' ? 'success' : 'warning'}`}>
                              {job.status}
                            </span>
                          </div>

                          {/* Matched Hired Worker Information (Completed or Inactive) */}
                          {job.hiredWorker && (
                            <div className="mt-3 bg-light p-3 rounded-16 border d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center gap-3">
                                <img src={job.hiredWorker.avatar} alt={job.hiredWorker.name} className="bidder-profile-img" />
                                <div>
                                  <span className="small text-muted fw-700"><i className="bi bi-patch-check-fill me-1"></i>Served by Worker</span>
                                  <h6 className="mb-0 mt-1">{job.hiredWorker.name}</h6>
                                  <p className="text-muted small mt-1">{job.hiredWorker.role}</p>
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="fw-800 text-dark mb-1" style={{ fontSize: '1.05rem' }}>{job.hiredWorker.rate}</div>
                                <div className="d-flex flex-column align-items-end gap-2">
                                  <span className="badge bg-success-subtle text-success fw-700 rounded-pill px-3 py-1">Closed & Completed</span>
                                  <button
                                    onClick={() => handleOpenClientDispute(job)}
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
                      <h6 className="fw-700">No past postings</h6>
                      <p className="small mb-0">Your completed and closed jobs history will appear here.</p>
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
                            <span className={`badge ${disp.status === 'Resolved' ? 'bg-success' :
                                disp.status === 'Under Review' ? 'bg-primary' : 'bg-warning'
                              } text-white`}>
                              {disp.status}
                            </span>
                          </div>
                          <div className="bg-light p-3 rounded-16 border mt-2 text-start">
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
                <h5 className="fw-700 mb-3" style={{ color: '#0a2540' }}>Account Settings</h5>
                <div className="text-center py-3 border-bottom mb-3">
                  <img
                    src={profileAvatar}
                    alt={profileName}
                    className="rounded-circle border border-3 border-primary mb-3"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                  <h6 className="fw-800 mb-1">{profileName}</h6>
                  <span className="badge bg-success-subtle text-success fw-700">Verified Client</span>
                </div>
                <ul className="list-unstyled mb-2">
                  <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-envelope text-muted"></i> {sessionStorage.getItem('userEmail') || 'client@quicklabour.com'}</li>
                  <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-telephone text-muted"></i> {profilePhone}</li>
                  <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-geo-alt text-muted"></i> {profileAddress}</li>
                </ul>

                {/* Client Trust Score */}
                {(() => {
                  const clientId = sessionStorage.getItem('userId') || 'client-demo';
                  const clientTrustScores = JSON.parse(localStorage.getItem('quicklabour_client_trust_scores') || '{}');
                  const currentScore = clientTrustScores[clientId] !== undefined ? clientTrustScores[clientId] : 88;
                  return (
                    <div className="mt-3 p-3 bg-light rounded-16 border text-start mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-700 text-muted">🛡️ Safety Trust Score</span>
                        <span className="badge bg-primary text-white fw-800">{currentScore} / 100</span>
                      </div>
                      <div className="progress mb-2" style={{ height: '6px' }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${currentScore}%` }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                        <span>Completed Hires: 14</span>
                        <span>Cancellation Rate: 0%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Verification Levels */}
                <div className="mt-2.5 p-3 bg-light rounded-16 border text-start mb-3">
                  <span className="small fw-700 text-muted d-block mb-2">✅ Verification Badge</span>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 d-flex align-items-center gap-1 small" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-check-circle-fill"></i> Phone OTP
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 d-flex align-items-center gap-1 small" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-check-circle-fill"></i> Email Checked
                    </span>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20 d-flex align-items-center gap-1 small" style={{ fontSize: '0.7rem' }}>
                      Aadhaar (Optional)
                    </span>
                  </div>
                </div>
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

              <div className="dashboard-card">
                <h5 className="fw-700 mb-3" style={{ color: '#0a2540' }}>Hiring Guidelines</h5>
                <div className="small text-muted mb-3" style={{ lineHeight: '1.6' }}>
                  QuickLabour recommends reviewing worker ratings and feedback prior to hiring. Ensure that the daily wages and materials costs are discussed directly over the chat system.
                </div>
                <a href="#" className="small fw-700 text-decoration-none" style={{ color: '#0d6efd' }}>Learn more about hiring policy $\rightarrow$</a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Floating Chat Widget ── */}
      <ChatWidget
        currentUserId={sessionStorage.getItem('userId') || 'client-demo'}
        currentUserName={profileName}
        currentUserRole="client"
        currentUserAvatar={profileAvatar}
      />

      {/* ── Rate and Complete Job Modal ── */}
      {showRatingModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden">

              {/* Modal Header */}
              <div className="modal-header text-white px-4 py-3 border-0" style={{ background: 'linear-gradient(135deg, #198754, #146c43)', borderBottom: 'none' }}>
                <h5 className="modal-title fw-800" style={{ fontWeight: 800 }}><i className="bi bi-check-circle-fill me-2"></i>Job Completed Done!</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRatingModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCompleteJobSubmit}>
                <div className="modal-body p-4">
                  <div className="text-center mb-3">
                    <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle d-inline-flex mb-2" style={{ fontSize: '1.8rem', width: '56px', height: '56px', alignItems: 'center', justifyContent: 'center' }}>
                      👷‍♂️
                    </div>
                    <h6 className="fw-800 text-dark mb-1" style={{ fontWeight: 800 }}>Rate Your Worker</h6>
                    <p className="text-muted small">Please provide your rating and valuable feedback for the matched worker.</p>
                  </div>

                  {/* Star Rating Select */}
                  <div className="mb-4 text-center">
                    <label className="small fw-700 text-muted d-block mb-2" style={{ letterSpacing: '0.05rem' }}>SELECT RATING STAR</label>
                    <div className="d-flex justify-content-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={{ cursor: 'pointer', fontSize: '2.5rem', transition: 'all 0.15s', userSelect: 'none' }}
                          className={star <= ratingValue ? 'text-warning' : 'text-secondary opacity-25'}
                          onClick={() => setRatingValue(star)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="badge bg-warning bg-opacity-10 text-warning fw-800 mt-2 px-3 py-1 rounded-pill" style={{ fontSize: '0.8rem' }}>
                      {ratingValue === 5 ? '⭐⭐⭐⭐⭐ Excellent (5/5)' :
                        ratingValue === 4 ? '⭐⭐⭐⭐ Very Good (4/5)' :
                          ratingValue === 3 ? '⭐⭐⭐ Good (3/5)' :
                            ratingValue === 2 ? '⭐⭐ Fair (2/5)' : '⭐ Poor (1/5)'}
                    </span>
                  </div>

                   {/* Feedback Input */}
                  <div className="mb-4">
                    <label htmlFor="reviewText" className="form-label small fw-700 text-muted">Feedback / Comments</label>
                    <textarea
                      className="form-control rounded-12 p-3"
                      id="reviewText"
                      rows="3"
                      placeholder="e.g. He completed the job perfectly, was extremely polite, and clean! Highly recommended..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      style={{ resize: 'none', border: '1.5px solid #cbd5e1' }}
                    ></textarea>
                  </div>

                  {/* Payment Method Section */}
                  <div className="mb-4 border-top pt-3">
                    <label className="small fw-700 text-muted d-block mb-3" style={{ letterSpacing: '0.05rem' }}>SELECT PAYMENT OPTION</label>
                    <div className="row g-3">
                      <div className="col-6">
                        <div 
                          className={`p-3 border rounded-16 text-center cursor-pointer transition-all ${paymentMode === 'cash' ? 'border-success bg-success bg-opacity-10 text-success' : 'bg-white'}`}
                          style={{ cursor: 'pointer', borderWidth: paymentMode === 'cash' ? '2px' : '1px' }}
                          onClick={() => setPaymentMode('cash')}
                        >
                          <div className="fs-3 mb-1">💵</div>
                          <div className="fw-800" style={{ fontSize: '0.85rem' }}>Pay by Cash</div>
                          <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Direct to worker</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div 
                          className={`p-3 border rounded-16 text-center cursor-pointer transition-all ${paymentMode === 'online' ? 'border-primary bg-primary bg-opacity-10 text-primary' : 'bg-white'}`}
                          style={{ cursor: 'pointer', borderWidth: paymentMode === 'online' ? '2px' : '1px' }}
                          onClick={() => setPaymentMode('online')}
                        >
                          <div className="fs-3 mb-1">📱</div>
                          <div className="fw-800" style={{ fontSize: '0.85rem' }}>Pay Online</div>
                          <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Auto-credit wallet</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {paymentMode === 'online' && (
                    <div className="mb-4 p-3 rounded-20 bg-light border border-opacity-50 animate-fade-in">
                      <label className="small fw-700 text-muted d-block mb-3" style={{ letterSpacing: '0.05rem' }}>CHOOSE ONLINE PAYMENT TYPE</label>
                      <div className="d-flex flex-column gap-2">
                        {/* Wallet option */}
                        <div 
                          className={`d-flex align-items-center justify-content-between p-3 rounded-12 border bg-white cursor-pointer transition-all ${onlineMethod === 'wallet' ? 'border-success bg-success bg-opacity-10' : ''}`}
                          style={{ cursor: 'pointer', borderWidth: onlineMethod === 'wallet' ? '2px' : '1px' }}
                          onClick={() => setOnlineMethod('wallet')}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-wallet2 text-success fs-4"></i>
                            <div>
                              <div className="fw-700 text-dark" style={{ fontSize: '0.85rem' }}>QuickLabour Wallet</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>Balance: ₹{Number(walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            </div>
                          </div>
                          {onlineMethod === 'wallet' ? <i className="bi bi-check-circle-fill text-success fs-5"></i> : <div className="rounded-circle border" style={{ width: '20px', height: '20px' }}></div>}
                        </div>

                        {/* GPay option */}
                        <div 
                          className={`d-flex align-items-center justify-content-between p-3 rounded-12 border bg-white cursor-pointer transition-all ${onlineMethod === 'gpay' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor: 'pointer', borderWidth: onlineMethod === 'gpay' ? '2px' : '1px' }}
                          onClick={() => setOnlineMethod('gpay')}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-google text-danger fs-4"></i>
                            <div>
                              <div className="fw-700 text-dark" style={{ fontSize: '0.85rem' }}>Google Pay (UPI)</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>Pay instantly using GPay sandbox</div>
                            </div>
                          </div>
                          {onlineMethod === 'gpay' ? <i className="bi bi-check-circle-fill text-primary fs-5"></i> : <div className="rounded-circle border" style={{ width: '20px', height: '20px' }}></div>}
                        </div>

                        {/* Paytm option */}
                        <div 
                          className={`d-flex align-items-center justify-content-between p-3 rounded-12 border bg-white cursor-pointer transition-all ${onlineMethod === 'paytm' ? 'border-info bg-info bg-opacity-10' : ''}`}
                          style={{ cursor: 'pointer', borderWidth: onlineMethod === 'paytm' ? '2px' : '1px' }}
                          onClick={() => setOnlineMethod('paytm')}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-phone-fill text-info fs-4"></i>
                            <div>
                              <div className="fw-700 text-dark" style={{ fontSize: '0.85rem' }}>Paytm UPI</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>Pay securely via Paytm UPI sandbox</div>
                            </div>
                          </div>
                          {onlineMethod === 'paytm' ? <i className="bi bi-check-circle-fill text-info fs-5"></i> : <div className="rounded-circle border" style={{ width: '20px', height: '20px' }}></div>}
                        </div>

                        {/* PhonePe option */}
                        <div 
                          className={`d-flex align-items-center justify-content-between p-3 rounded-12 border bg-white cursor-pointer transition-all ${onlineMethod === 'phonepe' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor: 'pointer', borderWidth: onlineMethod === 'phonepe' ? '2px' : '1px' }}
                          onClick={() => setOnlineMethod('phonepe')}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-arrow-right-circle-fill text-primary fs-4"></i>
                            <div>
                              <div className="fw-700 text-dark" style={{ fontSize: '0.85rem' }}>PhonePe UPI</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>Instant authorization via PhonePe</div>
                            </div>
                          </div>
                          {onlineMethod === 'phonepe' ? <i className="bi bi-check-circle-fill text-primary fs-5"></i> : <div className="rounded-circle border" style={{ width: '20px', height: '20px' }}></div>}
                        </div>
                      </div>

                      {onlineMethod === 'wallet' && Number(walletBalance) < selectedJobAmount && (
                        <div className="alert alert-warning mt-3 mb-0 rounded-12 d-flex align-items-center gap-2 py-2" style={{ fontSize: '0.8rem' }}>
                          <i className="bi bi-exclamation-triangle-fill"></i>
                          <span>Insufficient Balance! You need ₹{selectedJobAmount} (Current: ₹{walletBalance}).</span>
                        </div>
                      )}

                      <div className="mt-3 text-center border-top pt-2">
                        <span className="small text-muted fw-700">Amount to Transfer: </span>
                        <span className="fw-800 text-success" style={{ fontSize: '1.2rem' }}>₹{selectedJobAmount}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer px-4 py-3 bg-light border-0 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill rounded-12 py-2 fw-bold"
                    onClick={() => setShowRatingModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success flex-fill rounded-12 py-2 fw-bold"
                    style={{ background: 'linear-gradient(135deg, #198754, #146c43)', border: 'none' }}
                    disabled={submittingRating}
                  >
                    {submittingRating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : 'Submit Feedback & Complete'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

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
                <div className="modal-body px-4 py-4">
                  {/* Avatar Upload Container */}
                  <div className="text-center mb-4">
                    <div
                      className="position-relative d-inline-block"
                      style={{ cursor: 'pointer' }}
                      onClick={() => document.getElementById('clientAvatarUploadInput').click()}
                    >
                      <img
                        src={editAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
                        alt="Avatar Preview"
                        className="rounded-circle border border-4 border-primary shadow-sm"
                        style={{ width: '100px', height: '100px', objectFit: 'cover', transition: 'all 0.2s' }}
                      />
                      <div
                        className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow"
                        style={{ width: '32px', height: '32px', border: '2px solid #ffffff' }}
                      >
                        <i className="bi bi-camera-fill" style={{ fontSize: '0.85rem' }}></i>
                      </div>
                      <input
                        type="file"
                        id="clientAvatarUploadInput"
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
                        className="btn btn-outline-primary rounded-12 d-flex align-items-center gap-1 px-3"
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

      {/* ── Unified Wallet Hub Modal ── */}
      {showWalletHubModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: '#ffffff' }}>
              
              {/* Header */}
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', borderBottom: 'none' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 p-2 bg-white bg-opacity-20 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                    <i className="bi bi-wallet2 fs-4"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-800 m-0 text-white">Wallet Hub</h5>
                    <p className="mb-0 text-white-50 small">Manage your funds, pay workers, and track transactions.</p>
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
                  <i className="bi bi-qr-code-scan"></i> Scanner / Pay
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
                
                {/* 1. SCANNER / PAY TAB */}
                {activeWalletTab === 'scanner' && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedWorkerId) {
                      showClassyAlert("Please select a worker to pay.", "Selection Required");
                      return;
                    }
                    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
                      showClassyAlert("Please enter a valid payment amount.", "Invalid Input");
                      return;
                    }
                    if (Number(paymentAmount) > walletBalance) {
                      showClassyAlert("Insufficient wallet balance. Please add money first.", "Insufficient Balance");
                      return;
                    }
                    setIsPayingLabour(true);
                    try {
                      const res = await api.transferWalletMoney(selectedWorkerId, Number(paymentAmount));
                      setWalletBalance(res.walletBalance);
                      
                      // Play Paytm-style success tone!
                      playSuccessChime();

                      addTransaction(`Paid Worker (${workersList.find(w => w._id === selectedWorkerId)?.fullName || 'Labour'})`, Number(paymentAmount), false);
                      
                      // Format Paytm success message
                      setWalletSuccessMsg(`💸 Sent ₹${paymentAmount} to ${workersList.find(w => w._id === selectedWorkerId)?.fullName || 'Worker'} successfully!`);
                      
                      setPaymentAmount('');
                      setPaymentNote('');
                      setScanState('idle');
                      setScannedWorker(null);
                      setActiveWalletTab('history');
                      setTimeout(() => setWalletSuccessMsg(''), 7000);
                    } catch (err) {
                      showClassyAlert("Payment failed: " + err.message, "Payment Failed");
                    } finally {
                      setIsPayingLabour(false);
                    }
                  }} className="animate-scale-up">
                    
                    {scanState !== 'success' ? (
                      <>
                        {/* ── Viewport Container ── */}
                        <div className="position-relative d-flex flex-column justify-content-center align-items-center bg-dark rounded-24 overflow-hidden mb-4 shadow" style={{ height: '200px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {scanState === 'scanning' ? (
                            <>
                              <video 
                                ref={videoRef} 
                                className="position-absolute w-100 h-100" 
                                style={{ objectFit: 'cover', zIndex: 1 }} 
                                playsInline 
                                muted 
                              />
                              {/* Overlay Scan Viewfinder */}
                              <div className="position-absolute d-flex justify-content-center align-items-center w-100 h-100" style={{ zIndex: 2, background: 'rgba(0,0,0,0.35)' }}>
                                <div className="position-relative border border-success border-3 rounded" style={{ width: '120px', height: '120px', boxShadow: '0 0 0 2000px rgba(0, 0, 0, 0.45)' }}>
                                  {/* Laser Beam */}
                                  <div className="position-absolute bg-success w-100" style={{
                                    height: '2.5px',
                                    left: 0,
                                    top: 0,
                                    animation: 'scanLine 2s infinite ease-in-out',
                                    boxShadow: '0 0 8px #198754'
                                  }}></div>
                                </div>
                              </div>
                              <button 
                                type="button" 
                                className="btn btn-danger btn-sm position-absolute rounded-pill px-3 py-1.5 fw-bold" 
                                style={{ bottom: '15px', zIndex: 3, fontSize: '0.75rem' }}
                                onClick={stopCamera}
                              >
                                <i className="bi bi-x-circle me-1"></i> Stop Scanner
                              </button>
                            </>
                          ) : (
                            // IDLE STATE
                            <div className="text-center p-4 d-flex flex-column align-items-center justify-content-center w-100 h-100" style={{ zIndex: 2 }}>
                              <div className="bg-primary bg-opacity-10 text-primary rounded-circle mb-3 d-flex align-items-center justify-content-center animate-pulse" style={{ width: '56px', height: '56px' }}>
                                <i className="bi bi-qr-code-scan fs-3"></i>
                              </div>
                              <button 
                                type="button" 
                                className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm"
                                onClick={startCamera}
                              >
                                <i className="bi bi-camera-fill me-2"></i> Start Camera Scanner
                              </button>
                              <div className="text-white-50 small mt-2 fw-semibold" style={{ fontSize: '0.75rem' }}>
                                Scan worker's QR to make payment instantly
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Select dropdown helper */}
                        <div className="mb-3 text-start">
                          <label className="form-label small fw-700 text-muted">Select Labour Profile (QR Link)</label>
                          <div className="d-flex gap-2">
                            <select
                              className="form-select rounded-12 p-2.5 text-dark"
                              value={selectedWorkerId}
                              onChange={(e) => {
                                setSelectedWorkerId(e.target.value);
                                if (e.target.value) {
                                  handleSimulatedScanSuccess(e.target.value);
                                }
                              }}
                              required
                            >
                              <option value="">Choose Worker QR...</option>
                              {workersList.map((worker) => (
                                <option key={worker._id} value={worker._id}>
                                  {worker.fullName} ({worker.occupation || 'Labour'})
                                </option>
                              ))}
                            </select>
                            {selectedWorkerId && scanState === 'scanning' && (
                              <button 
                                type="button" 
                                className="btn btn-success rounded-12 px-3 fw-bold"
                                onClick={() => handleSimulatedScanSuccess(selectedWorkerId)}
                              >
                                Scan
                              </button>
                            )}
                          </div>
                        </div>
                        <style>{`
                          @keyframes scanLine {
                            0%, 100% { top: 0%; }
                            50% { top: 100%; }
                          }
                        `}</style>
                      </>
                    ) : (
                      /* ── Paytm Style Payment Confirmation Screen ── */
                      <div className="paytm-style-pay-screen text-center animate-scale-up p-2">
                        <div className="d-inline-flex position-relative mb-3 bg-white rounded-circle p-1 shadow-sm">
                          <img
                            src={scannedWorker.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&q=80'}
                            alt={scannedWorker.fullName}
                            className="rounded-circle border border-2 border-success p-0.5"
                            style={{ width: '72px', height: '72px', objectFit: 'cover' }}
                          />
                          <span className="position-absolute bg-success text-white rounded-circle d-flex align-items-center justify-content-center border border-white" style={{ bottom: '4px', right: '4px', width: '22px', height: '22px', fontSize: '0.65rem' }}>
                            <i className="bi bi-check-lg"></i>
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="d-flex align-items-center justify-content-center gap-1.5 mb-1">
                            <h5 className="fw-800 text-dark mb-0" style={{ fontSize: '1.25rem', fontWeight: 800 }}>{scannedWorker.fullName}</h5>
                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-0.5 small fw-bold" style={{ fontSize: '0.62rem' }}>
                              Verified Payee
                            </span>
                          </div>
                          <p className="text-muted small mb-0 font-monospace">UPI: {scannedWorker.phone || '9999911111'}@quicklabour</p>
                          <p className="text-muted small mb-0">{scannedWorker.occupation || 'Trade Worker'} · ID: ...{scannedWorker._id.substring(scannedWorker._id.length - 8)}</p>
                        </div>

                        {/* Paytm Numeric Amount Box */}
                        <div className="py-4 border-top border-bottom mb-4 bg-light rounded-20 px-3 text-center">
                          <label className="form-label small fw-bold text-muted d-block mb-1">Amount to Transfer</label>
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            <span className="fw-800 text-dark" style={{ fontSize: '2rem', fontWeight: 800 }}>₹</span>
                            <input
                              type="number"
                              className="border-0 bg-transparent text-center fw-800 text-dark p-0 focus-none"
                              style={{ fontSize: '2.5rem', width: '180px', outline: 'none', fontWeight: 800 }}
                              placeholder="0"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              required
                              min="1"
                              autoFocus
                            />
                          </div>
                          <div className="small text-muted mt-2">
                            Wallet Balance: <strong className="text-dark">₹{walletBalance.toFixed(2)}</strong>
                          </div>
                        </div>

                        {/* Optional payment note */}
                        <div className="mb-4 text-start">
                          <label className="form-label small fw-700 text-muted">Add Message / Remarks (Optional)</label>
                          <input 
                            type="text" 
                            className="form-control rounded-12 py-2" 
                            placeholder="e.g. Payment for painting task" 
                            value={paymentNote}
                            onChange={(e) => setPaymentNote(e.target.value)}
                          />
                        </div>

                        <div className="d-flex flex-column gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary w-100 rounded-16 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #0d6efd, #0b5ed7)', border: 'none', fontSize: '1.05rem' }}
                            disabled={isPayingLabour || !paymentAmount}
                          >
                            {isPayingLabour ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                Sending Securely...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-shield-fill-check"></i> Pay Securely ₹{paymentAmount || '0'}
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            className="btn btn-link text-decoration-none small text-secondary fw-700 mt-1"
                            onClick={() => {
                              setScanState('idle');
                              setScannedWorker(null);
                              setPaymentAmount('');
                              setPaymentNote('');
                            }}
                          >
                            <i className="bi bi-arrow-left me-1"></i> Scan Another QR Code
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
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
                          placeholder="e.g. 9876543210@paytm"
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
                            onChange={(e) => setCardName(toTitleCase(e.target.value))}
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
                            style={{ letterSpacing: '0.5rem', height: '54px', border: '2px solid #cbd5e1', borderRadius: '12px' }}
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
                          {getTransactions().length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center py-4 text-muted">
                                <i className="bi bi-info-circle me-1"></i> No transactions recorded yet.
                              </td>
                            </tr>
                          ) : (
                            getTransactions().map((tx) => (
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

      {/* Client Dispute Modal */}
      {showClientDisputeModal && disputeJob && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden" style={{ background: '#ffffff' }}>
              <div className="modal-header text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderBottom: 'none' }}>
                <h5 className="modal-title fw-800 m-0">⚖️ File a Dispute Case</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowClientDisputeModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-4 text-start">
                <div className="alert alert-warning py-2 px-3 rounded-12 mb-3" style={{ fontSize: '0.78rem' }}>
                  ⚠️ Disputes are reviewed by administrators. Uploading fraudulent proofs will lead to permanent account suspension.
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-700 text-muted">Reason for Complaint</label>
                  <textarea
                    rows="3"
                    className="form-control rounded-12"
                    placeholder="Describe exactly what happened (e.g. worker demanded extra cash, no-show, unsafe behavior)"
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
                    onChange={(e) => setDisputePhoto(URL.createObjectURL(e.target.files[0]))}
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
                    onChange={(e) => setDisputeCallLog(URL.createObjectURL(e.target.files[0]))}
                    accept="image/*"
                  />
                  {disputeCallLog && (
                    <img src={disputeCallLog} alt="Call log preview" className="img-thumbnail mt-2 rounded-12" style={{ maxHeight: '100px' }} />
                  )}
                </div>
              </div>
              <div className="modal-footer px-4 py-3 bg-light border-0 d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary flex-fill rounded-12 fw-bold" onClick={() => setShowClientDisputeModal(false)}>Cancel</button>
                <button type="button" className="btn btn-warning flex-fill rounded-12 fw-bold text-white" style={{ background: '#f59e0b', border: 'none' }} onClick={handleSubmitClientDispute}>Submit Dispute</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Classy Custom Alert Modal ── */}
      {classyAlert.show && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content rounded-24 shadow border-0 overflow-hidden text-center p-4 animate-scale-up" style={{ background: '#ffffff' }}>
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
    </>
  );
};

export default ClientDashboard;

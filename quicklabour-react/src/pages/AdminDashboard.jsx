import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const parseGpsCoords = (gpsStr) => {
    if (!gpsStr) return null;
    const match = gpsStr.match(/Lat:\s*([-\d.]+)[^\d]*Lng:\s*([-\d.]+)/i);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    return null;
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

  const getAvatarUrl = (avatar, name) => {
    if (!avatar || 
        avatar.includes('images.unsplash.com/photo-1534528741775-53994a69daeb') || 
        avatar.includes('images.unsplash.com/photo-1506794778202-cad84cf45f1d')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff&size=150`;
    }
    return avatar;
  };

  const [stats, setStats] = useState({
    clientsCount: 0,
    workersCount: 0,
    jobsCount: 0,
    contactsCount: 0,
    reviewsCount: 0,
    totalBudget: 0,
  });

  const [clients, setClients] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [walletBalance, setWalletBalance] = useState(Number(sessionStorage.getItem('userWalletBalance') || 0));
  const [adminSosAlerts, setAdminSosAlerts] = useState([]);

  // Admin Wallet Hub Sub-Tabs and forms states
  const [activeWalletTab, setActiveWalletTab] = useState('history'); // 'scanner', 'add', 'withdraw', 'history'
  const [walletAmount, setWalletAmount] = useState('');
  const [walletMethod, setWalletMethod] = useState('upi');
  const [netBank, setNetBank] = useState('');
  const [netBankHolderName, setNetBankHolderName] = useState('');
  const [netBankCustomerId, setNetBankCustomerId] = useState('');
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [actionAlert, setActionAlert] = useState('');

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const [upiWithdrawId, setUpiWithdrawId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawOtp, setShowWithdrawOtp] = useState(false);
  const [withdrawOtp, setWithdrawOtp] = useState('');
  const [withdrawOtpNotification, setWithdrawOtpNotification] = useState('');
  const [classyAlert, setClassyAlert] = useState({ show: false, title: '', message: '', type: 'error' });
  const showClassyAlert = (message, title = 'Alert', type = 'danger') => {
    setClassyAlert({ show: true, title, message, type });
  };

  const getTransactions = () => {
    const key = `quicklabour_transactions_admin`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  };

  const addTransaction = (type, amount, isCredit, status = 'Success', details = {}) => {
    const key = `quicklabour_transactions_admin`;
    const txs = getTransactions();
    const newTx = {
      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      type,
      amount,
      isCredit,
      status,
      date: new Date().toLocaleString(),
      ...details
    };
    txs.unshift(newTx);
    localStorage.setItem(key, JSON.stringify(txs));
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
      addTransaction('Admin Deposit', Number(walletAmount), true, 'Success', { method: walletMethod });
      setActionAlert(`🎉 Successfully added ₹${walletAmount} to Admin Wallet!`);
      setWalletAmount('');
      setTimeout(() => setActionAlert(''), 6000);
    } catch (err) {
      showClassyAlert("Failed to add money: " + err.message, "Deposit Failed");
    } finally {
      setIsAddingMoney(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
      showClassyAlert("Please enter a valid amount.", "Invalid Input");
      return;
    }
    const amt = Number(withdrawAmount);
    if (amt > walletBalance) {
      showClassyAlert("Insufficient wallet balance.", "Insufficient Balance");
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

      addTransaction(`Withdrawal (${withdrawMethod.toUpperCase()})`, amt, false, 'Success', 
        withdrawMethod === 'bank' ? { bankName, accountNo, ifscCode } : { upiId: upiWithdrawId }
      );

      setActionAlert(`💸 Withdrawal of ₹${amt} processed successfully!`);
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

  // Modal state for viewing documents
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedCredentials, setSelectedCredentials] = useState(null);



  // Password change states within credentials auditor modal
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPlaintextInAuditor, setShowPlaintextInAuditor] = useState(false);

  // Add Admin modal states
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    avatar: '',
    roleType: 'super_admin',
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [disputes, setDisputes] = useState([]);

  const fetchDisputes = async () => {
    try {
      const data = await api.getAdminDisputes();
      setDisputes(data);
    } catch (err) {
      console.error('Error fetching disputes:', err);
    }
  };

  const handleResolveDispute = async (disputeId, decision) => {
    try {
      const res = await api.resolveAdminDispute(disputeId, decision);
      setDisputes(prev => prev.map(d => d._id === disputeId ? res.dispute : d));
      showClassyAlert(`Dispute resolved successfully. Decision: "${decision}" recorded.`, 'Dispute Resolved', 'success');
    } catch (err) {
      showClassyAlert(`Failed to resolve dispute: ${err.message}`, 'Resolution Failed', 'danger');
    }
  };

  const handleDeleteDispute = async (disputeId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this dispute record? This action is irreversible.')) {
      return;
    }
    try {
      await api.deleteAdminDispute(disputeId);
      setDisputes(prev => prev.filter(d => d._id !== disputeId));
      showClassyAlert('Dispute record deleted successfully.', 'Dispute Deleted', 'success');
    } catch (err) {
      showClassyAlert(`Failed to delete dispute: ${err.message}`, 'Deletion Failed', 'danger');
    }
  };

  const fetchAdminSosAlerts = async () => {
    try {
      const data = await api.getAdminSos();
      setAdminSosAlerts(data);
    } catch (err) {
      console.error('Error fetching admin SOS alerts:', err);
    }
  };

  const handleVerifySosAlert = async (alertId, status) => {
    try {
      await api.verifyAdminSos(alertId, status);
      showClassyAlert(`SOS alert status updated to: ${status}. 50% tokens refund has been processed if verified.`, 'SOS Verification Complete', 'success');
      await fetchAdminSosAlerts();
    } catch (err) {
      showClassyAlert("Failed to verify SOS alert: " + err.message, "Action Failed", "danger");
    }
  };



  const [userPermissions, setUserPermissions] = useState(() => {
    try {
      const stored = sessionStorage.getItem('userPermissions');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const hasPermission = (tab) => {
    // Root admin has total access
    const email = sessionStorage.getItem('userEmail');
    if (email === 'admin@quicklabour.com') return true;
    if (tab === 'sos') {
      return userPermissions.includes('overview') || userPermissions.includes('admins') || userPermissions.includes('disputes');
    }
    const isAllowed = tab === 'disputes'
      ? (userPermissions.includes('admins') || userPermissions.includes('overview') || userPermissions.includes('disputes'))
      : userPermissions.includes(tab);
    return isAllowed;
  };

  const isSuperAdmin = hasPermission('admins');

  useEffect(() => {
    // Check authorization: must be logged in as admin
    const userRole = sessionStorage.getItem('userRole');
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
      return;
    }

    fetchAdminData();
  }, [navigate]);

  useEffect(() => {
    const tabsList = ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts', 'admins', 'disputes', 'sos'];
    const allowedTabs = tabsList.filter(t => hasPermission(t));
    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [activeTab, userPermissions]);

  const handleRestoreDefaultPassword = async () => {
    let defaultPwd = '';
    if (selectedCredentials.role === 'Client') {
      defaultPwd = 'client123';
    } else if (selectedCredentials.role === 'Worker / Labour') {
      defaultPwd = 'worker123';
    } else {
      defaultPwd = 'admin123';
    }

    if (!window.confirm(`Are you sure you want to restore this user's password back to the default original plaintext password ('${defaultPwd}')?`)) {
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await api.put('/admin/reset-password', {
        userId: selectedCredentials.id,
        role: selectedCredentials.role,
        newPassword: defaultPwd,
      });

      setSelectedCredentials({
        ...selectedCredentials,
        password: '[Password restored to default plaintext. Refresh directory to load new Bcrypt hash]'
      });

      showClassyAlert(`Password restored to default original password successfully!\n\nPlaintext Password: "${defaultPwd}"`, 'Password Restored', 'success');
      fetchAdminData();
    } catch (err) {
      showClassyAlert(err.message || 'Failed to restore default password', 'Action Failed', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const closeAuditorModal = () => {
    setSelectedCredentials(null);
    setShowPlaintextInAuditor(false);
  };

  const isFetchingRef = useRef(false);

  const fetchAdminData = async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isSilent) setLoading(true);
    setError('');
    try {
      // Sync permissions in real-time
      try {
        const profile = await api.get('/auth/profile');
        if (profile) {
          if (profile.permissions) {
            sessionStorage.setItem('userPermissions', JSON.stringify(profile.permissions));
            setUserPermissions(profile.permissions);
          }
          if (profile.walletBalance !== undefined) {
            setWalletBalance(profile.walletBalance);
          }
        }
      } catch (profileErr) {
        console.warn('Failed to sync permissions:', profileErr);
      }

      const statsRes = await api.get('/admin/stats');
      setStats(statsRes);

      const storedPerms = sessionStorage.getItem('userPermissions');
      const activePerms = storedPerms ? JSON.parse(storedPerms) : [];
      const hasPerm = (tab) => {
        if (sessionStorage.getItem('userEmail') === 'admin@quicklabour.com') return true;
        return activePerms.includes(tab);
      };

      if (hasPerm('clients')) {
        const clientsRes = await api.get('/admin/clients');
        setClients(clientsRes);
      }

      if (hasPerm('workers')) {
        const workersRes = await api.get('/admin/workers');
        setWorkers(workersRes);
      }

      if (hasPerm('jobs')) {
        const jobsRes = await api.get('/admin/jobs');
        setJobs(jobsRes);
      }

      if (hasPerm('contacts')) {
        const contactsRes = await api.get('/admin/contacts');
        setContacts(contactsRes);
      }

      if (hasPerm('reviews')) {
        const reviewsRes = await api.get('/admin/reviews');
        setReviews(reviewsRes);
      }

      if (hasPerm('admins')) {
        const adminsRes = await api.get('/admin/admins');
        setAdmins(adminsRes);
      }
      await fetchAdminSosAlerts();
      await fetchDisputes();
    } catch (err) {
      console.error('fetchAdminData error:', err);
      setError(err.message || 'Failed to fetch administrative data');
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const handleDelete = async (endpoint, id, stateSetter, stateList) => {
    if (!window.confirm('Are you absolutely sure you want to delete this record? This action is irreversible.')) {
      return;
    }
    try {
      await api.delete(`${endpoint}/${id}`);
      stateSetter(stateList.filter((item) => item._id !== id));
      // Refresh stats
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes);
    } catch (err) {
      showClassyAlert(err.message || 'Deletion failed', 'Deletion Failed', 'error');
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setAdminError('');
    try {
      let permissions = [];
      if (adminForm.roleType === 'super_admin') {
        permissions = ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts', 'admins', 'disputes'];
      } else if (adminForm.roleType === 'stats_viewer') {
        permissions = ['overview'];
      } else if (adminForm.roleType === 'operations_manager') {
        permissions = ['clients', 'workers', 'jobs', 'reviews', 'contacts'];
      } else if (adminForm.roleType === 'disputes_officer') {
        permissions = ['disputes'];
      }

      const { roleType, ...submitData } = adminForm;

      await api.post('/admin/admins', {
        ...submitData,
        permissions
      });

      showClassyAlert('New admin account created successfully!', 'Admin Created', 'success');
      setShowAddAdminModal(false);
      setAdminForm({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        avatar: '',
        roleType: 'super_admin',
      });
      fetchAdminData();
    } catch (err) {
      setAdminError(err.message || 'Failed to create admin. Password must be strong (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special char).');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };



  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary my-5" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
        <h4 className="text-muted mt-3">Loading Administration Control Panel...</h4>
      </div>
    );
  }

  // Search filter matching
  const filteredClients = clients.filter(c =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const filteredWorkers = workers.filter(w => {
    const matchesSearch =
      w.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || w.occupation === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const specialties = ['All', ...new Set(workers.map(w => w.occupation).filter(Boolean))];

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReviews = reviews.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.workerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdmins = admins.filter(a =>
    a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard-container py-5 px-3" style={{ minHeight: '90vh', background: 'var(--bg-app)' }}>
      <div className="container-fluid max-w-7xl mx-auto">

        {/* Header Block */}
        <div className="glass-card p-4 mb-4 rounded-4 shadow-sm border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-4">
            <div className="d-flex align-items-center gap-3 pe-sm-4 cursor-pointer" style={{ borderRight: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>
              <div className="rounded-4 p-3 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ border: '1px solid rgba(40, 167, 69, 0.25)', width: '60px', height: '60px' }}>
                <i className="bi bi-wallet2 fs-2 animate-pulse"></i>
              </div>
              <div>
                <h6 className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Admin Wallet Balance</h6>
                <h3 className="fw-black text-success mb-0" style={{ fontSize: '1.75rem' }}>₹{walletBalance.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div>
              <h2 className="fw-extrabold mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                💼 Admin Wallet Portal
              </h2>
              <p className="text-muted mb-0">Monitor subscription revenues, track system metrics, and manage user accounts.</p>
            </div>
          </div>
          <div className="d-flex gap-2 align-self-start align-self-md-center">
            <button className="btn btn-outline-secondary rounded-3 px-3 fw-bold" onClick={fetchAdminData}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
            <button className="btn btn-danger rounded-3 px-3 fw-bold" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger rounded-3 border-0 shadow-sm mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
          </div>
        )}

        {/* Dynamic Stats Grid */}
        {(hasPermission('overview') || hasPermission('clients') || hasPermission('workers') || hasPermission('jobs') || hasPermission('contacts')) && (
          <div className="row g-3 mb-4">
            {(hasPermission('clients') || hasPermission('overview')) && (
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderLeft: '5px solid var(--primary)', borderColor: 'var(--border-color)' }}>
                  <div className="d-flex align-items-center">
                    <div className="rounded-3 p-3 bg-primary bg-opacity-10 text-primary me-3">
                      <i className="bi bi-people-fill fs-3"></i>
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Total Clients</h6>
                      <h3 className="fw-black mb-0">{stats.clientsCount}</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(hasPermission('workers') || hasPermission('overview')) && (
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderLeft: '5px solid var(--success)', borderColor: 'var(--border-color)' }}>
                  <div className="d-flex align-items-center">
                    <div className="rounded-3 p-3 bg-success bg-opacity-10 text-success me-3">
                      <i className="bi bi-hammer fs-3"></i>
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Active Workers</h6>
                      <h3 className="fw-black mb-0">{stats.workersCount}</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(hasPermission('jobs') || hasPermission('overview')) && (
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderLeft: '5px solid var(--warning)', borderColor: 'var(--border-color)' }}>
                  <div className="d-flex align-items-center">
                    <div className="rounded-3 p-3 bg-warning bg-opacity-10 text-warning me-3">
                      <i className="bi bi-briefcase-fill fs-3"></i>
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Repair Jobs</h6>
                      <h3 className="fw-black mb-0">{stats.jobsCount}</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(hasPermission('contacts') || hasPermission('overview')) && (
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderLeft: '5px solid var(--danger)', borderColor: 'var(--border-color)' }}>
                  <div className="d-flex align-items-center">
                    <div className="rounded-3 p-3 bg-danger bg-opacity-10 text-danger me-3">
                      <i className="bi bi-envelope-exclamation-fill fs-3"></i>
                    </div>
                    <div>
                      <h6 className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Support Tickets</h6>
                      <h3 className="fw-black mb-0">{stats.contactsCount}</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigator */}
        <div className="card border-0 shadow-sm rounded-4 p-2 mb-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="nav nav-pills d-flex flex-wrap gap-1 border-0">
            {hasPermission('overview') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'overview' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('overview'); setSearchTerm(''); }}>
                💳 Wallet Hub
              </button>
            )}
            {hasPermission('clients') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'clients' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('clients'); setSearchTerm(''); }}>
                👥 Clients ({clients.length})
              </button>
            )}
            {hasPermission('workers') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'workers' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('workers'); setSearchTerm(''); }}>
                👷 Workers ({workers.length})
              </button>
            )}
            {hasPermission('jobs') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'jobs' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('jobs'); setSearchTerm(''); }}>
                🛠️ Job Listings ({jobs.length})
              </button>
            )}
            {hasPermission('reviews') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'reviews' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('reviews'); setSearchTerm(''); }}>
                ⭐ Reviews ({reviews.length})
              </button>
            )}
            {hasPermission('contacts') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'contacts' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('contacts'); setSearchTerm(''); }}>
                💬 Inquiries ({contacts.length})
              </button>
            )}
            {hasPermission('admins') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'admins' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('admins'); setSearchTerm(''); }}>
                🛡️ Admins ({admins.length})
              </button>
            )}
            {hasPermission('disputes') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'disputes' ? 'active bg-danger text-white' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('disputes'); setSearchTerm(''); }}>
                ⚖️ Complain Panel ({JSON.parse(localStorage.getItem('quicklabour_disputes') || '[]').length})
              </button>
            )}
            {hasPermission('overview') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'sos' ? 'active bg-danger text-white animate-pulse' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('sos'); setSearchTerm(''); }}>
                🚨 SOS Alerts ({adminSosAlerts.length})
              </button>
            )}
          </div>
        </div>

        {/* Optional Search / Filtering Bar */}
        {activeTab !== 'overview' && activeTab !== 'sos' && (
          <div className="mb-4">
            <div className="input-group shadow-sm rounded-3 overflow-hidden">
              <span className="input-group-text bg-white border-0"><i className="bi bi-search"></i></span>
              <input type="text" className="form-control border-0 py-2" placeholder={`Search records in ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        )}

        {/* Tab Contents */}
        <div className="glass-card rounded-4 p-4 shadow-sm border-0" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', minHeight: '400px' }}>

          {/* TAB 1: ADMIN WALLET HUB */}
          {activeTab === 'overview' && hasPermission('overview') && (
            <div>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 border-bottom pb-3">
                <div>
                  <h4 className="fw-bold text-dark mb-1">
                    <i className="bi bi-wallet2 text-success me-2"></i> Admin Wallet Hub
                  </h4>
                  <p className="text-muted small mb-0">Manage platform subscription revenues, manual recharges, and bank withdrawals.</p>
                </div>
                {/* Action Alert Banner */}
                {actionAlert && (
                  <div className="alert alert-success py-2 px-3 rounded-3 shadow-sm mb-0 d-flex align-items-center gap-2" role="alert" style={{ fontSize: '0.88rem' }}>
                    <i className="bi bi-check-circle-fill"></i>
                    <strong>{actionAlert}</strong>
                  </div>
                )}
              </div>

              {/* Wallet Navigation Tabs */}
              <div className="d-flex gap-2 mb-4 p-2 bg-light rounded-3 shadow-sm" style={{ maxWidth: '600px' }}>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-2 fw-bold rounded-2 border-0 ${activeWalletTab === 'history' ? 'bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`}
                  onClick={() => setActiveWalletTab('history')}
                >
                  <i className="bi bi-clock-history me-1.5"></i> Transaction History
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-2 fw-bold rounded-2 border-0 ${activeWalletTab === 'scanner' ? 'bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`}
                  onClick={() => setActiveWalletTab('scanner')}
                >
                  <i className="bi bi-qr-code-scan me-1.5"></i> QR Scanner
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-2 fw-bold rounded-2 border-0 ${activeWalletTab === 'add' ? 'bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`}
                  onClick={() => setActiveWalletTab('add')}
                >
                  <i className="bi bi-plus-circle me-1.5"></i> Add Money
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-2 fw-bold rounded-2 border-0 ${activeWalletTab === 'withdraw' ? 'bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`}
                  onClick={() => setActiveWalletTab('withdraw')}
                >
                  <i className="bi bi-cash-stack me-1.5"></i> Withdraw
                </button>
              </div>

              {/* Sub-tab Content: Transaction History */}
              {activeWalletTab === 'history' && (
                <div>
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                    📜 Pay & Credit Statement
                  </h5>
                  <div className="table-responsive">
                    <table className="table align-middle table-hover border-0">
                      <thead className="table-light">
                        <tr className="border-0">
                          <th>Reference ID</th>
                          <th>Transaction Type / Details</th>
                          <th>Timestamp</th>
                          <th>Status</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTransactions().length > 0 ? (
                          getTransactions().map((tx) => (
                            <tr key={tx.id}>
                              <td className="font-monospace fw-bold small text-muted">{tx.id}</td>
                              <td>
                                <div>
                                  <strong className="text-dark">{tx.type}</strong>
                                  {tx.workerName && (
                                    <span className="d-block small text-muted">
                                      Worker: {tx.workerName}
                                    </span>
                                  )}
                                  {tx.method && (
                                    <span className="d-block small text-muted">
                                      Payment: {tx.method.toUpperCase()}
                                    </span>
                                  )}
                                  {tx.bankName && (
                                    <span className="d-block small text-muted">
                                      Bank: {tx.bankName} (A/C: {tx.accountNo})
                                    </span>
                                  )}
                                  {tx.upiId && (
                                    <span className="d-block small text-muted">
                                      UPI ID: {tx.upiId}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="small text-muted">{tx.date}</td>
                              <td>
                                <span className={`badge rounded-pill px-3 py-1.5 fw-bold ${tx.status === 'Success' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className={`text-end fw-extrabold ${tx.isCredit ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.05rem' }}>
                                {tx.isCredit ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-5 text-muted">
                              <i className="bi bi-journal-text fs-2 opacity-50 mb-2 d-block"></i>
                              No wallet transactions logged. Platform subscription revenues will automatically show here!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab Content: QR Scanner */}
              {activeWalletTab === 'scanner' && (
                <div className="row g-4 align-items-center">
                  <div className="col-12 col-md-5 text-center">
                    <div className="p-4 bg-white rounded-24 border shadow-sm" style={{ border: '2px solid var(--border-color)', display: 'inline-block' }}>
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=quicklabour@icici%26pn=QuickLabourAdmin%26cu=INR"
                        alt="Admin UPI QR Code"
                        className="img-fluid rounded-16 shadow-inner border mb-3"
                        style={{ width: '220px', height: '220px' }}
                      />
                      <h6 className="fw-bold mb-1" style={{ color: 'var(--text-main)' }}>Platform Merchant QR</h6>
                      <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 fw-bold">Active Receiving Agent</span>
                    </div>
                  </div>
                  <div className="col-12 col-md-7">
                    <h5 className="fw-bold text-dark mb-2">Receive Platform Revenues</h5>
                    <p className="text-muted small">
                      This QR code represents the official Admin Receiving Wallet. Workers can scan this code to pay registration fees, tokens subscription top-ups, or custom service charges directly.
                    </p>
                    <div className="p-3 bg-light rounded-3 border mb-3">
                      <div className="small text-muted mb-1"><strong>UPI ID:</strong> quicklabour@icici</div>
                      <div className="small text-muted mb-1"><strong>Merchant Name:</strong> Quick Labour Portal</div>
                      <div className="small text-muted mb-0"><strong>Supported Apps:</strong> Google Pay, PhonePe, Paytm, BHIM</div>
                    </div>
                    <div className="alert alert-info py-2 px-3 rounded-3" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-info-circle me-1"></i> Subscription payments made by labourers through their tokens subscriptions automatically credit the Admin's wallet and log details into the statement!
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab Content: Add Money */}
              {activeWalletTab === 'add' && (
                <div style={{ maxWidth: '500px' }}>
                  <h5 className="fw-bold mb-3 text-dark">Add Funds to Platform Reserve</h5>
                  <form onSubmit={handleAddMoneySubmit}>
                    {walletMethod !== 'netbanking' && (
                      <div className="mb-3">
                        <label className="form-label small fw-bold text-muted">Enter Amount (₹)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light fw-bold">₹</span>
                          <input
                            type="number"
                            className="form-control fw-bold"
                            placeholder="e.g. 1000"
                            value={walletAmount}
                            onChange={(e) => setWalletAmount(e.target.value)}
                            min="1"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted">Payment Channel</label>
                      <select
                        className="form-select fw-semibold"
                        value={walletMethod}
                        onChange={(e) => setWalletMethod(e.target.value)}
                      >
                        <option value="upi">UPI Sandbox (GPay / PhonePe)</option>
                        <option value="card">Card Sandbox (Visa / MasterCard / RuPay)</option>
                        <option value="netbanking">Net Banking (SBI / HDFC / ICICI)</option>
                      </select>
                    </div>

                    {walletMethod === 'netbanking' && (
                      <div className="netbanking-container border p-4 rounded-3 bg-light mb-4 animate-scale-up text-start">
                        <h6 className="fw-bold text-dark mb-3">Net Banking</h6>

                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted">Select Bank</label>
                          <select 
                            className="form-select rounded-3 py-2 fw-semibold"
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
                          <label className="form-label small fw-bold text-muted">Account Holder Name</label>
                          <input 
                            type="text" 
                            className="form-control rounded-3" 
                            placeholder="Enter Name"
                            value={netBankHolderName}
                            onChange={(e) => setNetBankHolderName(e.target.value)}
                            required 
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted">Customer ID / User ID</label>
                          <input 
                            type="text" 
                            className="form-control rounded-3" 
                            placeholder="Enter User ID"
                            value={netBankCustomerId}
                            onChange={(e) => setNetBankCustomerId(e.target.value)}
                            required 
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted">Amount</label>
                          <input 
                            type="number" 
                            className="form-control rounded-3 py-2 fw-bold" 
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
                      className="btn btn-primary rounded-3 w-100 fw-bold py-2.5"
                      disabled={isAddingMoney}
                    >
                      {isAddingMoney ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : (
                        walletMethod === 'netbanking' ? 'Proceed to Bank' : `Deposit ₹${walletAmount ? Number(walletAmount).toLocaleString() : '0'} to Reserve`
                      )}
                    </button>
                  </form>
                </div>
              )}

              {activeWalletTab === 'withdraw' && (
                <div style={{ maxWidth: '500px' }}>
                  <h5 className="fw-bold mb-3 text-dark">Withdraw Platform Earnings</h5>
                  <form onSubmit={handleWithdrawSubmit}>
                    {/* Simulated SMS Notification banner */}
                    {withdrawOtpNotification && (
                      <div className="alert alert-warning py-3 px-3 rounded-3 border-warning mb-4 shadow-sm" role="alert" style={{ fontSize: '0.88rem', borderLeft: '5px solid #ffc107' }}>
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
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted">Withdrawal Amount (₹)</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light fw-bold">₹</span>
                            <input
                              type="number"
                              className="form-control fw-bold"
                              placeholder="e.g. 500"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              max={walletBalance}
                              min="1"
                              required
                            />
                          </div>
                          <div className="form-text text-muted small mt-1">
                            Available Balance: <strong>₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted">Payout Option</label>
                          <div className="d-flex gap-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="adminWithdrawMethod"
                                id="adminWithdrawUpi"
                                checked={withdrawMethod === 'upi'}
                                onChange={() => setWithdrawMethod('upi')}
                              />
                              <label className="form-check-label fw-semibold" htmlFor="adminWithdrawUpi">
                                UPI ID
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="adminWithdrawMethod"
                                id="adminWithdrawBank"
                                checked={withdrawMethod === 'bank'}
                                onChange={() => setWithdrawMethod('bank')}
                              />
                              <label className="form-check-label fw-semibold" htmlFor="adminWithdrawBank">
                                Bank Account
                              </label>
                            </div>
                          </div>
                        </div>

                        {withdrawMethod === 'upi' ? (
                          <div className="mb-4">
                            <label className="form-label small fw-bold text-muted">Receiver UPI ID</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. administrator@oksbi"
                              value={upiWithdrawId}
                              onChange={(e) => setUpiWithdrawId(e.target.value)}
                              required
                            />
                          </div>
                        ) : (
                          <div className="mb-4 p-3 bg-light rounded-3 border">
                            <div className="mb-2.5">
                              <label className="form-label small fw-bold text-muted mb-1">Bank Name</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. ICICI Bank"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="mb-2.5">
                              <label className="form-label small fw-bold text-muted mb-1">Account Number</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. 987654321012"
                                value={accountNo}
                                onChange={(e) => setAccountNo(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="form-label small fw-bold text-muted mb-1">IFSC Code</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. ICIC0001234"
                                value={ifscCode}
                                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                required
                              />
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn btn-danger rounded-3 w-100 fw-bold py-2.5"
                          disabled={isWithdrawing || Number(withdrawAmount) > walletBalance}
                        >
                          {isWithdrawing ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Sending OTP...
                            </>
                          ) : (
                            `Withdraw ₹${withdrawAmount ? Number(withdrawAmount).toLocaleString() : '0'}`
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="mb-4 text-center animate-scale-up">
                          <label className="form-label small fw-bold text-muted mb-2">ENTER 4-DIGIT VERIFICATION CODE</label>
                          <input
                            type="text"
                            maxLength="4"
                            className="form-control text-center font-monospace fw-bold fs-3"
                            style={{ letterSpacing: '0.5rem', height: '54px', border: '2px solid var(--border-color)', borderRadius: '8px' }}
                            placeholder="••••"
                            value={withdrawOtp}
                            onChange={(e) => setWithdrawOtp(e.target.value.replace(/\D/g, ''))}
                            required
                            autoFocus
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn btn-success rounded-3 w-100 fw-bold py-2.5"
                          disabled={isWithdrawing}
                        >
                          {isWithdrawing ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Verifying & Processing...
                            </>
                          ) : `Verify & Process ₹${withdrawAmount}`}
                        </button>

                        <div className="text-center mt-3">
                          <button
                            type="button"
                            className="btn btn-link text-decoration-none small fw-bold p-0"
                            style={{ color: '#0d6efd', fontSize: '0.85rem' }}
                            onClick={async () => {
                              try {
                                const res = await api.requestWithdrawalOtp(Number(withdrawAmount));
                                setWithdrawOtp('');
                                setWithdrawOtpNotification(`📱 SMS Received on ${sessionStorage.getItem('userPhone') || 'registered phone number'}: Your new withdrawal verification OTP is: ${res.otp}`);
                              } catch (err) {
                                showClassyAlert("Failed to resend OTP: " + err.message, "OTP Error", "error");
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
                </div>
              )}

            </div>
          )}

          {/* TAB 2: CLIENTS */}
          {activeTab === 'clients' && hasPermission('clients') && (
            <div className="table-responsive">
              <table className="table align-middle table-hover border-0">
                <thead className="table-light">
                  <tr className="border-0">
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Hired Job Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr key={client._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img src={getAvatarUrl(client.avatar, client.fullName)} alt="Avatar" className="rounded-circle me-3" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                            <div>
                              <div className="fw-bold text-dark">{client.fullName}</div>
                              <span className="small text-muted">ID: {client._id.slice(-6).toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td>{client.email}</td>
                        <td>{client.phone}</td>
                        <td>{client.address}</td>
                        <td>
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold">Active User</span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm rounded-3 fw-bold text-white px-3"
                              style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', border: 'none' }}
                              onClick={() => setSelectedCredentials({
                                id: client._id,
                                name: client.fullName,
                                email: client.email,
                                password: client.password || 'Secret Encrypted',
                                plainPassword: client.plainPassword || 'client123',
                                role: 'Client',
                                phone: client.phone,
                                address: client.address || 'Not Provided'
                              })}
                            >
                              ℹ️ More Details
                            </button>
                            <button className="btn btn-outline-danger btn-sm rounded-3 fw-bold" onClick={() => handleDelete('/admin/clients', client._id, setClients, clients)}>
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">No Client profiles matched your search parameters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: WORKERS */}
          {activeTab === 'workers' && hasPermission('workers') && (
            <>
              {/* Horizontal Scrollable Specialty filter bar */}
              <div className="d-flex align-items-center gap-2 mb-4 overflow-auto pb-2" style={{ whiteSpace: 'nowrap', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                <span className="text-muted small fw-bold me-2"><i className="bi bi-funnel-fill text-primary"></i> Filter Specialty:</span>
                {specialties.map(spec => (
                  <button
                    key={spec}
                    className={`btn btn-sm rounded-pill px-3 py-2 fw-bold transition-all border-0 ${selectedSpecialty === spec
                        ? 'btn-primary text-white shadow-sm'
                        : 'bg-light text-secondary'
                      }`}
                    style={{ transition: 'all 0.2s ease' }}
                    onClick={() => setSelectedSpecialty(spec)}
                  >
                    {spec}
                  </button>
                ))}
              </div>
              <div className="table-responsive">
                <table className="table align-middle table-hover border-0">
                  <thead className="table-light">
                    <tr>
                      <th>Worker Details</th>
                      <th>Trade Specialty</th>
                      <th>Ratings & Completed</th>
                      <th>Availability</th>
                      <th>Verification Docs</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.length > 0 ? (
                      filteredWorkers.map((worker) => (
                        <tr key={worker._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img src={getAvatarUrl(worker.avatar, worker.fullName)} alt="Avatar" className="rounded-circle me-3" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                              <div>
                                <div className="fw-bold text-dark">{worker.fullName}</div>
                                <span className="small text-muted">{worker.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 fw-bold rounded-pill">{worker.occupation}</span>
                          </td>
                          <td>
                            <div className="fw-bold text-warning">{worker.rating || 4.9} ⭐</div>
                            <div className="small text-muted mb-1">{worker.jobsCompleted || 0} completions</div>
                            <span className="badge bg-warning bg-opacity-20 text-dark rounded-pill fw-bold small px-2 py-1" style={{ border: '1px solid #ffd43b', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              🪙 {worker.tokens !== undefined ? worker.tokens : 0} Tokens
                            </span>
                          </td>
                          <td>
                            {worker.isOnline ? (
                              <span className="badge bg-success rounded-pill px-2 py-1">Online</span>
                            ) : (
                              <span className="badge bg-secondary rounded-pill px-2 py-1">Offline</span>
                            )}
                          </td>
                          <td>
                            {worker.idFile ? (
                              <button className="btn btn-outline-primary btn-sm rounded-3 fw-bold py-1 px-2" onClick={() => setSelectedDoc({ name: worker.fullName, type: worker.idType, file: worker.idFile })}>
                                <i className="bi bi-file-earmark-check me-1"></i> View {worker.idType}
                              </button>
                            ) : (
                              <span className="text-muted small">No File Uploaded</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm rounded-3 fw-bold text-white px-3"
                                style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', border: 'none' }}
                                onClick={() => setSelectedCredentials({
                                  id: worker._id,
                                  name: worker.fullName,
                                  email: worker.email,
                                  password: worker.password || 'Secret Encrypted',
                                  plainPassword: worker.plainPassword || 'worker123',
                                  role: 'Worker / Labour',
                                  phone: worker.phone,
                                  address: worker.address || 'Not Provided',
                                  extra: `Occupation: ${worker.occupation} | Rating: ${worker.rating || '4.9'} ⭐ | Tokens Balance: ${worker.tokens !== undefined ? worker.tokens : 0} Tokens`
                                })}
                              >
                                ℹ️ More Details
                              </button>
                              <button className="btn btn-outline-danger btn-sm rounded-3 fw-bold" onClick={() => handleDelete('/admin/workers', worker._id, setWorkers, workers)}>
                                <i className="bi bi-trash"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">No Worker profiles matched your search parameters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 4: JOBS */}
          {activeTab === 'jobs' && hasPermission('jobs') && (
            <div className="table-responsive">
              <table className="table align-middle table-hover border-0">
                <thead className="table-light">
                  <tr>
                    <th>Job Title</th>
                    <th>Booking Client</th>
                    <th>Budget Allotted</th>
                    <th>Hired Worker</th>
                    <th>Match Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <tr key={job._id}>
                        <td>
                          <div className="fw-bold text-dark">{job.title}</div>
                          <span className="small text-muted">{job.location}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img src={getAvatarUrl(job.client?.avatar, job.name || job.client?.fullName || 'Client')} alt="Avatar" className="rounded-circle me-2" style={{ width: '30px', height: '30px', objectFit: 'cover' }} />
                            <span className="small fw-bold">{job.name || job.client?.fullName || 'Client'}</span>
                          </div>
                        </td>
                        <td className="fw-bold text-success">₹{job.money || 0}</td>
                        <td>
                          {job.hiredWorker ? (
                            <div className="d-flex align-items-center">
                              <img src={getAvatarUrl(job.hiredWorker?.avatar, job.hiredWorker?.fullName || 'Worker')} alt="Avatar" className="rounded-circle me-2" style={{ width: '30px', height: '30px', objectFit: 'cover' }} />
                              <span className="small">{job.hiredWorker?.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-muted small">Not Hired Yet</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge rounded-pill px-3 py-2 fw-bold ${job.status === 'Completed' ? 'bg-success bg-opacity-10 text-success' :
                            job.status === 'Accepted' ? 'bg-info bg-opacity-10 text-info' :
                              job.status === 'Rejected' ? 'bg-danger bg-opacity-10 text-danger' :
                                'bg-warning bg-opacity-10 text-warning'
                            }`}>{job.status}</span>
                        </td>
                        <td className="text-center">
                          <button className="btn btn-outline-danger btn-sm rounded-3 fw-bold" onClick={() => handleDelete('/admin/jobs', job._id, setJobs, jobs)}>
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">No repair bookings matched your search parameters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: SUPPORT TICKETS (CONTACTS) */}
          {activeTab === 'contacts' && hasPermission('contacts') && (
            <div>
              <div className="row g-3">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <div className="col-12 col-md-6" key={contact._id}>
                      <div className="card rounded-4 border-0 shadow-sm p-4 h-100 position-relative bg-white">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="fw-bold mb-1 text-dark">{contact.subject}</h5>
                            <span className="small text-primary fw-semibold">{contact.name} ({contact.email})</span>
                          </div>
                          <button className="btn btn-sm btn-outline-danger border-0 rounded-circle" style={{ width: '32px', height: '32px', padding: 0 }} onClick={() => handleDelete('/admin/contacts', contact._id, setContacts, contacts)}>
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                        <p className="text-muted small bg-light p-3 rounded-3" style={{ minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                          "{contact.message}"
                        </p>
                        <div className="text-end text-muted small mt-2">
                          Received: {new Date(contact.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5 text-muted">No support tickets / contact messages found.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS MODERATION */}
          {activeTab === 'reviews' && hasPermission('reviews') && (
            <div className="row g-3">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <div className="col-12 col-md-6 col-lg-4" key={review._id}>
                    <div className="card rounded-4 border-0 shadow-sm p-4 h-100 bg-white">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="fw-bold text-dark mb-0">{review.name}</h6>
                          <span className="small text-muted">{review.sub || review.workerType || 'Trade Partner'}</span>
                        </div>
                        <button className="btn btn-sm btn-outline-danger border-0 rounded-circle" onClick={() => handleDelete('/admin/reviews', review._id, setReviews, reviews)}>
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                      <div className="text-warning mb-2" style={{ fontSize: '0.9rem' }}>
                        {Array.from({ length: Math.round(review.rating || 5) }).map((_, i) => (
                          <i key={i} className="bi bi-star-fill me-0.5"></i>
                        ))}
                        <span className="text-muted small ms-2">({review.rating || 5} / 5)</span>
                      </div>
                      <p className="text-muted small mb-0 italic" style={{ whiteSpace: 'pre-wrap' }}>
                        "{review.text}"
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5 text-muted">No community reviews matched your search criteria.</div>
              )}
            </div>
          )}

          {/* TAB 7: ADMINS DIRECTORY */}
          {activeTab === 'admins' && isSuperAdmin && (
            <div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
                <h5 className="fw-bold mb-0 text-dark">Administrative Authority Officers</h5>
                <button
                  className="btn btn-success rounded-3 fw-bold px-3 py-2 shadow-sm border-0 d-inline-flex align-items-center gap-2 animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #198754, #146c43)', transition: 'all 0.2s' }}
                  onClick={() => setShowAddAdminModal(true)}
                >
                  <i className="bi bi-person-plus-fill"></i> Create New Admin
                </button>
              </div>
              <div className="table-responsive">
                <table className="table align-middle table-hover border-0">
                  <thead className="table-light">
                    <tr>
                      <th>Admin Name</th>
                      <th>Email Address</th>
                      <th>Phone Contact</th>
                      <th>Access Level</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.length > 0 ? (
                      filteredAdmins.map((admin) => (
                        <tr key={admin._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              {admin.avatar ? (
                                <img src={admin.avatar} alt="Avatar" className="rounded-circle me-3" style={{ width: '38px', height: '38px', objectFit: 'cover' }} />
                              ) : (
                                <div className="rounded-circle bg-danger bg-opacity-10 text-danger p-2 me-3 fw-bold text-center" style={{ width: '38px', height: '38px', lineHeight: '22px' }}>
                                  {admin.fullName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="fw-bold text-dark">{admin.fullName}</div>
                                <span className="small text-muted">Superuser Key</span>
                              </div>
                            </div>
                          </td>
                          <td>{admin.email}</td>
                          <td>{admin.phone}</td>
                          <td>
                            <span className={`badge rounded-pill px-3 py-1.5 fw-bold ${admin.permissions && admin.permissions.includes('admins') ? 'bg-danger bg-opacity-10 text-danger' : 'bg-info bg-opacity-10 text-info'}`}>
                              {admin.permissions && admin.permissions.includes('admins') ? 'Full Access' : `Custom (${admin.permissions ? admin.permissions.length : 0} modules)`}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm rounded-3 fw-bold text-white px-3"
                                style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', border: 'none' }}
                                onClick={() => setSelectedCredentials({
                                  id: admin._id,
                                  name: admin.fullName,
                                  email: admin.email,
                                  password: admin.password || 'Secret Encrypted',
                                  plainPassword: admin.plainPassword || 'admin123',
                                  role: 'Administrator',
                                  phone: admin.phone || 'Not Provided',
                                  address: admin.permissions && admin.permissions.includes('admins') ? 'Full Access' : `Custom Permissions: ${admin.permissions ? admin.permissions.join(', ') : ''}`
                                })}
                              >
                                ℹ️ More Details
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm rounded-3 fw-bold"
                                disabled={admin.email === 'admin@quicklabour.com'}
                                onClick={() => handleDelete('/admin/admins', admin._id, setAdmins, admins)}
                              >
                                <i className="bi bi-trash"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">No admin accounts found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: DISPUTES RESOLUTION PANEL */}
          {activeTab === 'disputes' && hasPermission('disputes') && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 text-dark">⚖️ Safe Platform Complains & Escalation Resolution Desk</h5>
                <span className="badge bg-danger text-white fw-bold px-3 py-2">
                  {disputes.filter(d => d.status !== 'Resolved').length} Unresolved Cases
                </span>
              </div>
              <div className="alert alert-info rounded-3 py-2 px-3 mb-4" style={{ fontSize: '0.88rem' }}>
                ℹ️ QuickLabour Administrator safety policy requires auditing caller screenshot details, GPS tracking coordinates, and physical selfie evidence before releasing or wallet penalty adjustments.
              </div>

              {disputes.length > 0 ? (
                <div className="row g-4">
                  {disputes.map((disp) => {
                    const isNoShow = disp.reason && disp.reason.includes('Client No-Show');
                    
                    return (
                      <div key={disp._id} className="col-12 mb-4">
                        <div className="card rounded-4 shadow-sm border bg-white text-start overflow-hidden" style={{ borderLeft: '6px solid #dc2626' }}>
                          <div className="row g-0">
                            
                            {/* Left side: Case info & actions */}
                            <div className="col-lg-5 p-4 border-end d-flex flex-column justify-content-between">
                              <div>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <span className="badge bg-danger text-white fw-bold px-2.5 py-1 rounded-pill small" style={{ fontSize: '0.72rem' }}>
                                      {isNoShow ? '⚠️ CLIENT NO-SHOW COMPENSATION CLAIM' : `⚖️ DISPUTE FILED BY ${disp.submittedBy.toUpperCase()}`}
                                    </span>
                                    <h5 className="fw-bold text-dark mt-2 mb-0">{disp.jobTitle}</h5>
                                    <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Submitted: {disp.createdAt}</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className={`badge px-2 py-1 rounded-pill ${disp.status === 'Resolved' ? 'bg-success text-white' : 'bg-warning text-white'}`}>
                                      {disp.status}
                                    </span>
                                    <button
                                      className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                                      onClick={() => handleDeleteDispute(disp._id)}
                                      title="Delete Dispute"
                                    >
                                      <i className="bi bi-trash-fill"></i>
                                    </button>
                                  </div>
                                </div>

                                <div className="mb-3 p-3 rounded-3" style={{ background: '#fef2f2', border: '1px solid #fee2e2' }}>
                                  <div className="small text-dark mb-1"><strong>Worker Name:</strong> {disp.workerName}</div>
                                  <div className="small text-dark mb-2"><strong>Client Name:</strong> {disp.clientName}</div>
                                  <hr className="my-2 text-muted" />
                                  <div className="small text-danger fw-bold mb-1">Incident Report:</div>
                                  <div className="small text-dark font-monospace" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>"{disp.reason}"</div>
                                </div>
                              </div>

                              <div>
                                {disp.status !== 'Resolved' ? (
                                  <div className="d-flex gap-2 flex-wrap mt-3">
                                    {isNoShow ? (
                                      <>
                                        <button
                                          onClick={() => handleResolveDispute(disp._id, `Approved. Visit compensation of ₹50 paid to worker (${disp.workerName}) and client (${disp.clientName}) penalized.`)}
                                          className="btn btn-success fw-bold flex-fill rounded-12 py-2.5 text-white"
                                          style={{ fontSize: '0.82rem' }}
                                        >
                                          Approve Compensation (₹50)
                                        </button>
                                        <button
                                          onClick={() => handleResolveDispute(disp._id, `Rejected. Insufficient location or call logs proof.`)}
                                          className="btn btn-outline-secondary fw-bold flex-fill rounded-12 py-2.5"
                                          style={{ fontSize: '0.82rem' }}
                                        >
                                          Reject Claim
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleResolveDispute(disp._id, `Resolved in favor of Client (${disp.clientName}). Worker penalized.`)}
                                          className="btn btn-outline-primary fw-bold flex-fill rounded-12 py-2.5"
                                          style={{ fontSize: '0.82rem' }}
                                        >
                                          Rule in favor of Client
                                        </button>
                                        <button
                                          onClick={() => handleResolveDispute(disp._id, `Resolved in favor of Worker (${disp.workerName}). Compensation confirmed.`)}
                                          className="btn btn-outline-success fw-bold flex-fill rounded-12 py-2.5"
                                          style={{ fontSize: '0.82rem' }}
                                        >
                                          Rule in favor of Worker
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div className="small text-success fw-bold p-2.5 bg-success bg-opacity-5 rounded-12 border border-success border-opacity-10 mt-3">
                                    <i className="bi bi-shield-check me-1"></i> Resolved Decision: "{disp.resolutionDecision}"
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right side: Side-by-Side Evidence Review (Selfie, Call logs, and Live GPS Validation Map) */}
                            <div className="col-lg-7 p-4 bg-light bg-opacity-50 d-flex flex-column justify-content-between">
                              <div>
                                <h6 className="fw-800 text-dark mb-3"><i className="bi bi-file-earmark-check-fill text-primary me-1"></i>Side-by-Side Evidence Review</h6>
                                
                                <div className="row g-3 mb-3">
                                  <div className="col-6 col-sm-4 text-center">
                                    <span className="d-block small text-muted fw-bold mb-1" style={{ fontSize: '0.7rem' }}>📍 Reported Photo Proof</span>
                                    <div className="position-relative border rounded overflow-hidden shadow-sm bg-white" style={{ height: '110px' }}>
                                      <img 
                                        src={disp.photo} 
                                        alt="Location Selfie" 
                                        className="w-100 h-100" 
                                        style={{ objectFit: 'cover', cursor: 'pointer' }} 
                                        onClick={() => setSelectedDoc({ name: `${disp.workerName} Selfie/Location Proof`, type: 'Selfie Photo', file: disp.photo })} 
                                      />
                                      <div className="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white px-1.5 py-0.5" style={{ fontSize: '0.62rem', cursor: 'pointer' }}>Zoom 🔍</div>
                                    </div>
                                  </div>
                                  
                                  <div className="col-6 col-sm-4 text-center">
                                    <span className="d-block small text-muted fw-bold mb-1" style={{ fontSize: '0.7rem' }}>📞 Call Log Screenshot</span>
                                    <div className="position-relative border rounded overflow-hidden shadow-sm bg-white" style={{ height: '110px' }}>
                                      <img 
                                        src={disp.callLog} 
                                        alt="Call Logs" 
                                        className="w-100 h-100" 
                                        style={{ objectFit: 'cover', cursor: 'pointer' }} 
                                        onClick={() => setSelectedDoc({ name: `${disp.workerName} Call Log Proof`, type: 'Call Screenshot', file: disp.callLog })} 
                                      />
                                      <div className="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white px-1.5 py-0.5" style={{ fontSize: '0.62rem', cursor: 'pointer' }}>Zoom 🔍</div>
                                    </div>
                                  </div>

                                  <div className="col-12 col-sm-4">
                                    <span className="d-block small text-muted fw-bold mb-1 text-center" style={{ fontSize: '0.7rem' }}>GPS Audit Info</span>
                                    <div className="p-3 bg-white border rounded shadow-sm d-flex flex-column justify-content-center align-items-center h-100" style={{ minHeight: '110px' }}>
                                      <span className="badge bg-danger bg-opacity-10 text-danger font-monospace mb-1.5 text-wrap w-100" style={{ fontSize: '0.65rem', padding: '6px 4px', wordBreak: 'break-all' }}>
                                        {disp.gpsLocation || 'No GPS coordinates'}
                                      </span>
                                      {(() => {
                                        const jobObj = jobs.find(j => j._id === disp.jobId);
                                        const wCoords = parseGpsCoords(disp.gpsLocation);
                                        if (jobObj && wCoords && jobObj.latitude && jobObj.longitude) {
                                          const dist = getDistanceInKm(jobObj.latitude, jobObj.longitude, wCoords.lat, wCoords.lng);
                                          const matches = parseFloat(dist) <= 0.2; // Match if within 200 meters
                                          return (
                                            <span className={`badge ${matches ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'} fw-800`} style={{ fontSize: '0.68rem', padding: '4px 8px' }}>
                                              {matches ? '✅ Near Location' : `⚠️ Distant: ${dist} km`}
                                            </span>
                                          );
                                        }
                                        return <span className="small text-muted" style={{ fontSize: '0.65rem' }}>No client coords</span>;
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Map visualization section */}
                              {(() => {
                                const jobObj = jobs.find(j => j._id === disp.jobId);
                                const wCoords = parseGpsCoords(disp.gpsLocation);
                                if (jobObj && wCoords && jobObj.latitude && jobObj.longitude) {
                                  return (
                                    <div className="mt-2 border rounded overflow-hidden shadow-sm" style={{ height: '140px', position: 'relative' }}>
                                      <iframe
                                        title={`Dispute Map - ${disp._id}`}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 'none' }}
                                        src={`https://maps.google.com/maps?saddr=${wCoords.lat},${wCoords.lng}&daddr=${jobObj.latitude},${jobObj.longitude}&output=embed&iwloc=near`}
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="mt-2 border rounded bg-white text-muted d-flex align-items-center justify-content-center small" style={{ height: '140px' }}>
                                    <i className="bi bi-geo-alt-fill me-1"></i> Map path unavailable (Missing job/GPS coords)
                                  </div>
                                );
                              })()}
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-shield-check fs-1 text-success opacity-75 mb-3 d-block"></i>
                  <h6 className="fw-bold">All clean! No active disputes or escalated complaints.</h6>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: SOS ALERTS PANEL */}
          {activeTab === 'sos' && hasPermission('overview') && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div>
                  <h4 className="fw-bold text-danger mb-1">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i> Worker SOS Safety Alerts
                  </h4>
                  <p className="text-muted small mb-0">Monitor active emergency triggers, locate workers, and verify point refund processing.</p>
                </div>
              </div>

              {adminSosAlerts && adminSosAlerts.length > 0 ? (
                <div className="row g-4">
                  {adminSosAlerts.map((alert) => (
                    <div className="col-12 col-md-6" key={alert._id}>
                      <div className={`card border-0 shadow-sm rounded-4 p-4 h-100 ${
                        alert.status === 'Pending' 
                          ? 'border-start border-5 border-danger' 
                          : alert.status === 'Verified' 
                          ? 'border-start border-5 border-success' 
                          : 'border-start border-5 border-secondary'
                      }`} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${
                              alert.status === 'Pending' ? 'bg-danger animate-pulse' : alert.status === 'Verified' ? 'bg-success' : 'bg-secondary'
                            } rounded-pill px-3 py-1.5 fw-bold`}>
                              {alert.status}
                            </span>
                            <span className={`badge bg-light text-dark border rounded-pill px-2.5 py-1.5`}>
                              Refund: {alert.claimRefund ? alert.refundStatus : 'Not Claimed'}
                            </span>
                          </div>
                          <span className="small text-muted font-monospace">{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>

                        <h5 className="fw-extrabold text-dark mb-3">
                          🚨 {alert.emergencyType}
                        </h5>

                        <div className="mb-3 p-3 bg-light rounded-3 text-start small">
                          <div className="mb-2">
                            <strong className="text-muted d-block">Worker Details:</strong>
                            <span className="fw-700 text-dark">{alert.worker?.fullName}</span> ({alert.worker?.phone})
                          </div>
                          <div className="mb-2">
                            <strong className="text-muted d-block">Job Description:</strong>
                            <span className="fw-700 text-dark">{alert.job?.title}</span> (₹{alert.job?.money})
                          </div>
                          <div>
                            <strong className="text-muted d-block">GPS Coordinates:</strong>
                            <span className="font-monospace text-danger fw-bold">{alert.latitude}°, {alert.longitude}°</span>
                          </div>
                        </div>

                        {alert.status === 'Pending' ? (
                          <div className="d-flex gap-2 mt-auto pt-3 border-top">
                            <button
                              onClick={() => handleVerifySosAlert(alert._id, 'Verified')}
                              className="btn btn-success btn-sm rounded-3 fw-bold flex-fill py-2"
                              style={{ background: 'linear-gradient(135deg, #198754, #146c43)', border: 'none' }}
                            >
                              {alert.claimRefund ? '✅ Verify Incident (Refund 50%)' : '✅ Verify Incident (No Refund)'}
                            </button>
                            <button
                              onClick={() => handleVerifySosAlert(alert._id, 'Incorrect')}
                              className="btn btn-outline-danger btn-sm rounded-3 fw-bold flex-fill py-2"
                            >
                              ❌ Reject / Flag Alert
                            </button>
                          </div>
                        ) : (
                          <div className="mt-auto pt-3 border-top d-flex align-items-center justify-content-between text-muted small">
                            <span>Status Updated by Admin</span>
                            {alert.status === 'Verified' && (
                              <strong className="text-success">
                                <i className="bi bi-check-circle-fill me-1"></i>
                                {alert.claimRefund ? `Refunded ${alert.refundAmount} Tokens` : 'Verified (No Refund Claimed)'}
                              </strong>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-shield-check-fill text-success fs-1 mb-3 d-block"></i>
                  <h6 className="fw-bold">No emergency SOS triggers logged. The platform is completely safe!</h6>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* MODAL FOR VIEWING Aadhaar / Document Uploads */}
      {selectedDoc && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 bg-light rounded-top-4 py-3">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-shield-check text-success me-2"></i> Government Proof Verification</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedDoc(null)}></button>
              </div>
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <h6 className="fw-bold mb-1">{selectedDoc.name}</h6>
                  <span className="badge bg-primary">{selectedDoc.type} Document Attachment</span>
                </div>
                <div className="border rounded-3 p-2 bg-light overflow-auto" style={{ maxHeight: '450px' }}>
                  {selectedDoc.file.startsWith('data:application/pdf;') || selectedDoc.file.startsWith('data:application/octet-stream;') ? (
                    <div className="py-5">
                      <i className="bi bi-file-earmark-pdf text-danger fs-1 mb-3 d-block"></i>
                      <p className="fw-bold">PDF Document Attachment</p>
                      <a href={selectedDoc.file} download={`verification_${selectedDoc.name}`} className="btn btn-primary rounded-3 fw-bold">
                        <i className="bi bi-download me-1"></i> Download PDF Document to Verify
                      </a>
                    </div>
                  ) : (
                    <img src={selectedDoc.file} alt="ID Document Proof Attachment" className="img-fluid rounded shadow-sm" style={{ minWidth: '50%' }} />
                  )}
                </div>
              </div>
              <div className="modal-footer border-0 bg-light rounded-bottom-4 py-2">
                <button type="button" className="btn btn-secondary rounded-3 px-4 fw-bold" onClick={() => setSelectedDoc(null)}>Close Viewer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR VIEWING USER CREDENTIALS & SECURITY DETAILS */}
      {selectedCredentials && (
        <div className="modal show d-block animate__animated animate__fadeIn" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden" style={{ border: '1.5px solid #e8ecf8' }}>

              {/* Modal Header */}
              <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="modal-title fw-bold m-0 d-flex align-items-center gap-2">
                    🔑 Security Credentials
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={closeAuditorModal}></button>
                </div>
                <div className="mt-2 small opacity-75">Secure Administrative Audit Directory</div>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 bg-white text-start">

                {/* User Header Info */}
                <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3 fw-bold fs-4 text-center d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                    👤
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 text-dark">{selectedCredentials.name}</h5>
                    <span className="badge bg-primary rounded-pill fw-bold" style={{ fontSize: '0.75rem' }}>{selectedCredentials.role}</span>
                  </div>
                </div>

                {/* Username / Email Field */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">📧 Login User ID (Email)</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control rounded-start-3 bg-light border-1 fw-bold"
                      readOnly                      value={selectedCredentials.email}
                      style={{ fontSize: '0.9rem' }}
                    />
                    <button
                      className="btn btn-outline-secondary px-3"
                      style={{ borderRadius: '0 10px 10px 0' }}
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCredentials.email);
                        showClassyAlert('Email / User ID copied to clipboard!', 'Copied', 'success');
                      }}
                      title="Copy to Clipboard"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                {/* Password Field with Hashing Decryption/Reveal Toggle */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">
                    {selectedCredentials.role === 'Administrator' ? '🔒 Password (Bcrypt Hash Record)' : (showPlaintextInAuditor ? '🔑 Original Password (Plaintext)' : '🔒 Password (Bcrypt Hash Record)')}
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control rounded-start-3 bg-light border-1 font-monospace fw-bold text-muted"
                      readOnly
                      value={selectedCredentials.role === 'Administrator' ? selectedCredentials.password : (showPlaintextInAuditor ? selectedCredentials.plainPassword : selectedCredentials.password)}
                      style={{
                        fontSize: (selectedCredentials.role !== 'Administrator' && showPlaintextInAuditor) ? '0.95rem' : '0.8rem',
                        letterSpacing: '0.5px'
                      }}
                    />
                    {selectedCredentials.role !== 'Administrator' && (
                      <button
                        className="btn btn-outline-primary px-3 fw-bold"
                        type="button"
                        onClick={() => setShowPlaintextInAuditor(!showPlaintextInAuditor)}
                        title={showPlaintextInAuditor ? "Show Bcrypt Hash" : "Show Plaintext Password"}
                      >
                        {showPlaintextInAuditor ? '🔒 Hash' : '👁️ Reveal'}
                      </button>
                    )}
                    <button
                      className="btn btn-outline-secondary px-3"
                      style={{ borderRadius: selectedCredentials.role === 'Administrator' ? '0 10px 10px 0' : '0' }}
                      type="button"
                      onClick={() => {
                        const copyValue = (selectedCredentials.role !== 'Administrator' && showPlaintextInAuditor) ? selectedCredentials.plainPassword : selectedCredentials.password;
                        navigator.clipboard.writeText(copyValue);
                        showClassyAlert(`${(selectedCredentials.role !== 'Administrator' && showPlaintextInAuditor) ? 'Plaintext Password' : 'Secure Password record'} copied to clipboard!`, 'Copied', 'success');
                      }}
                      title="Copy Value"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div className="form-text small mt-1 d-flex justify-content-between align-items-center" style={{ fontSize: '0.75rem' }}>
                    <span className={(selectedCredentials.role !== 'Administrator' && showPlaintextInAuditor) ? 'text-success fw-bold' : 'text-danger'}>
                      {selectedCredentials.role === 'Administrator' ? '🛡️ Administrator keys are fully secure and unrevealable by sub-admins.' : (showPlaintextInAuditor ? '🟢 Displaying plaintext original credentials.' : '🛡️ Password encrypted securely using Bcrypt.')}
                    </span>
                  </div>
                </div>

                {/* Restore Default Original Password Action */}
                {selectedCredentials.role !== 'Administrator' && (
                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn btn-warning w-100 rounded-3 fw-bold text-dark d-flex align-items-center justify-content-center gap-2 py-2.5 shadow-sm transition-all"
                      style={{ border: '1.5px solid #d39e00' }}
                      onClick={handleRestoreDefaultPassword}
                      disabled={isUpdatingPassword}
                    >
                      🔄 Restore Default Original Password
                    </button>
                    <div className="form-text text-muted small text-center mt-1">
                      Resets hash to original plain-text: <strong>{selectedCredentials.role === 'Client' ? 'client123' : 'worker123'}</strong>
                    </div>
                  </div>
                )}

                <hr />

                {/* Additional Info Rows */}
                <div className="row g-2 small">
                  <div className="col-6">
                    <div className="text-muted fw-bold">📞 Contact Phone</div>
                    <div className="fw-bold text-dark">{selectedCredentials.phone || 'Not Shared'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted fw-bold">📍 Access Location / Status</div>
                    <div className="fw-bold text-dark">{selectedCredentials.address || 'Active Audit Session'}</div>
                  </div>
                  {selectedCredentials.extra && (
                    <div className="col-12 mt-2 pt-2 border-top">
                      <div className="text-muted fw-bold">ℹ️ Professional Details</div>
                      <div className="fw-bold text-primary">{selectedCredentials.extra}</div>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-0 bg-light rounded-bottom-4 py-2">
                <button type="button" className="btn btn-secondary rounded-3 px-4 fw-bold" onClick={closeAuditorModal}>Close Auditor</button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR CREATING NEW ADMIN */}
      {showAddAdminModal && (
        <div className="modal show d-block animate__animated animate__fadeIn" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden" style={{ border: '1.5px solid #e8ecf8' }}>

              {/* Modal Header */}
              <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #198754 0%, #146c43 100%)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="modal-title fw-bold m-0 d-flex align-items-center gap-2">
                    🛡️ Add New Administrative Officer
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddAdminModal(false)}></button>
                </div>
                <div className="mt-2 small opacity-75">Create an administrative account with Full Authority Access</div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateAdminSubmit}>
                <div className="modal-body p-4 bg-white text-start">
                  {adminError && (
                    <div className="alert alert-danger small py-2 rounded-3 border-0 mb-3">
                      ⚠️ {adminError}
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="mb-3">
                    <label htmlFor="adminName" className="form-label small fw-bold text-muted">👤 Full Officer Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3 p-2.5"
                      id="adminName"
                      required
                      placeholder="e.g. Inspector Gurpreet Singh"
                      value={adminForm.fullName}
                      onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                      style={{ border: '1.5px solid #cbd5e1' }}
                    />
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="adminEmail" className="form-label small fw-bold text-muted">📧 Administrative Email Address</label>
                    <input
                      type="email"
                      className="form-control rounded-3 p-2.5"
                      id="adminEmail"
                      required
                      placeholder="e.g. gurpreet@quicklabour.com"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      style={{ border: '1.5px solid #cbd5e1' }}
                    />
                  </div>

                  {/* Phone */}
                  <div className="mb-3">
                    <label htmlFor="adminPhone" className="form-label small fw-bold text-muted">📞 Contact Phone Number</label>
                    <input
                      type="tel"
                      className="form-control rounded-3 p-2.5"
                      id="adminPhone"
                      required
                      placeholder="e.g. +91 98765-43210"
                      value={adminForm.phone}
                      onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                      style={{ border: '1.5px solid #cbd5e1' }}
                    />
                  </div>

                  {/* Profile Avatar Upload */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted d-block">🖼️ Profile Avatar Photo (Optional)</label>
                    <div className="d-flex align-items-center gap-3 p-2 rounded-3 bg-light" style={{ border: '1.5px dashed #cbd5e1' }}>
                      {adminForm.avatar ? (
                        <img
                          src={adminForm.avatar}
                          alt="Preview"
                          className="rounded-circle border border-2 border-success shadow-sm"
                          style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="rounded-circle bg-white d-flex align-items-center justify-content-center text-muted border shadow-sm" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
                          👤
                        </div>
                      )}
                      <div className="flex-fill">
                        <input
                          type="file"
                          accept="image/*"
                          id="adminAvatarFile"
                          className="d-none"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAdminForm({ ...adminForm, avatar: reader.result });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label
                          htmlFor="adminAvatarFile"
                          className="btn btn-primary btn-sm rounded-3 fw-bold px-3 py-2 text-nowrap"
                          style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #0d6efd, #6610f2)', border: 'none' }}
                        >
                          Choose from Photos
                        </label>
                        {adminForm.avatar && (
                          <button
                            type="button"
                            className="btn btn-link text-danger btn-sm ms-2 p-0 text-decoration-none fw-bold"
                            onClick={() => setAdminForm({ ...adminForm, avatar: '' })}
                          >
                            Remove
                          </button>
                        )}
                        <div className="form-text small text-muted mt-1" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>
                          Select any image file from your device.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Access Level Dropdown */}
                  <div className="mb-3">
                    <label htmlFor="adminRoleType" className="form-label small fw-bold text-muted">🛡️ Authority Role / Access Level</label>
                    <select
                      className="form-select rounded-3 p-2.5"
                      id="adminRoleType"
                      required
                      value={adminForm.roleType}
                      onChange={(e) => setAdminForm({ ...adminForm, roleType: e.target.value })}
                      style={{ border: '1.5px solid #cbd5e1' }}
                    >
                      <option value="super_admin">Super Admin (Full Access: All Tabs + Manage Admins & Complains)</option>
                      <option value="stats_viewer">Stats Analyst (Overview & Performance Graphs Only)</option>
                      <option value="operations_manager">Operations Manager (Clients, Workers, Jobs, Reviews & Inquiries Only)</option>
                      <option value="disputes_officer">Complain Officer (Complains & Escalations Desk Only)</option>
                    </select>
                    <div className="form-text small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      Determines which tabs and controls this administrator can access on the Admin Wallet Hub.
                    </div>
                  </div>

                  {/* Strong Password */}
                  <div className="mb-3">
                    <label htmlFor="adminPassword" className="form-label small fw-bold text-muted">🔑 Strong Password (8+ characters, mixed case, number & symbol)</label>
                    <input
                      type="password"
                      className="form-control rounded-3 p-2.5"
                      id="adminPassword"
                      required
                      placeholder="e.g. AdminSecure@1313"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      style={{ border: '1.5px solid #cbd5e1' }}
                    />
                    <div className="form-text small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="modal-footer border-0 bg-light rounded-bottom-4 py-3 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill rounded-3 py-2 fw-bold"
                    onClick={() => setShowAddAdminModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success flex-fill rounded-3 py-2 fw-bold"
                    style={{ background: 'linear-gradient(135deg, #198754, #146c43)', border: 'none' }}
                    disabled={creatingAdmin}
                  >
                    {creatingAdmin ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registering...
                      </>
                    ) : 'Create & Give Full Access'}
                  </button>
                </div>
              </form>

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
    </div>
  );
};

export default AdminDashboard;

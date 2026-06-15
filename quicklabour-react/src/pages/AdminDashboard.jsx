import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
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
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [disputes, setDisputes] = useState(
    JSON.parse(localStorage.getItem('quicklabour_disputes') || '[]')
  );

  // Sync disputes regularly
  useEffect(() => {
    const handleStorageChange = () => {
      setDisputes(JSON.parse(localStorage.getItem('quicklabour_disputes') || '[]'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleResolveDispute = (disputeId, decision) => {
    const updated = disputes.map(d => {
      if (d._id === disputeId) {
        return { ...d, status: 'Resolved', resolutionDecision: decision };
      }
      return d;
    });
    setDisputes(updated);
    localStorage.setItem('quicklabour_disputes', JSON.stringify(updated));
    alert(`✅ Dispute resolved successfully. Decision: "${decision}" recorded.`);
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
    if (sessionStorage.getItem('userEmail') === 'admin@quicklabour.com') return true;
    if (tab === 'disputes' && (userPermissions.includes('admins') || userPermissions.includes('overview'))) return true;
    return userPermissions.includes(tab);
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

    // Auto-refresh admin dashboard silently every 5 seconds
    const interval = setInterval(() => {
      fetchAdminData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const tabsList = ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts', 'admins', 'disputes'];
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

      alert(`🎉 Password restored to default original password successfully!\n\nPlaintext Password: "${defaultPwd}"`);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to restore default password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const closeAuditorModal = () => {
    setSelectedCredentials(null);
    setShowPlaintextInAuditor(false);
  };

  const fetchAdminData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      // Sync permissions in real-time
      try {
        const profile = await api.get('/auth/profile');
        if (profile && profile.permissions) {
          sessionStorage.setItem('userPermissions', JSON.stringify(profile.permissions));
          setUserPermissions(profile.permissions);
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
    } catch (err) {
      setError(err.message || 'Failed to fetch administrative data');
    } finally {
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
      alert(err.message || 'Deletion failed');
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setAdminError('');
    try {
      // By default give full access permissions
      const permissions = ['overview', 'clients', 'workers', 'jobs', 'reviews', 'contacts', 'admins', 'disputes'];
      await api.post('/admin/admins', {
        ...adminForm,
        permissions
      });
      
      alert('🎉 New admin account created successfully with FULL ACCESS!');
      setShowAddAdminModal(false);
      setAdminForm({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        avatar: '',
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
    <div className="admin-dashboard-container py-5 px-3" style={{ minHeight: '90vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <div className="container-fluid max-w-7xl mx-auto">

        {/* Header Block */}
        <div className="glass-card p-4 mb-4 rounded-4 shadow-sm border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3" style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(10px)' }}>
          <div>
            <h2 className="fw-extrabold mb-1" style={{ color: '#1a252f', letterSpacing: '-0.5px' }}>
              🛠️ Control Center <span className="badge bg-danger fs-6 align-middle ms-2">Admin Portal</span>
            </h2>
            <p className="text-muted mb-0">System Overview, Directories Monitoring, and Platform Moderation panel.</p>
          </div>
          <div className="d-flex gap-2">
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
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: 'rgba(255, 255, 255, 0.85)', borderLeft: '5px solid #007bff' }}>
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
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: 'rgba(255, 255, 255, 0.85)', borderLeft: '5px solid #28a745' }}>
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
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: 'rgba(255, 255, 255, 0.85)', borderLeft: '5px solid #fd7e14' }}>
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
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: 'rgba(255, 255, 255, 0.85)', borderLeft: '5px solid #dc3545' }}>
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
        </div>

        {/* Tab Navigator */}
        <div className="card border-0 shadow-sm rounded-4 p-2 mb-4" style={{ background: 'rgba(255, 255, 255, 0.85)' }}>
          <div className="nav nav-pills d-flex flex-wrap gap-1 border-0">
            {hasPermission('overview') && (
              <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'overview' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('overview'); setSearchTerm(''); }}>
                📊 Stats Graph
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
                ⚖️ Disputes Panel ({JSON.parse(localStorage.getItem('quicklabour_disputes') || '[]').length})
              </button>
            )}
          </div>
        </div>

        {/* Optional Search / Filtering Bar */}
        {activeTab !== 'overview' && (
          <div className="mb-4">
            <div className="input-group shadow-sm rounded-3 overflow-hidden">
              <span className="input-group-text bg-white border-0"><i className="bi bi-search"></i></span>
              <input type="text" className="form-control border-0 py-2" placeholder={`Search records in ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        )}

        {/* Tab Contents */}
        <div className="glass-card rounded-4 p-4 shadow-sm border-0" style={{ background: 'rgba(255, 255, 255, 0.85)', minHeight: '400px' }}>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && hasPermission('overview') && (
            <div>
              <h4 className="fw-bold text-dark mb-4"><i className="bi bi-graph-up me-2 text-primary"></i> Platform Revenue & Performance Metrics</h4>
              <div className="row g-4">
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="card bg-dark text-white rounded-4 border-0 p-4 shadow-sm">
                    <h6 className="text-uppercase fw-bold text-muted mb-2">Total Job Transaction Volume</h6>
                    <h2 className="fw-black text-warning">₹{stats.totalBudget.toLocaleString('en-IN')}</h2>
                    <p className="small text-muted mb-0">Total combined budgets posted by clients since establishment.</p>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="card bg-white rounded-4 border-0 p-4 shadow-sm">
                    <h6 className="text-uppercase fw-bold text-muted mb-2">Service Matchmaking Rate</h6>
                    <h2 className="fw-black text-primary">
                      {stats.jobsCount > 0 ? Math.round((jobs.filter(j => j.status === 'Accepted' || j.status === 'Completed').length / stats.jobsCount) * 100) : 0}%
                    </h2>
                    <p className="small text-muted mb-0">Percentage of job bookings successfully matched with a local worker.</p>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="card bg-white rounded-4 border-0 p-4 shadow-sm">
                    <h6 className="text-uppercase fw-bold text-muted mb-2">Community Reviews Loaded</h6>
                    <h2 className="fw-black text-success">{stats.reviewsCount} ⭐</h2>
                    <p className="small text-muted mb-0">Total user ratings submitted dynamically on the platform reviews portal.</p>
                  </div>
                </div>
              </div>

              {/* Graphic Mock */}
              <div className="mt-5 p-4 border rounded-4 text-center bg-light shadow-inner">
                <i className="bi bi-activity text-primary fs-1 mb-2"></i>
                <h5 className="fw-bold mb-1">Platform Activity is 100% Online</h5>
                <p className="text-muted small mb-0">Express API connected directly to your MongoDB Atlas cluster: `QuickLabour_data`.</p>
              </div>
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
                            <img src={client.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'} alt="Avatar" className="rounded-circle me-3" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
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
                    className={`btn btn-sm rounded-pill px-3 py-2 fw-bold transition-all border-0 ${
                      selectedSpecialty === spec 
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
                            <img src={worker.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80'} alt="Avatar" className="rounded-circle me-3" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
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
                            🪙 {worker.points !== undefined ? worker.points : 0} Points
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
                                extra: `Occupation: ${worker.occupation} | Rating: ${worker.rating || '4.9'} ⭐ | Points Balance: ${worker.points !== undefined ? worker.points : 0} Points`
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
                            <img src={job.client?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'} alt="Avatar" className="rounded-circle me-2" style={{ width: '30px', height: '30px', objectFit: 'cover' }} />
                            <span className="small fw-bold">{job.name || job.client?.fullName || 'Client'}</span>
                          </div>
                        </td>
                        <td className="fw-bold text-success">₹{job.money || 0}</td>
                        <td>
                          {job.hiredWorker ? (
                            <div className="d-flex align-items-center">
                              <img src={job.hiredWorker?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80'} alt="Avatar" className="rounded-circle me-2" style={{ width: '30px', height: '30px', objectFit: 'cover' }} />
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
                <h5 className="fw-bold mb-0 text-dark">⚖️ Safe Platform Disputes & Escalation Resolution Desk</h5>
                <span className="badge bg-danger text-white fw-bold px-3 py-2">
                  {disputes.filter(d => d.status !== 'Resolved').length} Unresolved Cases
                </span>
              </div>
              <div className="alert alert-info rounded-3 py-2 px-3 mb-4" style={{ fontSize: '0.88rem' }}>
                ℹ️ QuickLabour Administrator safety policy requires auditing caller screenshot details, GPS tracking coordinates, and physical selfie evidence before releasing or wallet penalty adjustments.
              </div>

              {disputes.length > 0 ? (
                <div className="row g-4">
                  {disputes.map((disp) => (
                    <div key={disp._id} className="col-md-6 col-lg-6">
                      <div className="card rounded-4 shadow-sm border-0 p-4 bg-white text-start h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <span className="badge bg-danger bg-opacity-10 text-danger fw-700 small" style={{ fontSize: '0.7rem' }}>
                              FILED BY: {disp.submittedBy.toUpperCase()}
                            </span>
                            <h6 className="fw-bold text-dark mt-1 mb-0">{disp.jobTitle}</h6>
                            <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Filed: {disp.createdAt}</span>
                          </div>
                          <span className={`badge px-2 py-1 rounded-pill ${
                            disp.status === 'Resolved' ? 'bg-success text-white' : 'bg-warning text-white'
                          }`}>
                            {disp.status}
                          </span>
                        </div>

                        <div className="mb-3 p-3 bg-light rounded-3 border">
                          <div className="small text-dark mb-1"><strong>Client:</strong> {disp.clientName}</div>
                          <div className="small text-dark mb-2"><strong>Worker:</strong> {disp.workerName}</div>
                          <hr className="my-2 text-muted" />
                          <div className="small text-muted mb-0"><strong>Escalation Reason:</strong></div>
                          <div className="small text-dark mt-1 font-monospace" style={{ fontSize: '0.8rem' }}>"{disp.reason}"</div>
                        </div>

                        <div className="d-flex gap-2 mb-3 flex-wrap">
                          <div>
                            <span className="d-block small text-muted fw-bold mb-1" style={{ fontSize: '0.7rem' }}>Selfie Proof</span>
                            <img src={disp.photo} alt="Selfie" className="rounded border shadow-sm" style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setSelectedDoc({ name: `${disp.submittedBy} Selfie Proof`, type: 'Selfie Photo', file: disp.photo })} />
                          </div>
                          <div>
                            <span className="d-block small text-muted fw-bold mb-1" style={{ fontSize: '0.7rem' }}>Call Log Proof</span>
                            <img src={disp.callLog} alt="Call Logs" className="rounded border shadow-sm" style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setSelectedDoc({ name: `${disp.submittedBy} Call Log Proof`, type: 'Call Screenshot', file: disp.callLog })} />
                          </div>
                          <div>
                            <span className="d-block small text-muted fw-bold mb-1" style={{ fontSize: '0.7rem' }}>GPS Coordinates</span>
                            <span className="badge bg-secondary text-white font-monospace" style={{ fontSize: '0.72rem', padding: '6px' }}>{disp.gpsLocation}</span>
                          </div>
                        </div>

                        {disp.status !== 'Resolved' ? (
                          <div className="mt-auto pt-3 border-top d-flex gap-2">
                            <button
                              onClick={() => handleResolveDispute(disp._id, `Resolved in favor of Client (${disp.clientName}). Worker penalized.`)}
                              className="btn btn-sm btn-outline-primary fw-bold flex-fill rounded-3"
                            >
                              Rule in favor of Client
                            </button>
                            <button
                              onClick={() => handleResolveDispute(disp._id, `Resolved in favor of Worker (${disp.workerName}). Compensation confirmed.`)}
                              className="btn btn-sm btn-outline-success fw-bold flex-fill rounded-3"
                            >
                              Rule in favor of Worker
                            </button>
                          </div>
                        ) : (
                          <div className="mt-auto pt-3 border-top small text-success fw-bold">
                            Resolved: "{disp.resolutionDecision}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-shield-check fs-1 text-success opacity-75 mb-3 d-block"></i>
                  <h6 className="fw-bold">All clean! No active disputes or escalated complaints.</h6>
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
                      readOnly
                      value={selectedCredentials.email}
                      style={{ fontSize: '0.9rem' }}
                    />
                    <button
                      className="btn btn-outline-secondary px-3"
                      style={{ borderRadius: '0 10px 10px 0' }}
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCredentials.email);
                        alert('📋 Email / User ID copied to clipboard!');
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
                        alert(`📋 ${(selectedCredentials.role !== 'Administrator' && showPlaintextInAuditor) ? 'Plaintext Password' : 'Secure Password record'} copied to clipboard!`);
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
                      onChange={(e) => setAdminForm({...adminForm, fullName: e.target.value})}
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
                      onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
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
                      onChange={(e) => setAdminForm({...adminForm, phone: e.target.value})}
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
                      onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
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

    </div>
  );
};

export default AdminDashboard;

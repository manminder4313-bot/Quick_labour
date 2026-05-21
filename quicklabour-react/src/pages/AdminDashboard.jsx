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

  // Add Administrator Modal state
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    avatar: '',
  });

  useEffect(() => {
    // Check authorization: must be logged in as admin
    const userRole = sessionStorage.getItem('userRole');
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
      return;
    }

    fetchAdminData();
  }, [navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes);

      const clientsRes = await api.get('/admin/clients');
      setClients(clientsRes);

      const workersRes = await api.get('/admin/workers');
      setWorkers(workersRes);

      const jobsRes = await api.get('/admin/jobs');
      setJobs(jobsRes);

      const contactsRes = await api.get('/admin/contacts');
      setContacts(contactsRes);

      const reviewsRes = await api.get('/admin/reviews');
      setReviews(reviewsRes);

      const adminsRes = await api.get('/admin/admins');
      setAdmins(adminsRes);
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

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    // Client-side strong password validation check
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!strongPasswordRegex.test(newAdminData.password)) {
      alert('🔒 Password is too weak!\n\nIt must be at least 8 characters long, and contain:\n- At least 1 uppercase letter\n- At least 1 lowercase letter\n- At least 1 number\n- At least 1 special character (@$!%*?&#)');
      return;
    }

    try {
      const created = await api.post('/admin/admins', newAdminData);
      setAdmins([created, ...admins]);
      setShowAddAdminModal(false);
      setNewAdminData({ fullName: '', email: '', password: '', phone: '', avatar: '' });

      // Refresh stats
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes);

      alert('🎉 New Administrator account created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create administrative account');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAdminData({ ...newAdminData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
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
            <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'overview' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('overview'); setSearchTerm(''); }}>
              📊 Stats Graph
            </button>
            <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'clients' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('clients'); setSearchTerm(''); }}>
              👥 Clients ({clients.length})
            </button>
            <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'workers' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('workers'); setSearchTerm(''); }}>
              👷 Workers ({workers.length})
            </button>
            <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'jobs' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('jobs'); setSearchTerm(''); }}>
              🛠️ Job Listings ({jobs.length})
            </button>
            <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'reviews' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('reviews'); setSearchTerm(''); }}>
              ⭐ Reviews ({reviews.length})
            </button>
            <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'contacts' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('contacts'); setSearchTerm(''); }}>
              💬 Inquiries ({contacts.length})
            </button>
            <button className={`nav-link rounded-3 fw-bold flex-fill text-center ${activeTab === 'admins' ? 'active bg-primary' : 'text-dark bg-transparent'}`} onClick={() => { setActiveTab('admins'); setSearchTerm(''); }}>
              🛡️ Admins ({admins.length})
            </button>
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
          {activeTab === 'overview' && (
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
          {activeTab === 'clients' && (
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
                                name: client.fullName,
                                email: client.email,
                                password: client.password || 'Secret Encrypted',
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
          {activeTab === 'workers' && (
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
                          <span className="small text-muted">{worker.jobsCompleted || 0} completions</span>
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
                                name: worker.fullName,
                                email: worker.email,
                                password: worker.password || 'Secret Encrypted',
                                role: 'Worker / Labour',
                                phone: worker.phone,
                                address: worker.address || 'Not Provided',
                                extra: `Occupation: ${worker.occupation} | Rating: ${worker.rating || '4.9'} ⭐`
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
          {activeTab === 'jobs' && (
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
          {activeTab === 'contacts' && (
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
          {activeTab === 'reviews' && (
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
          {activeTab === 'admins' && (
            <div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
                <h5 className="fw-bold mb-0 text-dark">Administrative Authority Officers</h5>
                <button className="btn btn-primary rounded-3 px-3 py-2 fw-bold btn-sm" onClick={() => setShowAddAdminModal(true)}>
                  <i className="bi bi-person-plus-fill me-1"></i> Add Administrator
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
                            <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-1.5 fw-bold">Full Access</span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm rounded-3 fw-bold text-white px-3"
                                style={{ background: 'linear-gradient(135deg,#0d6efd,#6610f2)', border: 'none' }}
                                onClick={() => setSelectedCredentials({
                                  name: admin.fullName,
                                  email: admin.email,
                                  password: admin.password || 'Secret Encrypted',
                                  role: 'Administrator',
                                  phone: admin.phone || 'Not Provided',
                                  address: 'Full System Control Center Access'
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
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedCredentials(null)}></button>
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

                {/* Password Field */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">🔒 Password (Bcrypt Hash Record)</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control rounded-start-3 bg-light border-1 font-monospace"
                      readOnly
                      value={selectedCredentials.password}
                      style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}
                    />
                    <button
                      className="btn btn-outline-secondary px-3"
                      style={{ borderRadius: '0 10px 10px 0' }}
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCredentials.password);
                        alert('📋 Secure Password record copied to clipboard!');
                      }}
                      title="Copy Password Record"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div className="form-text small text-danger mt-1" style={{ fontSize: '0.72rem' }}>
                    🛡️ Password stored securely using secure cryptographic algorithms.
                  </div>
                </div>

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
                <button type="button" className="btn btn-secondary rounded-3 px-4 fw-bold" onClick={() => setSelectedCredentials(null)}>Close Auditor</button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR REGISTERING NEW ADMINISTRATORS */}
      {showAddAdminModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg animate__animated animate__fadeInDown">
              <div className="modal-header border-0 bg-light rounded-top-4 py-3">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-person-plus-fill text-primary me-2"></i> Register New Administrator</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddAdminModal(false)}></button>
              </div>
              <form onSubmit={handleCreateAdmin}>
                <div className="modal-body p-4 text-start">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Full Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2 border-1"
                      placeholder="e.g. Gurpreet Singh"
                      required
                      value={newAdminData.fullName}
                      onChange={(e) => setNewAdminData({ ...newAdminData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Email Address</label>
                    <input
                      type="email"
                      className="form-control rounded-3 py-2 border-1"
                      placeholder="e.g. gurpreet@quicklabour.com"
                      required
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                    />
                  </div>
                   <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Secure Password</label><div className="position-relative">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      className="form-control rounded-3 py-2 border-1"
                      placeholder="At least 8 characters with numbers & symbols" style={{ paddingRight: '45px' }}
                      required
                      value={newAdminData.password}
                      onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn position-absolute border-0 bg-transparent"
                      style={{ right: '10px', top: '4px', zIndex: 10, padding: '5px' }}
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                    >
                      <i className={`bi ${showAdminPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted fs-5`}></i>
                    </button>
                    </div>
                    <div className="form-text small text-muted">
                      Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Contact Phone</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2 border-1"
                      placeholder="e.g. +91 98765 43210"
                      required
                      value={newAdminData.phone}
                      onChange={(e) => setNewAdminData({ ...newAdminData, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Profile Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control rounded-3 py-2 border-1"
                      onChange={handleFileChange}
                    />
                    {newAdminData.avatar && (
                      <div className="mt-2 text-center">
                        <img
                          src={newAdminData.avatar}
                          alt="Profile Preview"
                          className="rounded-circle border"
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light rounded-bottom-4 py-3 d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-secondary rounded-3 px-3 fw-bold" onClick={() => setShowAddAdminModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-3 px-4 fw-bold">Create Profile</button>
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

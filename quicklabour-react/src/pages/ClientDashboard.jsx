import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import ChatWidget from '../components/ChatWidget';

const ClientDashboard = () => {
  const [dbJobs, setDbJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hireMessage, setHireMessage] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'past'

  // Profile reactive states
  const [profileName, setProfileName] = useState(sessionStorage.getItem('userName') || 'Raj Malhotra');
  const [profilePhone, setProfilePhone] = useState(sessionStorage.getItem('userPhone') || '+91 98765 43210');
  const [profileAddress, setProfileAddress] = useState(sessionStorage.getItem('userAddress') || 'Mumbai, Maharashtra');
  const [profileAvatar, setProfileAvatar] = useState(sessionStorage.getItem('userAvatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80');

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
    } catch (error) {
      console.error('Error fetching jobs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
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

  // Rating Modal States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const openCompleteModal = (jobId) => {
    setSelectedJobId(jobId);
    setRatingValue(5);
    setReviewText('');
    setShowRatingModal(true);
  };

  const handleCompleteJobSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJobId) return;

    setSubmittingRating(true);
    try {
      await api.completeJob(selectedJobId, ratingValue, reviewText);
      setHireMessage(`🎉 Thank you! The job has been completed and your feedback has been sent to the worker!`);
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

          {/* Dashboard Banner */}
          <div className="dashboard-banner reveal visible">
            <div>
              <h2>Welcome back, {profileName}! 👋</h2>
              <p>Manage your worker postings, evaluate bids, and track your ongoing projects.</p>
            </div>
            <div>
              <Link to="/post-job" className="btn-hero-primary border-0" style={{ background: '#f5a623', color: '#0a2540' }}>
                <i className="bi bi-plus-circle-fill me-2"></i>Post a New Job
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="row g-4 mb-5">
            <div className="col-md-4">
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
            <div className="col-md-4">
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
            <div className="col-md-4">
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
          </div>

          {/* Main Dashboard Panel */}
          <div className="row g-4">
            <div className="col-lg-8">
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
                            <span className={`badge-status ${job.rawStatus === 'Accepted' ? 'success' : 'info'}`}>
                              {job.status}
                            </span>
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
                            <div className="mt-3 bg-light p-3 rounded-16 border d-flex align-items-center gap-3">
                              <div className="spinner-grow spinner-grow-sm text-warning" role="status"></div>
                              <span className="text-muted small fw-bold">🔍 Matching and routing this request to nearby {job.title.split(' ')[0]}s...</span>
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
                                <span className="badge bg-success-subtle text-success fw-700 rounded-pill px-3 py-1">Closed & Completed</span>
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
                  <div className="mb-3">
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
                      onChange={(e) => setEditName(e.target.value)}
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
    </>
  );
};

export default ClientDashboard;

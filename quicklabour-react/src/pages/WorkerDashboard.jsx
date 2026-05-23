import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import ChatWidget from '../components/ChatWidget';

const WorkerDashboard = () => {
  const [hiredJobs, setHiredJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [isOnline, setIsOnline] = useState(sessionStorage.getItem('userOnlineStatus') === 'true');
  const [completedCount, setCompletedCount] = useState(Number(sessionStorage.getItem('userJobsCompleted')) || 18);
  const [workerRating, setWorkerRating] = useState(sessionStorage.getItem('userRating') || '4.9');
  const [actionAlert, setActionAlert] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'invitations', or 'past'

  // Profile reactive states
  const [profileName, setProfileName] = useState(sessionStorage.getItem('userName') || 'Ramesh Kumar');
  const [profilePhone, setProfilePhone] = useState(sessionStorage.getItem('userPhone') || '+91 99887 76655');
  const [profileAddress, setProfileAddress] = useState(sessionStorage.getItem('userAddress') || 'Bandra, Mumbai');
  const [profileAvatar, setProfileAvatar] = useState(sessionStorage.getItem('userAvatar') || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80');
  const [profileOccupation, setProfileOccupation] = useState(sessionStorage.getItem('userOccupation') || 'Professional Plumber');

  // Edit Profile Form States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(profileName);
    setEditPhone(profilePhone);
    setEditAddress(profileAddress);
    setEditAvatar(profileAvatar);
    setEditOccupation(profileOccupation);
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
        avatar: editAvatar,
        occupation: editOccupation
      });
      setProfileName(res.fullName);
      setProfilePhone(res.phone);
      setProfileAddress(res.address);
      setProfileAvatar(res.avatar);
      setProfileOccupation(res.occupation);
      setShowEditModal(false);
    } catch (error) {
      alert('❌ Error updating profile: ' + error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      const sortedHired = [...(data.hiredJobs || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const sortedAvailable = [...(data.availableJobs || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHiredJobs(sortedHired);
      setAvailableJobs(sortedAvailable);
    } catch (error) {
      console.error('Error fetching jobs:', error.message);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Sync completed jobs count and rating from profile
    api.getProfile().then(user => {
      setCompletedCount(user.jobsCompleted);
      setWorkerRating(user.rating !== undefined ? user.rating : '4.9');
      sessionStorage.setItem('userJobsCompleted', user.jobsCompleted);
      sessionStorage.setItem('userRating', user.rating !== undefined ? user.rating : '4.9');
    }).catch(err => console.error(err));
  }, []);

  const handleToggleOnline = async () => {
    try {
      const nextStatus = !isOnline;
      const res = await api.updateOnlineStatus(nextStatus);
      setIsOnline(res.isOnline);
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

  const handleAcceptJob = async (id, clientName) => {
    try {
      await api.updateJobStatus(id, 'Accepted');
      setActionAlert(`✅ Accepted job invitation from ${clientName}! Check your phone for details.`);
      fetchJobs(); // Reload jobs from database
      setTimeout(() => setActionAlert(''), 5000);
    } catch (error) {
      alert('❌ Error accepting job: ' + error.message);
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
            <div className="col-md-3 col-sm-6">
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
            <div className="col-md-3 col-sm-6">
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
            <div className="col-md-3 col-sm-6">
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
            <div className="col-md-3 col-sm-6">
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
          </div>

          {/* Main Work Area */}
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="dashboard-card position-relative h-100">
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
                                  {(job.latitude && job.longitude) || job.fullAddress ? (
                                    <a
                                      href={
                                        job.latitude && job.longitude
                                          ? `https://www.google.com/maps?q=${job.latitude},${job.longitude}`
                                          : `https://www.google.com/maps/search/${encodeURIComponent(job.fullAddress || job.client.address)}`
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="d-inline-flex align-items-center gap-1 fw-bold btn-action-solid py-1 px-3 text-white text-decoration-none"
                                      style={{ height: '34px', fontSize: '0.85rem', background: 'linear-gradient(135deg,#0d6efd,#6610f2)', border: 'none' }}
                                    >
                                      🗺️ GPS Route
                                    </a>
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
                              <div className="fw-800 text-success mb-2" style={{ fontSize: '1.1rem' }}>{inv.rate}</div>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn-action-solid py-1 px-3"
                                  style={{ background: '#1db97a' }}
                                  onClick={() => handleAcceptJob(inv.id, inv.client)}
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
    </>
  );
};

export default WorkerDashboard;

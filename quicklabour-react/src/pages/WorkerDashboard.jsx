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

  // Retrieve session variables if user signed up
  const sessionName = sessionStorage.getItem('userName') || 'Ramesh Kumar';
  const sessionPhone = sessionStorage.getItem('userPhone') || '+91 99887 76655';
  const sessionAddress = sessionStorage.getItem('userAddress') || 'Bandra, Mumbai';
  const sessionAvatar = sessionStorage.getItem('userAvatar') || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80';
  const sessionOccupation = sessionStorage.getItem('userOccupation') || 'Professional Plumber';
  const sessionRating = sessionStorage.getItem('userRating') || '4.9';

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
              <h2>Welcome back, {sessionName}! 🛠️</h2>
            </div>
            <p>You are logged in as a **{sessionOccupation}**. Review nearby requests and build your schedule.</p>
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
              
              {/* Blur Screen if Offline */}
              {!isOnline && (
                <div 
                  className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center text-center p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '20px',
                    zIndex: 10,
                    top: 0, left: 0, right: 0, bottom: 0
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
                    onClick={() => setIsOnline(true)}
                  >
                    Go Online Now
                  </button>
                </div>
              )}

              <div className="dashboard-card-title">
                <span>Nearby Job Invitations</span>
                <span className="badge bg-success rounded-pill small" style={{ fontSize: '0.8rem' }}>
                  {invitations.length} Available
                </span>
              </div>

              {invitations.length > 0 ? (
                invitations.map(inv => (
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
                ))
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-clipboard-x fs-1 mb-3 text-muted opacity-50 d-block"></i>
                  <h6 className="fw-700">No active job invitations</h6>
                  <p className="small mb-0">Check back later or browse other open work orders.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="dashboard-card mb-4">
              <h5 className="fw-700 mb-3" style={{ color: '#0a2540' }}>Worker Profile</h5>
              <div className="text-center py-3 border-bottom mb-3">
                <img 
                  src={sessionAvatar} 
                  alt={sessionName} 
                  className="rounded-circle border border-3 border-success mb-3" 
                  style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                />
                <h6 className="fw-800 mb-1">{sessionName}</h6>
                <span className="badge bg-primary-subtle text-primary fw-700">{sessionOccupation}</span>
              </div>
              <ul className="list-unstyled mb-0">
                <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-geo-alt text-muted"></i> {sessionAddress}</li>
                <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-telephone text-muted"></i> {sessionPhone}</li>
                <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-award text-muted"></i> 8 Years Experience</li>
              </ul>
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
      currentUserName={sessionName}
      currentUserRole="worker"
      currentUserAvatar={sessionAvatar}
    />
    </>
  );
};

export default WorkerDashboard;

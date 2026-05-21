import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import ChatWidget from '../components/ChatWidget';

const ClientDashboard = () => {
  const [dbJobs, setDbJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hireMessage, setHireMessage] = useState('');

  // Retrieve session variables if user signed up
  const sessionName = sessionStorage.getItem('userName') || 'Raj Malhotra';
  const sessionPhone = sessionStorage.getItem('userPhone') || '+91 98765 43210';
  const sessionAddress = sessionStorage.getItem('userAddress') || 'Mumbai, Maharashtra';
  const sessionAvatar = sessionStorage.getItem('userAvatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80';

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      setDbJobs(data);
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
  const activeJobs = dbJobs.map(job => ({
    id: job._id,
    title: job.title,
    date: `Posted ${new Date(job.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}`,
    status: job.status === 'Waiting...' ? 'Open for Bids' : (job.status === 'Accepted' ? 'Hired & In Progress' : (job.status === 'Completed' ? 'Work Completed' : 'Rejected')),
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

  // Calculate dynamic stats from MongoDB jobs
  const stats = {
    jobsPosted: dbJobs.length,
    activeHires: dbJobs.filter(j => j.status === 'Accepted').length,
    spending: '₹' + dbJobs
      .filter(j => j.status === 'Accepted' || j.status === 'Completed')
      .reduce((acc, curr) => acc + (curr.money || 0), 0)
      .toLocaleString('en-IN')
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
            <h2>Welcome back, {sessionName}! 👋</h2>
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
              <div className="dashboard-card-title">
                <span>Active Service Requests</span>
                <span className="badge bg-primary rounded-pill small" style={{ fontSize: '0.8rem' }}>2 Postings</span>
              </div>

              {activeJobs.map(job => (
                <div key={job.id} className="mb-5 border-bottom pb-4" style={{ borderBottomStyle: 'dashed' }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-700 mb-1" style={{ color: '#0a2540' }}>{job.title}</h5>
                      <span className="text-muted small fw-600"><i className="bi bi-calendar3 me-1"></i>{job.date}</span>
                    </div>
                    <span className={`badge-status ${job.status.includes('Hired') ? 'success' : 'info'}`}>
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
                        <button className="btn-action-outline py-1 px-3"><i className="bi bi-chat-dots-fill me-1"></i>Message</button>
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
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="dashboard-card mb-4">
              <h5 className="fw-700 mb-3" style={{ color: '#0a2540' }}>Account Settings</h5>
              <div className="text-center py-3 border-bottom mb-3">
                <img 
                  src={sessionAvatar} 
                  alt={sessionName} 
                  className="rounded-circle border border-3 border-primary mb-3" 
                  style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                />
                <h6 className="fw-800 mb-1">{sessionName}</h6>
                <span className="badge bg-success-subtle text-success fw-700">Verified Client</span>
              </div>
              <ul className="list-unstyled mb-0">
                <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-envelope text-muted"></i> client@quicklabour.com</li>
                <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-telephone text-muted"></i> {sessionPhone}</li>
                <li className="py-2 d-flex align-items-center gap-2"><i className="bi bi-geo-alt text-muted"></i> {sessionAddress}</li>
              </ul>
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
      currentUserName={sessionName}
      currentUserRole="client"
      currentUserAvatar={sessionAvatar}
    />
    </>
  );
};

export default ClientDashboard;

import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';

const getAvatarUrl = (avatar, name) => {
  if (!avatar || avatar.includes('images.unsplash.com')) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0d6efd&color=fff&size=150`;
  }
  return avatar;
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    const name = sessionStorage.getItem('userName');
    const avatar = sessionStorage.getItem('userAvatar');
    const occupation = sessionStorage.getItem('userOccupation');

    if (role && name) {
      setUser({ role, name, avatar, occupation });
    } else {
      setUser(null);
    }
  }, [location]);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    const role = sessionStorage.getItem('userRole');
    if (!userId || !role) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const loadNotifications = async () => {
      try {
        // Read from localStorage first for instant display
        const cached = localStorage.getItem(`notifications_${userId}`);
        const readList = JSON.parse(localStorage.getItem(`notifications_read_${userId}`) || '[]');
        if (cached) {
          const list = JSON.parse(cached);
          setNotifications(list);
          const unread = list.filter(n => !readList.includes(n.id)).length;
          setUnreadCount(unread);
        }

        // Fetch jobs to update notifications
        if (role === 'client' || role === 'worker') {
          const data = await api.getJobs();
          const list = [];
          
          if (role === 'client') {
            const sorted = Array.isArray(data) ? data : [];
            sorted.forEach(job => {
              if (job.status === 'Waiting...' && job.bidders) {
                job.bidders.forEach(b => {
                  list.push({
                    id: `bid_${job._id}_${b.worker?._id}`,
                    title: 'New Bid Received',
                    message: `Worker ${b.worker?.fullName || 'Labour'} placed a bid of ₹${b.rate} on "${job.title}"`,
                    time: job.updatedAt || job.createdAt,
                    type: 'bid'
                  });
                });
              }
              if (job.status === 'Accepted' && job.hiredWorker) {
                list.push({
                  id: `hired_${job._id}`,
                  title: 'Worker Hired',
                  message: `${job.hiredWorker.fullName} is in progress for "${job.title}"`,
                  time: job.updatedAt || job.createdAt,
                  type: 'hired'
                });
              }
              if (job.status === 'Completed') {
                list.push({
                  id: `completed_${job._id}`,
                  title: 'Job Completed',
                  message: `"${job.title}" has been completed successfully.`,
                  time: job.updatedAt || job.createdAt,
                  type: 'completed'
                });
              }
            });

            try {
              const disputes = await api.getDisputes();
              if (Array.isArray(disputes)) {
                disputes.forEach(d => {
                  list.push({
                    id: `dispute_${d._id}`,
                    title: 'Dispute Update',
                    message: `Dispute for "${d.jobTitle}" is currently ${d.status}`,
                    time: d.updatedAt || d.createdAt,
                    type: 'dispute'
                  });
                });
              }
            } catch (de) {
              console.warn("Dispute fetch failed:", de);
            }
          } else if (role === 'worker') {
            const sortedAvailable = Array.isArray(data.availableJobs) ? data.availableJobs : [];
            const sortedHired = Array.isArray(data.hiredJobs) ? data.hiredJobs : [];
            
            sortedAvailable.forEach(job => {
              list.push({
                id: `invitation_${job._id}`,
                title: 'New Job Invitation',
                message: `New available job: "${job.title}" for ₹${job.money}`,
                time: job.createdAt,
                type: 'invitation'
              });
            });
            sortedHired.forEach(job => {
              if (job.status === 'Accepted') {
                list.push({
                  id: `hired_${job._id}`,
                  title: 'Hired for Job',
                  message: `You have been hired for "${job.title}"!`,
                  time: job.updatedAt || job.createdAt,
                  type: 'hired'
                });
              } else if (job.status === 'Completed') {
                list.push({
                  id: `completed_${job._id}`,
                  title: 'Job Completed',
                  message: `Your job "${job.title}" is marked as completed.`,
                  time: job.updatedAt || job.createdAt,
                  type: 'completed'
                });
              }
            });

            try {
              const disputes = await api.getDisputes();
              if (Array.isArray(disputes)) {
                disputes.forEach(d => {
                  list.push({
                    id: `dispute_${d._id}`,
                    title: 'Dispute Update',
                    message: `Dispute for "${d.jobTitle}" is currently ${d.status}`,
                    time: d.updatedAt || d.createdAt,
                    type: 'dispute'
                  });
                });
              }
            } catch (de) {
              console.warn("Dispute fetch failed:", de);
            }
          }

          // Sort by time descending
          const sortedList = list.sort((a, b) => new Date(b.time) - new Date(a.time));
          localStorage.setItem(`notifications_${userId}`, JSON.stringify(sortedList));
          setNotifications(sortedList);
          const unread = sortedList.filter(n => !readList.includes(n.id)).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Failed to load notifications in Navbar:", err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 5000); // poll every 5 seconds
    return () => clearInterval(interval);
  }, [location]);

  const handleMarkAsRead = (id) => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;
    const readList = JSON.parse(localStorage.getItem(`notifications_read_${userId}`) || '[]');
    if (!readList.includes(id)) {
      const newList = [...readList, id];
      localStorage.setItem(`notifications_read_${userId}`, JSON.stringify(newList));
      const unread = notifications.filter(n => !newList.includes(n.id)).length;
      setUnreadCount(unread);
    }
  };

  const handleMarkAllRead = () => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;
    const allIds = notifications.map(n => n.id);
    localStorage.setItem(`notifications_read_${userId}`, JSON.stringify(allIds));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    setShowDropdown(false);
    setShowNotificationsDropdown(false);
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-lightning-charge-fill me-2" style={{ color: '#f5a623' }}></i>
          Quick<span>Labour</span>
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
        >
          <i className="bi bi-list text-white fs-3"></i>
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/categories">Categories</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/works">Works</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/how-it-works">How It Works</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/reviews">Reviews</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/contact">Contact</NavLink>
            </li>

            <li className="nav-item ms-lg-2 me-lg-3 my-2 my-lg-0 d-flex align-items-center">
              <button 
                onClick={toggleTheme} 
                className="btn btn-theme-toggle border-0 text-white p-0 d-flex align-items-center justify-content-center"
                style={{ 
                  background: 'rgba(255,255,255,0.08)', 
                  borderRadius: '50%', 
                  width: '38px', 
                  height: '38px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <i className="bi bi-sun-fill text-warning fs-5"></i>
                ) : (
                  <i className="bi bi-moon-stars-fill text-warning fs-5"></i>
                )}
              </button>
            </li>
            
            {user ? (
              <>
                {/* Profile Dropdown */}
                <li className="nav-item dropdown ms-lg-2 mt-2 mt-lg-0" style={{ position: 'relative' }}>
                  <div 
                    className="d-flex align-items-center gap-2 cursor-pointer" 
                    onClick={() => {
                      setShowDropdown(!showDropdown);
                      setShowNotificationsDropdown(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <img 
                      src={getAvatarUrl(user.avatar, user.name)} 
                      alt={user.name} 
                      className="rounded-circle border border-warning border-2" 
                      style={{ width: '38px', height: '38px', objectFit: 'cover' }} 
                    />
                    <span className="text-white fw-700 d-none d-lg-inline-block" style={{ fontSize: '0.9rem' }}>
                      {user.name.split(' ')[0]} <i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.75rem' }}></i>
                    </span>
                  </div>
                  
                  {showDropdown && (
                    <div 
                      className="dropdown-menu show position-absolute end-0 mt-2 p-3 border-0 shadow-lg text-start"
                      style={{ 
                        borderRadius: '16px', 
                        minWidth: '220px', 
                        background: 'var(--bg-surface)', 
                        border: '1px solid var(--border-color)',
                        zIndex: 1000,
                        right: 0
                      }}
                    >
                      <div className="px-2 py-1 mb-2">
                        <h6 className="fw-800 mb-0" style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{user.name}</h6>
                        <span className="text-primary fw-700" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          {user.role === 'admin' ? 'Administrator' : user.role === 'worker' ? (user.occupation || 'Worker') : 'Client Account'}
                        </span>
                      </div>
                      <hr className="my-2" style={{ borderColor: 'var(--border-color)' }} />
                      <Link 
                        className="dropdown-item py-2 px-2.5 rounded-8 fw-600 d-flex align-items-center gap-2" 
                        to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'worker' ? '/worker-dashboard' : '/client-dashboard'}
                        onClick={() => setShowDropdown(false)}
                        style={{ fontSize: '0.88rem', color: 'var(--text-main)', background: 'transparent' }}
                      >
                        <i className="bi bi-speedometer2 text-primary"></i> Dashboard
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="dropdown-item py-2 px-2.5 rounded-8 fw-600 text-danger border-0 bg-transparent text-start w-100 d-flex align-items-center gap-2"
                        style={{ fontSize: '0.88rem' }}
                      >
                        <i className="bi bi-box-arrow-right"></i> Logout
                      </button>
                    </div>
                  )}
                </li>

                {/* Notification Dropdown */}
                <li className="nav-item dropdown ms-lg-3 mt-2 mt-lg-0" style={{ position: 'relative' }}>
                  <div 
                    className="d-flex align-items-center justify-content-center cursor-pointer position-relative" 
                    onClick={() => {
                      setShowNotificationsDropdown(!showNotificationsDropdown);
                      setShowDropdown(false);
                    }}
                    style={{ 
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.08)', 
                      borderRadius: '50%', 
                      width: '38px', 
                      height: '38px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-bell-fill text-white fs-5"></i>
                    {unreadCount > 0 && (
                      <span 
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
                        style={{ fontSize: '0.65rem', padding: '0.25em 0.5em' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {showNotificationsDropdown && (
                    <div 
                      className="dropdown-menu show position-absolute end-0 mt-2 p-0 border-0 shadow-lg text-start"
                      style={{ 
                        borderRadius: '16px', 
                        width: '320px', 
                        background: 'var(--bg-surface)', 
                        zIndex: 1000,
                        right: 0,
                        border: '1px solid var(--border-color)',
                        maxHeight: '400px',
                        overflowY: 'auto'
                      }}
                    >
                      <div className="p-3 border-bottom d-flex justify-content-between align-items-center rounded-top-16" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                        <h6 className="fw-800 mb-0" style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>Notifications</h6>
                        {unreadCount > 0 && (
                          <button 
                            className="btn btn-link p-0 text-primary fw-700 text-decoration-none small"
                            style={{ fontSize: '0.75rem' }}
                            onClick={handleMarkAllRead}
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      
                      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {notifications.length > 0 ? (
                          notifications.map((n) => {
                            const isRead = JSON.parse(localStorage.getItem(`notifications_read_${sessionStorage.getItem('userId')}`) || '[]').includes(n.id);
                            return (
                              <div 
                                key={n.id}
                                className="p-3 border-bottom cursor-pointer transition-all"
                                onClick={() => {
                                  handleMarkAsRead(n.id);
                                  setShowNotificationsDropdown(false);
                                  navigate(user.role === 'worker' ? '/worker-dashboard' : '/client-dashboard');
                                }}
                                style={{ 
                                  fontSize: '0.82rem', 
                                  borderLeft: isRead ? 'none' : '4px solid var(--primary, #0d6efd)',
                                  background: isRead ? 'var(--bg-surface)' : 'var(--bg-surface-hover)',
                                  borderColor: 'var(--border-color)'
                                }}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <strong className="fw-bold" style={{ color: 'var(--text-main)' }}>{n.title}</strong>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="mb-0 lh-sm" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
                            <i className="bi bi-bell-slash fs-3 mb-2 d-block opacity-50"></i>
                            <span className="small">No notifications yet.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                <Link 
                  className="nav-link px-3 py-2 rounded-pill text-white fw-700 bg-primary bg-opacity-10 border border-primary border-opacity-25" 
                  to="/login"
                  style={{ fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="bi bi-shield-lock-fill text-warning"></i> Portal Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

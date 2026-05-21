import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

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

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    setShowDropdown(false);
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
            
            {user ? (
              <li className="nav-item dropdown ms-lg-3 mt-2 mt-lg-0" style={{ position: 'relative' }}>
                <div 
                  className="d-flex align-items-center gap-2 cursor-pointer" 
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ cursor: 'pointer' }}
                >
                  <img 
                    src={user.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80'} 
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
                      background: '#ffffff', 
                      zIndex: 1000,
                      right: 0
                    }}
                  >
                    <div className="px-2 py-1 mb-2">
                      <h6 className="fw-800 text-dark mb-0" style={{ fontSize: '0.92rem' }}>{user.name}</h6>
                      <span className="text-primary fw-700" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {user.role === 'admin' ? 'Administrator' : user.role === 'worker' ? (user.occupation || 'Worker') : 'Client Account'}
                      </span>
                    </div>
                    <hr className="my-2 text-muted" />
                    <Link 
                      className="dropdown-item py-2 px-2.5 rounded-8 fw-600 text-dark d-flex align-items-center gap-2" 
                      to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'worker' ? '/worker-dashboard' : '/client-dashboard'}
                      onClick={() => setShowDropdown(false)}
                      style={{ fontSize: '0.88rem' }}
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

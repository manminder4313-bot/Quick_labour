import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const workerCategories = [
  'All',
  'Plumber',
  'Painter',
  'Electrician',
  'Carpenter',
  'Mason / Concrete Worker',
  'General Labour',
  'Cleaning Specialist'
];

const Reviews = () => {
  const navigate = useNavigate();
  const [reviewsList, setReviewsList] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Review Form State
  const [newName, setNewName] = useState('');
  const [newSub, setNewSub] = useState('');
  const [newText, setNewText] = useState('');
  const [newWorkerType, setNewWorkerType] = useState('Plumber');
  const [newRating, setNewRating] = useState(5);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchReviews = async () => {
    try {
      const data = await api.getReviews();
      setReviewsList(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    fetchReviews();

    const role = sessionStorage.getItem('userRole');
    const name = sessionStorage.getItem('userName');
    const address = sessionStorage.getItem('userAddress') || 'Punjab';
    
    if (role && name) {
      setIsLoggedIn(true);
      setNewName(name);
      setNewSub(`${role === 'worker' ? 'Worker' : 'Client'}, ${address}`);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Filter Logic
  const filteredReviews = selectedFilter === 'All' 
    ? reviewsList 
    : reviewsList.filter(r => r.workerType.toLowerCase().includes(selectedFilter.toLowerCase()) || selectedFilter.toLowerCase().includes(r.workerType.toLowerCase()));

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newName || !newText) return;

    const role = sessionStorage.getItem('userRole');
    if (!role) {
      navigate('/login');
      return;
    }

    try {
      const reviewData = {
        text: newText,
        rating: parseFloat(newRating),
        workerType: newWorkerType
      };

      await api.submitReview(reviewData);
      
      setNewText('');
      setNewWorkerType('Plumber');
      setNewRating(5);
      setShowSuccess(true);
      
      fetchReviews(); // Reload from MongoDB Atlas
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      alert('❌ Error submitting review: ' + error.message);
    }
  };

  return (
    <div>
      {/* HERO BANNER */}
      <section className="category-hero" style={{ background: 'linear-gradient(135deg, #0a2540 0%, #1a3a5c 100%)', padding: '60px 0', color: 'white' }}>
        <div className="container text-center">
          <h1 className="fw-800" style={{ fontSize: '3rem' }}>Customer Reviews</h1>
          <p style={{ color: '#b0c4de', fontSize: '1.1rem' }}>See honest feedback about our verified local trade workers</p>
          
          {/* STATS OVERVIEW */}
          <div className="d-flex justify-content-center gap-4 flex-wrap mt-4">
            <div className="bg-white bg-opacity-10 px-4 py-3 rounded-20 border border-white border-opacity-10 text-center" style={{ minWidth: '150px' }}>
              <h3 className="fw-800 text-warning mb-0">4.9 ★</h3>
              <span style={{ fontSize: '0.82rem', color: '#b0c4de' }}>Overall Rating</span>
            </div>
            <div className="bg-white bg-opacity-10 px-4 py-3 rounded-20 border border-white border-opacity-10 text-center" style={{ minWidth: '150px' }}>
              <h3 className="fw-800 text-white mb-0">1,420+</h3>
              <span style={{ fontSize: '0.82rem', color: '#b0c4de' }}>Verified Jobs</span>
            </div>
            <div className="bg-white bg-opacity-10 px-4 py-3 rounded-20 border border-white border-opacity-10 text-center" style={{ minWidth: '150px' }}>
              <h3 className="fw-800 text-white mb-0">99.2%</h3>
              <span style={{ fontSize: '0.82rem', color: '#b0c4de' }}>Satisfaction Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER BAR & REVIEW GRID */}
      <section className="py-5" style={{ background: 'var(--bg-app)', transition: 'background-color 0.3s ease' }}>
        <div className="container">
          <div className="row g-4">
            
            {/* LEFT COLUMN: FILTERS & LEAVE REVIEW */}
            <div className="col-lg-4">
              
              {/* FILTER CARD */}
              <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <h5 className="fw-800 mb-3" style={{ color: 'var(--text-main)' }}>
                  <i className="bi bi-funnel text-primary me-2"></i>Filter by Worker Specialty
                </h5>
                <div className="d-flex flex-column gap-2">
                  {workerCategories.map((cat, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedFilter(cat)}
                      className="btn text-start px-3 py-2.5 rounded-12 fw-700 transition-all border-0 d-flex justify-content-between align-items-center"
                      style={{ 
                        fontSize: '0.92rem',
                        background: selectedFilter === cat ? '#0d6efd' : 'var(--bg-app)',
                        color: selectedFilter === cat ? '#ffffff' : 'var(--text-muted)',
                        border: selectedFilter === cat ? 'none' : '1px solid var(--border-color)'
                      }}
                    >
                      <span>{cat}</span>
                      {selectedFilter === cat && <i className="bi bi-check-circle-fill"></i>}
                    </button>
                  ))}
                </div>
              </div>

              {/* LEAVE A REVIEW FORM */}
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <h5 className="fw-800 mb-1" style={{ color: 'var(--text-main)' }}>
                  <i className="bi bi-pencil-square text-primary me-2"></i>Share Your Experience
                </h5>
                <p className="text-muted mb-3" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Did you hire a worker recently? Let others know how they did.</p>

                {!isLoggedIn ? (
                  <div className="text-center py-4 px-2 rounded-16 border border-dashed mt-2" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                    <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}></i>
                    <h6 className="fw-800 mt-2" style={{ color: 'var(--text-main)' }}>Login Required</h6>
                    <p className="text-muted mb-3 px-3 animate-fade-in" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>You must be logged in as a Client or Worker to share your experience with the community.</p>
                    <Link to="/login" className="btn btn-primary btn-sm px-4 py-2 fw-700 rounded-pill shadow-sm" style={{ fontSize: '0.82rem' }}>
                      <i className="bi bi-box-arrow-in-right me-1"></i> Login / Sign Up
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview}>
                    <div className="mb-3">
                      <label className="form-label fw-600 text-muted" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Name</label>
                      <input
                        type="text"
                        className="form-control border-1.5 rounded-12"
                        placeholder="e.g. Amit Kumar"
                        value={newName}
                        disabled
                        style={{ height: '45px', fontSize: '0.9rem', cursor: 'not-allowed', background: 'var(--bg-app)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
                      />
                      <small className="text-muted" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Automatically filled from your profile</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-600 text-muted" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Role / Location</label>
                      <input
                        type="text"
                        className="form-control border-1.5 rounded-12"
                        placeholder="e.g. Home Owner, Ludhiana"
                        value={newSub}
                        disabled
                        style={{ height: '45px', fontSize: '0.9rem', cursor: 'not-allowed', background: 'var(--bg-app)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-600 text-muted" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Which Worker Specialty Did You Hire?</label>
                      <select
                        className="form-select border-1.5 rounded-12"
                        value={newWorkerType}
                        onChange={(e) => setNewWorkerType(e.target.value)}
                        style={{ height: '45px', fontSize: '0.9rem', background: 'var(--card-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
                      >
                        <option value="Plumber">Plumbing Specialist</option>
                        <option value="Painter">Painter / Decorator</option>
                        <option value="Electrician">Electrician</option>
                        <option value="Carpenter">Carpenter</option>
                        <option value="Mason / Concrete Worker">Mason / Concrete Worker</option>
                        <option value="General Labour">General Labour</option>
                        <option value="Cleaning Specialist">Cleaning Specialist</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-600 text-muted d-block mb-1" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rating</label>
                      <select
                        className="form-select border-1.5 rounded-12"
                        value={newRating}
                        onChange={(e) => setNewRating(e.target.value)}
                        style={{ height: '45px', fontSize: '0.9rem', background: 'var(--card-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
                      >
                        <option value="5">5 Stars (Excellent)</option>
                        <option value="4">4 Stars (Good)</option>
                        <option value="3">3 Stars (Average)</option>
                        <option value="2">2 Stars (Poor)</option>
                        <option value="1">1 Star (Very Poor)</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-600 text-muted" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Review</label>
                      <textarea
                        className="form-control border-1.5 rounded-12"
                        rows="3"
                        placeholder="Describe the quality of work, pricing, and punctuality..."
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        required
                        style={{ fontSize: '0.9rem', background: 'var(--card-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
                      ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 py-2.5 rounded-12 fw-700 shadow-sm" style={{ fontSize: '0.92rem' }}>
                      Post Review
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: REVIEWS CONTAINER */}
            <div className="col-lg-8">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted fw-600" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                  Showing {filteredReviews.length} reviews for <strong style={{ color: 'var(--text-main)' }}>"{selectedFilter}"</strong>
                </span>
              </div>

              {filteredReviews.length === 0 ? (
                <div className="text-center p-5 rounded-20 shadow-sm border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <i className="bi bi-journal-x text-muted" style={{ fontSize: '3.5rem', color: 'var(--text-muted)' }}></i>
                  <h5 className="fw-800 mt-3" style={{ color: 'var(--text-main)' }}>No reviews found</h5>
                  <p className="text-muted mb-0" style={{ color: 'var(--text-muted)' }}>Be the first to share your experience with a {selectedFilter}!</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredReviews.map((testi, index) => (
                    <div key={index} className="card border-0 shadow-sm p-4 hover-translate-up" style={{ borderRadius: '20px', transition: 'all 0.3s', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-3">
                          <img src={testi.avatar} alt={testi.name} className="rounded-circle border border-primary border-2" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                          <div>
                            <h6 className="fw-800 mb-0" style={{ color: 'var(--text-main)' }}>{testi.name}</h6>
                            <span className="text-muted" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{testi.sub}</span>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-primary bg-opacity-10 text-primary fw-800 px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <i className="bi bi-hammer text-warning"></i> {testi.workerType}
                          </span>
                          <div className="text-muted mt-1" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{testi.date}</div>
                        </div>
                      </div>

                      <div className="rating mb-2" style={{ color: '#f5a623', fontSize: '0.85rem' }}>
                        {[...Array(5)].map((_, i) => {
                          const starValue = i + 1;
                          if (testi.rating >= starValue) return <i key={i} className="bi bi-star-fill me-0.5"></i>;
                          if (testi.rating >= starValue - 0.5) return <i key={i} className="bi bi-star-half me-0.5"></i>;
                          return <i key={i} className="bi bi-star me-0.5"></i>;
                        })}
                        <span className="text-muted fw-700 ms-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({testi.rating})</span>
                      </div>

                      <p className="mb-0 text-secondary" style={{ fontStyle: 'italic', fontSize: '0.94rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                        "{testi.text}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Reviews;

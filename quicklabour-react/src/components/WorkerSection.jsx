import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const workers = [
  {
    name: 'Rajan Kumar',
    role: 'Senior Electrician',
    rate: '₹450/hr',
    location: 'Ludhiana',
    rating: '4.8 (230 reviews)',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=75',
    stars: 4.5,
  },
  {
    name: 'Suresh Patel',
    role: 'Expert Plumber',
    rate: '₹380/hr',
    location: 'Amritsar',
    rating: '5.0 (180 reviews)',
    img: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&q=75',
    stars: 5,
  },
  {
    name: 'Ankit Sharma',
    role: 'Skilled Carpenter',
    rate: '₹520/hr',
    location: 'Chandigarh',
    rating: '4.6 (95 reviews)',
    img: 'https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=400&q=75',
    stars: 4,
  },
  {
    name: 'Deepak Verma',
    role: 'Professional Painter',
    rate: '₹350/hr',
    location: 'Jalandhar',
    rating: '4.7 (140 reviews)',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=75',
    stars: 4.5,
  },
];

const WorkerCard = ({ worker }) => {
  const navigate = useNavigate();

  const handleHire = () => {
    const isLoggedIn = !!sessionStorage.getItem('userRole');
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // Map worker role/specialty to standard booking categories
    let category = 'Construction Labour';
    const roleLower = (worker.role || '').toLowerCase();
    if (roleLower.includes('elect')) {
      category = 'Electrician';
    } else if (roleLower.includes('plumb')) {
      category = 'Plumber';
    } else if (roleLower.includes('carp')) {
      category = 'Carpenter';
    } else if (roleLower.includes('paint')) {
      category = 'Painter';
    }

    if (worker._id) {
      navigate(`/post-job?category=${encodeURIComponent(category)}&workerId=${worker._id}&workerName=${encodeURIComponent(worker.name)}&workerAvatar=${encodeURIComponent(worker.img)}`);
    } else {
      navigate(`/post-job?category=${encodeURIComponent(category)}`);
    }
  };

  return (
    <div className="col-sm-6 col-lg-3 reveal visible">
      <div className="worker-card">
        <img src={worker.img} alt={worker.name} />
        <div className="worker-info">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <h6>{worker.name}</h6>
            <span className="badge-avail">Available</span>
          </div>
          <p className="role"><i className="bi bi-tools me-1"></i>{worker.role}</p>
          <div className="rating mb-2">
            {[...Array(5)].map((_, i) => {
              const starValue = i + 1;
              if (worker.stars >= starValue) return <i key={i} className="bi bi-star-fill"></i>;
              if (worker.stars >= starValue - 0.5) return <i key={i} className="bi bi-star-half"></i>;
              return <i key={i} className="bi bi-star"></i>;
            })}
            <span className="text-muted ms-1" style={{ fontSize: '0.78rem' }}>{worker.rating}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="rate">{worker.rate}</span>
            <small className="text-muted"><i className="bi bi-geo-alt me-1"></i>{worker.location}</small>
          </div>
          <button
            className="btn-hire"
            onClick={handleHire}
          >
            Hire Now
          </button>
        </div>
      </div>
    </div>
  );
};

const WorkerSection = () => {
  const [dbWorkers, setDbWorkers] = useState([]);

  useEffect(() => {
    api.getWorkers()
      .then(data => {
        // Map database workers to card structure
        const mapped = data.map(w => ({
          _id: w._id,
          name: w.fullName,
          role: w.occupation || 'Verified Trade Professional',
          rate: (w.occupation || '').toLowerCase().includes('plumb') ? '₹380/hr' : 
                (w.occupation || '').toLowerCase().includes('elect') ? '₹450/hr' : 
                (w.occupation || '').toLowerCase().includes('paint') ? '₹350/hr' : '₹400/hr',
          location: w.address ? w.address.split(',')[0] : 'Mumbai',
          rating: `${Number(w.rating || 4.9).toFixed(1)} (${w.jobsCompleted || 12} reviews)`,
          img: w.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&q=75',
          stars: Number(w.rating || 4.9),
        }));
        if (mapped.length > 0) {
          setDbWorkers(mapped);
        }
      })
      .catch(err => console.error('Error fetching dynamic workers:', err));
  }, []);

  const activeWorkers = dbWorkers.length > 0 ? dbWorkers : workers;

  return (
    <section className="py-5" id="workers">
      <div className="container py-3">
        <div className="text-center mb-5 reveal visible">
          <h2 className="section-title">Top Rated Workers</h2>
          <p className="section-sub">Handpicked professionals with stellar reviews</p>
        </div>
        <div className="row g-4">
          {activeWorkers.map((worker, index) => (
            <WorkerCard key={index} worker={worker} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkerSection;
export { WorkerCard };

import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="container position-relative">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="hero-badge fade-up">
              <i className="bi bi-patch-check-fill me-1"></i> India's #1 Labour Hiring App
            </div>
            <h1 className="hero-title fade-up delay-1">
              Hire Skilled <span>Workers</span> in Minutes
            </h1>
            <p className="hero-sub fade-up delay-2">
              Connect with verified plumbers, electricians, painters, carpenters and 50+ more trades. Fast. Reliable. Affordable.
            </p>
            <div className="fade-up delay-3">
              <Link to="/categories" className="btn-hero-primary">
                <i className="bi bi-search me-2"></i>Find Workers
              </Link>
              <Link to="/how-it-works" className="btn-hero-secondary">How It Works</Link>
            </div>
            <div className="mt-4 fade-up delay-3">
              <span className="stat-pill"><i className="bi bi-people-fill"></i> 50,000+ Workers</span>
              <span className="stat-pill"><i className="bi bi-star-fill"></i> 4.8 Rating</span>
              <span className="stat-pill"><i className="bi bi-shield-check"></i> Verified Profiles</span>
            </div>
          </div>
          <div className="col-lg-6 text-center mt-5 mt-lg-0 fade-up delay-2">
            <img
              src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700&q=80"
              alt="Skilled worker at a construction site"
              className="hero-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

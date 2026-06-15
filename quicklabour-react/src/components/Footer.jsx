import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="footer-brand mb-3">
              <i className="bi bi-lightning-charge-fill me-1" style={{ color: '#f5a623' }}></i>
              Quick<span>Labour</span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.75' }}>
              Connecting skilled workers with the people who need them — fast, reliably, and affordably across India.
            </p>
            <div className="mt-4">
              <a href="#" className="social-btn"><i className="bi bi-facebook"></i></a>
              <a href="#" className="social-btn"><i className="bi bi-twitter-x"></i></a>
              <a href="#" className="social-btn"><i className="bi bi-instagram"></i></a>
              <a href="#" className="social-btn"><i className="bi bi-linkedin"></i></a>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <h6>Company</h6>
            <Link to="/contact">About Us</Link>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
            <a href="#">Press</a>
          </div>
          <div className="col-6 col-md-2">
            <h6>For Employers</h6>
            <Link to="/post-job">Post a Job</Link>
            <a href="#">Pricing</a>
            <a href="#">Enterprise</a>
            <a href="#">Success Stories</a>
          </div>
          <div className="col-6 col-md-2">
            <h6>For Workers</h6>
            <Link to="/login">Join as Worker</Link>
            <Link to="/how-it-works">How to Earn</Link>
            <Link to="/worker-conduct">Code of Conduct</Link>
            <a href="#">Worker App</a>
          </div>
          <div className="col-6 col-md-2">
            <h6>Support</h6>
            <Link to="/contact">Help Centre</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/refund-policy">Refund Policy</Link>
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <p className="mb-0" style={{ fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} QuickLabour Pvt. Ltd. All rights reserved.
          </p>
          <div className="d-flex gap-3" style={{ fontSize: '0.85rem' }}>
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/refund-policy">Refund & Cancellations</Link>
            <Link to="/worker-conduct">Worker Conduct</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

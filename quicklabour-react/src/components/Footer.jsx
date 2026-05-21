import React from 'react';

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
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
            <a href="#">Press</a>
          </div>
          <div className="col-6 col-md-2">
            <h6>For Employers</h6>
            <a href="#">Post a Job</a>
            <a href="#">Pricing</a>
            <a href="#">Enterprise</a>
            <a href="#">Success Stories</a>
          </div>
          <div className="col-6 col-md-2">
            <h6>For Workers</h6>
            <a href="#">Join as Worker</a>
            <a href="#">How to Earn</a>
            <a href="#">Training</a>
            <a href="#">Worker App</a>
          </div>
          <div className="col-6 col-md-2">
            <h6>Support</h6>
            <a href="#">Help Centre</a>
            <a href="#">Contact Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms</a>
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <p className="mb-0" style={{ fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} QuickLabour Pvt. Ltd. All rights reserved.
          </p>
          <div className="d-flex gap-3" style={{ fontSize: '0.85rem' }}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

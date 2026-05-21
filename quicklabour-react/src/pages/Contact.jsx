import React, { useState } from 'react';
import { api } from '../utils/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.submitContact(formData);
      setSuccessMsg(res.message);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setErrorMsg('❌ Failed to send message: ' + error.message);
    }
  };

  return (
    <section className="contact-section py-5 mt-5">
      <div className="container py-5">
        <div className="text-center mb-5">
          <h2 className="section-title">Contact Us</h2>
          <p className="section-sub">We’d love to hear from you</p>
        </div>
        <div className="row g-4">
          {/* FORM */}
          <div className="col-md-6">
            <div className="contact-card p-4 bg-white shadow-sm" style={{ borderRadius: '20px' }}>
              {successMsg && (
                <div className="alert alert-success py-2 px-3 rounded-12 mb-3 small fw-700 text-center shadow-sm" role="alert">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 rounded-12 mb-3 small fw-700 text-center shadow-sm" role="alert">
                  {errorMsg}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" style={{ borderRadius: '10px' }}>
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* INFO */}
          <div className="col-md-6">
            <div className="contact-info p-4 h-100 shadow-sm" style={{ background: '#0a2540', color: 'white', borderRadius: '20px' }}>
              <h5 className="fw-bold mb-4">Contact Info</h5>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-geo-alt me-3 fs-4" style={{ color: '#f5a623' }}></i>
                <span>Punjab, India</span>
              </div>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-phone me-3 fs-4" style={{ color: '#f5a623' }}></i>
                <span>+91 98774-28008</span>
              </div>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-envelope me-3 fs-4" style={{ color: '#f5a623' }}></i>
                <span>support@quicklabour.com</span>
              </div>
              <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              <div className="mt-4">
                <h6 className="fw-bold mb-3">Follow Us</h6>
                <div className="d-flex gap-3">
                  <a href="#" className="social-btn"><i className="bi bi-facebook"></i></a>
                  <a href="#" className="social-btn"><i className="bi bi-twitter-x"></i></a>
                  <a href="#" className="social-btn"><i className="bi bi-instagram"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

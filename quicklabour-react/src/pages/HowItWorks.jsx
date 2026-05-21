import React from 'react';
import { Link } from 'react-router-dom';

const basicSteps = [
  { num: 1, title: 'Post Your Job', desc: 'Enter job details like work type, location, and budget.' },
  { num: 2, title: 'Choose Worker', desc: 'Select verified workers based on ratings and reviews.' },
  { num: 3, title: 'Get Work Done', desc: 'Worker completes the job and you pay after satisfaction.' }
];

const detailedSteps = [
  { title: 'Step 1: Job Posting', desc: 'Create your job with all details like location, timing, and budget.' },
  { title: 'Step 2: Worker Matching', desc: 'Our system finds nearby skilled workers instantly.' },
  { title: 'Step 3: Confirmation', desc: 'Worker accepts your job and confirms availability.' },
  { title: 'Step 4: Completion', desc: 'Work gets completed and payment is made securely.' }
];

const whyReasons = [
  { icon: 'bi-shield-check', title: 'Verified Workers', desc: 'All workers are background checked and trusted.' },
  { icon: 'bi-clock', title: 'Fast Hiring', desc: 'Hire workers within minutes.' },
  { icon: 'bi-currency-rupee', title: 'Affordable', desc: 'Best price for every type of work.' }
];

const HowItWorks = () => {
  return (
    <div>
      {/* HERO */}
      <section className="category-hero">
        <div className="container text-center">
          <h1>How It Works</h1>
          <p>Simple steps to hire workers quickly and easily</p>
        </div>
      </section>

      {/* BASIC STEPS */}
      <section className="how-section py-5">
        <div className="container">
          <div className="row g-4">
            {basicSteps.map((step, index) => (
              <div key={index} className="col-md-4">
                <div className="step-card text-center" style={{ background: '#ffffff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                  <div className="step-num mx-auto mb-3" style={{ width: '40px', height: '40px', background: '#f5a623', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#0a2540' }}>
                    {step.num}
                  </div>
                  <h5 className="fw-bold mb-2" style={{ color: '#0a2540' }}>{step.title}</h5>
                  <p className="mb-0" style={{ color: '#4a5568', fontSize: '0.92rem' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED PROCESS */}
      <section id="process" className="process-section py-5 bg-light">
        <div className="container">
          <h2 className="section-title text-center mb-5">Detailed Process</h2>
          <div className="row g-4">
            {detailedSteps.map((step, index) => (
              <div key={index} className="col-md-6">
                <div className="process-box p-4 bg-white shadow-sm" style={{ borderRadius: '15px', border: '1px solid #eee' }}>
                  <h5 className="fw-bold text-primary">{step.title}</h5>
                  <p className="mb-0">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section id="why" className="why-section py-5">
        <div className="container text-center">
          <h2 className="section-title">Why Choose QuickLabour?</h2>
          <div className="row mt-5 g-4">
            {whyReasons.map((reason, index) => (
              <div key={index} className="col-md-4">
                <div className="why-box">
                  <i className={`bi ${reason.icon}`} style={{ fontSize: '3rem', color: '#0d6efd' }}></i>
                  <h5 className="fw-bold mt-3">{reason.title}</h5>
                  <p className="text-muted">{reason.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="cta-new text-center py-5" style={{ background: 'linear-gradient(135deg, #0d6efd, #0a2540)', color: 'white' }}>
        <div className="container">
          <h2 className="fw-bold">Ready to Get Started?</h2>
          <p className="mb-4">Post your job and hire workers instantly.</p>
          <Link to="/post-job" className="btn btn-warning btn-lg px-5 fw-bold" style={{ borderRadius: '50px' }}>Post a Job</Link>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;

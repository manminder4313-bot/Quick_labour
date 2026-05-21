import React from 'react';

const projects = [
  {
    title: 'House Wiring',
    category: 'Electrician',
    img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952'
  },
  {
    title: 'Wall Painting',
    category: 'Painter',
    img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e'
  },
  {
    title: 'Construction Work',
    category: 'Mason',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd'
  }
];

const achievements = [
  { count: '500+', label: 'Projects Done' },
  { count: '200+', label: 'Cities' },
  { count: '1000+', label: 'Workers' },
  { count: '98%', label: 'Satisfaction' }
];

const processSteps = [
  { num: 1, title: 'Book Service', desc: 'Select your required service easily' },
  { num: 2, title: 'Worker Assigned', desc: 'Verified worker will be assigned' },
  { num: 3, title: 'Work Completed', desc: 'Get quality service at your doorstep' }
];

const moreWorks = [
  { title: 'Plumbing', jobs: '800+ Jobs' },
  { title: 'Electrical', jobs: '600+ Jobs' },
  { title: 'Painting', jobs: '400+ Jobs' },
  { title: 'Carpentry', jobs: '300+ Jobs' }
];

const Works = () => {
  return (
    <div>
      {/* HERO */}
      <section className="hero text-center" style={{ minHeight: '40vh' }}>
        <div className="container">
          <h1 className="hero-title">Our <span>Work</span></h1>
          <p className="hero-sub">Real projects completed by our skilled workers</p>
        </div>
      </section>

      {/* RECENT PROJECTS */}
      <section className="py-5">
        <div className="container">
          <h2 className="section-title text-center mb-5">Recent Projects</h2>
          <div className="row g-4">
            {projects.map((project, index) => (
              <div key={index} className="col-md-4">
                <div className="worker-card">
                  <img src={project.img} alt={project.title} style={{ height: '250px', objectFit: 'cover', width: '100%' }} />
                  <div className="worker-info text-center">
                    <h6>{project.title}</h6>
                    <p className="role">{project.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section className="counter-section bg-light py-5">
        <div className="container text-center">
          <h2 className="section-title mb-5">Our Achievements</h2>
          <div className="row">
            {achievements.map((item, index) => (
              <div key={index} className="col-6 col-md-3">
                <div className="counter-num" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0d6efd' }}>
                  {item.count}
                </div>
                <div className="counter-label" style={{ color: '#6c7a8d' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="how-section py-5" style={{ background: '#0a2540' }}>
        <div className="container text-center">
          <h2 className="section-title text-white mb-5">Our Work Process</h2>
          <div className="row g-4">
            {processSteps.map((step, index) => (
              <div key={index} className="col-md-4">
                <div className="step-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="step-num mx-auto mb-3" style={{ width: '50px', height: '50px', background: '#f5a623', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#0a2540' }}>
                    {step.num}
                  </div>
                  <h5 className="text-white">{step.title}</h5>
                  <p style={{ color: '#8baec8' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MORE WORKS */}
      <section className="py-5">
        <div className="container">
          <h2 className="section-title text-center mb-5">More Works</h2>
          <div className="row g-4">
            {moreWorks.map((work, index) => (
              <div key={index} className="col-md-3">
                <div className="cat-card p-4 text-center" style={{ border: '1.5px solid #e8edf5', borderRadius: '20px' }}>
                  <h6 className="fw-bold">{work.title}</h6>
                  <span className="text-muted">{work.jobs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Works;

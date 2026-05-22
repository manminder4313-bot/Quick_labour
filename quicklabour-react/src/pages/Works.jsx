import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const projects = [
  // Construction
  { title: 'House Wiring',          category: 'Electrician',            industry: '🏗️ Construction', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80' },
  { title: 'Wall Painting',         category: 'Painter',                industry: '🏗️ Construction', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80' },
  { title: 'Construction Work',     category: 'Mason',                  industry: '🏗️ Construction', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
  { title: 'Pipe Fitting',          category: 'Plumber',                industry: '🏗️ Construction', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  { title: 'Iron Gate Welding',     category: 'Welder',                 industry: '🏗️ Construction', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80' },
  { title: 'Wooden Furniture',      category: 'Carpenter',              industry: '🏗️ Construction', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80' },
  { title: 'Floor Tiling',          category: 'Tile Worker',            industry: '🏗️ Construction', img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80' },
  { title: 'Steel Reinforcement',   category: 'Steel Fixer',            industry: '🏗️ Construction', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
  // Factory
  { title: 'Factory Machine Setup', category: 'Machine Operator',       industry: '🏭 Industrial',   img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80' },
  { title: 'Warehouse Loading',     category: 'Warehouse Loader',       industry: '🏭 Industrial',   img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80' },
  { title: 'Quality Check Line',    category: 'Quality Checker',        industry: '🏭 Industrial',   img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80' },
  { title: 'Assembly Line Work',    category: 'Assembly Line Worker',   industry: '🏭 Industrial',   img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80' },
  // Agriculture
  { title: 'Wheat Harvesting',      category: 'Harvester',              industry: '🌾 Agriculture',  img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80' },
  { title: 'Irrigation Setup',      category: 'Irrigation Worker',      industry: '🌾 Agriculture',  img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80' },
  { title: 'Tractor Field Work',    category: 'Tractor Operator',       industry: '🌾 Agriculture',  img: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80' },
  // Transport
  { title: 'Goods Delivery',        category: 'Delivery Worker',        industry: '🚚 Transport',    img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80' },
  { title: 'Cargo Loading',         category: 'Loader/Unloader',        industry: '🚚 Transport',    img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80' },
  { title: 'Personal Driving',      category: 'Driver',                 industry: '🚚 Transport',    img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80' },
  // Cleaning
  { title: 'Office Housekeeping',   category: 'Housekeeping Staff',     industry: '🧹 Cleaning',     img: 'https://images.unsplash.com/photo-1581578949510-fa7315c4c350?w=600&q=80' },
  { title: 'Deep Home Cleaning',    category: 'Sweeper',                industry: '🧹 Cleaning',     img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  // Domestic
  { title: 'Home Cooking',          category: 'Cook',                   industry: '🏠 Domestic',     img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80' },
  { title: 'Child Care',            category: 'Babysitter',             industry: '🏠 Domestic',     img: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80' },
  // Technical
  { title: 'AC Servicing',          category: 'AC Repair Worker',       industry: '⚙️ Technical',    img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80' },
  { title: 'Bike Repair',           category: 'Mechanic',               industry: '⚙️ Technical',    img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80' },
  // Mining
  { title: 'Borewell Drilling',     category: 'Drilling Worker',        industry: '⛏️ Mining',       img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
  { title: 'Crane Operation',       category: 'Crane Operator',         industry: '⛏️ Mining',       img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
  // General
  { title: 'Road Repair Crew',      category: 'Road Worker',            industry: '👷 General',      img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
  { title: 'Building Security',     category: 'Security Guard',         industry: '👷 General',      img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80' },
];

const achievements = [
  { count: '5,000+', label: 'Workers Registered',  icon: 'bi-people-fill',        color: '#0d6efd' },
  { count: '200+',   label: 'Cities Covered',       icon: 'bi-geo-alt-fill',       color: '#f5a623' },
  { count: '45+',    label: 'Trade Categories',     icon: 'bi-grid-fill',          color: '#1db97a' },
  { count: '98%',    label: 'Client Satisfaction',  icon: 'bi-star-fill',          color: '#8b5cf6' },
];

const processSteps = [
  { num: 1, title: 'Book Service',      desc: 'Select your required trade and location in seconds.',    icon: 'bi-calendar-check' },
  { num: 2, title: 'Worker Matched',    desc: 'Verified nearby worker is assigned to your request.',   icon: 'bi-person-check' },
  { num: 3, title: 'Work Completed',    desc: 'Get quality service at your doorstep, rate & review.',  icon: 'bi-patch-check' },
];

const moreWorks = [
  { title: 'Plumbing',            jobs: '800+ Jobs', icon: '🔧' },
  { title: 'Electrical',          jobs: '950+ Jobs', icon: '⚡' },
  { title: 'Painting',            jobs: '620+ Jobs', icon: '🎨' },
  { title: 'Carpentry',           jobs: '480+ Jobs', icon: '🪚' },
  { title: 'Welding',             jobs: '310+ Jobs', icon: '🔥' },
  { title: 'Mason Work',          jobs: '540+ Jobs', icon: '🧱' },
  { title: 'Tile Laying',         jobs: '290+ Jobs', icon: '🪟' },
  { title: 'Cleaning',            jobs: '700+ Jobs', icon: '🧹' },
  { title: 'Cooking',             jobs: '450+ Jobs', icon: '🍳' },
  { title: 'AC Repair',           jobs: '380+ Jobs', icon: '❄️' },
  { title: 'Driving',             jobs: '520+ Jobs', icon: '🚗' },
  { title: 'Security Guard',      jobs: '260+ Jobs', icon: '🛡️' },
  { title: 'Harvesting',          jobs: '190+ Jobs', icon: '🌾' },
  { title: 'Machine Operation',   jobs: '340+ Jobs', icon: '⚙️' },
  { title: 'Drilling / Mining',   jobs: '120+ Jobs', icon: '⛏️' },
  { title: 'Delivery',            jobs: '680+ Jobs', icon: '📦' },
];

const ALL_INDUSTRIES = ['All', '🏗️ Construction', '🏭 Industrial', '🌾 Agriculture', '🚚 Transport', '🧹 Cleaning', '🏠 Domestic', '⚙️ Technical', '⛏️ Mining', '👷 General'];

const Works = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(9);

  const filtered = activeFilter === 'All'
    ? projects
    : projects.filter(p => p.industry === activeFilter);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div>
      {/* HERO */}
      <section className="hero text-center" style={{ minHeight: '38vh' }}>
        <div className="container">
          <h1 className="hero-title">Our <span>Work</span></h1>
          <p className="hero-sub">Real projects completed by our skilled workers across India</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap mt-3">
            {achievements.slice(0, 2).map(a => (
              <div key={a.label} className="stat-pill">
                <i className={`bi ${a.icon}`} style={{ color: a.color }}></i>
                <strong>{a.count}</strong> {a.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT PROJECTS */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">Recent Projects</h2>
            <p className="section-sub">{projects.length}+ projects showcased across all industries</p>
          </div>

          {/* Industry Filter Pills */}
          <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
            {ALL_INDUSTRIES.map(ind => (
              <button
                key={ind}
                onClick={() => { setActiveFilter(ind); setVisibleCount(9); }}
                className={activeFilter === ind ? 'btn btn-primary rounded-pill px-3 py-1 fw-bold' : 'btn btn-outline-secondary rounded-pill px-3 py-1'}
                style={{ fontSize: '0.82rem', transition: 'all 0.2s' }}
              >
                {ind}
              </button>
            ))}
          </div>

          {/* Project Grid */}
          <div className="row g-4">
            {visible.map((project, index) => (
              <div key={index} className="col-md-4">
                <div
                  className="worker-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/post-job?category=${encodeURIComponent(project.category)}`)}
                >
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={project.img}
                      alt={project.title}
                      style={{ height: '220px', objectFit: 'cover', width: '100%', transition: 'transform 0.4s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    {/* Industry badge overlay */}
                    <span style={{
                      position: 'absolute', top: 12, left: 12,
                      background: 'rgba(10,37,64,0.75)', backdropFilter: 'blur(4px)',
                      color: '#fff', borderRadius: 20, padding: '3px 10px',
                      fontSize: '0.72rem', fontWeight: 600,
                    }}>
                      {project.industry}
                    </span>
                  </div>
                  <div className="worker-info text-center">
                    <h6>{project.title}</h6>
                    <p className="role">{project.category}</p>
                    <button
                      className="btn-hire mt-1"
                      onClick={e => { e.stopPropagation(); navigate(`/post-job?category=${encodeURIComponent(project.category)}`); }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {visibleCount < filtered.length && (
            <div className="text-center mt-4">
              <button
                className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold"
                onClick={() => setVisibleCount(v => v + 9)}
              >
                Load More Projects <i className="bi bi-arrow-down ms-1"></i>
              </button>
            </div>
          )}
          {visibleCount >= filtered.length && filtered.length > 9 && (
            <div className="text-center mt-3">
              <span className="text-muted small">All {filtered.length} projects shown</span>
            </div>
          )}
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section className="counter-section bg-light py-5">
        <div className="container">
          <h2 className="section-title text-center mb-5">Our Achievements</h2>
          <div className="row g-4">
            {achievements.map((item, index) => (
              <div key={index} className="col-6 col-md-3">
                <div className="dashboard-stat-card text-center flex-column">
                  <div className="stat-icon-wrapper mb-2" style={{ background: `${item.color}15`, color: item.color, margin: '0 auto' }}>
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <div className="stat-number" style={{ color: item.color }}>{item.count}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
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
                <div className="step-card">
                  <div className="step-num mx-auto mb-3">
                    <i className={`bi ${step.icon}`} style={{ fontSize: '1.4rem' }}></i>
                  </div>
                  <h5 className="text-white">{step.title}</h5>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MORE WORKS */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title">More Works by Category</h2>
            <p className="section-sub">Every trade, every need — we've got you covered</p>
          </div>
          <div className="row g-3">
            {moreWorks.map((work, index) => (
              <div key={index} className="col-6 col-md-3">
                <div
                  className="cat-card p-4 text-center"
                  style={{ border: '1.5px solid #e8edf5', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s' }}
                  onClick={() => navigate(`/post-job?category=${encodeURIComponent(work.title)}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#0d6efd'; e.currentTarget.style.transform='translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e8edf5'; e.currentTarget.style.transform='translateY(0)'; }}
                >
                  <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>{work.icon}</div>
                  <h6 className="fw-bold mb-1" style={{ color: '#0a2540' }}>{work.title}</h6>
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>{work.jobs}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <button
              className="btn btn-primary rounded-pill px-5 py-2 fw-bold"
              onClick={() => navigate('/categories')}
            >
              Browse All Categories <i className="bi bi-arrow-right ms-1"></i>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Works;

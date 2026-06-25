import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LABOUR_INDUSTRIES } from '../utils/api';

// Map industry names to Bootstrap Icons (used inside .category-icon)
const INDUSTRY_ICONS = {
  "Construction Labour":         "bi-building-gear",
  "Factory / Industrial Labour": "bi-gear-wide-connected",
  "Agricultural Labour":         "bi-tree",
  "Transport & Delivery":        "bi-truck-front",
  "Cleaning & Maintenance":      "bi-brush",
  "Domestic Labour":             "bi-house-heart",
  "Skilled Technical Labour":    "bi-cpu",
  "Daily Wage / General Labour": "bi-person-arms-up",
  "Mining & Heavy Work":         "bi-hammer",
};

// Map each specialty name to a background image related to that occupation
const OCCUPATION_IMAGES = {
  // Construction Labour
  "Construction Labour": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=350&q=80",
  "Mason": "https://www.shutterstock.com/image-photo/happy-indian-male-construction-worker-260nw-2317221223.jpg",
  "Carpenter": "https://usihome.com/wp-content/uploads/2022/02/charpentier-de-bois-1.jpeg",
  "Electrician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=350&q=80",
  "Plumber": "https://www.steadyfloplumbing.com/wp-content/uploads/2023/10/plumbing-services-1920w.jpg",
  "Welder": "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=350&q=80",
  "Painter": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=350&q=80",
  "Tile worker": "https://static.vecteezy.com/system/resources/thumbnails/074/236/707/small/tile-installation-professional-contractor-installing-floor-tiles-with-spacers-and-cement-trowel-photo.jpg",
  "Steel fixer": "https://zmv-assets.holzweg.tv//Anwenderbilder/Anwender_113301-2.jpg",
  "Concrete worker": "https://images.squarespace-cdn.com/content/v1/5f4f9895e09c563a9267f110/ab3e3c6e-7850-4fbc-ac34-39f4fb46e01c/iStock-1362538391.jpg",
  "Scaffolder": "https://i0.wp.com/sigmahealth.co.uk/wp-content/uploads/2024/06/Fit-to-work-banner-1.png?fit=500%2C500&ssl=1",

  // Factory / Industrial Labour
  "Machine operator": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=350&q=80",
  "Assembly line worker": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=350&q=80",
  "Packaging worker": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=350&q=80",
  "Warehouse loader": "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=350&q=80",
  "Forklift operator": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=350&q=80",
  "Quality checker": "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=350&q=80",

  // Agricultural Labour
  "Farmer helper": "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=350&q=80",
  "Harvester": "https://mahindrafarmmachinery.com/sites/default/files/2024-12/8.%20Combine%20Harvester%20Working%2C%20Uses%2C%20and%20Importance-min%20%281%29_0.jpg",
  "Dairy worker": "https://www.shutterstock.com/image-photo/woman-pouring-fresh-milk-into-260nw-2767933909.jpg",
  "Irrigation worker": "https://d3n8a8pro7vhmx.cloudfront.net/seedyourfuture/pages/239/attachments/original/1547063101/IrrigationMainEdited.jpg?1547063101",
  "Tractor operator": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ5ovh1ATW9UGNko__iNyHpSgZ7dWbH7jkBjcP5UoXGaUaVL51Vi8cBns&s=10",

  // Transport & Delivery
  "Truck helper": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=350&q=80",
  "Delivery worker": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKUfvi-hIpA8XFttf3AUAQ0i6QR3amjieMuq_BYeKyN-6V9iXXsfxzT23s&s=10",
  "Driver": "https://lscdn.blob.core.windows.net/biz-live/photos-12272115-17640528706143953.jpeg",
  "Loader/unloader": "https://vrslogistics.com/wp-content/uploads/2021/01/loading-unloading-services-visakhapatnam-600x400-1.jpg",

  // Cleaning & Maintenance
  "Sweeper": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=350&q=80",
  "Housekeeping staff": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=350&q=80",
  "Garbage collector": "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=350&q=80",
  "Maintenance worker": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=350&q=80",

  // Domestic Labour
  "Cook": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=350&q=80",
  "Maid": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=350&q=80",
  "Caretaker": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=350&q=80",
  "Babysitter": "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=350&q=80",

  // Skilled Technical Labour
  "HVAC technician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=350&q=80",
  "Mechanic": "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=350&q=80",
  "Mobile repair technician": "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=350&q=80",
  "AC repair worker": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=350&q=80",

  // Daily Wage / General Labour
  "Helper": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=350&q=80",
  "Road worker": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=350&q=80",
  "Excavation worker": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=350&q=80",
  "Security guard": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=350&q=80",

  // Mining & Heavy Work
  "Miner": "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=350&q=80",
  "Drilling worker": "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=350&q=80",
  "Crane operator": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=350&q=80"
};

const Categories = () => {
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem('userRole');
  const [activeIndustry, setActiveIndustry] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const industryNames = ['All', ...Object.keys(LABOUR_INDUSTRIES)];

  const handleHire = (specialtyName) => {
    navigate(`/post-job?category=${encodeURIComponent(specialtyName)}`);
  };

  // Filter by active industry tab and search term
  const filteredIndustries = Object.entries(LABOUR_INDUSTRIES)
    .filter(([industryName]) =>
      activeIndustry === 'All' || activeIndustry === industryName
    )
    .map(([industryName, info]) => {
      const filteredSpecs = searchTerm.trim()
        ? info.specialties.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.desc.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : info.specialties;
      return { industryName, info, filteredSpecs };
    })
    .filter(({ filteredSpecs }) => filteredSpecs.length > 0);

  const totalWorkerTypes = Object.values(LABOUR_INDUSTRIES)
    .reduce((acc, info) => acc + info.specialties.length, 0);

  return (
    <div>
      {/* ── Hero (uses existing .category-hero CSS) ── */}
      <section className="category-hero">
        <div className="container">
          <h1>Browse Worker Categories</h1>
          <p>
            Discover {totalWorkerTypes}+ verified trades across{' '}
            {Object.keys(LABOUR_INDUSTRIES).length} industries. Find the right
            professional and hire in minutes.
          </p>

          {/* Search */}
          <div className="mt-4" style={{ maxWidth: 480, margin: '24px auto 0' }}>
            <div className="input-group" style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <span className="input-group-text bg-white border-0 ps-3">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 py-3"
                placeholder="Search e.g. Welder, Cook, Miner..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.95rem' }}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary border-0 bg-white pe-3"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="bi bi-x-lg text-muted"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Industry Filter Pills ── */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid #e8edf5', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div className="container">
          <div className="d-flex gap-2 py-3" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
            {industryNames.map(name => {
              const isActive = activeIndustry === name;
              return (
                <button
                  key={name}
                  onClick={() => setActiveIndustry(name)}
                  className={isActive ? 'btn btn-primary rounded-pill fw-bold px-3 py-2' : 'btn btn-outline-secondary rounded-pill fw-600 px-3 py-2'}
                  style={{
                    flexShrink: 0,
                    fontSize: '0.82rem',
                    whiteSpace: 'nowrap',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.2s',
                  }}
                >
                  {name === 'All'
                    ? '🌐 All Industries'
                    : `${LABOUR_INDUSTRIES[name]?.icon} ${name}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Industry Sections ── */}
      <section className="py-5" style={{ background: '#f8f9fb' }}>
        <div className="container">

          {filteredIndustries.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
              <h5 className="text-muted">No results for "{searchTerm}"</h5>
              <p className="text-muted small">Try a different keyword like "plumber", "cook", or "miner".</p>
              <button className="btn btn-primary rounded-3 mt-2" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            </div>
          ) : (
            filteredIndustries.map(({ industryName, info, filteredSpecs }) => (
              <div key={industryName} className="mb-5">

                {/* Industry Section Header */}
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="category-icon mb-0 flex-shrink-0"
                    style={{ fontSize: '1.6rem', background: 'rgba(13,110,253,0.07)', color: '#0d6efd' }}
                  >
                    {info.icon}
                  </div>
                  <div>
                    <h4 className="fw-800 mb-0" style={{ fontWeight: 800, color: '#0a2540' }}>
                      {industryName}
                    </h4>
                    <small className="text-muted">
                      <i className={`bi ${INDUSTRY_ICONS[industryName] || 'bi-person-gear'} me-1`}></i>
                      {filteredSpecs.length} worker type{filteredSpecs.length !== 1 ? 's' : ''} available
                    </small>
                  </div>
                  {/* Divider line */}
                  <div className="flex-fill ms-2" style={{ height: 1.5, background: 'linear-gradient(to right,#e8edf5,transparent)' }} />
                </div>

                {/* Worker Cards — uses existing .category-box CSS classes */}
                <div className="row g-4">
                  {filteredSpecs.map((spec) => {
                    const bgImage = OCCUPATION_IMAGES[spec.name] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=350&q=80';
                    return (
                      <div key={spec.name} className="col-md-4 col-lg-3">
                        <div className="category-card-new">
                          {/* Top Image Banner */}
                          <div className="card-image-wrapper">
                            <img src={bgImage} alt={spec.name} className="card-banner-img" />
                            {/* Overlapping Icon Badge */}
                            <div className="card-icon-badge">
                              <i className={`bi ${INDUSTRY_ICONS[industryName] || 'bi-person-gear'}`}></i>
                            </div>
                          </div>

                          {/* Card Content Area */}
                          <div className="card-content-wrapper">
                            <div>
                              <h5>{spec.name}</h5>
                              <p>{spec.desc}</p>
                            </div>

                            <div>
                              {/* Rate & Visit charge pills */}
                              <div className="d-flex flex-wrap gap-2 mb-2">
                                <span className="rate-pill">
                                  ₹{spec.baseRate}/day
                                </span>
                                <span className="visit-pill">
                                  <i className="bi bi-geo-alt me-1"></i>Visit ₹{spec.visitCharge}
                                </span>
                              </div>

                              {/* Action Button */}
                              {userRole === 'worker' ? (
                                <button className="btn-hire-new" disabled>
                                  Hiring Restricted
                                </button>
                              ) : (
                                <button 
                                  className="btn-hire-new active" 
                                  onClick={() => handleHire(spec.name)}
                                >
                                  Hire {spec.name}
                                </button>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))
          )}

        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section style={{ background: 'linear-gradient(135deg,#0a2540,#173d63)', padding: '48px 0' }}>
        <div className="container">
          <div className="row g-4 text-center text-white">
            {[
              { label: 'Industries',     value: Object.keys(LABOUR_INDUSTRIES).length, icon: 'bi-building' },
              { label: 'Worker Types',   value: totalWorkerTypes,                      icon: 'bi-people' },
              { label: 'Cities Covered', value: '50+',                                 icon: 'bi-geo-alt' },
              { label: 'Verified Workers',value: '5,000+',                             icon: 'bi-patch-check' },
            ].map(stat => (
              <div key={stat.label} className="col-6 col-md-3">
                <i className={`bi ${stat.icon} fs-2 mb-2 d-block`} style={{ color: '#f5a623' }}></i>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f5a623' }}>{stat.value}</div>
                <div style={{ fontSize: '0.88rem', opacity: 0.75 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Categories;

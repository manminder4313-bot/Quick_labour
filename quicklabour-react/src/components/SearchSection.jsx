import React from 'react';

const SearchSection = () => {
  return (
    <section className="search-section" id="search">
      <div className="container">
        <div className="search-box reveal">
          <h5 className="fw-700 mb-3" style={{ color: '#0a2540', fontWeight: 700 }}>
            Find the right worker right now
          </h5>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label text-muted small fw-600">Job Type</label>
              <select className="form-select">
                <option>Plumber</option>
                <option>Electrician</option>
                <option>Carpenter</option>
                <option>Painter</option>
                <option>Welder</option>
                <option>Mason</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small fw-600">Location</label>
              <input type="text" className="form-control" placeholder="Enter your city..." />
            </div>
            <div className="col-md-4">
              <button className="btn-search">
                <i className="bi bi-search me-2"></i>Search Workers
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;

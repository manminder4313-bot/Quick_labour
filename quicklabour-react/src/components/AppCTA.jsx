import React from 'react';

const AppCTA = () => {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-7 reveal visible">
            <h2>Download the QuickLabour App</h2>
            <p>Available on Android & iOS. Get instant notifications, live chat with workers, and seamless payments — all in one place.</p>
            <div className="d-flex flex-wrap gap-3">
              <button className="btn-store">
                <i className="bi bi-google-play"></i>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>GET IT ON</div>
                  <div>Google Play</div>
                </div>
              </button>
              <button className="btn-store">
                <i className="bi bi-apple"></i>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>DOWNLOAD ON THE</div>
                  <div>App Store</div>
                </div>
              </button>
            </div>
          </div>
          <div className="col-lg-5 text-center mt-4 mt-lg-0 reveal visible">
            <img
              src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80"
              alt="QuickLabour mobile app"
              className="cta-phone"
              style={{ maxHeight: '320px', width: '100%', objectFit: 'cover', borderRadius: '24px' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppCTA;

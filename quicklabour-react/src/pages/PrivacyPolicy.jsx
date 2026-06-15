import React, { useEffect } from 'react';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="dashboard-section py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="dashboard-card border-0 shadow-sm p-4 p-md-5" style={{ borderRadius: '24px' }}>
              
              <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                <div className="stat-icon-wrapper blue" style={{ width: '60px', height: '60px', borderRadius: '18px', fontSize: '1.8rem' }}>
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <div>
                  <h1 className="fw-800 m-0" style={{ fontSize: '2rem', color: '#0a2540' }}>Privacy Policy</h1>
                  <p className="text-muted m-0 small">Last Updated: June 15, 2026</p>
                </div>
              </div>

              <div className="policy-content" style={{ color: '#4a5568', lineHeight: '1.8', fontSize: '0.95rem' }}>
                <p className="lead fw-600 mb-4" style={{ color: '#0a2540' }}>
                  At QuickLabour, accessible from quicklabour.com, one of our main priorities is the privacy of our visitors and users. This Privacy Policy document contains types of information that is collected and recorded by QuickLabour and how we use it.
                </p>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>1. Information We Collect</h3>
                <p>
                  If you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number. If you are registering as a worker, we also collect professional details, identity proof documentation, location data, and profile photos.
                </p>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>2. How We Use Your Information</h3>
                <p>We use the information we collect in various ways, including to:</p>
                <ul className="ps-3 mb-4" style={{ listStyleType: 'disc' }}>
                  <li>Provide, operate, and maintain our platform and dashboards</li>
                  <li>Improve, personalize, and expand our platform</li>
                  <li>Understand and analyze how you use our platform</li>
                  <li>Develop new products, services, features, and functionality</li>
                  <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the platform</li>
                  <li>Process payments, wallet transactions, and billing details securely</li>
                  <li>Detect and prevent fraudulent or illegal activities</li>
                </ul>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>3. Geolocation & Real-Time Tracking</h3>
                <p>
                  To facilitate matching clients with nearby workers, we collect and process real-time geographical location data from your device. This data is utilized solely for service delivery, distance calculation, safety audits, and dispute resolution. You can disable location tracking in your browser or device settings, though this may restrict major features of our platform.
                </p>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>4. Data Protection Rights</h3>
                <p>
                  We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
                </p>
                <ul className="ps-3 mb-4" style={{ listStyleType: 'disc' }}>
                  <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
                  <li><strong>The right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate.</li>
                  <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data under certain conditions.</li>
                  <li><strong>The right to restrict or object to processing:</strong> You have the right to request that we restrict or object to the processing of your personal data.</li>
                </ul>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>5. Security of Data</h3>
                <p>
                  The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                </p>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>6. Contact Us</h3>
                <p>
                  If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at support@quicklabour.com.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

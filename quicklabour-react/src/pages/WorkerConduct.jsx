import React, { useEffect } from 'react';

const WorkerConduct = () => {
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
                <div className="stat-icon-wrapper purple" style={{ width: '60px', height: '60px', borderRadius: '18px', fontSize: '1.8rem' }}>
                  <i className="bi bi-person-check-fill"></i>
                </div>
                <div>
                  <h1 className="fw-800 m-0" style={{ fontSize: '2rem', color: '#0a2540' }}>Worker Code of Conduct</h1>
                  <p className="text-muted m-0 small">Last Updated: June 15, 2026</p>
                </div>
              </div>

              <div className="policy-content" style={{ color: '#4a5568', lineHeight: '1.8', fontSize: '0.95rem' }}>
                <p className="lead fw-600 mb-4" style={{ color: '#0a2540' }}>
                  QuickLabour is committed to maintaining a safe, respectful, and highly professional environment for all clients and service providers. This Code of Conduct outlines the standards of behavior required from all registered workers on the platform.
                </p>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>1. Professionalism & Punctuality</h3>
                <ul className="ps-3 mb-4" style={{ listStyleType: 'disc' }}>
                  <li><strong>Be On Time:</strong> Arrive at the designated job site at the agreed time. If you expect a delay, communicate immediately with the client.</li>
                  <li><strong>Active Readiness:</strong> Keep your availability toggle correct. Only accept a job if you are ready and available to perform the work immediately.</li>
                  <li><strong>Dress Code & Presentation:</strong> Present yourself in clean, appropriate clothing suitable for the type of manual or skilled labour requested.</li>
                </ul>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>2. Fair Pricing & Integrity</h3>
                <ul className="ps-3 mb-4" style={{ listStyleType: 'disc' }}>
                  <li><strong>Stick to the Agreement:</strong> Do not request extra payments or tip amounts outside of the price bid and accepted on the QuickLabour platform.</li>
                  <li><strong>Platform Integrity:</strong> Do not encourage clients to transact outside the platform to avoid service fees. Offline cash bypasses violate our safety systems.</li>
                  <li><strong>Honest Work:</strong> Complete all tasks as specified in the job description to the best of your ability.</li>
                </ul>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>3. Respect & Zero Harassment</h3>
                <ul className="ps-3 mb-4" style={{ listStyleType: 'disc' }}>
                  <li><strong>Respect Client Spaces:</strong> Treat the client's home, business, or project site with utmost care. Do not touch personal belongings or enter restricted areas without permission.</li>
                  <li><strong>Zero Tolerance Policy:</strong> QuickLabour has a zero-tolerance policy for harassment, threats, physical violence, abusive language, or discrimination based on race, gender, religion, caste, or disability.</li>
                  <li><strong>Confidentiality:</strong> Respect the privacy of the client and do not take photos/videos of their private premises without explicit permission.</li>
                </ul>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>4. Safety & Legality</h3>
                <ul className="ps-3 mb-4" style={{ listStyleType: 'disc' }}>
                  <li><strong>No Under-the-influence Work:</strong> Never arrive at a job site under the influence of alcohol, drugs, or illegal substances.</li>
                  <li><strong>Equipment Safety:</strong> Use tools and equipment safely. Wear appropriate safety gears (boots, gloves, helmets) where required by the trade.</li>
                  <li><strong>No Illegal Tasks:</strong> If a client requests you to engage in illegal, dangerous, or unsafe activities, reject the job and report it immediately to QuickLabour Support.</li>
                </ul>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>5. Consequences of Violations</h3>
                <p>
                  Failure to comply with this Code of Conduct may result in immediate actions including:
                </p>
                <ul className="ps-3 mb-4" style={{ listStyleType: 'disc' }}>
                  <li>Tokens deduction or lowering of worker rating</li>
                  <li>Temporary suspension from placing bids</li>
                  <li>Permanent termination of your QuickLabour account</li>
                  <li>Reporting to law enforcement authorities in cases of illegal behavior</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerConduct;

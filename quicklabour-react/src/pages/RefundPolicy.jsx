import React, { useEffect } from 'react';

const RefundPolicy = () => {
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
                <div className="stat-icon-wrapper orange" style={{ width: '60px', height: '60px', borderRadius: '18px', fontSize: '1.8rem', background: 'rgba(245, 166, 35, 0.08)', color: '#f5a623' }}>
                  <i className="bi bi-arrow-left-right"></i>
                </div>
                <div>
                  <h1 className="fw-800 m-0" style={{ fontSize: '2rem', color: '#0a2540' }}>Refund & Cancellation Policy</h1>
                  <p className="text-muted m-0 small">Last Updated: June 15, 2026</p>
                </div>
              </div>

              <div className="policy-content" style={{ color: '#4a5568', lineHeight: '1.8', fontSize: '0.95rem' }}>
                <p className="lead fw-600 mb-4" style={{ color: '#0a2540' }}>
                  QuickLabour strives to maintain a transparent, fair, and reliable marketplace for both clients and workers. This Refund & Cancellation Policy governs the transactions and bookings made on our platform.
                </p>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>1. Booking Cancellations</h3>
                <p>
                  <strong>By Clients:</strong> Clients can cancel a job request at any time before a worker accepts or arrives at the job location. If a cancellation is made after a worker has accepted and commenced travel to the location, a nominal travel convenience fee may be deducted from the client's wallet and compensated to the worker.
                </p>
                <p>
                  <strong>By Workers:</strong> Workers are expected to accept jobs only when they are fully available. Repeated cancellations by workers post-acceptance will trigger a system review and may result in penalties, points deduction, or temporary profile suspension.
                </p>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>2. Refund Eligibility & Wallet Top-ups</h3>
                <p>
                  Money added to the QuickLabour digital wallet is stored in INR and can be used for paying worker wages or booking services on the platform.
                </p>
                <ul className="ps-3 mb-4" style={{ listStyleType: 'disc' }}>
                  <li><strong>Failed Wallet Transactions:</strong> If money is deducted from your bank account/card but does not reflect in your QuickLabour wallet, the amount will be automatically refunded by your payment gateway within 5-7 working days.</li>
                  <li><strong>Wallet Balances withdrawal:</strong> Wallet balances obtained through promotional offers or reward points are non-refundable and non-withdrawable. Direct deposits can be requested for refund back to the source account under verified disputes, subject to processing fees.</li>
                </ul>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>3. Dispute Resolution & Wage Holdbacks</h3>
                <p>
                  If a client is unsatisfied with the quality of work performed, or if a dispute arises regarding completion:
                </p>
                <ul className="ps-3 mb-4" style={{ listStyleType: 'disc' }}>
                  <li>The client must raise a dispute ticket in the support section within 24 hours of work completion.</li>
                  <li>QuickLabour admins will review communication history, coordinates/logs, photographic proof, and ratings.</li>
                  <li>If the dispute is decided in favor of the client, a full or partial refund of the job fee will be credited back to the client's wallet.</li>
                  <li>If the worker is found to have completed the service according to the job agreement, the agreed wages will be transferred to the worker's wallet.</li>
                </ul>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>4. Point Purchases</h3>
                <p>
                  Points purchased by workers/labours to apply for jobs or boost profiles are strictly non-refundable once utilized. Unused points purchased within 48 hours can be reviewed for refunds upon request, provided no jobs were bid on or accepted during that period.
                </p>

                <h3 className="fw-700 mt-4 mb-3" style={{ color: '#0a2540', fontSize: '1.4rem' }}>5. Contact Support</h3>
                <p>
                  For any query regarding refunds, disputes, or cancellation charges, contact our dedicated compliance desk at billing@quicklabour.com.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;

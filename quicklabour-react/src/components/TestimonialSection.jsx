import React from 'react';

const testimonials = [
  {
    name: 'Rahul Mehta',
    sub: 'Home Owner, Ludhiana',
    text: 'Found an electrician within 20 minutes of posting. He was professional, did excellent work, and charged exactly what was quoted. QuickLabour is a game changer!',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 5,
    workerType: 'Electrician'
  },
  {
    name: 'Karan Malhotra',
    sub: 'Villa Owner, Amritsar',
    text: 'Hired a painter to paint our living room. Extremely neat, finished ahead of schedule, and used high-quality paints. Highly recommended!',
    avatar: 'https://randomuser.me/api/portraits/men/84.jpg',
    rating: 5,
    workerType: 'Master Painter'
  },
  {
    name: 'Balwinder Singh',
    sub: 'Professional Plumber, Amritsar',
    text: 'As a plumber, QuickLabour helped me find steady work every day. My income has doubled. The app is easy to use and payments are always on time.',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    rating: 5,
    workerType: 'Plumbing Specialist'
  },
  {
    name: 'Priya Arora',
    sub: 'Factory Manager, Chandigarh',
    text: 'Managing our factory maintenance is now so smooth. We hire 10–15 workers weekly through QuickLabour. Verified profiles save us so much vetting time.',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: 4.5,
    workerType: 'General Labour'
  },
  {
    name: 'Aisha Sen',
    sub: 'Apartment Tenant, Chandigarh',
    text: 'Booked a carpentry service for custom bookshelf installation. The craftsmanship is outstanding, very precise work!',
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
    rating: 5,
    workerType: 'Carpenter'
  },
  {
    name: 'Vikram Rathore',
    sub: 'Contractor, Ludhiana',
    text: 'Needed 5 concrete masons on short notice for a site extension. Found top-tier skilled professionals within an hour. Saved our project timeline!',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    rating: 5,
    workerType: 'Mason / Concrete Worker'
  }
];

const TestimonialSection = () => {
  return (
    <section className="testi-section py-5" id="testimonials">
      <div className="container py-3">
        <div className="text-center mb-5 reveal visible">
          <h2 className="section-title">What Our Users Say</h2>
          <p className="section-sub">Trusted by thousands across India</p>
        </div>
        <div className="row g-4">
          {testimonials.map((testi, index) => (
            <div key={index} className="col-md-4 reveal visible">
              <div className="testi-card d-flex flex-column justify-content-between h-100" style={{ minHeight: '340px' }}>
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="quote-icon mb-0" style={{ fontSize: '2rem', color: '#cbd5e1' }}>"</div>
                    <span className="badge bg-primary-subtle text-primary fw-800 px-2.5 py-1.5 rounded-pill" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <i className="bi bi-hammer me-1"></i> {testi.workerType}
                    </span>
                  </div>
                  <p className="mb-4" style={{ fontStyle: 'italic', color: '#4a5568', fontSize: '0.94rem', lineHeight: '1.6' }}>{testi.text}</p>
                </div>
                <div className="d-flex align-items-center mt-auto gap-3 pt-3" style={{ borderTop: '1px dashed #e2e8f0' }}>
                  <img src={testi.avatar} alt={testi.name} className="testi-avatar" />
                  <div>
                    <div className="testi-name">{testi.name}</div>
                    <div className="testi-sub">{testi.sub}</div>
                    <div className="rating mt-1">
                      {[...Array(5)].map((_, i) => {
                        const starValue = i + 1;
                        if (testi.rating >= starValue) return <i key={i} className="bi bi-star-fill"></i>;
                        if (testi.rating >= starValue - 0.5) return <i key={i} className="bi bi-star-half"></i>;
                        return <i key={i} className="bi bi-star"></i>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;

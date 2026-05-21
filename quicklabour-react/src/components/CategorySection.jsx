import React from 'react';
import { useNavigate } from 'react-router-dom';

const categories = [
  { name: 'Plumber', formValue: 'Plumbing', count: '2,340 workers', icon: 'https://cdn-icons-png.flaticon.com/64/2785/2785819.png', bg: '#e8f0fe' },
  { name: 'Electrician', formValue: 'Electric Work', count: '3,120 workers', icon: 'https://cdn-icons-png.flaticon.com/64/2966/2966334.png', bg: '#fff8e1' },
  { name: 'Carpenter', formValue: 'Carpenter', count: '1,870 workers', icon: 'https://cdn-icons-png.flaticon.com/64/3500/3500835.png', bg: '#e8f5e9' },
  { name: 'Painter', formValue: 'Painting', count: '2,560 workers', icon: 'https://cdn-icons-png.flaticon.com/64/3022/3022248.png', bg: '#fce4ec' },
  { name: 'Welder', formValue: 'Welder', count: '980 workers', icon: 'https://cdn-icons-png.flaticon.com/64/2590/2590013.png', bg: '#ede7f6' },
  { name: 'Mason', formValue: 'Masons', count: '1,430 workers', icon: 'https://cdn-icons-png.flaticon.com/64/3143/3143642.png', bg: '#e0f2f1' },
];

const CategorySection = () => {
  const navigate = useNavigate();

  const handleCardClick = (category) => {
    navigate(`/post-job?category=${encodeURIComponent(category)}`);
  };

  return (
    <section className="py-5 bg-light" id="categories">
      <div className="container py-3">
        <div className="text-center mb-5 reveal visible">
          <h2 className="section-title">Browse by Category</h2>
          <p className="section-sub">50+ skilled trade categories at your fingertips</p>
        </div>
        <div className="row g-3">
          {categories.map((cat, index) => (
            <div 
              key={index} 
              className="col-6 col-md-3 col-lg-2 reveal visible"
              onClick={() => handleCardClick(cat.formValue)}
              style={{ cursor: 'pointer' }}
            >
              <div className="cat-card">
                <div className="cat-icon" style={{ background: cat.bg }}>
                  <img src={cat.icon} alt={cat.name} style={{ width: '38px', height: '38px' }} />
                </div>
                <h6>{cat.name}</h6>
                <span>{cat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;

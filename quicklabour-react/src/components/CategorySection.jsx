import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LABOUR_INDUSTRIES } from '../utils/api';

const STAT_BADGES = [
  { label: 'Categories', value: '45+', icon: 'bi-grid-fill', color: '#0d6efd', bgColor: 'rgba(13, 110, 253, 0.15)' },
  { label: 'Verified Workers', value: '12,500+', icon: 'bi-people-fill', color: '#1db97a', bgColor: 'rgba(29, 185, 122, 0.15)' },
  { label: 'Average Rating', value: '4.9★', icon: 'bi-star-fill', color: '#f5a623', bgColor: 'rgba(245, 166, 35, 0.15)' },
  { label: 'Support', value: '24x7', icon: 'bi-headset', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' }
];

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

const OCCUPATION_IMAGES = {
  "Construction Labour": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=450&q=80",
  "Mason": "https://www.shutterstock.com/image-photo/happy-indian-male-construction-worker-260nw-2317221223.jpg",
  "Carpenter": "https://usihome.com/wp-content/uploads/2022/02/charpentier-de-bois-1.jpeg",
  "Electrician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=450&q=80",
  "Plumber": "https://www.steadyfloplumbing.com/wp-content/uploads/2023/10/plumbing-services-1920w.jpg",
  "Welder": "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=450&q=80",
  "Painter": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=450&q=80",
  "Tile worker": "https://static.vecteezy.com/system/resources/thumbnails/074/236/707/small/tile-installation-professional-contractor-installing-floor-tiles-with-spacers-and-cement-trowel-photo.jpg",
  "Steel fixer": "https://zmv-assets.holzweg.tv//Anwenderbilder/Anwender_113301-2.jpg",
  "Concrete worker": "https://images.squarespace-cdn.com/content/v1/5f4f9895e09c563a9267f110/ab3e3c6e-7850-4fbc-ac34-39f4fb46e01c/iStock-1362538391.jpg",
  "Scaffolder": "https://i0.wp.com/sigmahealth.co.uk/wp-content/uploads/2024/06/Fit-to-work-banner-1.png?fit=500%2C500&ssl=1",
  
  // Factory / Industrial Labour
  "Machine operator": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=450&q=80",
  "Assembly line worker": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=450&q=80",
  "Packaging worker": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=450&q=80",
  "Warehouse loader": "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=450&q=80",
  "Forklift operator": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=450&q=80",
  "Quality checker": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=450&q=80",

  // Agricultural Labour
  "Farmer helper": "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=450&q=80",
  "Harvester": "https://mahindrafarmmachinery.com/sites/default/files/2024-12/8.%20Combine%20Harvester%20Working%2C%20Uses%2C%20and%20Importance-min%20%281%29_0.jpg",
  "Dairy worker": "https://www.shutterstock.com/image-photo/woman-pouring-fresh-milk-into-260nw-2767933909.jpg",
  "Irrigation worker": "https://d3n8a8pro7vhmx.cloudfront.net/seedyourfuture/pages/239/attachments/original/1547063101/IrrigationMainEdited.jpg?1547063101",
  "Tractor operator": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ5ovh1ATW9UGNko__iNyHpSgZ7dWbH7jkBjcP5UoXGaUaVL51Vi8cBns&s=10",

  // Transport & Delivery
  "Truck helper": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=450&q=80",
  "Delivery worker": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKUfvi-hIpA8XFttf3AUAQ0i6QR3amjieMuq_BYeKyN-6V9iXXsfxzT23s&s=10",
  "Driver": "https://lscdn.blob.core.windows.net/biz-live/photos-12272115-17640528706143953.jpeg",
  "Loader/unloader": "https://vrslogistics.com/wp-content/uploads/2021/01/loading-unloading-services-visakhapatnam-600x400-1.jpg",

  // Cleaning & Maintenance
  "Sweeper": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=450&q=80",
  "Housekeeping staff": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=450&q=80",
  "Garbage collector": "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=450&q=80",
  "Maintenance worker": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=450&q=80",

  // Domestic Labour
  "Cook": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=450&q=80",
  "Maid": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=450&q=80",
  "Caretaker": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=450&q=80",
  "Babysitter": "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=450&q=80",

  // Skilled Technical Labour
  "HVAC technician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=450&q=80",
  "Mechanic": "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=450&q=80",
  "Mobile repair technician": "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=450&q=80",
  "AC repair worker": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=450&q=80",

  // Daily Wage / General Labour
  "Helper": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=450&q=80",
  "Road worker": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=450&q=80",
  "Excavation worker": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=450&q=80",
  "Security guard": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=450&q=80",

  // Mining & Heavy Work
  "Miner": "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=450&q=80",
  "Drilling worker": "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=450&q=80",
  "Crane operator": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=450&q=80"
};

const CARD_COLORS = [
  '#f5a623', // amber
  '#8b5cf6', // purple
  '#1db97a', // green
  '#0d6efd', // blue
  '#ef4444', // red
  '#0ea5e9', // light blue
  '#ec4899', // pink
  '#10b981', // emerald
  '#f43f5e', // rose
  '#f59e0b', // warning orange
];

const CategorySection = () => {
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem('userRole');
  const scrollRef = useRef(null);

  // Flatten and extract specialties dynamically from LABOUR_INDUSTRIES
  const dynamicCards = [];
  Object.entries(LABOUR_INDUSTRIES).forEach(([industryName, info]) => {
    info.specialties.forEach((spec) => {
      // Generate a realistic workers count
      const workerCountVal = ((spec.baseRate * 7) % 350) + 450;
      const workers = `${workerCountVal}+ Workers`;
      
      // Rate range
      const maxRate = spec.baseRate + 300;
      const rate = `₹${spec.baseRate} - ₹${maxRate}/day`;
      
      // Icon & image
      const icon = INDUSTRY_ICONS[industryName] || 'bi-person-gear';
      const img = OCCUPATION_IMAGES[spec.name] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=450&q=80';
      
      dynamicCards.push({
        name: spec.name,
        workers,
        rate,
        img,
        icon,
        industry: industryName,
      });
    });
  });

  // Duplicate cards for seamless loop marquee
  const doubleCards = [...dynamicCards, ...dynamicCards];

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationFrameId;
    let isInteracting = false;
    let interactionTimeout;

    const handleInteractionStart = () => {
      isInteracting = true;
      if (interactionTimeout) clearTimeout(interactionTimeout);
    };

    const handleInteractionEnd = () => {
      interactionTimeout = setTimeout(() => {
        isInteracting = false;
      }, 2500);
    };

    // Drag events for mouse interaction
    let startX;
    let scrollLeftStart;
    let isMouseDown = false;

    const onMouseDown = (e) => {
      isMouseDown = true;
      handleInteractionStart();
      container.style.cursor = 'grabbing';
      startX = e.pageX - container.offsetLeft;
      scrollLeftStart = container.scrollLeft;
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5; // Drag sensitivity multiplier
      container.scrollLeft = scrollLeftStart - walk;
    };

    const onMouseUpOrLeave = () => {
      if (isMouseDown) {
        isMouseDown = false;
        container.style.cursor = 'grab';
        handleInteractionEnd();
      }
    };

    // Touch events for mobile swiping
    const onTouchStart = () => {
      handleInteractionStart();
    };

    const onTouchEnd = () => {
      handleInteractionEnd();
    };

    // Scroll/Wheel detection for trackpads and mouse wheels
    const onWheel = () => {
      handleInteractionStart();
      handleInteractionEnd();
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUpOrLeave);
    container.addEventListener('mouseleave', onMouseUpOrLeave);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('wheel', onWheel, { passive: true });

    // Smooth auto-scroll physics loop
    const speed = 0.8; 
    const tick = () => {
      if (container) {
        const halfWidth = container.scrollWidth / 2;
        
        // Wrap around logic for infinite loop
        if (container.scrollLeft >= halfWidth) {
          container.scrollLeft = 0;
        } else if (container.scrollLeft <= 0) {
          container.scrollLeft = halfWidth;
        }

        if (!isInteracting) {
          container.scrollLeft += speed;
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactionTimeout) clearTimeout(interactionTimeout);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUpOrLeave);
      container.removeEventListener('mouseleave', onMouseUpOrLeave);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
    };
  }, [doubleCards.length]);

  const handleCardClick = (category) => {
    if (userRole === 'worker') return;
    navigate(`/post-job?category=${encodeURIComponent(category)}`);
  };

  return (
    <section className="py-5" style={{ background: 'var(--bg-app)', transition: 'background-color 0.3s ease', overflow: 'hidden' }} id="categories">
      
      <style>{`
        .category-marquee-container {
          overflow-x: auto;
          position: relative;
          width: 100%;
          padding: 20px 0;
          scrollbar-width: none; /* Hide scrollbar for Firefox */
          -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
        }
        .category-marquee-container::-webkit-scrollbar {
          display: none; /* Hide scrollbar for Chrome/Safari */
        }
        .category-marquee-track {
          display: flex;
          gap: 24px;
          width: max-content;
          cursor: grab;
          user-select: none;
          padding: 0 120px; /* Padding matching fade width */
        }
        
        /* Fade Overlays */
        .category-marquee-wrapper {
          position: relative;
          width: 100%;
        }
        .category-marquee-wrapper::before,
        .category-marquee-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 120px;
          z-index: 5;
          pointer-events: none;
        }
        .category-marquee-wrapper::before {
          left: 0;
          background: linear-gradient(to right, var(--bg-app), transparent);
        }
        .category-marquee-wrapper::after {
          right: 0;
          background: linear-gradient(to left, var(--bg-app), transparent);
        }
        
        .category-card-hover:hover img {
          transform: scale(1.08);
        }
      `}</style>

      <div className="container">
        
        {/* Title Block */}
        <div className="text-center mb-4">
          <h2 className="section-title fw-800 mb-2" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Find Skilled Workers
          </h2>
          <p className="section-sub text-muted" style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>
            Choose from {dynamicCards.length}+ verified trades, ready to work near you.
          </p>
        </div>

        {/* Stats Row */}
        <div className="row g-3 justify-content-center mb-5">
          {STAT_BADGES.map((badge, idx) => (
            <div key={idx} className="col-6 col-md-3">
              <div 
                className="d-flex align-items-center gap-3 p-3 shadow-sm h-100" 
                style={{ 
                  borderRadius: '16px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div 
                  className="d-flex align-items-center justify-content-center rounded-12" 
                  style={{ 
                    width: '44px', 
                    height: '44px', 
                    background: badge.bgColor, 
                    color: badge.color,
                    borderRadius: '12px',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}
                >
                  <i className={`bi ${badge.icon}`}></i>
                </div>
                <div>
                  <div className="fw-800 lh-1" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{badge.value}</div>
                  <div className="text-muted small fw-600 mt-1" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{badge.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Draggable & Auto-scrolling Infinite Marquee Section */}
      <div className="category-marquee-wrapper">
        <div 
          ref={scrollRef}
          className="category-marquee-container"
        >
          <div className="category-marquee-track">
            {doubleCards.map((card, idx) => {
              const color = CARD_COLORS[idx % CARD_COLORS.length];
              return (
                <div 
                  key={idx}
                  onClick={() => handleCardClick(card.name)}
                  className="category-card-hover shadow-sm overflow-hidden text-center cursor-pointer position-relative flex-shrink-0"
                  style={{ 
                    width: '260px', 
                    borderRadius: '24px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: userRole === 'worker' ? 'default' : 'pointer',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    marginBottom: '10px'
                  }}
                >
                  {/* Image Banner */}
                  <div style={{ height: '170px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={card.img} 
                      alt={card.name} 
                      className="w-100 h-100" 
                      style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                      draggable="false"
                    />
                    
                    {/* Overlay Circular Icon Badge */}
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-circle border border-2 shadow position-absolute start-50 translate-middle-x" 
                      style={{ 
                        bottom: '-22px', 
                        width: '46px', 
                        height: '46px', 
                        background: 'var(--card-bg)', 
                        borderColor: 'var(--card-bg)',
                        color: color,
                        fontSize: '1.2rem',
                        zIndex: 3
                      }}
                    >
                      <i className={`bi ${card.icon}`}></i>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="pt-4 pb-3 px-3">
                    <h5 className="fw-800 mb-1 mt-2" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {card.name}
                    </h5>
                    <div className="text-muted small fw-600 mb-2" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <i className="bi bi-people-fill me-1 text-primary"></i> {card.workers}
                    </div>
                    <div className="fw-700 text-primary" style={{ fontSize: '0.92rem' }}>
                      {card.rate}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container">
        {/* View All Button */}
        <div className="text-center mt-4">
          <button
            className="btn btn-primary rounded-pill px-5 py-3 fw-bold"
            onClick={() => navigate('/categories')}
            style={{ 
              fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(13, 110, 253, 0.25)',
              border: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(13, 110, 253, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(13, 110, 253, 0.25)';
            }}
          >
            View All Categories <i className="bi bi-arrow-right ms-2"></i>
          </button>
        </div>
      </div>

    </section>
  );
};

export default CategorySection;

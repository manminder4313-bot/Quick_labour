import React from 'react';
import { useNavigate } from 'react-router-dom';

const categoriesData = [
  {
    id: 'plumber',
    name: 'Plumbers',
    formValue: 'Plumbing',
    desc: 'Pipe fitting, water leakage, bathroom repairs',
    icon: 'bi-droplet',
    skills: ['Pipelines', 'Fittings']
  },
  {
    id: 'electrician',
    name: 'Electricians',
    formValue: 'Electric Work',
    desc: 'Wiring, switchboards, appliances repair',
    icon: 'bi-lightning',
    skills: ['Wiring', 'Repair']
  },
  {
    id: 'carpenter',
    name: 'Carpenters',
    formValue: 'Carpenter',
    desc: 'Furniture, doors, modular woodwork',
    icon: 'bi-hammer',
    skills: ['Furniture', 'Woodwork']
  },
  {
    id: 'painter',
    name: 'Painters',
    formValue: 'Painting',
    desc: 'Interior, exterior, texture painting',
    icon: 'bi-brush',
    skills: ['Wall Paint', 'Texture']
  },
  {
    id: 'mason',
    name: 'Masons',
    formValue: 'Masons',
    desc: 'Construction, tiles and brick work',
    icon: 'bi-building',
    skills: ['Tiles', 'Brickwork']
  },
  {
    id: 'welder',
    name: 'Welders',
    formValue: 'Welder',
    desc: 'Iron gates, grills and fabrication',
    icon: 'bi-tools',
    skills: ['Fabrication', 'Metal Work']
  },
  {
    id: 'cleaner',
    name: 'Cleaners',
    formValue: 'Cleaning',
    desc: 'House cleaning and maintenance',
    icon: 'bi-house-check',
    skills: ['Cleaning', 'Sanitation']
  },
  {
    id: 'driver',
    name: 'Drivers',
    formValue: 'Driver',
    desc: 'Personal, commercial and delivery drivers',
    icon: 'bi-truck',
    skills: ['Transport', 'Delivery']
  }
];

const Categories = () => {
  const navigate = useNavigate();

  const handleHire = (category) => {
    navigate(`/post-job?category=${encodeURIComponent(category)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="category-hero">
        <div className="container">
          <h1>Browse Worker Categories</h1>
          <p>Find verified workers across multiple trades and hire in minutes.</p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {categoriesData.map((cat) => (
              <div key={cat.id} className="col-md-4 col-lg-3">
                <div className="category-box">
                  <div className="category-icon">
                    <i className={`bi ${cat.icon}`}></i>
                  </div>
                  <h5>{cat.name}</h5>
                  <p>{cat.desc}</p>
                  <div className="mb-3">
                    {cat.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                  <button 
                    className="btn-category" 
                    onClick={() => handleHire(cat.formValue)}
                  >
                    Hire {cat.name.slice(0, -1)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Categories;

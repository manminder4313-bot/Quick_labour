import React from 'react';

const steps = [
  {
    num: 1,
    title: 'Post Your Job',
    desc: 'Describe what you need — type of work, location, date and budget. Takes less than 2 minutes.',
    img: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=500&q=70',
  },
  {
    num: 2,
    title: 'Choose a Worker',
    desc: 'Browse verified profiles, ratings and past work photos. Chat before you hire — no surprises.',
    img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=70',
  },
  {
    num: 3,
    title: 'Get It Done',
    desc: 'Worker arrives on time. Pay only after you\'re satisfied. Leave a review to help the community.',
    img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=70',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="how-section" id="how">
      <div className="container">
        <div className="text-center mb-5 reveal visible">
          <h2 className="section-title" style={{ color: '#fff' }}>How QuickLabour Works</h2>
          <p style={{ color: '#8baec8' }}>3 simple steps to get your job done</p>
        </div>
        <div className="row g-4">
          {steps.map((step, index) => (
            <div key={index} className="col-md-4 reveal visible">
              <div className="step-card">
                <img src={step.img} alt={step.title} className="step-img" />
                <div className="step-num">{step.num}</div>
                <h5>{step.title}</h5>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

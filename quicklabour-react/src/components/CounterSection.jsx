import React, { useEffect, useState, useRef } from 'react';

const CounterBox = ({ target, label, icon }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const end = parseInt(target);
      if (start === end) return;

      let totalMilisekondsDur = 2000;
      let incrementTime = (totalMilisekondsDur / end) * 100;
      
      // Adjusted increment logic for large numbers
      const step = Math.ceil(end / 50);

      let timer = setInterval(() => {
        start += step;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, 30);

      return () => clearInterval(timer);
    }
  }, [isVisible, target]);

  return (
    <div className="col-6 col-md-3 reveal visible" ref={countRef}>
      <div className="counter-box">
        <div className="counter-num">{count.toLocaleString()}{target.includes('%') ? '%' : ''}</div>
        <div className="counter-label">
          <i className={`bi ${icon} me-1`}></i>{label}
        </div>
      </div>
    </div>
  );
};

const CounterSection = () => {
  return (
    <section className="counter-section">
      <div className="container">
        <div className="row text-center g-4">
          <CounterBox target="50000" label="Registered Workers" icon="bi-people" />
          <CounterBox target="120000" label="Jobs Completed" icon="bi-briefcase" />
          <CounterBox target="98" label="% Satisfaction" icon="bi-emoji-smile" />
          <CounterBox target="200" label="Cities Covered" icon="bi-geo-alt" />
        </div>
      </div>
    </section>
  );
};

export default CounterSection;

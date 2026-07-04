import React from 'react';
import Hero from '../components/Hero';
import CounterSection from '../components/CounterSection';
import CategorySection from '../components/CategorySection';
import HowItWorksSection from '../components/HowItWorksSection';
import TestimonialSection from '../components/TestimonialSection';
import AppCTA from '../components/AppCTA';

const Home = () => {
  return (
    <>
      <Hero />
      <CounterSection />
      <CategorySection />
      <HowItWorksSection />
      <TestimonialSection />
      <AppCTA />
    </>
  );
};

export default Home;

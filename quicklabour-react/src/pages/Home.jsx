import React from 'react';
import Hero from '../components/Hero';
import SearchSection from '../components/SearchSection';
import CounterSection from '../components/CounterSection';
import CategorySection from '../components/CategorySection';
import HowItWorksSection from '../components/HowItWorksSection';
import WorkerSection from '../components/WorkerSection';
import TestimonialSection from '../components/TestimonialSection';
import AppCTA from '../components/AppCTA';

const Home = () => {
  return (
    <>
      <Hero />
      <SearchSection />
      <CounterSection />
      <CategorySection />
      <HowItWorksSection />
      <WorkerSection />
      <TestimonialSection />
      <AppCTA />
    </>
  );
};

export default Home;

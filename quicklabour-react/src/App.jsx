import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Works from './pages/Works';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import PostJob from './pages/PostJob';
import Login from './pages/Login';
import Reviews from './pages/Reviews';
import ClientDashboard from './pages/ClientDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import IndustryDashboard from './pages/IndustryDashboard';
import IndustryRegister from './pages/IndustryRegister';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/works" element={<Works />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/login" element={<Login />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/worker-dashboard" element={<WorkerDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/industry-dashboard" element={<IndustryDashboard />} />
            <Route path="/industry-register" element={<IndustryRegister />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

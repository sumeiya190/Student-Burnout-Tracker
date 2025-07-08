import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import '../styles/pages/Landing.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      <h1 className="landing-header">Welcome to the Student Burnout Tracker</h1>
      <div className="landing-container">
        <div className="landing-text">
          <h2>Helping you stay balanced, one check-in at a time.</h2>
          <p>
            University life can be overwhelming — deadlines, expectations, and constant pressure
            can take a toll on your mental and emotional health.
          </p>
          <p>
            The Student Burnout Tracker helps you stay ahead of burnout by tracking stress,
            workload, sleep, and emotional well-being.
          </p>
          <p className="bold">You don’t have to burn out to succeed.</p>
          <p>Let’s build healthier student habits — one day at a time.</p>
          <Button onClick={() => navigate('/login')}>Log In</Button>
        </div>
        <div className="landing-image">
          <img src="/LandingImage.png" alt="Notebook with calming candle and quote" />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

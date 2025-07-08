import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Assessment.css';
import Button from '../components/Button';

const questions = [
  "I feel emotionally drained by my academic workload.",
  "I struggle to concentrate or stay focused on tasks.",
  "I feel physically exhausted even after a good night’s sleep.",
  "I feel unmotivated to attend classes or complete assignments.",
  "I find myself procrastinating more than usual.",
  "I feel detached or indifferent toward my academic performance.",
  "I have been experiencing more stress or anxiety than normal.",
  "I feel overwhelmed by balancing school and other responsibilities.",
  "I’ve noticed changes in my appetite, sleep, or energy levels.",
  "I feel like I'm not making meaningful progress despite my efforts."
];

const Assessment = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState(Array(questions.length).fill(0));
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (index, value) => {
    const updated = [...responses];
    updated[index] = parseInt(value);
    setResponses(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (responses.includes(0)) {
      setError('Please answer all questions before submitting.');
      return;
    }

    const payload = {};
    responses.forEach((val, index) => {
      payload[`q${index + 1}`] = val;
    });

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      const res = await fetch('http://localhost:5000/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setSuccessMessage('Evaluation submitted successfully!');
      setResponses(Array(questions.length).fill(0));

      // Redirect after short delay
      setTimeout(() => {
        navigate('/student-dashboard');
      }, 1000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="assessment-wrapper">
      <form onSubmit={handleSubmit} className="assessment-form">
        <div className="form-header">
          <h2>Burnout Self-Assessment</h2>
          <button
            type="button"
            className="exit-button"
            onClick={() => navigate('/student-dashboard')}
          >
            Exit
          </button>
        </div>

        {questions.map((question, index) => (
          <div key={index} className="form-group">
            <label>{question}</label>
            <div className="radio-group">
              {[1, 2, 3, 4, 5].map((val) => (
                <label key={val}>
                  <input
                    type="radio"
                    name={`q${index}`}
                    value={val}
                    checked={responses[index] === val}
                    onChange={(e) => handleChange(index, e.target.value)}
                    required
                  />
                  {val}
                </label>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div className="submit-button-bottom-left">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Assessment;

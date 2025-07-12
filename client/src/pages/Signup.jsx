import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import '../styles/pages/Login.css';

const Signup = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 👇 This only runs when signup fails
        if (data.errors) {
          const firstError = Object.values(data.errors)[0]; // Get first validation error
          setError(firstError);
        } else {
          setError(data.error || 'Signup failed');
        }
        return; // ⛔ Stop here — don’t navigate to login!
      }
      

      navigate('/login');
    } catch (err) {
      console.error('[ERROR] Signup error:', err);
      setError('An error occurred during signup.');
    }
  };

  return (
    <div className="login-page-container">
      <h1 className="login-welcome-heading">Create Your Account</h1>
      <div className="login-wrapper">
        <h2 className="login-title">Sign Up</h2>
        {error && <p className="error-message">{error}</p>}
        <form className="login-form" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            pattern="^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$"
            title="Please enter a valid email address (e.g. user@example.com)"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="signup-role-select"
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>

          <Button type="submit">Sign Up</Button>
        </form>

        <p className="signup-message">
          Already have an account?{' '}
          <span className="signup-link" onClick={() => navigate('/login')}>
            Log in
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;

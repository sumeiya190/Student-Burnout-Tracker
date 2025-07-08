import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button'; 
import '../styles/pages/Login.css'; 
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth(); 

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username_or_email: usernameOrEmail,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      const token = data.access_token;
      const user = data.user;

      if (!user || !user.role) {
        setError('User role missing in response. Cannot redirect.');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setCurrentUser({
        username: user.username,
        role: user.role,
        userId: user.id,
      });

      if (user.role === 'student') {
        navigate('/student-dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        setError('Unknown user role. Cannot redirect.');
      }

    } catch (err) {
      console.error('[ERROR] Login error:', err);
      setError('An error occurred during login.');
    }
  };

  const handleSignUpRedirect = () => {
    navigate('/signup');
  };

  return (
    <div className="login-page-container">
      <h1 className="login-welcome-heading">Welcome to the Student Burnout Tracker</h1>
      <div className="login-wrapper">
        <h2 className="login-title">Login</h2>
        {error && <p className="error-message">{error}</p>}
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username or Email"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className="signup-message">
            Don't have an account?{' '}
            <span className="signup-link" onClick={handleSignUpRedirect}>
              Sign up
            </span>
          </p>

          <Button type="submit">Login</Button>
        </form>
      </div>
    </div>
  );
};

export default Login;

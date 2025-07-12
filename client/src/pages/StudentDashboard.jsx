import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Button from '../components/Button';
import '../styles/pages/StudentDashboard.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const StudentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:5000/api/my-evaluations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch assessments');
        const data = await res.json();
        setAssessments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('[ERROR] Fetching assessments:', err);
        setError(err.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:5000/api/notifications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('[ERROR] Fetching notifications:', err);
      } finally {
        setNotifLoading(false);
      }
    };

    fetchAssessments();
    fetchNotifications();
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch('http://127.0.0.1:5000/api/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('[ERROR] Failed to logout from server:', err);
    }

    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleTakeAssessment = () => {
    navigate('/assessment');
  };

  const validAssessments = assessments.filter(
    (a) => a.submitted_at && typeof a.total_score === 'number'
  );

  const chartData = {
    labels: validAssessments.map((a) =>
      new Date(a.submitted_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Burnout Score',
        data: validAssessments.map((a) => a.total_score),
        borderColor: 'rgba(0,0,0,1)',
        backgroundColor: 'rgba(55,55,55,0.4)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="student-dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <h2>Student Burnout Tracker</h2>
        <Button onClick={handleLogout} className="logout-button">
          Logout
        </Button>
      </nav>

      <div className="dashboard-content">
        {/* Welcome & Assessment Section */}
        <section className="info-section">
          <div className="info-block">
            <h1>Welcome, {currentUser?.username || 'Student'} 👋</h1>
          </div>

          <div className="info-block">
            <Button onClick={handleTakeAssessment} className="take-assessment-button">
              Take Weekly Burnout Assessment
            </Button>
          </div>

          {/* Assessment Results */}
          <div className="info-block">
            {loading ? (
              <p>Loading assessments...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : (
              <div className="previous-results">
                <h3>Previous Burnout Results</h3>
                <div className="results-scroll">
                  {validAssessments.length === 0 ? (
                    <p>No assessments yet.</p>
                  ) : (
                    <ul>
                      {validAssessments.map((a, index) => (
                        <li key={index}>
                          <strong>Date:</strong> {new Date(a.submitted_at).toLocaleString()} —{' '}
                          <strong>Score:</strong> {a.total_score}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="info-block">
            <h3>📢 Notifications from Admin</h3>
            {notifLoading ? (
              <p>Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p>No notifications yet.</p>
            ) : (
              <ul className="notifications-list">
                {[...notifications]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((notif, index) => (
                    <li key={index}>
                      <div className="notif-message">
                        <strong>{notif.type === 'meeting' ? 'Meeting Scheduled:' : 'Notification'} </strong>
                        {notif.message}
                      </div>
                      {notif.type === 'meeting' && notif.meeting && (
                        <div className="meeting-details">
                          <p><strong>Place:</strong> {notif.meeting.place}</p>
                          <p><strong>Date:</strong> {notif.meeting.date}</p>
                          <p><strong>Day:</strong> {notif.meeting.day}</p>
                          <p><strong>Time:</strong> {notif.meeting.time}</p>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </section>

        {/* Chart Section */}
        <section className="chart-section">
          <h3>Burnout Score Trend</h3>
          <div className="chart-wrapper">
            {loading ? (
              <p>Loading chart...</p>
            ) : validAssessments.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <p>No assessment data to display.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;

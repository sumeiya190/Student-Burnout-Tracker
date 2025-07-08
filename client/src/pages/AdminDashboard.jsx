import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
import '../styles/pages/AdminDashboard.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const API = 'http://localhost:5000/api';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    const res = await fetch(`${API}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const allUsers = await res.json();
      const studentsOnly = allUsers.filter((user) => user.role === 'student');
      setUsers(studentsOnly);
    }
  };

  const fetchUserEvals = async () => {
    if (!searchUserId) return;
    try {
      const [ui, ev] = await Promise.all([
        (await fetch(`${API}/users/username/${searchUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })).json(),
        (await fetch(`${API}/evaluations/username/${searchUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })).json(),
      ]);

      if (ui.role !== 'student') {
        alert('Only student evaluations can be viewed.');
        return;
      }

      setUserInfo(ui);
      setEvaluations(ev);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
    }
  };

  const fetchAlerts = async () => {
    const ev = await fetch(`${API}/evaluations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = await ev.json();
    setAlerts(all.filter((e) => e.needs_support && !e.handled_by_admin_id));
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        localStorage.removeItem('token');
        logout();
        window.location = '/login';
      } else {
        console.error('Logout failed.');
      }
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const toggleUserStatus = async (userId, newStatus) => {
    try {
      const res = await fetch(`${API}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        console.error('Failed to update status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`${API}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchUsers();
      } else {
        console.error('Failed to delete user.');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAlerts();
  }, []);

  const chartData = {
    labels: evaluations.map((e) =>
      new Date(e.submitted_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Scores',
        data: evaluations.map((e) => e.total_score),
        borderColor: 'rgba(0,0,0,1)',
        backgroundColor: 'rgba(55,55,55,0.4)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="admin-dashboard">
      <nav className="navbar">
        <h2>Student Burnout Tracker</h2>
        <Button onClick={handleLogout} className="logout-button">
          Logout
        </Button>
      </nav>

      <div className="admin-grid">
        <main className="main-panel">
          <div className="welcome-box">
            <h1>Welcome, Admin 👋</h1>
          </div>

          <div className="alerts-box">
            <Button onClick={() => (window.location = '/alerts')}>
              View Alerts
            </Button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search student by username"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="search-input"
            />
            <Button onClick={fetchUserEvals}>Search</Button>
          </div>

          {userInfo && (
            <div className="user-evals-card">
              <h3>Student Info</h3>
              <p><strong>Username:</strong> {userInfo.username}</p>
              <p><strong>Email:</strong> {userInfo.email}</p>
              <p><strong>Status:</strong> {userInfo.is_active ? 'Active' : 'Suspended'}</p>
              {evaluations.length > 0 ? (
                <div className="chart-container">
                  <Line data={chartData} />
                </div>
              ) : (
                <p>No evaluations yet.</p>
              )}
            </div>
          )}
        </main>

        <aside className="user-manage">
          <h3>Manage Students</h3>

          <input
            type="text"
            placeholder="Search students by username or email"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value.toLowerCase())}
            className="search-input"
          />

          <ul className="user-list">
            {users
              .filter((u) => {
                if (!searchKeyword) return true;
                return (
                  u.username.toLowerCase().includes(searchKeyword) ||
                  u.email.toLowerCase().includes(searchKeyword)
                );
              })
              .map((u) => (
                <li key={u.id} className="user-item">
                  <div>
                    <strong>Username:</strong> {u.username} <br />
                    <strong>Email:</strong> {u.email} <br />
                    <strong>Status:</strong>{' '}
                    <span style={{ color: u.is_active ? 'green' : 'red' }}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div className="user-buttons">
                    <Button onClick={() => toggleUserStatus(u.id, !u.is_active)}>
                      {u.is_active ? 'Suspend' : 'Activate'}
                    </Button>
                    <Button onClick={() => deleteUser(u.id)} className="delete-btn">
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;
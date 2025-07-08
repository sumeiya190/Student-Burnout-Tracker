import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";
import "../styles/pages/Alert.css";

const Alert = () => {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meetingData, setMeetingData] = useState({});
  const [showMeetingForm, setShowMeetingForm] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/evaluations", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch evaluations.");
        const allEvaluations = await res.json();

        // ✅ Corrected: using e.handled_by instead of e.handled_by_admin_id
        const unhandledAlerts = allEvaluations.filter(
          (e) => e.needs_support && !e.handled_by
        );

        setAlerts(unhandledAlerts);
      } catch (err) {
        console.error(err);
        setError("Failed to load alerts.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchAlerts();
  }, [token]);

  const handleMeetingChange = (e) => {
    setMeetingData({ ...meetingData, [e.target.name]: e.target.value });
  };

  const handleScheduleMeeting = async (evaluationId) => {
    try {
      // Step 1: Send meeting details
      const res = await fetch(
        `http://127.0.0.1:5000/api/evaluations/${evaluationId}/set-meeting`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(meetingData),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to schedule meeting.");
      }

      // Step 2: Mark evaluation as handled
      const handleRes = await fetch(
        `http://127.0.0.1:5000/api/evaluations/${evaluationId}/handle`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await handleRes.json();

      if (!handleRes.ok) {
        throw new Error(result.error || "Failed to mark as handled.");
      }

      // Step 3: Ask admin if they want to send a notification
      const shouldNotify = window.confirm("Meeting scheduled. Send a notification to the student?");

      if (shouldNotify) {
        const notifRes = await fetch("http://127.0.0.1:5000/api/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            evaluation_id: evaluationId,
            message: `A meeting has been scheduled.\nPlace: ${meetingData.place}\nTime: ${meetingData.time}, ${meetingData.day} ${meetingData.date}`,
          }),
        });

        if (!notifRes.ok) {
          const notifError = await notifRes.json();
          throw new Error(notifError.error || "Failed to send notification.");
        }

        alert("Notification sent successfully.");
      }

      alert(result.message || "Meeting scheduled and alert handled.");
      setAlerts((prev) => prev.filter((e) => e.id !== evaluationId));
      setShowMeetingForm(null);
      setMeetingData({});
    } catch (err) {
      console.error("Error scheduling meeting:", err);
      alert(err.message);
    }
  };

  const handleMarkAsHandled = async (evaluationId) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/evaluations/${evaluationId}/handle`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to handle evaluation.");
      }

      setAlerts((prev) => prev.filter((e) => e.id !== evaluationId));
      alert(result.message || "Alert successfully handled.");
    } catch (err) {
      console.error("Error handling evaluation:", err);
      alert(err.message);
    }
  };

  return (
    <div className="alert-wrapper">
      <div className="alert-box">
        <button className="exit-button" onClick={() => navigate("/admin-dashboard")}>
          Exit
        </button>

        <div className="alert-container">
          <h2 className="alert-title">🚨 Burnout Alerts</h2>

          {loading ? (
            <p className="no-alerts">Loading alerts...</p>
          ) : error ? (
            <p className="alert-error">{error}</p>
          ) : alerts.length === 0 ? (
            <p className="no-alerts">No unhandled alerts at the moment.</p>
          ) : (
            <div className="table-wrapper">
              <table className="alert-table-full">
                <thead>
                  <tr>
                    <th>👤 Student</th>
                    <th>📊 Total Score</th>
                    <th>📅 Submitted</th>
                    <th>📍 Schedule Meeting</th>
                    <th>✅ Handle</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <div className="student-info">
                          <div>{alert.user?.username || "Unknown"}</div>
                          <div className="email">{alert.user?.email || "N/A"}</div>
                        </div>
                      </td>
                      <td>{alert.total_score}</td>
                      <td>{new Date(alert.submitted_at).toLocaleString()}</td>
                      <td>
                        {showMeetingForm === alert.id ? (
                          <div className="meeting-form">
                            <input
                              type="text"
                              name="place"
                              placeholder="Place"
                              onChange={handleMeetingChange}
                            />
                            <input
                              type="text"
                              name="time"
                              placeholder="Time"
                              onChange={handleMeetingChange}
                            />
                            <input
                              type="text"
                              name="day"
                              placeholder="Day"
                              onChange={handleMeetingChange}
                            />
                            <input
                              type="text"
                              name="date"
                              placeholder="Date"
                              onChange={handleMeetingChange}
                            />
                            <Button
                              className="bg-blue-500 text-white mt-2"
                              onClick={() => handleScheduleMeeting(alert.id)}
                              disabled={
                                !meetingData.place ||
                                !meetingData.time ||
                                !meetingData.day ||
                                !meetingData.date
                              }
                            >
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="bg-yellow-600 text-white"
                            onClick={() => setShowMeetingForm(alert.id)}
                          >
                            Set Meeting
                          </Button>
                        )}
                      </td>
                      <td>
                        {showMeetingForm !== alert.id && (
                          <Button
                            onClick={() => handleMarkAsHandled(alert.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Mark as Handled
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;

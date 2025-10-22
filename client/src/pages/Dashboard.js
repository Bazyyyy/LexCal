import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import { AuthContext } from '../context/AuthContext';
import '../styles/AppStyles.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // storedUser: fallback auf localStorage (sicherstellen, dass Reloads funktionieren)
  const storedUser = user || JSON.parse(localStorage.getItem('user') || 'null');
  const role = storedUser?.role || localStorage.getItem('role');

  const [message, setMessage] = useState('Loading...');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false); // verhindert Flackern zwischen "No events" und "Loading"

  // Begrüßungstext basierend auf Rolle
  useEffect(() => {
    if (!role) {
      setMessage('Nicht eingeloggt. Bitte einloggen.');
      return;
    }
    if (role === 'lawyer') setMessage('Welcome, Lawyer! View your appointments.');
    else if (role === 'client') setMessage('Welcome, Client! Book your appointment.');
    else if (role === 'admin') setMessage('Welcome, Admin! Manage users and schedules.');
    else setMessage('Welcome!');
  }, [role]);

  // Lade kurze Liste der Termine für die Vorschau
  useEffect(() => {
    let cancelled = false;
    const fetchAppointments = async () => {
      if (!storedUser) {
        setLoading(false);
        setFetched(true);
        return;
      }
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/appointments/${storedUser._id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined }
        });
        if (!res.ok) {
          console.warn('Failed to load appointments', res.status);
          if (!cancelled) {
            setAppointments([]);
            setFetched(true);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setAppointments(data);
          setFetched(true);
        }
      } catch (err) {
        console.error('Fetch appointments error:', err);
        if (!cancelled) {
          setAppointments([]);
          setFetched(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAppointments();
    return () => { cancelled = true; };
  }, [storedUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCalendarClick = () => {
    navigate('/book');
  };

  const handleCalendarKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/book');
    }
  };

  // Falls nicht eingeloggt -> klare Meldung + Link
  if (!storedUser) {
    return (
      <div className="login-prompt">
        <h2>{message}</h2>
        <p>
          <Link to="/login" className="login-link">Zur Login-Seite</Link>
        </p>
      </div>
    );
  }

  // Events für die Calendar-Preview (FullCalendar erwartet title + start)
  const events = appointments.map(a => ({
    title: a.status === 'cancelled' ? 'Storniert' : (a.clientId?.name || a.lawyerId?.name || 'Gebucht'),
    start: a.date
  }));

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <nav className="app-nav">
          <Link to="/book" className="nav-link">Calendar</Link>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </nav>
      </header>

      <section className="welcome-section">
        <h2 className="welcome-message">{message}</h2>
        <p className="user-details">
          Signed in as <strong>{storedUser.name}</strong> ({role})
        </p>
      </section>

      <section className="dashboard-section">
        <h3 className="dashboard-section-title">Upcoming Appointments</h3>

        {/* Anzeige-Logik: erst Loading beim ersten Fetch, danach No events / Liste */}
        {loading && !fetched ? (
          <p className="loading-text">Loading...</p>
        ) : (
          appointments.length === 0 ? (
            <div className="no-appointments">No appointments yet.</div>
          ) : (
            <ul className="appointments-list">
              {appointments.slice(0, 8).map(app => (
                <li key={app._id} className="appointment-item">
                  <span className="appointment-date">
                    {new Date(app.date).toLocaleString()}
                  </span>
                  {' — '}
                  {app.clientId?.name || app.lawyerId?.name}
                  {app.status && (
                    <span className="appointment-status"> ({app.status})</span>
                  )}
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      <section className="dashboard-section">
        <h3 className="dashboard-section-title">Calendar Preview</h3>

        {/* Klickbares Widget: onClick navigiert auf /book */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleCalendarClick}
          onKeyDown={handleCalendarKeyDown}
          className="calendar-preview-widget"
          title="Click to open full calendar"
        >
          <CalendarView 
            events={events} 
            handleDateClick={() => { /* preview: kein click */ }}
            isPreview={true} // Diese Zeile hinzufügen!
          />
          <div className="calendar-preview-footer">
            Click to open full calendar
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

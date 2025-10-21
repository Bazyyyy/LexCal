import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import { AuthContext } from '../context/AuthContext';

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

  // Falls nicht eingeloggt -> klare Meldung + Link
  if (!storedUser) {
    return (
      <div style={{ padding: 20 }}>
        <h2>{message}</h2>
        <p>
          <Link to="/login">Zur Login-Seite</Link>
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
    <div style={{ padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>

        {/* reduzierte NAV: nur Calendar + Logout */}
        <nav>
          <Link to="/book" style={{ marginRight: 12 }}>Calendar</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <section style={{ marginTop: 20 }}>
        <h2>{message}</h2>
        <p>Signed in as <strong>{storedUser.name}</strong> ({role})</p>
      </section>

      <section style={{ marginTop: 30 }}>
        <h3>Upcoming (overview)</h3>

        {/* Anzeige-Logik: erst Loading beim ersten Fetch, danach No events / Liste */}
        {loading && !fetched ? (
          <p>Loading...</p>
        ) : (
          appointments.length === 0 ? <p>No appointments yet.</p> : (
            <ul>
              {appointments.slice(0, 8).map(app => (
                <li key={app._id}>
                  {new Date(app.date).toLocaleString()} — {app.clientId?.name || app.lawyerId?.name} {app.status ? `(${app.status})` : ''}
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      <section style={{ marginTop: 30 }}>
        <h3>Calendar preview</h3>

        {/* Klickbares Widget: onClick navigiert auf /book */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/book')}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/book'); }}
          style={{
            border: '1px solid #ddd',
            padding: 8,
            cursor: 'pointer',
            maxWidth: 900
          }}
          title="Click to open full calendar"
        >
          <CalendarView events={events} handleDateClick={() => { /* preview: kein click */ }} />
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: '#333' }}>
            Open full calendar
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

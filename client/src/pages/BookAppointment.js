import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import { AuthContext } from '../context/AuthContext';
import { fetchAppointments, bookAppointment, updateAppointment, deleteAppointment } from '../api/appointments';

const BookAppointment = () => {
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ date: '', title: '', location: '', duration: 60, participants: '' });

  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');

  const loadAppointments = async () => {
    const cu = currentUser;
    if (!cu) return;
    setLoading(true);
    try {
      const data = await fetchAppointments(cu._id, token);
      setAppointments(data || []);

      setEvents((data || []).map(app => {
        // berechne start + end basierend auf duration (in Minuten)
        const startDate = app.date ? new Date(app.date) : new Date();
        const dur = Number(app.duration) || 60;
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + dur);

        const details = [
          app.location || '',
          ...(Array.isArray(app.participants) ? app.participants : (app.participants ? [app.participants] : []))
        ].filter(Boolean).join(' • ');

        const title = (app.title && app.title.trim())
          ? (app.title + (details ? ' • ' + details : ''))
          : (details || 'Gebucht');

        return {
          id: app._id,
          title,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          allDay: false,
          extendedProps: {
            status: app.status,
            location: app.location,
            duration: app.duration,
            participants: app.participants,
            lawyerName: app.lawyerId?.name,
            clientName: app.clientId?.name
          }
        };
      }));
    } catch (err) {
      console.error('loadAppointments error', err);
      setAppointments([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, [user, token]);

  useEffect(() => {
    const loadLawyers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/lawyers');
        if (!res.ok) { setLawyers([]); return; }
        const data = await res.json();
        setLawyers(Array.isArray(data) ? data : []);
        if (currentUser?.role === 'lawyer') setSelectedLawyerId(currentUser._id);
        else if (Array.isArray(data) && data.length) setSelectedLawyerId(data[0]._id || data[0].id || '');
      } catch (err) {
        console.error('Failed to load lawyers', err);
        setLawyers([]);
      }
    };
    loadLawyers();
  }, [currentUser]);

  const openBookingForm = (dateStr, appt = null) => {
    if (appt) {
      setEditingId(appt._id);
      setFormData({
        date: appt.date,
        title: appt.title || '',
        location: appt.location || '',
        duration: appt.duration || 60,
        participants: (appt.participants || []).join(', ')
      });
    } else {
      setEditingId(null);
      setFormData({ date: dateStr, title: '', location: '', duration: 60, participants: '' });
    }
    setShowForm(true);
  };

  const handleDateClick = (arg) => {
    const cu = currentUser;
    if (!cu) { alert('Bitte einloggen.'); return; }
    if (cu.role === 'client' && !selectedLawyerId) {
      alert('Bitte zuerst einen Anwalt auswählen.');
      return;
    }
    openBookingForm(arg.dateStr, null);
  };

  // Neuer: Event click -> finde appointment und öffne Formular zum Bearbeiten
  const handleEventClick = (clickInfo) => {
    const id = clickInfo.event?.id;
    if (!id) return;
    const appt = appointments.find(a => a._id === id);
    if (!appt) {
      // fallback: lade einzelne appointment (optional)
      alert('Termin nicht gefunden zum Bearbeiten.');
      return;
    }
    openBookingForm(appt.date, appt);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    const cu = currentUser;
    if (!cu) { alert('Bitte einloggen.'); return; }

    const lawyerId = cu.role === 'lawyer' ? cu._id : selectedLawyerId;
    const clientId = cu._id;

    const participants = formData.participants
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (editingId) {
        await updateAppointment(editingId, {
          lawyerId,
          clientId,
          date: formData.date,
          title: formData.title,
          location: formData.location,
          duration: Number(formData.duration) || 60,
          participants
        }, token);
      } else {
        await bookAppointment({
          lawyerId,
          clientId,
          date: formData.date,
          title: formData.title,
          location: formData.location,
          duration: Number(formData.duration) || 60,
          participants
        }, token);
      }
      setShowForm(false);
      setEditingId(null);
      await loadAppointments();
      alert(editingId ? 'Termin aktualisiert.' : 'Termin / Slot erfolgreich gespeichert.');
    } catch (err) {
      alert(err.message || 'Fehler beim Speichern');
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!confirm('Termin wirklich löschen?')) return;
    try {
      await deleteAppointment(editingId, token);
      setShowForm(false);
      setEditingId(null);
      await loadAppointments();
      alert('Termin gelöscht.');
    } catch (err) {
      console.error('Delete error', err);
      alert(err.message || 'Fehler beim Löschen');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header mit Home + Logout */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Calendar / Book Appointment</h2>
        <nav>
          <Link to="/dashboard" style={{ marginRight: 12 }}>Home</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <p>
        Eingeloggt als <strong>{currentUser?.name || '—'}</strong> ({currentUser?.role || '—'}).
      </p>

      {currentUser?.role !== 'lawyer' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 8 }}>Select lawyer:</label>
          {lawyers.length === 0 ? (
            <span>No lawyers available</span>
          ) : (
            <select value={selectedLawyerId} onChange={(e) => setSelectedLawyerId(e.target.value)}>
              <option value="">-- choose --</option>
              {lawyers.map(l => (
                <option key={l._id || l.id} value={l._id || l.id}>
                  {l.name || l.email}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading ? <p>Loading...</p> : null}
      <div style={{ maxWidth: 900 }}>
        <CalendarView events={events} handleDateClick={handleDateClick} handleEventClick={handleEventClick} />
      </div>

      {/* Booking form (simple inline modal) */}
      {showForm && (
        <div style={{
          position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483647
        }} onClick={() => { setShowForm(false); setEditingId(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ zIndex: 2147483648, pointerEvents: 'auto', width: 420 }}>
            <form onSubmit={submitBooking} style={{ background: '#fff', padding: 20, borderRadius: 6 }}>
              <h3>{editingId ? 'Termin bearbeiten' : 'Neuen Termin erstellen'}</h3>

              <div style={{ marginBottom: 8 }}>
                <label>Titel</label><br />
                <input autoFocus value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%' }} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label>Datum / Zeit</label><br />
                <input value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%' }} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label>Ort</label><br />
                <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} style={{ width: '100%' }} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label>Dauer (Minuten)</label><br />
                <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} style={{ width: '100%' }} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label>Teilnehmer (Komma-getrennt)</label><br />
                <input value={formData.participants} onChange={(e) => setFormData({ ...formData, participants: e.target.value })} style={{ width: '100%' }} placeholder="z.B. Max Mustermann, Maria" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}>Abbrechen</button>
                {editingId && (
                  <button type="button" onClick={handleDelete} style={{ background: '#f87171', color: '#fff' }}>
                    Löschen
                  </button>
                )}
                <button type="submit">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;

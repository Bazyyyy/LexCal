import { useState, useEffect, useContext } from 'react';
import CalendarView from '../components/CalendarView';
import { AuthContext } from '../context/AuthContext';
import { fetchAppointments, bookAppointment } from '../api/appointments';

const BookAppointment = () => {
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ date: '', location: '', duration: 60, participants: '' });

  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');

  const loadAppointments = async () => {
    const cu = currentUser;
    if (!cu) return;
    setLoading(true);
    try {
      const data = await fetchAppointments(cu._id, token);
      setAppointments(data || []);
      setEvents((data || []).map(app => ({
        id: app._id,
        title: app.status === 'cancelled' ? 'Storniert' : (app.clientId?.name || app.lawyerId?.name || 'Gebucht'),
        start: app.date,
        extendedProps: { status: app.status, location: app.location, duration: app.duration, participants: app.participants }
      })));
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

  const openBookingForm = (dateStr) => {
    setFormData({ date: dateStr, location: '', duration: 60, participants: '' });
    setShowForm(true);
  };

  const handleDateClick = (arg) => {
    const cu = currentUser;
    if (!cu) { alert('Bitte einloggen.'); return; }
    // Wenn Mandant: braucht ausgewählten Anwalt (keine weitere ID-Eingabe)
    if (cu.role === 'client' && !selectedLawyerId) {
      alert('Bitte zuerst einen Anwalt auswählen.');
      return;
    }
    // öffne Formular (Mandant oder Anwalt)
    openBookingForm(arg.dateStr);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    const cu = currentUser;
    if (!cu) { alert('Bitte einloggen.'); return; }

    // bestimme lawyerId / clientId automatisch
    const lawyerId = cu.role === 'lawyer' ? cu._id : selectedLawyerId;
    const clientId = cu.role === 'client' ? cu._id : cu._id; // Anwalt kann Slot als self-create

    // Teilnehmer: split by comma, filter empty
    const participants = formData.participants
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      await bookAppointment({
        lawyerId,
        clientId,
        date: formData.date,
        location: formData.location,
        duration: Number(formData.duration) || 60,
        participants
      }, token);
      setShowForm(false);
      await loadAppointments();
      alert('Termin / Slot erfolgreich gespeichert.');
    } catch (err) {
      alert(err.message || 'Fehler beim Speichern');
    }
  };

  const cancelAppointment = async (id) => {
    console.log('Cancel requested for id', id);
    const url = `http://localhost:5000/api/appointments/${id}/cancel`;
    try {
      const res = await fetch(url, { method: 'PATCH', headers: { Authorization: token ? `Bearer ${token}` : undefined }});
      const text = await res.text();
      console.log('Cancel response', res.status, text);
      if (!res.ok) {
        alert(`Stornieren fehlgeschlagen: ${res.status} - ${text}`);
        return;
      }
      await loadAppointments();
    } catch (err) {
      console.error('Cancel request error', err);
      alert('Fehler beim Stornieren (siehe Konsole)');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Calendar / Book Appointment</h2>

      <p>
        Eingeloggt als <strong>{currentUser?.name || '—'}</strong> ({currentUser?.role || '—'}).
        {currentUser?.role === 'lawyer' ? ' Klick auf Datum legt einen Slot an.' : ' Wähle einen Anwalt und klicke Datum, um einen Termin anzufragen.'}
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
        <CalendarView events={events} handleDateClick={handleDateClick} />
      </div>

      <section style={{ marginTop: 20 }}>
        <h3>Your appointments</h3>

        {/* Styles für kleine Feld-Pills */}
        {/* kann auch in CSS ausgelagert werden */}
        <div style={{ display: 'none' }} aria-hidden />{/* placeholder */}

        {appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {appointments.map(a => {
              const badgeStyle = {
                display: 'inline-block',
                padding: '4px 8px',
                fontSize: 12,
                background: '#f3f4f6',
                color: '#111827',
                borderRadius: 999,
                marginRight: 8,
                marginTop: 6
              };

              return (
                <li key={a._id} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{new Date(a.date).toLocaleString()}</div>
                      <div style={{ color: '#4b5563', marginTop: 4 }}>
                        {a.clientId?.name || a.lawyerId?.name}
                        {a.status ? <span style={{ marginLeft: 8, color: '#9ca3af' }}>({a.status})</span> : null}
                      </div>

                      {/* kleine Felder */}
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                        {a.location ? <span style={badgeStyle}>📍 {a.location}</span> : null}
                        {a.duration ? <span style={badgeStyle}>⏱ {a.duration} min</span> : null}
                        {(a.participants && a.participants.length) ? (
                          a.participants.map((p, idx) => (
                            <span key={idx} style={badgeStyle}>🙋 {p}</span>
                          ))
                        ) : null}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {a.status !== 'cancelled' && (
                        <button style={{ marginLeft: 8 }} onClick={() => cancelAppointment(a._id)}>Cancel</button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Booking form (simple inline modal) */}
      {showForm && (
        <div
          // Overlay: groß zIndex, Klick auf Overlay schließt Modal
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2147483647 // sehr hoch, damit es über dem Kalender liegt
          }}
          onClick={() => setShowForm(false)}
        >
          {/* Container verhindert, dass Klicks an den Hintergrund weitergegeben werden */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              zIndex: 2147483648,
              pointerEvents: 'auto',
              width: 420
            }}
          >
            <form onSubmit={submitBooking} style={{ background: '#fff', padding: 20, borderRadius: 6 }}>
              <h3>Termin für {new Date(formData.date).toLocaleString()}</h3>

              <div style={{ marginBottom: 8 }}>
                <label>Ort</label><br />
                <input
                  autoFocus
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label>Dauer (Minuten)</label><br />
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label>Teilnehmer (Komma-getrennt)</label><br />
                <input
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  style={{ width: '100%' }}
                  placeholder="z.B. Max Mustermann, Maria"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowForm(false)}>Abbrechen</button>
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

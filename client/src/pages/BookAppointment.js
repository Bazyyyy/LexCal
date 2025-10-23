import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import { AuthContext } from '../context/AuthContext';
import { fetchAppointments, fetchLawyerAppointments, bookAppointment, updateAppointment, deleteAppointment, requestAppointment, respondToRequest, fetchPendingRequests } from '../api/appointments';
import '../styles/AppStyles.css';

const BookAppointment = () => {
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ date: '', title: '', location: '', duration: 60, participants: '' });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isWithinBusinessHours = (dateObj) => {
    const d = new Date(dateObj);
    const day = d.getDay();
    if (day === 0 || day === 6) return false;
    const minutes = d.getHours() * 60 + d.getMinutes();
    const start = 9 * 60;
    const end = 17 * 60;
    return minutes >= start && minutes < end;
  };

  const loadAppointments = async () => {
    const cu = currentUser;
    if (!cu) return;
    setLoading(true);
    try {
      let data = [];
      
      if (cu.role === 'client' && selectedLawyerId) {
        const [lawyerAppointments, myAppointments] = await Promise.all([
          fetchLawyerAppointments(selectedLawyerId, token),
          fetchAppointments(cu._id, token)
        ]);
        
        const combined = [...lawyerAppointments, ...myAppointments];
        const unique = combined.filter((app, index, arr) => 
          arr.findIndex(a => a._id === app._id) === index
        );
        data = unique;
      } else {
        data = await fetchAppointments(cu._id, token);
      }
      
      setAppointments(data || []);

      setEvents((data || []).map(app => {
        const startDate = app.date ? new Date(app.date) : new Date();
        const dur = Number(app.duration) || 60;
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + dur);

        const isClient = cu.role === 'client';
        const isOccupied = ['confirmed', 'pending'].includes(app.status);
        const isMyAppointment = app.clientId?._id === cu._id;
        
        let title, backgroundColor;
        if (isClient && isOccupied && !isMyAppointment) {
          title = 'Belegt';
          backgroundColor = '#d1d5db';
        } else {
          const details = [
            app.location || '',
            ...(Array.isArray(app.participants) ? app.participants : [])
          ].filter(Boolean).join(' • ');
          
          title = (app.title && app.title.trim())
            ? (app.title + (details ? ' • ' + details : ''))
            : (details || (app.status === 'pending' ? 'Anfrage' : 'Gebucht'));
            
          backgroundColor = app.status === 'pending' ? '#fbbf24' : 
                           app.status === 'confirmed' ? '#10b981' : 
                           app.status === 'rejected' ? '#ef4444' : '#6b7280';
        }

        return {
          id: app._id,
          title,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          allDay: false,
          backgroundColor,
          extendedProps: {
            ...app,
            isOccupied: isClient && isOccupied && !isMyAppointment
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

  const loadPendingRequests = async () => {
    const cu = currentUser;
    if (!cu || cu.role !== 'lawyer') return;
    try {
      const data = await fetchPendingRequests(cu._id, token);
      setPendingRequests(data || []);
    } catch (err) {
      console.error('loadPendingRequests error', err);
      setPendingRequests([]);
    }
  };

  useEffect(() => { 
    loadAppointments();
    loadPendingRequests();
  }, [user, token, selectedLawyerId]);

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
    const clickedDate = arg.date instanceof Date ? arg.date : new Date(arg.date);
    if (!isWithinBusinessHours(clickedDate)) {
      alert('Termin nur Mo–Fr zwischen 09:00 und 17:00 buchbar.');
      return;
    }
    if (cu.role === 'client' && !selectedLawyerId) {
      alert('Bitte zuerst einen Anwalt auswählen.');
      return;
    }
    openBookingForm(clickedDate.toISOString(), null);
  };

  const handleEventClick = (clickInfo) => {
    const id = clickInfo.event?.id;
    const eventProps = clickInfo.event?.extendedProps;
    
    if (eventProps?.isOccupied) {
      return;
    }
    
    if (!id) return;
    const appt = appointments.find(a => a._id === id);
    if (!appt) {
      alert('Termin nicht gefunden zum Bearbeiten.');
      return;
    }
    openBookingForm(appt.date, appt);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    const cu = currentUser;
    if (!cu) { alert('Bitte einloggen.'); return; }

    const participants = formData.participants.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      lawyerId: cu.role === 'lawyer' ? cu._id : selectedLawyerId,
      clientId: cu._id,
      date: formData.date,
      title: formData.title,
      location: formData.location,
      duration: Number(formData.duration) || 60,
      participants
    };

    try {
      if (editingId) {
        await updateAppointment(editingId, payload, token);
      } else {
        if (cu.role === 'client') {
          await requestAppointment({
            ...payload,
            requestMessage: formData.requestMessage || ''
          }, token);
        } else {
          await bookAppointment(payload, token);
        }
      }
      setShowForm(false);
      setEditingId(null);
      await loadAppointments();
      await loadPendingRequests();
      alert(editingId ? 'Termin aktualisiert.' : 
            cu.role === 'client' ? 'Anfrage gesendet.' : 'Termin erstellt.');
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

  return (
    <div className="app-container">
      <header className="app-header">
        <h2>Calendar</h2> {/* Vereinfacht von "Calendar / Book Appointment" */}
        <nav className="app-nav">
          {currentUser?.role === 'lawyer' && (
            <button 
              onClick={() => setShowRequests(true)} 
              className={pendingRequests.length > 0 ? 'btn btn-warning' : 'btn btn-secondary'}
            >
              Anfragen ({pendingRequests.length})
            </button>
          )}
          {/* User Info neben Navigation */}
          <span className="user-badge">
            {currentUser?.name || '—'} ({currentUser?.role === 'lawyer' ? 'Anwalt' : 'Mandant'})
          </span>
          <Link to="/dashboard" className="nav-link">Home</Link>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </nav>
      </header>

      {/* Entfernt: user-info Paragraph */}
      {/* <p className="user-info">... */}

      {currentUser?.role !== 'lawyer' && (
        <div className="lawyer-select-container">
          <label className="lawyer-select-label">Select lawyer:</label>
          {lawyers.length === 0 ? (
            <span>No lawyers available</span>
          ) : (
            <select 
              value={selectedLawyerId} 
              onChange={(e) => setSelectedLawyerId(e.target.value)}
              className="lawyer-select"
            >
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

      {loading ? <p className="loading-text">Loading...</p> : null}
      <div className="calendar-container">
        <CalendarView events={events} handleDateClick={handleDateClick} handleEventClick={handleEventClick} />
      </div>

      {/* Booking form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingId(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submitBooking} className="form-container">
              <h3 className="form-title">{editingId ? 'Termin bearbeiten' : 'Neuen Termin erstellen'}</h3>

              <div className="form-group">
                <label className="form-label">Titel</label>
                <input 
                  autoFocus 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Datum / Zeit</label>
                <input 
                  value={formData.date} 
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ort</label>
                <input 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dauer (Minuten)</label>
                <input 
                  type="number" 
                  value={formData.duration} 
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teilnehmer (Komma-getrennt)</label>
                <input 
                  value={formData.participants} 
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })} 
                  className="form-input" 
                  placeholder="z.B. Max Mustermann, Maria" 
                />
              </div>

              <div className="form-buttons">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary">
                  Abbrechen
                </button>
                {editingId && (
                  <button type="button" onClick={handleDelete} className="btn btn-danger">
                    Löschen
                  </button>
                )}
                <button type="submit" className="btn btn-primary">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Anfragen-Modal für Anwälte */}
      {showRequests && currentUser?.role === 'lawyer' && (
        <div className="requests-modal" onClick={() => setShowRequests(false)}>
          <div className="requests-container" onClick={(e) => e.stopPropagation()}>
            <h3 className="requests-title">Offene Anfragen</h3>
            {pendingRequests.length === 0 ? (
              <p className="no-requests">Keine offenen Anfragen.</p>
            ) : (
              pendingRequests.map(req => (
                <div key={req._id} className="request-card">
                  <div className="request-info"><strong>{req.clientId?.name}</strong> - {new Date(req.date).toLocaleString()}</div>
                  <div className="request-info">Titel: {req.title || '—'}</div>
                  <div className="request-info">Ort: {req.location || '—'}</div>
                  <div className="request-info">Dauer: {req.duration} min</div>
                  <div className="request-info">Nachricht: {req.requestMessage || '—'}</div>
                  <div className="request-actions">
                    <button 
                      onClick={async () => {
                        await respondToRequest(req._id, 'confirmed', '', token);
                        await loadAppointments();
                        await loadPendingRequests();
                      }} 
                      className="btn btn-success"
                    >
                      Bestätigen
                    </button>
                    <button 
                      onClick={async () => {
                        const reason = prompt('Grund für Ablehnung (optional):');
                        await respondToRequest(req._id, 'rejected', reason || '', token);
                        await loadAppointments();
                        await loadPendingRequests();
                      }} 
                      className="btn btn-danger"
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              ))
            )}
            <button onClick={() => setShowRequests(false)} className="btn btn-secondary">Schließen</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;

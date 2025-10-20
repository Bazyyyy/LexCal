export async function fetchAppointments(userId, token) {
  const res = await fetch(`http://localhost:5000/api/appointments/${userId}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined
    }
  });
  if (!res.ok) throw new Error(`Fetch appointments failed: ${res.status}`);
  return res.json();
}

export async function bookAppointment({ lawyerId, clientId, date }, token) {
  const res = await fetch('http://localhost:5000/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined
    },
    body: JSON.stringify({ lawyerId, clientId, date })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Booking failed');
  return data;
}
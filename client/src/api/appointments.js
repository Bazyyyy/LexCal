export async function fetchAppointments(userId, token) {
  const res = await fetch(`http://localhost:5000/api/appointments/${userId}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined
    }
  });
  if (!res.ok) throw new Error(`Fetch appointments failed: ${res.status}`);
  return res.json();
}

export async function bookAppointment({ lawyerId, clientId, date, title, location, duration, participants }, token) {
  const res = await fetch('http://localhost:5000/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined
    },
    body: JSON.stringify({ lawyerId, clientId, date, title, location, duration, participants })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Booking failed');
  return data;
}

export async function updateAppointment(id, payload, token) {
  const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data;
}

export async function deleteAppointment(id, token) {
  const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Delete failed: ${res.status}`);
  return data;
}

export async function requestAppointment(payload, token) {
  const res = await fetch('http://localhost:5000/api/appointments/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function respondToRequest(id, status, responseMessage, token) {
  const res = await fetch(`http://localhost:5000/api/appointments/${id}/respond`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined
    },
    body: JSON.stringify({ status, responseMessage })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Response failed');
  return data;
}

export async function fetchPendingRequests(lawyerId, token) {
  const res = await fetch(`http://localhost:5000/api/appointments/${lawyerId}/pending`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined
    }
  });
  if (!res.ok) throw new Error(`Fetch pending failed: ${res.status}`);
  return res.json();
}

export async function fetchLawyerAppointments(lawyerId, token) {
  const res = await fetch(`http://localhost:5000/api/appointments/lawyer/${lawyerId}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined
    }
  });
  if (!res.ok) throw new Error(`Fetch lawyer appointments failed: ${res.status}`);
  return res.json();
}
const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://student-project-o6y8h.ondigitalocean.app';

async function handleResponse(res) {
  if (!res.ok) {
    let message = 'Error de servidor';
    try {
      const data = await res.json();
      message = data.error || message;
    } catch (e) {
      const text = await res.text();
      if (text) message = text;
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchCities() {
  const res = await fetch(`${API_URL}/ciudades`);
  return handleResponse(res);
}

export async function fetchCursos() {
  const res = await fetch(`${API_URL}/cursos`);
  return handleResponse(res);
}

export async function fetchAsignaturas() {
  const res = await fetch(`${API_URL}/asignaturas`);
  return handleResponse(res);
}

export async function fetchGrados() {
  const res = await fetch(`${API_URL}/grados`);
  return handleResponse(res);
}

export async function fetchPagos() {
  const res = await fetch(`${API_URL}/pagos`);
  return handleResponse(res);
}

export async function registerTutor(data) {
  const res = await fetch(`${API_URL}/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function registerAlumno(data) {
  const res = await fetch(`${API_URL}/alumno`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTutorCity(tutor_email, ciudad) {
  const res = await fetch(`${API_URL}/tutor/ciudad`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tutor_email, ciudad }),
  });
  return handleResponse(res);
}

export async function registerProfesor(data) {
  const res = await fetch(`${API_URL}/profesor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateProfesor(data) {
  const res = await fetch(`${API_URL}/profesor`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function createOferta(data) {
  const res = await fetch(`${API_URL}/oferta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function createPuja(data) {
  const res = await fetch(`${API_URL}/puja`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function selectPuja(id) {
  const res = await fetch(`${API_URL}/puja/${id}/select`, { method: 'POST' });
  return handleResponse(res);
}

export async function acceptPuja(id) {
  const res = await fetch(`${API_URL}/puja/${id}/accept`, { method: 'POST' });
  return handleResponse(res);
}

export async function confirmPuja(id) {
  const res = await fetch(`${API_URL}/puja/${id}/confirm`, { method: 'POST' });
  return handleResponse(res);
}

export async function registerTransaction(data) {
  const res = await fetch(`${API_URL}/transaccion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function fetchBalances(role) {
  const res = await fetch(`${API_URL}/balances?role=${role}`);
  return handleResponse(res);
}

export async function liquidarBalance(userId, role, email) {
  const res = await fetch(`${API_URL}/balances/${userId}/liquidar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, email }),
  });
  return handleResponse(res);
}

export async function cancelOffer({ offerId, pujaId, role }) {
  const res = await fetch(`${API_URL}/cancel-offer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offerId, pujaId, role }),
  });
  return handleResponse(res);
}

export async function reportIncident(data) {
  const res = await fetch(`${API_URL}/incidencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

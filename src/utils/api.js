const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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

export async function registerTutor(data) {
  const res = await fetch(`${API_URL}/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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

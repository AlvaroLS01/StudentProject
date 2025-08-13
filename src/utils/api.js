const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error de servidor');
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

export async function registerAlumno(tutorId, data) {
  const res = await fetch(`${API_URL}/tutor/${tutorId}/alumno`, {
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
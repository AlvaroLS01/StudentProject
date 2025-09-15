export async function requestPasswordReset(email) {
  try {
    await fetch(
      process.env.REACT_APP_PASSWORD_RESET_API ||
        'https://student-project-o6y8h.ondigitalocean.app/request-password-reset',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }
    );
  } catch (err) {
    console.error('Failed to request password reset', err);
    throw err;
  }
}

export async function resetPassword({ token, password }) {
  const res = await fetch(
    process.env.REACT_APP_CHANGE_PASSWORD_API ||
      'https://student-project-o6y8h.ondigitalocean.app/reset-password',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed');
  }
  return res.json();
}

export async function sendAssignmentEmails({ teacherEmail, teacherName, studentEmail, studentName, schedule, recipient = 'both' }) {
  const payload = { teacherEmail, teacherName, studentEmail, studentName, schedule, recipient };
  try {
    await fetch(process.env.REACT_APP_EMAIL_API || '/api/send-assignment-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to send emails', err);
  }
}

export async function sendWelcomeEmail({ email, name }) {
  try {
    await fetch(process.env.REACT_APP_WELCOME_API || 'http://localhost:3001/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
  } catch (err) {
    console.error('Failed to send welcome email', err);
  }
}

export async function sendVerificationCode({ email, code }) {
  try {
    const base = (process.env.REACT_APP_WELCOME_API || 'http://localhost:3001/send-email').replace('/send-email','');
    await fetch(`${base}/send-verification-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
  } catch (err) {
    console.error('Failed to send verification code', err);
  }
}

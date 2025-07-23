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

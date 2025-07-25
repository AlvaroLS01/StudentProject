require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Allow setting a service account key via env. Otherwise use application default
const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credsPath) {
  admin.initializeApp({
    credential: admin.credential.cert(require(credsPath)),
  });
} else {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'alvaro@studentproject.es',
    pass: process.env.EMAIL_PASS || 'zvet uxtn ocfd wvpj',
  },
});

app.post('/send-email', async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    await transporter.sendMail({
      from: `"Student Project" <${process.env.EMAIL_USER || 'alvaro@studentproject.es'}>`,
      to: email,
      subject: 'Bienvenido a Student Project',
      html: `<p>Hola ${name || 'usuario'}, bienvenido a nuestra plataforma.</p>`,
    });

    res.json({ message: 'Correo enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando correo' });
  }
});

app.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  try {
    // Ensure the user exists
    await admin.auth().getUserByEmail(email);

    const token = jwt.sign({ email }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1h',
    });

    const resetUrl = `${process.env.RESET_BASE_URL || 'http://localhost:3000/reset-password'}?token=${token}`;

    const html = `
      <p>Haz clic en el botón para restablecer tu contraseña:</p>
      <p><a href="${resetUrl}" style="background:#ccf3e5;color:#034640;padding:12px 20px;border-radius:6px;text-decoration:none;">Restablecer contraseña</a></p>
    `;

    await transporter.sendMail({
      from: `"Student Project" <${process.env.EMAIL_USER || 'alvaro@studentproject.es'}>`,
      to: email,
      subject: 'Restablecer contraseña',
      html,
    });

    res.json({ message: 'Correo de restablecimiento enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando correo' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password });
    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Token inválido o expirado' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));

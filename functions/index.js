const functions = require('firebase-functions');
const logger = require('firebase-functions/logger');
const nodemailer = require('nodemailer');

functions.setGlobalOptions({ maxInstances: 10 });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'alvaro@studentproject.es',
    pass: 'ibmf zall dcqj vbuw',
  },
});

exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const { email, displayName } = user;
  const mailOptions = {
    to: email,
    subject: 'Bienvenido a Student Project',
    html: `<p>Hola ${displayName || 'usuario'}, bienvenido a nuestra plataforma.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email}`);
  } catch (error) {
    logger.error('Error sending welcome email', error);
  }
});

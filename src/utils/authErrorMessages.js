export function getAuthErrorMessage(code) {
  const map = {
    'auth/user-not-found': 'Correo o contraseña incorrecto.',
    'auth/wrong-password': 'Correo o contraseña incorrecto.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.'
  };
  return map[code] || 'Error al iniciar sesión';
}

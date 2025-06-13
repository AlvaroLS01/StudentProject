export function getAuthErrorMessage(code) {
  const map = {
    'auth/user-not-found': 'El correo electrónico no existe.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.'
  };
  return map[code] || 'Error al iniciar sesión';
}

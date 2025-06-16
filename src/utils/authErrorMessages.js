export function getAuthErrorMessage(code) {
  const map = {
    'auth/user-not-found': 'Correo no registrado.',
    'auth/wrong-password': 'Correo o contraseña incorrecto.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    'auth/missing-email': 'Debes introducir un correo electrónico.'
  };
  return map[code] || 'Se produjo un error. Inténtalo de nuevo.';
}

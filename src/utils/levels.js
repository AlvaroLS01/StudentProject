export const levelThresholds = [0, 1, 4, 12, 25, 45, 70, 100, 135, 170, 200];

export function getLevelFromClasses(classes) {
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (classes >= levelThresholds[i]) {
      return i;
    }
  }
  return 0;
}

export function getRoleTitle(role, level) {
  const profTitles = [
    'Sin experiencia',
    'Profe Novato',
    'Profe Aprendiz',
    'Profe en Marcha',
    'Profe Avanzado',
    'Profe Entusiasta',
    'Profe Hábil',
    'Profe Destacado',
    'Profe Admirado',
    'Profe Veterano',
    'Profesor Experto'
  ];
  const alumnoTitles = [
    'Nuevo',
    'Alumno Novato',
    'Alumno en Progreso',
    'Alumno Persistente',
    'Alumno Constante',
    'Alumno Avanzado',
    'Alumno Dedicado',
    'Alumno Estrella',
    'Alumno Destacado',
    'Alumno Ejemplar',
    'Alumno Experto'
  ];
  const titles = role === 'profesor' ? profTitles : alumnoTitles;
  return titles[level] || titles[titles.length - 1];
}

export function getProgressData(classes) {
  const level = getLevelFromClasses(classes);
  const prev = levelThresholds[level];
  const next = levelThresholds[level + 1] ?? levelThresholds[level];
  const range = next - prev || 1;
  const progress = Math.min(100, ((classes - prev) / range) * 100);
  return { level, progress, next };
}

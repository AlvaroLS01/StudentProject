const SHEET_NAME = 'Registros';

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.addMenu('Actualizar Datos', [{ name: 'Leer Datos', functionName: 'update' }]);
}

function update() {
  fetchClasses();
}

function fetchClasses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  var headers = [
    'ID de Asignación',
    'Correo Profesor',
    'Nombre Profesor',
    'Nombre Alumno',
    'Correo Alumno',
    'Curso',
    'Asignatura',
    'Fecha',
    'Duración',
    'Modalidad',
    'Tipo de Clase',
    'Precio Total Padres',
    'Precio Total Profesor',
    'Beneficio'
  ];

  sheet.clearContents();
  sheet.appendRow(headers);

  var unions = firestore.getDocuments('clases_union');
  var teacherCache = {};
  var studentCache = {};
  var classCache = {};
  var rows = [];

  for (var i = 0; i < unions.length; i++) {
    var u = unions[i];
    var unionId = u.name.split('/').pop();
    var f = u.fields || {};

    var teacherId = getString(f.profesorId);
    if (teacherId && !teacherCache[teacherId]) {
      var t = firestore.getDocument('usuarios/' + teacherId);
      teacherCache[teacherId] = t ? t.fields : {};
    }
    var teacher = teacherCache[teacherId] || {};
    var teacherEmail = getString(teacher.email);
    var teacherName = getString(f.profesorNombre) || (getString(teacher.nombre) + ' ' + getString(teacher.apellidos)).trim();

    var studentId = getString(f.alumnoId);
    if (studentId && !studentCache[studentId]) {
      var s = firestore.getDocument('usuarios/' + studentId);
      studentCache[studentId] = s ? s.fields : {};
    }
    var student = studentCache[studentId] || {};
    var studentEmail = getString(student.email);
    var studentName = getString(f.padreNombre) || getString(f.alumnoNombre) || (getString(student.nombre) + ' ' + getString(student.apellidos)).trim();

    var classId = getString(f.claseId);
    if (classId && !classCache[classId]) {
      var c = firestore.getDocument('clases/' + classId);
      classCache[classId] = c ? c.fields : {};
    }
    var classData = classCache[classId] || {};
    var curso = getString(classData.curso);
    var asignaturaDefault = getString(classData.asignatura) || (classData.asignaturas ? getArray(classData.asignaturas).join(', ') : '');
    var tipoClase = getString(classData.tipoClase);

    var assignments = firestore.getDocuments('clases_union/' + unionId + '/clases_asignadas');
    for (var j = 0; j < assignments.length; j++) {
      var a = assignments[j];
      var af = a.fields || {};
      var asignatura = getString(af.asignatura) || asignaturaDefault;
      var fecha = getString(af.fecha);
      var duracion = getString(af.duracion);
      var modalidad = getString(af.modalidad);
      var precioPadres = getNumber(af.precioTotalPadres);
      var precioProfesor = getNumber(af.precioTotalProfesor);
      var beneficio = precioPadres - precioProfesor;

      rows.push([
        a.name.split('/').pop(),
        teacherEmail,
        teacherName,
        studentName,
        studentEmail,
        curso,
        asignatura,
        fecha,
        duracion,
        modalidad,
        tipoClase,
        precioPadres,
        precioProfesor,
        beneficio
      ]);
    }
  }

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function getString(obj) {
  if (!obj) return '';
  if (obj.stringValue !== undefined) return obj.stringValue;
  if (obj.integerValue !== undefined) return String(obj.integerValue);
  if (obj.doubleValue !== undefined) return String(obj.doubleValue);
  return '';
}

function getNumber(obj) {
  if (!obj) return 0;
  if (obj.integerValue !== undefined) return Number(obj.integerValue);
  if (obj.doubleValue !== undefined) return Number(obj.doubleValue);
  if (obj.stringValue !== undefined) return Number(obj.stringValue);
  return 0;
}

function getArray(obj) {
  if (!obj || !obj.arrayValue) return [];
  var vals = obj.arrayValue.values || [];
  return vals.map(function(v) { return getString(v); });
}

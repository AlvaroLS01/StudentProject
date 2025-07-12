const SHEET_NAME = 'CLASES';
const TEACHERS_SHEET = 'PROFESORES';
const PARENTS_SHEET = 'PADRES';
const STUDENTS_SHEET = 'ALUMNOS';

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.addMenu('Actualizar Datos', [{ name: 'Leer Datos', functionName: 'update' }]);
}

function update() {
  fetchClasses();
  fetchTeachers();
  fetchParents();
  fetchStudents();
}

function fetchClasses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  var headers = [
    'ID DE ASIGNACIÓN',
    'NOMBRE PROFESOR',
    'CORREO PROFESOR',
    'NOMBRE ALUMNO',
    'CORREO ALUMNO',
    'CURSO',
    'ASIGNATURA',
    'FECHA',
    'DURACIÓN',
    'MODALIDAD',
    'LOCALIZACION',
    'TIPO DE CLASE',
    'PRECIO TOTAL PADRES',
    'PRECIO TOTAL PROFESOR',
    'BENEFICIO'
  ];

  setHeaders(sheet, headers);
  formatClassHeaders(sheet);

  var idMap = getIdMap(sheet, 1);

  var unions = firestore.getDocuments('clases_union');
  var teacherCache = {};
  var studentCache = {};
  var classCache = {};
  var updates = [];
  var appends = [];

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
      var localizacion = getString(af.localizacion) || getString(classData.ciudad);
      var precioPadres = getNumber(af.precioTotalPadres);
      var precioProfesor = getNumber(af.precioTotalProfesor);
      var beneficio = precioPadres - precioProfesor;

      var row = [
        a.name.split('/').pop(),
        teacherName,
        teacherEmail,
        studentName,
        studentEmail,
        curso,
        asignatura,
        fecha,
        duracion,
        modalidad,
        localizacion,
        tipoClase,
        precioPadres,
        precioProfesor,
        beneficio
      ];
      if (idMap[row[0]]) {
        updates.push({ r: idMap[row[0]], data: row });
      } else {
        appends.push(row);
      }
    }
  }

  updates.forEach(function(u) {
    sheet.getRange(u.r, 1, 1, headers.length).setValues([u.data]);
  });
  if (appends.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, headers.length).setValues(appends);
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

function setHeaders(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
}

function getIdMap(sheet, col) {
  var last = sheet.getLastRow();
  var data = last > 1 ? sheet.getRange(2, col, last - 1, 1).getValues() : [];
  var map = {};
  for (var i = 0; i < data.length; i++) {
    var id = data[i][0];
    if (id) map[id] = i + 2;
  }
  return map;
}

function formatClassHeaders(sheet) {
  sheet.getRange(1, 1, 1, 12).setBackground('#bdbdbd');
  sheet.getRange(1, 13, 1, 2).setBackground('#5b95f9');
  sheet.getRange(1, 15, 1, 1).setBackground('#b6d7a8');
}

function fetchTeachers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEACHERS_SHEET) || ss.insertSheet(TEACHERS_SHEET);
  var headers = ['ID PROFESOR', 'NOMBRE', 'CORREO', 'CIUDAD', 'IBAN'];
  setHeaders(sheet, headers);
  var idMap = getIdMap(sheet, 1);

  var unions = firestore.getDocuments('clases_union');
  var ids = {};
  for (var i = 0; i < unions.length; i++) {
    var f = unions[i].fields || {};
    var tid = getString(f.profesorId);
    if (tid) ids[tid] = true;
  }

  var updates = [];
  var appends = [];
  for (var id in ids) {
    var doc = firestore.getDocument('usuarios/' + id);
    var d = doc ? doc.fields : {};
    var row = [
      id,
      (getString(d.nombre) + ' ' + getString(d.apellidos)).trim(),
      getString(d.email),
      getString(d.ciudad),
      getString(d.iban)
    ];
    if (idMap[id]) {
      updates.push({ r: idMap[id], data: row });
    } else {
      appends.push(row);
    }
  }
  updates.forEach(function(u) { sheet.getRange(u.r, 1, 1, headers.length).setValues([u.data]); });
  if (appends.length) sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, headers.length).setValues(appends);
}

function fetchParents() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PARENTS_SHEET) || ss.insertSheet(PARENTS_SHEET);
  var headers = ['ID PADRE', 'NOMBRE', 'CORREO', 'CIUDAD'];
  setHeaders(sheet, headers);
  var idMap = getIdMap(sheet, 1);

  var unions = firestore.getDocuments('clases_union');
  var ids = {};
  for (var i = 0; i < unions.length; i++) {
    var f = unions[i].fields || {};
    var uid = getString(f.alumnoId);
    if (uid) ids[uid] = true;
  }

  var updates = [];
  var appends = [];
  for (var id in ids) {
    var doc = firestore.getDocument('usuarios/' + id);
    var d = doc ? doc.fields : {};
    var row = [
      id,
      (getString(d.nombre) + ' ' + getString(d.apellidos)).trim(),
      getString(d.email),
      getString(d.ciudad)
    ];
    if (idMap[id]) {
      updates.push({ r: idMap[id], data: row });
    } else {
      appends.push(row);
    }
  }
  updates.forEach(function(u) { sheet.getRange(u.r, 1, 1, headers.length).setValues([u.data]); });
  if (appends.length) sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, headers.length).setValues(appends);
}

function fetchStudents() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(STUDENTS_SHEET) || ss.insertSheet(STUDENTS_SHEET);
  var headers = ['ID ALUMNO', 'NOMBRE', 'PADRE', 'CURSO'];
  setHeaders(sheet, headers);
  var idMap = getIdMap(sheet, 1);

  var unions = firestore.getDocuments('clases_union');
  var rowsById = {};
  for (var i = 0; i < unions.length; i++) {
    var f = unions[i].fields || {};
    var sid = getString(f.hijoId);
    if (!sid) sid = getString(f.alumnoId);
    var nombre = getString(f.alumnoNombre);
    var padre = getString(f.padreNombre);
    var curso = '';
    if (sid && !rowsById[sid]) {
      rowsById[sid] = [sid, nombre, padre, curso];
    }
  }
  var updates = [];
  var appends = [];
  for (var id in rowsById) {
    var row = rowsById[id];
    if (idMap[id]) updates.push({ r: idMap[id], data: row });
    else appends.push(row);
  }
  updates.forEach(function(u) { sheet.getRange(u.r, 1, 1, headers.length).setValues([u.data]); });
  if (appends.length) sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, headers.length).setValues(appends);
}

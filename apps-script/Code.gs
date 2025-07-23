const SHEET_NAME = 'CLASES';
const TEACHERS_SHEET = 'PROFESORES';
const STUDENTS_SHEET = 'ALUMNOS';

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.addMenu('Actualizar Datos', [{ name: 'Leer Datos', functionName: 'update' }]);
}

function update() {
  fetchClasses();
  fetchTeachers();
  fetchAlumnos();
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

  sheet.clear();
  setHeaders(sheet, headers);
  formatClassHeaders(sheet);
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
      rows.push(row);
    }
  }
  rows.sort(function(a, b) {
    var da = new Date(a[7]);
    var db = new Date(b[7]);
    return db - da;
  });
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
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

function getMapArray(obj) {
  if (!obj || !obj.arrayValue) return [];
  var vals = obj.arrayValue.values || [];
  return vals.map(function(v) { return v.mapValue ? v.mapValue.fields : {}; });
}

function getValue(obj) {
  if (!obj) return '';
  if (obj.stringValue !== undefined) return obj.stringValue;
  if (obj.integerValue !== undefined) return obj.integerValue;
  if (obj.doubleValue !== undefined) return obj.doubleValue;
  if (obj.booleanValue !== undefined) return obj.booleanValue;
  if (obj.timestampValue !== undefined) return obj.timestampValue;
  if (obj.mapValue || obj.arrayValue) return JSON.stringify(obj);
  return '';
}

function setHeaders(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#bdbdbd');
}


function formatClassHeaders(sheet) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn > 0) {
    sheet.getRange(1, 1, 1, lastColumn).setBackground('#bdbdbd');
  }
}

function fetchTeachers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEACHERS_SHEET) || ss.insertSheet(TEACHERS_SHEET);

  var unions = firestore.getDocuments('clases_union');
  var ids = {};
  for (var i = 0; i < unions.length; i++) {
    var f = unions[i].fields || {};
    var tid = getString(f.profesorId);
    if (tid) ids[tid] = true;
  }

  var teachers = [];
  var allKeys = {};
  for (var id in ids) {
    var doc = firestore.getDocument('usuarios/' + id);
    var d = doc ? doc.fields : {};
    var data = {};
    for (var k in d) {
      data[k] = getValue(d[k]);
      allKeys[k] = true;
    }
    teachers.push({ id: id, data: data });
  }

  var keys = Object.keys(allKeys).sort();
  var headers = ['ID PROFESOR'].concat(keys);

  sheet.clear();
  setHeaders(sheet, headers);

  var rows = teachers.map(function(t) {
    var row = [t.id];
    for (var i = 0; i < keys.length; i++) {
      var val = t.data[keys[i]];
      row.push(val === undefined ? '' : val);
    }
    return row;
  });

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function fetchAlumnos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(STUDENTS_SHEET) || ss.insertSheet(STUDENTS_SHEET);
  var headers = ['ID', 'NOMBRE', 'CORREO', 'CIUDAD', 'CURSO', 'TIPO'];
  sheet.clear();
  setHeaders(sheet, headers);

  var unions = firestore.getDocuments('clases_union');
  var ids = {};
  for (var i = 0; i < unions.length; i++) {
    var f = unions[i].fields || {};
    var uid = getString(f.alumnoId);
    if (uid) ids[uid] = true;
  }

  var rows = [];
  for (var id in ids) {
    var doc = firestore.getDocument('usuarios/' + id);
    var d = doc ? doc.fields : {};
    var fullName = (getString(d.nombre) + ' ' + getString(d.apellidos)).trim();
    var email = getString(d.email);
    var city = getString(d.ciudad);
    var hijos = getMapArray(d.hijos);
    if (hijos.length) {
      rows.push([id, fullName, email, city, '', 'P']);
      for (var j = 0; j < hijos.length; j++) {
        var h = hijos[j];
        rows.push([
          getString(h.id),
          getString(h.nombre),
          '',
          city,
          getString(h.curso),
          'H',
        ]);
      }
    } else {
      rows.push([id, fullName, email, city, getString(d.curso), 'A']);
    }
  }

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

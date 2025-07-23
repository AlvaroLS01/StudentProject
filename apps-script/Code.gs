function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.addMenu('Actualizar Datos', [{ name: 'Leer Datos', functionName: 'update' }]);
}

function update() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Mantener únicamente estas 3 hojas
  ensureOnlySheets(ss, ['clases', 'profesores', 'alumnos']);

  updateClassesSheet(ss);
  updateTeachersSheet(ss);
  updateStudentsSheet(ss);
}

function updateClassesSheet(ss) {
  var sheetName = 'clases';
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
  var sheet = ensureSheet(ss, sheetName, headers);

  var rows = [];

  var unions = firestore.getDocuments('clases_union');
  var teacherCache = {};
  var studentCache = {};
  var classCache = {};

  for (var i = 0; i < unions.length; i++) {
    var u = unions[i];
    var unionId = u.name.split('/').pop();
    var uf = u.fields || {};

    var teacherId = getString(uf.profesorId);
    if (teacherId && !teacherCache[teacherId]) {
      var tdoc = getDocumentSafe('usuarios/' + teacherId);
      teacherCache[teacherId] = tdoc ? tdoc.fields : {};
    }
    var teacher = teacherCache[teacherId] || {};
    var teacherName = getString(uf.profesorNombre) || (getString(teacher.nombre) + ' ' + getString(teacher.apellidos)).trim();
    var teacherEmail = getString(teacher.email);

    var studentId = getString(uf.alumnoId);
    if (studentId && !studentCache[studentId]) {
      var sdoc = getDocumentSafe('usuarios/' + studentId);
      studentCache[studentId] = sdoc ? sdoc.fields : {};
    }
    var student = studentCache[studentId] || {};
    var studentName = getString(uf.padreNombre) || getString(uf.alumnoNombre) || (getString(student.nombre) + ' ' + getString(student.apellidos)).trim();
    var studentEmail = getString(student.email);

    var classId = getString(uf.claseId);
    if (classId && !classCache[classId]) {
      var cdoc = getDocumentSafe('clases/' + classId);
      classCache[classId] = cdoc ? cdoc.fields : {};
    }
    var classData = classCache[classId] || {};
    var curso = getString(classData.curso);
    var asignaturaDefault = getString(classData.asignatura) || (classData.asignaturas ? getArray(classData.asignaturas).join(', ') : '');
    var tipoClase = getString(classData.tipoClase);
    var ciudad = getString(classData.ciudad);

    var assignments = firestore.getDocuments('clases_union/' + unionId + '/clases_asignadas');
    for (var j = 0; j < assignments.length; j++) {
      var a = assignments[j];
      var af = a.fields || {};
      if (getString(af.estado) !== 'aceptada') continue;

      var asignatura = getString(af.asignatura) || asignaturaDefault;
      var fecha = getString(af.fecha);
      var duracion = getString(af.duracion);
      var modalidad = getString(af.modalidad);
      var localizacion = getString(af.localizacion) || ciudad;
      var precioPadres = getNumber(af.precioTotalPadres);
      var precioProfesor = getNumber(af.precioTotalProfesor);
      var beneficio = precioPadres - precioProfesor;
      var assignId = a.name.split('/').pop();

      rows.push([
        assignId,
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
      ]);
    }
  }

  // Ordenar por fecha descendente (más reciente arriba)
  rows.sort(function(a, b) {
    return new Date(b[7]) - new Date(a[7]);
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function updateTeachersSheet(ss) {
  var sheetName = 'profesores';
  var headers = [
    'ID', 'NOMBRE', 'APELLIDOS', 'EMAIL', 'TELEFONO', 'CIUDAD',
    'TIPO DOC', 'NUM DOC', 'SITUACION', 'ESTUDIOS', 'TIEMPO ESTUDIO',
    'TRABAJO', 'IBAN'
  ];
  var sheet = ensureSheet(ss, sheetName, headers);

  var docs = firestore.getDocuments('usuarios');
  var rows = [];
  for (var i = 0; i < docs.length; i++) {
    var f = docs[i].fields || {};
    if (getString(f.rol) !== 'profesor') continue;
    rows.push([
      docs[i].name.split('/').pop(),
      getString(f.nombre),
      getString(f.apellidos) || getString(f.apellido),
      getString(f.email),
      getString(f.telefono),
      getString(f.ciudad),
      getString(f.docType),
      getString(f.docNumber),
      getString(f.status),
      getString(f.studies),
      getString(f.studyTime),
      getString(f.job),
      getString(f.iban)
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function updateStudentsSheet(ss) {
  var sheetName = 'alumnos';
  var headers = [
    'ID', 'TIPO', 'NOMBRE', 'APELLIDOS', 'EMAIL',
    'TELEFONO', 'CIUDAD', 'CURSO', 'FECHA NAC.'
  ];
  var sheet = ensureSheet(ss, sheetName, headers);

  var docs = firestore.getDocuments('usuarios');
  var rows = [];
  var parents = [];
  var students = [];
  for (var i = 0; i < docs.length; i++) {
    var f = docs[i].fields || {};
    var rol = getString(f.rol);
    if (rol === 'padre') parents.push(docs[i]);
    if (rol === 'alumno') students.push(docs[i]);
  }

  for (var i = 0; i < parents.length; i++) {
    var p = parents[i];
    var pf = p.fields || {};
    var parentRow = [
      p.name.split('/').pop(),
      'P',
      getString(pf.nombre),
      getString(pf.apellidos) || getString(pf.apellido),
      getString(pf.email),
      getString(pf.telefono),
      getString(pf.ciudad),
      getString(pf.curso),
      ''
    ];
    rows.push(parentRow);

    var hijos = (pf.hijos && pf.hijos.arrayValue) ? pf.hijos.arrayValue.values : [];
    for (var j = 0; j < hijos.length; j++) {
      var hf = hijos[j].mapValue ? hijos[j].mapValue.fields : {};
      rows.push([
        '',
        'H',
        getString(hf.nombre),
        '',
        '',
        '',
        getString(pf.ciudad),
        getString(hf.curso),
        getString(hf.fechaNacimiento)
      ]);
    }
  }

  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    var sf = s.fields || {};
    rows.push([
      s.name.split('/').pop(),
      'A',
      getString(sf.nombre),
      getString(sf.apellidos) || getString(sf.apellido),
      getString(sf.email),
      getString(sf.telefono),
      getString(sf.ciudad),
      getString(sf.curso),
      getString(sf.fechaNacimiento)
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function ensureSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  } else {
    sheet.clear();
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setBackground('#bdbdbd');
  return sheet;
}

function ensureOnlySheets(ss, names) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (names.indexOf(name) === -1) {
      ss.deleteSheet(sheets[i]);
    }
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

function getDocumentSafe(path) {
  try {
    return firestore.getDocument(path);
  } catch (e) {
    Logger.log('No se encontró el documento ' + path);
    return null;
  }
}

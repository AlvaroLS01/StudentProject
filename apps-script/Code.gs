const SHEET_NAME = 'CLASES';
const TEACHERS_SHEET = 'PROFESORES';
const STUDENTS_SHEET = 'ALUMNOS';
const REGISTRY_SHEET = 'REGISTRO CLASES';

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.addMenu('Actualizar Datos', [{ name: 'Leer Datos', functionName: 'update' }]);
}

function update() {
  fetchClasses();
  fetchRegistroClases();
  fetchTeachers();
  fetchAlumnos();
  enviarCorreosPendientes();
  revisarYEnviarSoloNuevas(TEACHERS_SHEET);
  revisarYEnviarSoloNuevas(STUDENTS_SHEET);
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
    'BENEFICIO',
    'ESTADO'
  ];

  var existingStatus = {};
  var lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    var oldHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idxId = oldHeaders.indexOf('ID DE ASIGNACIÓN');
    var idxStatus = oldHeaders.indexOf('ESTADO');
    if (idxId !== -1 && idxStatus !== -1) {
      var oldRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
      for (var i = 0; i < oldRows.length; i++) {
        var oldId = oldRows[i][idxId];
        var oldSt = oldRows[i][idxStatus];
        if (oldId) existingStatus[oldId] = oldSt;
      }
    }
  }

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
      var t = getDocumentSafe('usuarios/' + teacherId);
      teacherCache[teacherId] = t ? t.fields : {};
    }
    var teacher = teacherCache[teacherId] || {};
    var teacherEmail = getString(teacher.email);
    var teacherName = getString(f.profesorNombre) || (getString(teacher.nombre) + ' ' + getString(teacher.apellidos)).trim();

    var studentId = getString(f.alumnoId);
    if (studentId && !studentCache[studentId]) {
      var s = getDocumentSafe('usuarios/' + studentId);
      studentCache[studentId] = s ? s.fields : {};
    }
    var student = studentCache[studentId] || {};
    var studentEmail = getString(student.email);
    var studentName = getString(f.padreNombre) || getString(f.alumnoNombre) || (getString(student.nombre) + ' ' + getString(student.apellidos)).trim();

    var classId = getString(f.claseId);
    if (classId && !classCache[classId]) {
      var c = getDocumentSafe('clases/' + classId);
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

      var estadoReal = getString(f.estado) || getString(af.estado);
      var savedStatus = existingStatus[a.name.split('/').pop()] || '';
      var status = estadoReal;
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

      if (estadoReal === 'clase_formada') {
        if (savedStatus !== 'CLASE_FORMADA') {
          if (studentEmail.indexOf('@') !== -1) {
            GmailApp.sendEmail(studentEmail, 'Clase confirmada', 'Ya puedes ver tu clase en el panel de Mis Clases');
          }
          status = 'CLASE_FORMADA';
        } else {
          status = savedStatus;
        }
      }

      row.push(status);
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

function enviarCorreosPendientes() {
  revisarYEnviarSoloNuevas('Hoja 1');
}

function revisarYEnviarSoloNuevas(sheetName) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!hoja) {
    Logger.log("No se encontró la hoja '" + sheetName + "'");
    return;
  }

  var headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var idxEstado = headers.indexOf('ESTADO');
  var idxNombre = headers.indexOf('NOMBRE');
  if (idxNombre === -1) idxNombre = headers.indexOf('NOMBRE PROFESOR');
  var idxEmail = headers.indexOf('CORREO');
  if (idxEmail === -1) idxEmail = headers.indexOf('CORREO PROFESOR');
  var idxId = headers.indexOf('ID');
  if (idxId === -1) idxId = headers.indexOf('ID PROFESOR');
  if (idxEstado === -1 || idxEmail === -1 || idxNombre === -1 || idxId === -1) {
    Logger.log('No se encontraron columnas necesarias en ' + sheetName);
    return;
  }

  var totalFilas = hoja.getLastRow() - 1;
  if (totalFilas <= 0) return;
  var datos = hoja.getRange(2, 1, totalFilas, hoja.getLastColumn()).getValues();

  for (var i = 0; i < datos.length; i++) {
    var fila = datos[i];
    var estadoActual = (fila[idxEstado] || '').toString().toUpperCase();
    var filaCompleta = fila.slice(0, idxEstado).every(function(c) { return c !== ''; });
    var numFilaHoja = i + 2;

    if (filaCompleta && estadoActual !== 'ENVIADO') {
      var nombre = fila[idxNombre];
      var email = fila[idxEmail];
      if (email.indexOf('@') !== -1) {
        var asunto = 'Bienvenido a Student Project, ' + nombre;
        var mensaje = 'Gracias por confiar en nosotros. Est\u00e1s en manos de los mejores profesionales.';
        GmailApp.sendEmail(email, asunto, mensaje);
        hoja.getRange(numFilaHoja, idxEstado + 1).setValue('ENVIADO');
        var id = fila[idxId];
        if (id) updateFirestoreStatus('usuarios', id, 'ENVIADO');
        Logger.log('Correo enviado a ' + email + ' desde fila ' + numFilaHoja + ' en ' + sheetName);
      } else {
        Logger.log('Correo inv\u00e1lido en fila ' + numFilaHoja + ' en ' + sheetName);
      }
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

function getMapArray(obj) {
  if (!obj || !obj.arrayValue) return [];
  var vals = obj.arrayValue.values || [];
  return vals.map(function(v) { return v.mapValue ? v.mapValue.fields : {}; });
}

function getDocumentSafe(path) {
  try {
    return firestore.getDocument(path);
  } catch (e) {
    Logger.log('No se encontró el documento ' + path);
    return null;
  }
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

function updateFirestoreStatus(collection, id, status) {
  try {
    firestore.updateDocument(collection + '/' + id, { estado: status });
  } catch (e) {
    Logger.log('Error actualizando Firestore para ' + id + ': ' + e);
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
    var doc = getDocumentSafe('usuarios/' + id);
    var d = doc ? doc.fields : {};
    var data = {};
    for (var k in d) {
      data[k] = getValue(d[k]);
      allKeys[k] = true;
    }
    teachers.push({ id: id, data: data });
  }

  var keys = Object.keys(allKeys).sort();
  var headers = ['ID PROFESOR'].concat(keys).concat(['ESTADO']);

  var existingStatus = {};
  var lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    var oldHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idxId = oldHeaders.indexOf('ID PROFESOR');
    var idxStatus = oldHeaders.indexOf('ESTADO');
    if (idxId !== -1 && idxStatus !== -1) {
      var oldRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
      for (var i = 0; i < oldRows.length; i++) {
        var oldId = oldRows[i][idxId];
        var oldSt = oldRows[i][idxStatus];
        if (oldId) existingStatus[oldId] = oldSt;
      }
    }
  }

  sheet.clear();
  setHeaders(sheet, headers);

  var rows = teachers.map(function(t) {
    var row = [t.id];
    for (var i = 0; i < keys.length; i++) {
      var val = t.data[keys[i]];
      row.push(val === undefined ? '' : val);
    }
    row.push(existingStatus[t.id] || 'PENDIENTE');
    return row;
  });

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function fetchAlumnos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(STUDENTS_SHEET) || ss.insertSheet(STUDENTS_SHEET);
  var headers = ['ID', 'NOMBRE', 'CORREO', 'CIUDAD', 'CURSO', 'TIPO', 'ESTADO'];

  var existingStatus = {};
  var lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    var oldHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idxId = oldHeaders.indexOf('ID');
    var idxStatus = oldHeaders.indexOf('ESTADO');
    if (idxId !== -1 && idxStatus !== -1) {
      var oldRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
      for (var i = 0; i < oldRows.length; i++) {
        var oldId = oldRows[i][idxId];
        var oldSt = oldRows[i][idxStatus];
        if (oldId) existingStatus[oldId] = oldSt;
      }
    }
  }

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
    var doc = getDocumentSafe('usuarios/' + id);
    var d = doc ? doc.fields : {};
    var fullName = (getString(d.nombre) + ' ' + getString(d.apellidos)).trim();
    var email = getString(d.email);
    var city = getString(d.ciudad);
    var hijos = getMapArray(d.hijos);
    if (hijos.length) {
      rows.push([id, fullName, email, city, '', 'P', existingStatus[id] || 'PENDIENTE']);
      for (var j = 0; j < hijos.length; j++) {
        var h = hijos[j];
        var hid = getString(h.id);
        rows.push([
          hid,
          getString(h.nombre),
          '',
          city,
          getString(h.curso),
          'H',
          existingStatus[hid] || 'PENDIENTE'
        ]);
      }
    } else {
      rows.push([id, fullName, email, city, getString(d.curso), 'A', existingStatus[id] || 'PENDIENTE']);
    }
  }

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function fetchRegistroClases() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(REGISTRY_SHEET) || ss.insertSheet(REGISTRY_SHEET);
  var headers = [
    'ID REGISTRO',
    'NOMBRE PROFESOR',
    'CORREO PROFESOR',
    'NOMBRE ALUMNO',
    'CORREO ALUMNO',
    'ESTADO'
  ];

  var existingStatus = {};
  var lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    var oldHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idxId = oldHeaders.indexOf('ID REGISTRO');
    var idxStatus = oldHeaders.indexOf('ESTADO');
    if (idxId !== -1 && idxStatus !== -1) {
      var oldRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
      for (var i = 0; i < oldRows.length; i++) {
        var oldId = oldRows[i][idxId];
        var oldSt = oldRows[i][idxStatus];
        if (oldId) existingStatus[oldId] = oldSt;
      }
    }
  }

  sheet.clear();
  setHeaders(sheet, headers);

  var records = firestore.getDocuments('registro_clases');
  var teacherCache = {};
  var studentCache = {};
  var rows = [];

  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var id = r.name.split('/').pop();
    var f = r.fields || {};

    var teacherId = getString(f.profesorId);
    if (teacherId && !teacherCache[teacherId]) {
      var tdoc = getDocumentSafe('usuarios/' + teacherId);
      teacherCache[teacherId] = tdoc ? tdoc.fields : {};
    }
    var teacher = teacherCache[teacherId] || {};
    var teacherEmail = getString(teacher.email);
    var teacherName = getString(f.profesorNombre) || (getString(teacher.nombre) + ' ' + getString(teacher.apellidos)).trim();

    var studentId = getString(f.alumnoId);
    if (studentId && !studentCache[studentId]) {
      var sdoc = getDocumentSafe('usuarios/' + studentId);
      studentCache[studentId] = sdoc ? sdoc.fields : {};
    }
    var student = studentCache[studentId] || {};
    var studentEmail = getString(student.email);
    var studentName = getString(f.alumnoNombre) || (getString(student.nombre) + ' ' + getString(student.apellidos)).trim();

    var estado = getString(f.estado);
    var status = estado;

    var prev = existingStatus[id];
    if (estado === 'espera_profesor') {
      if (prev !== 'ENVIADO_A_PROFESOR') {
        if (teacherEmail.indexOf('@') !== -1) {
          GmailApp.sendEmail(teacherEmail, 'Nueva solicitud de clase', 'Tienes una nueva solicitud de ' + studentName);
        }
        status = 'ENVIADO_A_PROFESOR';
      } else {
        status = prev;
      }
    } else if (estado === 'espera_alumno') {
      if (prev !== 'ENVIADO_A_ALUMNO') {
        if (studentEmail.indexOf('@') !== -1) {
          GmailApp.sendEmail(studentEmail, 'Tu profesor ha aceptado la clase', 'Confirma tu clase con ' + teacherName);
        }
        status = 'ENVIADO_A_ALUMNO';
      } else {
        status = prev;
      }
    } else if (estado === 'clase_formada') {
      if (prev !== 'CLASE_FORMADA') {
        var destinatarios = [];
        if (studentEmail.indexOf('@') !== -1) destinatarios.push(studentEmail);
        if (destinatarios.length) {
          GmailApp.sendEmail(destinatarios.join(','), 'Clase confirmada', 'Ya puedes ver tu clase en el panel de Mis Clases');
        }
        status = 'CLASE_FORMADA';
      } else {
        status = prev;
      }
    }

    rows.push([id, teacherName, teacherEmail, studentName, studentEmail, status]);
  }

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

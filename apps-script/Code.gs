function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.addMenu('Actualizar Datos', [{ name: 'Leer Datos', functionName: 'update' }]);
}

function update() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = 'REGISTRO DE CLASES';
  var sheet = ss.getSheetByName(sheetName);
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

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, 12).setBackground('#bdbdbd');
    sheet.getRange(1, 13, 1, 3).setBackground('#5b95f9');
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, 12).setBackground('#bdbdbd');
    sheet.getRange(1, 13, 1, 3).setBackground('#5b95f9');
  }

  var existingMap = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      existingMap[ids[i][0]] = i + 2; // row number
    }
  }

  var rowsToAppend = [];

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

      var row = [
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
      ];

      if (existingMap[assignId]) {
        sheet.getRange(existingMap[assignId], 1, 1, row.length).setValues([row]);
      } else {
        rowsToAppend.push(row);
      }
    }
  }

  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length)
      .setValues(rowsToAppend);
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

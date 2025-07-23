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
  var docs = firestore.query('clases_asignadas').where('estado', '==', 'aceptada').execute();
  for (var j = 0; j < docs.length; j++) {
    var d = docs[j];
    var data = d.fields || d;
    var assignId = d.name || d.id;
    var unionId = d.path.split('/')[1];

    var union = firestore.getDocument('clases_union/' + unionId);
    var teacher = firestore.getDocument('usuarios/' + union.profesorId);
    var student = firestore.getDocument('usuarios/' + union.alumnoId);
    var classData = firestore.getDocument('clases/' + union.claseId);

    var row = [
      assignId,
      (union.profesorNombre || (teacher.nombre || '') + ' ' + (teacher.apellidos || '')).trim(),
      teacher.email || '',
      (union.padreNombre || union.alumnoNombre || ((student.nombre || '') + ' ' + (student.apellidos || '')).trim()),
      student.email || '',
      classData.curso || '',
      data.asignatura || classData.asignatura || (classData.asignaturas || []).join(', '),
      data.fecha || '',
      data.duracion || '',
      data.modalidad || '',
      classData.ciudad || '',
      classData.tipoClase || '',
      data.precioTotalPadres || 0,
      data.precioTotalProfesor || 0,
      (data.precioTotalPadres || 0) - (data.precioTotalProfesor || 0)
    ];

    if (existingMap[assignId]) {
      sheet.getRange(existingMap[assignId], 1, 1, row.length).setValues([row]);
    } else {
      rowsToAppend.push(row);
    }
  }

  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length)
         .setValues(rowsToAppend);
  }
}

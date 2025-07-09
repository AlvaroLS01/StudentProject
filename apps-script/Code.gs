// apps-script/Code.gs
// Google Apps Script to log classes to Google Sheets
function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const SECRET = props.getProperty('SECRET');
  const SPREADSHEET_ID = props.getProperty('SPREADSHEET_ID');

  const body = JSON.parse(e.postData.contents);
  if (body.secret !== SECRET) {
    return ContentService.createTextOutput('UNAUTHORIZED');
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
  const ids = sheet.getRange('A:A').getValues().flat();
  const rowIndex = ids.findIndex(id => id === body.idClase);

  const row = [
    body.idClase,
    body.emailProfesor,
    body.nombreProfesor,
    body.emailAlumno,
    body.nombreAlumno,
    body.curso,
    body.asignatura,
    body.ciudad,
    body.fecha,
    body.duracion,
    body.modalidad,
    body.numeroAlumnos,
    body.precioTotalPadres,
    body.precioTotalProfesor,
    body.precioTotalPadres - body.precioTotalProfesor
  ];

  let result = 'APPENDED';
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
    result = 'UPDATED';
  } else {
    sheet.appendRow(row);
  }

  return ContentService.createTextOutput(result);
}

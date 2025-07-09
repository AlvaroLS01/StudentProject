// apps-script/Code.gs
// Google Apps Script to log classes to Google Sheets
function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const SECRET = props.getProperty('SECRET');
  const SPREADSHEET_ID = props.getProperty('SPREADSHEET_ID');

  const body = JSON.parse(e.postData.contents);
  if (body.secret !== SECRET) {
    return ContentService.createTextOutput('UNAUTHORIZED')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
  const lastRow = sheet.getLastRow();
  const ids = lastRow > 0 ? sheet.getRange(1, 1, lastRow, 1).getValues().flat() : [];
  const rowIndex = ids.indexOf(body.idClase);

  const beneficio = Number(body.precioTotalPadres || 0) -
    Number(body.precioTotalProfesor || 0);

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
    Number(body.numeroAlumnos || 0),
    Number(body.precioTotalPadres || 0),
    Number(body.precioTotalProfesor || 0),
    beneficio,
  ];

  let result;
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
    result = 'UPDATED';
  } else {
    sheet.appendRow(row);
    result = 'APPENDED';
  }

  return ContentService.createTextOutput(result)
    .setMimeType(ContentService.MimeType.TEXT);
}

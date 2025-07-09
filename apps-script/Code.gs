// apps-script/Code.gs
// Google Apps Script to log classes to Google Sheets

// obtenemos las props
const SCRIPT_PROPS   = PropertiesService.getScriptProperties();
const SECRET         = SCRIPT_PROPS.getProperty('SECRET');
const SPREADSHEET_ID = SCRIPT_PROPS.getProperty('SPREADSHEET_ID');
const SHEET_NAME     = SCRIPT_PROPS.getProperty('SHEET_NAME'); // opcional

function doPost(e) {
  // 1) datos recibidos?
  if (!e.postData || !e.postData.contents) {
    return ContentService
      .createTextOutput('NO_DATA')
      .setMimeType(ContentService.MimeType.TEXT);
  }
  const body = JSON.parse(e.postData.contents);

  // 2) validamos secreto
  if (body.secret !== SECRET) {
    return ContentService
      .createTextOutput('UNAUTHORIZED')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  // 3) abrimos la hoja
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = SHEET_NAME
    ? ss.getSheetByName(SHEET_NAME)
    : ss.getActiveSheet();

  // 4) preparamos la fila
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
    Number(
      body.beneficio != null
        ? body.beneficio
        : ((body.precioTotalPadres || 0) - (body.precioTotalProfesor || 0))
    ),
  ];

  // 5) añadimos al final
  sheet.appendRow(row);

  return ContentService
    .createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

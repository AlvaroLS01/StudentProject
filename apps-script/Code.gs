const hojaRegistros = 'Registros';

function onOpen() {
    // La función onOpen se ejecuta automáticamente cada vez que se carga un Libro de cálculo
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var menuEntries = [];
 
    menuEntries.push({
        name : "Leer Datos",
        functionName : "update"
    });
  
    menuEntries.push(null);
  
    ss.addMenu("Actualizar Datos", menuEntries);
}

function update() {  
  getFireStore();

}

function writeInSpreadSheet(data, current_sheet) {
  var numRows = data.length;
  if (numRows > 0) {
    var numCols = data[0].length;
	
	  var Avals = current_sheet.getRange("B1:B").getValues();
	  var last_row = Avals.filter(String).length;
	  last_row++;
    current_sheet.getRange(last_row, 1, numRows, numCols).setValues(data);
  }
}


function getFireStore() {

 var ss = SpreadsheetApp.getActiveSpreadsheet();
 var sheet = ss.getSheetByName(hojaRegistros);
 const allDocuments = firestore.getDocuments("registros");

 var data = [];

 // for each column and row in the document selected
 for(var i = 0; i < allDocuments.length; i++){

  var document_key = allDocuments[i].name.split("/").pop();
  var nombre = allDocuments[i].fields["nombre"].stringValue;
  //var agregado = new Date(allDocuments[i].fields["agregado"].timestampValue).toISOString();

  data.push([
    document_key,
    nombre,
    //agregado,
  ]);

 }

 if (data.length > 0) {  
  // write to ss    
  writeInSpreadSheet(data, sheet);
 }

}
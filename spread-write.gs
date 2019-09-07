function logAttendance(patrol) {
  
  var scriptProperties = PropertiesService.getScriptProperties();
  
  var ss = SpreadsheetApp.openById(scriptProperties.getProperty("writeSheetId"));
  var sheet = ss.getSheetByName("Attendance ACTIVE");
  var pointsSheet = ss.getSheetByName("Patrol Points ACTIVE");
    
  var currentTime = new Date();
  var dateColumn;
  
  // Whe
  if ((currentTime.getTime() - scriptProperties.getProperty("lastLogExecute")) > 5 * 1000 * 60 || sheet.getLastColumn() < 5) {
    dateColumn = sheet.getRange(1, sheet.getLastColumn() + 1);
    dateColumn.setValue(currentTime);
  } else {
    dateColumn = sheet.getRange(1, sheet.getLastColumn());
  }
  
  scriptProperties.setProperty("lastLogExecute", currentTime.getTime());
  
  var pointsNames = pointsSheet.getRange(1, 1, pointsSheet.getLastRow(), 2).getValues();
  var names = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();
  
  for (var i = 0; i < pointsNames.length; i++) {
    if (pointsNames[i][0] == patrol.Name) {
      console.log(pointsNames[i][0] + " == " + patrol.Name);
      patrol.Row = i + 1;
      console.log(patrol.Row);
    }
  }
  
  // If this patrol name has not yet been registered, a new row needs to be created
  if (patrol.Row == undefined) {
    // Add to first available row
    patrol.Row = pointsSheet.getLastRow() + 1;
    var writeRange = pointsSheet.getRange(patrol.Row, 1, 1, 3);
    writeRange.setValues([[patrol.Name, "", ""]]);
    // Create the formula for the addition of the points to determine the total points for the patrol
    writeRange.getCell(1, 3).setFormulaR1C1("=SUM(R[0]C[1]:R[0])/2").setNumberFormat("0");
    writeRange.setFontWeight("bold");
  }
  
  var rowIterator = patrol.Row;
  var groupUpdate = false;
  
  for (var i = 0; i < patrol.Members.length; i++) {
    var member = patrol.Members[i];
    var memberExists = false;
    for (var a = 0; a < names.length; a++) {
      if (names[a][0] == member.firstName && names[a][1] == member.lastName) {
        memberExists = true;
        member.Row = a + 1;
      }
    }
    if (!memberExists) {
      var emptyRow = sheet.getLastRow() + 1;
      var writeRange = sheet.getRange(emptyRow, 1, 1, 4);
      writeRange.setValues([[member.firstName, member.lastName, patrol.Name, member.Rank]]);
      member.Row = emptyRow;
      
      groupUpdate = true;
      
      pointsSheet.insertRowAfter(rowIterator);
      writeRange = pointsSheet.getRange(rowIterator + 1, 1, 1, 2);
      writeRange.setValues([[member.firstName, member.lastName]]);
      writeRange.setFontWeight("normal");
      
      rowIterator++;
    }

    var attendanceField = sheet.getRange(member.Row, dateColumn.getColumn());
    var checkbox = SpreadsheetApp.newDataValidation()
        .requireCheckbox()
        .build();
    attendanceField.setDataValidation(checkbox);
    attendanceField.setValue(member.Attendance != "Present" ? "FALSE" : "TRUE");
    
  }
  
  if (groupUpdate) {
    var patrolRange = pointsSheet.getRange(patrol.Row + 1, 1, patrol.Members.length, 1);
    patrolRange.shiftRowGroupDepth(-1);
    patrolRange.shiftRowGroupDepth(1);
  } 
    
}
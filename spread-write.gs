var scriptProperties = PropertiesService.getScriptProperties();

function logAttendance(patrol) {
  
  var ss = SpreadsheetApp.openById("1_f4DeuWWqAvz_z8L-jDk2kPsvqoqEBEylIODvG4abuI");
  var sheet = ss.getSheetByName("Attendance ACTIVE");
  var pointsSheet = ss.getSheetByName("Patrol Points ACTIVE");
  // Passing only two arguments returns a "range" with a single cell.
  
  
  
  var currentTime = new Date();
  var dateColumn;
  
  console.log((currentTime.getTime() - scriptProperties.getProperty("lastLogExecute")) / 1000);
  
  if ((currentTime.getTime() - scriptProperties.getProperty("lastLogExecute")) > 5 * 1000 * 60) {
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
  
  if (patrol.Row == undefined) {
    patrol.Row = pointsSheet.getLastRow() + 1;
    var writeRange = pointsSheet.getRange(patrol.Row, 1, 1, 1);
    writeRange.setValue(patrol.Name);
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




function foo() {
  var str;
  
  if (str === undefined) {
    Logger.log("true");
  } else {
    Logger.log("false");
  }
  
  var ss = SpreadsheetApp.openById("1_f4DeuWWqAvz_z8L-jDk2kPsvqoqEBEylIODvG4abuI");
  var sheet = ss.getSheetByName("Attendance ACTIVE");
  var pointsSheet = ss.getSheetByName("Patrol Points ACTIVE");
  
  var writeRange = pointsSheet.getRange("35:40");
  writeRange.shiftRowGroupDepth(1);

  // pointsSheet.insertRowAfter(16);
  
  
}
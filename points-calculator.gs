function onGradingFormSubmit(e) {
  
  var nameArray;
  var memberArray;
  
  var form = e.source;
  // The form's title does not specify the patrol name, only the FILE name includes the patrol
  var formFileName = DriveApp.getFileById(form.getId()).getName();
  // File name takes the form "swifts-patrol" for example
  var patrolName = formFileName.split(/-/)[0];
  var patrolRow;
    
  var responses = e.response.getItemResponses();
  var formItems = form.getItems();
  
  // Spreadsheet where all data is stored
  var logsSpread = SpreadsheetApp.openById(scriptProperties.getProperty("writeSheetId"));

  
  var attendanceSheet = logsSpread.getSheetByName("Attendance ACTIVE");
  var registerLength = attendanceSheet.getDataRange().getNumRows() - 1;
  
  // Read the names on the sheet, which is updated via the attendance form
  var register = attendanceSheet.getRange(2, 1, registerLength, 2).getValues();
  // Get the most up to date attendance record
  var attendance = attendanceSheet.getRange(2, attendanceSheet.getLastColumn(), registerLength, 1).getValues();  
  
  var pointsSheet = logsSpread.getSheetByName("Patrol Points ACTIVE");
  var pointsActiveRange = pointsSheet.getDataRange();
  
  var pointsNameRegister = pointsSheet.getRange(2, 1, pointsActiveRange.getNumRows() - 1, 2).getValues();
    
  // Iterate through the form itself, not the response
  // The response does not include all items
  for (var i = 0; i < formItems.length; i++) {
    var item = formItems[i];
    // Identify the item which conveniently holds each patrol member's name.
    if (item.getTitle() == "Additional points") {
      // Validation, so we can be certain to treat it as a checkbox grid item.
      if (item.getType() == "CHECKBOX_GRID") {
        item = item.asCheckboxGridItem();
        // Returns everyone in patrol
        nameArray = item.getRows();
      }
    }
  }
  
  for (var i = 0; i < pointsNameRegister.length; i++) {
    if (pointsNameRegister[i][0].toLowerCase() == patrolName) {
      patrolRow = i;
    }
  }
  
  // We will use an object to store patrol members, as we can access
  // their information by name rather than iterating through an array
  var patrolMembers = {};
  
  // Create an object for each member of the patrol, with a key value so we can
  // reference it directly.
  for (var i = 0; i < nameArray.length; i++) {
    
    var name = nameArray[i];
    var memberExistsInSheet = false;
    
    // Key value = name
    patrolMembers[name] = {
      name: name,
      uniformGraded: false,
      additional: 0
    };
    
    for (var j = 0; j < register.length; j++) {
      // Since EVERY member is on the register, we need to ensure that we only
      // pick up who is in the patrol.
      if (register[j].join(" ") == name) {
        // Position on the register array indicates which ROW the member is located on the attendance spreadsheet
        patrolMembers[name].position = j;
      }
    }
    
    for (j = patrolRow + 1, f = 0; f < nameArray.length; j++, f++) {
      if (pointsNameRegister[j].join(" ") == name) {
        patrolMembers[name].pointsPosition = j;
      }
    }
  }
  
  var additionalAccumulative = 0;
  var uniformAccumulative = 0;
  var attendanceAccumulative = 0;
  
  // Process results
  for (var i = 0; i < responses.length; i++) {
    var response = responses[i];
    var title = response.getItem().getTitle();
    if (response.getItem().getType() == "CHECKBOX_GRID") {

      // Not perfect, but we can identify a name by there being 2 or more capitalised words and
      // less than or equal to 2 uncapitalised words (van der Bosch) 
      var upperCaseWords = title.match(/([A-Z])\w+/g);
      var lowerCaseWords = title.match(/\b[a-z]+\b/g);
      // Form questions which contain uniform data are titled with the member's name.
      if (upperCaseWords && upperCaseWords.length >= 2 && (!lowerCaseWords ? true : lowerCaseWords.length <= 2)) {
       
        var member = patrolMembers[title];
        
        // Returns an array.
        var uniform = response.getResponse();
        // Length of list indicates how many uniform items there are to grade.
        var uniformItems = uniform.length;
        
        var uniformPercent = 1;
        
        for (var j = 0; j < uniform.length; j++) {
          if (uniform[j] != null) {
            if (uniform[j][0] == "Missing") {
              uniformPercent -= 1 / uniformItems;
            } else {
              uniformPercent -= (1 / uniformItems) / 2;
            }
          }
        }
        
        // Avoid writing to the spreadsheet in decimal points.
        if (uniformPercent * 100 < 1) {
          uniformPercent = 0;
        } else {
          uniformPercent = Math.round(uniformPercent * 10000) / 10000;
        }
        
        uniformAccumulative += uniformPercent;
                
        member.uniform = uniformPercent;
        member.uniformGraded = true;
                
      } else if (title == "Additional points") {
        
        var responseArray = response.getResponse();
        var responseRows = response.getItem().asCheckboxGridItem().getRows();

        for (var j = 0; j < responseArray.length; j++) {
          if (responseArray[j] != null) {
            for (var f = 0; f < responseArray[j].length; f++) {
              var pointsDue = 0;
              if (responseArray[j][f] == "Friday Night Attendance") {
                pointsDue = 15;
              } else if (responseArray[j][f] == "Badge Awarded" || responseArray[j][f] == "Badge Awarded (2)") {
                pointsDue = 40;
              } else if (responseArray[j][f] == "Camp Attendance") {
                pointsDue = 60;
              }
              patrolMembers[responseRows[j]].additional += pointsDue;
              additionalAccumulative += pointsDue;
            }
          }
        }
      }
      
    } else if (title == "How would you rate the troop's conduct prior to and during inspection/flag break?") {
      additionalAccumulative += ((+response.getResponse() - 1) / 4) * 30;
    }
  }
  
  for (var key in patrolMembers) {
    if (patrolMembers.hasOwnProperty(key)) {
      // Check if member is present.
      if (attendance[patrolMembers[key].position] == "true") {
        patrolMembers[key].present = 1;
        attendanceAccumulative += 1;
      // Absence also means the member is unable to accumulate points for uniform.
      } else {
        patrolMembers[key].present = 0;
        patrolMembers[key].uniform = 0;
      }
      // If we didn't have to process any issues with uniform, we can deduce that
      // the member's uniform was perfect.
      if (patrolMembers[key].uniformGraded == false && patrolMembers[key].present == 1) {
        patrolMembers[key].uniform = 1;
        uniformAccumulative += 1;
      }
    }
  }
  
  var attendanceTotal = (attendanceAccumulative / nameArray.length) * 50;
  // sum of uniform grade / present * 100
  var uniformTotal = (uniformAccumulative / attendanceAccumulative) * 100;
    
  var pointsWriteColumn = pointsActiveRange.getLastColumn();
  
  var scriptProperties = PropertiesService.getScriptProperties();
  var lastExecution = scriptProperties.getProperty("lastExecution");
  
  var now = new Date();
  
  if (pointsWriteColumn < 3 || (now.getTime() - lastExecution) > 2 * 1000 * 60 * 60 || lastExecution == null) {
    
    pointsWriteColumn += 1;
    
    // Formatting and grouping for spreadsheet readability.
    var writeRange = pointsSheet.getRange(1, pointsWriteColumn, 1, 5);
    writeRange.setValues([[new Date(), "Attendance", "Uniform", "Additional", "Meeting"]]);
    writeRange.setFontWeights([["bold", "normal", "normal", "normal", "normal"]]);
    writeRange.shiftColumnGroupDepth(-1);
    
    writeRange = pointsSheet.getRange(1, pointsWriteColumn + 1, 1, 4);
    writeRange.shiftColumnGroupDepth(1);
    
    scriptProperties.setProperty("lastDateRow", pointsWriteColumn);
    scriptProperties.setProperty("lastExecution", now.getTime());
  }
  
  pointsWriteColumn = +scriptProperties.getProperty("lastDateRow");
  
  // Write the resultant points to the spreadsheet.
  var writeRange = pointsSheet.getRange(patrolRow + 2, pointsWriteColumn, 1, 4);
  writeRange.setValues([["", attendanceTotal, uniformTotal, additionalAccumulative]]);
  writeRange.setNumberFormat("0");
  
  // Calculate the total points for the member.
  writeRange = writeRange.getCell(1, 1);
  writeRange.setFormulaR1C1("=SUM(R[0]C[1]:R[0]C[4])");
  
  for (var key in patrolMembers) {
    if (patrolMembers.hasOwnProperty(key)) {
      
      var member = patrolMembers[key]
      
      // Create spreadsheet functions to calculate patrol totals, to allow for points to be altered
      // post script processing—instead of the code applying the final arithmatic, we'll get the spreadsheet to handle this.
      var writeRange = pointsSheet.getRange(member.pointsPosition + 2, pointsWriteColumn, 1, 4);
      writeRange.setFormulasR1C1([[
        "=SUM(R[0]C[1]:R[0]C[4])",
        "=(R["+ (patrolRow - member.pointsPosition) +"]C[0] * (" + member.present + "/" + attendanceAccumulative + "))",
        "=(R["+ (patrolRow - member.pointsPosition) +"]C[0] * (" + member.uniform + "/" + uniformAccumulative + "))",
        "=(" + member.additional + ")"
      ]]);
      writeRange.setNumberFormat("0");
    }
  }
}
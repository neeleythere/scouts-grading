var scriptProperties = PropertiesService.getScriptProperties();

function Patrol(name, members) {  
  this.Name = name;
  this.Members = members;
  this.memberNameArray = [];
  
  for (var i = 0; i < members.length; i++) {
    this.memberNameArray[i] = members[i].fullName;
  }
  
}

function Member(name, attendance) {
  var nameArray = name.split(/(APL|PL)\W/);
  // console.log("Member init: " + nameArray);
  if (nameArray.length > 1) {
    this.Rank = nameArray[1];
    this.fullName = nameArray[2];
  } else {
    this.Rank = "";
    this.fullName = nameArray[0];
  }
  this.firstName = this.fullName.split(" ").slice(0, 1).join(" ");
  this.lastName = this.fullName.split(" ").slice(1).join(" ");
  this.Attendance = attendance;
}

function removeFormItems(form) {
  var formItems = form.getItems();
  for (var i = 0; i < formItems.length; i++) {
    var item = formItems[i];
    form.deleteItem(item);
  }
}

function createPatrolForm(formId, patrol) {
  
  var dynamicForm = FormApp.openById(formId);
    
  removeFormItems(dynamicForm);

  var attendanceStr = "Based on your previous entry, attendance of patrol is as follows: \n";
  
  var attendanceHeader = dynamicForm.addSectionHeaderItem()
      .setTitle("Attendance");
  dynamicForm.addSectionHeaderItem()
      .setTitle("Uniform")
      .setHelpText('Look out for: \nTop button undone, \nOff colour shoes, \nMissing badges, \nPoorly rolled neckerchief. \n\nA missing badge denotes a "Poor" under "Badges & Shirt". ' +
                   'Unless of course, EVERY badge is missing or the shirt is not worn. \n\nLeave field empty if there are no infractions.');
    
  for (var i = 0; i < patrol.Members.length; i++) {
    var member = patrol.Members[i];
    if (member.Attendance == "Present") {
      dynamicForm.addCheckboxGridItem()
          .setTitle(member.fullName)
          .setRequired(false)
          .setColumns(["Missing", "Poor"])
          .setRows(["Beret", "Badges & Shirt", "Neckerchief", "Belt", "Trousers", "Shoes"]);
    }
    if (member.Attendance == null) {
      member.Attendance = "Absent";
    }    
    var attendance = member.Attendance != "Present" ? member.Attendance.toUpperCase() : member.Attendance;
    attendanceStr = attendanceStr + "\n" + (member.Rank ? member.Rank + " " + member.fullName : member.fullName) + " " + attendance;
  }
  
  attendanceHeader.setHelpText(attendanceStr);
  
  dynamicForm.addSectionHeaderItem()
      .setTitle("Miscellaneous");
  dynamicForm.addScaleItem()
      .setTitle("How would you rate the troop's conduct prior to and during inspection/flag break?")
      .setHelpText("Factors to consider include standing still during flag break, patrol following the PLs call to attention, standing at ease/attention at the correct times, " +
                   "talking during flag break/inspection etc etc.")
      .setRequired(true)
      .setLabels("Poor", "Excellent")
  dynamicForm.addCheckboxGridItem()
      .setTitle("Additional points")
      .setColumns(["Friday Night Attendance", "Badge Awarded", "Badge Awarded (2)", "Camp Attendance"])
      .setRows(patrol.memberNameArray)
      

}


/**
 * A trigger-driven function that reads from the hierarchical parent form and
 * adjusts the patrol grading form based on attendance.
 *
 @param {Object} e The event parameter for a form submission;
 *                 see https://developers.google.com/apps-script/understanding_events
 */
function onFormSubmit(e) {
  
  var responses = e.response.getItemResponses();
  
  // an array of each of the items within the form, including titles
  var formItems = e.source.getItems();
  
  for (var i = 0; i < responses.length; i++) {
    var responseItem = responses[i];
    var item = responseItem.getItem();
   
    
    // The field which collects attendance data will meet the following criteria.
    if (item.getType() == "GRID") {
      // go back one position to find the associative title
      var prevItem = formItems[item.getIndex()-1];
      if (prevItem != null) {
        // Ensure it is in fact the required title
        if (prevItem.getType() == "SECTION_HEADER") {
          
          // The previous item indicates the name of the patrol.
          var patrolName = prevItem.getTitle();
          
          // Specify the type to apply correct methods
          item = item.asGridItem();
          
          // A row is associated to a name.
          var patrolMembers = item.getRows();
          // The attendance is the response itself.
          var attendance = responseItem.getResponse();
          
          var patrolMembersObj = new Array();
          
          for (var f = 0; f < patrolMembers.length; f++) {
            // Include the name and the attendance, deriving from row & response.
            var patrolMember = new Member(patrolMembers[f], attendance[f]);
            patrolMembersObj[f] = patrolMember;
          }
          
          var patrol = new Patrol(patrolName, patrolMembersObj);
          var patrolForm = scriptProperties.getProperty(patrolName.toLowerCase() + "FormId");
          
          createPatrolForm(patrolForm, patrol);
          
          logAttendance(patrol);
        }
      }
    }
  }
  
}
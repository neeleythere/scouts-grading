// PREREQUISITE TO FUNCTIONALITY

var scriptProperties = PropertiesService.getScriptProperties();

/**
 * Establishes the link between master form and the script.
 */
function triggerSetUp() {
  if (!(scriptProperties.getProperty("writeSheetId"))) {
    throw new Error("writeSheetId is not defined in script properties.");
  }
  var formId = scriptProperties.getProperty("masterFormId");
  if (formId) {
    ScriptApp.newTrigger("onFormSubmit")
        .forForm(formId)
        .onFormSubmit()
        .create();
  } else {
    throw new Error("masterFormId is not defined in script properties.");
  }
}


/**
 * Patrol within the scout group, typically comprised of members.
 *
 * @constructor
 * @param {string} name Name of patrol.
 * @param {array} members Array in which member objects are contained.
 *
 * @param {array} memberNameArray Names of each member.
 *                        
 */
function Patrol(name, members) {  
  this.Name = name;
  this.Members = members;
  this.memberNameArray = [];
  
  for (var i = 0; i < members.length; i++) {
    this.memberNameArray[i] = members[i].fullName;
  }
  
}


/**
 * Member of the scout group.
 *
 * @constructor
 * @param {string} name Full name, prefaced by rank.
 * @param {string} attendance Attendance of member.
 *
 * @param {string} Rank Rank of member, empty string if no rank held.
 * @param {string} firstName First name of member.
 * @param {string} lastName Last name of member
 *                        
 */
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


/**
 * Removes all existing form items.
 *
 * @param {Object} form Form of which to remove all content.
 *                      see https://developers.google.com/apps-script/reference/forms/form
 */
function removeFormItems(form) {
  var formItems = form.getItems();
  for (var i = 0; i < formItems.length; i++) {
    var item = formItems[i];
    form.deleteItem(item);
  }
}

/**
 * Creates trigger which invokes function "onGradingFormSubmit" upon the specified form 
 * being submitted.
 *
 * @param {Object} form Form to watch for submissions.
 *                      see https://developers.google.com/apps-script/reference/forms/form
 */
function createFormTrigger(form) {
  ScriptApp.newTrigger("onGradingFormSubmit")
      .forForm(form)
      .onFormSubmit()
      .create(); 
}

/**
 * Sets the content of the patrol grading form based on data derived from the master form.
 *
 * @param {string} formId Unique identifier for patrol form to load in.
 * @param {Object} patrol Determine members' names, rank, & attendance.
 */
function createPatrolForm(formId, patrol) {
  
  var dynamicForm = FormApp.openById(formId);
  
  removeFormItems(dynamicForm);
  
  dynamicForm.setTitle(patrol.Name + " Patrol Grading");
  
  // This part of the text isn't recursive, so we're keeping it out of the loop
  var attendanceStr = "Based on your previous entry, attendance of patrol is as follows: \n";
  
  var attendanceHeader = dynamicForm.addSectionHeaderItem()
      .setTitle("Attendance");
  dynamicForm.addSectionHeaderItem()
      .setTitle("Uniform")
      .setHelpText('Look out for: \nTop button undone, \nOff colour shoes, \nMissing badges, \nPoorly rolled neckerchief. \n\nA missing badge denotes a "Poor" under "Badges & Shirt". ' +
                   'Unless of course, EVERY badge is missing or the shirt is not worn. \n\nLeave field empty if there are no infractions.');
  
  // Iterate through each member of the patrol
  for (var i = 0; i < patrol.Members.length; i++) {
    var member = patrol.Members[i];
    // Only grade uniform if present, there's no value in cluttering 
    // the form if the member isn't present to have their uniform graded.
    if (member.Attendance == "Present") {
      dynamicForm.addCheckboxGridItem()
          .setTitle(member.fullName)
          .setRequired(false)
          .setColumns(["Missing", "Poor"])
          .setRows(["Beret", "Badges & Shirt", "Neckerchief", "Belt", "Trousers", "Shoes"]);
    }
    // Attendance not being completed is the equivalent of being absent
    if (member.Attendance == null) {
      member.Attendance = "Absent";
    }
    // Bring attention to those who are not present by CAPITALISING
    var attendance = member.Attendance != "Present" ? member.Attendance.toUpperCase() : member.Attendance;
    // Use a tenary operator to selectively include the rank in the string, only if it exists
    attendanceStr = attendanceStr + "\n" + (member.Rank ? member.Rank + " " + member.fullName : member.fullName) + " " + attendance;
  }
  
  attendanceHeader.setHelpText(attendanceStr);
  
  // Additional points to be completed
  dynamicForm.addSectionHeaderItem()
      .setTitle("Miscellaneous");
  dynamicForm.addScaleItem()
      .setTitle("How would you rate the troop's conduct prior to and during inspection/flag break?")
      .setHelpText("Factors to consider include standing still during flag break, patrol following the PLs call to attention, standing at ease/attention at the correct times, " +
                   "talking during flag break/inspection etc etc.")
      .setRequired(true)
      .setLabels("Poor", "Excellent");
  dynamicForm.addCheckboxGridItem()
      .setTitle("Additional points")
      .setColumns(["Friday Night Attendance", "Badge Awarded", "Badge Awarded (2)", "Camp Attendance"])
      .setRows(patrol.memberNameArray);
      
  // Ensure that grading responses are captured once completed and submitted
  var activeTriggers = ScriptApp.getUserTriggers(dynamicForm);
  if (activeTriggers.length == 0) {
    createFormTrigger(dynamicForm);
  }
  
}


/**
 * A trigger-driven function that handles responses from the master form.
 *
 * @param {Object} e The event parameter for a form submission;
 *                   see https://developers.google.com/apps-script/understanding_events
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
          
          if (patrolForm == null) {
            console.log("Patrol form does not yet exist");
            // Creates a new form, location defaults to My Drive
            var newFormId = FormApp.create(patrolName.toLowerCase()+"-entry").getId();
            var newForm = DriveApp.getFileById(newFormId);
            // Fetch the master form so we can read applicable details
            var sourceId = e.source.getId();
            var folders = DriveApp.getFileById(sourceId).getParents();
            
            // Although rare, the same file can sometimes be found in more than one location
            if (folders.hasNext()) {
              // Place the new form in the same folder as the master form
              var folder = folders.next();
              folder.addFile(newForm);
              // Now we can remove the file from My Drive
              DriveApp.removeFile(newForm);
              // For convenience and to avoid cluttering Drive, restrict the placement of the file to one location
              // Best to tell someone though.
              if (folders.hasNext()) {
                console.warn("Master form present in multiple folders, patrol form placed in first occurence: " + folder.getName() + "with id " + folder.getId());
              }
            } else {
              // If we can't find a location for the master form, the new form will default to My Drive
              // and since we didn't remove it, you'll still find it there
              throw new Error("Master form does not have a valid parent: patrol form placed in root My Drive");
            }
            
            scriptProperties.setProperty(patrolName.toLowerCase() + "FormId", newFormId)
            patrolForm = newFormId;
          }
          
          createPatrolForm(patrolForm, patrol);
          
          logAttendance(patrol);
        }
      }
    }
  }
}
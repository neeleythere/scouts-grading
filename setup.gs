/** PREREQUISITE TO FUNCTIONALITY
 * 
 *  1) Ensure "writeSheetId" & "masterFormId" is defined in
 *     File > Project properties > Script properties
 *  2) Run > Run function > triggerSetUp
 *  3) Grant necessary permissions for program to run.
 *
 */

var scriptProperties = PropertiesService.getScriptProperties();

/**
 * Establishes the link between the master form and this script.
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
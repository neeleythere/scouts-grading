# Scout Grading

Designed to minimise the administration that accompanies running a scout troop.

Utilises Google [forms](https://forms.google.com) & [sheets](https://sheets.google.com) to allow for simple, UI based modification and customisation.

Written in Google Apps Script, a JavaScript platform in the cloud.

Learn more: https://developers.google.com/apps-script


### Functionality

* Collect attendance data
* Assess uniform & other gradeable factors
* Calculate and award points
* Display results in an easy to read format

## Workflow

<p align="left">
  <img src="images/flowchart.png" align="middle" height="800px"/>
</p>

## Demo

All data is read from the master form as entered below. Upon submission, the necessary data ecosystem is generated by `form-manager.gs`—handling additions, removals & edits to the register.

![forms](images/form-demo-2x.gif)

These operations execute concurrently upon submission of the master form:
* Attendance is logged to the associated spreadsheet.
  - If necessary, a row is created for the member.
* Contents of the patrol specific form is generated to reflect the most recent register & the member's attendance.
<p>
  <img src="images/sheets-data.gif" width="49%" float="left" />
  <img src="images/form-creation.gif" width="49%" float="right" /> 
</p>



## Google APIs

<img
src="https://www.gstatic.com/images/branding/product/2x/admin_96dp.png"
align="left"
width="96px"/>
### AdminSDK
- [Manage domains and apps](adminSDK)
<br><br>

<img
src="https://www.gstatic.com/images/branding/product/2x/google_cloud_96dp.png"
align="left"
width="96px"/>
### Advanced Services
- [Access Google APIs via Advanced Google services](advanced/)
<br><br>


## Clone using the `clasp` command line tool

Learn how to clone, pull, and push Apps Script projects on the command line
using [clasp](https://developers.google.com/apps-script/guides/clasp).

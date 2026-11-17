/**
 * GRS Coaching — website enquiry receiver.
 *
 * Paste this into the Apps Script editor of the "GRS" Google Sheet
 * (Extensions > Apps Script), then Deploy > New deployment > Web app:
 *   Execute as: Me    Who has access: Anyone
 * Copy the Web app URL into contact.html (data-endpoint on the form).
 *
 * Each submission is added as a new row on the "Enquiries" tab, and a short
 * notification email is sent to NOTIFY_EMAIL (set it to "" to turn emails off).
 */

var SPREADSHEET_ID = "14XGwyv_ZvCiJitAZei-GWgYqLjcDzWx4dat8PkhXD9g";
var SHEET_NAME = "Enquiries";
var NOTIFY_EMAIL = "grsherling@gmail.com";

var FIELDS = ["name", "email", "phone", "role", "linkedin", "interest", "message", "traffic_source"];
var MAX_LEN = 5000;

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot: real visitors never tick the hidden "botcheck" box.
  if (p.botcheck) return json_({ success: true });

  if (!p.name || !p.email || !p.message) {
    return json_({ success: false, message: "Missing required fields." });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    var row = [new Date()].concat(FIELDS.map(function (f) { return clean_(p[f]); }));
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: clean_(p.email),
        subject: "New website enquiry from " + clean_(p.name),
        body:
          "Name: " + clean_(p.name) + "\n" +
          "Email: " + clean_(p.email) + "\n" +
          "Phone: " + clean_(p.phone) + "\n" +
          "Role & company: " + clean_(p.role) + "\n" +
          "LinkedIn: " + clean_(p.linkedin) + "\n" +
          "Interested in: " + clean_(p.interest) + "\n" +
          "Traffic source: " + clean_(p.traffic_source) + "\n\n" +
          clean_(p.message) + "\n\n" +
          "All enquiries: " + "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/edit"
      });
    } catch (err) {
      // The row is already saved; a failed email shouldn't fail the submission.
    }
  }

  return json_({ success: true });
}

// Lets you open the web app URL in a browser to check it's deployed.
function doGet() {
  return json_({ ok: true, service: "GRS Coaching enquiries" });
}

// Trims, limits length, and stops text like "=HYPERLINK(...)" being run as a formula.
function clean_(v) {
  v = String(v == null ? "" : v).trim().slice(0, MAX_LEN);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

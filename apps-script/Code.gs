/**
 * GRS Coaching — website enquiry receiver.
 *
 * Paste this into the Apps Script editor of the "GRS" Google Sheet
 * (Extensions > Apps Script), then Deploy > New deployment > Web app:
 *   Execute as: Me    Who has access: Anyone
 * Copy the Web app URL into contact.html (data-endpoint on the form).
 *
 * Settings live in Project Settings > Script Properties (not in this file,
 * which is public on GitHub):
 *   NOTIFY_EMAIL      address that gets a notification per enquiry (leave unset for none)
 *   TURNSTILE_SECRET  Cloudflare Turnstile secret key (optional; when set, every
 *                     submission must carry a valid Turnstile token)
 *
 * Each submission is added as a new row on the "Enquiries" tab of the sheet this
 * script is attached to.
 */

var SHEET_NAME = "Enquiries";

// Per-field length limits; anything longer is cut.
var LIMITS = {
  name: 200, email: 254, phone: 50, role: 200, linkedin: 500,
  interest: 100, message: 5000, traffic_source: 200
};
var FIELDS = ["name", "email", "phone", "role", "linkedin", "interest", "message", "traffic_source"];
var MULTILINE = { message: true };
var INTERESTS = [
  "Executive coaching", "Career transition", "Leadership development",
  "Business consulting", "Team / organisation", "Not sure yet"
];

// Rate limits (per rolling window held in the script cache).
var MAX_PER_HOUR = 20;        // all submissions, site-wide
var MAX_PER_EMAIL_HOUR = 3;   // from one email address
var MAX_EMAILS_PER_DAY = 40;  // notification emails, stays well under Gmail's daily quota

var EMAIL_RE = /^[^\s@<>()",;:\\\[\]]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot: real visitors never tick the hidden "botcheck" box.
  if (p.botcheck) return json_({ success: true });

  var d = {};
  FIELDS.forEach(function (f) { d[f] = clean_(p[f], LIMITS[f], MULTILINE[f]); });

  if (!d.name || !d.email || !d.message) return fail_("Missing required fields.");
  if (!EMAIL_RE.test(d.email)) return fail_("Please enter a valid email.");
  if (d.linkedin && !/^https:\/\/[^\s]+$/i.test(d.linkedin)) d.linkedin = "";
  if (d.interest && INTERESTS.indexOf(d.interest) === -1) d.interest = "";

  var props = PropertiesService.getScriptProperties();
  var turnstileSecret = props.getProperty("TURNSTILE_SECRET");
  if (turnstileSecret && !verifyTurnstile_(turnstileSecret, p["cf-turnstile-response"])) {
    return fail_("Verification failed. Please try again.");
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return fail_("Busy, please try again.");
  var sendEmail = false;
  try {
    var cache = CacheService.getScriptCache();
    var hourKey = "h:" + Utilities.formatDate(new Date(), "UTC", "yyyyMMddHH");
    var emailKey = "e:" + hash_(d.email.toLowerCase());
    var dayKey = "d:" + Utilities.formatDate(new Date(), "UTC", "yyyyMMdd");

    var hourCount = Number(cache.get(hourKey) || 0);
    var emailCount = Number(cache.get(emailKey) || 0);
    if (hourCount >= MAX_PER_HOUR || emailCount >= MAX_PER_EMAIL_HOUR) {
      return fail_("Too many messages. Please try again later, or email us directly.");
    }
    cache.put(hourKey, String(hourCount + 1), 3600);
    cache.put(emailKey, String(emailCount + 1), 3600);

    var dayCount = Number(cache.get(dayKey) || 0);
    if (dayCount < MAX_EMAILS_PER_DAY) {
      cache.put(dayKey, String(dayCount + 1), 21600); // cache max is 6h; a soft daily cap
      sendEmail = true;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    sheet.appendRow([new Date()].concat(FIELDS.map(function (f) { return sheetSafe_(d[f]); })));
  } finally {
    lock.releaseLock();
  }

  var notify = props.getProperty("NOTIFY_EMAIL");
  if (notify && sendEmail) {
    try {
      MailApp.sendEmail({
        to: notify,
        replyTo: d.email,
        subject: "New website enquiry from " + d.name,
        body:
          "Submitted through the website contact form. The sender's details are not verified —\n" +
          "be cautious with links or requests in the message.\n\n" +
          "Name: " + d.name + "\n" +
          "Email: " + d.email + "\n" +
          "Phone: " + d.phone + "\n" +
          "Role & company: " + d.role + "\n" +
          "LinkedIn: " + d.linkedin + "\n" +
          "Interested in: " + d.interest + "\n" +
          "Traffic source: " + d.traffic_source + "\n\n" +
          d.message + "\n\n" +
          "All enquiries: " + SpreadsheetApp.getActiveSpreadsheet().getUrl()
      });
    } catch (err) {
      // The row is already saved; a failed email shouldn't fail the submission.
    }
  }

  return json_({ success: true });
}

// Lets you open the web app URL in a browser to check it's deployed.
function doGet() {
  return json_({ ok: true });
}

// Trims, removes control characters (and line breaks unless multiline), limits length.
function clean_(v, max, multiline) {
  v = String(v == null ? "" : v);
  v = multiline
    ? v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    : v.replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, " ");
  return v.trim().slice(0, max || 5000);
}

// Stops text like "=HYPERLINK(...)" being run as a formula in the sheet.
function sheetSafe_(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function hash_(s) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8));
}

function verifyTurnstile_(secret, token) {
  if (!token) return false;
  try {
    var res = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "post",
      payload: { secret: secret, response: String(token).slice(0, 2048) },
      muteHttpExceptions: true
    });
    return JSON.parse(res.getContentText()).success === true;
  } catch (err) {
    return false;
  }
}

function fail_(message) {
  return json_({ success: false, message: message });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

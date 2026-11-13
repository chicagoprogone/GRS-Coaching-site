/*
  GRS Coaching — review-period password gate.

  Loaded in the <head> of every page. If the visitor hasn't entered the review
  password, it hides the page and sends them to access.html.

  This is a privacy screen for client review, not real security: the site's
  files are public on GitHub. To remove the gate at launch, delete this file,
  access.html, the <script src="js/gate.js"> line and the robots "noindex" meta
  tag from each page, and robots.txt.

  To change the password, run:  node scripts/set-password.mjs "new password"
*/
(function () {
  var HASH = "e335da2a181dfb4159761a8d34f2da3062f49f7ab801cec2a7bb91fd2d077e0a";
  var KEY = "grs_preview_access";
  window.GRS_GATE = { hash: HASH, key: KEY, salt: "grs-preview:" };

  if (/access\.html$/.test(location.pathname)) return;

  var ok = false;
  try { ok = localStorage.getItem(KEY) === HASH; } catch (e) {}
  if (!ok) { try { ok = sessionStorage.getItem(KEY) === HASH; } catch (e) {} }
  if (ok) return;

  document.documentElement.style.display = "none";
  var page = location.pathname.split("/").pop() || "index.html";
  var next = page + location.search + location.hash;
  location.replace("access.html?next=" + encodeURIComponent(next));
})();

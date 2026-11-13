// Sets the review password for the GRS Coaching preview gate.
// Usage:  node scripts/set-password.mjs "new password"
// Writes only a salted SHA-256 hash into js/gate.js (the password itself is never stored).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pw = process.argv[2];
if (!pw) {
  console.error('Usage: node scripts/set-password.mjs "new password"');
  process.exit(1);
}
const file = fileURLToPath(new URL("../js/gate.js", import.meta.url));
const hash = createHash("sha256").update("grs-preview:" + pw).digest("hex");
const src = readFileSync(file, "utf8");
const out = src.replace(/var HASH = "[^"]*";/, `var HASH = "${hash}";`);
if (out === src && !src.includes(hash)) {
  console.error("Could not find the HASH line in js/gate.js");
  process.exit(1);
}
writeFileSync(file, out);
console.log("Password updated in js/gate.js. Commit and push to publish it.");

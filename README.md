# GRS Coaching website

Static site (plain HTML/CSS/JS, no build step). Works on GitHub Pages, Netlify, Vercel, or any web host.

```
index.html      What we do (home)
about.html      About the executive
contact.html    Contact form → Google Sheet
css/styles.css  All styling (colours/fonts are tokens at the top)
js/main.js      Mobile menu, scroll effects, form submission
assets/         favicon, headshot, LinkedIn share image
```

## 1. Contact form → Google Sheet

Each enquiry becomes a new row on the **Enquiries** tab of the "GRS" Google Sheet, and a
notification email goes to the `NOTIFY_EMAIL` script property. The script must be attached to that
sheet (opened from it via Extensions › Apps Script).

1. Open the sheet → **Extensions › Apps Script**. Replace the editor contents with `apps-script/Code.gs` and save.
2. **Project Settings (gear) › Script Properties** → add `NOTIFY_EMAIL` = the address for notifications.
   Settings are kept here, not in `Code.gs`, because this repository is public.
3. **Deploy › New deployment** → type **Web app** → Execute as **Me**, Who has access **Anyone** → Deploy, and approve the permissions prompt.
4. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`) into `contact.html` as the form's `data-endpoint`.

After editing `Code.gs` later, use **Deploy › Manage deployments › Edit › New version** so the URL stays the same.

**Spam protection.** The script limits submissions (20 per hour site-wide, 3 per hour per email
address, about 40 notification emails per day) and validates every field. For stronger bot
protection, turn on Cloudflare Turnstile:

1. Cloudflare dashboard › Turnstile › Add widget for `grscoaching.com` (mode: Managed).
2. In `contact.html`, just above the submit row, add
   `<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>` and, before `js/main.js`,
   `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`.
   (The page's Content-Security-Policy already allows this.)
3. Add the secret key as script property `TURNSTILE_SECRET` and deploy a new version.

**Only the owner should be an editor of the sheet** — anyone who can edit it can change the
script, which runs with the owner's Google account.

Columns: timestamp, name, email, phone, role, LinkedIn URL, interest, message, and `traffic_source`
(e.g. `linkedin / social / spring-post` when the visitor came from a tagged LinkedIn link).

## 2. Replace placeholder content

Search the HTML for `EDIT:` and `[`:

- Coach name, bio, career timeline, credentials — `about.html`
- Headshot — save as `assets/headshot.jpg` (4:5 portrait) and swap the placeholder div for the `<img>` in the comment
- Stats bar and testimonial — `index.html`
- Public email and LinkedIn URLs — all three pages (header/footer)
- Domain — `grscoaching.com` is assumed in the `canonical` / `og:url` tags; change if different

## 3. LinkedIn

- **Share image:** add `assets/og-image.png` at **1200×627**. This is the preview card LinkedIn shows when the link is posted.
- After publishing, paste the URL into https://www.linkedin.com/post-inspector/ to refresh LinkedIn's cached preview.
- **Track LinkedIn traffic:** use tagged links in posts / your profile, e.g.
  `https://www.grscoaching.com/?utm_source=linkedin&utm_medium=profile`
  The source is carried through to the contact form email.

## Preview locally

```bash
cd "GRS Coaching" && python3 -m http.server 8000
```
Then open http://localhost:8000

## Security settings outside this repo (Cloudflare)

- **SSL/TLS › Edge Certificates:** Always Use HTTPS on; HSTS on; SSL mode Full (strict).
- **Rules › Transform Rules › Modify Response Header** (all requests): `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  The pages carry their Content-Security-Policy in a `<meta>` tag; anti-framing has to be a header.
- **DNS:** DMARC record (`_dmarc` TXT `v=DMARC1; p=quarantine; rua=mailto:…`), DNSSEC on.

`_config.yml` keeps `apps-script/` and this README off the published site.


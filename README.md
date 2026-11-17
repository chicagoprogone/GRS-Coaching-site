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

Each enquiry becomes a new row on the **Enquiries** tab of the "GRS" Google Sheet
(https://docs.google.com/spreadsheets/d/14XGwyv_ZvCiJitAZei-GWgYqLjcDzWx4dat8PkhXD9g), and a
notification email goes to `NOTIFY_EMAIL` in `apps-script/Code.gs`.

1. Open the sheet → **Extensions › Apps Script**. Replace the editor contents with `apps-script/Code.gs` and save.
2. **Deploy › New deployment** → type **Web app** → Execute as **Me**, Who has access **Anyone** → Deploy, and approve the permissions prompt.
3. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`) into `contact.html` as the form's `data-endpoint`.

After editing `Code.gs` later, use **Deploy › Manage deployments › Edit › New version** so the URL stays the same.

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

# GRS Coaching website

Static site (plain HTML/CSS/JS, no build step). Works on GitHub Pages, Netlify, Vercel, or any web host.

```
index.html      What we do (home)
about.html      About the executive
contact.html    Contact form → email
css/styles.css  All styling (colours/fonts are tokens at the top)
js/main.js      Mobile menu, scroll effects, form submission
assets/         favicon, headshot, LinkedIn share image
```

## 1. Connect the contact form to an email address (2 minutes)

The form uses [Web3Forms](https://web3forms.com) — free (250 submissions/month), no server needed.

1. Go to https://web3forms.com and enter the email address that should **receive** enquiries.
2. They email you an **access key**.
3. In `contact.html`, replace `YOUR_WEB3FORMS_ACCESS_KEY` with that key.

Each enquiry arrives as an email with: name, email, phone, role, LinkedIn URL, interest, message, and
`traffic_source` (e.g. `linkedin / social / spring-post` when the visitor came from a tagged LinkedIn link).
Hitting **Reply** in your inbox replies straight to the person who filled in the form.

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

/* GRS Coaching — shared behaviour: mobile nav, header shadow, scroll reveal, contact form */
(function () {
  document.documentElement.classList.remove("no-js");

  /* Mobile nav */
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    const closeNav = (returnFocus) => {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    };
    document.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", () => closeNav(false)));

    // Keyboard: Escape closes the open menu; Tab cycles between the menu button and menu links.
    document.addEventListener("keydown", (e) => {
      if (!document.body.classList.contains("nav-open")) return;
      if (e.key === "Escape") { closeNav(true); return; }
      if (e.key !== "Tab") return;
      const items = [toggle, ...document.querySelectorAll(".nav a")];
      const i = items.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    });

    // If the window widens past the mobile breakpoint, close the menu so the Tab loop above lets go.
    const desktop = window.matchMedia("(min-width: 821px)");
    const onBreakpoint = () => { if (desktop.matches && document.body.classList.contains("nav-open")) closeNav(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onBreakpoint);
  }

  /* Header border once scrolled */
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Reveal on scroll */
  const els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add("in"));
  }

  /* Testimonials carousel: prev/next buttons, dots, arrow keys, swipe. No autoplay. */
  document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const slides = [...carousel.querySelectorAll(".testimonial")].slice(0, 10);  // max 10 slides
    carousel.querySelectorAll(".testimonial").forEach((s, i) => { if (i >= 10) s.remove(); });
    const dotsWrap = carousel.querySelector(".carousel-dots");
    const live = carousel.querySelector(".carousel-live");
    let index = 0;

    slides.forEach((s, i) => {
      s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "slide");
      s.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
    });
    // A single testimonial needs no controls.
    if (slides.length < 2) { carousel.querySelector(".carousel-controls").hidden = true; return; }

    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carousel-dot";
      b.setAttribute("aria-label", `Show testimonial ${i + 1} of ${slides.length}`);
      b.addEventListener("click", () => go(i));
      dotsWrap.appendChild(b);
      return b;
    });

    function go(i, announce = true) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, n) => {
        const hidden = n !== index;
        s.setAttribute("aria-hidden", String(hidden));
        s.inert = hidden;
      });
      dots.forEach((d, n) => d.setAttribute("aria-current", String(n === index)));
      if (announce && live) live.textContent = `Testimonial ${index + 1} of ${slides.length}`;
    }

    carousel.querySelectorAll(".carousel-btn").forEach((b) =>
      b.addEventListener("click", () => go(index + Number(b.dataset.dir)))
    );
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    });

    let startX = null;
    track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      startX = null;
    });

    go(0, false);
  });

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* Remember where the visitor came from (e.g. LinkedIn) so it shows up in the enquiry email */
  try {
    const params = new URLSearchParams(location.search);
    const src = params.get("utm_source") || params.get("ref");
    if (src && !sessionStorage.getItem("grs_source")) {
      const parts = [src, params.get("utm_medium"), params.get("utm_campaign")].filter(Boolean);
      sessionStorage.setItem("grs_source", parts.join(" / "));
    } else if (!sessionStorage.getItem("grs_source") && document.referrer &&
               !document.referrer.includes(location.host)) {
      sessionStorage.setItem("grs_source", new URL(document.referrer).hostname);
    }
  } catch (_) { /* storage blocked — not important */ }

  /* Contact form */
  const form = document.getElementById("contact-form");
  if (!form) return;

  const sourceField = form.querySelector('[name="traffic_source"]');
  try { if (sourceField) sourceField.value = sessionStorage.getItem("grs_source") || "direct"; } catch (_) {}

  const status = form.querySelector(".form-status");
  const button = form.querySelector('button[type="submit"]');

  // Give each error message an id so invalid inputs can point to it (read out by screen readers).
  form.querySelectorAll(".field-error").forEach((err, i) => { if (!err.id) err.id = "field-error-" + i; });

  const setInvalid = (field, invalid) => {
    if (!field) return;
    field.classList.toggle("invalid", invalid);
    const err = field.querySelector(".field-error");
    field.querySelectorAll("input, select, textarea").forEach((el) => {
      if (invalid) {
        el.setAttribute("aria-invalid", "true");
        if (err) el.setAttribute("aria-describedby", err.id);
      } else {
        el.removeAttribute("aria-invalid");
        el.removeAttribute("aria-describedby");
      }
    });
  };

  const validate = () => {
    let ok = true;
    // Check every visible field, not just required ones, so a malformed optional URL is flagged too.
    form.querySelectorAll(".field input, .field textarea, .field select").forEach((input) => {
      const valid = input.checkValidity();
      setInvalid(input.closest(".field"), !valid);
      if (!valid && ok) { input.focus(); ok = false; }
    });
    return ok;
  };
  form.querySelectorAll("input, select, textarea").forEach((input) =>
    input.addEventListener("input", () => {
      const f = input.closest(".field");
      if (f && f.classList.contains("invalid") && input.checkValidity()) setInvalid(f, false);
    })
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const endpoint = form.dataset.endpoint || "";
    if (!endpoint.startsWith("https://script.google.com/")) {
      showStatus("err", "The form isn't connected yet — add the Google Apps Script URL (see README).");
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    button.disabled = true;
    const label = button.innerHTML;
    button.textContent = "Sending…";
    showStatus("pending", "Sending your message…");  // announced by the role="status" region

    try {
      // URL-encoded body keeps this a "simple" request, which Apps Script accepts cross-origin.
      const res = await fetch(endpoint, { method: "POST", body: new URLSearchParams(formData) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success !== false) {
        form.innerHTML = `
          <div class="form-success" tabindex="-1">
            <span class="eyebrow">Message sent</span>
            <h3>Thank you, <em class="serif">${escapeHtml(data.name.split(" ")[0])}.</em></h3>
            <p>Your message is on its way. Expect a personal reply within one business day.</p>
          </div>`;
        const done = form.querySelector(".form-success");
        done.focus({ preventScroll: true });  // screen readers read the confirmation
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      } else {
        const e = new Error("Request failed");
        if (typeof json.message === "string") e.serverMessage = json.message.slice(0, 200);
        throw e;
      }
    } catch (err) {
      showStatus("err", (err && err.serverMessage) || "Sorry — something went wrong sending your message. Please try again, or email us directly.");
      button.disabled = false;
      button.innerHTML = label;
    }
  });

  function showStatus(kind, msg) {
    status.className = `form-status show ${kind}`;
    status.textContent = msg;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();

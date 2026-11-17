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
    form.querySelectorAll("[required]").forEach((input) => {
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
        done.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        throw new Error(json.message || "Request failed");
      }
    } catch (err) {
      showStatus("err", "Sorry — something went wrong sending your message. Please try again, or email us directly.");
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

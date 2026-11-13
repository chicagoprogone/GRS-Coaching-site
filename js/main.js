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
    document.querySelectorAll(".nav a").forEach((a) =>
      a.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
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

  const validate = () => {
    let ok = true;
    form.querySelectorAll("[required]").forEach((input) => {
      const field = input.closest(".field");
      const valid = input.checkValidity();
      if (field) field.classList.toggle("invalid", !valid);
      if (!valid && ok) { input.focus(); ok = false; }
    });
    return ok;
  };
  form.querySelectorAll("input, select, textarea").forEach((input) =>
    input.addEventListener("input", () => {
      const f = input.closest(".field");
      if (f && f.classList.contains("invalid") && input.checkValidity()) f.classList.remove("invalid");
    })
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const key = form.querySelector('[name="access_key"]').value;
    if (!key || key.startsWith("YOUR_")) {
      showStatus("err", "The form isn't connected yet — add your Web3Forms access key (see README).");
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    data.subject = `New enquiry from ${data.name} — GRS Coaching`;
    data.from_name = "GRS Coaching Website";
    data.replyto = data.email;

    button.disabled = true;
    const label = button.innerHTML;
    button.textContent = "Sending…";

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success !== false) {
        form.innerHTML = `
          <div class="form-success">
            <span class="eyebrow">Message sent</span>
            <h3>Thank you, <em class="serif">${escapeHtml(data.name.split(" ")[0])}.</em></h3>
            <p>Your message is on its way. Expect a personal reply within one business day.</p>
          </div>`;
        form.scrollIntoView({ behavior: "smooth", block: "center" });
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

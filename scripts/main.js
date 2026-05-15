const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const topbar = document.querySelector("[data-topbar]");
const year = document.querySelector("[data-year]");
const lightbox = document.querySelector("[data-lightbox-dialog]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxClose = document.querySelector("[data-lightbox-close]");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const handleScroll = () => {
  if (!topbar) return;
  topbar.classList.toggle("is-scrolled", window.scrollY > 24);
};

handleScroll();
window.addEventListener("scroll", handleScroll, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.14 }
);

for (const element of document.querySelectorAll(".reveal")) {
  revealObserver.observe(element);
}

const impressionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const element = entry.target;
      if (typeof window.sprightAnalytics?.trackEvent === "function") {
        window.sprightAnalytics.trackEvent(element.dataset.analyticsImpression, {
          category: "media",
          label: element.dataset.analyticsLabel || ""
        });
      }

      impressionObserver.unobserve(element);
    }
  },
  { threshold: 0.45 }
);

for (const element of document.querySelectorAll("[data-analytics-impression]")) {
  impressionObserver.observe(element);
}

for (const tile of document.querySelectorAll("[data-lightbox]")) {
  tile.addEventListener("click", () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;

    lightboxImage.src = tile.dataset.lightbox || "";
    lightboxImage.alt = tile.dataset.caption || "Spright media preview";
    lightboxCaption.textContent = tile.dataset.caption || "";

    if (typeof lightbox.showModal === "function") {
      lightbox.showModal();
    }
  });
}

if (lightboxClose && lightbox) {
  lightboxClose.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      lightbox.close();
    }
  });
}

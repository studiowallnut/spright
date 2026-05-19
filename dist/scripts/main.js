const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const topbar = document.querySelector("[data-topbar]");
const year = document.querySelector("[data-year]");
const lightbox = document.querySelector("[data-lightbox-dialog]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const updatesList = document.querySelector("[data-updates-list]");
const updatesDate = document.querySelector("[data-updates-date]");

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

const renderUpdates = (payload) => {
  if (!updatesList) return;

  const updates = Array.isArray(payload?.updates) ? payload.updates : [];
  const archive = Array.isArray(payload?.archive) ? payload.archive : [];
  if (updatesDate && payload?.updated) {
    updatesDate.textContent = `Updated ${payload.updated}`;
  }

  updatesList.replaceChildren();
  if (updates.length === 0) {
    const empty = document.createElement("article");
    empty.className = "update-item update-item--loading";
    empty.innerHTML = "<h3>No updates yet</h3><p>Check back soon for development notes.</p>";
    updatesList.append(empty);
    return;
  }

  const renderUpdate = (update, archived = false) => {
    const item = document.createElement("article");
    item.className = archived ? "update-item update-item--archived" : "update-item";

    const title = document.createElement("h3");
    title.textContent = archived && update.updated
      ? `${update.title || "Update"} - ${update.updated}`
      : update.title || "Update";

    const summary = document.createElement("p");
    summary.textContent = update.summary || "";

    item.append(title, summary);
    updatesList.append(item);
  };

  for (const update of updates) {
    renderUpdate(update);
  }

  for (const update of archive) {
    renderUpdate(update, true);
  }
};

if (updatesList) {
  fetch("data/updates.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`Updates request failed: ${response.status}`);
      return response.json();
    })
    .then(renderUpdates)
    .catch(() => {
      renderUpdates({
        updates: [
          {
            title: "Updates unavailable",
            summary: "The latest update log could not be loaded right now."
          }
        ]
      });
    });
}

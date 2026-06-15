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
const frameAnimations = document.querySelectorAll("[data-frame-animation]");
const worldTransmissionVisuals = document.querySelectorAll("[data-world-image]");
const releaseCountdowns = document.querySelectorAll("[data-release-countdown]");

if (year) {
  year.textContent = new Date().getFullYear();
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const numberedFrames = (directory, stem, count) => Array.from(
  { length: count },
  (_, index) => `${directory}/${stem}${String(index + 1).padStart(2, "0")}.webp`
);

const animationLibraries = {
  player: [
    {
      name: "run",
      frames: numberedFrames("assets/animations/player-run", "run_", 5),
      fps: 12
    }
  ],
  brux: [
    {
      name: "idle",
      frames: numberedFrames("assets/animations/brux-idle", "brux_idleframe_", 6),
      fps: 2.2,
      durations: [2, 0.8, 0.8, 0.8, 2.4, 0.8]
    },
    {
      name: "anticipation",
      frames: numberedFrames("assets/animations/brux-anticipation", "boss_introanimation_", 6),
      fps: 8
    },
    {
      name: "long-range",
      frames: numberedFrames("assets/animations/brux-long-range", "longrange_attack__", 8),
      fps: 10
    },
    {
      name: "melee",
      frames: numberedFrames("assets/animations/brux-melee", "melee_spearspinattack_", 6),
      fps: 10
    },
    {
      name: "phase-one-slam",
      frames: numberedFrames("assets/animations/brux-slam", "phase1_spearslam_", 9),
      fps: 7.5
    },
    {
      name: "phase-two-click",
      frames: numberedFrames("assets/animations/brux-phase2", "brux_phase2_", 6),
      fps: 2.4
    },
    {
      name: "phase-three-convergence",
      frames: numberedFrames("assets/animations/brux-phase3", "phase3_pointweapon_", 6),
      fps: 5.4
    }
  ]
};

const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const preloadedFrameSources = new Set();
const preloadFrames = (frames) => {
  for (const source of frames) {
    if (preloadedFrameSources.has(source)) continue;

    preloadedFrameSources.add(source);
    const preload = new Image();
    preload.decoding = "async";
    preload.src = source;
  }
};

for (const image of frameAnimations) {
  const animations = animationLibraries[image.dataset.animationLibrary];
  if (!animations?.length) continue;

  if (prefersReducedMotion) continue;

  const initialAnimationName = image.dataset.initialAnimation;
  const initialLoops = Number.parseInt(image.dataset.initialLoops || "", 10);
  let queue = [];
  let currentAnimation = null;
  let usedInitialAnimation = false;
  let frameIndex = 0;
  let completedLoops = 0;
  let targetLoops = 2;
  let frameStartedAt = 0;
  let playing = false;
  let animationRequest = 0;

  const chooseAnimation = () => {
    const initialAnimation = !usedInitialAnimation && initialAnimationName
      ? animations.find((animation) => animation.name === initialAnimationName)
      : null;

    if (initialAnimation) {
      currentAnimation = initialAnimation;
      usedInitialAnimation = true;
    } else {
      if (queue.length === 0) {
        queue = shuffle(animations);
        if (queue[0] === currentAnimation && queue.length > 1) {
          [queue[0], queue[1]] = [queue[1], queue[0]];
        }
      }

      currentAnimation = queue.shift();
    }

    if (queue.length === 0 && currentAnimation !== initialAnimation) {
      queue = shuffle(animations);
      if (queue[0] === currentAnimation && queue.length > 1) {
        [queue[0], queue[1]] = [queue[1], queue[0]];
      }
    }

    frameIndex = 0;
    completedLoops = 0;
    targetLoops = initialAnimation && Number.isFinite(initialLoops)
      ? initialLoops
      : 2 + Math.floor(Math.random() * 2);
    preloadFrames(currentAnimation.frames);
    image.src = currentAnimation.frames[0];
    image.dataset.currentAnimation = currentAnimation.name;
  };

  const currentFrameDuration = () => {
    const durationMultiplier = currentAnimation.durations?.[frameIndex] || 1;
    return (1000 / currentAnimation.fps) * durationMultiplier;
  };

  const advanceFrame = () => {
    frameIndex += 1;

    if (frameIndex >= currentAnimation.frames.length) {
      frameIndex = 0;
      completedLoops += 1;

      if (completedLoops >= targetLoops) {
        chooseAnimation();
        return;
      }
    }

    image.src = currentAnimation.frames[frameIndex];
  };

  const animate = (time) => {
    if (!playing) return;

    let frameDuration = currentFrameDuration();
    while (time - frameStartedAt >= frameDuration) {
      frameStartedAt += frameDuration;
      advanceFrame();
      frameDuration = currentFrameDuration();
    }

    animationRequest = window.requestAnimationFrame(animate);
  };

  const playbackObserver = new IntersectionObserver(
    ([entry]) => {
      playing = entry.isIntersecting;
      window.cancelAnimationFrame(animationRequest);

      if (playing) {
        if (!currentAnimation) {
          chooseAnimation();
        }
        frameStartedAt = performance.now();
        animationRequest = window.requestAnimationFrame(animate);
      }
    },
    { threshold: 0.05 }
  );

  playbackObserver.observe(image);
}

if (worldTransmissionVisuals.length > 0) {
  const worldVisualObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const element = entry.target;
        element.style.setProperty("--world-image", `url("${element.dataset.worldImage}")`);
        element.classList.add("is-world-loaded");
        worldVisualObserver.unobserve(element);
      }
    },
    { rootMargin: "650px 0px", threshold: 0.01 }
  );

  for (const element of worldTransmissionVisuals) {
    worldVisualObserver.observe(element);
  }
}

const twoDigit = (value) => String(value).padStart(2, "0");

for (const countdown of releaseCountdowns) {
  const target = new Date(countdown.dataset.releaseTarget || "");
  const daysElement = countdown.querySelector("[data-countdown-days]");
  const hoursElement = countdown.querySelector("[data-countdown-hours]");
  const minutesElement = countdown.querySelector("[data-countdown-minutes]");
  const secondsElement = countdown.querySelector("[data-countdown-seconds]");
  const messageElement = countdown.querySelector("[data-countdown-message]");

  if (Number.isNaN(target.getTime()) || !daysElement || !hoursElement || !minutesElement || !secondsElement) {
    continue;
  }

  const renderCountdown = () => {
    const remaining = Math.max(0, target.getTime() - Date.now());
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysElement.textContent = String(days);
    hoursElement.textContent = twoDigit(hours);
    minutesElement.textContent = twoDigit(minutes);
    secondsElement.textContent = twoDigit(seconds);

    if (remaining === 0) {
      countdown.classList.add("is-live");
      if (messageElement) {
        messageElement.textContent = "Spright is out now";
      }
      return false;
    }

    return true;
  };

  if (renderCountdown()) {
    const countdownInterval = window.setInterval(() => {
      if (!renderCountdown()) {
        window.clearInterval(countdownInterval);
      }
    }, 1000);
  }
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

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const topbar = $("[data-topbar]");
const nav = $("[data-nav]");
const navToggle = $("[data-nav-toggle]");
const progress = $("[data-scroll-progress]");
const year = $("[data-year]");
const crownWidget = $("[data-crown-hunt]");

if (year) year.textContent = new Date().getFullYear();

const analyticsEvent = (name, label) => {
  if (typeof window.sprightTrackEvent === "function") {
    window.sprightTrackEvent(name, { category: "interaction", label });
  }
};

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$("a", nav).forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }));
}

const updateScrollState = () => {
  const currentY = window.scrollY;
  topbar?.classList.toggle("is-scrolled", currentY > 28);
  crownWidget?.classList.toggle("is-at-hero", currentY < window.innerHeight * .82);

  if (progress) {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${available > 0 ? currentY / available : 0})`;
  }

  const hero = $("[data-hero]");
  if (hero && currentY < window.innerHeight * 1.3) {
    hero.style.setProperty("--sy", String(currentY));
  }
};

window.addEventListener("scroll", updateScrollState, { passive: true });
updateScrollState();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  });
}, { rootMargin: "0px 0px -9%", threshold: .08 });

$$(".reveal:not(.is-visible)").forEach((element) => revealObserver.observe(element));

const hero = $("[data-hero]");
if (hero && !prefersReducedMotion) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    hero.style.setProperty("--mx", x.toFixed(3));
    hero.style.setProperty("--my", y.toFixed(3));
  });

  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--mx", "0");
    hero.style.setProperty("--my", "0");
  });
}

const numberedFrames = (directory, prefix, count) => Array.from(
  { length: count },
  (_, index) => `${directory}/${prefix}${String(index + 1).padStart(2, "0")}.webp`
);

const frames = {
  jester: numberedFrames("assets/animations/jester-tornado", "jester_", 10),
  levathian: numberedFrames("assets/animations/levathian-vortex", "vortex_", 10),
  vendingExplode: numberedFrames("assets/vending", "explode_", 9)
};

const bruxAnimations = [
  {
    name: "idle",
    frames: numberedFrames("assets/animations/brux-idle", "brux_idleframe_", 6),
    fps: 2.2,
    durations: [2, .8, .8, .8, 2.4, .8]
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
];

const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const preloaded = new Set();
const preloadFrames = (sources) => {
  sources.forEach((source) => {
    if (preloaded.has(source)) return;
    preloaded.add(source);
    const image = new Image();
    image.decoding = "async";
    image.src = source;
  });
};

class FramePlayer {
  constructor(image, sources, fps = 12) {
    this.image = image;
    this.sources = sources;
    this.fps = fps;
    this.frame = 0;
    this.timer = 0;
    this.loops = 0;
    this.completed = 0;
    this.playing = false;
    this.lastTime = 0;
    this.request = 0;
  }

  play(loops = 1, restart = true) {
    if (!this.image || prefersReducedMotion) return Promise.resolve();
    preloadFrames(this.sources);
    if (restart) {
      this.frame = 0;
      this.completed = 0;
      this.image.src = this.sources[0];
    }
    this.loops = loops;
    this.playing = true;
    this.lastTime = performance.now();
    cancelAnimationFrame(this.request);

    return new Promise((resolve) => {
      const tick = (time) => {
        if (!this.playing) {
          resolve();
          return;
        }
        if (time - this.lastTime >= 1000 / this.fps) {
          this.lastTime = time;
          this.frame += 1;
          if (this.frame >= this.sources.length) {
            this.frame = 0;
            this.completed += 1;
            if (this.loops !== Infinity && this.completed >= this.loops) {
              this.playing = false;
              this.image.src = this.sources[0];
              resolve();
              return;
            }
          }
          this.image.src = this.sources[this.frame];
        }
        this.request = requestAnimationFrame(tick);
      };
      this.request = requestAnimationFrame(tick);
    });
  }

  stop(reset = false) {
    this.playing = false;
    cancelAnimationFrame(this.request);
    if (reset && this.image) this.image.src = this.sources[0];
  }
}

const jesterPreview = $("[data-jester-preview]");
if (jesterPreview && !prefersReducedMotion) {
  const previewPlayer = new FramePlayer(jesterPreview, frames.jester, 8.5);
  const previewObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !previewPlayer.playing) previewPlayer.play(Infinity, false);
    if (!entry.isIntersecting) previewPlayer.stop();
  }, { threshold: .15 });
  previewObserver.observe(jesterPreview);
}

const bruxSprite = $("[data-brux-sprite]");
if (bruxSprite && !prefersReducedMotion) {
  let queue = [];
  let currentAnimation = null;
  let usedOpeningSlam = false;
  let frameIndex = 0;
  let completedLoops = 0;
  let targetLoops = 4;
  let frameStartedAt = 0;
  let playing = false;
  let animationRequest = 0;

  const chooseBruxAnimation = () => {
    const openingSlam = !usedOpeningSlam
      ? bruxAnimations.find((animation) => animation.name === "phase-one-slam")
      : null;

    if (openingSlam) {
      currentAnimation = openingSlam;
      usedOpeningSlam = true;
    } else {
      if (queue.length === 0) {
        queue = shuffle(bruxAnimations);
        if (queue[0] === currentAnimation && queue.length > 1) {
          [queue[0], queue[1]] = [queue[1], queue[0]];
        }
      }
      currentAnimation = queue.shift();
    }

    frameIndex = 0;
    completedLoops = 0;
    targetLoops = openingSlam ? 4 : 2 + Math.floor(Math.random() * 2);
    preloadFrames(currentAnimation.frames);
    bruxSprite.src = currentAnimation.frames[0];
    bruxSprite.dataset.currentAnimation = currentAnimation.name;
  };

  const currentBruxFrameDuration = () => {
    const multiplier = currentAnimation.durations?.[frameIndex] || 1;
    return (1000 / currentAnimation.fps) * multiplier;
  };

  const advanceBruxFrame = () => {
    frameIndex += 1;
    if (frameIndex >= currentAnimation.frames.length) {
      frameIndex = 0;
      completedLoops += 1;
      if (completedLoops >= targetLoops) {
        chooseBruxAnimation();
        return;
      }
    }
    bruxSprite.src = currentAnimation.frames[frameIndex];
  };

  const animateBrux = (time) => {
    if (!playing) return;
    let duration = currentBruxFrameDuration();
    while (time - frameStartedAt >= duration) {
      frameStartedAt += duration;
      advanceBruxFrame();
      duration = currentBruxFrameDuration();
    }
    animationRequest = requestAnimationFrame(animateBrux);
  };

  const bruxObserver = new IntersectionObserver(([entry]) => {
    playing = entry.isIntersecting;
    cancelAnimationFrame(animationRequest);
    if (playing) {
      if (!currentAnimation) chooseBruxAnimation();
      frameStartedAt = performance.now();
      animationRequest = requestAnimationFrame(animateBrux);
    }
  }, { threshold: .05 });
  bruxObserver.observe(bruxSprite);
}

const levathianSprite = $("[data-levathian-sprite]");
if (levathianSprite && !prefersReducedMotion) {
  const levathianPlayer = new FramePlayer(levathianSprite, frames.levathian, 7.5);
  const levathianObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !levathianPlayer.playing) levathianPlayer.play(Infinity, false);
    if (!entry.isIntersecting) levathianPlayer.stop();
  }, { threshold: .12 });
  levathianObserver.observe(levathianSprite);
}

const worldRoot = $("[data-worlds]");
if (worldRoot) {
  const tabs = $$("[data-world-tab]", worldRoot);
  const screen = $("[data-world-screen]", worldRoot);
  const image = $("[data-world-image]", worldRoot);
  const kicker = $("[data-world-kicker]", worldRoot);
  const title = $("[data-world-title]", worldRoot);
  const copy = $("[data-world-copy]", worldRoot);
  const coordinate = $("[data-world-coordinate]", worldRoot);
  const coordinates = {
    factory: "X 03.14 / Y 08.26",
    carnival: "X ??.?? / Y 04.01",
    deep: "X 05.20 / Y -9.80",
    space: "X 06.66 / Y ∞"
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => {
    if (tab.classList.contains("is-active")) return;
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    screen?.classList.add("is-switching");
    window.setTimeout(() => {
      if (image) {
        image.src = tab.dataset.image;
        image.alt = `${tab.dataset.title} gameplay`;
      }
      if (kicker) kicker.textContent = tab.dataset.kicker;
      if (title) title.textContent = tab.dataset.title;
      if (copy) copy.textContent = tab.dataset.copy;
      if (coordinate) coordinate.textContent = coordinates[tab.dataset.worldTab] || "SIGNAL LOST";
      screen?.classList.remove("is-switching");
    }, 250);
    analyticsEvent("world_transmission", tab.dataset.title);
  }));
}

const countdown = $("[data-release-countdown]");
if (countdown) {
  const shortOutput = $("[data-countdown-short]", countdown);
  const daysOutput = $("[data-countdown-days]", countdown);
  const hoursOutput = $("[data-countdown-hours]", countdown);
  const minutesOutput = $("[data-countdown-minutes]", countdown);
  const secondsOutput = $("[data-countdown-seconds]", countdown);
  const messageOutput = $("[data-countdown-message]", countdown);
  const target = new Date(countdown.dataset.releaseTarget || "");
  const renderCountdown = () => {
    const remaining = Math.max(0, target.getTime() - Date.now());
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    if (shortOutput) shortOutput.textContent = remaining === 0 ? "The Engine is open" : `${days}D · ${String(hours).padStart(2, "0")}H`;
    if (daysOutput) daysOutput.textContent = String(days).padStart(2, "0");
    if (hoursOutput) hoursOutput.textContent = String(hours).padStart(2, "0");
    if (minutesOutput) minutesOutput.textContent = String(minutes).padStart(2, "0");
    if (secondsOutput) secondsOutput.textContent = String(seconds).padStart(2, "0");
    countdown.classList.toggle("is-live", remaining === 0);
    if (remaining === 0 && messageOutput) messageOutput.textContent = "Spright is available now";
  };
  renderCountdown();
  window.setInterval(renderCountdown, secondsOutput ? 1000 : 60000);
}

const vendingStage = $("[data-vending-stage]");
if (vendingStage) {
  const vendButton = $("[data-vend-button]", vendingStage);
  const machineImage = $("[data-vend-machine-image]", vendingStage);
  const reel = $("[data-vend-reel]", vendingStage);
  const reelTrack = $("[data-vend-reel-track]", vendingStage);
  const dropZone = $("[data-vend-drop-zone]", vendingStage);
  const countOutput = $("[data-vend-count]", vendingStage);
  const productOutput = $("[data-vend-product]", vendingStage);
  const promptTitle = $("[data-vend-prompt-title]", vendingStage);
  const promptSubtitle = $("[data-vend-prompt-subtitle]", vendingStage);
  const machineSource = "assets/vending/vending-machine.webp";
  const rewards = [
    { id: "ticket", name: "Admit One", src: "assets/vending/ticket.webp", size: 135 },
    { id: "bazooka", name: "Bazooka", src: "assets/vending/bazooka.webp", size: 220 },
    { id: "ice-gun", name: "Ice Gun", src: "assets/vending/ice-gun.webp", size: 190 },
    { id: "hammer", name: "Hammer", src: "assets/vending/hammer.webp", size: 190 },
    { id: "health", name: "Health", src: "assets/vending/health.webp", size: 105 },
    { id: "coins", name: "10 Coins", src: "assets/vending/coin.webp", size: 58 },
    { id: "trouble", name: "Trouble", src: "assets/vending/trouble.webp", size: 155 },
    { id: "self-destruct", name: "Self Destruct", src: "assets/vending/explode_05.webp", size: 190 }
  ];
  let purchases = 0;
  let locked = false;
  let spinning = false;
  let reelOffset = 0;
  let rowHeight = 0;
  let cycleHeight = 0;
  let idleStartedAt = performance.now();

  const normalizeOffset = (value) => cycleHeight > 0
    ? ((value % cycleHeight) + cycleHeight) % cycleHeight
    : 0;

  const renderReel = () => {
    if (!reelTrack || cycleHeight <= 0) return;
    reelTrack.style.transform = `translate3d(0, ${-(cycleHeight + normalizeOffset(reelOffset))}px, 0)`;
  };

  const sizeReel = () => {
    if (!reel || !reelTrack) return;
    rowHeight = reel.clientHeight / 3;
    cycleHeight = rowHeight * rewards.length;
    $$(".vending-reel__item", reelTrack).forEach((item) => {
      item.style.height = `${rowHeight}px`;
    });
    reelOffset = normalizeOffset(reelOffset);
    renderReel();
  };

  if (reelTrack) {
    const fragment = document.createDocumentFragment();
    for (let copy = 0; copy < 3; copy += 1) {
      rewards.forEach((reward) => {
        const item = document.createElement("span");
        item.className = "vending-reel__item";
        item.dataset.reward = reward.id;
        const icon = document.createElement("img");
        icon.src = reward.src;
        icon.alt = "";
        const label = document.createElement("span");
        label.textContent = reward.name;
        item.append(icon, label);
        fragment.append(item);
      });
    }
    reelTrack.append(fragment);
  }

  rewards.forEach((reward) => {
    const image = new Image();
    image.src = reward.src;
  });
  preloadFrames(frames.vendingExplode);

  const animateIdleReel = (time) => {
    const elapsed = Math.min(50, time - idleStartedAt);
    idleStartedAt = time;
    if (!spinning && !prefersReducedMotion && cycleHeight > 0) {
      reelOffset += elapsed * .03;
      renderReel();
    }
    requestAnimationFrame(animateIdleReel);
  };

  const spawnFlash = () => {
    if (!dropZone) return;
    const flash = document.createElement("i");
    flash.className = "vend-flash";
    dropZone.append(flash);
    window.setTimeout(() => flash.remove(), 650);
  };

  const spawnDrop = (reward, { delay = 0, spread = 1 } = {}) => {
    if (!dropZone) return;
    const drop = document.createElement("img");
    drop.className = `vend-drop vend-drop--${reward.id}`;
    drop.src = reward.src;
    drop.alt = "";
    drop.style.setProperty("--drop-size", `${reward.size + Math.round(Math.random() * 22)}px`);
    drop.style.setProperty("--drop-x", `${(-175 + Math.round(Math.random() * 225)) * spread}px`);
    drop.style.setProperty("--drop-rotate", `${-28 + Math.round(Math.random() * 56)}deg`);
    drop.style.animationDelay = `${delay}ms`;
    dropZone.append(drop);
    window.setTimeout(() => drop.remove(), 5500 + delay);
  };

  const deliverReward = async (reward) => {
    spawnFlash();
    if (reward.id === "coins") {
      for (let index = 0; index < 10; index += 1) {
        spawnDrop(reward, { delay: index * 55, spread: 1.35 });
      }
      return;
    }
    if (reward.id === "self-destruct" && machineImage) {
      vendButton?.classList.add("is-exploding");
      const explosion = new FramePlayer(machineImage, frames.vendingExplode, 12);
      await explosion.play(1);
      machineImage.src = machineSource;
      vendButton?.classList.remove("is-exploding");
      return;
    }
    spawnDrop(reward);
  };

  const spinReel = (rewardIndex) => new Promise((resolve) => {
    if (cycleHeight <= 0 || prefersReducedMotion) {
      reelOffset = rewardIndex * rowHeight + rowHeight / 2 - (reel?.clientHeight || 0) / 2;
      renderReel();
      window.setTimeout(resolve, prefersReducedMotion ? 180 : 0);
      return;
    }

    const duration = 1750;
    const startTime = performance.now();
    const startOffset = normalizeOffset(reelOffset);
    const targetOffset = normalizeOffset(
      rewardIndex * rowHeight + rowHeight / 2 - reel.clientHeight / 2
    );
    const distanceToTarget = normalizeOffset(targetOffset - startOffset);
    const travel = cycleHeight * 3 + distanceToTarget;

    const tick = (time) => {
      const progress = Math.min(1, (time - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3.2);
      reelOffset = startOffset + travel * eased;
      renderReel();
      if (progress < 1) requestAnimationFrame(tick);
      else {
        reelOffset = targetOffset;
        renderReel();
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });

  const runVend = async () => {
    if (locked || !vendButton) return;
    locked = true;
    spinning = true;
    vendButton.classList.add("is-spinning");
    vendButton.setAttribute("aria-busy", "true");
    if (promptTitle) promptTitle.textContent = "Prize reel spinning";
    if (promptSubtitle) promptSubtitle.textContent = "Stand clear · selection in progress";
    if (productOutput) productOutput.textContent = "Scrolling the prize reel…";

    const rewardIndex = Math.floor(Math.random() * rewards.length);
    const reward = rewards[rewardIndex];
    await spinReel(rewardIndex);

    spinning = false;
    purchases += 1;
    vendButton.classList.remove("is-spinning");
    vendButton.classList.remove("is-dispensing");
    void vendButton.offsetWidth;
    vendButton.classList.add("is-dispensing");
    window.setTimeout(() => vendButton.classList.remove("is-dispensing"), 520);
    if (countOutput) countOutput.textContent = String(purchases).padStart(3, "0");
    if (productOutput) productOutput.textContent = `Vended: ${reward.name}`;
    if (promptTitle) promptTitle.textContent = reward.name;
    if (promptSubtitle) promptSubtitle.textContent = reward.id === "self-destruct"
      ? "Catastrophic result · rebuilding"
      : "Prize delivered · spin again";

    await deliverReward(reward);
    vendButton.setAttribute("aria-busy", "false");
    locked = false;
    if (promptTitle) promptTitle.textContent = "Insert ticket";
    if (promptSubtitle) promptSubtitle.textContent = "Click to spin · unlimited plays";
    analyticsEvent("vending_purchase", `${reward.name} / ${purchases}`);
  };

  sizeReel();
  requestAnimationFrame(sizeReel);
  machineImage?.addEventListener("load", sizeReel);
  if (reel && "ResizeObserver" in window) {
    const reelResizeObserver = new ResizeObserver(sizeReel);
    reelResizeObserver.observe(reel);
  }
  window.addEventListener("resize", sizeReel);
  requestAnimationFrame(animateIdleReel);
  vendButton?.addEventListener("click", runVend);
}

const crownButtons = $$("[data-crown]");
const crownCount = $("[data-crown-count]");
const crownHunt = $("[data-crown-hunt]");
const crownToast = $("[data-crown-toast]");
let crownsFound = 0;

const cardShower = (amount = 24) => {
  const suits = ["♠", "♥", "♣", "♦"];
  for (let index = 0; index < amount; index += 1) {
    const card = document.createElement("i");
    const suit = suits[index % suits.length];
    card.className = "confetti-card";
    card.textContent = suit;
    card.style.left = `${Math.random() * 100}vw`;
    card.style.color = suit === "♥" || suit === "♦" ? "#ee365d" : index % 3 ? "#f4efe7" : "#f2b84b";
    card.style.setProperty("--fall-time", `${2.2 + Math.random() * 2.5}s`);
    card.style.animationDelay = `${Math.random() * .8}s`;
    document.body.append(card);
    window.setTimeout(() => card.remove(), 5600);
  }
};

crownButtons.forEach((button, index) => button.addEventListener("click", () => {
  if (button.classList.contains("is-found")) return;
  button.classList.add("is-found");
  crownsFound += 1;
  if (crownCount) crownCount.textContent = String(crownsFound);
  analyticsEvent("hidden_crown", `Crown ${index + 1}`);
  if (crownsFound === crownButtons.length) {
    crownHunt?.classList.add("is-complete");
    if (crownToast) crownToast.hidden = false;
    cardShower(30);
    window.setTimeout(() => { if (crownToast) crownToast.hidden = true; }, 2600);
  }
}));

const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konamiIndex = 0;
window.addEventListener("keydown", (event) => {
  const expected = konami[konamiIndex];
  if (event.key.toLowerCase() === expected.toLowerCase()) {
    konamiIndex += 1;
    if (konamiIndex === konami.length) {
      konamiIndex = 0;
      cardShower(50);
      if (crownToast) {
        $("strong", crownToast).textContent = "Crown Engine overclocked.";
        $("span", crownToast).textContent = "Cheat accepted. Probably.";
        crownToast.hidden = false;
        window.setTimeout(() => { crownToast.hidden = true; }, 2800);
      }
      analyticsEvent("easter_egg", "Crown Engine overclocked");
    }
  } else {
    konamiIndex = event.key === konami[0] ? 1 : 0;
  }
});

const lightbox = $("[data-lightbox-dialog]");
const lightboxImage = $("[data-lightbox-image]");
const lightboxCaption = $("[data-lightbox-caption]");
const lightboxClose = $("[data-lightbox-close]");

$$("[data-lightbox]").forEach((tile) => tile.addEventListener("click", () => {
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = tile.dataset.lightbox;
  lightboxImage.alt = tile.dataset.caption || "Spright game capture";
  if (lightboxCaption) lightboxCaption.textContent = tile.dataset.caption || "Engine capture";
  lightbox.showModal();
  analyticsEvent("gallery_open", tile.dataset.caption || "Game capture");
}));

lightboxClose?.addEventListener("click", () => lightbox?.close());
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

const contactForm = $("[data-contact-form]");
const contactStatus = $("[data-contact-status]");
const contactSubmit = $("[data-contact-submit]", contactForm);
const contactSubmitLabel = $("[data-contact-submit-label]", contactForm);
const contactControls = contactForm ? $$("input, select, textarea", contactForm) : [];

if (contactForm && crownWidget) {
  const contactSection = contactForm.closest(".contact");
  const contactObserver = new IntersectionObserver(([entry]) => {
    crownWidget.classList.toggle("is-at-contact", entry.isIntersecting);
  }, { threshold: .05 });
  if (contactSection) contactObserver.observe(contactSection);
}

const sendContactMessage = async () => {
  const invalidControl = contactControls.find((control) => !control.checkValidity());
  if (invalidControl) {
    invalidControl.reportValidity();
    invalidControl.focus();
    return;
  }

  const data = new FormData();
  contactControls.forEach((control) => {
    if (!control.name || control.disabled) return;
    if ((control.type === "checkbox" || control.type === "radio") && !control.checked) return;
    data.append(control.name, control.value);
  });
  const email = String(data.get("email") || "").trim();
  const topic = String(data.get("topic") || "General question");
  const newsletter = topic === "Newsletter signup" || data.get("newsletter") === "Yes";
  const subject = topic === "Newsletter signup"
    ? "Studio Wallnut newsletter signup"
    : `Studio Wallnut — ${topic}`;

  data.set("_subject", subject);
  data.set("_replyto", email);
  data.set("Newsletter signup", newsletter ? "Yes" : "No");
  data.set("Source", "sprightgame.com");

  contactSubmit?.setAttribute("disabled", "");
  contactForm.setAttribute("aria-busy", "true");
  if (contactSubmitLabel) contactSubmitLabel.textContent = "Sending…";
  if (contactStatus) {
    contactStatus.textContent = "Sending securely to Studio Wallnut…";
    contactStatus.classList.remove("is-ready", "is-error");
  }

  try {
    const response = await fetch(contactForm.dataset.contactEndpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) throw new Error("Submission rejected");

    contactControls.forEach((control) => {
      if (control.type === "checkbox" || control.type === "radio") {
        control.checked = control.defaultChecked;
      } else if (control.tagName === "SELECT") {
        const defaultIndex = [...control.options].findIndex((option) => option.defaultSelected);
        control.selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
      } else if (control.type !== "hidden") {
        control.value = control.defaultValue;
      }
    });
    if (contactStatus) {
      contactStatus.textContent = "Message sent. Studio Wallnut will be in touch.";
      contactStatus.classList.add("is-ready");
    }
    analyticsEvent("contact_form_sent", topic);
  } catch (error) {
    if (contactStatus) {
      contactStatus.textContent = "Message could not be sent. Please try again or email us directly.";
      contactStatus.classList.add("is-error");
    }
    analyticsEvent("contact_form_error", topic);
  } finally {
    contactSubmit?.removeAttribute("disabled");
    contactForm.removeAttribute("aria-busy");
    if (contactSubmitLabel) contactSubmitLabel.textContent = "Send message";
  }
};

contactSubmit?.addEventListener("click", sendContactMessage);
contactForm?.addEventListener("keydown", (event) => {
  const tagName = event.target.tagName;
  if (event.key !== "Enter" || event.isComposing || tagName === "TEXTAREA" || tagName === "SELECT") return;
  event.preventDefault();
  sendContactMessage();
});

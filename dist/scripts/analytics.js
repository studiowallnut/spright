/*
  Spright marketing analytics.

  This file intentionally avoids covert fingerprinting, identity enrichment,
  IP-based filtering, canvas/GPU/font probing, and advertising syncs. It uses
  normal analytics provider scripts only after real IDs are configured.
*/

const SPRIGHT_ANALYTICS_CONFIG = {
  siteName: "Spright",
  productionHostnames: ["sprightgame.com", "www.sprightgame.com"],

  privacy: {
    respectDoNotTrack: true,
    campaignStorageDays: 90,
    selfFilterStorageKey: "spright_analytics_ignore",
    attributionStorageKey: "spright_attribution_v1",
    sessionAttributionStorageKey: "spright_session_attribution_v1",
    visitStorageKey: "spright_visit_summary_v1",
    sessionStorageKey: "spright_session_v1"
  },

  providers: {
    cloudflare: {
      enabled: true,
      // Insert the Cloudflare Web Analytics token for sprightgame.com.
      // Placeholder/blank values keep the provider disabled.
      token: ""
    },
    ga4: {
      enabled: true,
      // Insert a real GA4 Measurement ID, for example "G-XXXXXXXXXX".
      // Placeholder/blank values keep the provider disabled.
      measurementId: "",
      debugMode: false
    },
    clarity: {
      enabled: true,
      // Insert the Microsoft Clarity Project ID.
      // Placeholder/blank values keep the provider disabled.
      projectId: ""
    },

    // Disabled placeholders for future ad/remarketing pixels.
    // Do not enable without real IDs, consent review, and privacy-policy copy.
    metaPixel: {
      enabled: false,
      pixelId: ""
    },
    tiktokPixel: {
      enabled: false,
      pixelId: ""
    },
    redditPixel: {
      enabled: false,
      pixelId: ""
    },
    googleAdsRemarketing: {
      enabled: false,
      conversionId: ""
    }
  },

  eventTracking: {
    scrollDepthThresholds: [25, 50, 75, 90],
    minimumSessionDurationMs: 5000
  }
};

const PLACEHOLDER_VALUES = new Set([
  "",
  "YOUR_CLOUDFLARE_WEB_ANALYTICS_TOKEN",
  "YOUR_CLARITY_PROJECT_ID",
  "YOUR_META_PIXEL_ID",
  "YOUR_TIKTOK_PIXEL_ID",
  "YOUR_REDDIT_PIXEL_ID",
  "AW-XXXXXXXXXX",
  "G-XXXXXXXXXX",
  "G-YOURMEASUREMENTID"
]);

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function hasRealValue(value) {
  return typeof value === "string" && !PLACEHOLDER_VALUES.has(value.trim());
}

function safeLocalStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in strict privacy modes.
  }
}

function safeLocalStorageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in strict privacy modes.
  }
}

function safeSessionStorageGet(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionStorageSet(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in strict privacy modes.
  }
}

function readJsonStorage(storageReader, key) {
  const raw = storageReader(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocalJson(key, value) {
  safeLocalStorageSet(key, JSON.stringify(value));
}

function writeSessionJson(key, value) {
  safeSessionStorageSet(key, JSON.stringify(value));
}

function appendScript({ src, async = false, defer = true, attributes = {} }) {
  const script = document.createElement("script");
  script.src = src;
  script.async = async;
  script.defer = defer;

  for (const [name, value] of Object.entries(attributes)) {
    script.setAttribute(name, value);
  }

  document.head.appendChild(script);
  return script;
}

function normalizeHostname(hostname) {
  return String(hostname || "").replace(/^www\./, "").toLowerCase();
}

function isProductionHostname() {
  const current = normalizeHostname(window.location.hostname);
  return SPRIGHT_ANALYTICS_CONFIG.productionHostnames
    .map(normalizeHostname)
    .includes(current);
}

function readUrlFlag(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function setSelfFilter(enabled) {
  if (enabled) {
    safeLocalStorageSet(SPRIGHT_ANALYTICS_CONFIG.privacy.selfFilterStorageKey, "1");
  } else {
    safeLocalStorageRemove(SPRIGHT_ANALYTICS_CONFIG.privacy.selfFilterStorageKey);
  }
}

function processSelfFilterUrlFlag() {
  const value = readUrlFlag("analytics_ignore");
  if (value === "1" || value === "true") {
    setSelfFilter(true);
  } else if (value === "0" || value === "false") {
    setSelfFilter(false);
  }
}

function isSelfFiltered() {
  return safeLocalStorageGet(SPRIGHT_ANALYTICS_CONFIG.privacy.selfFilterStorageKey) === "1";
}

function isDoNotTrackEnabled() {
  if (!SPRIGHT_ANALYTICS_CONFIG.privacy.respectDoNotTrack) return false;
  return navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.msDoNotTrack === "1";
}

function isAnalyticsSuppressed() {
  return isSelfFiltered() || isDoNotTrackEnabled();
}

function currentTimestamp() {
  return new Date().toISOString();
}

function getCampaignParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const campaign = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) campaign[key] = value.slice(0, 160);
  }

  return campaign;
}

function updateCampaignAttribution() {
  const campaign = getCampaignParamsFromUrl();
  const hasCampaign = Object.keys(campaign).length > 0;
  const now = Date.now();

  if (hasCampaign) {
    const attribution = {
      ...campaign,
      landing_page: window.location.pathname,
      first_seen_at: currentTimestamp(),
      expires_at: now + SPRIGHT_ANALYTICS_CONFIG.privacy.campaignStorageDays * 24 * 60 * 60 * 1000
    };
    writeLocalJson(SPRIGHT_ANALYTICS_CONFIG.privacy.attributionStorageKey, attribution);
    writeSessionJson(SPRIGHT_ANALYTICS_CONFIG.privacy.sessionAttributionStorageKey, attribution);
    return attribution;
  }

  const sessionAttribution = readJsonStorage(
    safeSessionStorageGet,
    SPRIGHT_ANALYTICS_CONFIG.privacy.sessionAttributionStorageKey
  );
  if (sessionAttribution) return sessionAttribution;

  const storedAttribution = readJsonStorage(
    safeLocalStorageGet,
    SPRIGHT_ANALYTICS_CONFIG.privacy.attributionStorageKey
  );

  if (!storedAttribution) return {};
  if (storedAttribution.expires_at && storedAttribution.expires_at < now) {
    safeLocalStorageRemove(SPRIGHT_ANALYTICS_CONFIG.privacy.attributionStorageKey);
    return {};
  }

  return storedAttribution;
}

function getVisitSummary() {
  const key = SPRIGHT_ANALYTICS_CONFIG.privacy.visitStorageKey;
  const existing = readJsonStorage(safeLocalStorageGet, key) || {};
  const now = currentTimestamp();
  const summary = {
    first_visit_at: existing.first_visit_at || now,
    last_visit_at: now,
    visit_count: Number(existing.visit_count || 0) + 1
  };

  writeLocalJson(key, summary);
  return summary;
}

function getSessionSummary() {
  const key = SPRIGHT_ANALYTICS_CONFIG.privacy.sessionStorageKey;
  const existing = readJsonStorage(safeSessionStorageGet, key);

  if (existing && existing.started_at && existing.started_ms) return existing;

  const summary = {
    started_at: currentTimestamp(),
    started_ms: Date.now()
  };
  writeSessionJson(key, summary);
  return summary;
}

processSelfFilterUrlFlag();

const storedVisitSummary = readJsonStorage(
  safeLocalStorageGet,
  SPRIGHT_ANALYTICS_CONFIG.privacy.visitStorageKey
) || {};
const attribution = isAnalyticsSuppressed() ? {} : updateCampaignAttribution();
const visitSummary = isAnalyticsSuppressed() ? {
  first_visit_at: storedVisitSummary.first_visit_at || "",
  last_visit_at: storedVisitSummary.last_visit_at || "",
  visit_count: Number(storedVisitSummary.visit_count || 0)
} : getVisitSummary();
const sessionSummary = isAnalyticsSuppressed() ? {
  started_at: currentTimestamp(),
  started_ms: Date.now()
} : getSessionSummary();
const scrollDepthSent = new Set();
let sessionDurationSent = false;

function getBaseEventParams() {
  const referrerUrl = document.referrer ? new URL(document.referrer, window.location.href) : null;
  return {
    site_name: SPRIGHT_ANALYTICS_CONFIG.siteName,
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    referrer_host: referrerUrl ? referrerUrl.hostname : "",
    visitor_type: visitSummary.visit_count > 1 ? "returning" : "new",
    visit_count: visitSummary.visit_count,
    session_started_at: sessionSummary.started_at,
    ...UTM_KEYS.reduce((params, key) => {
      params[key] = attribution[key] || "";
      return params;
    }, {})
  };
}

function shouldLoadProvider(providerConfig, idValue) {
  return Boolean(providerConfig.enabled) && hasRealValue(idValue) && !isAnalyticsSuppressed();
}

function initCloudflareWebAnalytics() {
  const provider = SPRIGHT_ANALYTICS_CONFIG.providers.cloudflare;
  const token = provider.token.trim();
  if (!shouldLoadProvider(provider, token)) return;

  appendScript({
    src: "https://static.cloudflareinsights.com/beacon.min.js",
    attributes: {
      "data-cf-beacon": JSON.stringify({ token })
    }
  });
}

function initGoogleAnalytics4() {
  const provider = SPRIGHT_ANALYTICS_CONFIG.providers.ga4;
  const measurementId = provider.measurementId.trim();
  if (!shouldLoadProvider(provider, measurementId)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  appendScript({
    src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`,
    async: true,
    defer: false
  });

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true,
    debug_mode: Boolean(provider.debugMode),
    campaign_source: attribution.utm_source || undefined,
    campaign_medium: attribution.utm_medium || undefined,
    campaign_name: attribution.utm_campaign || undefined,
    campaign_content: attribution.utm_content || undefined,
    campaign_term: attribution.utm_term || undefined
  });
}

function initMicrosoftClarity() {
  const provider = SPRIGHT_ANALYTICS_CONFIG.providers.clarity;
  const projectId = provider.projectId.trim();
  if (!shouldLoadProvider(provider, projectId)) return;

  window.clarity = window.clarity || function clarity() {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  appendScript({
    src: `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`,
    async: true,
    defer: false
  });

  if (typeof window.clarity === "function") {
    window.clarity("set", "visitor_type", visitSummary.visit_count > 1 ? "returning" : "new");
    for (const key of UTM_KEYS) {
      if (attribution[key]) window.clarity("set", key, attribution[key]);
    }
  }
}

function initDisabledAdPixelPlaceholders() {
  /*
    Meta Pixel, TikTok Pixel, Reddit Pixel, and Google Ads remarketing are
    intentionally not loaded here. Add official snippets only after real IDs,
    consent requirements, and privacy-policy language are ready.
  */
}

function trackEvent(eventName, params = {}) {
  if (isAnalyticsSuppressed()) return false;

  const eventParams = {
    ...getBaseEventParams(),
    event_category: params.category || "site_interaction",
    event_label: params.label || "",
    funnel_step: params.funnelStep || "",
    link_url: params.href || "",
    link_text: params.text || "",
    platform: params.platform || "",
    media_name: params.mediaName || "",
    percent_scrolled: params.percentScrolled || undefined,
    session_duration_seconds: params.sessionDurationSeconds || undefined,
    outbound: Boolean(params.outbound),
    transport_type: "beacon"
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...eventParams
  });

  const ga4 = SPRIGHT_ANALYTICS_CONFIG.providers.ga4;
  if (typeof window.gtag === "function" && shouldLoadProvider(ga4, ga4.measurementId.trim())) {
    window.gtag("event", eventName, eventParams);
  }

  if (typeof window.clarity === "function" && !isAnalyticsSuppressed()) {
    window.clarity("event", eventName);
  }

  return true;
}

function trackFunnelStep(stepName, params = {}) {
  return trackEvent("funnel_step", {
    ...params,
    category: "conversion_funnel",
    label: stepName,
    funnelStep: stepName
  });
}

function trackConversion(conversionName, params = {}) {
  return trackEvent("conversion", {
    ...params,
    category: "conversion",
    label: conversionName,
    funnelStep: conversionName
  });
}

function isOutboundUrl(href) {
  if (!href) return false;
  const url = new URL(href, window.location.href);
  if (!["http:", "https:"].includes(url.protocol)) return false;
  return normalizeHostname(url.hostname) !== normalizeHostname(window.location.hostname);
}

function eventParamsFromElement(element) {
  const link = element.closest("a[href]");
  const href = element.href || (link ? link.href : "") || element.dataset.lightbox || "";
  const label = element.dataset.analyticsLabel || element.getAttribute("aria-label") || "";
  const text = element.textContent.trim().replace(/\s+/g, " ").slice(0, 120);
  const mediaName = element.dataset.caption || element.dataset.analyticsMedia || "";

  return {
    category: element.dataset.analyticsCategory,
    label,
    platform: element.dataset.analyticsPlatform,
    href,
    text,
    mediaName,
    outbound: isOutboundUrl(href)
  };
}

function bindClickTracking() {
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const trackedElement = event.target.closest("[data-analytics-event]");
    const linkElement = event.target.closest("a[href]");

    if (trackedElement) {
      const eventParams = eventParamsFromElement(trackedElement);
      trackEvent(trackedElement.dataset.analyticsEvent, eventParams);

      if (trackedElement.dataset.analyticsEvent === "steam_wishlist_click") {
        trackFunnelStep("steam_click", eventParams);
        trackConversion("steam_wishlist_intent", eventParams);
      }

      if (trackedElement.dataset.analyticsEvent === "media_open") {
        trackFunnelStep("media_opened", eventParams);
      }
    }

    if (linkElement && isOutboundUrl(linkElement.href)) {
      trackEvent("outbound_link_click", eventParamsFromElement(linkElement));
    }
  });
}

function bindScrollDepthTracking() {
  let ticking = false;

  function checkScrollDepth() {
    ticking = false;

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
    for (const threshold of SPRIGHT_ANALYTICS_CONFIG.eventTracking.scrollDepthThresholds) {
      if (percent >= threshold && !scrollDepthSent.has(threshold)) {
        scrollDepthSent.add(threshold);
        trackEvent("scroll_depth", {
          category: "engagement",
          label: `${threshold}%`,
          percentScrolled: threshold
        });
      }
    }
  }

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(checkScrollDepth);
  }, { passive: true });

  checkScrollDepth();
}

function trackSessionStart() {
  trackEvent("session_start_custom", {
    category: "engagement",
    label: isProductionHostname() ? "production" : "local"
  });
}

function trackSessionDuration() {
  if (sessionDurationSent) return;

  const durationMs = Date.now() - Number(sessionSummary.started_ms || Date.now());
  if (durationMs < SPRIGHT_ANALYTICS_CONFIG.eventTracking.minimumSessionDurationMs) return;

  sessionDurationSent = true;
  trackEvent("session_duration", {
    category: "engagement",
    label: "page visibility end",
    sessionDurationSeconds: Math.round(durationMs / 1000)
  });
}

function bindSessionDurationTracking() {
  window.addEventListener("pagehide", trackSessionDuration);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") trackSessionDuration();
  });
}

function exposeHelpers() {
  window.sprightAnalytics = {
    config: SPRIGHT_ANALYTICS_CONFIG,
    status() {
      return {
        ignored: isSelfFiltered(),
        doNotTrack: isDoNotTrackEnabled(),
        suppressed: isAnalyticsSuppressed(),
        attribution,
        visitSummary,
        sessionSummary
      };
    },
    ignore() {
      setSelfFilter(true);
      return this.status();
    },
    allow() {
      setSelfFilter(false);
      return this.status();
    },
    trackEvent,
    trackFunnelStep,
    trackConversion
  };

  window.sprightTrackEvent = trackEvent;
}

exposeHelpers();

if (!isAnalyticsSuppressed()) {
  initCloudflareWebAnalytics();
  initGoogleAnalytics4();
  initMicrosoftClarity();
  initDisabledAdPixelPlaceholders();
  bindClickTracking();
  bindScrollDepthTracking();
  bindSessionDurationTracking();
  trackSessionStart();
}

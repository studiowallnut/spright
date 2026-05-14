/*
  Spright analytics configuration.

  Cloudflare Web Analytics is the preferred lightweight baseline for page views,
  referrers, device/browser data, country/region-style dimensions, and Web Vitals.

  Insert real production IDs below. Leave values blank to keep that provider
  disabled. Placeholder IDs intentionally do not load any network scripts.
*/
const SPRIGHT_ANALYTICS_CONFIG = {
  // Cloudflare Web Analytics site token for sprightgame.com.
  // Cloudflare dashboard: Web Analytics > Manage site > Copy JS snippet > token.
  cloudflareWebAnalyticsToken: "",

  // Optional Google Analytics 4 Measurement ID for richer custom click events.
  // Example format: "G-XXXXXXXXXX". Leave blank until a real property exists.
  ga4MeasurementId: "",

  // Turn this on temporarily when verifying GA4 in DebugView.
  ga4DebugMode: false
};

const PLACEHOLDER_VALUES = new Set([
  "",
  "YOUR_CLOUDFLARE_WEB_ANALYTICS_TOKEN",
  "G-XXXXXXXXXX",
  "G-YOURMEASUREMENTID"
]);

function hasRealValue(value) {
  return typeof value === "string" && !PLACEHOLDER_VALUES.has(value.trim());
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

function initCloudflareWebAnalytics() {
  const token = SPRIGHT_ANALYTICS_CONFIG.cloudflareWebAnalyticsToken.trim();
  if (!hasRealValue(token)) return;

  appendScript({
    src: "https://static.cloudflareinsights.com/beacon.min.js",
    attributes: {
      "data-cf-beacon": JSON.stringify({ token })
    }
  });
}

function initGoogleAnalytics4() {
  const measurementId = SPRIGHT_ANALYTICS_CONFIG.ga4MeasurementId.trim();
  if (!hasRealValue(measurementId)) return;

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
    debug_mode: Boolean(SPRIGHT_ANALYTICS_CONFIG.ga4DebugMode)
  });
}

function trackEvent(eventName, params = {}) {
  const eventParams = {
    event_category: params.category || "site_interaction",
    event_label: params.label || "",
    link_url: params.href || "",
    link_text: params.text || "",
    platform: params.platform || "",
    transport_type: "beacon"
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...eventParams
  });

  if (typeof window.gtag === "function" && hasRealValue(SPRIGHT_ANALYTICS_CONFIG.ga4MeasurementId)) {
    window.gtag("event", eventName, eventParams);
  }
}

function bindClickTracking() {
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const trackedElement = event.target.closest("[data-analytics-event]");
    if (!trackedElement) return;

    trackEvent(trackedElement.dataset.analyticsEvent, {
      category: trackedElement.dataset.analyticsCategory,
      label: trackedElement.dataset.analyticsLabel,
      platform: trackedElement.dataset.analyticsPlatform,
      href: trackedElement.href || trackedElement.dataset.lightbox || "",
      text: trackedElement.textContent.trim().replace(/\s+/g, " ").slice(0, 120)
    });
  });
}

/*
  Future ad/remarketing pixels.

  These are intentionally not enabled. Add official snippets only when real IDs,
  consent requirements, and privacy policy language are ready.

  Meta Pixel: insert Pixel ID here, then load the official Meta snippet.
  TikTok Pixel: insert Pixel ID here, then load the official TikTok snippet.
  Reddit Pixel: insert Pixel ID here, then load the official Reddit snippet.
  Google Ads remarketing: insert Conversion ID here, then extend the Google tag.
*/

initCloudflareWebAnalytics();
initGoogleAnalytics4();
bindClickTracking();

window.sprightTrackEvent = trackEvent;

# Spright Marketing Site

Static marketing website for Spright. It uses the game's existing PNG assets and can be deployed directly to GitHub Pages or any normal static web host.

Production domain: `https://sprightgame.com/`

## Local development

```sh
cd site
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Build

```sh
cd site
node scripts/build.js
```

The deployable files are written to `site/dist`.

## GitHub Pages

1. Commit the `site` folder.
2. Run `cd site && node scripts/build.js`.
3. Deploy `site/dist` with a GitHub Pages action, or copy the contents of `site/dist` to the branch/folder your repository uses for Pages.
4. Keep `.nojekyll` in the published output so GitHub Pages serves all static files directly.

## Custom domain

1. Upload the contents of `site/dist` to your host's web root.
2. Point your domain DNS to the host:
   - Use an `A` record for apex domains when your host provides IPs.
   - Use a `CNAME` record for subdomains such as `www`.
3. If using GitHub Pages, keep the included `CNAME` file containing `sprightgame.com` in the published output, then configure the same domain in repository Pages settings.
4. Enable HTTPS on the host once DNS has propagated.

## Analytics

Analytics setup lives in `scripts/analytics.js`. Providers are individually configurable and stay disabled until real IDs are added.

The implementation tracks:

- Page views and sessions through Cloudflare Web Analytics and GA4
- Referrers, traffic sources, device/browser, and country/region where the provider supports it
- UTM attribution: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- Scroll depth at 25%, 50%, 75%, and 90%
- Outbound link clicks
- Steam wishlist/play clicks
- Social link clicks
- Media/gallery open and close interactions
- Navigation interactions
- Session duration events after at least 5 seconds
- New vs. returning visit labels using first-party `localStorage`
- Lightweight funnel/conversion helpers for wishlist intent

The implementation does not use covert fingerprinting, IP-based frontend filtering, font/GPU/canvas probing, identity enrichment, or server-side tracking pipelines.

### Provider configuration

Edit `SPRIGHT_ANALYTICS_CONFIG` in `scripts/analytics.js`.

Cloudflare Web Analytics:

```js
providers: {
  cloudflare: {
    enabled: true,
    token: "YOUR_REAL_CLOUDFLARE_WEB_ANALYTICS_TOKEN"
  }
}
```

Google Analytics 4:

```js
providers: {
  ga4: {
    enabled: true,
    measurementId: "G-XXXXXXXXXX",
    debugMode: false
  }
}
```

Microsoft Clarity:

```js
providers: {
  clarity: {
    enabled: true,
    projectId: "YOUR_REAL_CLARITY_PROJECT_ID"
  }
}
```

Optional ad/remarketing placeholders are present but disabled:

- `metaPixel`
- `tiktokPixel`
- `redditPixel`
- `googleAdsRemarketing`

Do not enable those until real IDs, consent requirements, and privacy-policy language are ready.

### UTM attribution

When a visitor lands with UTM parameters, the site stores campaign attribution in first-party storage for up to 90 days:

```text
https://sprightgame.com/?utm_source=youtube&utm_medium=video&utm_campaign=demo_launch&utm_content=trailer&utm_term=indie_game
```

Stored UTM values are attached to custom GA4 events and Clarity custom tags when those providers are enabled.

### Event names

- `session_start_custom`
- `session_duration`
- `scroll_depth`
- `outbound_link_click`
- `steam_wishlist_click`
- `social_click`
- `media_open`
- `media_close`
- `nav_click`
- `funnel_step`
- `conversion`

Public helpers:

```js
sprightAnalytics.trackEvent("custom_event", { label: "Example" });
sprightAnalytics.trackFunnelStep("demo_interest");
sprightAnalytics.trackConversion("steam_wishlist_intent");
sprightAnalytics.status();
```

### Self-visit filtering

Use self-filtering to prevent your own browser from firing Cloudflare, GA4, Clarity, ad pixels, and custom event tracking. This uses `localStorage`; it does not use IP filtering.

Enable filtering in your browser:

```text
https://sprightgame.com/?analytics_ignore=1
```

Disable filtering:

```text
https://sprightgame.com/?analytics_ignore=0
```

Console helpers:

```js
sprightAnalytics.ignore(); // enable self-filtering
sprightAnalytics.allow();  // disable self-filtering
sprightAnalytics.status(); // inspect current state
```

When filtering is active, `sprightAnalytics.status()` returns `ignored: true` and `suppressed: true`.
If you enable filtering from the console after the page has already loaded, reload once so provider scripts are skipped from the beginning of the next page view.

### Privacy notes

Keep provider dashboards configured conservatively:

- Do not enable fingerprinting or identity stitching features.
- Do not pass email addresses, names, account IDs, or other direct identifiers into analytics events.
- Use Clarity only with appropriate masking/privacy settings for any future forms.
- Add cookie/consent handling before enabling ad/remarketing pixels in regions where consent is required.

### Favicon

The website uses `site/favicon.png`, generated from the in-game crown coin asset. The Godot icon is not used as the site favicon or header brand mark.

The head contains:

```html
<link rel="icon" type="image/png" href="favicon.png">
```

The build script copies `favicon.png` into `site/dist`.

## Verifying analytics

Local test:

1. Run `cd site && python3 -m http.server 4173`.
2. Open `http://localhost:4173`.
3. Confirm no console errors.
4. With provider IDs blank, there should be no Cloudflare, GA4, or Clarity network requests.
5. Run `sprightAnalytics.status()` in the console.
6. Test self-filtering with `?analytics_ignore=1` and verify `suppressed: true`.

Production test after deployment:

1. Open `https://sprightgame.com/` in a private/incognito window with ad blockers disabled.
2. In DevTools Network:
   - Cloudflare enabled: request to `static.cloudflareinsights.com/beacon.min.js`.
   - GA4 enabled: request to `googletagmanager.com/gtag/js` and GA collect requests.
   - Clarity enabled: request to `www.clarity.ms/tag/<PROJECT_ID>`.
3. Visit a URL with UTM parameters and confirm custom events include the campaign fields in GA4 DebugView.
4. Click the Steam CTA, social links, nav links, and media gallery tiles.
5. Scroll to at least 25%, 50%, 75%, and 90% of the page.
6. Confirm Cloudflare traffic appears after processing.
7. Confirm GA4 events appear in Realtime / DebugView. Temporarily set `debugMode: true` for DebugView, then turn it back off.
8. Confirm Clarity sessions appear in the Clarity dashboard if Clarity is enabled.

## Social links

Steam and YouTube are exact links. X, Discord, Instagram, and TikTok are placeholders and should be replaced when official URLs are available.

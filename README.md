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

Analytics setup lives in `scripts/analytics.js`.

Cloudflare Web Analytics is the preferred lightweight baseline. It provides privacy-friendly page visits, referrers / traffic sources, country or region reporting where available, device type, browser, Web Vitals, and basic engagement-style reporting in the Cloudflare dashboard.

To enable Cloudflare Web Analytics:

1. In Cloudflare, add `sprightgame.com` to Web Analytics.
2. Copy the site token from the Cloudflare JavaScript snippet.
3. Paste only the token into `cloudflareWebAnalyticsToken` in `scripts/analytics.js`.
4. Rebuild and deploy `site/dist`.

Optional Google Analytics 4 support is present for custom click events. It is disabled until a real Measurement ID is added.

To enable GA4:

1. Create a GA4 web data stream for `https://sprightgame.com/`.
2. Copy the Measurement ID, such as `G-XXXXXXXXXX`.
3. Paste it into `ga4MeasurementId` in `scripts/analytics.js`.
4. Rebuild and deploy `site/dist`.

Tracked click events:

- `steam_wishlist_click`: Steam wishlist / play links
- `social_click`: YouTube, X/Twitter, Discord, Instagram, and TikTok links
- `media_open`: gallery/media tile opens
- `media_close`: gallery close button
- `nav_click`: header, footer, and in-page navigation links

Future tracking/ad pixels are intentionally commented only. Do not add Meta Pixel, TikTok Pixel, Reddit Pixel, or Google Ads remarketing snippets until real IDs, consent requirements, and privacy policy language are ready.

## Verifying analytics

After deploying:

1. Open `https://sprightgame.com/` in a private/incognito window with ad blockers disabled.
2. In browser DevTools, check the Network tab:
   - Cloudflare enabled: request to `static.cloudflareinsights.com/beacon.min.js`.
   - GA4 enabled: request to `googletagmanager.com/gtag/js` and GA collect requests.
3. Click the Steam CTA, YouTube/social links, navigation links, and media gallery tiles.
4. Cloudflare page traffic should appear in the Cloudflare Web Analytics dashboard after processing.
5. GA4 click events should appear in Realtime / DebugView when GA4 is enabled. Temporarily set `ga4DebugMode: true` for DebugView verification, then turn it back off before final deployment.

Local note: analytics providers remain disabled while the ID fields are blank, so local development should show no external analytics requests and no console errors.

## Social links

Steam and YouTube are exact links. X, Discord, Instagram, and TikTok are placeholders and should be replaced when official URLs are available.

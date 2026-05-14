# Spright Marketing Site

Static marketing website for Spright. It uses the game's existing PNG assets and can be deployed directly to GitHub Pages or any normal static web host.

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
3. If using GitHub Pages, add a `CNAME` file containing your domain to `site/dist` before publishing, then configure the same domain in repository Pages settings.
4. Enable HTTPS on the host once DNS has propagated.

## Social links

Steam and YouTube are exact links. X, Discord, Instagram, and TikTok are placeholders and should be replaced when official URLs are available.

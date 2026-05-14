import { copyFile, cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(root, "..");
const dist = join(siteRoot, "dist");

const requiredFiles = [
  "index.html",
  "styles.css",
  "scripts/main.js",
  "assets/images/main-menu-background.png",
  "assets/images/spright-logo-cropped.png",
  "assets/images/player-spright.png",
  "assets/images/ember-cavern.png",
  "assets/images/deep-sea-background.png",
  "assets/images/into-space.png"
];

for (const file of requiredFiles) {
  await stat(join(siteRoot, file));
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(join(dist, "scripts"), { recursive: true });
await copyFile(join(siteRoot, "index.html"), join(dist, "index.html"));
await copyFile(join(siteRoot, "styles.css"), join(dist, "styles.css"));
await copyFile(join(siteRoot, "scripts/main.js"), join(dist, "scripts/main.js"));
await cp(join(siteRoot, "assets"), join(dist, "assets"), { recursive: true });
await copyFile(join(siteRoot, ".nojekyll"), join(dist, ".nojekyll"));

console.log("Built Spright site to dist/");

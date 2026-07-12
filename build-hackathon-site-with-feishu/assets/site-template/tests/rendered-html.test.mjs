import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the seamless carousel and verified Feishu information links", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /repeatedAdvocates = \[\.\.\.advocates, \.\.\.advocates, \.\.\.advocates\]/);
  assert.match(page, /event\.target === event\.currentTarget && settleSpeakerLoop\(\)/);
  assert.match(page, /ZKAAdXwt5oTZbCxIa7kcgQWinbs/);
  assert.match(page, /OJGUdgfU9omAB1x2ZxMc4f7YnNg/);
  assert.match(page, />赛事细则</);
  assert.match(page, />获奖公示</);
});

test("ships generated campaign art and an accessible animated hero", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  for (const file of [
    "track-coding-ai.jpg",
    "track-data-ai.jpg",
    "track-tob-ai.jpg",
    "award-gold-ai.jpg",
    "award-silver-ai.jpg",
    "award-bronze-ai.jpg",
    "hero-terrain-base.webp",
    "hero-terrain-reveal.webp",
  ]) {
    await access(new URL(`../public/hackathon-assets/${file}`, import.meta.url));
  }

  assert.match(page, /function HeroSpotlight\(\)/);
  assert.match(page, /requestAnimationFrame\(animate\)/);
  assert.match(page, /PiSquaresFourFill/);
  assert.match(css, /radial-gradient\(circle 260px at var\(--spot-x\) var\(--spot-y\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /speaker-track\.no-transition/);
  assert.match(css, /@media \(max-width: 720px\)/);

  await access(new URL("../.openai/hosting.json", import.meta.url));
  await access(root);
});

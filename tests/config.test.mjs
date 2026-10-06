import assert from "node:assert/strict";
import test from "node:test";
import { loadSource } from "./load-source.mjs";

const types = loadSource("src/types/config.ts");
const config = loadSource("astro-paper.config.ts", {
  "./src/types/config": types,
}).default;
const { designStyles } = loadSource("src/utils/design.ts");
const resolved = loadSource("src/config.ts", {
  "@/astro-paper.config": { default: config },
  "astro:env/client": { PUBLIC_GOOGLE_SITE_VERIFICATION: undefined },
  "./utils/analyticsSettings": loadSource("src/utils/analyticsSettings.ts"),
}).default;

test("single settings file resolves every palette, font and layout token", () => {
  const css = designStyles(config.design);
  assert.equal(resolved.design, config.design);
  assert.equal(resolved.home, config.home);
  assert.equal(resolved.site.url, config.site.url);
  for (const palette of [config.design.light, config.design.dark]) {
    for (const value of Object.values(palette)) assert.ok(css.includes(value));
  }
  for (const value of Object.values(config.design.fonts))
    assert.ok(css.includes(value));
  for (const value of Object.values(config.design.layout))
    assert.ok(css.includes(String(value)));
  const changed = structuredClone(config);
  changed.design.layout.readingWidthRem = 40;
  changed.home.heading = "Changed heading";
  types.defineAstroPaperConfig(changed);
  assert.ok(designStyles(changed.design).includes("--reading-width:40rem"));
});

test("both palettes meet WCAG AA text contrast, including wash and selection", () => {
  for (const palette of [config.design.light, config.design.dark]) {
    for (const [text, background] of [
      [palette.foreground, palette.background],
      [palette.muted, palette.background],
      [palette.accent, palette.background],
      [palette.accentForeground, palette.accent],
      [palette.foreground, palette.wash],
      [palette.muted, palette.wash],
    ])
      assert.ok(types.contrastRatio(text, background) >= 4.5);
  }
});

test("unsupported or unsafe configuration fails with an actionable setting name", () => {
  for (const [change, error] of [
    [
      c => {
        c.design.layout.unknown = true;
      },
      /unsupported setting design.layout.unknown/,
    ],
    [
      c => {
        c.design.light.muted = "#faf7f0";
      },
      /contrast/,
    ],
    [
      c => {
        c.design.fonts.body = "serif; color:red";
      },
      /local CSS font stack/,
    ],
    [
      c => {
        c.posts.perPage = 0;
      },
      /posts.perPage/,
    ],
    [
      c => {
        c.home.featuredLimit = 1.5;
      },
      /integer/,
    ],
    [
      c => {
        c.posts.scheduledPostMargin = 900000;
      },
      /early publication/,
    ],
    [
      c => {
        c.site.url += "/subpath";
      },
      /HTTPS origin/,
    ],
    [
      c => {
        c.site.timezone = "Not/AZone";
      },
      /IANA timezone/,
    ],
    [
      c => {
        c.socials[0].name = "missing";
      },
      /unsupported icon/,
    ],
  ]) {
    const candidate = structuredClone(config);
    change(candidate);
    assert.throws(() => types.defineAstroPaperConfig(candidate), error);
  }
});

test("production filter excludes drafts and future posts at every shared consumer", () => {
  const { postFilter } = loadSource("src/utils/postFilter.ts", {
    "@/config": { default: config },
  });

  assert.equal(
    postFilter({ data: { pubDatetime: new Date("2020-01-01") } }),
    true
  );
  assert.equal(
    postFilter({ data: { pubDatetime: new Date("2020-01-01"), draft: true } }),
    false
  );
  assert.equal(
    postFilter({ data: { pubDatetime: new Date("2099-01-01") } }),
    false
  );
});

test("empty-content synchronization clears cached posts/assets before the upstream glob returns", async () => {
  const events = [];
  const { freshGlob } = loadSource("src/utils/contentLoader.ts", {
    "astro/loaders": {
      glob: () => ({
        name: "glob-loader",
        load: async () => events.push("load"),
      }),
    },
  });
  const loader = freshGlob({
    pattern: "**/*.md",
    base: "./src/content/posts",
  });
  await loader.load({ store: { clear: () => events.push("clear") } });
  assert.deepEqual(events, ["clear", "load"]);
});

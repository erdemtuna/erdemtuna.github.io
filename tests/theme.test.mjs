import assert from "node:assert/strict";
import test from "node:test";
import { loadSource } from "./load-source.mjs";

function harness(saved = null, dark = false, blocked = false) {
  const values = new Map(saved ? [["theme", saved]] : []);
  const attrs = new Map();
  const clicks = [];
  const media = {
    matches: dark,
    addEventListener: (_, handler) => {
      media.change = handler;
    },
  };
  const button = {
    setAttribute: (key, value) => attrs.set(key, value),
    addEventListener: (_, handler) => clicks.push(handler),
  };
  const root = { dataset: {}, classList: { toggle() {} } };
  const listeners = {};
  const document = {
    documentElement: root,
    body: {},
    querySelector: selector =>
      selector === "#theme-btn" ? button : { setAttribute() {} },
    addEventListener: (name, handler) => {
      listeners[name] = handler;
    },
  };
  const storage = {
    getItem: key => {
      if (blocked) throw Error("blocked");
      return values.get(key) ?? null;
    },
    setItem: (key, value) => {
      if (blocked) throw Error("blocked");
      values.set(key, value);
    },
  };
  loadSource(
    "src/scripts/theme.ts",
    {},
    {
      document,
      localStorage: storage,
      getComputedStyle: () => ({ backgroundColor: "#faf7f0" }),
      window: {
        matchMedia: () => media,
        addEventListener: (name, handler) => {
          listeners[name] = handler;
        },
      },
      console: { warn() {} },
    }
  );
  return {
    root,
    values,
    attrs,
    clicks,
    listeners,
    os(value) {
      media.matches = value;
      media.change({ matches: value });
    },
  };
}

test("initial OS preference follows changes without saving an automatic preference", () => {
  const browser = harness(null, true);
  assert.equal(browser.root.dataset.theme, "dark");
  browser.os(false);
  assert.equal(browser.root.dataset.theme, "light");
  assert.equal(browser.values.size, 0);
});

test("saved manual preference wins over current and later OS changes", () => {
  const browser = harness("light", true);
  browser.os(true);
  assert.equal(browser.root.dataset.theme, "light");
  browser.clicks[0]();
  assert.equal(browser.root.dataset.theme, "dark");
  assert.equal(browser.values.get("theme"), "dark");
  browser.os(false);
  assert.equal(browser.root.dataset.theme, "dark");
  assert.equal(harness(browser.values.get("theme")).root.dataset.theme, "dark");
});

test("Astro swaps carry the theme before paint and never duplicate button listeners", () => {
  const browser = harness("dark");
  for (let i = 0; i < 5; i++) browser.listeners["astro:after-swap"]();
  assert.equal(browser.clicks.length, 1);
  const next = { documentElement: { dataset: {}, classList: { toggle() {} } } };
  browser.listeners["astro:before-swap"]({ newDocument: next });
  assert.equal(next.documentElement.dataset.theme, "dark");
  browser.clicks[0]();
  assert.equal(browser.root.dataset.theme, "light");
  assert.equal(browser.attrs.get("aria-label"), "Switch to dark theme");
});

test("invalid stored values and unavailable storage still produce a working theme", () => {
  assert.equal(harness("invalid", true).root.dataset.theme, "dark");
  const browser = harness(null, false, true);
  browser.clicks[0]();
  browser.os(false);
  assert.equal(browser.root.dataset.theme, "dark");
});

test("another tab can reset manual preference back to OS", () => {
  const browser = harness("light", true);
  browser.values.delete("theme");
  browser.listeners.storage({ key: "theme" });
  assert.equal(browser.root.dataset.theme, "dark");
  browser.os(false);
  assert.equal(browser.root.dataset.theme, "light");
});

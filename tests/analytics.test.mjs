import assert from "node:assert/strict";
import test from "node:test";
import { loadSource } from "./load-source.mjs";

const origin = "https://erdemtuna.dev";
const settings = {
  measurementId: "G-TEST123456",
  origin,
  postPaths: {
    "/posts/first/": "/first",
    "/posts/second/": "/second",
  },
};
const savedChoice = choice => JSON.stringify({ version: 1, choice });

class Element {
  constructor(dataset = {}, href) {
    this.dataset = dataset;
    this.href = href;
    this.hidden = true;
    this.isConnected = true;
    this.textContent = "";
    this.listeners = {};
    this.searchResult = false;
  }
  closest(selector) {
    if (selector === "[data-analytics-choice]")
      return this.dataset.analyticsChoice ? this : null;
    if (selector === "[data-analytics-preferences]")
      return this.dataset.analyticsPreferences !== undefined ? this : null;
    if (selector === "[data-analytics-dismiss]")
      return this.dataset.analyticsDismiss !== undefined ? this : null;
    if (selector === "a[href]") return this.href ? this : null;
    if (selector === "#pagefind-search") return this.searchResult ? this : null;
    return null;
  }
  focus() {
    this.focused = true;
  }
  addEventListener(name, handler) {
    this.listeners[name] = handler;
  }
  remove() {
    this.removed = true;
    this.isConnected = false;
  }
}

function harness({
  saved,
  url = origin + "/",
  blocked = false,
  writeBlocked = false,
  auto = true,
  configuration = settings,
} = {}) {
  const values = new Map(
    saved === undefined ? [] : [["analytics-consent", saved]]
  );
  const warnings = [];
  const scripts = [];
  const docListeners = {};
  const windowListeners = {};
  const cookieDeletes = [];
  const cookies = new Map([
    ["_ga", "existing"],
    ["_ga_TEST123456", "existing"],
    ["theme", "dark"],
  ]);
  let current = new URL(url);
  let reloads = 0;
  const location = {
    get origin() {
      return current.origin;
    },
    get href() {
      return current.href;
    },
    get hostname() {
      return current.hostname;
    },
    get pathname() {
      return current.pathname;
    },
    reload() {
      reloads++;
    },
  };
  const panel = new Element();
  const status = new Element();
  const state = new Element();
  const preferences = new Element({ analyticsPreferences: "" }, "/privacy/");
  const dismiss = new Element({ analyticsDismiss: "" });
  const manifest = new Element();
  manifest.textContent = JSON.stringify(configuration);
  const document = {
    title: "Home",
    referrer: "https://www.linkedin.com/feed/?email=private@example.com",
    get cookie() {
      return [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
    },
    set cookie(value) {
      cookieDeletes.push(value);
      cookies.delete(value.split("=")[0]);
    },
    getElementById(id) {
      return {
        "analytics-consent": panel,
        "analytics-config": manifest,
      }[id];
    },
    querySelectorAll(selector) {
      return {
        "[data-analytics-preferences]": [preferences],
        "[data-analytics-status]": [status],
        "[data-analytics-state]": [state],
      }[selector];
    },
    querySelector() {
      return dismiss;
    },
    createElement() {
      return new Element();
    },
    head: {
      append(script) {
        scripts.push(script);
      },
    },
    addEventListener(name, handler) {
      (docListeners[name] ??= []).push(handler);
    },
  };
  const window = {
    location,
    localStorage: {
      getItem(key) {
        if (blocked) throw Error("blocked");
        return values.get(key) ?? null;
      },
      setItem(key, value) {
        if (blocked || writeBlocked) throw Error("blocked");
        values.set(key, value);
      },
      removeItem(key) {
        if (blocked) throw Error("blocked");
        values.delete(key);
      },
    },
    addEventListener(name, handler) {
      (windowListeners[name] ??= []).push(handler);
    },
  };
  const module = loadSource(
    "src/scripts/analytics.ts",
    {},
    {
      window,
      document,
      Element,
      console: { warn: (...args) => warnings.push(args) },
    }
  );
  const fireDocument = (name, event = {}) =>
    docListeners[name]?.forEach(handler => handler(event));
  const fireWindow = (name, event = {}) =>
    windowListeners[name]?.forEach(handler => handler(event));
  const click = (target, button = 0, name = "click") => {
    let prevented = false;
    fireDocument(name, {
      target,
      button,
      preventDefault() {
        prevented = true;
      },
    });
    return prevented;
  };
  if (auto) module.initializeAnalytics(configuration);
  return {
    module,
    window,
    document,
    values,
    scripts,
    warnings,
    panel,
    status,
    preferences,
    dismiss,
    cookies,
    cookieDeletes,
    docListeners,
    click,
    fireDocument,
    fireWindow,
    accept: () => click(new Element({ analyticsChoice: "accepted" })),
    reject: () => click(new Element({ analyticsChoice: "rejected" })),
    events() {
      return Array.from(window.dataLayer ?? [])
        .map(args => Array.from(args))
        .filter(args => args[0] === "event")
        .map(args => JSON.parse(JSON.stringify(args.slice(1))));
    },
    commands() {
      return Array.from(window.dataLayer ?? []).map(args =>
        JSON.parse(JSON.stringify(Array.from(args)))
      );
    },
    navigate(path, title = "Article") {
      current = new URL(path, origin);
      document.title = title;
      fireDocument("astro:page-load");
    },
    reloads: () => reloads,
  };
}

test("GA4 configuration is optional, explicit, and fails on invalid activation", () => {
  const { resolveAnalyticsSettings } = loadSource(
    "src/utils/analyticsSettings.ts"
  );
  assert.equal(resolveAnalyticsSettings(origin, undefined, false), undefined);
  assert.equal(
    resolveAnalyticsSettings(origin, settings.measurementId, false),
    undefined
  );
  assert.equal(
    resolveAnalyticsSettings(origin, settings.measurementId, true).origin,
    origin
  );
  assert.throws(
    () => resolveAnalyticsSettings(origin, undefined, true),
    /PUBLIC_GA_MEASUREMENT_ID/
  );
  assert.throws(() => resolveAnalyticsSettings(origin, "UA-123", false), /G-/);
});

test("fresh, rejected, invalid, outdated and unreadable consent never load or queue analytics", () => {
  for (const saved of [
    undefined,
    savedChoice("rejected"),
    "accepted",
    '{"version":0,"choice":"accepted"}',
    '{"version":1,"choice":"anything"}',
  ]) {
    const browser = harness({ saved });
    browser.navigate("/posts/first/");
    assert.equal(browser.scripts.length, 0);
    assert.equal(browser.window.dataLayer, undefined);
    assert.equal(browser.cookies.has("_ga"), false);
    assert.equal(browser.cookies.get("theme"), "dark");
  }
  const blocked = harness({ blocked: true, saved: savedChoice("accepted") });
  assert.equal(blocked.scripts.length, 0);
  assert.ok(blocked.warnings.length);
});

test("acceptance starts once, denies ads, and sends only the current page", () => {
  const browser = harness();
  browser.navigate("/posts/first/", "First");
  browser.accept();
  browser.fireDocument("astro:page-load");
  browser.accept();
  assert.equal(browser.scripts.length, 1);
  assert.deepEqual(browser.events(), [
    [
      "page_view",
      {
        page_title: "First",
        page_location: origin + "/posts/first/",
        page_referrer: "https://www.linkedin.com/",
      },
    ],
  ]);
  assert.deepEqual(browser.commands()[0], [
    "consent",
    "default",
    {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
  ]);
  assert.equal(
    browser.commands().find(args => args[0] === "config")[2].send_page_view,
    false
  );
});

test("saved acceptance sends one initial view and correct views and referrers on forward/back navigation", () => {
  const browser = harness({ saved: savedChoice("accepted") });
  browser.fireDocument("astro:page-load");
  browser.navigate("/posts/first/", "First");
  browser.navigate("/posts/second/", "Second");
  browser.navigate("/posts/first/", "First");
  assert.equal(browser.scripts.length, 1);
  const events = browser.events();
  assert.equal(events.length, 4);
  assert.equal(events[1][1].page_referrer, origin + "/");
  assert.equal(events[2][1].page_referrer, origin + "/posts/first/");
  assert.equal(events[3][1].page_referrer, origin + "/posts/second/");
  assert.equal(events[3][1].page_title, "First");
});

test("actual same-path swaps and browser-cache arrivals count once while repeated initialization does not", () => {
  const browser = harness({ saved: savedChoice("accepted") });
  browser.fireDocument("astro:after-swap");
  browser.fireDocument("astro:page-load");
  browser.fireDocument("astro:page-load");
  assert.equal(browser.events().length, 2);
  browser.fireWindow("pageshow", { persisted: true });
  assert.equal(browser.events().length, 3);
});

test("non-primary clicks on consent buttons do not grant consent", () => {
  const browser = harness();
  const accept = new Element({ analyticsChoice: "accepted" });
  browser.click(accept, 1, "auxclick");
  browser.click(accept, 2, "auxclick");
  assert.equal(browser.scripts.length, 0);
  assert.equal(browser.values.has("analytics-consent"), false);
  assert.equal(browser.click(browser.preferences, 1, "auxclick"), false);
});

test("query and fragment changes do not inflate views or leak into later events", () => {
  const browser = harness({
    saved: savedChoice("accepted"),
    url: origin + "/search/?q=private@example.com",
  });
  browser.navigate("/search/?q=another-private-term#result");
  browser.click(new Element({}, "https://github.com/erdemtuna?email=secret"));
  assert.equal(
    browser.events().filter(([name]) => name === "page_view").length,
    1
  );
  assert.equal(browser.events()[1][1].page_location, origin + "/search/");
  assert.equal(browser.events()[1][1].link_url, "https://github.com/erdemtuna");
  assert.ok(!JSON.stringify(browser.commands()).includes("private"));
});

test("only approved, complete campaigns are preserved; credentials, raw queries and hashes are removed", () => {
  const { sanitizeAnalyticsUrl } = loadSource("src/scripts/analytics.ts");
  const campaigns = new Set(["first"]);
  assert.equal(
    sanitizeAnalyticsUrl(
      origin +
        "/posts/first/?utm_source=linkedin&utm_medium=social&utm_campaign=first&q=private#section",
      origin,
      campaigns
    ),
    origin +
      "/posts/first/?utm_source=linkedin&utm_medium=social&utm_campaign=first"
  );
  assert.equal(
    sanitizeAnalyticsUrl(
      "https://user:secret@github.com/erdemtuna?token=secret#section",
      origin
    ),
    "https://github.com/erdemtuna"
  );
  assert.equal(
    sanitizeAnalyticsUrl(
      origin + "/?utm_source=email@example.com&utm_campaign=first",
      origin,
      campaigns
    ),
    origin + "/"
  );
  assert.equal(sanitizeAnalyticsUrl("mailto:hello@example.com", origin), "");
});

test("article selections cover every placement, modified/middle clicks, and dynamic Pagefind results", () => {
  const browser = harness({ saved: savedChoice("accepted") });
  for (const placement of ["featured", "recent", "listing", "adjacent"]) {
    const link = new Element(
      { analyticsPost: "/first", analyticsPlacement: placement },
      origin + "/posts/first/"
    );
    assert.equal(browser.click(link), false);
  }
  const result = new Element({}, origin + "/posts/second/#heading");
  result.searchResult = true;
  assert.equal(browser.click(result, 1, "auxclick"), false);
  browser.click(new Element({}, origin + "/posts/first/"));
  const events = browser.events().filter(([name]) => name === "post_select");
  assert.equal(events.length, 5);
  assert.deepEqual(
    events.map(([, parameters]) => parameters.placement),
    ["featured", "recent", "listing", "adjacent", "search_result"]
  );
  assert.equal(events[4][1].article_id, "/second");
  assert.equal(events[4][1].origin_path, "/");
});

test("outbound clicks distinguish profiles/publications without sending queries or duplicate custom events", () => {
  const browser = harness({ saved: savedChoice("accepted") });
  browser.click(
    new Element(
      { analyticsRole: "profile" },
      "https://www.linkedin.com/in/erdem-tuna/?tracking=secret"
    )
  );
  browser.click(
    new Element(
      { analyticsRole: "publication" },
      "https://www.linkedin.com/pulse/article/?q=secret"
    )
  );
  browser.click(new Element({}, "mailto:hello@example.com"));
  const events = browser.events().filter(([name]) => name === "click");
  assert.equal(events.length, 2);
  assert.equal(events[0][1].link_role, "profile");
  assert.equal(events[1][1].link_role, "publication");
  assert.equal(events[1][1].outbound, true);
  assert.ok(!JSON.stringify(events).includes("secret"));
});

test("withdrawal disables the tag, clears only GA cookies, reloads, and prevents further events", () => {
  const browser = harness({ saved: savedChoice("accepted") });
  browser.reject();
  assert.equal(browser.window["ga-disable-G-TEST123456"], true);
  assert.equal(browser.cookies.has("_ga"), false);
  assert.equal(browser.cookies.get("theme"), "dark");
  assert.ok(
    browser.cookieDeletes.some(value => value.includes("Domain=.erdemtuna.dev"))
  );
  assert.equal(browser.reloads(), 1);
  browser.navigate("/posts/first/");
  browser.click(new Element({}, "https://github.com/erdemtuna"));
  assert.equal(browser.events().length, 0);
  assert.equal(
    JSON.parse(browser.values.get("analytics-consent")).choice,
    "rejected"
  );
});

test("cross-tab rejection, removal and invalidation revoke collection", () => {
  for (const saved of [savedChoice("rejected"), undefined, "invalid"]) {
    const browser = harness({ saved: savedChoice("accepted") });
    if (saved === undefined) browser.values.delete("analytics-consent");
    else browser.values.set("analytics-consent", saved);
    browser.fireWindow("storage", { key: "analytics-consent" });
    assert.equal(browser.reloads(), 1);
    assert.equal(browser.events().length, 0);
    assert.equal(browser.window["ga-disable-G-TEST123456"], true);
  }
});

test("cross-tab acceptance starts the current page once", () => {
  const browser = harness();
  browser.navigate("/posts/second/");
  browser.values.set("analytics-consent", savedChoice("accepted"));
  browser.fireWindow("storage", { key: "analytics-consent" });
  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.events().length, 1);
  assert.equal(browser.events()[0][1].page_location, origin + "/posts/second/");
});

test("failed consent writes do not enable tracking or reload into an old acceptance", () => {
  const fresh = harness({ writeBlocked: true });
  fresh.accept();
  assert.equal(fresh.scripts.length, 0);
  assert.ok(fresh.status.textContent.includes("could not be saved"));
  const accepted = harness({
    writeBlocked: true,
    saved: savedChoice("accepted"),
  });
  accepted.reject();
  assert.equal(accepted.events().length, 0);
  assert.equal(accepted.reloads(), 0);
  assert.equal(accepted.values.has("analytics-consent"), false);
  assert.equal(accepted.window["ga-disable-G-TEST123456"], true);
});

test("tag load failure is visible, disables collection, and can be retried without replay", () => {
  const browser = harness();
  browser.accept();
  browser.scripts[0].listeners.error();
  assert.equal(browser.events().length, 0);
  assert.ok(browser.status.textContent.includes("could not load"));
  assert.ok(browser.warnings.length);
  browser.navigate("/posts/second/");
  assert.equal(browser.scripts.length, 1);
  browser.accept();
  assert.equal(browser.scripts.length, 2);
  assert.equal(browser.events().length, 1);
  assert.equal(browser.events()[0][1].page_location, origin + "/posts/second/");
});

test("preferences open and close accessibly without granting consent", () => {
  const browser = harness();
  assert.equal(browser.click(browser.preferences), true);
  assert.equal(browser.panel.hidden, false);
  assert.equal(browser.panel.focused, true);
  browser.click(browser.dismiss);
  assert.equal(browser.scripts.length, 0);
  browser.reject();
  browser.click(browser.preferences);
  browser.click(browser.dismiss);
  assert.equal(browser.panel.hidden, true);
  assert.equal(browser.preferences.focused, true);
});

test("setup is idempotent and preview hostnames cannot load analytics", () => {
  const browser = harness({
    auto: false,
    saved: savedChoice("accepted"),
  });
  browser.module.setupAnalytics();
  browser.module.setupAnalytics();
  for (let i = 0; i < 5; i++) browser.fireDocument("astro:page-load");
  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.events().length, 1);
  assert.equal(browser.docListeners.click.length, 1);
  const preview = harness({
    url: "http://localhost:4321/",
    saved: savedChoice("accepted"),
  });
  assert.equal(preview.scripts.length, 0);
  assert.equal(preview.window.dataLayer, undefined);
});

test("restoring a page from browser cache rechecks consent", () => {
  const browser = harness({ saved: savedChoice("accepted") });
  browser.values.set("analytics-consent", savedChoice("rejected"));
  browser.fireWindow("pageshow", { persisted: true });
  assert.equal(browser.reloads(), 1);
  assert.equal(browser.events().length, 0);
});

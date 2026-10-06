import type { AnalyticsSettings } from "@/utils/analyticsSettings";

export interface AnalyticsConfiguration extends AnalyticsSettings {
  postPaths: Record<string, string>;
}

type Choice = "accepted" | "rejected";
type Parameters = Record<string, string | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const STORAGE_KEY = "analytics-consent";
const CONSENT_VERSION = 1;
const SOURCES = new Set(["linkedin", "github", "newsletter", "google"]);
const MEDIUMS = new Set(["social", "referral", "email", "organic"]);
const PLACEMENTS = new Set(["featured", "recent", "listing", "adjacent"]);

function warn(message: string, error?: unknown) {
  // eslint-disable-next-line no-console
  console.warn(`Analytics: ${message}`, error ?? "");
}

export function sanitizeAnalyticsUrl(
  value: string,
  origin: string,
  campaigns?: ReadonlySet<string>
): string {
  const url = new URL(value, origin);
  if (!["http:", "https:"].includes(url.protocol)) return "";
  const source = url.searchParams.get("utm_source") ?? "";
  const medium = url.searchParams.get("utm_medium") ?? "";
  const campaign = url.searchParams.get("utm_campaign") ?? "";
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  if (
    url.origin === origin &&
    campaigns?.has(campaign) &&
    SOURCES.has(source) &&
    MEDIUMS.has(medium)
  ) {
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", medium);
    url.searchParams.set("utm_campaign", campaign);
  }
  return url.href;
}

function readChoice(): Choice | undefined {
  let saved: string | null;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    warn("Consent storage is unavailable; analytics stays off.", error);
    return;
  }
  if (saved === null) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    warn("Invalid saved consent; a new choice is required.", error);
    return;
  }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "version" in parsed &&
    parsed.version === CONSENT_VERSION &&
    "choice" in parsed &&
    (parsed.choice === "accepted" || parsed.choice === "rejected")
  ) {
    return parsed.choice;
  }
  warn("Saved consent is invalid or outdated; a new choice is required.");
}

function saveChoice(choice: Choice): boolean {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: CONSENT_VERSION, choice })
    );
    return true;
  } catch (error) {
    warn("Could not save consent; analytics stays off.", error);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (removalError) {
      warn("Could not remove the old consent preference.", removalError);
    }
    return false;
  }
}

function clearAnalyticsCookies() {
  const names = document.cookie
    .split(";")
    .map(cookie => cookie.trim().split("=")[0])
    .filter(name => /^_ga(?:_|$)/.test(name));
  const parts = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) {
    const domain = parts.slice(i).join(".");
    domains.push(domain, `.${domain}`);
  }
  const paths = new Set(["/"]);
  const segments = window.location.pathname.split("/").filter(Boolean);
  for (let i = 1; i <= segments.length; i++) {
    const path = `/${segments.slice(0, i).join("/")}`;
    paths.add(path);
    paths.add(`${path}/`);
  }
  for (const name of names) {
    for (const domain of domains) {
      for (const path of paths) {
        document.cookie = `${name}=; Max-Age=0; Path=${path}; SameSite=Lax; Secure${domain ? `; Domain=${domain}` : ""}`;
      }
    }
  }
}

export function initializeAnalytics(config: AnalyticsConfiguration) {
  if (window.location.origin !== config.origin) return;

  const campaigns = new Set([
    "site",
    ...Object.values(config.postPaths).map(id => id.replace(/^\/+/, "")),
  ]);
  let choice = readChoice();
  let initialized = false;
  let failed = false;
  let script: HTMLScriptElement | undefined;
  let scriptLoaded = false;
  let opener: HTMLElement | undefined;
  let message = "";
  let swapped = false;
  let page:
    | {
        path: string;
        location: string;
        referrer: string;
        title: string;
        sent: boolean;
      }
    | undefined;

  const panel = () => document.getElementById("analytics-consent");
  const safeReferrer = (value: string) => {
    if (!value) return "";
    const clean = sanitizeAnalyticsUrl(value, config.origin);
    if (!clean) return "";
    return new URL(clean).origin === config.origin
      ? clean
      : `${new URL(clean).origin}/`;
  };
  const disable = (value: boolean) => {
    Reflect.set(window, `ga-disable-${config.measurementId}`, value);
  };
  const render = () => {
    document
      .querySelectorAll<HTMLElement>("[data-analytics-preferences]")
      .forEach(element => {
        element.hidden = false;
      });
    const status =
      choice === "accepted" && !failed
        ? "Analytics is on. You can reject it at any time."
        : "Analytics is off.";
    document
      .querySelectorAll<HTMLElement>("[data-analytics-status]")
      .forEach(element => {
        element.textContent = message || status;
      });
    document
      .querySelectorAll<HTMLElement>("[data-analytics-state]")
      .forEach(element => {
        element.textContent = status;
      });
    const dismiss = document.querySelector<HTMLElement>(
      "[data-analytics-dismiss]"
    );
    if (dismiss) dismiss.hidden = choice === undefined;
  };
  const emit = (name: string, parameters: Parameters) => {
    if (choice !== "accepted" || !initialized || failed || !page) return;
    window.gtag?.("event", name, {
      ...parameters,
      page_title: page.title,
      page_location: page.location,
      page_referrer: page.referrer,
    });
  };
  const start = () => {
    if (choice !== "accepted" || failed || !page) return;
    disable(false);
    if (initialized) return;
    initialized = true;
    window.dataLayer = [];
    window.gtag = function () {
      window.dataLayer?.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("set", {
      page_location: page.location,
      page_referrer: page.referrer,
      page_title: page.title,
    });
    window.gtag("config", config.measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: window.location.hostname,
    });
    const tag = document.createElement("script");
    script = tag;
    scriptLoaded = false;
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`;
    tag.addEventListener("load", () => {
      if (script === tag) scriptLoaded = true;
    });
    tag.addEventListener("error", () => {
      if (script !== tag || choice !== "accepted") return;
      failed = true;
      initialized = false;
      disable(true);
      window.dataLayer = [];
      tag.remove();
      if (page) page.sent = false;
      message =
        "Analytics could not load and is off. Accept again to retry, or reject analytics.";
      warn("Google tag failed to load; collection is disabled.");
      render();
      const current = panel();
      if (current) current.hidden = false;
    });
    document.head.append(tag);
  };
  const pageLoad = (arrival = false) => {
    arrival ||= swapped;
    swapped = false;
    const location = sanitizeAnalyticsUrl(
      window.location.href,
      config.origin,
      campaigns
    );
    const path = new URL(location).pathname;
    if (!page || page.path !== path || arrival) {
      page = {
        path,
        location,
        referrer:
          initialized && page
            ? sanitizeAnalyticsUrl(page.location, config.origin)
            : safeReferrer(document.referrer),
        title: document.title,
        sent: false,
      };
    } else {
      page.title = document.title;
    }
    render();
    start();
    if (choice === "accepted" && initialized && !failed && !page.sent) {
      window.gtag?.("set", {
        page_location: page.location,
        page_referrer: page.referrer,
        page_title: page.title,
      });
      emit("page_view", {});
      page.sent = true;
    }
    if (choice === undefined) {
      const current = panel();
      if (current) current.hidden = false;
    }
  };
  const stop = (reload: boolean) => {
    const wasInitialized = initialized;
    disable(true);
    window.dataLayer?.splice(0);
    script?.remove();
    if (!scriptLoaded) initialized = false;
    clearAnalyticsCookies();
    if (wasInitialized && reload) window.location.reload();
  };
  const close = () => {
    const current = panel();
    if (current) current.hidden = true;
    if (opener?.isConnected) opener.focus();
  };
  const select = (next: Choice) => {
    const saved = saveChoice(next);
    choice = saved ? next : undefined;
    failed = false;
    message = saved
      ? ""
      : "Your choice could not be saved. Analytics is off; enable browser storage to save a preference.";
    if (next === "rejected" || !saved) {
      stop(saved);
    } else {
      pageLoad();
    }
    render();
    if (saved) close();
  };
  const interaction = (event: MouseEvent) => {
    if (event.button !== 0 && event.button !== 1) return;
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>("[data-analytics-choice]");
    if (button && event.button === 0) {
      const next = button.dataset.analyticsChoice;
      if (next === "accepted" || next === "rejected") select(next);
      return;
    }
    const preferences = event.target.closest<HTMLElement>(
      "[data-analytics-preferences]"
    );
    if (preferences && event.button === 0) {
      event.preventDefault();
      opener = preferences;
      render();
      const current = panel();
      if (current) {
        current.hidden = false;
        current.focus({ preventScroll: true });
      }
      return;
    }
    if (
      event.button === 0 &&
      event.target.closest("[data-analytics-dismiss]")
    ) {
      if (choice !== undefined) close();
      return;
    }
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!link || !page || choice !== "accepted") return;
    const url = new URL(link.href, config.origin);
    if (!["http:", "https:"].includes(url.protocol)) return;
    if (url.origin !== config.origin) {
      emit("click", {
        link_url: sanitizeAnalyticsUrl(url.href, config.origin),
        link_domain: url.hostname,
        link_role: link.dataset.analyticsRole ?? "reference",
        outbound: true,
      });
      return;
    }
    const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    const article = config.postPaths[path];
    if (!article) return;
    const placement = link.dataset.analyticsPlacement;
    if (
      article === link.dataset.analyticsPost &&
      placement &&
      PLACEMENTS.has(placement)
    ) {
      emit("post_select", {
        article_id: article,
        placement,
        origin_path: page.path,
      });
    } else if (link.closest("#pagefind-search")) {
      emit("post_select", {
        article_id: article,
        placement: "search_result",
        origin_path: page.path,
      });
    }
  };

  document.addEventListener("astro:after-swap", () => {
    swapped = true;
  });
  document.addEventListener("astro:page-load", () => {
    pageLoad();
  });
  document.addEventListener("click", interaction, true);
  document.addEventListener("auxclick", interaction, true);
  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    choice = readChoice();
    message = "";
    if (choice !== "accepted") stop(true);
    pageLoad();
    if (choice !== undefined) close();
  });
  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    choice = readChoice();
    if (choice !== "accepted") stop(true);
    pageLoad(true);
  });
  if (choice !== "accepted") {
    disable(true);
    clearAnalyticsCookies();
  }
  pageLoad();
}

let installed = false;

function isPostPaths(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([path, id]) => path.startsWith("/") && typeof id === "string"
    )
  );
}

export function setupAnalytics() {
  if (installed) return;
  const element = document.getElementById("analytics-config");
  if (!element) return;
  let config: unknown;
  try {
    config = JSON.parse(element.textContent ?? "");
  } catch (error) {
    warn("Invalid analytics configuration; collection is disabled.", error);
    return;
  }
  if (
    typeof config !== "object" ||
    config === null ||
    !("measurementId" in config) ||
    typeof config.measurementId !== "string" ||
    !/^G-[A-Z0-9]{6,}$/.test(config.measurementId) ||
    !("origin" in config) ||
    typeof config.origin !== "string" ||
    config.origin !== window.location.origin ||
    !("postPaths" in config) ||
    !isPostPaths(config.postPaths)
  ) {
    warn(
      "Analytics configuration does not match this website; collection is disabled."
    );
    return;
  }
  installed = true;
  initializeAnalytics({
    measurementId: config.measurementId,
    origin: config.origin,
    postPaths: config.postPaths,
  });
}

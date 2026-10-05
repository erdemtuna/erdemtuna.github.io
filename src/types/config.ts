interface SiteConfig {
  /** Deployed URL of the site, e.g. "https://example.com" */
  url: string;
  /** Blog title shown in header and meta tags */
  title: string;
  /** Short description used in SEO meta and RSS feed */
  description: string;
  /** Default post author name */
  author: string;
  /** Author profile URL (used in structured data) */
  profile?: string;
  /** Fallback OG image filename in /public, e.g. "og.jpg" */
  ogImage?: string;
  /** HTML lang attribute, defaults to "en" */
  lang?: string;
  /** IANA timezone for post dates, e.g. "Asia/Bangkok" */
  timezone?: string;
  /** Text direction */
  dir?: "ltr" | "rtl" | "auto";
  /** Google Search Console verification meta tag value */
  googleVerification?: string;
}

interface PostsConfig {
  /** Posts per page on paginated listing pages */
  perPage?: number;
  /** Posts shown on the index/home page */
  perIndex?: number;
  /**
   * Kept for upstream compatibility; must be 0 to prevent early publication.
   */
  scheduledPostMargin?: number;
}

interface FeaturesConfig {
  /** Enable light/dark mode toggle. Defaults to true. */
  lightAndDarkMode?: boolean;
  /**
   * Generate dynamic OG images per post and provide `/og.png` when the static
   * `public/{site.ogImage}` file is absent. When false, that file is required
   * for the default layout OG image (build fails if missing).
   */
  dynamicOgImage?: boolean;
  /** Show the /archives page and link it in the footer. Defaults to true. */
  showArchives?: boolean;
  /** Show back button on post detail pages. Defaults to true. */
  showBackButton?: boolean;
  /** "Edit page" link shown on post detail pages. */
  editPost?:
    | {
        enabled: true;
        /** Base URL for the edit link, e.g. GitHub edit URL */
        url: string;
      }
    | { enabled: false };
  /**
   * Search provider. "pagefind" ships in the base template.
   * Set to false to disable search entirely.
   */
  search?: "pagefind" | false;
}

interface SocialLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "github" → src/assets/icons/socials/github.svg
   */
  name: string;
  url: string;
  /**
   * Accessible label for the icon link (aria-label, title attribute).
   * Auto-generated if omitted: "{site.title} on GitHub", "Send an email to {site.title}", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

interface ShareLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "facebook" → src/assets/icons/socials/facebook.svg
   */
  name: string;
  /** Base share URL. The post URL will be appended as a query param. */
  url: string;
  /**
   * Accessible label for the icon link (aria-label, title attribute).
   * Auto-generated if omitted: "Share this post on Facebook", "Share this post via WhatsApp", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

export interface Palette {
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  accentForeground: string;
  border: string;
  wash: string;
}

export interface DesignConfig {
  light: Palette;
  dark: Palette;
  fonts: { heading: string; body: string; ui: string; code: string };
  layout: {
    siteWidthRem: number;
    readingWidthRem: number;
    bodySizeRem: number;
    bodyLineHeight: number;
  };
}

export interface HomeConfig {
  eyebrow: string;
  heading: string;
  introduction: string;
  featuredTitle: string;
  recentTitle: string;
  showFeatured: boolean;
  showRecent: boolean;
  featuredLimit: number;
  showFeaturedCover: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

export interface AstroPaperConfig {
  site: SiteConfig;
  posts?: PostsConfig;
  features?: FeaturesConfig;
  /** Social profile links shown in header/footer */
  socials?: SocialLink[];
  /** Share links shown on post detail pages */
  shareLinks?: ShareLink[];
  design: DesignConfig;
  home: HomeConfig;
}

type ResolvedSiteConfig = Required<
  Pick<
    SiteConfig,
    | "url"
    | "title"
    | "description"
    | "author"
    | "lang"
    | "timezone"
    | "dir"
    | "ogImage"
  >
> &
  Pick<SiteConfig, "profile" | "googleVerification">;

export interface ResolvedAstroPaperConfig {
  site: ResolvedSiteConfig;
  posts: Required<PostsConfig>;
  features: Required<FeaturesConfig>;
  socials: SocialLink[];
  shareLinks: ShareLink[];
  design: DesignConfig;
  home: HomeConfig;
}

/**
 * Type helper for astro-paper.config.ts.
 * Provides IntelliSense and helpful build-time validation.
 */
export function defineAstroPaperConfig(
  config: AstroPaperConfig
): AstroPaperConfig {
  const fail = (message: string): never => {
    throw new Error(`AstroPaper configuration: ${message}`);
  };
  const keys = (value: object, allowed: string[], path: string) => {
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) fail(`unsupported setting ${path}.${key}`);
    }
  };
  const range = (value: number, min: number, max: number, path: string) => {
    if (!Number.isFinite(value) || value < min || value > max)
      fail(`${path} must be between ${min} and ${max}`);
  };
  keys(
    config,
    ["site", "posts", "features", "socials", "shareLinks", "design", "home"],
    "config"
  );
  keys(
    config.site,
    [
      "url",
      "title",
      "description",
      "author",
      "profile",
      "ogImage",
      "lang",
      "timezone",
      "dir",
      "googleVerification",
    ],
    "site"
  );
  if (config.posts)
    keys(config.posts, ["perPage", "perIndex", "scheduledPostMargin"], "posts");
  if (config.features)
    keys(
      config.features,
      [
        "lightAndDarkMode",
        "dynamicOgImage",
        "showArchives",
        "showBackButton",
        "editPost",
        "search",
      ],
      "features"
    );
  if (
    config.features?.search !== undefined &&
    !["pagefind", false].includes(config.features.search)
  )
    fail("features.search must be pagefind or false");
  if (config.features?.editPost) {
    keys(config.features.editPost, ["enabled", "url"], "features.editPost");
  }
  for (const name of ["socials", "shareLinks"] as const) {
    for (const link of config[name] ?? []) {
      keys(link, ["name", "url", "linkTitle"], name);
      if (
        ![
          "facebook",
          "github",
          "linkedin",
          "mail",
          "pinterest",
          "telegram",
          "whatsapp",
          "x",
        ].includes(link.name)
      )
        fail(`${name}: unsupported icon ${link.name}`);
      const url = new URL(link.url);
      if (!["https:", "mailto:"].includes(url.protocol))
        fail(`${name}.${link.name} must use https or mailto`);
    }
  }
  keys(config.design, ["light", "dark", "fonts", "layout"], "design");
  keys(config.design.fonts, ["heading", "body", "ui", "code"], "design.fonts");
  keys(
    config.design.layout,
    ["siteWidthRem", "readingWidthRem", "bodySizeRem", "bodyLineHeight"],
    "design.layout"
  );
  keys(
    config.home,
    [
      "eyebrow",
      "heading",
      "introduction",
      "featuredTitle",
      "recentTitle",
      "showFeatured",
      "showRecent",
      "featuredLimit",
      "showFeaturedCover",
      "emptyTitle",
      "emptyDescription",
    ],
    "home"
  );
  const origin = new URL(config.site.url);
  if (
    origin.protocol !== "https:" ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    fail(
      "site.url must be an HTTPS origin without a subpath, query or fragment"
    );
  if (config.site.lang && config.site.lang !== "en")
    fail("site.lang supports only en in this English-language website");
  try {
    new Intl.DateTimeFormat("en", { timeZone: config.site.timezone ?? "UTC" });
  } catch {
    fail("site.timezone must be a valid IANA timezone");
  }
  for (const mode of ["light", "dark"] as const) {
    const palette = config.design[mode];
    keys(
      palette,
      [
        "background",
        "foreground",
        "muted",
        "accent",
        "accentForeground",
        "border",
        "wash",
      ],
      `design.${mode}`
    );
    for (const [key, value] of Object.entries(palette)) {
      if (!/^#[\da-f]{6}$/i.test(value))
        fail(`design.${mode}.${key} must be a six-digit hex color`);
    }
    for (const [text, background] of [
      [palette.foreground, palette.background],
      [palette.muted, palette.background],
      [palette.accent, palette.background],
      [palette.accentForeground, palette.accent],
      [palette.foreground, palette.wash],
      [palette.muted, palette.wash],
    ]) {
      if (contrastRatio(text, background) < 4.5)
        fail(
          `design.${mode}: ${text} on ${background} must meet 4.5:1 text contrast`
        );
    }
  }
  for (const [key, font] of Object.entries(config.design.fonts)) {
    if (!font || !/^[a-z\d "'.,-]+$/i.test(font))
      fail(
        `design.fonts.${key} must be a local CSS font stack, not a URL or CSS declaration`
      );
  }
  const layout = config.design.layout;
  range(layout.siteWidthRem, 32, 80, "design.layout.siteWidthRem");
  range(
    layout.readingWidthRem,
    28,
    layout.siteWidthRem,
    "design.layout.readingWidthRem"
  );
  range(layout.bodySizeRem, 1, 1.5, "design.layout.bodySizeRem");
  range(layout.bodyLineHeight, 1.5, 2.2, "design.layout.bodyLineHeight");
  for (const [key, value] of Object.entries({
    "posts.perPage": config.posts?.perPage ?? 4,
    "posts.perIndex": config.posts?.perIndex ?? 4,
    "home.featuredLimit": config.home.featuredLimit,
  })) {
    range(value, 1, 50, key);
    if (!Number.isInteger(value)) fail(`${key} must be an integer`);
  }
  // Scheduled content must never become public ahead of its publication date.
  if ((config.posts?.scheduledPostMargin ?? 0) !== 0)
    fail("posts.scheduledPostMargin must be 0; early publication is disabled");
  for (const [key, value] of Object.entries(config.home)) {
    if (key.startsWith("show") && typeof value !== "boolean")
      fail(`home.${key} must be boolean`);
    if (typeof value === "string" && !value.trim() && key !== "eyebrow")
      fail(`home.${key} must not be empty`);
  }
  return config;
}

export function contrastRatio(text: string, background: string): number {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map(offset => {
      const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const values = [luminance(text), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

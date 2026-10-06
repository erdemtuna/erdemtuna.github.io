# Erdem Tuna

My personal website, built with [AstroPaper](https://github.com/satnaing/astro-paper).

**[View the website](https://erdemtuna.dev/)**

## Run locally

Use Node 24 and pnpm 11.3.0.

```sh
npx pnpm@11.3.0 install --frozen-lockfile
npx pnpm@11.3.0 run dev
```

Open the local URL printed in the terminal. To preview the production build,
including search:

```sh
npx pnpm@11.3.0 run build
npx pnpm@11.3.0 run preview
```

Restoring an identical MDX file at a previously compiled path can leave Astro
7.0.3's dev cache stale. Restart dev if that happens. Production builds use the
current source.

## Customize

Edit [`astro-paper.config.ts`](astro-paper.config.ts) for the site name, homepage
copy, colors, fonts, spacing and social links. Settings are typed and validated.

Edit [`src/content/pages/about.md`](src/content/pages/about.md) for the About page.

## Add writing

Create a `.md` or `.mdx` file in `src/content/posts`:

```yaml
---
title: Your article title
description: A short summary.
pubDatetime: 2026-10-05T12:00:00Z
tags: [notes]
featured: false
---
```

Write the article below the frontmatter. Local Markdown images work normally.
For a cover, add `cover: ./images/photo.jpg`, a meaningful `coverAlt`, and an
optional `coverCaption`. Social images are generated automatically unless you
provide `ogImage`.

For republished writing, `sourceUrl` and optional `sourceLabel` add a source
link beside the date without changing the site's canonical URL. Keep the
original `pubDatetime` and, when known, `modDatetime`.
Markdown punctuation is preserved without automatic quote or dash substitutions.

**This repository is public. `draft: true` hides a post from the website, not
from GitHub. Keep private drafts and images outside the repository.**

Future posts appear only after their publication date and a new build.

## Publishing

Pushes to `main` deploy through GitHub Actions. Pull requests run checks without
publishing. CI covers formatting, lint, tests and the production build.

The custom domain is `erdemtuna.dev`. `site.url` in the config supplies the
origin for canonical links, social metadata, RSS, sitemap and robots. Keep the
base path `/`. Actions publishing uses the Pages domain setting, not a CNAME file.

Based on AstroPaper 6.1.0, upstream snapshot `35cfa7f`. [MIT license](LICENSE).

## Search Console and optional analytics

Search Console is independent of website analytics. Keep the existing property
verified and submit `https://erdemtuna.dev/sitemap-index.xml`. Use URL Inspection
for indexing issues and compare query/page performance over comparable periods.
If HTML verification is needed, set `site.googleVerification` in the config or
provide `PUBLIC_GOOGLE_SITE_VERIFICATION` during the build. DNS-verified Domain
properties do not need a website verification tag.

GA4 is **off by default**. Activation requires both a Measurement ID and an
explicit enable flag. In GitHub repository **Settings > Secrets and variables >
Actions > Variables**, set:

| Variable                   | Value                                             |
| -------------------------- | ------------------------------------------------- |
| `PUBLIC_GA_MEASUREMENT_ID` | `G-NW4S177S9D` (this site's public web-stream ID) |
| `PUBLIC_GA_ENABLED`        | `true` only after completing the setup below      |

Only the production deployment workflow reads these repository variables. They
are build-time values; changing them requires a new deployment. Keep the flag
unset or `false` to disable analytics. The ID is public, not a credential.
Local development has no consent banner or tracker. Production previews on
localhost or any origin other than the configured site also cannot collect data.
Do not enable the flag for PR deployments.

### Before activation

The personal-site GA4 account is **Erdem Tuna**, with property **erdemtuna.dev**
and web stream **erdemtuna.dev** (`https://erdemtuna.dev`). This stream is already
created and linked to the verified Search Console Domain property. Use these
existing resources rather than creating duplicates. Review the reporting
timezone and the website's `/privacy/` notice before activation.

In the web stream, **disable Enhanced Measurement**, including browser-history
page views, outbound clicks, scrolls, site search and forms. The website controls
page views and emits GA4's standard outbound `click` event itself so every URL can
be sanitized. Enabling automatic tracking would duplicate events and could send
raw search/query text. The Google tag also uses `send_page_view: false`.

Leave Google Signals and advertising personalization disabled. Enable data
redaction for `q` and other user-entered query parameters as defense in depth.
Link the existing Search Console property to the matching stream, then publish
its report collection from GA4's Library. Linking needs a verified Search Console
owner and GA4 Editor permissions.

Register these **event-scoped custom dimensions** before collecting data:

| Dimension           | Event parameter |
| ------------------- | --------------- |
| Article ID          | `article_id`    |
| Selection placement | `placement`     |
| Link role           | `link_role`     |

### Consent and events

No Google script, analytics requests, analytics cookies or analytics event queue
is created before acceptance. Accept and Reject have equal prominence. A versioned
choice is stored under `analytics-consent` in local storage. Footer preferences
allow changing it; withdrawal blocks collection, removes accessible GA cookies,
and reloads without the tracker. If saving a choice fails, analytics stays off
and the UI explains the storage problem. Theme and navigation storage are separate.

| Event         | Parameters and purpose                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `page_view`   | Sanitized `page_location`, `page_referrer`, and current `page_title`; one view per page arrival or route change.          |
| `click`       | Sanitized `link_url`, `link_domain`, `outbound`, and `link_role` (`profile`, `publication`, or `reference`).              |
| `post_select` | Published `article_id`, `placement` (`featured`, `recent`, `listing`, `adjacent`, or `search_result`), and `origin_path`. |

GA4 also collects its inherent session and engagement events after consent.
No reading-depth, raw search terms, session recordings, identity tracking, or
advertising events are added. Do not mark every click/view as a key event.

Query strings and fragments are stripped from page, referrer and outbound link
data, except an approved complete campaign on a site page. Supported sources are
`linkedin`, `github`, `newsletter`, and `google`; supported mediums are `social`,
`referral`, `email`, and `organic`. The campaign must be `site` or a published
article slug without its leading slash. For example:

```text
https://erdemtuna.dev/posts/doc-review/?utm_source=linkedin&utm_medium=social&utm_campaign=doc-review
```

Use campaigns only on externally shared links, never internal navigation. Never
put personal information in a campaign. External referrers are reduced to their
origin; outbound destinations retain their path but no query or fragment.

Before activating a real ID, exercise acceptance, rejection, withdrawal, Astro
navigation, search, and article/outbound clicks. After deployment, use a consented
GA4 DebugView session to confirm events and dimensions. Consent choices and blockers
mean GA4 totals will not equal Search Console clicks. Start with GA4's acquisition,
pages and linked Search Console reports rather than a separate dashboard.

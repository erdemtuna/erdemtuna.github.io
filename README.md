# Erdem Tuna's personal website

A warm editorial, English-language website built on [AstroPaper](https://github.com/satnaing/astro-paper).
Home, Writing (`/posts/`), and About are the primary pages. Search, tags, archives,
pagination, RSS, and social images remain available. No CMS, database, analytics,
comments, newsletter, or paid services.

The account name and public GitHub profile identify Erdem Tuna; the introduction
and About deliberately make no occupational or biographical claims. There are
**no published articles yet**. Replace the neutral copy with approved real content
when ready. Template articles and their demo images have been removed.

## Local development

Use Node **24 LTS** (minimum 22.12.0) and **pnpm 11.3.0**. The committed lockfile
pins Astro 7.0.3; AstroPaper's theme version is 6.1.0. These are different versions.

```sh
npx pnpm@11.3.0 install --frozen-lockfile
npx pnpm@11.3.0 run dev
```

For production search and a representative preview:

```sh
npx pnpm@11.3.0 run build
npx pnpm@11.3.0 run preview
```

The build clears the previous generated search index, checks types, builds static pages and optimized images, builds Pagefind,
then copies the index into ignored `public/pagefind/` for development. Node's copy
API replaces the upstream Unix-only `cp`; Windows and Linux use the same script.
Clearing before Astro builds prevents obsolete search fragments from leaking into
the next artifact when posts are removed. Search indexes published articles and the About page. With no articles, Search
truthfully displays an empty state. Astro may warn that the posts collection is
empty; that is expected until the first real article.

The pinned Astro 7.0.3 glob loader can retain cached entries/assets when its last
file is removed. A narrow `freshGlob` wrapper clears the collection snapshot before
calling the original loader, preserving its validation and dev watcher. Returning
to zero posts therefore removes pages, social images, and asset imports even with
an existing cache; regression fixtures exercise this transition.
For an initially empty dev collection, the wrapper temporarily listens only within
that collection's base until the original glob watcher can initialize. Its normal
schema, matching, edits and deletions then take over; repeated syncs replace rather
than duplicate listeners. The first article can be added without restarting dev.

## One public settings file

Edit **`astro-paper.config.ts`**; types and runtime validation are in
`src/types/config.ts`, with resolved defaults in `src/config.ts`. No parallel
configuration or arbitrary Tailwind classes are generated.

| Settings                                                                | Meaning                                                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `site.url`                                                              | HTTPS production origin; currently `https://erdemtuna.github.io`, root base `/`                              |
| `site.title`, `description`, `author`, `profile`                        | Public brand, SEO/RSS description, default author and verified author profile                                |
| `site.ogImage`                                                          | Single filename in `public/`; if missing, dynamic images supply `/og.png`                                    |
| `site.lang`, `dir`, `timezone`                                          | English (`en`), text direction and IANA display timezone; UTC until a preferred timezone is supplied         |
| `site.googleVerification`                                               | Optional Search Console verification value; `PUBLIC_GOOGLE_SITE_VERIFICATION` also supported                 |
| `posts.perPage`, `perIndex`                                             | Listing pagination and homepage recent-post count (positive integers, maximum 50)                            |
| `posts.scheduledPostMargin`                                             | Must stay `0`: scheduled writing must not publish early                                                      |
| `features.lightAndDarkMode`                                             | Show manual theme control; otherwise still follow the device/saved preference                                |
| `features.dynamicOgImage`                                               | Generate per-post and default warm editorial social cards; if disabled, provide a static `site.ogImage`      |
| `features.showArchives`, `showBackButton`                               | Keep archives/supporting footer link and article back navigation                                             |
| `features.editPost`                                                     | Disabled by default; when enabled, provide your own GitHub edit URL                                          |
| `features.search`                                                       | `pagefind` or `false`; no external search provider                                                           |
| `socials`, `shareLinks`                                                 | Public profile links and optional sharing destinations; only the verified GitHub profile is configured       |
| `design.light`, `design.dark`                                           | `background`, `foreground`, `muted`, `accent`, `accentForeground`, `border`, `wash` six-digit hex colors     |
| `design.fonts`                                                          | Local `heading`, `body`, `ui`, `code` CSS font stacks; no remote font requests                               |
| `design.layout`                                                         | `siteWidthRem` (32–80), `readingWidthRem` (28–site width), `bodySizeRem` (1–1.5), `bodyLineHeight` (1.5–2.2) |
| `home.eyebrow`, `heading`, `introduction`                               | Masthead copy; eyebrow may be empty                                                                          |
| `home.featuredTitle`, `recentTitle`                                     | Section labels                                                                                               |
| `home.showFeatured`, `showRecent`, `featuredLimit`, `showFeaturedCover` | Section visibility, featured count (1–50), optional cover presentation                                       |
| `home.emptyTitle`, `emptyDescription`                                   | Truthful no-post state                                                                                       |

For example, change `design.layout.readingWidthRem` to `40`,
`design.fonts.body` to `'Georgia, "Times New Roman", serif'`, and
`home.recentTitle` to `"Recent writing"`. These settings apply across routes.
Featured writing does not repeat in the recent list; remaining featured articles
can still appear there or in Writing. All posts remain accessible in Writing.

Unsupported keys, invalid origins/timezones, nonpositive counts, CSS declarations
in font stacks, and insufficient text contrast produce useful build-time errors.
Normal text, links, selection and text on wash must meet **4.5:1**. Lines are
decorative; focus rings and functional controls use the contrasting accent.

Light/dark starts from the OS preference without saving it. A manual switch saves
the choice and overrides later OS changes, including Astro navigations. Clear the
browser's `theme` local-storage key to follow the OS again. Storage-disabled
browsers still support a session-only switch with a diagnostic warning.

## Writing and images

**This repository is public. `draft: true` hides built pages, not source or Git
history. Keep private drafts and private images entirely outside this repository.**
Do not commit secrets, `.env`, dependencies, `dist/`, generated search indexes,
or local validation fixtures.

When ready to publish real writing, add `src/content/posts/your-slug.md` (or `.mdx`):

```yaml
---
title: Your real article title
description: A concise, accurate summary.
pubDatetime: 2026-10-05T12:00:00Z
featured: false
draft: false
tags: [notes]
---
```

Write Markdown beneath the frontmatter. Use ISO timestamps with `Z` or an explicit
UTC offset. `modDatetime` optionally records a genuine update; sorting uses the
last-modified date when present. `author` defaults to the site author; a guest
author does not inherit the site's profile URL. `timezone` can override date
display for a post. `canonicalURL` supports an absolute HTTP(S) original article
URL for cross-posting. Drafts and future publication dates are excluded from
production article routes, listings, tags, archives, RSS, sitemap, OG routes and
Pagefind. Development can preview non-draft future posts. Scheduling is
**build-time**: GitHub Pages is static; trigger a new approved build after the date
arrives. There is no automatic scheduled deployment.

Optional cover fields (paths relative to the Markdown file):

```yaml
cover: ./images/your-public-image.jpg
coverAlt: A meaningful description of what the image shows.
coverCaption: Optional context or image credit.
```

A local `cover` requires nonempty `coverAlt`; captions/alt without a cover fail
validation. Astro generates responsive WebP sources and explicit dimensions.
Covers are independent of `ogImage`, which is a local image reference or an
absolute public social-image URL. Without `ogImage`, a per-post 1200×630 PNG is
generated; without dynamic OG, the site's static fallback is used. Generated
cards use the light palette and system serif/sans fonts; no font service is called.

Inline `![Meaningful alt](./images/image.jpg)` remains supported and locally
processed. MDX can use Astro's `Image`/`Picture` components for additional control.
Markdown headings, lists, blockquotes, tables, code and callouts are preserved.
Use `<figure>`/`<figcaption>` for inline image captions. Articles intentionally
have no gallery, image lightbox, or scroll animation. Wide tables/code can scroll
without widening the reading page.

About is Markdown-backed at `src/content/pages/about.md`.

## Validation

```sh
npx pnpm@11.3.0 run lint
npx pnpm@11.3.0 run format:check
npx pnpm@11.3.0 run test
npx pnpm@11.3.0 run build
npx pnpm@11.3.0 run test:output
npx pnpm@11.3.0 run test:fixtures
```

Tests cover settings/contrast, theme persistence and navigation, and structured
data. Output checks inspect actual generated head markup, canonical/social image
URLs, JSON-LD, internal links, sitemap/robots and Pagefind. Fixture validation
temporarily creates named synthetic test posts and a local image, tests invalid
cover alt, single/text-only/MDX/long-title/image/multipage states, canonical
overrides, guest authors and draft/future exclusion, then removes them and
restores the normal build. Fixture files are never published or committed.
The fixture command refuses to overwrite existing paths.
The reserved `validation-fixture-*` prefix is Git-ignored as an additional safeguard.

To reproduce first-article authoring, start `pnpm run dev --host 127.0.0.1 --port 4331`
with no posts, then run `node scripts/check-dev-lifecycle.mjs http://127.0.0.1:4331`
in another terminal. It checks schema rejection/recovery, Markdown/MDX additions,
edits and deletions, article routes, and search empty/control states without a
server restart, then removes its reserved fixtures. Actual Pagefind results still
require a production build; dev does not rebuild the search index.
The live check uses unique slugs per run to exercise new-article discovery. In the
pinned Astro version, re-adding byte-identical MDX at a previously compiled path
can leave the dev runtime cache stale; restart dev if that separate cache edge
case is encountered. Production builds reconcile collections from source.

PR CI validates but **does not deploy**. Local browser checks should also inspect
320px/mobile and desktop, light/dark, keyboard focus/menu/search, reduced motion,
and 200% zoom. Lighthouse is diagnostic, not a ranking or accessibility guarantee.

## Deployment preparation — not a live-site launch

The special account-site repository caused GitHub to create legacy Pages settings
automatically at repository creation. Its first build failed; the coordinator
changed the source to **GitHub Actions** to prevent branch publishing. No
customized site was deployed during this implementation. Do not mistake existing
Pages settings for approval to launch.

**Merging this PR into `main` will run the prepared deployment workflow and publish
the website. Review content/branding and obtain exact launch approval before
merging or manually dispatching it.** This branch/PR itself does not deploy.

`.github/workflows/deploy.yml` follows the
[official Astro Pages action](https://docs.astro.build/en/guides/deploy/github/):
pushes to `main` and manual dispatch on `main` only, Node 24, pnpm 11.3.0 and the
committed lockfile. SHA-pinned `withastro/action` v6.1.3 builds/uploads using the
official Pages artifact action v5; `actions/deploy-pages` v5.0.1 deploys.
PR events never invoke production deployment. Build has `contents: read`;
only deployment has `pages: write`/`id-token: write`, with the `github-pages`
environment and non-cancelling deployment concurrency. No PAT is needed.

After explicit approval:

1. Review the display name, introduction/About, intended social links and display
   timezone. Add a real first article or explicitly approve the truthful empty site.
2. Confirm repository Settings → Pages uses GitHub Actions and configure any
   required `github-pages` environment approvals.
3. Merge the reviewed PR into `main` or dispatch the workflow on `main`.
4. Verify `https://erdemtuna.github.io/`, assets, article links, search, RSS,
   sitemap, canonical/schema/social markup and mobile/theme behavior.
5. Verify an approved subsequent content push redeploys. Search Console account
   creation/verification and sitemap submission require separate authorization.

## Future custom domain

No domain or DNS authorization has been supplied; there is **no CNAME file**.
Do not purchase a domain or invent one.

Once an exact owned domain and authorization are provided:

1. Verify ownership with GitHub's documented DNS TXT record before assigning it.
2. Set the domain in repository Settings → Pages → Custom domain. Actions-based
   Pages needs this setting; a `public/CNAME` file alone does not configure it.
   GitHub's custom-workflow documentation says CNAME files are ignored; include
   one only if a later chosen deployment method requires it.
3. Follow GitHub's current apex A/AAAA or subdomain CNAME guidance with the
   authorized DNS provider. Avoid wildcard DNS and verify correct ownership.
4. Change **`site.url`** in `astro-paper.config.ts` to the HTTPS custom origin,
   keep base `/`, rebuild/redeploy, and inspect canonical/OG/schema/RSS/sitemap URLs.
5. Wait for certificate provisioning, enable Enforce HTTPS, then verify HTTPS
   and redirects from `erdemtuna.github.io` to one canonical origin.
6. Update Search Console property/sitemap after authorization. Avoid two
   independently indexable copies.

See [GitHub custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
for current DNS, ownership, HTTPS, and Actions CNAME rules. No ranking promises.

## Upstream provenance and license

Generated from AstroPaper **6.1.0**, upstream commit
`35cfa7fbe0b897306d27670d3819e55d5205f3dd`.
The generated initial commit is `f01de2cb52aaec960c242eb62f694a3c01705520`;
both have tree `88d51d42bac6e733d09127662f4503eded8082ac`.
The framework/dependency lockfile is unchanged; evaluate upstream updates
deliberately rather than automatically merging a moving main branch.

AstroPaper is MIT licensed. The original copyright and permission notice remain
in [LICENSE](LICENSE). The redesign uses local system fonts and no paid assets.

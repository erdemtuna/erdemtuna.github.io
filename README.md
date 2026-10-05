# Erdem Tuna

My personal website, built with [AstroPaper](https://github.com/satnaing/astro-paper).

**[View the website](https://erdemtuna.github.io/)**

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

**This repository is public. `draft: true` hides a post from the website, not
from GitHub. Keep private drafts and images outside the repository.**

Future posts appear only after their publication date and a new build.

## Publishing

Pushes to `main` deploy through GitHub Actions. Pull requests run checks without
publishing. CI covers formatting, lint, tests and the production build.

For a custom domain, verify ownership, configure the domain, DNS and HTTPS in
[GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site),
then update `site.url` in the config. Keep the base path `/`. Actions publishing
uses the Pages domain setting, not a CNAME file.

Based on AstroPaper 6.1.0, upstream snapshot `35cfa7f`. [MIT license](LICENSE).

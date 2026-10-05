import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { freshGlob } from "@/utils/contentLoader";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";

const posts = defineCollection({
  loader: freshGlob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
        author: z.string().default(config.site.author),
        pubDatetime: z.date(),
        modDatetime: z.date().optional().nullable(),
        title: z.string(),
        featured: z.boolean().optional(),
        draft: z.boolean().optional(),
        tags: z.array(z.string()).default(["others"]),
        ogImage: image().or(z.string()).optional(),
        cover: image().optional(),
        coverAlt: z.string().trim().min(1).optional(),
        coverCaption: z.string().trim().min(1).optional(),
        description: z.string(),
        canonicalURL: z.url({ protocol: /^https?$/ }).optional(),
        sourceUrl: z.url({ protocol: /^https?$/ }).optional(),
        sourceLabel: z.string().trim().min(1).optional(),
        hideEditPost: z.boolean().optional(),
        timezone: z.string().optional(),
      })
      .superRefine((post, ctx) => {
        if (post.sourceLabel && !post.sourceUrl)
          ctx.addIssue({
            code: "custom",
            path: ["sourceUrl"],
            message: "sourceLabel requires a sourceUrl.",
          });
        if (post.cover && !post.coverAlt)
          ctx.addIssue({
            code: "custom",
            path: ["coverAlt"],
            message: "A cover image requires meaningful coverAlt text.",
          });
        if (!post.cover && (post.coverAlt || post.coverCaption))
          ctx.addIssue({
            code: "custom",
            path: ["cover"],
            message: "coverAlt and coverCaption require a local cover image.",
          });
      }),
});

const pages = defineCollection({
  loader: freshGlob({
    pattern: "**/[^_]*.{md,mdx}",
    base: "./src/content/pages",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.url({ protocol: /^https?$/ }).optional(),
  }),
});

export const collections = { posts, pages };

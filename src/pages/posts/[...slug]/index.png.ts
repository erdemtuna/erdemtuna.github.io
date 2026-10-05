import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getPostSlug } from "@/utils/getPostPaths";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { generateOgImage } from "@/utils/ogImage";
import config from "@/config";

export async function getStaticPaths() {
  if (!config.features.dynamicOgImage) return [];
  return getSortedPosts(await getCollection("posts"))
    .filter(post => !post.data.ogImage)
    .map(post => ({
      params: { slug: getPostSlug(post.id, post.filePath) },
      props: post,
    }));
}

export const GET: APIRoute = async ({ props }) =>
  new Response(
    await generateOgImage(props.data.title, `By ${props.data.author}`),
    {
      headers: { "Content-Type": "image/png" },
    }
  );

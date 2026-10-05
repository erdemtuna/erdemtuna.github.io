import type { APIRoute } from "astro";
import { generateOgImage } from "@/utils/ogImage";
import config from "@/config";

export const GET: APIRoute = async () =>
  new Response(
    await generateOgImage(config.site.title, config.site.description),
    {
      headers: { "Content-Type": "image/png" },
    }
  );

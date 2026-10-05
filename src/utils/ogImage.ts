import sharp from "sharp";
import config from "@/config";

const escapeXml = (text: string) =>
  text.replace(
    /[<>&"']/g,
    character =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!
  );

function wrap(text: string, limit: number, maxLines: number): string[] {
  const words = text
    .trim()
    .split(/\s+/)
    .flatMap(word => word.match(new RegExp(`.{1,${limit}}`, "gu")) ?? []);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > limit) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, limit - 3)}...`;
  }
  return lines;
}

export async function generateOgImage(title: string, subtitle: string) {
  const palette = config.design.light;
  const lines = wrap(title, 32, 4);
  const titleY = lines.length > 2 ? 180 : 220;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${palette.background}"/>
    <rect x="1080" width="120" height="630" fill="${palette.wash}"/>
    <path d="M70 110H1030M70 525H1030" stroke="${palette.border}" stroke-width="2"/>
    <text x="70" y="77" font-family="${escapeXml(config.design.fonts.ui)}" font-size="24" letter-spacing="4" fill="${palette.accent}">${escapeXml(config.site.title)}</text>
    <text font-family="${escapeXml(config.design.fonts.heading)}" font-size="56" fill="${palette.foreground}">${lines.map((line, index) => `<tspan x="70" y="${titleY + index * 72}">${escapeXml(line)}</tspan>`).join("")}</text>
    <text x="70" y="575" font-family="${escapeXml(config.design.fonts.ui)}" font-size="24" fill="${palette.muted}">${escapeXml(wrap(subtitle, 65, 1)[0] ?? "")}</text>
  </svg>`;
  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}

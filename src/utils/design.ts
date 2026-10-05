import type { DesignConfig } from "../types/config";

export function designStyles(design: DesignConfig): string {
  const palette = (mode: "light" | "dark") =>
    Object.entries(design[mode])
      .map(
        ([key, value]) =>
          `--${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${value}`
      )
      .join(";");
  const fonts = Object.entries(design.fonts)
    .map(([key, value]) => `--font-${key}:${value}`)
    .join(";");
  const { siteWidthRem, readingWidthRem, bodySizeRem, bodyLineHeight } =
    design.layout;
  return `:root,[data-theme="light"]{${palette("light")};${fonts};--site-width:${siteWidthRem}rem;--reading-width:${readingWidthRem}rem;--body-size:${bodySizeRem}rem;--body-leading:${bodyLineHeight};color-scheme:light}[data-theme="dark"]{${palette("dark")};color-scheme:dark}`;
}

import type { MetadataRoute } from "next";

const BASE_URL = "https://kagenime.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().split("T")[0];

  return [
    { url: BASE_URL + "/", lastModified: today },
    { url: BASE_URL + "/anime", lastModified: today },
    { url: BASE_URL + "/anime/schedule", lastModified: today },
    { url: BASE_URL + "/anime/genres", lastModified: today },
    { url: BASE_URL + "/manga", lastModified: today },
    { url: BASE_URL + "/webtoon", lastModified: today },
    { url: BASE_URL + "/webtoon/original", lastModified: today },
    { url: BASE_URL + "/webtoon/canvas", lastModified: today },
    { url: BASE_URL + "/search", lastModified: today },
    { url: BASE_URL + "/library", lastModified: today },
    { url: BASE_URL + "/settings", lastModified: today }
  ];
}

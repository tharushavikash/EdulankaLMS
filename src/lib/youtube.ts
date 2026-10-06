/** Extracts a YouTube video ID from most common URL shapes. Returns null if not found. */
export function extractYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Bare ID
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  const isYoutube =
    host === "youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube.com");
  if (!isYoutube) return null;

  const validate = (id: string | null | undefined) =>
    id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;

  if (host === "youtu.be") {
    return validate(url.pathname.split("/").filter(Boolean)[0]);
  }

  const v = url.searchParams.get("v");
  if (v) return validate(v);

  const parts = url.pathname.split("/").filter(Boolean);
  const markers = ["embed", "shorts", "live", "v", "e"];
  for (let i = 0; i < parts.length; i++) {
    if (markers.includes(parts[i]) && parts[i + 1]) {
      return validate(parts[i + 1]);
    }
  }
  return null;
}

export function youtubeThumbnail(id: string, quality: "hq" | "mq" | "max" = "hq") {
  const file = quality === "max" ? "maxresdefault" : quality === "mq" ? "mqdefault" : "hqdefault";
  return `https://img.youtube.com/vi/${id}/${file}.jpg`;
}

export function youtubeEmbedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

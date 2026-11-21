const YOUTUBE_HOST_RE = /^(www\.|m\.|music\.)?youtube\.com$/i;
const SHORT_HOST_RE = /^(www\.)?youtu\.be$/i;
const VIDEO_ID_RE = /^[\w-]{11}$/;

/**
 * Validate a YouTube Short or video link: youtube.com/shorts/<id>, /watch?v=<id>, /live/<id>, youtu.be/<id>.
 * Returns { url, videoId, isShort }. Throws "Not a YouTube link" otherwise.
 */
export function parseYouTubeUrl(input) {
  const raw = String(input).trim();
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);

  let videoId = null;
  let isShort = false;
  if (SHORT_HOST_RE.test(url.hostname)) {
    videoId = url.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOST_RE.test(url.hostname)) {
    const [, first, second] = url.pathname.split("/");
    if (first === "shorts" || first === "live" || first === "embed") {
      videoId = second ?? null;
      isShort = first === "shorts";
    } else if (first === "watch") {
      videoId = url.searchParams.get("v");
    }
  }

  if (!videoId || !VIDEO_ID_RE.test(videoId)) throw new Error("Not a YouTube link");
  return {
    url: isShort ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}`,
    videoId,
    isShort,
  };
}

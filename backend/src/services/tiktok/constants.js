/** Hosts we accept as TikTok links. */
export const TIKTOK_HOST_RE = /(^|\.)tiktok\.com$/i;

/** Short share links that redirect to the full video URL: vm.tiktok.com/xxx, vt.tiktok.com/xxx, tiktok.com/t/xxx */
export const SHORT_LINK_RE = /^(vm|vt)\.tiktok\.com$/i;
export const SHORT_PATH_RE = /^\/t\//i;

/** /@user/video/1234567890 (also /photo/ for slideshow posts) */
export const VIDEO_PATH_RE = /^\/@([\w.-]+)\/(?:video|photo)\/(\d+)/i;

export const OEMBED_ENDPOINT = "https://www.tiktok.com/oembed";
export const MAX_REDIRECTS = 5;

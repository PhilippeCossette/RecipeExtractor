import { downloadMedia } from "../../../utils/index.js";
import { fetchTikTokVideo } from "./fetchTikTokVideo.js";

/** What /tiktok uses to talk to the paid TikTok API and download videos. Tests swap these for fakes. */
export const tiktokProvider = {
  fetchVideo: fetchTikTokVideo,
  downloadVideo: (videoUrl) => downloadMedia(videoUrl, { filename: "tiktok.mp4" }),
};

/** Replace one or both functions (tests). */
export function setTikTokProvider(replacement) {
  Object.assign(tiktokProvider, replacement);
}

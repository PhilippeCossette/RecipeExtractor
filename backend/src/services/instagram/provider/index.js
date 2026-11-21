import { downloadMedia } from "../../../utils/index.js";
import { fetchInstagramPost } from "./fetchInstagramPost.js";
import { fetchInstagramTranscript } from "./fetchInstagramTranscript.js";

/** What /instagram uses to talk to the paid API and download videos. Tests swap these for fakes. */
export const instagramProvider = {
  fetchPost: fetchInstagramPost,
  fetchTranscript: fetchInstagramTranscript,
  downloadVideo: (videoUrl) => downloadMedia(videoUrl, { filename: "instagram.mp4" }),
};

/** Replace some functions (tests). */
export function setInstagramProvider(replacement) {
  Object.assign(instagramProvider, replacement);
}

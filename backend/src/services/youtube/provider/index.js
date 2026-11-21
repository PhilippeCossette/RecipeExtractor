import { fetchYouTubeTranscript } from "./fetchYouTubeTranscript.js";
import { fetchYouTubeVideo } from "./fetchYouTubeVideo.js";

/** What /youtube uses to talk to the paid API. Tests swap these for fakes. */
export const youtubeProvider = {
  fetchVideo: fetchYouTubeVideo,
  fetchTranscript: fetchYouTubeTranscript,
};

/** Replace some functions (tests). */
export function setYouTubeProvider(replacement) {
  Object.assign(youtubeProvider, replacement);
}

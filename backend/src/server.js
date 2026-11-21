import { createApp } from "./app.js";
import { config } from "./config/index.js";

createApp().listen(config.port, () => {
  console.log(`Recipe API on http://localhost:${config.port}`);
  console.log(`Try: http://localhost:${config.port}/extract?url=https://www.bbcgoodfood.com/recipes/easy-pancakes`);
});

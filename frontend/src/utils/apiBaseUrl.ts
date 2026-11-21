/** Where the recipe API runs. Override with VITE_API_URL in .env. */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Base URL for the backend API.
//   ''                              -> same-origin (local dev via dev:all / Vite proxy)
//   https://your-api.onrender.com   -> hosted backend (set VITE_API_BASE on the static site)
// A bare host (no scheme) is upgraded to https://.
const raw = (import.meta.env.VITE_API_BASE ?? '').trim().replace(/\/+$/, '')
export const API_BASE = raw && !/^https?:\/\//i.test(raw) ? `https://${raw}` : raw

/**
 * Demo mode swaps Supabase for an in-memory backend seeded with sample data.
 * Enable with VITE_DEMO=true at build time, or ?demo in the URL.
 */
export const IS_DEMO =
  import.meta.env.VITE_DEMO === 'true' ||
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo'));

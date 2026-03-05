export const env = {
  apiMode: process.env.EXPO_PUBLIC_API_MODE ?? "local",
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "replace-me",
};

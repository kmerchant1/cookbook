import type { CapacitorConfig } from '@capacitor/cli'

// Capacitor wraps the same Vite build into iOS/Android shells (README "Native
// wrapper"). Run `npx cap add ios` / `npx cap add android` once, then
// `npm run build && npx cap sync` to ship the web build into the native apps.
const config: CapacitorConfig = {
  appId: 'app.cookbook.mobile',
  appName: 'cookbook',
  webDir: 'dist',
  backgroundColor: '#faf6f0',
  ios: {
    contentInset: 'always',
  },
  server: {
    // Allow the in-app webview to reach the deployed /api importer + Supabase.
    androidScheme: 'https',
  },
}

export default config

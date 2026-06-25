import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.dailyliketrees.app',
  appName: '如树日常',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Android: allow cleartext for dev; Capacitor wraps localhost internally
    androidScheme: 'https',
  },
  android: {
    // Allow IndexedDB / localStorage persistence
    allowMixedContent: false,
  },
}

export default config

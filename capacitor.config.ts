import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1b9180d79aad4fe4b3993dafed5953ea',
  appName: 'Mosaic Stream',
  webDir: 'dist',
  server: {
    url: 'https://1b9180d7-9aad-4fe4-b399-3dafed5953ea.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#00000000',
      overlaysWebView: true
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      showSpinner: false
    },
    ScreenOrientation: {
      // Lock to portrait by default
    }
  },
  android: {
    // Enable edge-to-edge immersive display
    backgroundColor: '#00000000',
    allowMixedContent: true,
    // Enable fullscreen/immersive mode
    webContentsDebuggingEnabled: false
  },
  ios: {
    backgroundColor: '#0f172a',
    contentInset: 'always',
    // iOS edge-to-edge
    preferredContentMode: 'mobile'
  }
};

export default config;

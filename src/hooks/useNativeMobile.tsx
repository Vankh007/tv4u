import { Capacitor } from '@capacitor/core';

/**
 * Hook to detect if the app is running as a native mobile app (Android/iOS)
 * Returns true ONLY for native apps, not for web viewed on mobile browsers
 */
export function useNativeMobile() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isAndroid = platform === 'android';
  const isIOS = platform === 'ios';
  
  return {
    isNative,
    isAndroid,
    isIOS,
    platform,
  };
}

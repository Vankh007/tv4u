import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';

/**
 * Hook to enable immersive mode (hide navigation/status bars) on mobile devices
 * Works with both web and Capacitor native apps
 */
export const useImmersiveMode = () => {
  const isNative = Capacitor.isNativePlatform();
  const immersiveModeRef = useRef(false);

  // Enter immersive mode - hide system UI
  const enterImmersiveMode = useCallback(async () => {
    try {
      if (isNative) {
        // Hide status bar
        await StatusBar.hide();
        
        // Set status bar overlay (content goes behind it when visible)
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // For Android, we need to use Android's native immersive mode
        // This hides both status bar and navigation bar
        if (Capacitor.getPlatform() === 'android') {
          // Use Android-specific immersive flags via JavaScript bridge
          const { Plugins } = (window as any).Capacitor || {};
          
          // Try to hide navigation bar using custom plugin or native bridge
          if ((window as any).AndroidFullScreen) {
            (window as any).AndroidFullScreen.immersiveMode();
          }
          
          // Apply CSS to handle edge-to-edge display
          document.documentElement.style.setProperty('--android-nav-height', '0px');
          document.body.classList.add('immersive-mode');
        }
        
        immersiveModeRef.current = true;
      }
      
      // Apply CSS to fill safe areas for all platforms
      document.body.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
      document.body.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
      document.body.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
      document.body.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
      
    } catch (error) {
      console.log('Immersive mode not fully supported:', error);
    }
  }, [isNative]);

  // Exit immersive mode - show system UI
  const exitImmersiveMode = useCallback(async () => {
    try {
      if (isNative) {
        await StatusBar.show();
        
        if (Capacitor.getPlatform() === 'android') {
          if ((window as any).AndroidFullScreen) {
            (window as any).AndroidFullScreen.showSystemUI();
          }
          document.body.classList.remove('immersive-mode');
        }
        
        immersiveModeRef.current = false;
      }
    } catch (error) {
      console.log('Exit immersive mode error:', error);
    }
  }, [isNative]);

  // Enter fullscreen for video player - landscape + hide all system UI
  const enterFullscreenMode = useCallback(async () => {
    try {
      if (isNative) {
        // Hide status bar
        await StatusBar.hide();
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // Lock to landscape
        await ScreenOrientation.lock({ orientation: 'landscape' });
        
        // Android specific: enter full immersive mode
        if (Capacitor.getPlatform() === 'android') {
          if ((window as any).AndroidFullScreen) {
            (window as any).AndroidFullScreen.immersiveMode();
          }
          
          // Fallback: Use CSS to extend into system UI areas
          document.documentElement.style.setProperty('--android-nav-height', '0px');
          document.body.classList.add('fullscreen-mode');
        }
        
        // Also request browser fullscreen if available
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (e) {
          console.log('Browser fullscreen not available');
        }
      } else {
        // Web: Use Fullscreen API + orientation lock
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
          const orientation = screen.orientation as any;
          if (orientation?.lock) {
            await orientation.lock('landscape');
          }
        } catch (e) {
          console.log('Web fullscreen/orientation not supported');
        }
      }
    } catch (error) {
      console.log('Enter fullscreen mode error:', error);
    }
  }, [isNative]);

  // Exit fullscreen for video player - portrait + show system UI
  const exitFullscreenMode = useCallback(async () => {
    try {
      if (isNative) {
        // Exit browser fullscreen first
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
          }
        } catch (e) {
          console.log('Exit browser fullscreen error');
        }
        
        // Unlock orientation and lock back to portrait
        await ScreenOrientation.lock({ orientation: 'portrait' });
        
        // Keep status bar hidden in app (immersive app mode)
        await StatusBar.hide();
        
        if (Capacitor.getPlatform() === 'android') {
          document.body.classList.remove('fullscreen-mode');
          document.body.classList.add('immersive-mode');
        }
      } else {
        // Web: Exit fullscreen and unlock orientation
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
          }
          const orientation = screen.orientation as any;
          if (orientation?.unlock) {
            orientation.unlock();
          }
        } catch (e) {
          console.log('Web exit fullscreen error');
        }
      }
    } catch (error) {
      console.log('Exit fullscreen mode error:', error);
    }
  }, [isNative]);

  // Lock orientation to portrait (for app) or landscape (for player fullscreen)
  const lockOrientation = useCallback(async (orientation: 'portrait' | 'landscape') => {
    try {
      if (isNative) {
        await ScreenOrientation.lock({ orientation });
        return true;
      }
      
      // For web: Use Screen Orientation API
      const screenOrientation = screen.orientation as any;
      if (screenOrientation?.lock) {
        await screenOrientation.lock(orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary');
        return true;
      }
    } catch (error) {
      console.log('Orientation lock not supported:', error);
    }
    return false;
  }, [isNative]);

  // Unlock orientation
  const unlockOrientation = useCallback(async () => {
    try {
      if (isNative) {
        await ScreenOrientation.unlock();
        return true;
      }
      
      // For web
      const screenOrientation = screen.orientation as any;
      if (screenOrientation?.unlock) {
        screenOrientation.unlock();
        return true;
      }
    } catch (error) {
      console.log('Orientation unlock not supported:', error);
    }
    return false;
  }, [isNative]);

  // Initialize immersive mode on mount
  useEffect(() => {
    const init = async () => {
      // Enter immersive mode
      await enterImmersiveMode();
      
      // Lock to portrait by default for the app
      await lockOrientation('portrait');
    };
    
    init();
    
    // Handle app resume - re-enter immersive mode
    const handleResume = () => {
      if (immersiveModeRef.current) {
        enterImmersiveMode();
      }
    };
    
    document.addEventListener('resume', handleResume);
    
    return () => {
      document.removeEventListener('resume', handleResume);
    };
  }, [enterImmersiveMode, lockOrientation]);

  return {
    enterImmersiveMode,
    exitImmersiveMode,
    enterFullscreenMode,
    exitFullscreenMode,
    lockOrientation,
    unlockOrientation,
    isNative,
  };
};

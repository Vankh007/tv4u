import { useEffect, useRef, useCallback, useState } from 'react';

interface PinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  enabled?: boolean;
}

interface PinchZoomResult {
  scale: number;
  translateX: number;
  translateY: number;
  isPinching: boolean;
  resetZoom: () => void;
}

/**
 * Hook to enable pinch-to-zoom functionality (like Telegram video)
 */
export const usePinchZoom = (
  containerRef: React.RefObject<HTMLElement>,
  options: PinchZoomOptions = {}
): PinchZoomResult => {
  const { minScale = 1, maxScale = 4, enabled = true } = options;
  
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const lastScale = useRef(1);
  
  // For pan while zoomed
  const lastTouchX = useRef(0);
  const lastTouchY = useRef(0);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (touch1: Touch, touch2: Touch) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  });

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);
        initialDistance.current = getDistance(e.touches[0], e.touches[1]);
        initialScale.current = lastScale.current;
      } else if (e.touches.length === 1 && lastScale.current > 1) {
        // Single touch pan when zoomed
        lastTouchX.current = e.touches[0].clientX;
        lastTouchY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scaleChange = currentDistance / initialDistance.current;
        let newScale = initialScale.current * scaleChange;
        
        // Clamp scale
        newScale = Math.max(minScale, Math.min(maxScale, newScale));
        
        setScale(newScale);
        lastScale.current = newScale;
        
      } else if (e.touches.length === 1 && lastScale.current > 1) {
        // Pan while zoomed
        e.preventDefault();
        const deltaX = e.touches[0].clientX - lastTouchX.current;
        const deltaY = e.touches[0].clientY - lastTouchY.current;
        
        const newTranslateX = lastTranslateX.current + deltaX;
        const newTranslateY = lastTranslateY.current + deltaY;
        
        // Limit panning based on scale
        const containerRect = container.getBoundingClientRect();
        const maxPanX = (containerRect.width * (lastScale.current - 1)) / 2;
        const maxPanY = (containerRect.height * (lastScale.current - 1)) / 2;
        
        const clampedX = Math.max(-maxPanX, Math.min(maxPanX, newTranslateX));
        const clampedY = Math.max(-maxPanY, Math.min(maxPanY, newTranslateY));
        
        setTranslateX(clampedX);
        setTranslateY(clampedY);
        
        lastTouchX.current = e.touches[0].clientX;
        lastTouchY.current = e.touches[0].clientY;
        lastTranslateX.current = clampedX;
        lastTranslateY.current = clampedY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        setIsPinching(false);
        
        // Reset if scale is close to 1
        if (lastScale.current < 1.1) {
          resetZoom();
        }
      }
      
      if (e.touches.length === 1) {
        lastTouchX.current = e.touches[0].clientX;
        lastTouchY.current = e.touches[0].clientY;
      }
    };

    // Double-tap to reset zoom
    let lastTapTime = 0;
    const handleDoubleTap = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        if (tapLength < 300 && tapLength > 0) {
          e.preventDefault();
          if (lastScale.current > 1) {
            resetZoom();
          } else {
            // Zoom to 2x on double-tap
            setScale(2);
            lastScale.current = 2;
          }
        }
        lastTapTime = currentTime;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchstart', handleDoubleTap, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchstart', handleDoubleTap);
    };
  }, [enabled, minScale, maxScale, resetZoom, containerRef]);

  return {
    scale,
    translateX,
    translateY,
    isPinching,
    resetZoom,
  };
};

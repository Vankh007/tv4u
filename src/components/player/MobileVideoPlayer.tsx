import { useEffect, useRef, useState, useCallback } from "react";
// @ts-ignore - shaka-player types
import shaka from "shaka-player";
import { Button } from "@/components/ui/button";
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  ChevronDown,
  ListVideo,
  RotateCcw
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { usePinchZoom } from "@/hooks/usePinchZoom";
import { EpisodeListDrawer } from "./EpisodeListDrawer";

interface VideoSource {
  id: string;
  server_name: string;
  source_type: string;
  type?: "mp4" | "hls" | "dash" | "embed" | "iframe";
  url?: string;
  quality_urls?: Record<string, string>;
  quality?: string;
  is_default?: boolean;
}

interface Episode {
  id: string;
  episode_number: number;
  title?: string;
  thumbnail_url?: string;
}

interface MobileVideoPlayerProps {
  videoUrl: string;
  poster?: string;
  autoplay?: boolean;
  onBack?: () => void;
  onEnded?: () => void;
  episodes?: Episode[];
  currentEpisodeId?: string;
  onEpisodeSelect?: (episode: Episode) => void;
  title?: string;
  sourceType?: "mp4" | "hls" | "dash";
  onProgressUpdate?: (progress: number, duration: number) => void;
  initialProgress?: number;
  seriesBackdrop?: string;
}

export const MobileVideoPlayer = ({
  videoUrl,
  poster,
  autoplay = false,
  onBack,
  onEnded,
  episodes = [],
  currentEpisodeId,
  onEpisodeSelect,
  title,
  sourceType = "hls",
  onProgressUpdate,
  initialProgress,
  seriesBackdrop,
}: MobileVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousVideoUrlRef = useRef<string>("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';

  // Pinch-to-zoom like Telegram
  const { scale, translateX, translateY, isPinching, resetZoom } = usePinchZoom(
    containerRef as React.RefObject<HTMLElement>,
    { minScale: 1, maxScale: 4, enabled: isFullscreen }
  );

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Detect source type from URL if needed
  const detectSourceType = (url: string, providedType?: string): "mp4" | "hls" | "dash" => {
    if (providedType === "mp4" || providedType === "hls" || providedType === "dash") {
      return providedType;
    }
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.m3u8')) return "hls";
    if (lowerUrl.includes('.mpd')) return "dash";
    if (lowerUrl.includes('.mp4')) return "mp4";
    return "hls"; // Default to HLS
  };

  // Initialize Shaka Player with smooth transitions
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    const initPlayer = async () => {
      // Smooth transition: show loading overlay but don't flicker
      const isNewVideo = previousVideoUrlRef.current !== videoUrl;
      if (isNewVideo && previousVideoUrlRef.current) {
        setIsTransitioning(true);
        // Pause and reset current video first
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
      setIsLoading(true);
      setIsPlaying(false);
      previousVideoUrlRef.current = videoUrl;
      
      // Cleanup existing player
      if (playerRef.current) {
        try {
          await playerRef.current.destroy();
          playerRef.current = null;
        } catch (e) {
          console.log('Player cleanup error:', e);
        }
      }

      shaka.polyfill.installAll();
      
      if (!shaka.Player.isBrowserSupported()) {
        console.error('Shaka Player not supported');
        setIsLoading(false);
        setIsTransitioning(false);
        return;
      }

      const player = new shaka.Player(videoRef.current);
      playerRef.current = player;

      player.addEventListener('error', (event: any) => {
        console.error('Shaka Player error:', event.detail);
        setIsLoading(false);
        setIsTransitioning(false);
      });

      try {
        const detectedType = detectSourceType(videoUrl, sourceType);
        console.log('[MobileVideoPlayer] Loading video:', { url: videoUrl.substring(0, 50) + '...', type: detectedType });
        
        await player.load(videoUrl);
        setIsLoading(false);
        
        // Smooth transition complete
        setTimeout(() => setIsTransitioning(false), 150);
        
        if (initialProgress && videoRef.current) {
          videoRef.current.currentTime = initialProgress;
        }
        
        // Do not autoplay - user must click play button
        if (autoplay && videoRef.current) {
          videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
        }
      } catch (error) {
        console.error('Error loading video:', error);
        setIsLoading(false);
        setIsTransitioning(false);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoUrl, autoplay, initialProgress, sourceType]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
      if (onProgressUpdate) {
        onProgressUpdate(video.currentTime, video.duration);
      }
    };
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => onEnded?.();
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [onEnded, onProgressUpdate]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  }, [isPlaying]);

  // Player controls
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    resetControlsTimeout();
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    resetControlsTimeout();
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  // Fullscreen handling for mobile
  const toggleFullscreen = async () => {
    try {
      if (isNative) {
        if (!isFullscreen) {
          // Entering fullscreen
          document.body.classList.add('video-fullscreen');
          await StatusBar.hide();
          await ScreenOrientation.lock({ orientation: 'landscape' });
          if (isAndroid && (window as any).AndroidFullScreen) {
            (window as any).AndroidFullScreen.immersiveMode();
          }
          setIsFullscreen(true);
        } else {
          // Exiting fullscreen
          document.body.classList.remove('video-fullscreen');
          await StatusBar.show();
          await ScreenOrientation.lock({ orientation: 'portrait' });
          if (isAndroid && (window as any).AndroidFullScreen) {
            (window as any).AndroidFullScreen.showSystemUI();
          }
          setIsFullscreen(false);
        }
      } else {
        // Web fallback
        if (!isFullscreen && containerRef.current?.requestFullscreen) {
          document.body.classList.add('video-fullscreen');
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else if (document.fullscreenElement && document.exitFullscreen) {
          document.body.classList.remove('video-fullscreen');
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.log('Fullscreen toggle error:', error);
    }
    resetControlsTimeout();
  };

  // Cleanup fullscreen class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('video-fullscreen');
    };
  }, []);

  const handleScreenTap = () => {
    resetControlsTimeout();
  };

  // Double-tap to seek
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  
  const handleDoubleTap = (e: React.TouchEvent) => {
    const now = Date.now();
    const tapX = e.touches[0]?.clientX || 0;
    const containerWidth = containerRef.current?.clientWidth || 0;
    
    if (now - lastTapRef.current.time < 300) {
      // Double tap detected
      if (tapX < containerWidth / 2) {
        skipBackward();
      } else {
        skipForward();
      }
    }
    lastTapRef.current = { time: now, x: tapX };
  };

  // Handle episode selection with smooth transition
  const handleEpisodeSelectInternal = (episode: Episode) => {
    if (onEpisodeSelect) {
      setIsTransitioning(true);
      resetZoom();
      onEpisodeSelect(episode);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`mobile-video-player relative bg-black ${
        isFullscreen 
          ? 'fixed inset-0 z-[9999] w-screen h-screen' 
          : 'w-full aspect-video native-portrait-safe'
      } ${isTransitioning ? 'video-transitioning' : ''}`}
      onClick={handleScreenTap}
      onTouchStart={handleDoubleTap}
      style={isFullscreen ? { 
        width: '100vw', 
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
      } : undefined}
    >
      {/* Video Element with pinch-zoom transform */}
      <video
        ref={videoRef}
        className={`${isFullscreen ? 'w-screen h-screen' : 'w-full h-full'} object-contain transition-transform duration-100`}
        poster={poster}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        style={isFullscreen ? { 
          width: '100vw', 
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          objectFit: 'contain',
          transform: scale > 1 ? `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)` : undefined,
          transformOrigin: 'center center',
        } : undefined}
      />

      {/* Loading Spinner / Transition Overlay */}
      {(isLoading || isTransitioning) && (
        <div className={`absolute inset-0 flex items-center justify-center z-30 transition-opacity duration-200 ${isTransitioning ? 'bg-black/80' : 'bg-black/50'}`}>
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full z-40">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3 flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="h-10 w-10 text-white hover:bg-white/10"
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
          )}
          {title && (
            <span className="text-white text-sm font-medium truncate flex-1">{title}</span>
          )}
        </div>

        {/* Center Controls */}
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          {/* Skip Back */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              skipBackward();
            }}
            className="h-14 w-14 text-white hover:bg-white/10 active:scale-95 transition-transform"
          >
            <SkipBack className="h-7 w-7" fill="currentColor" />
          </Button>

          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="h-16 w-16 rounded-full bg-white/20 text-white hover:bg-white/30 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" fill="currentColor" />
            ) : (
              <Play className="h-8 w-8 ml-1" fill="currentColor" />
            )}
          </Button>

          {/* Skip Forward */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              skipForward();
            }}
            className="h-14 w-14 text-white hover:bg-white/10 active:scale-95 transition-transform"
          >
            <SkipForward className="h-7 w-7" fill="currentColor" />
          </Button>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 space-y-2">
          {/* Progress Bar */}
          <div className="relative h-1 bg-white/30 rounded-full overflow-hidden touch-none">
            {/* Buffered */}
            <div 
              className="absolute h-full bg-white/50"
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
            {/* Progress */}
            <div 
              className="absolute h-full bg-cyan-500"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Seek Input */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={(e) => handleSeek([parseFloat(e.target.value)])}
              className="absolute inset-0 w-full h-8 -top-3 opacity-0 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Control Buttons Row */}
          <div className="flex items-center justify-between">
            {/* Left: Time */}
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right: Buttons */}
            <div className="flex items-center gap-1">
              {/* Mute */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="h-9 w-9 text-white hover:bg-white/10"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>

              {/* Episodes (if available) */}
              {episodes.length > 1 && onEpisodeSelect && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEpisodeDrawer(true);
                  }}
                  className="h-9 w-9 text-white hover:bg-white/10"
                >
                  <ListVideo className="h-5 w-5" />
                </Button>
              )}

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="h-9 w-9 text-white hover:bg-white/10"
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Episode Drawer - use the shared component */}
      {showEpisodeDrawer && episodes.length > 0 && onEpisodeSelect && (
        <EpisodeListDrawer
          episodes={episodes}
          currentEpisodeId={currentEpisodeId}
          onEpisodeSelect={handleEpisodeSelectInternal}
          onClose={() => setShowEpisodeDrawer(false)}
          seriesThumbnail={seriesBackdrop}
        />
      )}
    </div>
  );
};

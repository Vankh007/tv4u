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
}: MobileVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize Shaka Player
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    const initPlayer = async () => {
      setIsLoading(true);
      
      if (playerRef.current) {
        await playerRef.current.destroy();
      }

      shaka.polyfill.installAll();
      
      if (!shaka.Player.isBrowserSupported()) {
        console.error('Shaka Player not supported');
        return;
      }

      const player = new shaka.Player(videoRef.current);
      playerRef.current = player;

      player.addEventListener('error', (event: any) => {
        console.error('Shaka Player error:', event.detail);
      });

      try {
        await player.load(videoUrl);
        setIsLoading(false);
        
        if (initialProgress && videoRef.current) {
          videoRef.current.currentTime = initialProgress;
        }
        
        if (autoplay && videoRef.current) {
          videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
        }
      } catch (error) {
        console.error('Error loading video:', error);
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoUrl, autoplay, initialProgress]);

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
          await StatusBar.hide();
          await ScreenOrientation.lock({ orientation: 'landscape' });
          if (isAndroid && (window as any).AndroidFullScreen) {
            (window as any).AndroidFullScreen.immersiveMode();
          }
        } else {
          await StatusBar.show();
          await ScreenOrientation.lock({ orientation: 'portrait' });
          if (isAndroid && (window as any).AndroidFullScreen) {
            (window as any).AndroidFullScreen.showSystemUI();
          }
        }
        setIsFullscreen(!isFullscreen);
      } else {
        // Web fallback
        if (!isFullscreen && containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.log('Fullscreen toggle error:', error);
    }
    resetControlsTimeout();
  };

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

  return (
    <div 
      ref={containerRef}
      className={`mobile-video-player relative bg-black w-full ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'aspect-video'}`}
      onClick={handleScreenTap}
      onTouchStart={handleDoubleTap}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
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

      {/* Episode Drawer (simplified for mobile) */}
      {showEpisodeDrawer && episodes.length > 0 && onEpisodeSelect && (
        <div 
          className="absolute inset-0 bg-black/90 z-50 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-white font-medium">Episodes</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEpisodeDrawer(false)}
              className="h-8 w-8 text-white"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => {
                  onEpisodeSelect(episode);
                  setShowEpisodeDrawer(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  currentEpisodeId === episode.id
                    ? 'bg-cyan-500/20 border border-cyan-500'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {episode.thumbnail_url && (
                  <img 
                    src={episode.thumbnail_url} 
                    alt=""
                    className="w-20 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 text-left">
                  <span className="text-white text-sm font-medium">
                    Episode {episode.episode_number}
                  </span>
                  {episode.title && (
                    <p className="text-white/60 text-xs truncate">{episode.title}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

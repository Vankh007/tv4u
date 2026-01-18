import { ShakaPlayer } from "./ShakaPlayer";
import { MobileVideoPlayer } from "./player/MobileVideoPlayer";
import { Database } from "@/integrations/supabase/types";
import { useNativeMobile } from "@/hooks/useNativeMobile";
import { useProtectedVideoUrl } from "@/hooks/useProtectedVideoUrl";
import { useSubscription } from "@/hooks/useSubscription";
import { useRental } from "@/hooks/useRental";
import { useMemo, useState, useEffect } from "react";

type VideoSourceDB = Database['public']['Tables']['video_sources']['Row'];

interface VideoSource {
  id: string;
  url?: string;
  quality?: string;
  is_default?: boolean;
  server_name: string;
  source_type?: string;
  quality_urls?: Record<string, string> | null;
}

interface Episode {
  id: string;
  episode_number: number;
  name: string;
  still_path?: string;
  access?: 'free' | 'rent' | 'vip';
}

interface VideoPlayerProps {
  videoSources: VideoSourceDB[];
  onEpisodeSelect?: (episodeId: string) => void;
  episodes?: Episode[];
  currentEpisodeId?: string;
  contentBackdrop?: string;
  // Access control props
  accessType?: 'free' | 'rent' | 'vip';
  excludeFromPlan?: boolean;
  rentalPrice?: number;
  rentalPeriodDays?: number;
  mediaId?: string;
  mediaType?: 'movie' | 'series' | 'anime';
  title?: string;
  movieId?: string;
  onMinimize?: () => void;
  trailerUrl?: string;
}

const VideoPlayer = ({ 
  videoSources, 
  onEpisodeSelect, 
  episodes,
  currentEpisodeId,
  contentBackdrop,
  accessType,
  excludeFromPlan,
  rentalPrice,
  rentalPeriodDays,
  mediaId,
  mediaType,
  title,
  movieId,
  onMinimize,
  trailerUrl,
}: VideoPlayerProps) => {
  const { isNative, isAndroid } = useNativeMobile();
  const { getProtectedUrl, loading: protectedUrlLoading } = useProtectedVideoUrl();
  const { hasActiveSubscription } = useSubscription();
  
  const rentalCheckId = currentEpisodeId ? mediaId : movieId;
  const rentalCheckType = currentEpisodeId ? 'series' : movieId ? 'movie' : undefined;
  const { hasActiveRental } = useRental(rentalCheckId, rentalCheckType);
  
  const currentEpisode = episodes?.find(ep => ep.id === currentEpisodeId);
  
  // Use episode-level access if available, otherwise fall back to content-level access
  const effectiveAccessType = currentEpisode?.access || accessType;
  
  // State for mobile player video URL
  const [mobileVideoUrl, setMobileVideoUrl] = useState<string | null>(null);
  const [mobileSourceType, setMobileSourceType] = useState<"mp4" | "hls" | "dash">("hls");

  // Convert DB types to component types
  const convertedSources: VideoSource[] = videoSources.map(source => ({
    id: source.id,
    url: source.url,
    quality: source.quality,
    is_default: source.is_default,
    server_name: source.server_name,
    source_type: source.source_type,
    quality_urls: source.quality_urls as Record<string, string> | null
  }));
  
  // Convert episodes to player format
  const playerEpisodes = episodes?.map(ep => ({
    id: ep.id,
    episode_number: ep.episode_number,
    title: ep.name,
    thumbnail_url: ep.still_path,
  })) || [];

  const handleEpisodeSelect = (episode: { id: string; episode_number: number }) => {
    if (onEpisodeSelect) {
      onEpisodeSelect(episode.id);
    }
  };

  // Check if user has access to content
  const hasAccess = useMemo(() => {
    if (effectiveAccessType === 'free') return true;
    if (effectiveAccessType === 'rent' && excludeFromPlan) {
      return hasActiveRental;
    }
    if (effectiveAccessType === 'rent' && !excludeFromPlan) {
      return hasActiveSubscription || hasActiveRental;
    }
    if (effectiveAccessType === 'vip') {
      return hasActiveSubscription;
    }
    return false;
  }, [effectiveAccessType, excludeFromPlan, hasActiveSubscription, hasActiveRental]);

  // For native Android, get the video URL for mobile player
  useEffect(() => {
    if (!isNative || !isAndroid || !hasAccess) {
      setMobileVideoUrl(null);
      return;
    }

    const fetchVideoUrl = async () => {
      // Find the default source or first available
      const defaultSource = convertedSources.find(s => s.is_default) || convertedSources[0];
      
      if (!defaultSource) {
        setMobileVideoUrl(null);
        return;
      }

      // Determine source type
      const sourceType = (defaultSource.source_type || "").toLowerCase();
      if (sourceType === "hls" || sourceType === "m3u8") {
        setMobileSourceType("hls");
      } else if (sourceType === "dash") {
        setMobileSourceType("dash");
      } else if (sourceType === "mp4") {
        setMobileSourceType("mp4");
      } else {
        setMobileSourceType("hls");
      }

      // For free content, use URL directly
      if (effectiveAccessType === 'free') {
        if (defaultSource.url) {
          setMobileVideoUrl(defaultSource.url);
        } else if (defaultSource.quality_urls) {
          const firstUrl = Object.values(defaultSource.quality_urls)[0];
          setMobileVideoUrl(firstUrl || null);
        }
        return;
      }

      // For paid content, get protected URL
      try {
        const response = await getProtectedUrl({
          sourceId: defaultSource.id,
          episodeId: currentEpisodeId,
          movieId: movieId,
          mediaId: mediaId,
          mediaType: mediaType,
          accessType: effectiveAccessType,
          excludeFromPlan: excludeFromPlan,
        });
        
        if (response?.success && response.source?.url) {
          setMobileVideoUrl(response.source.url);
        } else if (response?.source?.quality_urls) {
          const firstUrl = Object.values(response.source.quality_urls)[0];
          setMobileVideoUrl(firstUrl || null);
        } else {
          setMobileVideoUrl(null);
        }
      } catch (error) {
        console.error('Error fetching protected URL:', error);
        setMobileVideoUrl(null);
      }
    };

    fetchVideoUrl();
  }, [isNative, isAndroid, hasAccess, convertedSources, effectiveAccessType, currentEpisodeId, movieId, mediaId, mediaType, excludeFromPlan, getProtectedUrl]);

  // Use mobile player for native Android apps
  if (isNative && isAndroid && mobileVideoUrl) {
    return (
      <div className="relative w-full aspect-video overflow-hidden">
        <MobileVideoPlayer
          videoUrl={mobileVideoUrl}
          poster={contentBackdrop || currentEpisode?.still_path}
          autoplay={false}
          onBack={onMinimize}
          title={title}
          sourceType={mobileSourceType}
          episodes={playerEpisodes}
          currentEpisodeId={currentEpisodeId}
          onEpisodeSelect={handleEpisodeSelect}
        />
      </div>
    );
  }
  
  // Use ShakaPlayer for web and non-Android platforms
  return (
    <div className="relative w-full aspect-video overflow-hidden">
      <ShakaPlayer 
        key={currentEpisodeId || movieId} // Force remount on episode change for smooth loading
        videoSources={convertedSources as any}
        poster={contentBackdrop || currentEpisode?.still_path}
        autoplay={false}
        className="w-full h-full"
        episodeId={currentEpisodeId}
        movieId={movieId}
        accessType={effectiveAccessType}
        excludeFromPlan={excludeFromPlan}
        rentalPrice={rentalPrice}
        rentalPeriodDays={rentalPeriodDays}
        mediaId={mediaId}
        mediaType={mediaType}
        title={title}
        onMinimize={onMinimize}
        trailerUrl={trailerUrl}
        episodes={playerEpisodes}
        onEpisodeSelect={handleEpisodeSelect}
        seriesThumbnail={contentBackdrop}
      />
    </div>
  );
};

export default VideoPlayer;
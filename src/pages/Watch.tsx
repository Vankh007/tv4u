import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Film, Tv, ThumbsUp, ThumbsDown, Share2, Flag, LayoutGrid, Heart, ShoppingBag, LayoutDashboard, Download, MoreVertical, Sparkles, MessageSquare, Info, ChevronDown, Wallet, Crown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentsSection } from "@/components/CommentsSection";
import { useDeviceSession } from "@/hooks/useDeviceSession";
import { DeviceLimitWarning } from "@/components/DeviceLimitWarning";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useSubscription } from "@/hooks/useSubscription";
import { CastSkeleton, EpisodesSkeleton, RecommendedSkeleton } from "@/components/watch/ContentSkeleton";
import { ActionButtons } from "@/components/watch/ActionButtons";
import { SocialShareMeta } from "@/components/SocialShareMeta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TopupDialog } from "@/components/wallet/TopupDialog";
import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import CastMemberDialog from "@/components/movie/CastMemberDialog";
import { useProfileImage } from "@/hooks/useProfileImage";

type VideoSourceDB = Database['public']['Tables']['video_sources']['Row'];

interface Episode {
  id: string;
  episode_number: number;
  name: string;
  still_path?: string;
  season_id?: string;
  access?: 'free' | 'rent' | 'vip';
}

interface Content {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  backdrop_url?: string;
  type: 'movie' | 'series';
  access?: 'free' | 'rent' | 'vip';
  exclude_from_plan?: boolean;
  rental_price?: number;
  rental_period_days?: number;
  trailer_url?: string;
}

const Watch = () => {
  const { type, id, season, episode } = useParams<{ type: string; id: string; season?: string; episode?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, loading: walletLoading } = useWallet();
  const { hasActiveSubscription, remainingDays } = useSubscription();
  
  // Device session management for streaming limits
  const { 
    sessions, 
    currentDeviceId, 
    canStream, 
    maxDevices, 
    loading: deviceSessionLoading,
    signOutDevice,
    signOutAllDevices 
  } = useDeviceSession();
  const [content, setContent] = useState<Content | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [videoSources, setVideoSources] = useState<VideoSourceDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [castMembers, setCastMembers] = useState<any[]>([]);
  const [selectedCastMember, setSelectedCastMember] = useState<any>(null);
  const [relatedContent, setRelatedContent] = useState<any[]>([]);
  const [forYouContent, setForYouContent] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<Record<string, { progress: number; duration: number }>>({});
  const [castLoading, setCastLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ display_name: string | null; profile_picture_url: string | null } | null>(null);
  const [showTopupDialog, setShowTopupDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showDeviceLimitWarning, setShowDeviceLimitWarning] = useState(false);

  // Mobile swipe scroll refs
  const mobileCastScrollRef = useSwipeScroll();
  const mobileEpisodesScrollRef = useSwipeScroll();
  const mobileForYouScrollRef = useSwipeScroll();

  // Get signed URL for profile picture
  const { signedUrl: profileImageUrl } = useProfileImage({ 
    imagePath: userProfile?.profile_picture_url,
    userId: user?.id 
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, profile_picture_url')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setUserProfile(data);
    };
    fetchProfile();
  }, [user?.id]);

  // Show device limit warning when user can't stream
  useEffect(() => {
    if (!deviceSessionLoading && !canStream && sessions.length > 0) {
      setShowDeviceLimitWarning(true);
    }
  }, [canStream, deviceSessionLoading, sessions]);

  useEffect(() => {
    if (id) {
      fetchContentAndEpisodes();
    }
  }, [id, season, episode]);

  const fetchContentAndEpisodes = async () => {
    try {
      setLoading(true);
      setCastLoading(true);
      setEpisodesLoading(true);
      
      const isMovie = type === 'movie';
      const isSeries = type === 'series' || (season && episode);
      const isNumericId = /^\d+$/.test(id || '');
      
      if (isMovie) {
        const query = supabase.from('movies').select('*');
        const { data: movieData, error: movieError } = isNumericId
          ? await query.eq('tmdb_id', id).maybeSingle()
          : await query.eq('id', id).maybeSingle();

        if (!movieError && movieData) {
          setContent({
            id: movieData.id,
            title: movieData.title,
            description: movieData.description,
            thumbnail: movieData.thumbnail,
            backdrop_url: movieData.backdrop_url,
            type: 'movie',
            access: movieData.access,
            exclude_from_plan: movieData.exclude_from_plan || false,
            rental_price: movieData.rental_price || undefined,
            rental_period_days: movieData.rental_period_days || 7,
            trailer_url: movieData.trailer_url || undefined,
          });

          const { data: sourcesData } = await supabase
            .from('video_sources')
            .select('*')
            .eq('media_id', movieData.id)
            .order('is_default', { ascending: false });

          if (sourcesData && sourcesData.length > 0) {
            setVideoSources(sourcesData);
          } else if (movieData.video_sources && Array.isArray(movieData.video_sources) && movieData.video_sources.length > 0) {
            const embeddedSources = movieData.video_sources.map((src: any, index: number) => ({
              id: `embedded-${index}`,
              media_id: movieData.id,
              episode_id: '',
              server_name: src.server || `Server ${index + 1}`,
              source_type: src.type || 'mp4',
              url: src.url || '',
              quality: src.defaultQuality || '720p',
              quality_urls: src.mp4Urls || null,
              is_default: src.isDefault || index === 0,
              language: 'en',
              permission: src.permission || 'Web & Mobile',
              version: src.version || 'free',
              created_at: movieData.created_at,
              updated_at: movieData.updated_at || movieData.created_at,
            }));
            setVideoSources(embeddedSources as any);
          }

          const { data: castData } = await supabase
            .from('movie_cast')
            .select('id, actor_name, character_name, profile_url, order_index, tmdb_id')
            .eq('movie_id', movieData.id)
            .order('order_index', { ascending: true })
            .limit(10);

          if (castData) setCastMembers(castData);
          setCastLoading(false);

          const { data: relatedData } = await supabase
            .from('movies')
            .select('id, title, thumbnail, tmdb_id, genre, rating')
            .eq('genre', movieData.genre)
            .neq('id', movieData.id)
            .order('rating', { ascending: false })
            .limit(12);
          
          if (relatedData) {
            setRelatedContent(relatedData.map(item => ({
              ...item,
              content_type: 'movie',
              poster_path: item.thumbnail
            })));
          }

          await fetchForYouContent('movie', movieData.id, movieData.genre);
        }
      } else if (isSeries) {
        const query = supabase.from('series').select('*');
        const { data: seriesData, error: seriesError } = isNumericId
          ? await query.eq('tmdb_id', id).maybeSingle()
          : await query.eq('id', id).maybeSingle();

        if (!seriesError && seriesData) {
          setContent({
            id: seriesData.id,
            title: seriesData.title,
            description: seriesData.description,
            thumbnail: seriesData.thumbnail,
            backdrop_url: seriesData.backdrop_url,
            type: 'series',
            access: seriesData.access,
            exclude_from_plan: seriesData.exclude_from_plan || false,
            rental_price: seriesData.rental_price || undefined,
            rental_period_days: seriesData.rental_period_days || 7,
            trailer_url: seriesData.trailer_url || undefined,
          });

          const { data: seasonsData } = await supabase
            .from('seasons')
            .select('*')
            .eq('media_id', seriesData.id)
            .order('season_number', { ascending: true });

          if (seasonsData && seasonsData.length > 0) {
            setSeasons(seasonsData);
            
            const targetSeasonNumber = season ? parseInt(season) : 1;
            const targetSeason = seasonsData.find(s => s.season_number === targetSeasonNumber) || seasonsData[0];
            setSelectedSeasonId(targetSeason.id);

            const { data: episodesData } = await supabase
              .from('episodes')
              .select('*')
              .eq('season_id', targetSeason.id)
              .order('episode_number', { ascending: true });

            if (episodesData && episodesData.length > 0) {
              const mappedEpisodes: Episode[] = episodesData.map(ep => ({
                id: ep.id,
                episode_number: ep.episode_number,
                name: ep.name,
                still_path: ep.still_path || undefined,
                season_id: ep.season_id,
                access: ep.access || 'free',
              }));
              setEpisodes(mappedEpisodes);

              const targetEpisodeNumber = episode ? parseInt(episode) : 1;
              const targetEpisode = mappedEpisodes.find(ep => ep.episode_number === targetEpisodeNumber) || mappedEpisodes[0];
              setCurrentEpisode(targetEpisode);

              await fetchVideoSource(targetEpisode.id);
            }
          }

          const { data: castData } = await supabase
            .from('series_cast')
            .select('id, actor_name, character_name, profile_url, order_index, tmdb_id')
            .eq('series_id', seriesData.id)
            .order('order_index', { ascending: true })
            .limit(10);

          if (castData) setCastMembers(castData);
          setCastLoading(false);

          const { data: relatedData } = await supabase
            .from('series')
            .select('id, title, thumbnail, tmdb_id, genre, rating')
            .eq('genre', seriesData.genre)
            .neq('id', seriesData.id)
            .order('rating', { ascending: false })
            .limit(12);

          if (relatedData) {
            setRelatedContent(relatedData.map(item => ({
              ...item,
              content_type: 'series',
              poster_path: item.thumbnail
            })));
          }

          await fetchForYouContent('series', seriesData.id, seriesData.genre);
        }
      }

      setEpisodesLoading(false);
      await fetchWatchHistory();
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoSource = async (episodeId: string) => {
    try {
      const targetEpisode = episodes.find(ep => ep.id === episodeId);
      if (targetEpisode) {
        setCurrentEpisode(targetEpisode);
      }

      const { data: sourcesData } = await supabase
        .from('video_sources')
        .select('*')
        .eq('episode_id', episodeId)
        .order('is_default', { ascending: false });

      if (sourcesData && sourcesData.length > 0) {
        setVideoSources(sourcesData);
      } else {
        const { data: episodeData } = await supabase
          .from('episodes')
          .select('video_sources')
          .eq('id', episodeId)
          .maybeSingle();

        if (episodeData?.video_sources && Array.isArray(episodeData.video_sources)) {
          const embeddedSources = episodeData.video_sources.map((src: any, index: number) => ({
            id: `embedded-${index}`,
            media_id: null,
            episode_id: episodeId,
            server_name: src.server || `Server ${index + 1}`,
            source_type: src.type || 'mp4',
            url: src.url || '',
            quality: src.defaultQuality || '720p',
            quality_urls: src.mp4Urls || null,
            is_default: src.isDefault || index === 0,
            language: 'en',
            permission: src.permission || 'Web & Mobile',
            version: src.version || 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          setVideoSources(embeddedSources as any);
        } else {
          setVideoSources([]);
        }
      }
    } catch (error) {
      console.error('Error fetching video source:', error);
      setVideoSources([]);
    }
  };

  const fetchForYouContent = async (contentType: string, contentId: string, genre: string) => {
    try {
      if (contentType === 'movie') {
        const { data } = await supabase
          .from('movies')
          .select('id, title, thumbnail, tmdb_id, genre, rating')
          .neq('id', contentId)
          .order('views', { ascending: false })
          .limit(8);

        if (data) {
          setForYouContent(data.map(item => ({
            ...item,
            content_type: 'movie',
            poster_path: item.thumbnail
          })));
        }
      } else {
        const { data } = await supabase
          .from('series')
          .select('id, title, thumbnail, tmdb_id, genre, rating')
          .neq('id', contentId)
          .order('views', { ascending: false })
          .limit(8);

        if (data) {
          setForYouContent(data.map(item => ({
            ...item,
            content_type: 'series',
            poster_path: item.thumbnail
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching for you content:', error);
    }
  };

  const fetchWatchHistory = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('watch_history')
        .select('episode_id, progress, duration')
        .eq('user_id', user.id)
        .not('episode_id', 'is', null);

      if (data) {
        const historyMap: Record<string, { progress: number; duration: number }> = {};
        data.forEach(item => {
          if (item.episode_id) {
            historyMap[item.episode_id] = { progress: item.progress, duration: item.duration };
          }
        });
        setWatchHistory(historyMap);
      }
    } catch (error) {
      console.error('Error fetching watch history:', error);
    }
  };

  const getProgressPercentage = (episodeId: string) => {
    const history = watchHistory[episodeId];
    if (!history || !history.duration || history.duration === 0) return 0;
    return (history.progress / history.duration) * 100;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Content Not Found</h2>
          <p className="text-muted-foreground">
            The {type} you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button variant="outline" onClick={() => navigate(type === 'movie' ? '/movies' : '/series')}>
              <Film className="mr-2 h-4 w-4" />
              Browse {type === 'movie' ? 'Movies' : 'Series'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isSeriesContent = type === 'series' || Boolean(season && episode);

  const handlePlayerCollapse = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(type === 'movie' ? '/movies' : '/series');
  };

  // Mobile-only Layout
  return (
    <>
    <div className="min-h-screen bg-background text-foreground">
      <SocialShareMeta
        title={content.title}
        description={content.description || ''}
        image={content.backdrop_url || content.thumbnail}
        type={content.type === 'movie' ? 'video.movie' : 'video.tv_show'}
      />
      {/* Sticky Video Player with safe area padding */}
      {(videoSources.length > 0 || (content?.access && content.access !== 'free')) && (
        <div 
          className="sticky top-0 z-50 bg-black"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <VideoPlayer 
            videoSources={videoSources}
            onEpisodeSelect={fetchVideoSource}
            episodes={episodes}
            currentEpisodeId={currentEpisode?.id}
            contentBackdrop={content?.backdrop_url || content?.thumbnail}
            accessType={content?.access}
            excludeFromPlan={content?.exclude_from_plan}
            rentalPrice={content?.rental_price}
            rentalPeriodDays={content?.rental_period_days}
            mediaId={content?.id}
            mediaType={content?.type}
            title={content?.title}
            movieId={content?.type === 'movie' ? content?.id : undefined}
            onMinimize={handlePlayerCollapse}
            trailerUrl={content?.trailer_url}
          />
        </div>
      )}

      {/* Scrollable Content */}
      <div className="pb-6 px-3">
        {/* User Profile with Wallet and Subscribe */}
        <div className="flex items-center gap-3 py-3">
          <Avatar className="w-12 h-12 border-2 border-primary flex-shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <AvatarImage 
              src={profileImageUrl || undefined} 
              alt={userProfile?.display_name || user?.email || 'User'}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {(userProfile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">{userProfile?.display_name || user?.email?.split('@')[0] || 'Guest'}</h1>
            <div 
              className="flex items-center gap-1 text-sm text-primary font-medium cursor-pointer hover:text-primary/80"
              onClick={() => setShowTopupDialog(true)}
            >
              <Wallet className="h-4 w-4" />
              <span>{walletLoading ? '...' : `$${balance.toFixed(2)}`}</span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className={`h-8 px-2 gap-1 ${hasActiveSubscription ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
            onClick={() => setShowSubscriptionDialog(true)}
          >
            <Crown className="h-3.5 w-3.5" />
            {hasActiveSubscription ? (
              <span className="flex items-center gap-1">
                VIP
                <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-yellow-500/20 text-yellow-600">
                  {remainingDays}d
                </Badge>
              </span>
            ) : 'VIP'}
          </Button>
        </div>

        {/* Content Poster, Title and Watching Info with Action Buttons */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="w-12 h-16 rounded-lg overflow-hidden border-2 border-muted flex-shrink-0">
            <img
              src={content?.thumbnail || "/placeholder.svg"}
              alt={content?.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">{content?.title}</h2>
            <p className="text-xs text-primary">
              {isSeriesContent && currentEpisode 
                ? `Watching S1 EP${currentEpisode.episode_number}` 
                : isSeriesContent 
                  ? `${episodes.length} Episodes`
                  : 'Watching Movie'}
            </p>
          </div>
          <ActionButtons 
            contentId={content?.id}
            contentType={content?.type}
            episodeId={currentEpisode?.id}
            userId={user?.id}
            contentTitle={content?.title}
          />
        </div>

        {/* Series Cast - Horizontal Scroll */}
        {castMembers.length > 0 && (
          <div className="mb-4 mt-3">
            <div ref={mobileCastScrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
              {castMembers.slice(0, 10).map((member, idx) => (
                <button 
                  key={idx} 
                  type="button"
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer bg-transparent border-none p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedCastMember(member);
                  }}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-muted pointer-events-none">
                    <img
                      src={member.profile_url || "/placeholder.svg"}
                      alt={member.actor_name}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                  <p className="text-xs text-center max-w-[56px] truncate pointer-events-none">
                    {member.actor_name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue={isSeriesContent ? "episodes" : "foryou"} className="w-full">
          <TabsList className="w-full justify-around border-b rounded-none h-auto p-0 bg-transparent mb-4">
            {isSeriesContent && (
              <TabsTrigger 
                value="episodes" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-3 py-2 text-xs data-[state=active]:text-red-500"
              >
                Episodes
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="foryou" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-3 py-2 text-xs data-[state=active]:text-red-500"
            >
              For You
            </TabsTrigger>
            <TabsTrigger 
              value="comments" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-3 py-2 text-xs data-[state=active]:text-red-500"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Comments
            </TabsTrigger>
            <TabsTrigger 
              value="home" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-3 py-2 text-xs data-[state=active]:text-red-500"
            >
              <Home className="w-3 h-3 mr-1" />
              Home
            </TabsTrigger>
          </TabsList>

          {/* Episodes - Horizontal Scroll */}
          {isSeriesContent && (
            <TabsContent value="episodes" className="mt-0">
              <div ref={mobileEpisodesScrollRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide scroll-smooth">
                {episodes.map((ep) => {
                  const progressPercent = getProgressPercentage(ep.id);
                  return (
                    <div
                      key={ep.id}
                      onClick={() => fetchVideoSource(ep.id)}
                      className="flex-shrink-0 w-32 cursor-pointer"
                    >
                      <div className={`relative aspect-video rounded-md overflow-hidden mb-1.5 ${
                        currentEpisode?.id === ep.id ? 'ring-2 ring-primary' : ''
                      }`}>
                        <img
                          src={ep.still_path || content?.backdrop_url || "/placeholder.svg"}
                          alt={ep.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Access Badge - Top Right */}
                        {ep.access && ep.access !== 'free' && (
                          <div className="absolute top-1 right-1">
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              ep.access === 'vip' 
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black' 
                                : 'bg-primary text-primary-foreground'
                            }`}>
                              {ep.access === 'vip' ? (
                                <Crown className="h-3 w-3" />
                              ) : (
                                <ShoppingBag className="h-3 w-3" />
                              )}
                              <span className="uppercase">{ep.access}</span>
                            </div>
                          </div>
                        )}
                        {ep.access === 'free' && (
                          <div className="absolute top-1 right-1">
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500 text-white">
                              <span>FREE</span>
                            </div>
                          </div>
                        )}
                        {/* Progress Bar */}
                        {progressPercent > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                            <div 
                              className="h-full bg-red-600 transition-all"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                          </div>
                        )}
                        {/* Large Episode Number in Bottom Corner */}
                        <div className="absolute bottom-1 left-1">
                          <span className="text-5xl font-black text-white/90 leading-none" style={{
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {ep.episode_number}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          )}

          {/* For You */}
          <TabsContent value="foryou" className="mt-0">
            <div ref={mobileForYouScrollRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide scroll-smooth">
              {forYouContent?.slice(0, 8).map((item) => (
                <div 
                  key={item.id}
                  className="flex-shrink-0 w-28 cursor-pointer"
                  onClick={() => navigate(`/watch/${item.content_type}/${item.tmdb_id}`)}
                >
                  <div className="aspect-[2/3] rounded-md overflow-hidden">
                    <img
                      src={item.poster_path || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Comments */}
          <TabsContent value="comments" className="mt-0">
            <CommentsSection 
              episodeId={currentEpisode?.id}
              movieId={content?.type === 'movie' ? content.id : undefined}
            />
          </TabsContent>

          {/* Home */}
          <TabsContent value="home" className="mt-0">
            <div className="space-y-1">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="w-full justify-start gap-3 h-11"
              >
                <Home className="h-5 w-5" />
                <span>Go Home</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="w-full justify-start gap-3 h-11"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/series')}
                className="w-full justify-start gap-3 h-11"
              >
                <Tv className="h-5 w-5" />
                <span>Series</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/movies')}
                className="w-full justify-start gap-3 h-11"
              >
                <Film className="h-5 w-5" />
                <span>Movies</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recommended Section */}
        <div className="mt-6">
          <h3 className="text-base font-semibold mb-3">Recommended</h3>
          <div className="grid grid-cols-3 gap-2">
            {relatedContent && relatedContent.length > 0 ? (
              relatedContent.slice(0, 6).map((item) => (
                <div 
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/watch/${item.content_type || 'series'}/${item.tmdb_id || item.id}`)}
                >
                  <div className="aspect-[2/3] rounded-md overflow-hidden">
                    <img
                      src={item.poster_path || item.thumbnail || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))
            ) : (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx}>
                  <div className="aspect-[2/3] rounded-md overflow-hidden bg-muted">
                    <img
                      src="/placeholder.svg"
                      alt={`Recommended ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    <TopupDialog open={showTopupDialog} onOpenChange={setShowTopupDialog} />
    <SubscriptionDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog} />
    <DeviceLimitWarning
      open={showDeviceLimitWarning}
      onOpenChange={setShowDeviceLimitWarning}
      maxDevices={maxDevices}
      activeSessions={sessions}
      currentDeviceId={currentDeviceId}
      onSignOutDevice={signOutDevice}
      onSignOutAllDevices={signOutAllDevices}
    />
    <CastMemberDialog 
      castMember={selectedCastMember} 
      isOpen={!!selectedCastMember} 
      onClose={() => setSelectedCastMember(null)}
      castType={content?.type === 'movie' ? 'movie' : 'series'}
    />
    </>
  );
};

export default Watch;

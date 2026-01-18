import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, ChevronRight } from "lucide-react";
import { useIsTablet } from "@/hooks/use-tablet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";

interface WatchItem {
  id: string;
  title: string;
  thumbnail: string;
  progress: number;
  media_type: 'movie' | 'series';
  media_id: string;
  tmdb_id?: string;
  episode_id?: string;
  episode_number?: number;
  season_number?: number;
}

export const ContinueWatchingSection = () => {
  const [watchList, setWatchList] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();
  const swipeRef = useSwipeScroll({ enabled: isMobile || isTablet });

  useEffect(() => {
    const fetchContinueWatching = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: history, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('last_watched_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        const items: WatchItem[] = [];
        
        for (const item of history || []) {
          if (item.movie_id) {
            const { data: movie } = await supabase
              .from('movies')
              .select('id, title, thumbnail, tmdb_id')
              .eq('id', item.movie_id)
              .single();
            
            if (movie) {
              items.push({
                id: item.id,
                title: movie.title,
                thumbnail: movie.thumbnail,
                progress: (item.progress / item.duration) * 100,
                media_type: 'movie',
                media_id: movie.id,
                tmdb_id: movie.tmdb_id,
              });
            }
          } else if (item.episode_id) {
            const { data: episode } = await supabase
              .from('episodes')
              .select('id, name, episode_number, still_path, season_id, seasons(season_number, media_id, series(id, title, thumbnail, backdrop_url, tmdb_id))')
              .eq('id', item.episode_id)
              .single();
            
            if (episode && episode.seasons) {
              const series = (episode.seasons as any).series;
              const thumbnail = episode.still_path || series.backdrop_url || series.thumbnail;
              items.push({
                id: item.id,
                title: `${series.title} - S${(episode.seasons as any).season_number}E${episode.episode_number}`,
                thumbnail,
                progress: (item.progress / item.duration) * 100,
                media_type: 'series',
                media_id: series.id,
                tmdb_id: series.tmdb_id,
                episode_id: episode.id,
                episode_number: episode.episode_number,
                season_number: (episode.seasons as any).season_number,
              });
            }
          }
        }

        setWatchList(items);
      } catch (error) {
        console.error('Error fetching continue watching:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContinueWatching();
  }, [user]);

  if (!user || loading || watchList.length === 0) {
    return null;
  }

  return (
    <section className={`relative ${isTablet ? 'my-px px-2' : 'my-6 md:my-6 max-md:my-3 px-4 md:px-4 max-md:px-0'}`}>
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-[1]" />
      
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-4 max-md:mb-2 max-md:px-2">
          <div className="flex items-center gap-2 group cursor-pointer">
            <h2 className="text-2xl md:text-2xl max-md:text-base font-bold text-foreground group-hover:text-primary transition-colors">
              Continue Watching
            </h2>
            <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
        
        <div ref={swipeRef} className="flex overflow-x-auto gap-4 md:gap-4 max-md:gap-2 pb-4 scrollbar-hide snap-x snap-mandatory touch-pan-x">
          {watchList.map((item) => {
            const watchPath = item.media_type === 'movie' 
              ? `/watch/movie/${item.tmdb_id}` 
              : `/watch/series/${item.tmdb_id}/${item.season_number}/${item.episode_number}`;
            
            return (
              <Link 
                key={item.id}
                to={watchPath}
                className={`group flex-shrink-0 w-[280px] md:w-[280px] max-md:w-[calc(50%-0.25rem)] rounded-lg overflow-hidden border border-border/50 transition-all snap-start ${!isMobile && !isTablet ? 'hover:border-primary/50 duration-300 hover:scale-105' : ''}`}
              >
                <div className="relative aspect-video max-md:aspect-video">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Play overlay */}
                  {!isMobile && !isTablet && (
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <Progress value={item.progress} className="h-1.5" />
                  </div>
                </div>

                <div className="p-3 bg-card">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(item.progress)}% complete
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

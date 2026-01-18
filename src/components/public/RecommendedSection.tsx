import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInView } from "@/hooks/useInView";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useIsTablet } from "@/hooks/use-tablet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";
import { MediaCard } from "./MediaCard";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  type: string;
  media_type: 'anime' | 'movie' | 'series';
  genre: string;
  tmdb_id?: string;
  anilist_id?: string;
  access?: string;
  release_year?: number;
}

const CardWithFadeIn = ({ children, delay }: { children: React.ReactNode; delay: number }) => {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });
  
  return (
    <div
      ref={ref}
      className="relative z-10 opacity-0 translate-y-8 transition-all duration-700 ease-out"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(2rem)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export const RecommendedSection = () => {
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const swipeRef = useSwipeScroll({ enabled: isMobile || isTablet });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        let recommendations: MediaItem[] = [];

        // If user is logged in, try to get personalized recommendations
        if (user) {
          const { data: history } = await supabase
            .from('watch_history')
            .select('movie_id, episode_id')
            .eq('user_id', user.id)
            .limit(20);

          const watchedMovieIds = history?.filter(h => h.movie_id).map(h => h.movie_id) || [];
          const watchedEpisodeIds = history?.filter(h => h.episode_id).map(h => h.episode_id) || [];

          if (watchedMovieIds.length > 0 || watchedEpisodeIds.length > 0) {
            const genres = new Set<string>();
            
            if (watchedMovieIds.length > 0) {
              const { data: movies } = await supabase
                .from('movies')
                .select('genre')
                .in('id', watchedMovieIds);
              movies?.forEach(m => m.genre.split(',').forEach((g: string) => genres.add(g.trim())));
            }

            if (watchedEpisodeIds.length > 0) {
              const { data: episodes } = await supabase
                .from('episodes')
                .select('seasons(series(genre))')
                .in('id', watchedEpisodeIds);
              episodes?.forEach((e: any) => {
                const genre = e.seasons?.series?.genre;
                if (genre) genre.split(',').forEach((g: string) => genres.add(g.trim()));
              });
            }

            const genreArray = Array.from(genres);

            if (genreArray.length > 0) {
              const topGenre = genreArray[0];
              
              const [animesRes, moviesRes, seriesRes] = await Promise.all([
                supabase
                  .from('animes')
                  .select('id, title, thumbnail, rating, type, genre, tmdb_id, anilist_id, access, release_year')
                  .eq('status', 'published')
                  .ilike('genre', `%${topGenre}%`)
                  .order('rating', { ascending: false })
                  .limit(10),
                supabase
                  .from('movies')
                  .select('id, title, thumbnail, rating, type, genre, tmdb_id, access, release_year')
                  .eq('status', 'published')
                  .ilike('genre', `%${topGenre}%`)
                  .order('rating', { ascending: false })
                  .limit(10),
                supabase
                  .from('series')
                  .select('id, title, thumbnail, rating, type, genre, tmdb_id, access, release_year')
                  .eq('status', 'published')
                  .ilike('genre', `%${topGenre}%`)
                  .order('rating', { ascending: false })
                  .limit(10)
              ]);

              recommendations = [
                ...(animesRes.data?.map(item => ({ ...item, media_type: 'anime' as const })) || []),
                ...(moviesRes.data?.map(item => ({ ...item, media_type: 'movie' as const })) || []),
                ...(seriesRes.data?.map(item => ({ ...item, media_type: 'series' as const })) || [])
              ]
                .filter(item => {
                  if (item.media_type === 'movie') return !watchedMovieIds.includes(item.id);
                  return true;
                })
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 15);
            }
          }
        }

        // If no personalized recommendations, show popular content
        if (recommendations.length === 0) {
          const [animesRes, moviesRes, seriesRes] = await Promise.all([
            supabase
              .from('animes')
              .select('id, title, thumbnail, rating, type, genre, tmdb_id, anilist_id, access, release_year')
              .eq('status', 'published')
              .order('views', { ascending: false })
              .limit(6),
            supabase
              .from('movies')
              .select('id, title, thumbnail, rating, type, genre, tmdb_id, access, release_year')
              .eq('status', 'published')
              .order('views', { ascending: false })
              .limit(6),
            supabase
              .from('series')
              .select('id, title, thumbnail, rating, type, genre, tmdb_id, access, release_year')
              .eq('status', 'published')
              .order('views', { ascending: false })
              .limit(6)
          ]);

          recommendations = [
            ...(animesRes.data?.map(item => ({ ...item, media_type: 'anime' as const })) || []),
            ...(moviesRes.data?.map(item => ({ ...item, media_type: 'movie' as const })) || []),
            ...(seriesRes.data?.map(item => ({ ...item, media_type: 'series' as const })) || [])
          ]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 15);
        }

        setRecommended(recommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, [user]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      checkScrollButtons();
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [recommended]);

  if (loading || recommended.length === 0) {
    return null;
  }

  const sectionTitle = user ? "Recommended for You" : "Popular Now";

  return (
    <section className={`relative ${isTablet ? 'my-px px-2' : 'my-6 md:my-6 max-md:my-3 px-4 md:px-4 max-md:px-0'}`}>
      <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-[1]" />
      
      <div className="max-w-[1600px] mx-auto">
        <div className={`flex items-center justify-between ${isTablet ? 'mb-2 px-2' : 'mb-4 max-md:mb-2 max-md:px-2'}`}>
          <div className="flex items-center gap-2 group cursor-pointer">
            <h2 className={`relative z-[5] font-bold text-foreground group-hover:text-primary transition-colors ${isTablet ? 'text-lg' : 'text-2xl md:text-2xl max-md:text-base'}`}>
              {sectionTitle}
            </h2>
            <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          
          {/* Scroll Arrows - Desktop only */}
          {!isMobile && !isTablet && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 rounded-full border-border/50 bg-background/80 backdrop-blur-sm transition-all ${canScrollLeft ? 'opacity-100 hover:bg-primary hover:text-white' : 'opacity-30 cursor-not-allowed'}`}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 rounded-full border-border/50 bg-background/80 backdrop-blur-sm transition-all ${canScrollRight ? 'opacity-100 hover:bg-primary hover:text-white' : 'opacity-30 cursor-not-allowed'}`}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div 
          ref={(el) => {
            scrollContainerRef.current = el;
            if (swipeRef) (swipeRef as any).current = el;
          }}
          className={`flex overflow-x-auto gap-3 md:gap-3 max-md:gap-2 pb-4 scrollbar-hide snap-x snap-mandatory touch-pan-x max-md:px-2 ${isTablet ? 'gap-2 px-2' : ''}`}
        >
          {recommended.map((item, index) => {
            const content = (
              <div className={`flex-shrink-0 snap-start ${isTablet ? 'w-[120px]' : isMobile ? 'w-[110px]' : 'w-[160px] md:w-[180px]'}`}>
                <MediaCard
                  id={item.id}
                  title={item.title}
                  image={item.thumbnail}
                  rating={item.rating}
                  type={item.media_type}
                  year={item.release_year}
                  tmdb_id={item.tmdb_id}
                  access={item.access as "free" | "rent" | "vip" | undefined}
                />
              </div>
            );
            
            return isMobile || isTablet ? (
              <div key={`${item.media_type}-${item.id}`}>{content}</div>
            ) : (
              <CardWithFadeIn key={`${item.media_type}-${item.id}`} delay={index * 30}>
                {content}
              </CardWithFadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};

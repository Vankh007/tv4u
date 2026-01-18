import { MediaCard } from "./MediaCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "@/hooks/useInView";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsTablet } from "@/hooks/use-tablet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";

interface Movie {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  type: string;
  release_year: number;
  tmdb_id?: string;
  access?: 'free' | 'rent' | 'vip';
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

export const NewMoviesSection = () => {
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();
  const swipeRef = useSwipeScroll({ enabled: isMobile || isTablet });

  useEffect(() => {
    const fetchNewMovies = async () => {
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(21);

        if (error) throw error;
        if (data) {
          setMoviesList(data);
        }
      } catch (error) {
        console.error('Error fetching new movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewMovies();
  }, []);

  if (loading) {
    return (
      <section className={`relative my-6 ${isTablet ? 'px-2' : 'px-4'}`}>
        <div className="max-w-[1600px] mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-4">New Movies</h2>
          <div className={`grid ${isTablet ? 'grid-cols-5 gap-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3'}`}>
            {[...Array(isTablet ? 10 : 12)].map((_, i) => (
              <div key={i} className="h-[320px] bg-secondary animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayMovies = isTablet ? moviesList.slice(0, 10) : moviesList;

  return (
    <section className={`relative ${isTablet ? 'my-px px-2' : 'my-6 md:my-6 max-md:my-3 px-4 md:px-4 max-md:px-0'}`}>
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-[1]" />
      
      <div className="max-w-[1600px] mx-auto">
        <div className={`flex items-center justify-between ${isTablet ? 'mb-2 px-2' : 'mb-4 max-md:mb-2 max-md:px-2'}`}>
          <Link to="/new-movies" className="flex items-center gap-2 group">
            <h2 className={`relative z-[5] font-bold text-foreground group-hover:text-primary transition-colors ${isTablet ? 'text-lg' : 'text-2xl md:text-2xl max-md:text-base'}`}>
              New Movies
            </h2>
            <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>
        
        <div className={`grid ${isTablet ? 'grid-cols-5 gap-2' : 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-3 max-md:gap-1'}`}>
          {displayMovies.map((movie, index) => (
            isMobile || isTablet ? (
              <div key={movie.id} className="h-[calc(100%*1.10)]">
                <MediaCard
                  id={movie.id}
                  title={movie.title}
                  image={movie.thumbnail}
                  rating={movie.rating}
                  type={movie.type}
                  year={movie.release_year}
                  tmdb_id={movie.tmdb_id}
                  access={movie.access}
                />
              </div>
            ) : (
              <CardWithFadeIn key={movie.id} delay={index * 50}>
                <div className="h-[calc(100%*1.10)]">
                  <MediaCard
                    id={movie.id}
                    title={movie.title}
                    image={movie.thumbnail}
                    rating={movie.rating}
                    type={movie.type}
                    year={movie.release_year}
                    tmdb_id={movie.tmdb_id}
                    access={movie.access}
                  />
                </div>
              </CardWithFadeIn>
            )
          ))}
        </div>
        
        <div className="flex justify-center mt-4">
          <Link to="/movies">
            <Button variant="outline" className="gap-2 min-w-[200px]">
              More
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

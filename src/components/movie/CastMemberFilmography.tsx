import React, { useState } from "react";
import { Film, Tv, Calendar, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageUrl } from "./utils";

interface TMDBCredit {
  id: number;
  title?: string;
  name?: string;
  character?: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  overview: string;
}

interface CastMemberFilmographyProps {
  movieCredits: TMDBCredit[];
  tvCredits: TMDBCredit[];
  isLoading: boolean;
  isMobile: boolean;
}

const CastMemberFilmography = ({ movieCredits, tvCredits, isLoading, isMobile }: CastMemberFilmographyProps) => {
  const [selectedType, setSelectedType] = useState<"all" | "movies" | "tv">("all");

  const filteredCredits = React.useMemo(() => {
    let allCredits = [...movieCredits, ...tvCredits];
    
    if (selectedType === "movies") {
      allCredits = movieCredits;
    } else if (selectedType === "tv") {
      allCredits = tvCredits;
    }
    
    return allCredits.sort((a, b) => {
      const dateA = a.release_date || a.first_air_date;
      const dateB = b.release_date || b.first_air_date;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [movieCredits, tvCredits, selectedType]);

  if (isLoading) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        {/* Filter Skeleton */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30 flex-shrink-0">
          <div className="flex flex-col gap-3">
            <div className="h-6 w-40 bg-gray-700/30 rounded animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-20 bg-gray-700/30 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700/30">
              <div className="aspect-[2/3] bg-gray-700/30 animate-pulse" />
              <div className="p-2">
                <div className="h-4 w-3/4 bg-gray-700/30 rounded animate-pulse mb-1" />
                <div className="h-3 w-1/2 bg-gray-700/30 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30 flex-shrink-0">
        <div className="flex flex-col gap-2">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-white`}>
            Filmography ({filteredCredits.length})
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-3 py-1 ${isMobile ? 'text-[10px]' : 'text-xs'} rounded-md transition-colors ${
                selectedType === "all"
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-700/30 text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              All ({movieCredits.length + tvCredits.length})
            </button>
            <button
              onClick={() => setSelectedType("movies")}
              className={`px-3 py-1 ${isMobile ? 'text-[10px]' : 'text-xs'} rounded-md transition-colors flex items-center gap-1 ${
                selectedType === "movies"
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-700/30 text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              <Film size={isMobile ? 10 : 12} />
              Movies ({movieCredits.length})
            </button>
            <button
              onClick={() => setSelectedType("tv")}
              className={`px-3 py-1 ${isMobile ? 'text-[10px]' : 'text-xs'} rounded-md transition-colors flex items-center gap-1 ${
                selectedType === "tv"
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-700/30 text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              <Tv size={isMobile ? 10 : 12} />
              TV ({tvCredits.length})
            </button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-4">
          {filteredCredits.map((credit) => (
            <div
              key={`${credit.media_type}-${credit.id}`}
              className="bg-gray-800/20 rounded-lg overflow-hidden border border-gray-700/20 hover:border-cyan-500/30 transition-all duration-200"
            >
              <div className="aspect-[2/3] bg-gray-700/30 relative">
                {getImageUrl(credit.poster_path) ? (
                  <img
                    src={getImageUrl(credit.poster_path)!}
                    alt={credit.title || credit.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {credit.media_type === 'movie' ? <Film size={isMobile ? 18 : 24} className="text-gray-500" /> : <Tv size={isMobile ? 18 : 24} className="text-gray-500" />}
                  </div>
                )}
                <Badge className={`absolute top-1.5 right-1.5 ${isMobile ? 'text-[9px] px-1.5 py-0.5' : 'text-xs'}`} variant={credit.media_type === 'movie' ? 'default' : 'secondary'}>
                  {credit.media_type === 'movie' ? 'Movie' : 'TV'}
                </Badge>
              </div>
              <div className="p-1.5">
                <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-white line-clamp-1`}>
                  {credit.title || credit.name}
                </h4>
                {credit.character && (
                  <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-400 line-clamp-1`}>as {credit.character}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  {credit.vote_average > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Star size={isMobile ? 10 : 12} className="text-yellow-400 fill-yellow-400" />
                      <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-300`}>{credit.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                  {(credit.release_date || credit.first_air_date) && (
                    <div className="flex items-center gap-0.5">
                      <Calendar size={isMobile ? 10 : 12} className="text-gray-400" />
                      <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-400`}>
                        {new Date(credit.release_date || credit.first_air_date!).getFullYear()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredCredits.length === 0 && (
          <div className={`text-center py-8 text-gray-400 ${isMobile ? 'text-xs' : ''}`}>
            <p>No {selectedType === 'all' ? 'credits' : selectedType} found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default CastMemberFilmography;

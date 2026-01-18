import { X, Play, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useRef } from "react";

interface Episode {
  id: string;
  episode_number: number;
  title?: string;
  thumbnail_url?: string;
}

interface EpisodeListDrawerProps {
  episodes: Episode[];
  currentEpisodeId?: string;
  onEpisodeSelect: (episode: Episode) => void;
  onClose: () => void;
  seriesThumbnail?: string;
}

export const EpisodeListDrawer = ({
  episodes,
  currentEpisodeId,
  onEpisodeSelect,
  onClose,
  seriesThumbnail,
}: EpisodeListDrawerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[60] bg-black/90 backdrop-blur-md animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-white font-medium text-sm">Episodes</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Episode List */}
      <div className="relative px-2 py-3">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full w-8 text-white hover:bg-black/50 rounded-none"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Scrollable Container */}
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {episodes.map((episode) => {
            const isActive = episode.id === currentEpisodeId;
            const thumbnail = episode.thumbnail_url || seriesThumbnail;

            return (
              <button
                key={episode.id}
                onClick={() => {
                  onEpisodeSelect(episode);
                  onClose();
                }}
                className={`relative flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden group transition-all ${
                  isActive ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-white/50'
                }`}
              >
                {/* Thumbnail */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: thumbnail
                      ? `url(${thumbnail})`
                      : 'linear-gradient(135deg, #374151, #1f2937)',
                  }}
                />
                
                {/* Overlay */}
                <div className={`absolute inset-0 ${isActive ? 'bg-primary/30' : 'bg-black/40 group-hover:bg-black/30'} transition-all`} />

                {/* Episode Number */}
                <div className="absolute bottom-1 left-1 text-white font-bold text-lg drop-shadow-lg">
                  {episode.episode_number}
                </div>

                {/* Play Icon or Check */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isActive ? (
                    <div className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-0.5">
                      <Check className="h-3 w-3" />
                      Now
                    </div>
                  ) : (
                    <Play className="h-8 w-8 text-white opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full w-8 text-white hover:bg-black/50 rounded-none"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

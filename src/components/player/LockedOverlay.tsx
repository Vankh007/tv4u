import { Button } from "@/components/ui/button";
import { Lock, Crown, DollarSign, VolumeX, Volume2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface LockedOverlayProps {
  accessType: 'free' | 'rent' | 'vip';
  excludeFromPlan?: boolean;
  rentalPrice?: number;
  rentalPeriodDays?: number;
  poster?: string;
  trailerUrl?: string;
  onRentClick: () => void;
}

export const LockedOverlay = ({
  accessType,
  excludeFromPlan = false,
  rentalPrice,
  rentalPeriodDays = 7,
  poster,
  trailerUrl,
  onRentClick,
}: LockedOverlayProps) => {
  const [showTrailerPreview, setShowTrailerPreview] = useState(true);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const [trailerEnded, setTrailerEnded] = useState(false);
  const trailerVideoRef = useRef<HTMLVideoElement>(null);
  const { settings } = useSiteSettings();
  
  // Get overlay settings from site settings or use defaults
  const overlayBlur = (settings as any)?.overlay_blur ?? 0;
  const overlayDim = (settings as any)?.overlay_dim ?? 60;

  // Show the main overlay when no trailer, or trailer ended/skipped
  const showMainOverlay = !trailerUrl || trailerEnded || !showTrailerPreview;

  const handleSkipPreview = () => {
    setShowTrailerPreview(false);
    setTrailerEnded(true);
    if (trailerVideoRef.current) {
      trailerVideoRef.current.pause();
    }
  };

  return (
    <>
      {/* Backdrop/Poster - Always show when locked */}
      {poster && showMainOverlay && (
        <div 
          className="absolute inset-0 z-[55]"
          style={{
            filter: overlayBlur > 0 ? `blur(${overlayBlur}px)` : undefined,
          }}
        >
          <img 
            src={poster} 
            alt="Content backdrop"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Trailer Preview Video */}
      {trailerUrl && showTrailerPreview && !trailerEnded && (
        <div className="absolute inset-0 z-[55]">
          <video
            ref={trailerVideoRef}
            src={trailerUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted={trailerMuted}
            playsInline
            onEnded={() => setTrailerEnded(true)}
            onError={() => setTrailerEnded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
          
          {/* Trailer Controls */}
          <div className="absolute top-4 left-4 z-[70]">
            <span className="px-3 py-1 bg-black/60 rounded-full text-white text-xs font-medium">
              Preview
            </span>
          </div>
          
          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-[70] h-10 w-10 bg-black/60 hover:bg-black/80 text-white rounded-full"
            onClick={() => setTrailerMuted(!trailerMuted)}
          >
            {trailerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          
          {/* Skip Preview Button */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-center z-[70]">
            <Button
              onClick={handleSkipPreview}
              className={`gap-2 font-semibold h-11 px-6 text-base shadow-lg ${
                accessType === 'rent' 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                  : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black'
              }`}
            >
              {accessType === 'rent' ? (
                <>
                  <DollarSign className="w-5 h-5" />
                  Rent Now!
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Join Now!
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Lock Overlay - Show when no trailer, or trailer ended/skipped */}
      {showMainOverlay && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-[60]"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${overlayDim / 100})`,
          }}
        >
          {/* Scale down 30% on mobile using transform */}
          <div className="flex flex-col items-center gap-2 sm:gap-4 p-4 sm:p-6 text-center max-w-[200px] sm:max-w-sm mx-4 scale-[0.7] sm:scale-100 origin-center">
            {/* Lock Icon Circle */}
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 sm:ring-2 ring-white/20">
              <Lock className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
            </div>
            
            {/* Content Info */}
            <div className="space-y-1 sm:space-y-2">
              <h3 className="text-white text-sm sm:text-xl font-bold">
                {accessType === 'vip' ? 'VIP Content' : 'Content For Rent'}
              </h3>
              <p className="text-white/70 text-[10px] sm:text-sm leading-relaxed">
                {accessType === 'vip' 
                  ? 'Subscribe to VIP to unlock this content.'
                  : `Purchase to watch for ${rentalPeriodDays} days`
                }
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:gap-3 w-full mt-1 sm:mt-2">
              {accessType === 'vip' && (
                <a href="/subscriptions" className="w-full">
                  <Button className="w-full gap-1 sm:gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold h-8 sm:h-11 text-xs sm:text-sm">
                    <Crown className="w-3 h-3 sm:w-5 sm:h-5" />
                    Subscribe to VIP
                  </Button>
                </a>
              )}
              {accessType === 'rent' && (
                <>
                  {!excludeFromPlan && (
                    <a href="/subscriptions" className="w-full">
                      <Button className="w-full gap-1 sm:gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold h-8 sm:h-11 text-xs sm:text-sm">
                        <Crown className="w-3 h-3 sm:w-5 sm:h-5" />
                        Subscribe VIP
                      </Button>
                    </a>
                  )}
                  <Button 
                    onClick={onRentClick}
                    className="w-full gap-1 sm:gap-2 bg-primary hover:bg-primary/90 h-8 sm:h-11 text-xs sm:text-sm font-semibold"
                  >
                    <DollarSign className="w-3 h-3 sm:w-5 sm:h-5" />
                    Rent {rentalPrice ? `$${rentalPrice}` : ''} ({rentalPeriodDays}d)
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import CastMemberProfile from "./CastMemberProfile";
import CastMemberDialogTabs from "./CastMemberDialogTabs";

interface CastMember {
  id: string;
  actor_name: string;
  character_name?: string;
  profile_url?: string;
  order_index?: number;
  tmdb_id?: number | null;
}

interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  gender: number;
  popularity: number;
  also_known_as: string[];
  homepage: string | null;
}

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

interface CastMemberDialogProps {
  castMember: CastMember | null;
  isOpen: boolean;
  onClose: () => void;
  castType?: 'movie' | 'series';
}

const CastMemberDialog = ({ castMember, isOpen, onClose, castType = 'series' }: CastMemberDialogProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [tmdbData, setTmdbData] = useState<{
    person: TMDBPerson | null;
    movieCredits: TMDBCredit[];
    tvCredits: TMDBCredit[];
  }>({ person: null, movieCredits: [], tvCredits: [] });
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (castMember && isOpen) {
      fetchTMDBData();
      checkFollowStatus();
    }
  }, [castMember, isOpen, user?.id]);

  const checkFollowStatus = async () => {
    if (!user?.id || !castMember) return;
    
    try {
      const { data, error } = await supabase
        .from('user_followed_cast')
        .select('id')
        .eq('user_id', user.id)
        .eq('cast_id', castMember.id)
        .eq('cast_type', castType)
        .maybeSingle();
      
      if (!error && data) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const fetchTMDBData = async () => {
    if (!castMember) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-tmdb-cast', {
        body: { 
          tmdbPersonId: castMember.tmdb_id,
          actorName: castMember.actor_name 
        },
      });

      if (error) throw error;

      if (data.success) {
        setTmdbData(data.data);
      }
    } catch (error) {
      console.error('Error fetching TMDB data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user?.id) {
      toast({
        title: "Login Required",
        description: "Please login to follow cast members",
        variant: "destructive"
      });
      return;
    }

    if (!castMember) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_followed_cast')
          .delete()
          .eq('user_id', user.id)
          .eq('cast_id', castMember.id)
          .eq('cast_type', castType);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${castMember.actor_name}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followed_cast')
          .insert({
            user_id: user.id,
            cast_id: castMember.id,
            cast_type: castType,
            tmdb_person_id: castMember.tmdb_id || null,
            actor_name: castMember.actor_name,
            profile_url: castMember.profile_url || null,
          });

        if (error) throw error;

        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${castMember.actor_name}`,
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && castMember) {
      navigator.share({
        title: `${castMember.actor_name} - Cast Member`,
        text: `Check out ${castMember.actor_name}${castMember.character_name ? ` who plays ${castMember.character_name}` : ''}`,
        url: window.location.href,
      });
    } else if (castMember) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Link copied to clipboard",
      });
    }
  };

  if (!castMember) return null;

  // Mobile: centered modal (not full screen)
  // iPad/Tablet: centered modal with larger size
  // Desktop: centered modal with max width
  const getDialogClasses = () => {
    if (isMobile && !isTablet) {
      // Mobile phone - centered modal
      return 'w-[92vw] max-w-md h-[80vh] rounded-2xl translate-x-0 translate-y-0 left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 [&>button]:hidden';
    } else if (isTablet) {
      // iPad/Tablet - centered modal
      return 'w-[90vw] max-w-2xl h-[85vh] rounded-2xl translate-x-0 translate-y-0 left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 [&>button]:hidden';
    } else {
      // Desktop
      return 'max-w-4xl h-[90vh]';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${getDialogClasses()} bg-black/95 backdrop-blur-xl border-gray-800/30 text-white overflow-hidden flex flex-col`}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Cast Member Details</DialogTitle>
        </DialogHeader>
        
        {/* Close Button for mobile/tablet - always visible */}
        {(isMobile || isTablet) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        
        {/* Profile Header - Fixed at top */}
        <div className={`flex-shrink-0 bg-gradient-to-b from-gray-900/40 to-black/40 backdrop-blur-md border-b border-gray-700/30 ${(isMobile || isTablet) ? 'pt-12' : ''}`}>
          <div className={`${(isMobile || isTablet) ? 'p-4' : 'p-6'}`}>
            <CastMemberProfile
              castMember={castMember}
              isFollowing={isFollowing}
              isMobile={isMobile || isTablet}
              onFollow={handleFollow}
              onShare={handleShare}
              isFollowLoading={isFollowLoading}
            />
          </div>
        </div>
        
        {/* Tabs Section - Scrollable content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-black/20 backdrop-blur-sm">
          <CastMemberDialogTabs
            castMember={castMember}
            tmdbPerson={tmdbData.person}
            movieCredits={tmdbData.movieCredits}
            tvCredits={tmdbData.tvCredits}
            isLoading={isLoading}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMobile={isMobile || isTablet}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CastMemberDialog;
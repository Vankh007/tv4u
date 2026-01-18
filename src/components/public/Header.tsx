import { Search, Crown, User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PublicSidebar } from "@/components/public/PublicSidebar";
import defaultLogoIcon from "@/assets/logo-icon.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useProfileImage } from "@/hooks/useProfileImage";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTheme } from "next-themes";
export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const {
    settings: siteSettings
  } = useSiteSettings();
  const {
    theme,
    resolvedTheme
  } = useTheme();
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  useEffect(() => {
    setMounted(true);
  }, []);
  const currentLogo = mounted ? resolvedTheme === 'dark' ? siteSettings.logo.logo_dark_url || siteSettings.logo.logo_light_url || defaultLogoIcon : siteSettings.logo.logo_light_url || siteSettings.logo.logo_dark_url || defaultLogoIcon : defaultLogoIcon;
  const {
    signedUrl: profileImageUrl
  } = useProfileImage({
    imagePath: profileData?.profile_picture_url,
    userId: user?.id
  });
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);
  const loadProfile = async () => {
    try {
      const {
        data
      } = await supabase.from('profiles').select('display_name, profile_picture_url').eq('id', user?.id).single();
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };
  const getDisplayName = () => {
    if (profileData?.display_name) return profileData.display_name;
    return user?.email?.split('@')[0] || 'User';
  };
  return <>
      <PublicSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-lg" : "bg-transparent border-b border-transparent"}`}>
        <div className="max-w-[1600px] mx-auto px-4 transition-all duration-300 py-[22px]">
          <div className="flex h-14 items-center justify-between gap-3 rounded-none">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="text-foreground hover:text-primary transition-colors" aria-label="Open menu">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1024 1024" className="h-6 w-6">
                  <path fill="currentColor" d="M704 192h160v736H160V192h160v64h384v-64zM288 512h448v-64H288v64zm0 256h448v-64H288v64zm96-576V96h256v96H384z" />
                </svg>
              </button>
              <img src={currentLogo} alt="Logo" className="h-8 w-8 object-contain" onClick={() => navigate("/")} />
            </div>

            {/* Center: Search icon */}
            <button className="flex-1 flex items-center justify-center" onClick={() => navigate("/search")}>
              <Search className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Right: Theme, VIP, User */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              <Button size="sm" variant="outline" className="h-8 px-2 bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5 text-primary" onClick={() => setShowSubscriptionDialog(true)}>
                <Crown className="h-4 w-4" />
              </Button>
              
              {user ? <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 px-2 bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profileImageUrl || undefined} alt={getDisplayName()} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <Shield className="mr-2 h-4 w-4" />
                      My Dashboard
                    </DropdownMenuItem>
                    {isAdmin && <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> : <Button size="sm" variant="outline" className="h-8 px-3 bg-transparent border border-primary/30 hover:border-primary hover:bg-primary/5 text-primary" onClick={() => navigate("/auth")}>
                  Login
                </Button>}
            </div>
          </div>
        </div>
      </header>
      
      <SubscriptionDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog} />
    </>;
};
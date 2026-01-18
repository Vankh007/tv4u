import { User, Heart, FolderOpen, Tv, Film, ShoppingBag, Crown, Gamepad2, TrendingUp, Radio, Trophy, Clock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import defaultLogoIcon from "@/assets/logo-icon.png";
import { HomeFilledIcon, ShortsIcon, AnimeIcon } from "@/components/icons/CustomIcons";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const menuItems = [
  { title: "My Feed", icon: HomeFilledIcon, path: "/" },
  { title: "Dashboard", icon: User, path: "/dashboard" },
  { title: "Liked", icon: Heart, path: "/liked" },
  { title: "Collections", icon: FolderOpen, path: "/collections" },
  { title: "Coming Soon", icon: Clock, path: "/coming-soon" },
  { title: "Shorts", icon: ShortsIcon, path: "/shorts" },
  { title: "Series", icon: Tv, path: "/series" },
  { title: "Movies", icon: Film, path: "/movies" },
  { title: "Anime", icon: AnimeIcon, path: "/anime/latest" },
  { title: "Shop", icon: ShoppingBag, path: "/shop" },
  { title: "Premium", icon: Crown, path: "/premium" },
  { title: "Gaming", icon: Gamepad2, path: "/gaming" },
  { title: "Finance & Crypto", icon: TrendingUp, path: "/finance" },
  { title: "LIVE", icon: Radio, path: "/live", badge: "LIVE" },
  { title: "Sports", icon: Trophy, path: "/sports" },
];

interface PublicSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublicSidebar({ open, onOpenChange }: PublicSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { settings: siteSettings } = useSiteSettings();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use based on theme (only after mounting)
  const currentLogo = mounted 
    ? (resolvedTheme === 'dark' 
        ? (siteSettings.logo.logo_dark_url || siteSettings.logo.logo_light_url || defaultLogoIcon)
        : (siteSettings.logo.logo_light_url || siteSettings.logo.logo_dark_url || defaultLogoIcon))
    : defaultLogoIcon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-border">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <img src={currentLogo} alt="Logo" className="h-8 w-8 object-contain" />
          <h2 className="text-xl font-bold">
            {siteSettings.split_title?.use_split_title ? (
              <>
                <span style={{ color: siteSettings.split_title.part1_color || undefined }} className={!siteSettings.split_title.part1_color ? 'text-foreground' : ''}>
                  {siteSettings.split_title.part1}
                </span>
                <span style={{ color: siteSettings.split_title.part2_color || undefined }} className={!siteSettings.split_title.part2_color ? 'text-primary' : ''}>
                  {siteSettings.split_title.part2}
                </span>
              </>
            ) : (
              <span>{siteSettings.site_title || 'KHMERZOON'}</span>
            )}
          </h2>
        </div>
        
        <nav className="flex flex-col py-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-6 py-3 hover:bg-secondary/50 transition-colors relative"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary"
              onClick={() => onOpenChange(false)}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-destructive text-destructive-foreground">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

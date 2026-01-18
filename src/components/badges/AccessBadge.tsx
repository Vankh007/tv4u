import { Crown, DollarSign, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AccessBadgeProps {
  access: "free" | "rent" | "vip";
  className?: string;
  position?: "left" | "right";
  compact?: boolean; // For mobile - text only, no icon
}

export const AccessBadge = ({ access, className = "", position = "left", compact = false }: AccessBadgeProps) => {
  const positionClass = position === "right" ? "absolute top-2 right-2" : "";
  
  if (access === "free") {
    return (
      <Badge 
        variant="secondary" 
        className={`bg-emerald-500/90 text-white border-emerald-400/50 backdrop-blur-md shadow-lg shadow-emerald-500/20 font-semibold ${compact ? 'text-[8px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'} ${positionClass} ${className}`}
      >
        {!compact && <Sparkles className="w-3 h-3 mr-1" />}
        Free
      </Badge>
    );
  }

  if (access === "rent") {
    return (
      <Badge 
        variant="secondary" 
        className={`bg-amber-500/90 text-white border-amber-400/50 backdrop-blur-md shadow-lg shadow-amber-500/20 font-semibold ${compact ? 'text-[8px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'} ${positionClass} ${className}`}
      >
        {!compact && <DollarSign className="w-3 h-3 mr-1" />}
        Rent
      </Badge>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={`bg-gradient-to-r from-primary to-cyan-400 text-white border-primary/50 backdrop-blur-md shadow-lg shadow-primary/30 font-semibold ${compact ? 'text-[8px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'} ${positionClass} ${className}`}
    >
      {!compact && <Crown className="w-3 h-3 mr-1" />}
      VIP
    </Badge>
  );
};

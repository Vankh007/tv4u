import { useThemeColors } from '@/hooks/useThemeColors';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function ThemeColorLoader() {
  // This hook automatically loads and applies theme colors on mount
  useThemeColors();
  
  // This hook handles site settings including favicon
  useSiteSettings();
  
  return null;
}

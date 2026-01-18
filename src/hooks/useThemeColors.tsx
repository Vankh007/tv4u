import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeColors {
  primary: string;
  primary_foreground: string;
  secondary: string;
  secondary_foreground: string;
  background: string;
  foreground: string;
  card: string;
  card_foreground: string;
  muted: string;
  muted_foreground: string;
  accent: string;
  accent_foreground: string;
  destructive: string;
  border: string;
  ring: string;
  // Dark mode
  dark_background: string;
  dark_foreground: string;
  dark_card: string;
  dark_secondary: string;
  dark_muted: string;
  dark_border: string;
}

export const defaultThemeColors: ThemeColors = {
  primary: '#00D1D1',
  primary_foreground: '#FFFFFF',
  secondary: '#E6F7FF',
  secondary_foreground: '#0A0A0F',
  background: '#F8FDFF',
  foreground: '#0A0A0F',
  card: '#FFFFFF',
  card_foreground: '#0A0A0F',
  muted: '#F1F5F9',
  muted_foreground: '#718096',
  accent: '#E6F7FF',
  accent_foreground: '#0A0A0F',
  destructive: '#EF4444',
  border: '#E2E8F0',
  ring: '#00D1D1',
  // Dark mode
  dark_background: '#030712',
  dark_foreground: '#F9FAFB',
  dark_card: '#030712',
  dark_secondary: '#1E293B',
  dark_muted: '#1E293B',
  dark_border: '#1E293B',
};

function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyThemeColors(colors: ThemeColors) {
  // Remove any existing dynamic theme styles and inline styles
  const existingStyle = document.getElementById('dynamic-theme-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create a style element with both light and dark mode CSS
  // Use html.dark for higher specificity to ensure dark mode overrides work
  const style = document.createElement('style');
  style.id = 'dynamic-theme-styles';
  style.textContent = `
    :root, html.light {
      --primary: ${hexToHsl(colors.primary)};
      --primary-foreground: ${hexToHsl(colors.primary_foreground)};
      --secondary: ${hexToHsl(colors.secondary)};
      --secondary-foreground: ${hexToHsl(colors.secondary_foreground)};
      --background: ${hexToHsl(colors.background)};
      --foreground: ${hexToHsl(colors.foreground)};
      --card: ${hexToHsl(colors.card)};
      --card-foreground: ${hexToHsl(colors.card_foreground)};
      --popover: ${hexToHsl(colors.card)};
      --popover-foreground: ${hexToHsl(colors.card_foreground)};
      --muted: ${hexToHsl(colors.muted)};
      --muted-foreground: ${hexToHsl(colors.muted_foreground)};
      --accent: ${hexToHsl(colors.accent)};
      --accent-foreground: ${hexToHsl(colors.accent_foreground)};
      --destructive: ${hexToHsl(colors.destructive)};
      --border: ${hexToHsl(colors.border)};
      --input: ${hexToHsl(colors.border)};
      --ring: ${hexToHsl(colors.ring)};
      --cyan: ${hexToHsl(colors.primary)};
      --sidebar-background: ${hexToHsl(colors.background)};
      --sidebar-foreground: ${hexToHsl(colors.foreground)};
      --sidebar-primary: ${hexToHsl(colors.primary)};
      --sidebar-ring: ${hexToHsl(colors.primary)};
    }
    
    html.dark {
      --background: ${hexToHsl(colors.dark_background)};
      --foreground: ${hexToHsl(colors.dark_foreground)};
      --card: ${hexToHsl(colors.dark_card)};
      --card-foreground: ${hexToHsl(colors.dark_foreground)};
      --popover: ${hexToHsl(colors.dark_card)};
      --popover-foreground: ${hexToHsl(colors.dark_foreground)};
      --secondary: ${hexToHsl(colors.dark_secondary)};
      --secondary-foreground: ${hexToHsl(colors.dark_foreground)};
      --muted: ${hexToHsl(colors.dark_muted)};
      --muted-foreground: ${hexToHsl(colors.muted_foreground)};
      --accent: ${hexToHsl(colors.dark_secondary)};
      --accent-foreground: ${hexToHsl(colors.dark_foreground)};
      --border: ${hexToHsl(colors.dark_border)};
      --input: ${hexToHsl(colors.dark_border)};
      --primary: ${hexToHsl(colors.primary)};
      --primary-foreground: ${hexToHsl(colors.primary_foreground)};
      --ring: ${hexToHsl(colors.primary)};
      --cyan: ${hexToHsl(colors.primary)};
      --sidebar-background: ${hexToHsl(colors.dark_card)};
      --sidebar-foreground: ${hexToHsl(colors.dark_foreground)};
      --sidebar-primary: ${hexToHsl(colors.primary)};
      --sidebar-ring: ${hexToHsl(colors.primary)};
    }
  `;
  document.head.appendChild(style);
}

export function useThemeColors() {
  const [colors, setColors] = useState<ThemeColors>(defaultThemeColors);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemeColors();
  }, []);

  const loadThemeColors = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'theme_colors')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading theme colors:', error);
      }

      if (data?.setting_value) {
        const savedColors = data.setting_value as unknown as ThemeColors;
        const mergedColors = { ...defaultThemeColors, ...savedColors };
        setColors(mergedColors);
        applyThemeColors(mergedColors);
      } else {
        applyThemeColors(defaultThemeColors);
      }
    } catch (error) {
      console.error('Error loading theme colors:', error);
      applyThemeColors(defaultThemeColors);
    } finally {
      setIsLoading(false);
    }
  };

  return { colors, isLoading, reloadColors: loadThemeColors };
}

export { applyThemeColors, hexToHsl };
export type { ThemeColors };

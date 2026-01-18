import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SplitTitleSettings {
  part1: string;
  part1_color: string;
  part2: string;
  part2_color: string;
  use_split_title: boolean;
}

interface LogoSettings {
  logo_url: string;
  logo_icon_url: string;
  favicon_url: string;
  logo_light_url: string;
  logo_dark_url: string;
}

export interface SiteSettings {
  site_title: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  site_base_color: string;
  site_secondary_color: string;
  items_per_page: number;
  currency_display_format: string;
  file_upload_server: string;
  video_skip_time: number;
  split_title: SplitTitleSettings;
  logo: LogoSettings;
}

const defaultSettings: SiteSettings = {
  site_title: 'KHMERZOON',
  currency: 'USD',
  currency_symbol: '$',
  timezone: 'UTC',
  site_base_color: '#00D1D1',
  site_secondary_color: '#1E293B',
  items_per_page: 20,
  currency_display_format: 'symbol_text',
  file_upload_server: 'current',
  video_skip_time: 5,
  split_title: {
    part1: '',
    part1_color: '',
    part2: '',
    part2_color: '',
    use_split_title: false,
  },
  logo: {
    logo_url: '',
    logo_icon_url: '',
    favicon_url: '',
    logo_light_url: '',
    logo_dark_url: '',
  },
};

// Helper function to update favicon
const updateFavicon = (faviconUrl: string) => {
  if (!faviconUrl) return;
  
  // Remove existing favicon links
  const existingFavicons = document.querySelectorAll("link[rel*='icon']");
  existingFavicons.forEach(link => link.remove());
  
  // Create new favicon link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = faviconUrl;
  document.head.appendChild(link);
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  // Apply favicon when settings change
  useEffect(() => {
    if (settings.logo.favicon_url) {
      updateFavicon(settings.logo.favicon_url);
    }
  }, [settings.logo.favicon_url]);

  const loadSettings = async () => {
    try {
      // Fetch all relevant settings at once
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['general_settings', 'site_logo_light', 'site_logo_dark', 'site_favicon']);

      if (error) {
        console.error('Error loading site settings:', error);
        return;
      }

      let mergedSettings = { ...defaultSettings };

      if (data) {
        data.forEach(row => {
          try {
            const value = typeof row.setting_value === 'string' 
              ? JSON.parse(row.setting_value) 
              : row.setting_value;

            if (row.setting_key === 'general_settings' && value) {
              mergedSettings = {
                ...mergedSettings,
                ...value,
                split_title: { ...defaultSettings.split_title, ...(value.split_title || {}) },
                logo: { ...mergedSettings.logo, ...(value.logo || {}) },
              };
            }
            if (row.setting_key === 'site_logo_light' && value?.url) {
              mergedSettings.logo.logo_light_url = value.url;
              mergedSettings.logo.logo_url = value.url; // Also set as default logo
            }
            if (row.setting_key === 'site_logo_dark' && value?.url) {
              mergedSettings.logo.logo_dark_url = value.url;
            }
            if (row.setting_key === 'site_favicon' && value?.url) {
              mergedSettings.logo.favicon_url = value.url;
            }
          } catch (e) {
            console.error('Error parsing setting:', row.setting_key, e);
          }
        });
      }

      setSettings(mergedSettings);
    } catch (error) {
      console.error('Error loading site settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { settings, isLoading, reloadSettings: loadSettings };
}

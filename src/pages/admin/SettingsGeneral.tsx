import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Save, X, ArrowLeft, ExternalLink, Palette, Settings, RotateCcw, Upload, Image as ImageIcon, Sun, Moon, AlertTriangle, Film } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColorPickerField } from '@/components/admin/ColorPickerField';
import { defaultThemeColors, applyThemeColors, type ThemeColors } from '@/hooks/useThemeColors';
import defaultLogo from '@/assets/logo.png';

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
}

interface GeneralSettings {
  site_title: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  site_base_color: string;
  site_secondary_color: string;
  currency_format: string;
  items_per_page: number;
  currency_display_format: string;
  file_upload_server: string;
  video_skip_time: number;
  tmdb_api_key: string;
  default_genres: string[];
  pusher_app_id: string;
  pusher_app_key: string;
  pusher_app_secret: string;
  pusher_cluster: string;
  socket_app_uri: string;
  split_title: SplitTitleSettings;
  logo: LogoSettings;
  // Player overlay settings
  overlay_blur: number;
  overlay_dim: number;
}

const defaultSettings: GeneralSettings = {
  site_title: '',
  currency: 'USD',
  currency_symbol: '$',
  timezone: 'UTC',
  site_base_color: '#00D1D1',
  site_secondary_color: '#1E293B',
  currency_format: '20',
  items_per_page: 20,
  currency_display_format: 'symbol_text',
  file_upload_server: 'current',
  video_skip_time: 5,
  tmdb_api_key: '',
  default_genres: [],
  pusher_app_id: '',
  pusher_app_key: '',
  pusher_app_secret: '',
  pusher_cluster: 'ap2',
  socket_app_uri: '',
  split_title: {
    part1: '',
    part1_color: '#ffffff',
    part2: '',
    part2_color: '',
    use_split_title: false,
  },
  logo: {
    logo_url: '',
    logo_icon_url: '',
    favicon_url: '',
  },
  // Player overlay settings
  overlay_blur: 0,
  overlay_dim: 60,
};

const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Phnom_Penh',
  'Australia/Sydney',
];

const currencyFormats = [
  { value: 'symbol_only', label: 'Show Symbol Only ($100)' },
  { value: 'text_only', label: 'Show Text Only (100 USD)' },
  { value: 'symbol_text', label: 'Show Currency Text and Symbol Both ($100 USD)' },
];

const itemsPerPageOptions = ['10', '20', '30', '50', '100'];

const fileUploadServers = [
  { value: 'current', label: 'Current Server' },
  { value: 'idrive', label: 'iDrive E2 Storage' },
  { value: 's3', label: 'Amazon S3' },
];

export default function SettingsGeneral() {
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
  const [themeColors, setThemeColors] = useState<ThemeColors>(defaultThemeColors);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newGenre, setNewGenre] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'general';
  
  // Logo upload refs and state for Supabase Storage
  const lightLogoInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [lightLogoPreview, setLightLogoPreview] = useState<string | null>(null);
  const [darkLogoPreview, setDarkLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [lightLogoFile, setLightLogoFile] = useState<File | null>(null);
  const [darkLogoFile, setDarkLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  // Update favicon in document head
  const updateFavicon = (faviconUrl: string) => {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  };

  useEffect(() => {
    loadSettings();
    loadThemeColors();
    loadLogos();
  }, []);

  const loadLogos = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['site_logo_light', 'site_logo_dark', 'site_favicon']);

      if (data) {
        data.forEach(setting => {
          try {
            const value = typeof setting.setting_value === 'string' 
              ? JSON.parse(setting.setting_value) 
              : setting.setting_value;
            if (setting.setting_key === 'site_logo_light' && value?.url) {
              setLightLogoPreview(value.url);
            }
            if (setting.setting_key === 'site_logo_dark' && value?.url) {
              setDarkLogoPreview(value.url);
            }
            if (setting.setting_key === 'site_favicon' && value?.url) {
              setFaviconPreview(value.url);
            }
          } catch {
            // Ignore parse errors
          }
        });
      }
    } catch (error) {
      console.error('Error loading logos:', error);
    }
  };

  const handleLogoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error('Please upload a valid image file (PNG, JPG, JPEG)');
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogoFile = (
    setPreview: (preview: string | null) => void,
    setFile: (file: File | null) => void,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    setPreview(null);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const uploadLogoToStorage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(`logos/${fileName}`, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(`logos/${fileName}`);

    return publicUrl;
  };

  const upsertLogoSetting = async (key: string, url: string) => {
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('setting_key', key)
      .single();

    const settingValue = JSON.stringify({ url });

    if (existing) {
      await supabase
        .from('site_settings')
        .update({ setting_value: settingValue, updated_at: new Date().toISOString() })
        .eq('setting_key', key);
    } else {
      await supabase
        .from('site_settings')
        .insert({ setting_key: key, setting_value: settingValue });
    }
  };

  const handleSaveLogos = async () => {
    if (!lightLogoFile && !darkLogoFile && !faviconFile) {
      toast.error('Please select at least one image to upload');
      return;
    }

    setIsSaving(true);
    try {
      if (lightLogoFile) {
        const url = await uploadLogoToStorage(lightLogoFile, 'logo-light');
        await upsertLogoSetting('site_logo_light', url);
        setLightLogoPreview(url);
        setLightLogoFile(null);
      }

      if (darkLogoFile) {
        const url = await uploadLogoToStorage(darkLogoFile, 'logo-dark');
        await upsertLogoSetting('site_logo_dark', url);
        setDarkLogoPreview(url);
        setDarkLogoFile(null);
      }

      if (faviconFile) {
        const url = await uploadLogoToStorage(faviconFile, 'favicon');
        await upsertLogoSetting('site_favicon', url);
        setFaviconPreview(url);
        setFaviconFile(null);
        updateFavicon(url);
      }

      toast.success('Logos updated successfully! Changes will appear on the website.');
    } catch (error) {
      console.error('Error saving logos:', error);
      toast.error('Failed to update logos');
    } finally {
      setIsSaving(false);
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'general_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
      }

      if (data?.setting_value) {
        // Parse if it's a string, otherwise use as-is
        let savedSettings: Partial<GeneralSettings>;
        if (typeof data.setting_value === 'string') {
          try {
            savedSettings = JSON.parse(data.setting_value);
          } catch {
            console.error('Failed to parse settings JSON');
            savedSettings = {};
          }
        } else {
          savedSettings = data.setting_value as unknown as GeneralSettings;
        }
        const merged = { 
          ...defaultSettings, 
          ...savedSettings,
          split_title: { ...defaultSettings.split_title, ...(savedSettings.split_title || {}) },
          logo: { ...defaultSettings.logo, ...(savedSettings.logo || {}) },
        };
        setSettings(merged);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        setThemeColors({ ...defaultThemeColors, ...savedColors });
      }
    } catch (error) {
      console.error('Error loading theme colors:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'general_settings')
        .single();

      // Save as JSON string for text column
      const settingsString = JSON.stringify(settings);

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            setting_value: settingsString,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'general_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{
            setting_key: 'general_settings',
            setting_value: settingsString,
          }]);
        if (error) throw error;
      }

      // Update favicon in the document head
      if (settings.logo.favicon_url) {
        updateFavicon(settings.logo.favicon_url);
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'theme_colors')
        .single();

      const colorsJson = JSON.parse(JSON.stringify(themeColors));

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            setting_value: colorsJson,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'theme_colors');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{
            setting_key: 'theme_colors',
            setting_value: colorsJson,
          }]);
        if (error) throw error;
      }
      
      // Apply colors immediately
      applyThemeColors(themeColors);
      toast.success('Theme colors saved and applied successfully');
    } catch (error) {
      console.error('Error saving theme colors:', error);
      toast.error('Failed to save theme colors');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateThemeColor = <K extends keyof ThemeColors>(
    key: K,
    value: ThemeColors[K]
  ) => {
    setThemeColors(prev => ({ ...prev, [key]: value }));
  };

  const resetThemeToDefaults = () => {
    setThemeColors(defaultThemeColors);
    applyThemeColors(defaultThemeColors);
    toast.info('Theme reset to defaults (not saved yet)');
  };

  const previewTheme = () => {
    applyThemeColors(themeColors);
    toast.info('Theme preview applied. Save to keep changes.');
  };

  const addGenre = () => {
    if (newGenre.trim() && !settings.default_genres.includes(newGenre.trim())) {
      updateSetting('default_genres', [...settings.default_genres, newGenre.trim()]);
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    updateSetting('default_genres', settings.default_genres.filter(g => g !== genre));
  };

  const updateSplitTitle = (key: keyof SplitTitleSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      split_title: { ...prev.split_title, [key]: value }
    }));
  };

  const LogoUploadCard = ({
    title,
    icon,
    preview,
    inputRef,
    onRemove,
    onChange
  }: {
    title: string;
    icon: React.ReactNode;
    preview: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onRemove: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="relative w-full aspect-[3/1] bg-muted/30 rounded-lg border-2 border-primary/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <>
              <img 
                src={preview} 
                alt={`${title} preview`} 
                className="max-w-full max-h-full object-contain p-4"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 text-muted-foreground text-sm bg-background/80 px-3 py-1 rounded-full">
                <Upload className="h-4 w-4" />
                <span>Click to change</span>
              </div>
            </>
          ) : (
            <div className="text-center p-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-primary/40" />
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Upload className="h-5 w-5" />
                <span>Click to upload</span>
              </div>
            </div>
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={onChange}
          className="hidden"
        />
        
        <p className="text-xs text-muted-foreground">
          Supported Files: <span className="text-primary font-medium">.png, .jpg, .jpeg</span>
        </p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/settings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">General Setting</h1>
            <p className="text-muted-foreground">Configure the fundamental information and appearance of the site</p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="player" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Player
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme Colors
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Row 1: Site Title, Currency, Currency Symbol, Timezone */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_title">
                      Site Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="site_title"
                      value={settings.site_title}
                      onChange={(e) => updateSetting('site_title', e.target.value)}
                      placeholder="My Streaming Site"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">
                      Currency <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => updateSetting('currency', e.target.value)}
                      placeholder="USD"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency_symbol">
                      Currency Symbol <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="currency_symbol"
                      value={settings.currency_symbol}
                      onChange={(e) => updateSetting('currency_symbol', e.target.value)}
                      placeholder="$"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">
                      Timezone <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => updateSetting('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Items per page, Currency format */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="items_per_page">
                      Items Per Page <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={settings.items_per_page.toString()}
                      onValueChange={(value) => updateSetting('items_per_page', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Items per page" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemsPerPageOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option} items per page</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency_display_format">
                      Currency Showing Format
                    </Label>
                    <Select
                      value={settings.currency_display_format}
                      onValueChange={(value) => updateSetting('currency_display_format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file_upload_server">File Upload Server</Label>
                    <Select
                      value={settings.file_upload_server}
                      onValueChange={(value) => updateSetting('file_upload_server', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select server" />
                      </SelectTrigger>
                      <SelectContent>
                        {fileUploadServers.map((server) => (
                          <SelectItem key={server.value} value={server.value}>
                            {server.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video_skip_time">Video Skip Time</Label>
                    <div className="flex gap-2">
                      <Input
                        id="video_skip_time"
                        type="number"
                        value={settings.video_skip_time}
                        onChange={(e) => updateSetting('video_skip_time', parseInt(e.target.value) || 5)}
                        placeholder="5"
                        className="flex-1"
                      />
                      <div className="flex items-center px-3 bg-muted rounded-md border border-border">
                        <span className="text-sm text-muted-foreground">Sec</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: TMDB and Genres */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tmdb_api_key">TMDB API KEY</Label>
                    <Input
                      id="tmdb_api_key"
                      value={settings.tmdb_api_key}
                      onChange={(e) => updateSetting('tmdb_api_key', e.target.value)}
                      placeholder="Enter TMDB API Key"
                      type="password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genres">
                      Genres <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-2 p-2 min-h-10 rounded-md border border-border bg-background">
                      {settings.default_genres.map((genre) => (
                        <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                          {genre}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeGenre(genre)}
                          />
                        </Badge>
                      ))}
                      <Input
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                        placeholder="Add genre..."
                        className="flex-1 min-w-[100px] border-0 p-0 h-6 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pusher Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Pusher Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pusher_app_id">
                      App ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pusher_app_id"
                      value={settings.pusher_app_id}
                      onChange={(e) => updateSetting('pusher_app_id', e.target.value)}
                      placeholder="1498855"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pusher_app_key">
                      App Key <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pusher_app_key"
                      value={settings.pusher_app_key}
                      onChange={(e) => updateSetting('pusher_app_key', e.target.value)}
                      placeholder="eda7073a2db44e878ec8"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pusher_app_secret">
                      App Secret Key <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pusher_app_secret"
                      type="password"
                      value={settings.pusher_app_secret}
                      onChange={(e) => updateSetting('pusher_app_secret', e.target.value)}
                      placeholder="108bd05bb0bdcb287e0f"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pusher_cluster">
                      Cluster <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pusher_cluster"
                      value={settings.pusher_cluster}
                      onChange={(e) => updateSetting('pusher_cluster', e.target.value)}
                      placeholder="ap2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Socket Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Socket Configuration</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://pusher.com/docs" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Documentation
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="socket_app_uri">
                      App URI <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="socket_app_uri"
                      value={settings.socket_app_uri}
                      onChange={(e) => updateSetting('socket_app_uri', e.target.value)}
                      placeholder="wss://your-domain.com/websocket"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving}
              className="w-full h-12 text-lg"
              size="lg"
            >
              <Save className="h-5 w-5 mr-2" />
              {isSaving ? 'Saving...' : 'Save General Settings'}
            </Button>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6 mt-6">
            {/* Warning Alert */}
            <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                If the logo and favicon are not changed after you update from this page, please{' '}
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-primary underline hover:no-underline font-medium"
                >
                  clear the cache
                </button>{' '}
                from your browser. As we keep the filename the same after the update, it may show the old image for the cache.
              </p>
            </div>

            {/* Logo Upload Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Light Mode Logo */}
              <LogoUploadCard
                title="Logo (Light Mode)"
                icon={<Sun className="h-5 w-5 text-primary" />}
                preview={lightLogoPreview}
                inputRef={lightLogoInputRef}
                onRemove={() => removeLogoFile(setLightLogoPreview, setLightLogoFile, lightLogoInputRef)}
                onChange={(e) => handleLogoFileChange(e, setLightLogoFile, setLightLogoPreview)}
              />

              {/* Dark Mode Logo */}
              <LogoUploadCard
                title="Logo (Dark Mode)"
                icon={<Moon className="h-5 w-5 text-primary" />}
                preview={darkLogoPreview}
                inputRef={darkLogoInputRef}
                onRemove={() => removeLogoFile(setDarkLogoPreview, setDarkLogoFile, darkLogoInputRef)}
                onChange={(e) => handleLogoFileChange(e, setDarkLogoFile, setDarkLogoPreview)}
              />
            </div>

            {/* Favicon Upload */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LogoUploadCard
                title="Favicon"
                icon={<ImageIcon className="h-5 w-5 text-primary" />}
                preview={faviconPreview}
                inputRef={faviconInputRef}
                onRemove={() => removeLogoFile(setFaviconPreview, setFaviconFile, faviconInputRef)}
                onChange={(e) => handleLogoFileChange(e, setFaviconFile, setFaviconPreview)}
              />
            </div>

            {/* Save Logos Button */}
            <Button 
              onClick={handleSaveLogos}
              disabled={isSaving || (!lightLogoFile && !darkLogoFile && !faviconFile)}
              className="w-full h-12 text-lg"
              size="lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              {isSaving ? 'Uploading...' : 'Upload Logos'}
            </Button>

            {/* Split Title Styling */}
            <Card>
              <CardHeader>
                <CardTitle>Title Styling</CardTitle>
                <CardDescription>Customize how your site title appears with split colors (e.g., KHMER + ZOON)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use Split Title</Label>
                    <p className="text-sm text-muted-foreground">Enable to show title in two parts with different colors</p>
                  </div>
                  <Switch
                    checked={settings.split_title.use_split_title}
                    onCheckedChange={(checked) => updateSplitTitle('use_split_title', checked)}
                  />
                </div>

                {settings.split_title.use_split_title && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>First Part Text</Label>
                          <Input
                            value={settings.split_title.part1}
                            onChange={(e) => updateSplitTitle('part1', e.target.value)}
                            placeholder="e.g., KHMER"
                          />
                        </div>
                        <ColorPickerField
                          id="split_title_part1_color"
                          label="First Part Color"
                          value={settings.split_title.part1_color || '#ffffff'}
                          onChange={(color) => updateSplitTitle('part1_color', color)}
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Second Part Text</Label>
                          <Input
                            value={settings.split_title.part2}
                            onChange={(e) => updateSplitTitle('part2', e.target.value)}
                            placeholder="e.g., ZOON"
                          />
                        </div>
                        <ColorPickerField
                          id="split_title_part2_color"
                          label="Second Part Color"
                          value={settings.split_title.part2_color || ''}
                          onChange={(color) => updateSplitTitle('part2_color', color)}
                        />
                        <p className="text-xs text-muted-foreground">Leave empty to use primary color</p>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <Label className="text-sm text-muted-foreground mb-2 block">Preview</Label>
                      <h2 className="text-2xl font-bold">
                        <span style={{ color: settings.split_title.part1_color || '#ffffff' }}>
                          {settings.split_title.part1 || 'First'}
                        </span>
                        <span style={{ color: settings.split_title.part2_color || 'hsl(var(--primary))' }} className={!settings.split_title.part2_color ? 'text-primary' : ''}>
                          {settings.split_title.part2 || 'Part'}
                        </span>
                      </h2>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Save Settings Button */}
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving}
              className="w-full h-12 text-lg"
              size="lg"
            >
              <Save className="h-5 w-5 mr-2" />
              {isSaving ? 'Saving...' : 'Save Title Settings'}
            </Button>
          </TabsContent>

          {/* Theme Colors Tab */}
          <TabsContent value="theme" className="space-y-6 mt-6">
            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>See how your color changes will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Light Mode Preview */}
                  <div 
                    className="rounded-lg p-4 border"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                  >
                    <p className="text-sm font-medium mb-2" style={{ color: themeColors.foreground }}>Light Mode</p>
                    <div 
                      className="rounded-md p-3 mb-2"
                      style={{ backgroundColor: themeColors.card, borderColor: themeColors.border, border: '1px solid' }}
                    >
                      <p className="text-sm" style={{ color: themeColors.card_foreground }}>Card Content</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        className="px-3 py-1.5 rounded-md text-sm font-medium"
                        style={{ backgroundColor: themeColors.primary, color: themeColors.primary_foreground }}
                      >
                        Primary
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-md text-sm"
                        style={{ backgroundColor: themeColors.secondary, color: themeColors.secondary_foreground }}
                      >
                        Secondary
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-md text-sm"
                        style={{ backgroundColor: themeColors.muted, color: themeColors.muted_foreground }}
                      >
                        Muted
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-md text-sm"
                        style={{ backgroundColor: themeColors.destructive, color: '#fff' }}
                      >
                        Destructive
                      </button>
                    </div>
                  </div>

                  {/* Dark Mode Preview */}
                  <div 
                    className="rounded-lg p-4 border"
                    style={{ backgroundColor: themeColors.dark_background, borderColor: themeColors.dark_border }}
                  >
                    <p className="text-sm font-medium mb-2" style={{ color: themeColors.dark_foreground }}>Dark Mode</p>
                    <div 
                      className="rounded-md p-3 mb-2"
                      style={{ backgroundColor: themeColors.dark_card, borderColor: themeColors.dark_border, border: '1px solid' }}
                    >
                      <p className="text-sm" style={{ color: themeColors.dark_foreground }}>Card Content</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        className="px-3 py-1.5 rounded-md text-sm font-medium"
                        style={{ backgroundColor: themeColors.primary, color: themeColors.primary_foreground }}
                      >
                        Primary
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-md text-sm"
                        style={{ backgroundColor: themeColors.dark_secondary, color: themeColors.dark_foreground }}
                      >
                        Secondary
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-md text-sm"
                        style={{ backgroundColor: themeColors.dark_muted, color: themeColors.muted_foreground }}
                      >
                        Muted
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-md text-sm"
                        style={{ backgroundColor: themeColors.destructive, color: '#fff' }}
                      >
                        Destructive
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Primary Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Primary Colors</CardTitle>
                <CardDescription>Main brand colors used across the app</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ColorPickerField
                    id="primary"
                    label="Primary Color"
                    value={themeColors.primary}
                    onChange={(v) => updateThemeColor('primary', v)}
                    required
                  />
                  <ColorPickerField
                    id="primary_foreground"
                    label="Primary Foreground"
                    value={themeColors.primary_foreground}
                    onChange={(v) => updateThemeColor('primary_foreground', v)}
                  />
                  <ColorPickerField
                    id="destructive"
                    label="Destructive (Error)"
                    value={themeColors.destructive}
                    onChange={(v) => updateThemeColor('destructive', v)}
                  />
                  <ColorPickerField
                    id="ring"
                    label="Ring/Focus Color"
                    value={themeColors.ring}
                    onChange={(v) => updateThemeColor('ring', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Light Mode Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Light Mode Colors</CardTitle>
                <CardDescription>Colors used in light theme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ColorPickerField
                    id="background"
                    label="Background"
                    value={themeColors.background}
                    onChange={(v) => updateThemeColor('background', v)}
                    required
                  />
                  <ColorPickerField
                    id="foreground"
                    label="Foreground (Text)"
                    value={themeColors.foreground}
                    onChange={(v) => updateThemeColor('foreground', v)}
                    required
                  />
                  <ColorPickerField
                    id="card"
                    label="Card Background"
                    value={themeColors.card}
                    onChange={(v) => updateThemeColor('card', v)}
                  />
                  <ColorPickerField
                    id="card_foreground"
                    label="Card Foreground"
                    value={themeColors.card_foreground}
                    onChange={(v) => updateThemeColor('card_foreground', v)}
                  />
                  <ColorPickerField
                    id="secondary"
                    label="Secondary"
                    value={themeColors.secondary}
                    onChange={(v) => updateThemeColor('secondary', v)}
                  />
                  <ColorPickerField
                    id="secondary_foreground"
                    label="Secondary Foreground"
                    value={themeColors.secondary_foreground}
                    onChange={(v) => updateThemeColor('secondary_foreground', v)}
                  />
                  <ColorPickerField
                    id="muted"
                    label="Muted"
                    value={themeColors.muted}
                    onChange={(v) => updateThemeColor('muted', v)}
                  />
                  <ColorPickerField
                    id="muted_foreground"
                    label="Muted Foreground"
                    value={themeColors.muted_foreground}
                    onChange={(v) => updateThemeColor('muted_foreground', v)}
                  />
                  <ColorPickerField
                    id="accent"
                    label="Accent"
                    value={themeColors.accent}
                    onChange={(v) => updateThemeColor('accent', v)}
                  />
                  <ColorPickerField
                    id="accent_foreground"
                    label="Accent Foreground"
                    value={themeColors.accent_foreground}
                    onChange={(v) => updateThemeColor('accent_foreground', v)}
                  />
                  <ColorPickerField
                    id="border"
                    label="Border"
                    value={themeColors.border}
                    onChange={(v) => updateThemeColor('border', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dark Mode Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Dark Mode Colors</CardTitle>
                <CardDescription>Colors used in dark theme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ColorPickerField
                    id="dark_background"
                    label="Background"
                    value={themeColors.dark_background}
                    onChange={(v) => updateThemeColor('dark_background', v)}
                    required
                  />
                  <ColorPickerField
                    id="dark_foreground"
                    label="Foreground (Text)"
                    value={themeColors.dark_foreground}
                    onChange={(v) => updateThemeColor('dark_foreground', v)}
                    required
                  />
                  <ColorPickerField
                    id="dark_card"
                    label="Card Background"
                    value={themeColors.dark_card}
                    onChange={(v) => updateThemeColor('dark_card', v)}
                  />
                  <ColorPickerField
                    id="dark_secondary"
                    label="Secondary"
                    value={themeColors.dark_secondary}
                    onChange={(v) => updateThemeColor('dark_secondary', v)}
                  />
                  <ColorPickerField
                    id="dark_muted"
                    label="Muted"
                    value={themeColors.dark_muted}
                    onChange={(v) => updateThemeColor('dark_muted', v)}
                  />
                  <ColorPickerField
                    id="dark_border"
                    label="Border"
                    value={themeColors.dark_border}
                    onChange={(v) => updateThemeColor('dark_border', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline"
                onClick={resetThemeToDefaults}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button 
                variant="secondary"
                onClick={previewTheme}
                className="flex-1"
              >
                <Palette className="h-4 w-4 mr-2" />
                Preview Theme
              </Button>
              <Button 
                onClick={handleSaveTheme} 
                disabled={isSaving}
                className="flex-1"
              >
                <Save className="h-5 w-5 mr-2" />
                {isSaving ? 'Saving...' : 'Save Theme Colors'}
              </Button>
            </div>
          </TabsContent>

          {/* Player Settings Tab */}
          <TabsContent value="player" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Locked Content Overlay</CardTitle>
                <CardDescription>
                  Control how the lock overlay appears on VIP and rental content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Backdrop Blur Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="overlay_blur">Backdrop Blur</Label>
                    <span className="text-sm text-muted-foreground">{settings.overlay_blur}px</span>
                  </div>
                  <Slider
                    id="overlay_blur"
                    min={0}
                    max={20}
                    step={1}
                    value={[settings.overlay_blur]}
                    onValueChange={([value]) => updateSetting('overlay_blur', value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Blur the backdrop/poster image behind the lock overlay. 0 = no blur.
                  </p>
                </div>

                {/* Overlay Dim Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="overlay_dim">Overlay Dim Strength</Label>
                    <span className="text-sm text-muted-foreground">{settings.overlay_dim}%</span>
                  </div>
                  <Slider
                    id="overlay_dim"
                    min={0}
                    max={100}
                    step={5}
                    value={[settings.overlay_dim]}
                    onValueChange={([value]) => updateSetting('overlay_dim', value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    How dark the overlay is. Higher values make the poster less visible.
                  </p>
                </div>

                {/* Preview Box */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border border-border">
                    <img 
                      src="https://image.tmdb.org/t/p/w780/placeholder.jpg" 
                      alt="Preview"
                      className="w-full h-full object-cover"
                      style={{ filter: settings.overlay_blur > 0 ? `blur(${settings.overlay_blur}px)` : undefined }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: `rgba(0, 0, 0, ${settings.overlay_dim / 100})` }}
                    >
                      <div className="flex flex-col items-center gap-2 text-white">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <Film className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">VIP Content</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Skip Time */}
            <Card>
              <CardHeader>
                <CardTitle>Playback Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="video_skip_time">Skip Forward/Backward Time (seconds)</Label>
                  <Input
                    id="video_skip_time"
                    type="number"
                    min={5}
                    max={30}
                    value={settings.video_skip_time}
                    onChange={(e) => updateSetting('video_skip_time', parseInt(e.target.value) || 5)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving}
              className="w-full h-12 text-lg"
              size="lg"
            >
              <Save className="h-5 w-5 mr-2" />
              {isSaving ? 'Saving...' : 'Save Player Settings'}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

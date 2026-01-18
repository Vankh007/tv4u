-- Delete corrupted general_settings record
DELETE FROM site_settings WHERE setting_key = 'general_settings';
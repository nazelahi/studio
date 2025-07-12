-- Run this in your Supabase SQL Editor to add the new columns

ALTER TABLE property_settings
ADD COLUMN owner_name TEXT,
ADD COLUMN owner_photo_url TEXT;

-- You can also set some default values if you want
-- UPDATE property_settings SET owner_name = 'Default Owner', owner_photo_url = 'https://placehold.co/100x100.png' WHERE id = 1;

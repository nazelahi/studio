-- Run this command in your Supabase SQL Editor to add the required
-- column for storing house slideshow images.
-- Go to your Supabase project -> SQL Editor -> New query

ALTER TABLE property_settings
ADD COLUMN house_images TEXT[];

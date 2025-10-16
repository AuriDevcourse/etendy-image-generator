-- Admin Settings Table for Etendy Image Generator
-- This stores global admin settings that apply to all users
-- Run this SQL in your Supabase SQL editor

-- Table for storing global admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read admin settings (public access)
CREATE POLICY "Anyone can read admin settings"
ON admin_settings
FOR SELECT
USING (is_active = true);

-- Policy: Only authenticated users can insert admin settings
CREATE POLICY "Authenticated users can insert admin settings"
ON admin_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Only authenticated users can update admin settings
CREATE POLICY "Authenticated users can update admin settings"
ON admin_settings
FOR UPDATE
TO authenticated
USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_settings_active ON admin_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_at ON admin_settings(updated_at DESC);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_admin_settings_timestamp
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_settings_updated_at();

-- Insert default admin settings (optional)
INSERT INTO admin_settings (settings, is_active)
VALUES ('{
    "fonts": {
        "enabled": true,
        "allowedFonts": ["Archivo Expanded", "DM Serif Text", "Playfair Display", "Inter", "Archivo"],
        "lockFontStyles": false,
        "defaultFont": "Archivo Expanded",
        "defaultWeight": "600",
        "defaultSize": 80
    },
    "backgroundControls": {
        "locked": false
    },
    "generalControls": {
        "resetEnabled": true,
        "undoEnabled": true
    }
}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON admin_settings TO anon;
GRANT ALL ON admin_settings TO authenticated;

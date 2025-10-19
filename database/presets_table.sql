-- Presets Table for Etendy Image Generator
-- This stores both admin presets and user presets
-- Run this SQL in your Supabase SQL editor

-- Table for storing presets
CREATE TABLE IF NOT EXISTS presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active presets (public access for sharing)
CREATE POLICY "Anyone can read active presets"
ON presets
FOR SELECT
USING (is_active = true AND deleted_at IS NULL);

-- Policy: Authenticated users can insert their own presets
CREATE POLICY "Users can insert own presets"
ON presets
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id OR 
    admin_email IS NOT NULL
);

-- Policy: Users can update only their own presets
CREATE POLICY "Users can update own presets"
ON presets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can update their admin presets
CREATE POLICY "Admins can update admin presets"
ON presets
FOR UPDATE
TO authenticated
USING (
    admin_email IS NOT NULL AND 
    admin_email IN (SELECT email FROM admin_users)
);

-- Policy: Users can soft-delete only their own presets
CREATE POLICY "Users can delete own presets"
ON presets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_presets_user_id ON presets(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_admin_email ON presets(admin_email);
CREATE INDEX IF NOT EXISTS idx_presets_active ON presets(is_active);
CREATE INDEX IF NOT EXISTS idx_presets_deleted_at ON presets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_presets_created_at ON presets(created_at DESC);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_presets_timestamp
    BEFORE UPDATE ON presets
    FOR EACH ROW
    EXECUTE FUNCTION update_presets_updated_at();

-- Grant necessary permissions
GRANT SELECT ON presets TO anon;
GRANT ALL ON presets TO authenticated;

-- Admin users table (if not already exists)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read admin users (for verification)
CREATE POLICY "Anyone can read admin users"
ON admin_users
FOR SELECT
USING (true);

-- Grant permissions
GRANT SELECT ON admin_users TO anon;
GRANT ALL ON admin_users TO authenticated;

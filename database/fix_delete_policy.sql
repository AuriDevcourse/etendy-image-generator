-- Fix RLS policies for preset deletion
-- Run this in your Supabase SQL Editor

-- Drop ALL existing UPDATE policies to start fresh
DROP POLICY IF EXISTS "Users can delete own presets" ON presets;
DROP POLICY IF EXISTS "Users can update own presets" ON presets;
DROP POLICY IF EXISTS "Admins can update admin presets" ON presets;

-- Policy 1: Users can update their own presets (including soft delete)
-- USING clause: Check if user owns the preset (before update)
-- WITH CHECK clause: Same check (after update) - user must still own it
CREATE POLICY "Users can update own presets"
ON presets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 2: Admins can update admin presets
-- Allow admins to update presets where admin_email is set
CREATE POLICY "Admins can update admin presets"
ON presets
FOR UPDATE
TO authenticated
USING (admin_email IS NOT NULL)
WITH CHECK (admin_email IS NOT NULL);

-- Verify policies were created
SELECT policyname, cmd, qual::text as using_clause, with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'presets' AND cmd = 'UPDATE'
ORDER BY policyname;

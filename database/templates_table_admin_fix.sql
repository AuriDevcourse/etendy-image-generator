-- =====================================================
-- FIX FOR ADMIN TEMPLATE SAVING
-- =====================================================
-- This adds a policy to allow admins to create templates
-- for any preset, not just their own
-- =====================================================

-- Drop the existing insert policies (both old and new names)
DROP POLICY IF EXISTS "Preset owners can create templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners and admins can create templates" ON public.templates;

-- Recreate the insert policy with admin support
-- Policy: Preset owners OR admins can INSERT templates
CREATE POLICY "Preset owners and admins can create templates"
    ON public.templates
    FOR INSERT
    WITH CHECK (
        -- Allow if user owns the preset
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
        OR
        -- Allow if user's email is in admin_users table
        auth.email() IN (
            SELECT email FROM public.admin_users
        )
    );

-- Update the UPDATE policy to include admins
DROP POLICY IF EXISTS "Preset owners can update their templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners and admins can update templates" ON public.templates;

CREATE POLICY "Preset owners and admins can update templates"
    ON public.templates
    FOR UPDATE
    USING (
        -- Allow if user owns the preset
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
        OR
        -- Allow if user's email is in admin_users table
        auth.email() IN (
            SELECT email FROM public.admin_users
        )
    );

-- Update the DELETE policy to include admins
DROP POLICY IF EXISTS "Preset owners can delete their templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners and admins can delete templates" ON public.templates;

CREATE POLICY "Preset owners and admins can delete templates"
    ON public.templates
    FOR DELETE
    USING (
        -- Allow if user owns the preset
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
        OR
        -- Allow if user's email is in admin_users table
        auth.email() IN (
            SELECT email FROM public.admin_users
        )
    );

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check updated policies
-- SELECT * FROM pg_policies WHERE tablename = 'templates';

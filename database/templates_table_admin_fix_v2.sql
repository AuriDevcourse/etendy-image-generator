-- =====================================================
-- FIX FOR ADMIN TEMPLATE SAVING - VERSION 2
-- =====================================================
-- Alternative approach using auth.jwt() to get email
-- =====================================================

-- Drop the existing insert policies (both old and new names)
DROP POLICY IF EXISTS "Preset owners can create templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners and admins can create templates" ON public.templates;

-- Recreate the insert policy with admin support
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
        -- Allow if user's email is in admin_users table (using jwt)
        (auth.jwt() ->> 'email')::text IN (
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
        -- Allow if user's email is in admin_users table (using jwt)
        (auth.jwt() ->> 'email')::text IN (
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
        -- Allow if user's email is in admin_users table (using jwt)
        (auth.jwt() ->> 'email')::text IN (
            SELECT email FROM public.admin_users
        )
    );

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check updated policies
-- SELECT * FROM pg_policies WHERE tablename = 'templates';

-- Test if current user is recognized as admin
-- SELECT (auth.jwt() ->> 'email')::text as my_email,
--        EXISTS (SELECT 1 FROM public.admin_users WHERE email = (auth.jwt() ->> 'email')::text) as is_admin;

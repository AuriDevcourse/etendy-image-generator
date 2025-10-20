-- =====================================================
-- USER ROLES SYSTEM FOR SUPER ADMIN
-- =====================================================
-- Three-tier role system:
-- 1. Super Admin - Can manage admin roles
-- 2. Admin - Can create presets and lock features
-- 3. Regular User - Can only access via shared links
-- =====================================================

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
    granted_by UUID REFERENCES auth.users(id), -- Who granted this role
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Each user can only have one role
    CONSTRAINT unique_user_role UNIQUE (user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can read their own role
CREATE POLICY "Users can view their own role"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Super admins can view all roles
CREATE POLICY "Super admins can view all roles"
    ON public.user_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Policy 3: Super admins can insert/update roles (but not their own super_admin role)
CREATE POLICY "Super admins can manage roles"
    ON public.user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
        -- Prevent super admins from demoting themselves
        AND NOT (user_id = auth.uid() AND role != 'super_admin')
    );

-- Policy 4: New users get 'user' role by default (via trigger)
CREATE POLICY "New users can insert their own user role"
    ON public.user_roles
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND role = 'user'
    );

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================

-- Create trigger for user_roles table
DROP TRIGGER IF EXISTS set_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER set_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION TO AUTO-CREATE USER ROLE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a 'user' role for new signups
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or super admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = check_user_id;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.user_roles IS 'Stores user roles for access control: super_admin, admin, or user';
COMMENT ON COLUMN public.user_roles.user_id IS 'User this role belongs to';
COMMENT ON COLUMN public.user_roles.role IS 'Role type: super_admin, admin, or user';
COMMENT ON COLUMN public.user_roles.granted_by IS 'Super admin who granted this role';

-- =====================================================
-- INITIAL SUPER ADMIN SETUP
-- =====================================================
-- After running this script, you need to manually set YOUR user as super_admin:
-- 
-- 1. Sign in to your app to create your user account
-- 2. Get your user ID from Supabase Auth dashboard
-- 3. Run this query (replace YOUR_USER_ID with your actual ID):
--
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR_USER_ID', 'super_admin')
-- ON CONFLICT (user_id) 
-- DO UPDATE SET role = 'super_admin';
--
-- =====================================================

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all user roles
-- SELECT 
--   ur.user_id,
--   au.email,
--   ur.role,
--   ur.created_at
-- FROM public.user_roles ur
-- JOIN auth.users au ON ur.user_id = au.id
-- ORDER BY ur.created_at DESC;

-- Check if specific user is super admin
-- SELECT public.is_super_admin('user-id-here');

-- Get user's role
-- SELECT public.get_user_role('user-id-here');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

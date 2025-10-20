-- =====================================================
-- DEBUG ADMIN ACCESS
-- =====================================================
-- Run these queries to debug why admin template saving fails
-- =====================================================

-- 1. Check what email the current user has
SELECT auth.email() as current_user_email;

-- 2. Check all emails in admin_users table
SELECT email FROM public.admin_users;

-- 3. Check if current user is in admin_users
SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.email()
) as is_admin;

-- 4. Check current RLS policies on templates table
SELECT * FROM pg_policies WHERE tablename = 'templates';

-- 5. Test the policy logic manually
SELECT 
    auth.uid() as current_uid,
    auth.email() as current_email,
    (SELECT email FROM public.admin_users WHERE email = auth.email()) as admin_match;

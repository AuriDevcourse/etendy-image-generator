-- Function to get all users from auth.users with their roles
-- This allows the app to see ALL users, not just those with role entries

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    granted_by UUID,
    created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id as user_id,
        COALESCE(ur.role, 'user') as role,
        ur.granted_by,
        au.created_at
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.user_id
    ORDER BY au.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users_with_roles() TO authenticated;

-- Comment
COMMENT ON FUNCTION public.get_all_users_with_roles() IS 'Returns all users from auth.users with their roles from user_roles table. Users without roles default to "user".';

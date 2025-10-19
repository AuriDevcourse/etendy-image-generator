-- Step 1: Check current policies
SELECT 
    policyname, 
    cmd,
    roles,
    qual::text as using_clause, 
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'presets'
ORDER BY cmd, policyname;

-- Step 2: Drop ALL UPDATE policies (run this after reviewing above)
DROP POLICY IF EXISTS "Users can delete own presets" ON presets;
DROP POLICY IF EXISTS "Users can update own presets" ON presets;
DROP POLICY IF EXISTS "Admins can update admin presets" ON presets;
DROP POLICY IF EXISTS "Users can soft delete own presets" ON presets;
DROP POLICY IF EXISTS "Users can soft-delete own presets" ON presets;

-- Step 3: Create a single, permissive UPDATE policy for users
-- This allows users to update ANY field in their own presets
CREATE POLICY "Users can modify own presets"
ON presets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 4: Create UPDATE policy for admin presets
-- Admins can update presets where admin_email is NOT NULL
CREATE POLICY "Admins can modify admin presets"
ON presets
FOR UPDATE
TO authenticated
USING (admin_email IS NOT NULL)
WITH CHECK (admin_email IS NOT NULL);

-- Step 5: Verify the new policies
SELECT 
    policyname, 
    cmd,
    qual::text as using_clause, 
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'presets' AND cmd = 'UPDATE'
ORDER BY policyname;

-- Step 6: Test the delete (optional - run in a separate query)
-- Replace 'YOUR_PRESET_ID' with an actual preset ID you want to test
-- UPDATE presets 
-- SET is_active = false, deleted_at = NOW()
-- WHERE id = 'YOUR_PRESET_ID';

# Admin Template Saving Fix

## Problem
Admins cannot save templates because of Row Level Security (RLS) policy violations in Supabase. The error message is:
```
new row violates row-level security policy for table "templates"
```

## Root Cause
The RLS policies on the `templates` table only allow preset owners to create/update/delete templates. When an admin tries to save a template, they don't own the preset, so the policy blocks them.

## Solution
Update the RLS policies to allow admins to create, update, and delete templates for any preset.

## Steps to Fix

### 1. Run the SQL Fix in Supabase

Go to your Supabase project → SQL Editor and run the contents of `database/templates_table_admin_fix.sql`:

```sql
-- Drop the existing insert policy
DROP POLICY IF EXISTS "Preset owners can create templates" ON public.templates;

-- Recreate the insert policy with admin support
CREATE POLICY "Preset owners and admins can create templates"
    ON public.templates
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM public.admin_users
            WHERE is_admin = true
        )
    );

-- Update the UPDATE policy
DROP POLICY IF EXISTS "Preset owners can update their templates" ON public.templates;

CREATE POLICY "Preset owners and admins can update templates"
    ON public.templates
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM public.admin_users
            WHERE is_admin = true
        )
    );

-- Update the DELETE policy
DROP POLICY IF EXISTS "Preset owners can delete their templates" ON public.templates;

CREATE POLICY "Preset owners and admins can delete templates"
    ON public.templates
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM public.admin_users
            WHERE is_admin = true
        )
    );
```

### 2. Verify the Fix

After running the SQL, verify the policies were updated:

```sql
SELECT * FROM pg_policies WHERE tablename = 'templates';
```

You should see three policies:
- `Preset owners and admins can create templates`
- `Preset owners and admins can update templates`
- `Preset owners and admins can delete templates`

### 3. Test Template Saving

1. Log in as an admin
2. Navigate to a preset (via `/p/{preset_id}` or preset dashboard)
3. Create some design elements
4. Try to save a template
5. It should now work without RLS errors!

## Code Changes Already Made

The following code changes have already been implemented in `ImageGenerator.jsx`:

1. **Better user detection**: Now checks for `currentUser || adminUser || regularUser`
2. **Admin-friendly popup**: When admin tries to save without a preset, offers to go to preset dashboard
3. **Fixed template saving**: Uses `loggedInUser.id` instead of just `currentUser.id`

## What This Fixes

✅ Admins can now save templates when editing presets
✅ Admins get helpful guidance when not in a preset
✅ Regular users continue to work as before
✅ Preset owners can still manage their own templates

## Security Note

This change allows admins to create/update/delete templates for ANY preset, not just their own. This is intentional and appropriate for admin functionality. The `admin_users` table controls who has admin access.

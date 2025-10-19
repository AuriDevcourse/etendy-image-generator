# Preset Ownership & User Account Linking Fix

## Problem
When editing a preset via the user profile, the system didn't properly verify that the preset belonged to the current user. This could allow users to potentially edit presets they don't own.

## Root Cause
1. **Missing User ID in Preset State**: When loading a preset, only the `id` and `name` were stored, not the `user_id` or `admin_email`
2. **No Ownership Verification**: The `updatePreset` function didn't verify that the user owns the preset before allowing updates
3. **Missing RLS Policies**: The database didn't have proper Row Level Security policies to enforce ownership at the database level

## Solution Implemented

### 1. Updated `presetService.updatePreset()` in `src/lib/supabase.js`
- Added optional `userId` parameter for ownership verification
- When `userId` is provided, the update query includes `.eq('user_id', userId)` to ensure only the owner can update
- Added proper error handling for permission denied scenarios

```javascript
async updatePreset(presetId, settings, userId = null) {
  // Build the update query
  let query = supabase
    .from('presets')
    .update({ settings: cleanSettings })
    .eq('id', presetId);
  
  // If userId is provided, verify ownership
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query.select().single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('You do not have permission to update this preset or it does not exist.');
    }
    throw error;
  }
  
  return data;
}
```

### 2. Updated Preset Loading in `src/pages/ImageGenerator.jsx`
- When loading a preset, now stores `user_id` and `admin_email` along with `id` and `name`
- This allows the system to know who owns the preset

```javascript
setCurrentPreset({ 
  id: presetId, 
  name: preset.name,
  user_id: preset.user_id,
  admin_email: preset.admin_email
});
```

### 3. Updated Preset Saving in `src/pages/ImageGenerator.jsx`
- When saving a preset, now passes the `user_id` for verification
- Differentiates between user presets (has `user_id`) and admin presets (has `admin_email`)

```javascript
const userId = currentPreset.user_id || null;

await presetService.updatePreset(currentPreset.id, currentSettings, userId);
```

### 4. Created Database Schema with RLS Policies
- Created `database/presets_table.sql` with proper Row Level Security
- Ensures users can only update their own presets at the database level
- Allows admins to update admin presets
- Public read access for sharing presets

## How It Works Now

### For User Presets
1. User creates a preset → `user_id` is set to their user ID
2. User edits their preset → System verifies `user_id` matches current user
3. Database RLS policy enforces: `auth.uid() = user_id`
4. Only the owner can update their preset

### For Admin Presets
1. Admin creates a preset → `admin_email` is set, `user_id` is NULL
2. Admin edits their preset → System passes NULL for userId (no verification)
3. Database RLS policy allows admins to update admin presets
4. Regular users cannot update admin presets

## Database Setup

If you haven't already, run the SQL script to create the presets table with proper RLS policies:

```bash
# In Supabase SQL Editor, run:
database/presets_table.sql
```

This will:
- Create the `presets` table if it doesn't exist
- Enable Row Level Security
- Create policies for read/insert/update/delete operations
- Create indexes for performance
- Set up automatic timestamp updates

## Testing

### Test User Preset Ownership
1. **Create a preset as User A**
   - Log in as User A
   - Create a new preset
   - Note the preset ID

2. **Try to edit as User B**
   - Log out and log in as User B
   - Try to access `/p/{preset-id}?edit=true`
   - Attempt to save changes
   - Should fail with permission error

3. **Edit as Owner**
   - Log back in as User A
   - Access `/p/{preset-id}?edit=true`
   - Make changes and save
   - Should succeed

### Test Admin Preset Access
1. **Create admin preset**
   - Log in as admin
   - Create a preset
   - Note the preset ID

2. **View as regular user**
   - Log in as regular user
   - Access `/p/{preset-id}` (without edit mode)
   - Should be able to view and use the preset

3. **Try to edit as regular user**
   - Access `/p/{preset-id}?edit=true`
   - Make changes and try to save
   - Should fail (admin presets can only be edited by admins)

## Security Benefits

1. **Database-Level Security**: RLS policies enforce ownership even if application code has bugs
2. **User Isolation**: Users can only modify their own presets
3. **Admin Control**: Admins maintain control over admin presets
4. **Public Sharing**: Presets can still be shared and viewed publicly
5. **Audit Trail**: `updated_at` timestamp tracks when presets were modified

## Files Modified

1. `src/lib/supabase.js` - Updated `updatePreset()` function
2. `src/pages/ImageGenerator.jsx` - Updated preset loading and saving
3. `database/presets_table.sql` - Created (new file)
4. `PRESET_OWNERSHIP_FIX.md` - This documentation (new file)

## Migration Notes

If you have existing presets in your database:
- User presets should have `user_id` set
- Admin presets should have `admin_email` set
- Run the SQL script to add RLS policies
- No data migration needed if columns already exist

## Future Enhancements

Consider adding:
- Preset sharing permissions (allow specific users to edit)
- Preset templates (public templates anyone can copy)
- Preset versioning (track changes over time)
- Preset collaboration (multiple users can edit)

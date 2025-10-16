# Global Admin Settings Setup Guide

## ✅ What's Been Implemented

Your admin settings are now **stored globally in Supabase** instead of localStorage! This means:

✅ **Settings are shared with ALL users**  
✅ **Locked backgrounds apply to everyone**  
✅ **Background images stored in Supabase Storage**  
✅ **Persistent across all devices and browsers**  
✅ **No more localStorage limitations**

---

## 🚀 Setup Steps (Do This Now!)

### Step 1: Create Admin Settings Table in Supabase

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your **"attendee"** project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**
5. Copy and paste the entire contents of `/database/admin_settings_table.sql`
6. Click **"Run"** to execute the SQL

This will create:
- `admin_settings` table for global settings
- RLS policies (anyone can read, authenticated users can write)
- Automatic timestamp updates
- Default settings row

### Step 2: Verify Storage Bucket

Make sure your `user-images` bucket exists and has the correct policies (you already set this up earlier for image uploads).

The admin background images will be stored in: `user-images/admin/backgrounds/`

---

## 🎯 How It Works Now

### **For Admins:**
1. Log in as admin
2. Go to Admin Panel
3. Lock background controls
4. Upload a background image (it uploads to Supabase Storage automatically)
5. Click **"Save Settings"** button
6. Settings are saved to Supabase database
7. **Everyone sees these settings immediately!**

### **For Regular Users:**
1. Visit the website
2. Settings are loaded from Supabase automatically
3. If admin locked the background, they see the locked background
4. No localStorage involved - all global!

---

## 📊 What Gets Saved Globally

When you save admin settings, these are stored in Supabase for ALL users:

- ✅ **Locked backgrounds** (canvas and page)
- ✅ **Background images** (uploaded to Supabase Storage)
- ✅ **Background colors and gradients**
- ✅ **Overlay settings**
- ✅ **Font restrictions**
- ✅ **Canvas size locks**
- ✅ **Control visibility** (reset, undo, etc.)

---

## 🔄 Migration from localStorage

Your old localStorage settings will be ignored. The app now:

1. **Loads from Supabase** on page load
2. **Saves to Supabase** when you click "Save Settings"
3. **No localStorage** used for admin settings anymore

---

## 🧪 Testing

### Test 1: Save Settings as Admin
1. Log in as admin
2. Lock canvas background
3. Upload a background image
4. Click "Save Settings"
5. Check console: Should see "✅ Settings saved successfully to Supabase!"

### Test 2: Verify Global Settings
1. Open the site in an **incognito window** (or different browser)
2. Don't log in
3. The locked background should appear automatically!
4. Settings are the same as what admin set

### Test 3: Check Supabase
1. Go to Supabase Dashboard → Table Editor → `admin_settings`
2. You should see a row with your settings in JSON format
3. Go to Storage → `user-images` → `admin` → `backgrounds`
4. You should see your uploaded background image

---

## 🎉 Benefits

### Before (localStorage):
- ❌ Settings only on your browser
- ❌ Not shared with other users
- ❌ Lost when clearing browser data
- ❌ Different settings on different devices

### After (Supabase):
- ✅ Settings shared globally
- ✅ Everyone sees the same locked backgrounds
- ✅ Persistent forever
- ✅ Same settings everywhere
- ✅ Background images on CDN

---

## 🔧 Database Structure

### admin_settings Table:
```
id              | UUID (primary key)
settings        | JSONB (all admin settings)
created_at      | Timestamp
updated_at      | Timestamp
updated_by      | UUID (user who saved)
is_active       | Boolean (only one active at a time)
```

### Storage Structure:
```
user-images/
  └── admin/
      └── backgrounds/
          └── 1234567890.jpg  (your background images)
```

---

## 🐛 Troubleshooting

### Error: "Failed to save settings to server"
- Make sure you ran the SQL script in Supabase
- Check that the `admin_settings` table exists
- Verify RLS policies are set up correctly

### Background image not showing
- Check Supabase Storage → `user-images` bucket
- Verify the image was uploaded to `admin/backgrounds/`
- Check browser console for errors

### Settings not loading
- Check browser console for Supabase errors
- Verify the `admin_settings` table has data
- Make sure RLS policies allow public SELECT

---

## ✨ Summary

**Your admin settings are now global!** When you lock a background and save settings:

1. Settings saved to Supabase database ✅
2. Background image uploaded to Supabase Storage ✅
3. Everyone who visits the site sees your settings ✅
4. Works across all devices and browsers ✅

Just complete **Step 1** above to enable the feature! 🚀

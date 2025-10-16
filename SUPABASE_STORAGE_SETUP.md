# Supabase Storage Setup Guide

## ✅ What's Been Implemented

I've added automatic Supabase Storage integration to your Etendy image generator. Every time a user uploads an image, it will automatically upload to Supabase Storage!

### Changes Made:
1. **Added `storageService` to `/src/lib/supabase.js`** with methods:
   - `uploadImage()` - Upload from File object
   - `uploadFromDataURL()` - Upload from base64 data URL
   - `uploadCanvas()` - Upload canvas directly
   - `deleteImage()` - Delete images
   - `listUserImages()` - List user's uploaded images

2. **Modified `/src/components/ImageGenerator/steps/Step2_Image.jsx`**:
   - Automatically uploads every image to Supabase
   - Falls back to local data URL if upload fails
   - Stores Supabase path for future deletion

---

## 🚀 Setup Steps (Do This Now!)

### Step 1: Create Storage Bucket in Supabase

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your **"attendee"** project
3. Click **"Storage"** in the left sidebar
4. Click **"New bucket"** button
5. Create a bucket with these settings:
   - **Name**: `user-images`
   - **Public bucket**: ✅ **YES** (check this box)
   - Click **"Create bucket"**

### Step 2: Set Storage Policies (Important!)

After creating the bucket, you need to set up policies so users can upload:

1. Click on the `user-images` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"For full customization"**
5. Add these policies:

#### Policy 1: Allow Public Uploads
```sql
-- Policy Name: Allow authenticated uploads
-- Allowed operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-images');
```

#### Policy 2: Allow Public Reads
```sql
-- Policy Name: Allow public reads
-- Allowed operation: SELECT
-- Target roles: public

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-images');
```

#### Policy 3: Allow Users to Delete Their Own Files
```sql
-- Policy Name: Allow users to delete own files
-- Allowed operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🧪 Testing

### Test the Upload:
1. Start your dev server: `npm run dev`
2. Open the app in browser
3. Go to the **"Image"** step
4. Upload an image
5. Check the browser console - you should see:
   ```
   📤 Uploading image to Supabase Storage...
   ✅ Image uploaded successfully: https://frneypfjfscmlahksjyc.supabase.co/storage/v1/object/public/user-images/...
   ```

### Verify in Supabase:
1. Go to Supabase Dashboard → Storage → `user-images`
2. You should see a folder structure: `{userId}/uploads/{timestamp}.{ext}`
3. Click on the image to view it

---

## 📊 How It Works

### Upload Flow:
```
User selects image
    ↓
processFile() called
    ↓
Get current user ID (or 'anonymous')
    ↓
Upload to Supabase Storage
    ↓
Get public URL
    ↓
Use URL in canvas (instead of data URL)
    ↓
✅ No localStorage used!
```

### File Structure in Supabase:
```
user-images/
├── {userId}/
│   ├── uploads/
│   │   ├── 1234567890.jpg
│   │   ├── 1234567891.png
│   ├── generated/
│   │   ├── 1234567892.png
```

---

## 🎯 Benefits

✅ **No localStorage limits** - Store unlimited images  
✅ **Persistent across devices** - Images available everywhere  
✅ **CDN delivery** - Fast loading from Supabase CDN  
✅ **Automatic fallback** - Uses local data URL if Supabase fails  
✅ **User-organized** - Each user has their own folder  

---

## 🔧 Next Steps (Optional)

### 1. Upload Generated Images Too
You can also upload the final generated images to Supabase by modifying the download handler in `Step5_Download.jsx`:

```javascript
// In handleDownload function
const uploadResult = await storageService.uploadCanvas(
  canvas, 
  currentUser?.id || 'anonymous', 
  'generated'
);
console.log('Generated image saved:', uploadResult.url);
```

### 2. Create Image Gallery from Supabase
Load user's images from Supabase instead of localStorage:

```javascript
const userImages = await storageService.listUserImages(userId, 'uploads');
setGalleryImages(userImages);
```

### 3. Add Image Metadata Table
Create a table to store image metadata:

```sql
CREATE TABLE user_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🐛 Troubleshooting

### Error: "new row violates row-level security policy"
- Make sure you created the storage policies (Step 2)
- Check that the bucket is set to **public**

### Error: "Failed to upload to Supabase"
- Check browser console for detailed error
- Verify Supabase URL and key in `.env` file
- Make sure user is authenticated (or allow anonymous uploads)

### Images not showing
- Check if bucket is public
- Verify the public URL in console logs
- Check CORS settings in Supabase

---

## 📝 Environment Variables

Make sure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=https://frneypfjfscmlahksjyc.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## ✨ Summary

Your app now automatically uploads every image to Supabase Storage! 

**What happens now:**
- User uploads image → Automatically saved to Supabase
- Image URL from Supabase used in canvas
- No localStorage quota issues
- Images persist forever (or until you delete them)

Just complete **Step 1** and **Step 2** above to enable the feature! 🚀

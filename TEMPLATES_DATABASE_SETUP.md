# 🗄️ Templates Database Setup Guide

This guide will help you set up the templates table in Supabase to enable template sharing via public preset URLs.

---

## 📋 What This Fixes

**Current Problem:**
- Templates stored in browser localStorage
- Not accessible via public preset URLs
- Can't share templates across devices
- Limited to browser where created

**After Setup:**
- ✅ Templates stored in Supabase database
- ✅ Accessible via public preset URLs
- ✅ Shareable across devices and users
- ✅ 4 templates per preset limit enforced
- ✅ Automatic migration from localStorage

---

## 🚀 Setup Steps

### Step 1: Run SQL in Supabase

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `database/templates_table.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

You should see: ✅ **Success. No rows returned**

---

### Step 2: Verify Table Creation

Run this query in the SQL Editor to verify:

```sql
-- Check if table exists
SELECT * FROM public.templates LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'templates';

-- Check triggers
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.templates'::regclass;
```

Expected results:
- ✅ Table exists (even if empty)
- ✅ 5 RLS policies created
- ✅ 2 triggers created

---

### Step 3: Test the Setup

Run this test query to ensure everything works:

```sql
-- Test insert (replace with your actual preset_id and user_id)
INSERT INTO public.templates (preset_id, user_id, name, template_data)
VALUES (
  'your-preset-id-here',
  'your-user-id-here',
  'Test Template',
  '{"elements": [], "canvasWidth": 1500, "canvasHeight": 1500}'::jsonb
);

-- Verify it was inserted
SELECT * FROM public.templates WHERE name = 'Test Template';

-- Clean up test
DELETE FROM public.templates WHERE name = 'Test Template';
```

---

## 🔧 What Was Created

### Database Table: `templates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `preset_id` | UUID | Links to presets table |
| `user_id` | UUID | User who created template |
| `name` | TEXT | Template name (unique per preset) |
| `thumbnail` | TEXT | Base64 thumbnail image |
| `template_data` | JSONB | Full template data |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### RLS Policies Created

1. **Public Read** - Anyone can view templates for public presets
2. **Owner Read** - Preset owners can view their templates
3. **Owner Insert** - Preset owners can create templates
4. **Owner Update** - Preset owners can update templates
5. **Owner Delete** - Preset owners can delete templates

### Database Triggers

1. **Updated At Trigger** - Auto-updates `updated_at` timestamp
2. **Template Limit Trigger** - Enforces 4 templates per preset

---

## 📝 Code Integration (Already Done)

The following has been added to your codebase:

### `src/lib/supabase.js`

New `templateService` with methods:
- ✅ `getTemplates(presetId)` - Load templates for a preset
- ✅ `saveTemplate(...)` - Save new template
- ✅ `updateTemplate(...)` - Update existing template
- ✅ `deleteTemplate(...)` - Delete template
- ✅ `getTemplateCount(...)` - Count templates
- ✅ `migrateFromLocalStorage(...)` - Migrate old templates

---

## 🔄 Next Steps: Update ImageGenerator.jsx

You need to update `ImageGenerator.jsx` to use the database instead of localStorage.

### Changes Needed:

#### 1. Import templateService
```javascript
import { supabase, presetService, templateService } from '../lib/supabase'
```

#### 2. Update loadTemplates function (around line 1240)
Replace localStorage logic with:
```javascript
const loadTemplates = useCallback(async () => {
  if (!currentPreset?.id) return;
  
  try {
    // Load from database
    const dbTemplates = await templateService.getTemplates(currentPreset.id);
    setTemplates(dbTemplates);
    
    // Optional: Migrate localStorage templates if any exist
    if (currentUser && dbTemplates.length === 0) {
      const result = await templateService.migrateFromLocalStorage(
        currentPreset.id, 
        currentUser.id
      );
      if (result.migrated > 0) {
        // Reload templates after migration
        const updatedTemplates = await templateService.getTemplates(currentPreset.id);
        setTemplates(updatedTemplates);
      }
    }
  } catch (error) {
    console.error('Failed to load templates:', error);
  }
}, [currentPreset, currentUser]);
```

#### 3. Update handleSaveTemplate function (around line 1984)
Replace localStorage save with:
```javascript
const handleSaveTemplate = useCallback(async (templateName) => {
  if (!currentPreset?.id || !currentUser?.id) {
    alert('Please sign in to save templates');
    return;
  }
  
  setIsSavingTemplate(true);
  
  try {
    // Check template count
    const count = await templateService.getTemplateCount(currentPreset.id);
    if (count >= 4) {
      alert('Maximum of 4 templates per preset. Please delete one first.');
      return;
    }
    
    // Generate thumbnail
    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.width = 200;
    thumbnailCanvas.height = 200;
    const ctx = thumbnailCanvas.getContext('2d');
    await drawFinalImage(ctx);
    const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.7);
    
    // Prepare template data
    const templateData = {
      elements: JSON.parse(JSON.stringify(elements)),
      canvasWidth,
      canvasHeight,
      backgroundType,
      gradientColor1,
      gradientColor2,
      gradientAngle,
      backgroundColor,
      backgroundImage,
      backgroundImageScale,
      backgroundImageX,
      backgroundImageY,
      overlayType,
      overlayColor,
      overlayOpacity,
      overlayGradientColor1,
      overlayGradientOpacity1,
      overlayGradientColor2,
      overlayGradientOpacity2,
      overlayGradientAngle
    };
    
    // Save to database
    await templateService.saveTemplate(
      currentPreset.id,
      currentUser.id,
      templateName,
      templateData,
      thumbnail
    );
    
    // Reload templates
    await loadTemplates();
    
    alert('Template saved successfully!');
  } catch (error) {
    console.error('Failed to save template:', error);
    alert(error.message || 'Failed to save template');
  } finally {
    setIsSavingTemplate(false);
  }
}, [currentPreset, currentUser, elements, canvasWidth, canvasHeight, /* ...other dependencies */]);
```

#### 4. Update handleDeleteTemplate function (around line 2250)
Replace localStorage delete with:
```javascript
const handleDeleteTemplate = useCallback(async (templateId) => {
  try {
    await templateService.deleteTemplate(templateId);
    await loadTemplates(); // Reload templates
    console.log('✅ Template deleted');
  } catch (error) {
    console.error('Failed to delete template:', error);
    alert('Failed to delete template');
  }
}, [loadTemplates]);
```

---

## 🧪 Testing Checklist

After setup, test the following:

- [ ] Create a new template (should save to database)
- [ ] View templates list (should load from database)
- [ ] Delete a template (should remove from database)
- [ ] Try to create 5th template (should show error)
- [ ] Access preset via public URL (templates should load)
- [ ] Test in incognito mode (templates should be visible)
- [ ] Check Supabase dashboard (templates should appear in table)

---

## 🔍 Troubleshooting

### Error: "relation 'public.templates' does not exist"
**Solution:** Run the SQL script in Supabase SQL Editor

### Error: "permission denied for table templates"
**Solution:** Check RLS policies are enabled and correct

### Templates not loading via public URL
**Solution:** Verify preset is marked as `is_public = true`

### Can't save more than 4 templates
**Solution:** This is expected! Delete an old template first

### localStorage templates not migrating
**Solution:** Make sure you're signed in when loading the preset

---

## 📊 Database Queries for Monitoring

### View all templates
```sql
SELECT 
  t.id,
  t.name,
  p.name as preset_name,
  t.created_at
FROM templates t
JOIN presets p ON t.preset_id = p.id
ORDER BY t.created_at DESC;
```

### Count templates per preset
```sql
SELECT 
  p.name as preset_name,
  COUNT(t.id) as template_count
FROM presets p
LEFT JOIN templates t ON p.id = t.preset_id
GROUP BY p.id, p.name
ORDER BY template_count DESC;
```

### Find presets at template limit
```sql
SELECT 
  p.name as preset_name,
  COUNT(t.id) as template_count
FROM presets p
LEFT JOIN templates t ON p.id = t.preset_id
GROUP BY p.id, p.name
HAVING COUNT(t.id) >= 4;
```

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Templates save without localStorage quota errors
2. ✅ Templates load when accessing preset via public URL
3. ✅ Templates visible in Supabase dashboard
4. ✅ 4-template limit enforced automatically
5. ✅ Templates accessible in incognito mode
6. ✅ Old localStorage templates migrated automatically

---

## 🎉 Benefits After Setup

- **No localStorage limits** - Store unlimited templates
- **Cross-device sync** - Access templates anywhere
- **Public sharing** - Templates load via public URLs
- **Better performance** - Database queries faster than localStorage
- **Data persistence** - Never lose templates
- **User-specific** - Each user has their own templates
- **Preset-specific** - 4 templates per preset, not global

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Verify RLS policies are active
4. Ensure user is authenticated
5. Check preset `is_public` status

---

**Ready to go!** 🚀 Run the SQL script and start using database-backed templates!

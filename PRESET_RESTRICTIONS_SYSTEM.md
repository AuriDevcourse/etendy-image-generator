# 🎯 Preset-Based Restrictions System

## Overview

This system allows **admins to create presets with custom tool restrictions**. Each preset has its own unique link, and users accessing via that link will have specific features locked/unlocked based on the admin's configuration.

---

## 🔑 Key Concepts

### **Global Settings vs Preset Settings**

**OLD System (Global):**
- ❌ Admin settings affect ALL users globally
- ❌ One configuration for everyone
- ❌ No flexibility per client/project

**NEW System (Preset-Based):**
- ✅ Each preset has its own restrictions
- ✅ Users access via unique link: `/p/preset-id`
- ✅ Different admins can create different presets
- ✅ Same user can use multiple presets with different restrictions

---

## 📊 How It Works

### 1. **Admin Creates Preset**
```
Admin → Create Preset → Configure Tools → Save
```
- Admin chooses preset name
- Admin selects which tools to enable/disable
- Admin locks specific settings (fonts, colors, canvas size)
- System generates unique preset ID

### 2. **Admin Shares Link**
```
Admin → Copy Link → Share with Users
```
- Link format: `https://yourapp.com/p/abc123xyz`
- Each preset has unique ID
- Link can be shared with specific clients/teams

### 3. **User Accesses Preset**
```
User → Clicks Link → Loads Preset → Restrictions Applied
```
- User opens the preset link
- App loads preset settings and restrictions
- Only allowed tools are visible/enabled
- Locked settings cannot be changed

---

## 🛠️ Configurable Restrictions

### **Background Controls**
- Lock canvas background (color, gradient, image)
- Force specific background settings
- Hide background panel entirely

### **Font Controls**
- Limit available fonts
- Lock font family, weight, size
- Force default font styles

### **Image Controls**
- Enable/disable image upload
- Enable/disable crop tool
- Enable/disable borders
- Enable/disable blur

### **Shape Controls**
- Enable/disable rectangles
- Enable/disable circles
- Enable/disable lines
- Enable/disable stars

### **Canvas Controls**
- Lock canvas size
- Set default dimensions
- Prevent resizing

### **General Controls**
- Enable/disable layers panel
- Enable/disable templates
- Enable/disable undo/redo
- Enable/disable reset button

---

## 💾 Database Structure

### **presets table**
```sql
CREATE TABLE presets (
  id UUID PRIMARY KEY,
  name TEXT,
  admin_email TEXT,
  settings JSONB,           -- Canvas state (elements, colors, etc.)
  restrictions JSONB,        -- NEW: Tool restrictions
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **restrictions JSONB structure**
```json
{
  "backgroundControls": {
    "locked": true,
    "lockedSettings": {
      "canvasBackgroundType": "gradient",
      "canvasGradientColor1": "#FF6B6B",
      "canvasGradientColor2": "#4ECDC4"
    }
  },
  "fonts": {
    "enabled": true,
    "allowedFonts": ["Poppins", "Arial", "Roboto"],
    "lockFontStyles": false
  },
  "imageControls": {
    "uploadEnabled": true,
    "cropEnabled": true,
    "borderEnabled": true,
    "blurEnabled": false
  },
  "shapeControls": {
    "rectangleEnabled": true,
    "circleEnabled": true,
    "lineEnabled": false,
    "starEnabled": false
  },
  "canvasControls": {
    "lockCanvasSize": true,
    "defaultWidth": 1500,
    "defaultHeight": 1500
  },
  "generalControls": {
    "layersEnabled": true,
    "templatesEnabled": false,
    "undoEnabled": true,
    "resetEnabled": true
  }
}
```

---

## 🎨 User Experience

### **For Admins:**
1. Click "Create Preset" button
2. Design the canvas (add elements, text, images)
3. Click "Configure Restrictions" button
4. Toggle which tools users can access
5. Lock specific settings (fonts, colors, sizes)
6. Save preset
7. Copy shareable link
8. Send link to users/clients

### **For Users (via preset link):**
1. Receive preset link from admin
2. Click link → Opens image generator
3. See pre-configured canvas
4. Only allowed tools are visible
5. Locked settings cannot be changed
6. Can still download/export images

---

## 🔄 Workflow Examples

### **Example 1: Brand Guidelines Preset**
**Admin configures:**
- ✅ Lock fonts to brand fonts only
- ✅ Lock canvas size to social media dimensions
- ✅ Lock background to brand colors
- ✅ Enable text and shapes only
- ❌ Disable image upload

**Result:** Users can only create designs following brand guidelines

---

### **Example 2: Photo Editor Preset**
**Admin configures:**
- ✅ Enable image upload
- ✅ Enable crop, borders, blur
- ✅ Disable text and shapes
- ✅ Unlock canvas size
- ✅ Unlock background

**Result:** Users have a simple photo editing experience

---

### **Example 3: Template Preset**
**Admin configures:**
- ✅ Pre-designed template loaded
- ✅ Lock all positions and sizes
- ✅ Allow text editing only
- ✅ Lock fonts to specific styles
- ❌ Disable adding new elements

**Result:** Users can only edit text in predefined areas

---

## 🚀 Implementation Steps

### **Step 1: Database Migration**
Run `update_presets_with_restrictions.sql` in Supabase:
```sql
ALTER TABLE public.presets 
ADD COLUMN IF NOT EXISTS restrictions JSONB DEFAULT '{}'::jsonb;
```

### **Step 2: Update Preset Creation UI**
- Add "Configure Restrictions" button to preset creation
- Create restrictions configuration panel
- Allow admins to toggle each tool/feature
- Save restrictions with preset

### **Step 3: Update Preset Loading Logic**
- When loading preset via `/p/:id`, fetch restrictions
- Apply restrictions to UI (hide/disable tools)
- Enforce locked settings
- Prevent users from changing locked values

### **Step 4: Update Admin Panel**
- Remove global settings (or keep for super admin only)
- Focus on preset-based configuration
- Show preset management dashboard

---

## 🔐 Security Considerations

1. **RLS Policies:**
   - Users can read any active preset
   - Only preset creator can edit/delete
   - Super admins can manage all presets

2. **Validation:**
   - Restrictions are enforced client-side AND server-side
   - Cannot bypass restrictions via API calls
   - Locked settings cannot be modified

3. **Access Control:**
   - Preset links are public (anyone with link can access)
   - Optional: Add password protection to presets
   - Optional: Track preset usage analytics

---

## 📝 Next Steps

1. ✅ Run database migration
2. ⏳ Create preset restrictions UI
3. ⏳ Update preset loading logic
4. ⏳ Test with different restriction combinations
5. ⏳ Add preset management dashboard

---

## 🎯 Benefits

✅ **Flexibility:** Each admin can create custom presets  
✅ **Isolation:** Presets don't affect each other  
✅ **Scalability:** Unlimited presets per admin  
✅ **Control:** Fine-grained tool restrictions  
✅ **Simplicity:** Users only see what they need  
✅ **Branding:** Enforce brand guidelines per preset  

---

**Status:** Database schema ready, UI implementation pending  
**Next:** Create preset restrictions configuration panel

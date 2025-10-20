# 🎯 How to Configure Preset Restrictions

## Quick Start Guide

### Step 1: Access Admin Panel
1. **Sign in** as an admin
2. **Click the Settings icon** (⚙️) in the top-right corner
3. You'll see the Admin Panel open

### Step 2: Go to Preset Management
1. In the Admin Panel, you'll see a **blue button** that says:
   - **"Preset Management"**
   - "Create and configure presets with restrictions"
2. **Click this button** → Opens `/admin/presets` page

### Step 3: Create a Preset with Restrictions
1. **Enter a preset name** (e.g., "Brand Guidelines")
2. **Click "Configure Restrictions"** button
3. A modal opens with all restriction options:
   - 🎨 **Background Controls** - Lock canvas background
   - 🔤 **Font Controls** - Limit available fonts
   - 🖼️ **Image Controls** - Enable/disable upload, crop, borders, blur
   - 🔷 **Shape Controls** - Enable/disable specific shapes
   - 📐 **Canvas Controls** - Lock canvas size
   - ⚙️ **General Controls** - Layers, templates, undo, reset
4. **Toggle the restrictions** you want
5. **Click "Save Preset with Restrictions"**
6. **Copy the link** and share with users!

---

## 📍 Where to Find Everything

### Main App (as Admin):
```
1. Sign in
2. Click Settings icon (⚙️) top-right
3. See two buttons:
   - 🔵 "Preset Management" (all admins)
   - 🟣 "User Management" (super admins only)
```

### Direct URLs:
- **Preset Management:** `http://localhost:5173/admin/presets`
- **User Management:** `http://localhost:5173/admin/users`
- **Main App:** `http://localhost:5173/`

---

## 🎨 Example: Creating a Brand Guidelines Preset

### Scenario:
You want users to only use your brand fonts and colors, no image uploads.

### Steps:
1. Go to `/admin/presets`
2. Enter name: "Brand Guidelines 2024"
3. Click "Configure Restrictions"
4. Configure:
   - ✅ **Lock canvas background** (force brand colors)
   - ✅ **Enable fonts** → Select only brand fonts
   - ❌ **Disable image upload**
   - ✅ **Enable shapes** (rectangles, circles only)
   - ✅ **Lock canvas size** (1500x1500)
5. Click "Save Preset with Restrictions"
6. Share link: `yourapp.com/p/abc123`

### Result:
Users can only:
- Use brand fonts
- Add text and shapes
- Cannot upload images
- Cannot change background
- Cannot resize canvas

---

## 🔍 Troubleshooting

### "I don't see the Settings icon"
- Make sure you're signed in as an admin
- Check your role in User Management
- Refresh the page

### "I don't see Configure Restrictions button"
- Make sure you entered a preset name first
- The button is disabled until you enter a name

### "Restrictions aren't saving"
- Run the database migration first:
  ```sql
  ALTER TABLE public.presets 
  ADD COLUMN IF NOT EXISTS restrictions JSONB DEFAULT '{}'::jsonb;
  ```

### "Users can still access restricted features"
- Restrictions are only applied when accessing via preset link (`/p/:id`)
- Direct access to main app has no restrictions
- Make sure users use the shared preset link

---

## 📊 Restriction Options Explained

### Background Controls
- **Lock canvas background:** Users cannot change canvas colors/gradients/images

### Font Controls
- **Enable font selection:** Allow/disallow font changes
- **Allowed Fonts:** Limit which fonts users can choose
- **Lock font styles:** Force specific font, weight, and size

### Image Controls
- **Enable image upload:** Allow/disallow adding images
- **Enable crop tool:** Allow/disallow cropping images
- **Enable borders:** Allow/disallow image borders
- **Enable blur:** Allow/disallow image blur effect

### Shape Controls
- **Enable rectangles:** Show/hide rectangle tool
- **Enable circles:** Show/hide circle tool
- **Enable lines:** Show/hide line tool
- **Enable stars:** Show/hide star tool

### Canvas Controls
- **Lock canvas size:** Prevent users from resizing canvas

### General Controls
- **Enable layers panel:** Show/hide layers panel
- **Enable templates:** Allow/disallow loading templates
- **Enable undo/redo:** Show/hide undo/redo buttons
- **Enable reset button:** Show/hide reset button

---

## ✅ Quick Checklist

- [ ] Signed in as admin
- [ ] Clicked Settings icon (⚙️)
- [ ] Clicked "Preset Management" button
- [ ] Entered preset name
- [ ] Clicked "Configure Restrictions"
- [ ] Toggled desired restrictions
- [ ] Clicked "Save Preset with Restrictions"
- [ ] Copied and shared preset link
- [ ] Tested link in incognito mode

---

**Need help?** Check the implementation guide in `PRESET_RESTRICTIONS_IMPLEMENTATION.md`

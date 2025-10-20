# 🎯 Preset Restrictions Implementation Guide

## ✅ What's Been Completed

### 1. **Database Schema** ✅
- Added `restrictions` JSONB column to `presets` table
- Created GIN index for fast queries
- Ready to store tool configurations per preset

### 2. **PresetRestrictionsPanel Component** ✅
- Full UI for configuring restrictions
- Accordion-based interface
- Toggle switches for each feature
- Organized by category (Background, Fonts, Images, Shapes, Canvas, General)

### 3. **Service Layer Updates** ✅
- `presetService.createPreset()` now accepts `restrictions` parameter
- `presetService.updatePreset()` now accepts `restrictions` parameter
- Restrictions saved alongside preset settings

---

## 🔧 Integration Steps

### Step 1: Run Database Migration

**In Supabase SQL Editor, run:**
```sql
ALTER TABLE public.presets 
ADD COLUMN IF NOT EXISTS restrictions JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_presets_restrictions ON public.presets USING gin(restrictions);
```

### Step 2: Add Restrictions Panel to Preset Creation Flow

You need to integrate `PresetRestrictionsPanel` into your preset creation/editing UI. Here's where to add it:

**Option A: As a step in preset creation**
```jsx
import PresetRestrictionsPanel from './PresetRestrictionsPanel';

// In your preset creation component
const [presetRestrictions, setPresetRestrictions] = useState({});

// Add this panel after canvas design
<PresetRestrictionsPanel
  restrictions={presetRestrictions}
  onRestrictionsChange={setPresetRestrictions}
  onSave={handleSavePresetWithRestrictions}
  isSaving={isSaving}
/>
```

**Option B: As a tab/section in preset editor**
```jsx
<Tabs>
  <TabsList>
    <TabsTrigger value="design">Design</TabsTrigger>
    <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
  </TabsList>
  <TabsContent value="design">
    {/* Canvas design UI */}
  </TabsContent>
  <TabsContent value="restrictions">
    <PresetRestrictionsPanel ... />
  </TabsContent>
</Tabs>
```

### Step 3: Update Preset Save Functions

**When creating a preset:**
```javascript
const handleSavePreset = async () => {
  try {
    const preset = await presetService.createPreset(
      presetName,
      canvasSettings,
      adminUser.email,
      presetRestrictions  // Add this parameter
    );
    console.log('✅ Preset created with restrictions:', preset);
  } catch (error) {
    console.error('❌ Failed to create preset:', error);
  }
};
```

**When updating a preset:**
```javascript
const handleUpdatePreset = async () => {
  try {
    const preset = await presetService.updatePreset(
      presetId,
      canvasSettings,
      adminUser.id,
      presetRestrictions  // Add this parameter
    );
    console.log('✅ Preset updated with restrictions:', preset);
  } catch (error) {
    console.error('❌ Failed to update preset:', error);
  }
};
```

### Step 4: Apply Restrictions When Loading Preset

**In ImageGenerator.jsx, when loading a preset via `/p/:id`:**

```javascript
// When preset is loaded
useEffect(() => {
  const loadPreset = async () => {
    if (presetId) {
      try {
        const preset = await presetService.getPreset(presetId);
        
        // Apply canvas settings
        applyPresetSettings(preset.settings);
        
        // Apply restrictions
        if (preset.restrictions) {
          setPresetRestrictions(preset.restrictions);
          applyPresetRestrictions(preset.restrictions);
        }
      } catch (error) {
        console.error('Failed to load preset:', error);
      }
    }
  };
  
  loadPreset();
}, [presetId]);

// Function to apply restrictions to UI
const applyPresetRestrictions = (restrictions) => {
  // Store restrictions in state
  setCurrentPresetRestrictions(restrictions);
  
  // Restrictions will be checked throughout the app
  // Example: Hide background panel if locked
  // Example: Filter available fonts
  // Example: Disable certain shape buttons
};
```

### Step 5: Check Restrictions Throughout the App

**Example: Hide background panel if locked**
```jsx
{!currentPresetRestrictions?.backgroundControls?.locked && (
  <Step1Background ... />
)}
```

**Example: Filter available fonts**
```jsx
const availableFonts = currentPresetRestrictions?.fonts?.allowedFonts || ALL_FONTS;
```

**Example: Disable image upload**
```jsx
<Button
  disabled={currentPresetRestrictions?.imageControls?.uploadEnabled === false}
  onClick={handleImageUpload}
>
  Upload Image
</Button>
```

**Example: Hide shape buttons**
```jsx
{currentPresetRestrictions?.shapeControls?.rectangleEnabled !== false && (
  <Button onClick={addRectangle}>Add Rectangle</Button>
)}
```

---

## 📋 Restriction Checks Needed

Add these checks throughout ImageGenerator.jsx:

### Background Controls
```javascript
// Check if background is locked
const isBackgroundLocked = currentPresetRestrictions?.backgroundControls?.locked === true;

// Hide background panel tab
{!isBackgroundLocked && <BackgroundPanel />}
```

### Font Controls
```javascript
// Check if fonts are enabled
const fontsEnabled = currentPresetRestrictions?.fonts?.enabled !== false;

// Get allowed fonts
const allowedFonts = currentPresetRestrictions?.fonts?.allowedFonts || DEFAULT_FONTS;

// Check if font styles are locked
const fontStylesLocked = currentPresetRestrictions?.fonts?.lockFontStyles === true;
```

### Image Controls
```javascript
const uploadEnabled = currentPresetRestrictions?.imageControls?.uploadEnabled !== false;
const cropEnabled = currentPresetRestrictions?.imageControls?.cropEnabled !== false;
const borderEnabled = currentPresetRestrictions?.imageControls?.borderEnabled !== false;
const blurEnabled = currentPresetRestrictions?.imageControls?.blurEnabled !== false;
```

### Shape Controls
```javascript
const rectangleEnabled = currentPresetRestrictions?.shapeControls?.rectangleEnabled !== false;
const circleEnabled = currentPresetRestrictions?.shapeControls?.circleEnabled !== false;
const lineEnabled = currentPresetRestrictions?.shapeControls?.lineEnabled !== false;
const starEnabled = currentPresetRestrictions?.shapeControls?.starEnabled !== false;
```

### Canvas Controls
```javascript
const canvasSizeLocked = currentPresetRestrictions?.canvasControls?.lockCanvasSize === true;
```

### General Controls
```javascript
const layersEnabled = currentPresetRestrictions?.generalControls?.layersEnabled !== false;
const templatesEnabled = currentPresetRestrictions?.generalControls?.templatesEnabled !== false;
const undoEnabled = currentPresetRestrictions?.generalControls?.undoEnabled !== false;
const resetEnabled = currentPresetRestrictions?.generalControls?.resetEnabled !== false;
```

---

## 🎯 Testing Checklist

- [ ] Database migration runs successfully
- [ ] Restrictions panel displays correctly
- [ ] Can toggle restrictions on/off
- [ ] Restrictions save with preset
- [ ] Restrictions load when accessing preset via link
- [ ] Background panel hides when locked
- [ ] Font list filters based on allowed fonts
- [ ] Image controls disable based on restrictions
- [ ] Shape buttons hide based on restrictions
- [ ] Canvas size locks when configured
- [ ] General controls (layers, templates, etc.) respect restrictions

---

## 📝 Next Steps

1. **Run database migration** ✅
2. **Integrate PresetRestrictionsPanel** into preset creation UI
3. **Add restriction checks** throughout ImageGenerator.jsx
4. **Test with different restriction combinations**
5. **Update PresetsDashboard** to show restriction status

---

## 🔗 Files Created

- `database/update_presets_with_restrictions.sql` - Database migration
- `src/components/ImageGenerator/PresetRestrictionsPanel.jsx` - Restrictions UI
- `PRESET_RESTRICTIONS_SYSTEM.md` - System architecture
- `PRESET_RESTRICTIONS_IMPLEMENTATION.md` - This file

---

## 💡 Usage Example

```javascript
// Admin creates preset with restrictions
const restrictions = {
  backgroundControls: { locked: true },
  fonts: {
    enabled: true,
    allowedFonts: ["Poppins", "Arial"],
    lockFontStyles: false
  },
  imageControls: {
    uploadEnabled: true,
    cropEnabled: false,
    borderEnabled: true,
    blurEnabled: true
  },
  shapeControls: {
    rectangleEnabled: true,
    circleEnabled: true,
    lineEnabled: false,
    starEnabled: false
  },
  canvasControls: {
    lockCanvasSize: true
  },
  generalControls: {
    layersEnabled: true,
    templatesEnabled: false,
    undoEnabled: true,
    resetEnabled: true
  }
};

await presetService.createPreset(
  "Brand Guidelines Preset",
  canvasSettings,
  "admin@example.com",
  restrictions
);
```

---

**Status:** Core components ready, integration pending  
**Next:** Add PresetRestrictionsPanel to preset creation flow

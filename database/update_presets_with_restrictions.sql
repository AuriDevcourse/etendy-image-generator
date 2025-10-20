-- Update presets table to include tool restrictions
-- This allows each preset to have its own set of allowed/locked features

-- Add new columns to presets table for tool restrictions
ALTER TABLE public.presets 
ADD COLUMN IF NOT EXISTS restrictions JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.presets.restrictions IS 'Tool and feature restrictions for this preset. Controls what users can access when using this preset link.';

-- Example structure for restrictions column:
-- {
--   "backgroundControls": {
--     "locked": true,
--     "lockedSettings": { ... }
--   },
--   "fonts": {
--     "enabled": true,
--     "allowedFonts": ["Poppins", "Arial"],
--     "lockFontStyles": true,
--     "defaultFont": "Poppins"
--   },
--   "imageControls": {
--     "uploadEnabled": true,
--     "cropEnabled": false,
--     "borderEnabled": true,
--     "blurEnabled": true
--   },
--   "shapeControls": {
--     "rectangleEnabled": true,
--     "circleEnabled": true,
--     "lineEnabled": false,
--     "starEnabled": false
--   },
--   "canvasControls": {
--     "lockCanvasSize": true,
--     "defaultWidth": 1500,
--     "defaultHeight": 1500
--   },
--   "generalControls": {
--     "layersEnabled": true,
--     "templatesEnabled": false,
--     "undoEnabled": true,
--     "resetEnabled": true
--   }
-- }

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_presets_restrictions ON public.presets USING gin(restrictions);

-- Migration: Copy existing admin_settings structure to presets if needed
-- (This is optional - only if you want to migrate existing global settings to presets)

-- Verification query
-- SELECT id, name, admin_email, restrictions FROM public.presets;

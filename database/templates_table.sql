-- =====================================================
-- TEMPLATES TABLE FOR SUPABASE
-- =====================================================
-- This table stores user templates linked to presets
-- Replaces localStorage storage to enable sharing via public URLs
-- =====================================================

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preset_id TEXT NOT NULL REFERENCES public.presets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    thumbnail TEXT, -- Base64 or URL to thumbnail image
    template_data JSONB NOT NULL, -- Full template data (elements, background, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure template names are unique per preset
    CONSTRAINT unique_template_name_per_preset UNIQUE (preset_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_preset_id ON public.templates(preset_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.templates(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can READ templates for active presets
-- This allows templates to be loaded when accessing preset via public URL
CREATE POLICY "Public presets templates are viewable by everyone"
    ON public.templates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.presets
            WHERE presets.id = templates.preset_id
            AND presets.is_active = true
        )
    );

-- Policy 2: Preset owners can READ their own templates (even if preset is private)
CREATE POLICY "Preset owners can view their own templates"
    ON public.templates
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
    );

-- Policy 3: Preset owners can INSERT templates (max 4 per preset enforced in app)
CREATE POLICY "Preset owners can create templates"
    ON public.templates
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
    );

-- Policy 4: Preset owners can UPDATE their templates
CREATE POLICY "Preset owners can update their templates"
    ON public.templates
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
    );

-- Policy 5: Preset owners can DELETE their templates
CREATE POLICY "Preset owners can delete their templates"
    ON public.templates
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
    );

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for templates table
DROP TRIGGER IF EXISTS set_templates_updated_at ON public.templates;
CREATE TRIGGER set_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION TO ENFORCE 4 TEMPLATES PER PRESET LIMIT
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_template_limit()
RETURNS TRIGGER AS $$
DECLARE
    template_count INTEGER;
BEGIN
    -- Count existing templates for this preset
    SELECT COUNT(*) INTO template_count
    FROM public.templates
    WHERE preset_id = NEW.preset_id;
    
    -- If trying to insert and already at limit, raise exception
    IF TG_OP = 'INSERT' AND template_count >= 4 THEN
        RAISE EXCEPTION 'Maximum of 4 templates per preset reached. Please delete an existing template first.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limit
DROP TRIGGER IF EXISTS enforce_template_limit ON public.templates;
CREATE TRIGGER enforce_template_limit
    BEFORE INSERT ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.check_template_limit();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT SELECT ON public.templates TO anon; -- Allow anonymous users to view public preset templates

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.templates IS 'Stores user templates linked to presets. Replaces localStorage to enable template sharing via public URLs.';
COMMENT ON COLUMN public.templates.preset_id IS 'Links template to a preset. Cascades on delete.';
COMMENT ON COLUMN public.templates.user_id IS 'User who created the template. Cascades on delete.';
COMMENT ON COLUMN public.templates.name IS 'Template name (unique per preset).';
COMMENT ON COLUMN public.templates.thumbnail IS 'Base64 or URL to template thumbnail image.';
COMMENT ON COLUMN public.templates.template_data IS 'Full template data including elements, background, overlay, etc.';

-- =====================================================
-- VERIFICATION QUERIES (Run these after setup)
-- =====================================================

-- Check if table was created successfully
-- SELECT * FROM public.templates LIMIT 1;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'templates';

-- Check triggers
-- SELECT * FROM pg_trigger WHERE tgname LIKE '%template%';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update ImageGenerator.jsx to use database instead of localStorage
-- 3. Migrate existing localStorage templates to database (optional)
-- =====================================================

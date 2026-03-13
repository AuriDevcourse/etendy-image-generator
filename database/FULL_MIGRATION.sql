-- =====================================================
-- FULL MIGRATION FOR ETENDY IMAGE GENERATOR (IDEMPOTENT)
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. PRESETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active presets" ON presets;
DROP POLICY IF EXISTS "Users can insert own presets" ON presets;
DROP POLICY IF EXISTS "Users can update own presets" ON presets;
DROP POLICY IF EXISTS "Admins can update admin presets" ON presets;
DROP POLICY IF EXISTS "Users can delete own presets" ON presets;

CREATE POLICY "Anyone can read active presets" ON presets
    FOR SELECT USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Users can insert own presets" ON presets
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR admin_email IS NOT NULL);

CREATE POLICY "Users can update own presets" ON presets
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update admin presets" ON presets
    FOR UPDATE TO authenticated
    USING (admin_email IS NOT NULL)
    WITH CHECK (admin_email IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_presets_user_id ON presets(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_admin_email ON presets(admin_email);
CREATE INDEX IF NOT EXISTS idx_presets_active ON presets(is_active);
CREATE INDEX IF NOT EXISTS idx_presets_deleted_at ON presets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_presets_created_at ON presets(created_at DESC);

CREATE OR REPLACE FUNCTION update_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_presets_timestamp ON presets;
CREATE TRIGGER update_presets_timestamp
    BEFORE UPDATE ON presets
    FOR EACH ROW
    EXECUTE FUNCTION update_presets_updated_at();

GRANT SELECT ON presets TO anon;
GRANT ALL ON presets TO authenticated;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read admin users" ON admin_users;
CREATE POLICY "Anyone can read admin users" ON admin_users
    FOR SELECT USING (true);

GRANT SELECT ON admin_users TO anon;
GRANT ALL ON admin_users TO authenticated;

-- Add restrictions column
ALTER TABLE public.presets
ADD COLUMN IF NOT EXISTS restrictions JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_presets_restrictions ON public.presets USING gin(restrictions);

-- =====================================================
-- 2. TEMPLATES TABLE
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preset_id UUID NOT NULL REFERENCES public.presets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    thumbnail TEXT,
    tag_color TEXT,
    template_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_template_name_per_preset UNIQUE (preset_id, name)
);

CREATE INDEX IF NOT EXISTS idx_templates_preset_id ON public.templates(preset_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.templates(created_at DESC);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public presets templates are viewable by everyone" ON public.templates;
DROP POLICY IF EXISTS "Preset owners can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners can create templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners and admins can create templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners can update their templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners and admins can update templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners can delete their templates" ON public.templates;
DROP POLICY IF EXISTS "Preset owners and admins can delete templates" ON public.templates;

CREATE POLICY "Public presets templates are viewable by everyone"
    ON public.templates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.presets
            WHERE presets.id = templates.preset_id
            AND presets.is_active = true
        )
    );

CREATE POLICY "Preset owners can view their own templates"
    ON public.templates FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
    );

CREATE POLICY "Preset owners and admins can create templates"
    ON public.templates FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
        OR
        (auth.jwt() ->> 'email')::text IN (
            SELECT email FROM public.admin_users
        )
    );

CREATE POLICY "Preset owners and admins can update templates"
    ON public.templates FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
        OR
        (auth.jwt() ->> 'email')::text IN (
            SELECT email FROM public.admin_users
        )
    );

CREATE POLICY "Preset owners and admins can delete templates"
    ON public.templates FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.presets
            WHERE presets.id = templates.preset_id
        )
        OR
        (auth.jwt() ->> 'email')::text IN (
            SELECT email FROM public.admin_users
        )
    );

DROP TRIGGER IF EXISTS set_templates_updated_at ON public.templates;
CREATE TRIGGER set_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.check_template_limit()
RETURNS TRIGGER AS $$
DECLARE
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count
    FROM public.templates
    WHERE preset_id = NEW.preset_id;

    IF TG_OP = 'INSERT' AND template_count >= 4 THEN
        RAISE EXCEPTION 'Maximum of 4 templates per preset reached. Please delete an existing template first.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_template_limit ON public.templates;
CREATE TRIGGER enforce_template_limit
    BEFORE INSERT ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.check_template_limit();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT SELECT ON public.templates TO anon;

-- =====================================================
-- 3. ADMIN SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Authenticated users can insert admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Authenticated users can update admin settings" ON admin_settings;

CREATE POLICY "Anyone can read admin settings" ON admin_settings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can insert admin settings" ON admin_settings
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update admin settings" ON admin_settings
    FOR UPDATE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_admin_settings_active ON admin_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_at ON admin_settings(updated_at DESC);

CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_admin_settings_timestamp ON admin_settings;
CREATE TRIGGER update_admin_settings_timestamp
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_settings_updated_at();

INSERT INTO admin_settings (settings, is_active)
SELECT '{
    "fonts": {
        "enabled": true,
        "allowedFonts": ["Archivo Expanded", "DM Serif Text", "Playfair Display", "Inter", "Archivo"],
        "lockFontStyles": false,
        "defaultFont": "Archivo Expanded",
        "defaultWeight": "600",
        "defaultSize": 80
    },
    "backgroundControls": {
        "locked": false
    },
    "generalControls": {
        "resetEnabled": true,
        "undoEnabled": true
    }
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM admin_settings WHERE is_active = true);

GRANT SELECT ON admin_settings TO anon;
GRANT ALL ON admin_settings TO authenticated;

-- =====================================================
-- 4. USER PROFILE TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    images_generated INTEGER DEFAULT 0,
    templates_created INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can delete own stats" ON user_stats;

CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stats" ON user_stats
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON user_stats TO authenticated;

-- =====================================================
-- 5. USER ROLES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_role UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "New users can insert their own user role" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Manage own or others roles" ON public.user_roles;

CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view roles"
    ON public.user_roles FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Manage own or others roles"
    ON public.user_roles FOR ALL
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "New users can insert their own user role"
    ON public.user_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id AND role = 'user');

DROP TRIGGER IF EXISTS set_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER set_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();

CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = check_user_id;
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;

-- =====================================================
-- 6. GET ALL USERS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    granted_by UUID,
    created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        au.id as user_id,
        COALESCE(ur.role, 'user') as role,
        ur.granted_by,
        au.created_at
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.user_id
    ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_users_with_roles() TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- Remember: Create 'user-images' storage bucket manually
-- Storage > New Bucket > name: user-images, Public: ON
-- =====================================================

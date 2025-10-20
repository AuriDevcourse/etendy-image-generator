import { createClient } from '@supabase/supabase-js'

// Use import.meta.env for Vite instead of process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ Missing Supabase environment variables.\n' +
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file.\n' +
    'See .env.example for reference.'
  )
}

console.log('🔍 Supabase URL:', supabaseUrl)
console.log('🔍 Supabase Key exists:', !!supabaseKey)

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper functions for admin presets
export const presetService = {
  // Get preset by ID (public)
  async getPreset(id) {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data
  },

  // Create new preset (admin only)
  async createPreset(name, settings, adminEmail, restrictions = {}) {
    // Clean settings before saving
    const cleanSettings = this.cleanSettingsForDatabase(settings);
    
    const { data, error} = await supabase
      .from('presets')
      .insert([
        {
          name,
          settings: cleanSettings,
          admin_email: adminEmail,
          restrictions: restrictions,
          is_active: true
        }
      ])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get all presets for admin (excluding soft-deleted)
  async getAdminPresets(adminEmail) {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('admin_email', adminEmail)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Update existing preset (with user ownership verification)
  async updatePreset(presetId, settings, userId = null, restrictions = null) {
    console.log('🔄 Updating preset:', presetId);
    console.log('🔄 New settings:', settings);
    console.log('🔄 User ID:', userId);
    
    // Build update object
    const updateData = {};
    
    // Only update settings if provided
    if (settings !== null) {
      const cleanSettings = this.cleanSettingsForDatabase(settings);
      console.log('🧹 Cleaned settings:', cleanSettings);
      updateData.settings = cleanSettings;
    }
    
    // Only update restrictions if provided
    if (restrictions !== null) {
      updateData.restrictions = restrictions;
      console.log('🔒 Updating restrictions:', restrictions);
    }
    
    // Build the update query
    let query = supabase
      .from('presets')
      .update(updateData)
      .eq('id', presetId);
    
    // If userId is provided, verify ownership
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query
      .select()
      .single()
    
    if (error) {
      console.error('❌ Update preset error:', error);
      if (error.code === 'PGRST116') {
        throw new Error('You do not have permission to update this preset or it does not exist.');
      }
      throw error;
    }
    
    console.log('✅ Preset updated successfully:', data);
    return data
  },

  // Clean settings to ensure database compatibility
  cleanSettingsForDatabase(settings) {
    try {
      // Create a deep copy and clean problematic values
      const cleaned = JSON.parse(JSON.stringify(settings, (key, value) => {
        // Handle undefined values
        if (value === undefined) return null;
        
        // Handle functions (shouldn't be in settings, but just in case)
        if (typeof value === 'function') return null;
        
        // Handle DOM elements or other non-serializable objects
        if (value && typeof value === 'object' && value.nodeType) return null;
        
        // Handle circular references or complex objects
        if (value && typeof value === 'object' && value.constructor && 
            value.constructor.name !== 'Object' && 
            value.constructor.name !== 'Array') {
          // Only keep plain objects and arrays
          return null;
        }
        
        return value;
      }));
      
      // Additional cleaning for elements array - PRESERVE ALL PROPERTIES
      if (cleaned.elements && Array.isArray(cleaned.elements)) {
        cleaned.elements = cleaned.elements.map(element => {
          if (!element || typeof element !== 'object') return null;
          
          // Keep ALL element properties (don't strip them out!)
          // Just ensure they're serializable
          const cleanElement = { ...element };
          
          // Remove any non-serializable properties
          Object.keys(cleanElement).forEach(key => {
            const value = cleanElement[key];
            if (typeof value === 'function' || 
                (value && typeof value === 'object' && value.nodeType)) {
              delete cleanElement[key];
            }
          });
          
          return cleanElement;
        }).filter(Boolean); // Remove null elements
      }
      
      return cleaned;
    } catch (error) {
      console.error('Error cleaning settings:', error);
      // Return a minimal safe version
      return {
        backgroundType: settings.backgroundType || 'gradient',
        gradientColor1: settings.gradientColor1 || '#667eea',
        gradientColor2: settings.gradientColor2 || '#764ba2',
        canvasWidth: settings.canvasWidth || 1500,
        canvasHeight: settings.canvasHeight || 1500,
        elements: [],
        version: '1.0',
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // Rename preset
  async renamePreset(presetId, newName) {
    console.log('✏️ Renaming preset:', presetId, 'to:', newName);
    
    const { data, error } = await supabase
      .from('presets')
      .update({ name: newName })
      .eq('id', presetId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Rename preset error:', error);
      throw error;
    }
    
    console.log('✅ Preset renamed successfully:', data);
    return data
  },

  // Delete preset (soft delete)
  async deletePreset(presetId) {
    console.log('🗑️ ========== DELETE PRESET START ==========');
    console.log('🗑️ Preset ID to delete:', presetId);
    
    // First, get the current user to verify ownership
    console.log('👤 Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Failed to get current user:', userError);
      throw new Error('Not authenticated');
    }
    
    console.log('👤 Current user ID:', user?.id);
    console.log('👤 Current user email:', user?.email);
    
    // Get the preset to see its current state
    const { data: preset, error: fetchError } = await supabase
      .from('presets')
      .select('*')
      .eq('id', presetId)
      .single();
    
    if (fetchError) {
      console.error('❌ Failed to fetch preset:', fetchError);
      throw fetchError;
    }
    
    console.log('📋 Preset before delete:', preset);
    console.log('🔍 Ownership check:', {
      presetUserId: preset.user_id,
      currentUserId: user?.id,
      matches: preset.user_id === user?.id,
      adminEmail: preset.admin_email
    });
    
    const { data, error } = await supabase
      .from('presets')
      .update({ 
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', presetId)
      .select();
    
    if (error) {
      console.error('❌ Soft delete preset error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('✅ Preset soft deleted successfully:', data);
    return true
  },

  // Check if user is admin
  async isAdmin(email) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .single()
    
    return !error && data
  }
}

// Auth helpers
export const authService = {
  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/generator`
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}

// User preferences and stats helpers
export const userService = {
  // Get user preferences
  async getUserPreferences(userId) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error
    }
    
    return data?.preferences || null
  },

  // Save user preferences
  async saveUserPreferences(userId, preferences) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get user stats
  async getUserStats(userId) {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error
    }
    
    return data || {
      user_id: userId,
      images_generated: 0,
      templates_created: 0,
      total_downloads: 0,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  },

  // Update user stats
  async updateUserStats(userId, statsUpdate) {
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        ...statsUpdate,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Failed to update user stats:', error)
      throw error
    }
    return data
  },

  // Increment specific stat
  async incrementStat(userId, statName, incrementBy = 1) {
    const currentStats = await this.getUserStats(userId)
    const newValue = (currentStats[statName] || 0) + incrementBy
    
    return await this.updateUserStats(userId, {
      [statName]: newValue
    })
  },

  // Initialize user profile (called on first login)
  async initializeUserProfile(user) {
    try {
      // Create default preferences (upsert will update if exists)
      await this.saveUserPreferences(user.id, {
        theme: 'dark',
        defaultCanvasSize: 'square',
        autoSave: true,
        showTutorials: true,
        emailNotifications: false,
        defaultFontFamily: 'Inter',
        defaultFontSize: 24,
        preferredImageFormat: 'png',
        compressionQuality: 90
      })

      // Initialize stats (upsert will update if exists)
      await this.updateUserStats(user.id, {
        images_generated: 0,
        templates_created: 0,
        total_downloads: 0,
        last_login: new Date().toISOString(),
        created_at: user.created_at || new Date().toISOString()
      })

      console.log('✅ User profile initialized successfully')
    } catch (error) {
      // Silently handle duplicate key errors (profile already exists)
      if (error.code === '23505') {
        console.log('ℹ️ User profile already exists, skipping initialization')
      } else {
        console.error('❌ Failed to initialize user profile:', error)
      }
      // Don't throw error - this is not critical for app functionality
    }
  }
}

// Admin Settings service for global settings
export const adminSettingsService = {
  // Get the latest active admin settings
  async getSettings() {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error
      }
      
      return data?.settings || null
    } catch (error) {
      console.error('Failed to get admin settings:', error)
      return null
    }
  },

  // Save admin settings (creates new or updates existing)
  async saveSettings(settings, userId) {
    try {
      // First, deactivate all existing settings
      await supabase
        .from('admin_settings')
        .update({ is_active: false })
        .eq('is_active', true)
      
      // Insert new settings as active
      const { data, error } = await supabase
        .from('admin_settings')
        .insert([{
          settings: settings,
          updated_by: userId,
          is_active: true
        }])
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Admin settings saved to Supabase:', data)
      return data
    } catch (error) {
      console.error('❌ Failed to save admin settings:', error)
      throw error
    }
  },

  // Upload background image to Supabase Storage
  async uploadBackgroundImage(file, userId) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `admin/backgrounds/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (error) throw error
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(fileName)
      
      console.log('✅ Background image uploaded to Supabase:', publicUrl)
      return { path: fileName, url: publicUrl }
    } catch (error) {
      console.error('❌ Failed to upload background image:', error)
      throw error
    }
  }
}

// Storage service for uploading images
export const storageService = {
  // Upload image from File object
  async uploadImage(file, userId, folder = 'uploads') {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(fileName)
      
      console.log('✅ Image uploaded to Supabase:', publicUrl)
      return { path: fileName, url: publicUrl }
    } catch (error) {
      console.error('❌ Failed to upload image:', error)
      throw error
    }
  },

  // Upload image from base64 data URL
  async uploadFromDataURL(dataURL, userId, folder = 'generated', fileName = null) {
    try {
      // Convert data URL to blob
      const response = await fetch(dataURL)
      const blob = await response.blob()
      
      // Generate filename
      const timestamp = Date.now()
      const finalFileName = fileName || `${userId}/${folder}/${timestamp}.png`
      
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(finalFileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(finalFileName)
      
      console.log('✅ Image uploaded from data URL to Supabase:', publicUrl)
      return { path: finalFileName, url: publicUrl }
    } catch (error) {
      console.error('❌ Failed to upload image from data URL:', error)
      throw error
    }
  },

  // Upload canvas as image
  async uploadCanvas(canvas, userId, folder = 'generated', customName = null) {
    try {
      return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert canvas to blob'))
            return
          }
          
          const timestamp = Date.now()
          const fileName = customName || `${userId}/${folder}/${timestamp}.png`
          
          const { data, error } = await supabase.storage
            .from('user-images')
            .upload(fileName, blob, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false
            })
          
          if (error) {
            reject(error)
            return
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('user-images')
            .getPublicUrl(fileName)
          
          console.log('✅ Canvas uploaded to Supabase:', publicUrl)
          resolve({ path: fileName, url: publicUrl })
        }, 'image/png', 0.95)
      })
    } catch (error) {
      console.error('❌ Failed to upload canvas:', error)
      throw error
    }
  },

  // Delete image
  async deleteImage(filePath) {
    try {
      const { error } = await supabase.storage
        .from('user-images')
        .remove([filePath])
      
      if (error) throw error
      console.log('✅ Image deleted from Supabase:', filePath)
      return true
    } catch (error) {
      console.error('❌ Failed to delete image:', error)
      throw error
    }
  },

  // List user's images
  async listUserImages(userId, folder = null) {
    try {
      const path = folder ? `${userId}/${folder}` : userId
      
      const { data, error } = await supabase.storage
        .from('user-images')
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      
      if (error) throw error
      
      // Get public URLs for all images
      const imagesWithUrls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('user-images')
          .getPublicUrl(`${path}/${file.name}`)
        
        return {
          ...file,
          url: publicUrl,
          path: `${path}/${file.name}`
        }
      })
      
      return imagesWithUrls
    } catch (error) {
      console.error('❌ Failed to list images:', error)
      throw error
    }
  }
}

// Template service for database-backed templates
export const templateService = {
  // Get all templates for a preset
  async getTemplates(presetId) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('preset_id', presetId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      console.log(`✅ Loaded ${data?.length || 0} templates for preset ${presetId}`)
      return data || []
    } catch (error) {
      console.error('❌ Failed to get templates:', error)
      throw error
    }
  },

  // Save a new template (enforces 4 per preset limit via database trigger)
  async saveTemplate(presetId, userId, name, templateData, thumbnail = null) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert([{
          preset_id: presetId,
          user_id: userId,
          name: name,
          template_data: templateData,
          thumbnail: thumbnail
        }])
        .select()
        .single()
      
      if (error) {
        // Check if it's the template limit error
        if (error.message && error.message.includes('Maximum of 4 templates')) {
          throw new Error('Maximum of 4 templates per preset reached. Please delete an existing template first.')
        }
        // Check if it's a duplicate name error
        if (error.code === '23505' || (error.message && error.message.includes('unique_template_name_per_preset'))) {
          throw new Error(`A template named "${name}" already exists in this preset. Please choose a different name.`)
        }
        throw error
      }
      
      console.log('✅ Template saved to database:', data)
      return data
    } catch (error) {
      console.error('❌ Failed to save template:', error)
      throw error
    }
  },

  // Update an existing template
  async updateTemplate(templateId, updates) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Template updated:', data)
      return data
    } catch (error) {
      console.error('❌ Failed to update template:', error)
      throw error
    }
  },

  // Delete a template
  async deleteTemplate(templateId) {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
      
      if (error) throw error
      
      console.log('✅ Template deleted:', templateId)
      return true
    } catch (error) {
      console.error('❌ Failed to delete template:', error)
      throw error
    }
  },

  // Check template count for a preset
  async getTemplateCount(presetId) {
    try {
      const { count, error } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true })
        .eq('preset_id', presetId)
      
      if (error) throw error
      
      return count || 0
    } catch (error) {
      console.error('❌ Failed to get template count:', error)
      return 0
    }
  },

  // Migrate templates from localStorage to database
  async migrateFromLocalStorage(presetId, userId) {
    try {
      const storageKey = `etendy_templates_preset_${presetId}`
      const localTemplates = JSON.parse(localStorage.getItem(storageKey) || '[]')
      
      if (localTemplates.length === 0) {
        console.log('ℹ️ No templates to migrate from localStorage')
        return { migrated: 0, skipped: 0 }
      }

      console.log(`🔄 Migrating ${localTemplates.length} templates from localStorage...`)
      
      let migrated = 0
      let skipped = 0

      for (const template of localTemplates) {
        try {
          await this.saveTemplate(
            presetId,
            userId,
            template.name,
            template.template_data,
            template.thumbnail
          )
          migrated++
        } catch (error) {
          console.warn(`⚠️ Skipped template "${template.name}":`, error.message)
          skipped++
        }
      }

      console.log(`✅ Migration complete: ${migrated} migrated, ${skipped} skipped`)
      
      // Optionally clear localStorage after successful migration
      if (migrated > 0) {
        console.log('🧹 Clearing localStorage templates after migration')
        localStorage.removeItem(storageKey)
      }

      return { migrated, skipped }
    } catch (error) {
      console.error('❌ Failed to migrate templates:', error)
      throw error
    }
  }
}

// Role Management Service for Super Admin
export const roleService = {
  // Get current user's role
  async getUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, granted_by, created_at')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        // If no role found, user is regular user
        if (error.code === 'PGRST116') {
          return { role: 'user', granted_by: null, created_at: null }
        }
        throw error
      }
      
      return data
    } catch (error) {
      console.error('❌ Failed to get user role:', error)
      return { role: 'user', granted_by: null, created_at: null }
    }
  },

  // Check if user is super admin
  async isSuperAdmin(userId) {
    try {
      const { data } = await supabase
        .rpc('is_super_admin', { check_user_id: userId })
      
      return data === true
    } catch (error) {
      console.error('❌ Failed to check super admin status:', error)
      return false
    }
  },

  // Check if user is admin or super admin
  async isAdmin(userId) {
    try {
      const { data } = await supabase
        .rpc('is_admin', { check_user_id: userId })
      
      return data === true
    } catch (error) {
      console.error('❌ Failed to check admin status:', error)
      return false
    }
  },

  // Get all users with their roles (super admin only)
  async getAllUsersWithRoles() {
    try {
      // First, try to get all users from auth.users via a database function
      // This requires a helper function in Supabase
      const { data: allUsers, error: usersError } = await supabase
        .rpc('get_all_users_with_roles')
      
      if (!usersError && allUsers) {
        return allUsers
      }
      
      // Fallback: Just get from user_roles table
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (rolesError) throw rolesError
      
      // Return roles, marking users without roles as 'user'
      return roles || []
    } catch (error) {
      console.error('❌ Failed to get users with roles:', error)
      throw error
    }
  },

  // Promote user to admin (super admin only)
  async promoteToAdmin(userId, grantedBy) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'admin',
          granted_by: grantedBy,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ User promoted to admin:', userId)
      return data
    } catch (error) {
      console.error('❌ Failed to promote user:', error)
      throw error
    }
  },

  // Demote user to regular user (super admin only)
  async demoteToUser(userId) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .update({
          role: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ User demoted to regular user:', userId)
      return data
    } catch (error) {
      console.error('❌ Failed to demote user:', error)
      throw error
    }
  }
}

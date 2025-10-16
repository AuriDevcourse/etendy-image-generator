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
  async createPreset(name, settings, adminEmail) {
    // Clean settings before saving
    const cleanSettings = this.cleanSettingsForDatabase(settings);
    
    const { data, error } = await supabase
      .from('presets')
      .insert([
        {
          name,
          settings: cleanSettings,
          admin_email: adminEmail,
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

  // Update existing preset
  async updatePreset(presetId, settings) {
    console.log('🔄 Updating preset:', presetId);
    console.log('🔄 New settings:', settings);
    
    // Clean and serialize the settings to ensure JSON compatibility
    const cleanSettings = this.cleanSettingsForDatabase(settings);
    console.log('🧹 Cleaned settings:', cleanSettings);
    
    const { data, error } = await supabase
      .from('presets')
      .update({ settings: cleanSettings })
      .eq('id', presetId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Update preset error:', error);
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
      
      // Additional cleaning for elements array
      if (cleaned.elements && Array.isArray(cleaned.elements)) {
        cleaned.elements = cleaned.elements.map(element => {
          if (!element || typeof element !== 'object') return null;
          
          // Keep only essential properties for each element
          const cleanElement = {
            id: element.id,
            type: element.type,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            rotation: element.rotation || 0,
            opacity: element.opacity || 1,
            zIndex: element.zIndex || 0
          };
          
          // Add type-specific properties
          if (element.type === 'text') {
            cleanElement.text = element.text;
            cleanElement.fontSize = element.fontSize;
            cleanElement.fontFamily = element.fontFamily;
            cleanElement.color = element.color;
            cleanElement.fontWeight = element.fontWeight;
            cleanElement.textAlign = element.textAlign;
          } else if (element.type === 'image') {
            cleanElement.src = element.src;
            cleanElement.naturalWidth = element.naturalWidth;
            cleanElement.naturalHeight = element.naturalHeight;
          } else if (element.type === 'shape') {
            cleanElement.shapeType = element.shapeType;
            cleanElement.fill = element.fill;
            cleanElement.stroke = element.stroke;
            cleanElement.strokeWidth = element.strokeWidth;
          }
          
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
    console.log('🗑️ Soft deleting preset:', presetId);
    
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
        redirectTo: `${window.location.origin}/`
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
      })
      .select()
      .single()
    
    if (error) throw error
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
      // Create default preferences
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

      // Initialize stats
      await this.updateUserStats(user.id, {
        images_generated: 0,
        templates_created: 0,
        total_downloads: 0,
        last_login: new Date().toISOString(),
        created_at: user.created_at || new Date().toISOString()
      })

      console.log('✅ User profile initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize user profile:', error)
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

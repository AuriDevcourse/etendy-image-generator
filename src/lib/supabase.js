import { createClient } from '@supabase/supabase-js'

// Use import.meta.env for Vite instead of process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://frneypfjfscmlahksjyc.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybmV5cGZqZnNjbWxhaGtzanljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTA0NjksImV4cCI6MjA3NDEyNjQ2OX0.lt1SDZ4M6BV_MsMd5R8Qj2Jn0D_CSnacccX5NCmcpa0'

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

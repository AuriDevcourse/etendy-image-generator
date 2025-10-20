import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Copy, ExternalLink, Trash2, User, LogOut, Pencil, RefreshCw, Settings, Database, ArrowLeft, Link2, Eye, Palette } from "lucide-react";
import { presetService, authService, roleService } from '../lib/supabase';
import PresetRestrictionsPanel from './ImageGenerator/PresetRestrictionsPanel';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [presets, setPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [presetName, setPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showRestrictionsPanel, setShowRestrictionsPanel] = useState(false);
  const [presetRestrictions, setPresetRestrictions] = useState({});
  const [editingPresetId, setEditingPresetId] = useState(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Check if user is admin or super admin using new role system
        const adminStatus = await roleService.isAdmin(currentUser.id);
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
          await loadPresets(currentUser.email);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPresets = async (email) => {
    try {
      const userPresets = await presetService.getAdminPresets(email);
      setPresets(userPresets);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setIsAdmin(false);
      setPresets([]);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const saveCurrentAsPreset = async () => {
    if (!presetName.trim() || !user) return;
    
    setIsSaving(true);
    try {
      // Get current settings from localStorage (saved from main app)
      const savedState = localStorage.getItem('etendy_current_design');
      let currentSettings;
      
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          currentSettings = {
            backgroundType: parsedState.backgroundType || 'gradient',
            gradientColor1: parsedState.gradientColor1 || '#667eea',
            gradientColor2: parsedState.gradientColor2 || '#764ba2',
            gradientAngle: parsedState.gradientAngle || 135,
            backgroundColor: parsedState.backgroundColor || '#1e1b4b',
            canvasWidth: parsedState.canvasWidth || 1500,
            canvasHeight: parsedState.canvasHeight || 1500,
            overlayType: parsedState.overlayType || 'solid',
            overlayColor: parsedState.overlayColor || '#000000',
            overlayOpacity: parsedState.overlayOpacity || 0,
            // Include elements if they exist
            elements: parsedState.elements || [],
            hasContent: true
          };
        } catch (error) {
          console.error('Failed to parse saved design:', error);
          currentSettings = getDefaultSettings();
        }
      } else {
        currentSettings = getDefaultSettings();
      }
      
      function getDefaultSettings() {
        return {
          backgroundType: 'gradient',
          gradientColor1: '#667eea',
          gradientColor2: '#764ba2',
          gradientAngle: 135,
          backgroundColor: '#1e1b4b',
          canvasWidth: 1500,
          canvasHeight: 1500,
          overlayType: 'solid',
          overlayColor: '#000000',
          overlayOpacity: 0,
          hasContent: true
        };
      }

      console.log('💾 Creating new preset with restrictions:', presetRestrictions);
      
      const newPreset = await presetService.createPreset(
        presetName.trim(),
        currentSettings,
        user.email,
        presetRestrictions  // Add restrictions
      );

      console.log('✅ New preset created:', newPreset);
      console.log('🔒 Saved restrictions:', newPreset.restrictions);

      setPresets([newPreset, ...presets]);
      setPresetName('');
      setPresetRestrictions({});  // Reset restrictions
      setShowRestrictionsPanel(false);  // Close panel
      alert(`Preset "${newPreset.name}" saved! Share: ${window.location.origin}/p/${newPreset.id}`);
    } catch (error) {
      console.error('Failed to save preset:', error);
      alert('Failed to save preset. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyPresetLink = (presetId) => {
    const link = `${window.location.origin}/p/${presetId}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const openPresetLink = (presetId) => {
    window.open(`${window.location.origin}/p/${presetId}`, '_blank');
  };

  const editPreset = (presetId) => {
    // Redirect to main app with preset loaded and edit mode enabled
    window.location.href = `/p/${presetId}?edit=true`;
  };

  const editPresetRestrictions = (preset) => {
    setEditingPresetId(preset.id);
    setPresetName(preset.name);
    setPresetRestrictions(preset.restrictions || {});
    setShowRestrictionsPanel(true);
  };

  const saveEditedRestrictions = async () => {
    if (!editingPresetId) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Saving restrictions for preset:', editingPresetId);
      console.log('📦 Restrictions to save:', presetRestrictions);
      
      await presetService.updatePreset(
        editingPresetId,
        null, // Don't update settings, only restrictions
        null, // Don't verify ownership, just update by ID
        presetRestrictions
      );
      
      console.log('✅ Restrictions saved successfully!');
      
      // Update local state
      setPresets(presets.map(preset => 
        preset.id === editingPresetId 
          ? { ...preset, restrictions: presetRestrictions }
          : preset
      ));
      
      setEditingPresetId(null);
      setPresetName('');
      setPresetRestrictions({});
      setShowRestrictionsPanel(false);
      alert('Restrictions updated successfully!');
    } catch (error) {
      console.error('❌ Failed to update restrictions:', error);
      alert('Failed to update restrictions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renamePreset = async (presetId, currentName) => {
    const newName = prompt('Enter new preset name:', currentName);
    if (!newName || newName.trim() === '' || newName.trim() === currentName) return;
    
    try {
      await presetService.renamePreset(presetId, newName.trim());
      // Update local state
      setPresets(presets.map(preset => 
        preset.id === presetId 
          ? { ...preset, name: newName.trim() }
          : preset
      ));
      alert('Preset renamed successfully!');
    } catch (error) {
      console.error('Failed to rename preset:', error);
      alert('Failed to rename preset. Please try again.');
    }
  };

  const deletePreset = async (presetId, presetName) => {
    if (!confirm(`Are you sure you want to delete "${presetName}"? This action cannot be undone.`)) return;
    
    try {
      await presetService.deletePreset(presetId);
      
      // Update local state immediately
      setPresets(presets.filter(preset => preset.id !== presetId));
      
      // Also refresh from database to ensure consistency
      setTimeout(async () => {
        try {
          const refreshedPresets = await presetService.getAdminPresets(user.email);
          setPresets(refreshedPresets);
          console.log('🔄 Preset list refreshed after delete');
        } catch (refreshError) {
          console.error('Failed to refresh presets:', refreshError);
        }
      }, 1000);
      
      alert('Preset deleted successfully!');
    } catch (error) {
      console.error('Failed to delete preset:', error);
      alert('Failed to delete preset. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2a1f1a, #000000)' }}>
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2a1f1a, #000000)' }}>
        <Card className="p-8 glass-panel border border-orange-500/20 backdrop-blur-xl bg-white/10">
          <div className="text-center space-y-4">
            <User className="w-12 h-12 text-orange-300 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-white/70">Sign in with Google to access admin features</p>
            <Button onClick={handleSignIn} className="w-full bg-orange-500 hover:bg-orange-600">
              Sign in with Google
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2a1f1a, #000000)' }}>
        <Card className="p-8 glass-panel border border-orange-500/20 backdrop-blur-xl bg-white/10">
          <div className="text-center space-y-4">
            <div className="text-white/80">
              <p>Hello, {user.email}</p>
              <p className="text-sm text-white/60 mt-2">You don't have admin access.</p>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="bg-white/10 border-orange-500/20 text-white hover:bg-white/20">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden p-6" style={{ background: 'linear-gradient(135deg, #2a1f1a, #000000)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Database className="w-8 h-8" />
                Preset Management
              </h1>
              <p className="text-white/60 mt-1">Create and configure presets with restrictions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSignOut} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Create Preset */}
        <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Create New Preset
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-white/80 text-sm">Preset Name</Label>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., Modern Blue Theme"
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={() => setShowRestrictionsPanel(true)}
                  disabled={!presetName.trim()}
                  variant="outline"
                  className="bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/30"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Restrictions
                </Button>
                <Button 
                  onClick={saveCurrentAsPreset}
                  disabled={!presetName.trim() || isSaving}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Preset'}
                </Button>
              </div>
            </div>
            <p className="text-white/60 text-sm">
              Configure which tools and features users can access when using this preset link.
            </p>
          </div>
        </Card>

        {/* Presets List */}
        <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Database className="w-5 h-5" />
              Your Presets ({presets.length})
            </h2>
            <Button
              onClick={async () => {
                try {
                  const refreshedPresets = await presetService.getAdminPresets(user.email);
                  setPresets(refreshedPresets);
                  console.log('🔄 Manual refresh completed');
                } catch (error) {
                  console.error('Failed to refresh presets:', error);
                }
              }}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {presets.length === 0 ? (
            <p className="text-white/60 text-center py-8">
              No presets created yet. Create your first preset above!
            </p>
          ) : (
            <div className="space-y-3">
              {presets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between p-4 glass-panel bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
                  <div>
                    <h3 className="text-white font-medium">{preset.name}</h3>
                    <p className="text-white/60 text-sm">
                      Created {new Date(preset.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-white/40 text-xs font-mono">
                      {window.location.origin}/p/{preset.id}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => editPreset(preset.id)}
                      className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 p-2"
                      title="Edit Preset Design"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => editPresetRestrictions(preset)}
                      className="text-orange-300 hover:text-orange-200 hover:bg-orange-500/20 p-2"
                      title="Edit Restrictions"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => renamePreset(preset.id, preset.name)}
                      className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 p-2"
                      title="Rename Preset"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyPresetLink(preset.id)}
                      className="text-green-300 hover:text-green-200 hover:bg-green-500/20 p-2"
                      title="Copy Link"
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openPresetLink(preset.id)}
                      className="text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/20 p-2"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePreset(preset.id)}
                      className="text-red-300 hover:text-red-200 hover:bg-red-500/20 p-2"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-4">How to Use Presets</h2>
          <div className="space-y-3 text-white/70">
            <div>
              <strong className="text-white">1. Create a Preset:</strong> Design your canvas with the desired background, colors, and settings, then save it as a preset.
            </div>
            <div>
              <strong className="text-white">2. Share the Link:</strong> Copy the preset link and share it with users. They'll see your design automatically loaded.
            </div>
            <div>
              <strong className="text-white">3. User Experience:</strong> When users visit the preset link, they start with your design but can still modify it.
            </div>
          </div>
        </Card>
      </div>

      {/* Restrictions Configuration Modal */}
      {showRestrictionsPanel && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={() => setShowRestrictionsPanel(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div 
              className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Configure Preset Restrictions</h2>
                    <p className="text-white/60 text-sm mt-1">Preset: {presetName}</p>
                  </div>
                  <Button
                    onClick={() => setShowRestrictionsPanel(false)}
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <PresetRestrictionsPanel
                  restrictions={presetRestrictions}
                  onRestrictionsChange={setPresetRestrictions}
                  onSave={editingPresetId ? saveEditedRestrictions : saveCurrentAsPreset}
                  isSaving={isSaving}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

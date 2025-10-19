import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Save, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function Step5Download({ 
  onDownload, 
  isDownloading, 
  onSave, 
  isSaving, 
  onSaveTemplate, 
  isSavingTemplate, 
  onSavePreset, 
  isSavingPreset, 
  isEditMode, 
  presetName,
  onSaveAsNewPreset, // Add new prop for creating new presets
  user = null, // Add user prop for tracking
  onStatsUpdate = null // Add callback for stats updates
}) {
  const [downloadFormat, setDownloadFormat] = useState('jpg');
  
  // Debug logging
  console.log('🔍 Step5Download - user:', user);
  console.log('🔍 Step5Download - onSaveAsNewPreset:', onSaveAsNewPreset);
  console.log('🔍 Step5Download - isEditMode:', isEditMode);

  const handleDownload = async () => {
    // Call the original download function
    await onDownload('jpg');
    
    // Track download if user is logged in
    if (user && onStatsUpdate) {
      try {
        await onStatsUpdate('total_downloads', 1);
        console.log('✅ Download tracked for user:', user.email);
      } catch (error) {
        console.error('❌ Failed to track download:', error);
        // Don't block the download if tracking fails
      }
    }
  };

  return (
    <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Download
        </h3>

        <div className="space-y-4">
          <div className="text-xs text-white/60">
            <p>• Downloads as high-quality JPG format</p>
          </div>

          <Button 
            onClick={handleDownload} 
            disabled={isDownloading} 
            className="w-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-white/20 backdrop-blur-xl text-white hover:from-emerald-500/40 hover:to-teal-500/40 hover:border-white/30 transition-all duration-300 shadow-lg shadow-emerald-500/25 py-3 text-sm font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Download as JPG'}
          </Button>

          {/* Save Preset Button (Edit Mode Only) */}
          {isEditMode && onSavePreset && (
            <Button 
              onClick={onSavePreset} 
              disabled={isSavingPreset} 
              className="w-full bg-gradient-to-r from-blue-500/30 to-indigo-500/30 border border-white/20 backdrop-blur-xl text-white hover:from-blue-500/40 hover:to-indigo-500/40 hover:border-white/30 transition-all duration-300 shadow-lg shadow-blue-500/25 py-3 text-sm font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingPreset ? 'Saving...' : `Update "${presetName}" Preset`}
            </Button>
          )}

          {/* Save as New Preset Button (for logged-in users) - Shows always when logged in */}
          {user && onSaveAsNewPreset && (
            <Button 
              onClick={onSaveAsNewPreset} 
              disabled={isSavingTemplate} 
              className="w-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-white/20 backdrop-blur-xl text-white hover:from-purple-500/40 hover:to-pink-500/40 hover:border-white/30 transition-all duration-300 shadow-lg shadow-purple-500/25 py-3 text-sm font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isSavingTemplate ? 'Saving...' : (isEditMode ? 'Save as Copy' : 'Save as New Preset')}
            </Button>
          )}

          {(onSave || onSaveTemplate) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {onSave && (
                <Button 
                  onClick={onSave} 
                  disabled={isSaving} 
                  variant="outline"
                  className="w-full bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all duration-300 py-3 text-sm font-semibold"
                >
                  {isSaving ? 'Saving...' : 'Save to Gallery'}
                </Button>
              )}

              {onSaveTemplate && (
                <Button
                  onClick={() => {
                    const name = prompt('Enter a template name:');
                    if (name && name.trim()) {
                      onSaveTemplate(name.trim());
                    }
                  }}
                  disabled={isSavingTemplate}
                  variant="outline"
                  className="w-full bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all duration-300 py-3 text-sm font-semibold"
                >
                  {isSavingTemplate ? 'Saving...' : 'Save as Template'}
                </Button>
              )}
              
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Type, Brush, Image as ImageIcon, Shapes, Grid, Palette, Upload, Settings, Download, RotateCw, Expand, Database, Users } from 'lucide-react';
import ColorPicker from './ColorPicker';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploadArea } from './FileUploadArea';
import UserManagement from '../UserManagement/UserManagement';

const FONT_FAMILIES = [
  "BBH Sans Bogle",
  "Poppins",
  "DM Sans",
  "Archivo",
  "Host Grotesk"
];

const LockedBackgroundSettings = ({ settings, onSettingChange, section }) => {
  const [isLoading, setIsLoading] = useState(false);
  const lockedSettings = settings[section]?.lockedSettings || {};

  const handleLockedChange = (key, value) => {
    console.log('🎨 CANVAS BACKGROUND ADMIN CHANGE:', { section, key, value });
    onSettingChange(section, key, value);
  };

  const handleFileProcess = (file) => {
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      handleLockedChange('backgroundImage', e.target.result);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  console.log('🔍 LockedBackgroundSettings render:', { 
    section, 
    lockedSettings, 
    backgroundType: lockedSettings.backgroundType,
    allSettings: settings 
  });

  return (
    <div className="mt-6 p-6 bg-white/5 rounded-lg border border-white/10 space-y-6">
      <h4 className="text-sm font-semibold text-white/80">Locked Canvas Background Settings</h4>
      <div className="w-full relative">
        <div className="grid w-full grid-cols-3 bg-white/10 border border-white/20 h-auto p-1 rounded-lg">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 CANVAS SOLID BUTTON CLICKED - SETTING TO COLOR');
              console.log('🔍 Current lockedSettings before change:', lockedSettings);
              handleLockedChange('backgroundType', 'color');
              console.log('✅ Changed backgroundType to: color');
              return false;
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 py-2"
            style={{
              cursor: 'pointer',
              backgroundColor: (lockedSettings.backgroundType || 'gradient') === 'color' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
            }}
          >
            Solid
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 CANVAS GRADIENT BUTTON CLICKED - SETTING TO GRADIENT');
              console.log('🔍 Current lockedSettings before change:', lockedSettings);
              handleLockedChange('backgroundType', 'gradient');
              console.log('✅ Changed backgroundType to: gradient');
              return false;
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 py-2"
            style={{
              cursor: 'pointer',
              backgroundColor: (lockedSettings.backgroundType || 'gradient') === 'gradient' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
            }}
          >
            Gradient
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 CANVAS IMAGE BUTTON CLICKED - SETTING TO IMAGE');
              console.log('🔍 Current lockedSettings before change:', lockedSettings);
              handleLockedChange('backgroundType', 'image');
              console.log('✅ Changed backgroundType to: image');
              return false;
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 py-2"
            style={{
              cursor: 'pointer',
              backgroundColor: (lockedSettings.backgroundType || 'gradient') === 'image' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
            }}
          >
            Image
          </button>
        </div>
      </div>

      {lockedSettings.backgroundType === 'color' &&
        <div className="pt-2">
          <ColorPicker color={lockedSettings.backgroundColor} onChange={(color) => handleLockedChange('backgroundColor', color)} />
        </div>
      }
      {lockedSettings.backgroundType === 'gradient' &&
        <div className="grid grid-cols-2 gap-4 pt-2">
          <ColorPicker color={lockedSettings.gradientColor1} onChange={(color) => handleLockedChange('gradientColor1', color)} />
          <ColorPicker color={lockedSettings.gradientColor2} onChange={(color) => handleLockedChange('gradientColor2', color)} />
        </div>
      }
      {lockedSettings.backgroundType === 'image' &&
        <div className="space-y-4 pt-2">
          <FileUploadArea
            onFileSelect={handleFileProcess}
            uploadedImage={lockedSettings.backgroundImage}
            onRemoveImage={() => handleLockedChange('backgroundImage', null)}
            disabled={isLoading}>
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-6 h-6 text-white/70" />
              <p className="text-white/80 font-medium">Upload Image</p>
            </div>
          </FileUploadArea>

          {lockedSettings.backgroundImage &&
            <div className="space-y-6">
              <div>
                <Label className="text-white/80 text-xs block mb-3">Image Scale ({Math.round((lockedSettings.backgroundImageScale || 1) * 100)}%)</Label>
                <Slider value={[lockedSettings.backgroundImageScale || 1]} onValueChange={([val]) => handleLockedChange('backgroundImageScale', val)} min={0.1} max={5} step={0.01} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/80 text-xs block mb-3">X Position ({lockedSettings.backgroundImageX || 0}px)</Label>
                  <Slider value={[lockedSettings.backgroundImageX || 0]} onValueChange={([val]) => handleLockedChange('backgroundImageX', val)} min={-1000} max={1000} step={1} />
                </div>
                <div>
                  <Label className="text-white/80 text-xs block mb-3">Y Position ({lockedSettings.backgroundImageY || 0}px)</Label>
                  <Slider value={[lockedSettings.backgroundImageY || 0]} onValueChange={([val]) => handleLockedChange('backgroundImageY', val)} min={-1000} max={1000} step={1} />
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>);

};

const LockedPageBackgroundSettings = ({ settings, onSettingChange, section }) => {
  const [isLoading, setIsLoading] = useState(false);
  const lockedSettings = settings[section]?.lockedSettings || {};
  const pageBackgroundType = lockedSettings.pageBackgroundType || 'gradient';

  const handleLockedChange = (key, value) => {
    console.log('🎨 PAGE BACKGROUND ADMIN CHANGE:', { section, key, value });
    onSettingChange(section, key, value);
  };

  const handleFileProcess = (file) => {
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      handleLockedChange('pageBackgroundImage', e.target.result);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  console.log('🔍 LockedPageBackgroundSettings render:', { 
    section, 
    lockedSettings, 
    pageBackgroundType: pageBackgroundType,
    allSettings: settings 
  });

  return (
    <div className="mt-6 p-6 bg-white/5 rounded-lg border border-white/10 space-y-6">
      <h4 className="text-sm font-semibold text-white/80">Locked Page Background Settings</h4>
      <div className="w-full relative">
        <div className="grid w-full grid-cols-3 bg-white/10 border border-white/20 h-auto p-1 rounded-lg">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 SOLID BUTTON CLICKED - SETTING TO COLOR');
              console.log('🔍 Current lockedSettings before change:', lockedSettings);
              handleLockedChange('pageBackgroundType', 'color');
              console.log('✅ Changed pageBackgroundType to: color');
              return false;
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 Solid mouse down - SETTING TO COLOR');
              return false;
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 Solid mouse up - SETTING TO COLOR');
              return false;
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 py-2"
            style={{
              cursor: 'pointer',
              backgroundColor: pageBackgroundType === 'color' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
            }}
          >
            Solid
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 GRADIENT BUTTON CLICKED - SETTING TO GRADIENT');
              console.log('🔍 Current lockedSettings before change:', lockedSettings);
              handleLockedChange('pageBackgroundType', 'gradient');
              console.log('✅ Changed pageBackgroundType to: gradient');
              return false;
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 Gradient mouse down - SETTING TO GRADIENT');
              return false;
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 Gradient mouse up - SETTING TO GRADIENT');
              return false;
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 py-2"
            style={{
              cursor: 'pointer',
              backgroundColor: pageBackgroundType === 'gradient' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
            }}
          >
            Gradient
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 IMAGE BUTTON CLICKED - SETTING TO IMAGE');
              console.log('🔍 Current lockedSettings before change:', lockedSettings);
              handleLockedChange('pageBackgroundType', 'image');
              console.log('✅ Changed pageBackgroundType to: image');
              return false;
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 Image mouse down - SETTING TO IMAGE');
              return false;
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 Image mouse up - SETTING TO IMAGE');
              return false;
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 py-2"
            style={{
              cursor: 'pointer',
              backgroundColor: pageBackgroundType === 'image' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
            }}
          >
            Image
          </button>
        </div>
      </div>

      {pageBackgroundType === 'color' &&
        <div className="pt-2">
          <ColorPicker color={lockedSettings.pageBackgroundColor || '#1e1b4b'} onChange={(color) => handleLockedChange('pageBackgroundColor', color)} />
        </div>
      }
      {pageBackgroundType === 'gradient' &&
        <div className="grid grid-cols-2 gap-4 pt-2">
          <ColorPicker color={lockedSettings.pageGradientColor1 || '#6366f1'} onChange={(color) => handleLockedChange('pageGradientColor1', color)} />
          <ColorPicker color={lockedSettings.pageGradientColor2 || '#8b5cf6'} onChange={(color) => handleLockedChange('pageGradientColor2', color)} />
        </div>
      }
      {pageBackgroundType === 'image' &&
        <div className="space-y-4 pt-2">
          <FileUploadArea
            onFileSelect={handleFileProcess}
            uploadedImage={lockedSettings.pageBackgroundImage}
            onRemoveImage={() => handleLockedChange('pageBackgroundImage', null)}
            disabled={isLoading}>
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-6 h-6 text-white/70" />
              <p className="text-white/80 font-medium">Upload Image</p>
            </div>
          </FileUploadArea>

          {lockedSettings.pageBackgroundImage &&
            <div className="space-y-6">
              <div>
                <Label className="text-white/80 text-xs block mb-3">Image Scale ({Math.round((lockedSettings.pageBackgroundScale || 1) * 100)}%)</Label>
                <Slider value={[lockedSettings.pageBackgroundScale || 1]} onValueChange={([val]) => handleLockedChange('pageBackgroundScale', val)} min={0.1} max={5} step={0.01} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/80 text-xs block mb-3">X Position ({lockedSettings.pageBackgroundX || 0}px)</Label>
                  <Slider value={[lockedSettings.pageBackgroundX || 0]} onValueChange={([val]) => handleLockedChange('pageBackgroundX', val)} min={-1000} max={1000} step={1} />
                </div>
                <div>
                  <Label className="text-white/80 text-xs block mb-3">Y Position ({lockedSettings.pageBackgroundY || 0}px)</Label>
                  <Slider value={[lockedSettings.pageBackgroundY || 0]} onValueChange={([val]) => handleLockedChange('pageBackgroundY', val)} min={-1000} max={1000} step={1} />
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  );
};


export default function AdminPanel({ settings, onSettingChange, onSave, isSaving, hasUnsavedChanges, showSavedMessage, adminUser, isSuperAdmin }) {
  const handleNestedChange = (section, key, value) => {
    onSettingChange({
      ...settings,
      [section]: {
        ...(settings[section] || {}),
        [key]: value
      }
    });
  };

  const handleLockedSettingsChange = (section, key, value) => {
    onSettingChange({
      ...settings,
      [section]: {
        ...(settings[section] || {}),
        lockedSettings: {
          ...(settings[section]?.lockedSettings || {}),
          [key]: value
        }
      }
    });
  };

  const handleFontSelection = (fontName) => {
    const currentAllowed = settings.fonts?.allowedFonts || [];
    const newAllowed = currentAllowed.includes(fontName) ?
      currentAllowed.filter((f) => f !== fontName) :
      [...currentAllowed, fontName];
    handleNestedChange('fonts', 'allowedFonts', newAllowed);
  };

  return (
    <div className="h-full">
      {/* Custom scrollbar styles */}
      <style>{`
        .admin-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .admin-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .admin-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .admin-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .admin-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <div className="admin-scroll space-y-6 max-h-[80vh] overflow-y-auto px-6 py-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            {isSuperAdmin ? 'Super Admin Controls' : 'Admin Panel'}
          </h2>
          <p className="text-sm text-white/70">
            {isSuperAdmin 
              ? 'Control which features are visible to regular users. Changes apply on page refresh.'
              : 'Manage your presets and configurations. Contact super admin for advanced settings.'
            }
          </p>
        </div>

        {/* Admin Quick Links */}
        <div className="mb-6 space-y-3">
          {/* Preset Management - All Admins */}
          <Button
            onClick={() => window.location.href = '/admin/presets'}
            className="w-full py-6 text-white bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all flex items-center justify-center gap-3 text-lg"
          >
            <Database className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Preset Management</div>
              <div className="text-xs text-white/70">Create and configure presets with restrictions</div>
            </div>
          </Button>

          {/* User Management - Super Admin Only */}
          {isSuperAdmin && (
            <Button
              onClick={() => window.location.href = '/admin/users'}
              className="w-full py-6 text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all flex items-center justify-center gap-3 text-lg"
            >
              <Users className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">User Management</div>
                <div className="text-xs text-white/70">Manage user roles and permissions</div>
              </div>
            </Button>
          )}
        </div>

        {/* All controls - Super Admin Only */}
        {isSuperAdmin && (
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="pageBackground" className="bg-white/5 rounded-lg border border-white/10">
            <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-white/80" /> Page Background Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white/80 font-medium">Lock page background</Label>
                  <p className="text-xs text-white/60">Users cannot change the page background.</p>
                </div>
                <Switch
                  checked={settings.pageBackgroundControls?.locked || false}
                  onCheckedChange={(checked) => handleNestedChange('pageBackgroundControls', 'locked', checked)}
                />
              </div>
              {/* Always show locked settings configuration for admins */}
              <LockedPageBackgroundSettings settings={settings} onSettingChange={handleLockedSettingsChange} section="pageBackgroundControls" />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="canvasBackground" className="bg-white/5 rounded-lg border border-white/10">
            <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
              <div className="flex items-center gap-3">
                <Brush className="w-5 h-5 text-white/80" /> Canvas Background Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white/80 font-medium">Lock canvas background</Label>
                  <p className="text-xs text-white/60">Users cannot change the canvas background.</p>
                </div>
                <Switch
                  checked={settings.backgroundControls?.locked || false}
                  onCheckedChange={(checked) => handleNestedChange('backgroundControls', 'locked', checked)} />
              </div>
              {/* Always show locked settings configuration for admins */}
              <LockedBackgroundSettings settings={settings} onSettingChange={handleLockedSettingsChange} section="backgroundControls" />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="canvas" className="bg-white/5 rounded-lg border border-white/10">
            <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
              <div className="flex items-center gap-3">
                <Expand className="w-5 h-5 text-white/80" /> Canvas Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80 text-xs">Default Width (px)</Label>
                  <Input type="number" value={settings.canvasControls?.defaultWidth || 1500} onChange={(e) => handleNestedChange('canvasControls', 'defaultWidth', parseInt(e.target.value))} className="glass-input bg-white/5 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80 text-xs">Default Height (px)</Label>
                  <Input type="number" value={settings.canvasControls?.defaultHeight || 1500} onChange={(e) => handleNestedChange('canvasControls', 'defaultHeight', parseInt(e.target.value))} className="glass-input bg-white/5 border-white/20 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <Label className="text-white/80 font-medium">Lock canvas size</Label>
                  <p className="text-xs text-white/60">Users cannot change the canvas dimensions.</p>
                </div>
                <Switch
                  checked={settings.canvasControls?.lockCanvasSize || false}
                  onCheckedChange={(checked) => handleNestedChange('canvasControls', 'lockCanvasSize', checked)} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fonts" className="bg-white/5 rounded-lg border border-white/10">
            <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-white/80" /> Font Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white/80 font-medium">Enable font selection for users</Label>
                </div>
                <Switch
                  checked={settings.fonts?.enabled !== false}
                  onCheckedChange={(checked) => handleNestedChange('fonts', 'enabled', checked)} />
              </div>
              <div className="space-y-4">
                <Label className="text-white/80 font-medium">Allowed Fonts</Label>
                <div className="grid grid-cols-2 gap-3">
                  {FONT_FAMILIES.map((font) =>
                    <div key={font} className="flex items-center gap-3">
                      <Switch
                        id={`font-${font}`}
                        checked={(settings.fonts?.allowedFonts || []).includes(font)}
                        onCheckedChange={() => handleFontSelection(font)}
                        disabled={settings.fonts?.enabled === false} />
                      <Label htmlFor={`font-${font}`} className="text-xs text-white/70">{font}</Label>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white/80 font-medium">Lock font styles</Label>
                  <p className="text-xs text-white/60">Force all text to use a default style.</p>
                </div>
                <Switch
                  checked={settings.fonts?.lockFontStyles || false}
                  onCheckedChange={(checked) => handleNestedChange('fonts', 'lockFontStyles', checked)} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="images" className="bg-white/5 rounded-lg border border-white/10">
            <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-white/80" /> Image Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm font-medium">Enable Image Upload</Label>
                  <Switch
                    checked={settings.imageControls?.uploadEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('imageControls', 'uploadEnabled', checked)} />
                </div>
                <div className={`space-y-4 pl-6 border-l-2 border-white/10 ${settings.imageControls?.uploadEnabled === false ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80 text-sm">Enable Crop</Label>
                    <Switch
                      checked={settings.imageControls?.cropEnabled !== false}
                      onCheckedChange={(checked) => handleNestedChange('imageControls', 'cropEnabled', checked)}
                      disabled={settings.imageControls?.uploadEnabled === false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80 text-sm">Enable Border</Label>
                    <Switch
                      checked={settings.imageControls?.borderEnabled !== false}
                      onCheckedChange={(checked) => handleNestedChange('imageControls', 'borderEnabled', checked)}
                      disabled={settings.imageControls?.uploadEnabled === false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80 text-sm">Enable Blur</Label>
                    <Switch
                      checked={settings.imageControls?.blurEnabled !== false}
                      onCheckedChange={(checked) => handleNestedChange('imageControls', 'blurEnabled', checked)}
                      disabled={settings.imageControls?.uploadEnabled === false} />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="shapes" className="bg-white/5 rounded-lg border border-white/10">
            <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
              <div className="flex items-center gap-3">
                <Shapes className="w-5 h-5 text-white/80" /> Shape Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Rectangle</Label>
                  <Switch
                    checked={settings.shapeControls?.rectangleEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('shapeControls', 'rectangleEnabled', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Circle</Label>
                  <Switch
                    checked={settings.shapeControls?.circleEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('shapeControls', 'circleEnabled', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Line</Label>
                  <Switch
                    checked={settings.shapeControls?.lineEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('shapeControls', 'lineEnabled', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Star</Label>
                  <Switch
                    checked={settings.shapeControls?.starEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('shapeControls', 'starEnabled', checked)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="general" className="bg-white/5 rounded-lg border border-white/10">
            <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
              <div className="flex items-center gap-3">
                <Grid className="w-5 h-5 text-white/80" /> General Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Layers</Label>
                  <Switch
                    checked={settings.generalControls?.layersEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('generalControls', 'layersEnabled', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Templates</Label>
                  <Switch
                    checked={settings.generalControls?.templatesEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('generalControls', 'templatesEnabled', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Gallery</Label>
                  <Switch
                    checked={settings.generalControls?.galleryEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('generalControls', 'galleryEnabled', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Undo</Label>
                  <Switch
                    checked={settings.generalControls?.undoEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('generalControls', 'undoEnabled', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Reset</Label>
                  <Switch
                    checked={settings.generalControls?.resetEnabled !== false}
                    onCheckedChange={(checked) => handleNestedChange('generalControls', 'resetEnabled', checked)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        )}

        <div className="pt-4 space-y-3">
          {/* Preset Management Button */}
          <Button
            onClick={() => {
              // Navigate to unified presets page
              if (adminUser?.id) {
                window.location.href = `/presets/${adminUser.id}`;
              }
            }}
            className="w-full py-3 text-white bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2 text-orange-300"
          >
            <Database className="w-4 h-4" />
            My Presets
          </Button>

          {/* Save Settings Button - Super Admin Only */}
          {isSuperAdmin && (
          <Button
            onClick={(e) => {
              console.log('🎯 ADMIN PANEL: Save Settings button clicked!');
              console.log('🔍 onSave function:', onSave);
              console.log('🔍 isSaving state:', isSaving);
              e.preventDefault();
              e.stopPropagation();
              if (onSave) {
                console.log('✅ Calling onSave function...');
                onSave();
              } else {
                console.error('❌ onSave function is not defined!');
              }
            }}
            disabled={isSaving}
            className={`w-full py-3 text-white transition-all ${
              showSavedMessage
                ? 'bg-green-500 hover:bg-green-600'
                : hasUnsavedChanges 
                ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' 
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}>
            {showSavedMessage ? 'Saved!' : isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes *' : 'Save Settings'}
          </Button>
          )}
        </div>
      </div>
    </div>);
}

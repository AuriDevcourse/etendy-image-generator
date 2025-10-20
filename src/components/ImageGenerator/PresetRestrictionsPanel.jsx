import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Lock, Unlock, Settings, Type, Image as ImageIcon, Shapes, Palette, Grid, Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FONT_FAMILIES = [
  "BBH Sans Bogle",
  "Poppins",
  "DM Sans",
  "Archivo",
  "Host Grotesk"
];

export default function PresetRestrictionsPanel({ restrictions, onRestrictionsChange, onSave, isSaving }) {
  const [localRestrictions, setLocalRestrictions] = useState(restrictions || {});

  const handleChange = (section, key, value) => {
    const updated = {
      ...localRestrictions,
      [section]: {
        ...(localRestrictions[section] || {}),
        [key]: value
      }
    };
    console.log('🔧 Restriction changed:', section, key, '=', value);
    console.log('📦 Updated restrictions:', updated);
    setLocalRestrictions(updated);
    onRestrictionsChange(updated);
  };

  const handleFontSelection = (fontName) => {
    const currentAllowed = localRestrictions.fonts?.allowedFonts || [];
    const newAllowed = currentAllowed.includes(fontName)
      ? currentAllowed.filter(f => f !== fontName)
      : [...currentAllowed, fontName];
    
    handleChange('fonts', 'allowedFonts', newAllowed);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Preset Restrictions
        </h3>
        <p className="text-sm text-white/70">
          Configure which tools and features users can access when using this preset link.
        </p>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-500/10 border border-blue-500/20 p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <strong>Note:</strong> These restrictions only apply to users accessing this specific preset via its unique link. They do not affect other presets or the main app.
          </div>
        </div>
      </Card>

      <Accordion type="multiple" className="space-y-4">
        {/* Page Background Controls */}
        <AccordionItem value="pageBackground" className="bg-white/5 rounded-lg border border-white/10">
          <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-white/80" />
              Page Background (App Background)
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white/80 font-medium">Lock page background</Label>
                <p className="text-xs text-white/60">Set the background color/gradient around the canvas</p>
              </div>
              <Switch
                checked={localRestrictions.pageBackgroundControls?.locked || false}
                onCheckedChange={(checked) => handleChange('pageBackgroundControls', 'locked', checked)}
              />
            </div>
            {localRestrictions.pageBackgroundControls?.locked && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
                <div>
                  <Label className="text-white/80 text-sm mb-2 block">Background Type</Label>
                  <Tabs 
                    value={localRestrictions.pageBackgroundControls?.backgroundType || 'gradient'}
                    onValueChange={(value) => handleChange('pageBackgroundControls', 'backgroundType', value)}
                  >
                    <TabsList className="grid w-full grid-cols-3 bg-white/10">
                      <TabsTrigger value="solid" className="data-[state=active]:bg-white/20">Solid</TabsTrigger>
                      <TabsTrigger value="gradient" className="data-[state=active]:bg-white/20">Gradient</TabsTrigger>
                      <TabsTrigger value="image" className="data-[state=active]:bg-white/20">Image</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Solid Color Picker */}
                {localRestrictions.pageBackgroundControls?.backgroundType === 'solid' && (
                  <div>
                    <Label className="text-white/80 text-sm mb-2 block">Solid Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={localRestrictions.pageBackgroundControls?.solidColor || '#2a1f1a'}
                        onChange={(e) => handleChange('pageBackgroundControls', 'solidColor', e.target.value)}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={localRestrictions.pageBackgroundControls?.solidColor || '#2a1f1a'}
                        onChange={(e) => handleChange('pageBackgroundControls', 'solidColor', e.target.value)}
                        className="flex-1 bg-white/10 border-white/20 text-white"
                        placeholder="#2a1f1a"
                      />
                    </div>
                  </div>
                )}

                {/* Gradient Color Pickers */}
                {localRestrictions.pageBackgroundControls?.backgroundType === 'gradient' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white/80 text-sm mb-2 block">Gradient Color 1</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={localRestrictions.pageBackgroundControls?.gradientColor1 || '#2a1f1a'}
                          onChange={(e) => handleChange('pageBackgroundControls', 'gradientColor1', e.target.value)}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={localRestrictions.pageBackgroundControls?.gradientColor1 || '#2a1f1a'}
                          onChange={(e) => handleChange('pageBackgroundControls', 'gradientColor1', e.target.value)}
                          className="flex-1 bg-white/10 border-white/20 text-white"
                          placeholder="#2a1f1a"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm mb-2 block">Gradient Color 2</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={localRestrictions.pageBackgroundControls?.gradientColor2 || '#000000'}
                          onChange={(e) => handleChange('pageBackgroundControls', 'gradientColor2', e.target.value)}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={localRestrictions.pageBackgroundControls?.gradientColor2 || '#000000'}
                          onChange={(e) => handleChange('pageBackgroundControls', 'gradientColor2', e.target.value)}
                          className="flex-1 bg-white/10 border-white/20 text-white"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Background */}
                {localRestrictions.pageBackgroundControls?.backgroundType === 'image' && (
                  <div>
                    <Label className="text-white/80 text-sm mb-2 block">Background Image URL</Label>
                    <Input
                      type="text"
                      value={localRestrictions.pageBackgroundControls?.imageUrl || ''}
                      onChange={(e) => handleChange('pageBackgroundControls', 'imageUrl', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-xs text-white/50 mt-1">Enter a direct URL to an image</p>
                  </div>
                )}

                <p className="text-xs text-white/60 pt-2 border-t border-white/10">
                  This is the background color/image around the canvas (the app page background).
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Canvas Background Controls */}
        <AccordionItem value="canvasBackground" className="bg-white/5 rounded-lg border border-white/10">
          <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Grid className="w-5 h-5 text-white/80" />
              Canvas Background (Inside Canvas)
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white/80 font-medium">Lock canvas background</Label>
                <p className="text-xs text-white/60">Users cannot change the canvas background</p>
              </div>
              <Switch
                checked={localRestrictions.backgroundControls?.locked || false}
                onCheckedChange={(checked) => handleChange('backgroundControls', 'locked', checked)}
              />
            </div>
            {localRestrictions.backgroundControls?.locked && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
                <div>
                  <Label className="text-white/80 text-sm mb-2 block">Background Type</Label>
                  <Tabs 
                    value={localRestrictions.backgroundControls?.backgroundType || 'gradient'}
                    onValueChange={(value) => handleChange('backgroundControls', 'backgroundType', value)}
                  >
                    <TabsList className="grid w-full grid-cols-3 bg-white/10">
                      <TabsTrigger value="solid" className="data-[state=active]:bg-white/20">Solid</TabsTrigger>
                      <TabsTrigger value="gradient" className="data-[state=active]:bg-white/20">Gradient</TabsTrigger>
                      <TabsTrigger value="image" className="data-[state=active]:bg-white/20">Image</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Solid Color Picker */}
                {localRestrictions.backgroundControls?.backgroundType === 'solid' && (
                  <div>
                    <Label className="text-white/80 text-sm mb-2 block">Solid Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={localRestrictions.backgroundControls?.solidColor || '#211c1a'}
                        onChange={(e) => handleChange('backgroundControls', 'solidColor', e.target.value)}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={localRestrictions.backgroundControls?.solidColor || '#211c1a'}
                        onChange={(e) => handleChange('backgroundControls', 'solidColor', e.target.value)}
                        className="flex-1 bg-white/10 border-white/20 text-white"
                        placeholder="#211c1a"
                      />
                    </div>
                  </div>
                )}

                {/* Gradient Color Pickers */}
                {localRestrictions.backgroundControls?.backgroundType === 'gradient' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white/80 text-sm mb-2 block">Gradient Color 1</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={localRestrictions.backgroundControls?.gradientColor1 || '#6366f1'}
                          onChange={(e) => handleChange('backgroundControls', 'gradientColor1', e.target.value)}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={localRestrictions.backgroundControls?.gradientColor1 || '#6366f1'}
                          onChange={(e) => handleChange('backgroundControls', 'gradientColor1', e.target.value)}
                          className="flex-1 bg-white/10 border-white/20 text-white"
                          placeholder="#6366f1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm mb-2 block">Gradient Color 2</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={localRestrictions.backgroundControls?.gradientColor2 || '#8b5cf6'}
                          onChange={(e) => handleChange('backgroundControls', 'gradientColor2', e.target.value)}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={localRestrictions.backgroundControls?.gradientColor2 || '#8b5cf6'}
                          onChange={(e) => handleChange('backgroundControls', 'gradientColor2', e.target.value)}
                          className="flex-1 bg-white/10 border-white/20 text-white"
                          placeholder="#8b5cf6"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm mb-2 block">Gradient Angle</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="range"
                          min="0"
                          max="360"
                          value={localRestrictions.backgroundControls?.gradientAngle || 135}
                          onChange={(e) => handleChange('backgroundControls', 'gradientAngle', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={localRestrictions.backgroundControls?.gradientAngle || 135}
                          onChange={(e) => handleChange('backgroundControls', 'gradientAngle', parseInt(e.target.value) || 135)}
                          className="w-20 bg-white/10 border-white/20 text-white text-center"
                          min="0"
                          max="360"
                        />
                        <span className="text-white/60 text-sm">°</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Upload (placeholder for now) */}
                {localRestrictions.backgroundControls?.backgroundType === 'image' && (
                  <div>
                    <Label className="text-white/80 text-sm mb-2 block">Background Image URL</Label>
                    <Input
                      type="text"
                      value={localRestrictions.backgroundControls?.imageUrl || ''}
                      onChange={(e) => handleChange('backgroundControls', 'imageUrl', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-xs text-white/50 mt-1">Enter a direct URL to an image</p>
                  </div>
                )}

                <p className="text-xs text-white/60 pt-2 border-t border-white/10">
                  Users will see this background when they access the preset link.
                </p>
              </div>
            )}
            
            {/* Canvas Size Controls - moved here */}
            <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white/80 font-medium">Lock canvas size</Label>
                  <p className="text-xs text-white/60">Users cannot resize the canvas</p>
                </div>
                <Switch
                  checked={localRestrictions.canvasControls?.lockCanvasSize || false}
                  onCheckedChange={(checked) => handleChange('canvasControls', 'lockCanvasSize', checked)}
                />
              </div>
              {localRestrictions.canvasControls?.lockCanvasSize && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/80 text-sm mb-2 block">Width (px)</Label>
                      <Input
                        type="number"
                        value={localRestrictions.canvasControls?.defaultWidth || 1500}
                        onChange={(e) => handleChange('canvasControls', 'defaultWidth', parseInt(e.target.value) || 1500)}
                        className="bg-white/10 border-white/20 text-white"
                        min="100"
                        max="5000"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm mb-2 block">Height (px)</Label>
                      <Input
                        type="number"
                        value={localRestrictions.canvasControls?.defaultHeight || 1500}
                        onChange={(e) => handleChange('canvasControls', 'defaultHeight', parseInt(e.target.value) || 1500)}
                        className="bg-white/10 border-white/20 text-white"
                        min="100"
                        max="5000"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-white/60">
                    Canvas will be locked to <strong>{localRestrictions.canvasControls?.defaultWidth || 1500}x{localRestrictions.canvasControls?.defaultHeight || 1500}px</strong>
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Font Controls */}
        <AccordionItem value="fonts" className="bg-white/5 rounded-lg border border-white/10">
          <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-white/80" />
              Font Controls
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white/80 font-medium">Enable font selection</Label>
                <p className="text-xs text-white/60">Allow users to choose fonts</p>
              </div>
              <Switch
                checked={localRestrictions.fonts?.enabled !== false}
                onCheckedChange={(checked) => handleChange('fonts', 'enabled', checked)}
              />
            </div>

            {localRestrictions.fonts?.enabled !== false && (
              <>
                <div className="space-y-2">
                  <Label className="text-white/80 font-medium">Allowed Fonts</Label>
                  <p className="text-xs text-white/60 mb-2">Select which fonts users can use</p>
                  <div className="space-y-2">
                    {FONT_FAMILIES.map((font) => (
                      <div key={font} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <Label className="text-white/80">{font}</Label>
                        <Switch
                          checked={(localRestrictions.fonts?.allowedFonts || FONT_FAMILIES).includes(font)}
                          onCheckedChange={() => handleFontSelection(font)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white/80 font-medium">Lock font styles</Label>
                    <p className="text-xs text-white/60">Force default font, weight, and size</p>
                  </div>
                  <Switch
                    checked={localRestrictions.fonts?.lockFontStyles || false}
                    onCheckedChange={(checked) => handleChange('fonts', 'lockFontStyles', checked)}
                  />
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Image Controls */}
        <AccordionItem value="images" className="bg-white/5 rounded-lg border border-white/10">
          <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-white/80" />
              Image Controls
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-6">
            {/* Master toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <Label className="text-white/80 font-medium">Disable all image controls</Label>
                <p className="text-xs text-white/60">Completely disable image functionality</p>
              </div>
              <Switch
                checked={localRestrictions.imageControls?.enabled === false}
                onCheckedChange={(checked) => {
                  // When toggle is ON (checked=true), we want to DISABLE (enabled=false)
                  // When toggle is OFF (checked=false), we want to ENABLE (enabled=true)
                  handleChange('imageControls', 'enabled', !checked);
                }}
              />
            </div>
            
            {/* Individual controls */}
            <div className={`space-y-4 ${localRestrictions.imageControls?.enabled === false ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Enable image upload</Label>
                <Switch
                  checked={localRestrictions.imageControls?.uploadEnabled !== false}
                  onCheckedChange={(checked) => handleChange('imageControls', 'uploadEnabled', checked)}
                  disabled={localRestrictions.imageControls?.enabled === false}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Enable crop tool</Label>
                <Switch
                  checked={localRestrictions.imageControls?.cropEnabled !== false}
                  onCheckedChange={(checked) => handleChange('imageControls', 'cropEnabled', checked)}
                  disabled={localRestrictions.imageControls?.enabled === false}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Enable borders</Label>
                <Switch
                  checked={localRestrictions.imageControls?.borderEnabled !== false}
                  onCheckedChange={(checked) => handleChange('imageControls', 'borderEnabled', checked)}
                  disabled={localRestrictions.imageControls?.enabled === false}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Enable blur</Label>
                <Switch
                  checked={localRestrictions.imageControls?.blurEnabled !== false}
                  onCheckedChange={(checked) => handleChange('imageControls', 'blurEnabled', checked)}
                  disabled={localRestrictions.imageControls?.enabled === false}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Shape Controls */}
        <AccordionItem value="shapes" className="bg-white/5 rounded-lg border border-white/10">
          <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Shapes className="w-5 h-5 text-white/80" />
              Shape Controls
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-6">
            {/* Master toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <Label className="text-white/80 font-medium">Disable all shape controls</Label>
                <p className="text-xs text-white/60">Completely disable shape functionality</p>
              </div>
              <Switch
                checked={localRestrictions.shapeControls?.enabled === false}
                onCheckedChange={(checked) => {
                  // When toggle is ON (checked=true), we want to DISABLE (enabled=false)
                  // When toggle is OFF (checked=false), we want to ENABLE (enabled=true)
                  handleChange('shapeControls', 'enabled', !checked);
                }}
              />
            </div>
            
            {/* Individual controls */}
            <div className={`space-y-4 ${localRestrictions.shapeControls?.enabled === false ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Enable rectangles</Label>
                <Switch
                  checked={localRestrictions.shapeControls?.rectangleEnabled !== false}
                  onCheckedChange={(checked) => handleChange('shapeControls', 'rectangleEnabled', checked)}
                  disabled={localRestrictions.shapeControls?.enabled === false}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Enable circles</Label>
                <Switch
                  checked={localRestrictions.shapeControls?.circleEnabled !== false}
                  onCheckedChange={(checked) => handleChange('shapeControls', 'circleEnabled', checked)}
                  disabled={localRestrictions.shapeControls?.enabled === false}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Enable lines</Label>
                <Switch
                  checked={localRestrictions.shapeControls?.lineEnabled !== false}
                  onCheckedChange={(checked) => handleChange('shapeControls', 'lineEnabled', checked)}
                  disabled={localRestrictions.shapeControls?.enabled === false}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Enable stars</Label>
                <Switch
                  checked={localRestrictions.shapeControls?.starEnabled !== false}
                  onCheckedChange={(checked) => handleChange('shapeControls', 'starEnabled', checked)}
                  disabled={localRestrictions.shapeControls?.enabled === false}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* General Controls */}
        <AccordionItem value="general" className="bg-white/5 rounded-lg border border-white/10">
          <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-white/80" />
              General Controls
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable layers panel</Label>
              <Switch
                checked={localRestrictions.generalControls?.layersEnabled !== false}
                onCheckedChange={(checked) => handleChange('generalControls', 'layersEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable templates</Label>
              <Switch
                checked={localRestrictions.generalControls?.templatesEnabled !== false}
                onCheckedChange={(checked) => handleChange('generalControls', 'templatesEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable undo/redo</Label>
              <Switch
                checked={localRestrictions.generalControls?.undoEnabled !== false}
                onCheckedChange={(checked) => handleChange('generalControls', 'undoEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable reset button</Label>
              <Switch
                checked={localRestrictions.generalControls?.resetEnabled !== false}
                onCheckedChange={(checked) => handleChange('generalControls', 'resetEnabled', checked)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save Button */}
      <Button
        onClick={onSave}
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-6"
      >
        {isSaving ? 'Saving Restrictions...' : 'Save Preset with Restrictions'}
      </Button>
    </div>
  );
}

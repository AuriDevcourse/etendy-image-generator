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
        {/* Background Controls */}
        <AccordionItem value="background" className="bg-white/5 rounded-lg border border-white/10">
          <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-white/80" />
              Background Controls
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
                <p className="text-xs text-white/60">
                  Background will be locked to <strong>{localRestrictions.backgroundControls?.backgroundType || 'gradient'}</strong> type when preset is saved.
                </p>
              </div>
            )}
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
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable image upload</Label>
              <Switch
                checked={localRestrictions.imageControls?.uploadEnabled !== false}
                onCheckedChange={(checked) => handleChange('imageControls', 'uploadEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable crop tool</Label>
              <Switch
                checked={localRestrictions.imageControls?.cropEnabled !== false}
                onCheckedChange={(checked) => handleChange('imageControls', 'cropEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable borders</Label>
              <Switch
                checked={localRestrictions.imageControls?.borderEnabled !== false}
                onCheckedChange={(checked) => handleChange('imageControls', 'borderEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable blur</Label>
              <Switch
                checked={localRestrictions.imageControls?.blurEnabled !== false}
                onCheckedChange={(checked) => handleChange('imageControls', 'blurEnabled', checked)}
              />
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
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable rectangles</Label>
              <Switch
                checked={localRestrictions.shapeControls?.rectangleEnabled !== false}
                onCheckedChange={(checked) => handleChange('shapeControls', 'rectangleEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable circles</Label>
              <Switch
                checked={localRestrictions.shapeControls?.circleEnabled !== false}
                onCheckedChange={(checked) => handleChange('shapeControls', 'circleEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable lines</Label>
              <Switch
                checked={localRestrictions.shapeControls?.lineEnabled !== false}
                onCheckedChange={(checked) => handleChange('shapeControls', 'lineEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable stars</Label>
              <Switch
                checked={localRestrictions.shapeControls?.starEnabled !== false}
                onCheckedChange={(checked) => handleChange('shapeControls', 'starEnabled', checked)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Canvas Controls */}
        <AccordionItem value="canvas" className="bg-white/5 rounded-lg border border-white/10">
          <AccordionTrigger className="px-6 py-4 text-white/90 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Grid className="w-5 h-5 text-white/80" />
              Canvas Controls
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
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

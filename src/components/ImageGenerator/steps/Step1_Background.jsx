
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Layers, X, RotateCw, Image as ImageIcon, Lock, Palette, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react"; // Added Palette and arrow icons
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ColorPicker from '../ColorPicker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Define EditableBadge component
const EditableBadge = ({ value, onValueChange, suffix = '', min = -Infinity, max = Infinity, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(Number(value));

  useEffect(() => {
    setInputValue(Number(value)); // Sync internal state with prop value, ensure it's a number
  }, [value]);

  const handleInputChange = (e) => {
    // Only allow valid number characters, or empty string for clearing
    const val = e.target.value;
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
        setInputValue(val);
    }
  };

  const handleBlur = () => {
    let numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      numValue = Number(value); // Revert to original if invalid input, ensure it's a number
    }
    numValue = Math.max(min, Math.min(max, numValue)); // Clamp value
    onValueChange(numValue);
    setInputValue(numValue); // Update display value to clamped number
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger blur to save
    }
    if (e.key === 'Escape') {
      setInputValue(Number(value)); // Revert to original, ensure it's a number
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => !disabled && setIsOpen(open)}>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className={`bg-white/10 border-white/20 text-white/90 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/20 transition-colors'}`}
        >
          {value}{suffix}
        </Badge>
      </PopoverTrigger>
      {/* Only render popover content if not disabled */}
      {!disabled && (
        <PopoverContent className="w-auto p-1 bg-gray-900 border border-white/20 rounded-md shadow-lg z-50" align="end">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-8 w-24 text-right bg-white/5 border-none focus-visible:ring-offset-0 focus-visible:ring-0"
            min={min}
            max={max}
            autoFocus
          />
        </PopoverContent>
      )}
    </Popover>
  );
};


const snapAngle = (value, threshold = 5) => {
  const snapPoints = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  for (const point of snapPoints) {
    if (Math.abs(value - point) <= threshold) {
      return point;
    }
  }
  return value;
};

const DraggableThumbnail = ({ backgroundImage, canvasWidth, canvasHeight, backgroundImageX, backgroundImageY, backgroundImageScale, naturalDimensions, onPositionChange }) => {
  const thumbnailRef = React.useRef(null);

  // Calculate thumbnail dimensions (150px width, maintain aspect ratio)
  const thumbnailWidth = 150;
  const thumbnailHeight = (canvasHeight / canvasWidth) * thumbnailWidth;
  
  // Calculate image position and size within thumbnail
  const scale = thumbnailWidth / canvasWidth;
  const imgX = backgroundImageX * scale;
  const imgY = backgroundImageY * scale;
  const imgWidth = naturalDimensions.width * backgroundImageScale * scale;
  const imgHeight = naturalDimensions.height * backgroundImageScale * scale;

  return (
    <div className="space-y-2">
      <Label className="text-white/80 text-xs font-medium">Preview</Label>
      <div
        ref={thumbnailRef}
        className="relative border-2 border-white/20 rounded-lg overflow-hidden bg-black/30"
        style={{ width: thumbnailWidth, height: thumbnailHeight }}
      >
        <img
          src={backgroundImage}
          alt="Background preview"
          className="absolute pointer-events-none"
          style={{
            left: imgX,
            top: imgY,
            width: imgWidth,
            height: imgHeight,
          }}
          draggable={false}
        />
        {/* Canvas boundary indicator */}
        <div className="absolute inset-0 border border-orange-400/50 pointer-events-none" />
      </div>
      <p className="text-xs text-white/50 text-center">Drag on canvas to reposition</p>
    </div>
  );
};

export default function Step1Background({
  // Canvas Background Props
  backgroundType, setBackgroundType,
  gradientColor1, setGradientColor1, gradientColor2, setGradientColor2,
  gradientAngle, setGradientAngle,
  backgroundColor, setBackgroundColor,
  backgroundImage, setBackgroundImage,
  backgroundImageScale, setBackgroundImageScale,
  backgroundImageX, setBackgroundImageX,
  backgroundImageY, setBackgroundImageY,
  backgroundImageNaturalDimensions, setBackgroundImageNaturalDimensions,
  overlayType, setOverlayType,
  overlayColor, setOverlayColor,
  overlayOpacity, setOverlayOpacity,
  overlayGradientColor1, setOverlayGradientColor1,
  overlayGradientOpacity1, setOverlayGradientOpacity1,
  overlayGradientColor2, setOverlayGradientColor2,
  overlayGradientOpacity2, setOverlayGradientOpacity2,
  overlayGradientAngle, setOverlayGradientAngle,
  onBackgroundChange,
  // Gallery props (kept but not used in the new outline)
  galleryImages,
  onSelectGalleryImage,
  // Canvas dimensions for centering
  canvasWidth, canvasHeight,
  // Admin settings
  adminSettings,
}) {
  const bgControls = adminSettings?.backgroundControls || {};
  const canUseGradient = bgControls.gradientEnabled !== false;
  const canUseColor = bgControls.colorEnabled !== false;
  const canUseImage = bgControls.imageEnabled !== false;
  const canUseOverlay = bgControls.overlayEnabled !== false;

  // Memoize available types to prevent useEffect dependency changes
  const availableTypes = useMemo(() => {
    const types = [];
    if (canUseGradient) types.push('gradient');
    if (canUseColor) types.push('color');
    if (canUseImage) types.push('image');
    return types;
  }, [canUseGradient, canUseColor, canUseImage]);

  // If current background type is not allowed, switch to first available
  useEffect(() => {
    if (!availableTypes.includes(backgroundType) && availableTypes.length > 0) {
      setBackgroundType(availableTypes[0]);
      if (onBackgroundChange) onBackgroundChange();
    }
  }, [availableTypes, backgroundType, setBackgroundType, onBackgroundChange]);

  const handleCanvasBackgroundFileSelect = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (event) => { 
      const img = new Image();
      img.onload = () => {
        setBackgroundImageNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setBackgroundImage(event.target.result);
        setBackgroundType('image');
        
        // Center the image on canvas
        const initialScale = Math.min(canvasWidth / img.naturalWidth, canvasHeight / img.naturalHeight);
        setBackgroundImageScale(initialScale);
        setBackgroundImageX((canvasWidth - img.naturalWidth * initialScale) / 2);
        setBackgroundImageY((canvasHeight - img.naturalHeight * initialScale) / 2);
        
        // Show success message
        console.log('✅ Background image uploaded successfully:', file.name);
        
        if (onBackgroundChange) onBackgroundChange();
      }
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }, [canvasWidth, canvasHeight, setBackgroundImageNaturalDimensions, setBackgroundImage, setBackgroundType, setBackgroundImageScale, setBackgroundImageX, setBackgroundImageY, onBackgroundChange]);
  
  const handleBackgroundImageScaleChange = useCallback((newScale) => {
    const oldScale = backgroundImageScale;
    const { width: naturalWidth, height: naturalHeight } = backgroundImageNaturalDimensions;
    if (naturalWidth === 0 || naturalHeight === 0) {
      setBackgroundImageScale(newScale);
      if (onBackgroundChange) onBackgroundChange();
      return;
    }

    const centerX = backgroundImageX + (naturalWidth * oldScale) / 2;
    const centerY = backgroundImageY + (naturalHeight * oldScale) / 2;

    const newX = centerX - (naturalWidth * newScale) / 2;
    const newY = centerY - (naturalHeight * newScale) / 2;

    setBackgroundImageScale(newScale);
    setBackgroundImageX(newX);
    setBackgroundImageY(newY);
    if (onBackgroundChange) onBackgroundChange();
  }, [backgroundImageX, backgroundImageY, backgroundImageScale, backgroundImageNaturalDimensions, setBackgroundImageScale, setBackgroundImageX, setBackgroundImageY, onBackgroundChange]);

  // Early returns after all hooks are called
  if (adminSettings?.backgroundControls?.locked) {
    return null;
  }

  // Don't render if no background types are allowed
  if (availableTypes.length === 0) {
    return null;
  }

  return (
    <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6" onClick={(e) => e.stopPropagation()}>
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Background
        </h3>

        <div>
          <Label className="text-white/80 text-sm font-medium">Background Type</Label>
          <Tabs value={backgroundType} onValueChange={(val) => { onBackgroundChange(); setBackgroundType(val); }} className="w-full mt-2">
            <TabsList className={`grid w-full grid-cols-${availableTypes.length} bg-white/5 border border-white/20 h-auto p-1`}>
              {canUseGradient && <TabsTrigger value="gradient" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-xs">Gradient</TabsTrigger>}
              {canUseColor && <TabsTrigger value="color" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-xs">Solid</TabsTrigger>}
              {canUseImage && <TabsTrigger value="image" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-xs">Image</TabsTrigger>}
            </TabsList>
          </Tabs>
        </div>

        <Accordion type="multiple" className="w-full space-y-2" defaultValue={['gradient-colors', 'solid-color', 'bg-image-settings']}>
          {backgroundType === 'gradient' && canUseGradient && (
            <AccordionItem value="gradient-colors" className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold text-white/80 no-underline hover:no-underline w-full flex items-center justify-between text-left p-3 -mx-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                Gradient Colors
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/80 text-xs font-medium">Color 1</Label>
                    <div className="mt-1">
                      <ColorPicker color={gradientColor1} onChange={(color) => { onBackgroundChange(); setGradientColor1(color); }} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/80 text-xs font-medium">Color 2</Label>
                    <div className="mt-1">
                      <ColorPicker color={gradientColor2} onChange={(color) => { onBackgroundChange(); setGradientColor2(color); }} />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <Label className="text-white/80 text-xs font-medium">Angle</Label>
                    <EditableBadge value={gradientAngle} onValueChange={(val) => { onBackgroundChange(); setGradientAngle(snapAngle(val)); }} suffix="°" max={360} />
                  </div>
                  <Slider value={[gradientAngle]} onValueChange={([val]) => { onBackgroundChange(); setGradientAngle(snapAngle(val)); }} min={0} max={360} step={1} className="mt-2 glass-slider" />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {backgroundType === 'color' && canUseColor && (
            <AccordionItem value="solid-color" className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold text-white/80 no-underline hover:no-underline w-full flex items-center justify-between text-left p-3 -mx-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                Solid Color
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <Label className="text-white/80 text-xs font-medium">Background Color</Label>
                <div className="mt-2">
                  <ColorPicker color={backgroundColor} onChange={(color) => { onBackgroundChange(); setBackgroundColor(color); }} />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {backgroundType === 'image' && canUseImage && (
             <AccordionItem value="bg-image-settings" className="border-b-0">
               <AccordionTrigger className="text-sm font-semibold text-white/80 no-underline hover:no-underline w-full flex items-center justify-between text-left p-3 -mx-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                 Background Image
               </AccordionTrigger>
               <AccordionContent className="pt-4 space-y-4">
                 <label 
                   htmlFor="background-image-upload" 
                   className="flex flex-col items-center space-y-2 p-6 border border-white/20 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors duration-200"
                 >
                   <Upload className="w-6 h-6 text-white/70" />
                   <p className="text-white/80 font-medium">Upload Canvas Background</p>
                   <p className="text-white/60 text-xs">Click to select an image file</p>
                   <input
                     id="background-image-upload"
                     type="file"
                     accept="image/*"
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) handleCanvasBackgroundFileSelect(file);
                       e.target.value = ''; // Reset input
                     }}
                     className="hidden"
                   />
                 </label>
                 {backgroundImage && (
                    <div className="space-y-4">
                      {/* Draggable Thumbnail Preview */}
                      <DraggableThumbnail
                        backgroundImage={backgroundImage}
                        canvasWidth={canvasWidth}
                        canvasHeight={canvasHeight}
                        backgroundImageX={backgroundImageX}
                        backgroundImageY={backgroundImageY}
                        backgroundImageScale={backgroundImageScale}
                        naturalDimensions={backgroundImageNaturalDimensions}
                        onPositionChange={(newX, newY) => {
                          setBackgroundImageX(newX);
                          setBackgroundImageY(newY);
                          if (onBackgroundChange) onBackgroundChange();
                        }}
                      />
                      
                      <div>
                        <div className="flex justify-between items-center">
                          <Label className="text-white/80 text-xs font-medium">Image Size</Label>
                          <EditableBadge value={Math.round(backgroundImageScale * 100)} onValueChange={(val) => { handleBackgroundImageScaleChange(val / 100); onBackgroundChange(); }} suffix="%" max={500} min={10} />
                        </div>
                        <Slider value={[backgroundImageScale * 100]} onValueChange={([val]) => { handleBackgroundImageScaleChange(val / 100); onBackgroundChange(); }} min={10} max={500} step={1} className="mt-2 glass-slider" />
                      </div>
                      {/* Position Controls with Arrow Buttons */}
                      <div className="space-y-3">
                        <Label className="text-white/80 text-xs font-medium">Position</Label>
                        <div className="flex items-center justify-center gap-2">
                          {/* Horizontal controls */}
                          <Button
                            size="icon"
                            onClick={() => { setBackgroundImageX(backgroundImageX - 10); onBackgroundChange(); }}
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white border-0"
                            title="Move Left"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </Button>
                          
                          {/* Vertical controls */}
                          <div className="flex flex-col gap-2">
                            <Button
                              size="icon"
                              onClick={() => { setBackgroundImageY(backgroundImageY - 10); onBackgroundChange(); }}
                              className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white border-0"
                              title="Move Up"
                            >
                              <ArrowUp className="w-5 h-5" />
                            </Button>
                            <Button
                              size="icon"
                              onClick={() => { setBackgroundImageY(backgroundImageY + 10); onBackgroundChange(); }}
                              className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white border-0"
                              title="Move Down"
                            >
                              <ArrowDown className="w-5 h-5" />
                            </Button>
                          </div>
                          
                          <Button
                            size="icon"
                            onClick={() => { setBackgroundImageX(backgroundImageX + 10); onBackgroundChange(); }}
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white border-0"
                            title="Move Right"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </Button>
                        </div>
                        
                        {/* Display current position */}
                        <div className="flex justify-center gap-4 text-xs text-white/60">
                          <span>X: {Math.round(backgroundImageX)}px</span>
                          <span>Y: {Math.round(backgroundImageY)}px</span>
                        </div>
                      </div>
                    </div>
                  )}
               </AccordionContent>
            </AccordionItem>
          )}

          {canUseOverlay && (
             <AccordionItem value="overlay" className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold text-white/80 no-underline hover:no-underline w-full flex items-center justify-between text-left p-3 -mx-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                Color Overlay
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <Tabs value={overlayType} onValueChange={(val) => { setOverlayType(val); onBackgroundChange(); }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/20 h-auto p-1">
                    <TabsTrigger value="solid" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-xs">Solid</TabsTrigger>
                    <TabsTrigger value="gradient" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-xs">Gradient</TabsTrigger>
                  </TabsList>
                </Tabs>
                {overlayType === 'solid' ? (
                   <div className="space-y-4 pt-2">
                    <div>
                      <Label className="text-white/80 text-xs font-medium">Overlay Color</Label>
                      <div className="mt-1">
                        <ColorPicker color={overlayColor} onChange={(color) => { setOverlayColor(color); onBackgroundChange(); }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <Label className="text-white/80 text-xs font-medium">Opacity</Label>
                        <EditableBadge value={Math.round(overlayOpacity * 100)} onValueChange={(val) => { setOverlayOpacity(val / 100); onBackgroundChange(); }} suffix="%" max={100} />
                      </div>
                      <Slider value={[overlayOpacity]} onValueChange={([val]) => { setOverlayOpacity(val); onBackgroundChange(); }} min={0} max={1} step={0.01} className="mt-2 glass-slider" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-white/80 text-xs font-medium">Color 1</Label>
                        <div className="mt-1"><ColorPicker color={overlayGradientColor1} onChange={(color) => { setOverlayGradientColor1(color); onBackgroundChange(); }} /></div>
                      </div>
                       <div>
                        <Label className="text-white/80 text-xs font-medium">Color 2</Label>
                        <div className="mt-1"><ColorPicker color={overlayGradientColor2} onChange={(color) => { setOverlayGradientColor2(color); onBackgroundChange(); }} /></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center">
                          <Label className="text-white/80 text-xs font-medium">Opacity 1</Label>
                          <EditableBadge value={Math.round(overlayGradientOpacity1 * 100)} onValueChange={(val) => { setOverlayGradientOpacity1(val / 100); onBackgroundChange(); }} suffix="%" max={100} />
                        </div>
                        <Slider value={[overlayGradientOpacity1]} onValueChange={([val]) => { setOverlayGradientOpacity1(val); onBackgroundChange(); }} min={0} max={1} step={0.01} className="mt-1 glass-slider" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <Label className="text-white/80 text-xs font-medium">Opacity 2</Label>
                          <EditableBadge value={Math.round(overlayGradientOpacity2 * 100)} onValueChange={(val) => { setOverlayGradientOpacity2(val / 100); onBackgroundChange(); }} suffix="%" max={100} />
                        </div>
                        <Slider value={[overlayGradientOpacity2]} onValueChange={([val]) => { setOverlayGradientOpacity2(val); onBackgroundChange(); }} min={0} max={1} step={0.01} className="mt-1 glass-slider" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <Label className="text-white/80 text-xs font-medium">Angle</Label>
                        <EditableBadge value={overlayGradientAngle} onValueChange={(val) => { setOverlayGradientAngle(snapAngle(val)); onBackgroundChange(); }} suffix="°" max={360} />
                      </div>
                      <Slider value={[overlayGradientAngle]} onValueChange={([val]) => { setOverlayGradientAngle(snapAngle(val)); onBackgroundChange(); }} min={0} max={360} step={1} className="mt-2 glass-slider" />
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </Card>
  );
}

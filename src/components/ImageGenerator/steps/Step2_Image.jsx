
import React, { useCallback, useState, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, Image as ImageIcon, Crop, Move } from "lucide-react";
import ColorPicker from '../ColorPicker';
import { EditableBadge } from './EditableBadge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { storageService, authService } from '../../../lib/supabase';

// Inline Crop Component
const InlineCropInterface = ({ photo, cropValues, onCropChange, onCropEnd }) => {
  const cropRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState(null);
  const [initialCropValues, setInitialCropValues] = useState(null);

  const handleMouseDown = (e, type) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCropValues({ ...cropValues });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !initialCropValues) return;
    
    const rect = cropRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    let newCrop = { ...initialCropValues };

    if (dragType === 'move') {
      newCrop.x = Math.max(0, Math.min(100 - initialCropValues.width, initialCropValues.x + deltaX));
      newCrop.y = Math.max(0, Math.min(100 - initialCropValues.height, initialCropValues.y + deltaY));
    } else {
        const newX = initialCropValues.x + deltaX;
        const newY = initialCropValues.y + deltaY;
        const newWidth = initialCropValues.width - deltaX;
        const newHeight = initialCropValues.height - deltaY;
        const newWidthRight = initialCropValues.width + deltaX;
        const newHeightBottom = initialCropValues.height + deltaY;
        
        switch (dragType) {
            case 'resize-tl':
                if (newX >= 0 && newWidth >= 5 && newWidth <= 100) { newCrop.x = newX; newCrop.width = newWidth; }
                if (newY >= 0 && newHeight >= 5 && newHeight <= 100) { newCrop.y = newY; newCrop.height = newHeight; }
                break;
            case 'resize-tr':
                if (newWidthRight >= 5 && newWidthRight <= 100 - initialCropValues.x) { newCrop.width = newWidthRight; }
                if (newY >= 0 && newHeight >= 5 && newHeight <= 100) { newCrop.y = newY; newCrop.height = newHeight; }
                break;
            case 'resize-bl':
                if (newX >= 0 && newWidth >= 5 && newWidth <= 100) { newCrop.x = newX; newCrop.width = newWidth; }
                if (newHeightBottom >= 5 && newHeightBottom <= 100 - initialCropValues.y) { newCrop.height = newHeightBottom; }
                break;
            case 'resize-br':
                if (newWidthRight >= 5 && newWidthRight <= 100 - initialCropValues.x) { newCrop.width = newWidthRight; }
                if (newHeightBottom >= 5 && newHeightBottom <= 100 - initialCropValues.y) { newCrop.height = newHeightBottom; }
                break;
        }
    }
    
    // Clamp all values to be safe
    newCrop.x = Math.max(0, newCrop.x);
    newCrop.y = Math.max(0, newCrop.y);
    newCrop.width = Math.min(100 - newCrop.x, newCrop.width);
    newCrop.height = Math.min(100 - newCrop.y, newCrop.height);

    // Call the temporary change handler
    onCropChange(newCrop);

  }, [isDragging, dragStart, initialCropValues, dragType, onCropChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setInitialCropValues(null);
    onCropEnd(); // Finalize the crop change
  }, [onCropEnd]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!photo) return null;

  return (
    <div
      className="relative group mx-auto w-full max-w-xs rounded-lg overflow-hidden border-2 border-white/20"
      style={{ aspectRatio: photo ? `${photo.naturalWidth} / ${photo.naturalHeight}` : '1/1' }}
    >
      <img src={photo.src} alt="Crop preview" className="absolute inset-0 w-full h-full" />
      
      {/* The isCropping prop is now controlled by the parent, so we only check if it's true */}
      <div 
        ref={cropRef}
        className="absolute inset-0 cursor-pointer"
        style={{ userSelect: 'none' }}
      >
        {/* Overlay for non-cropped areas */}
        <div 
          className="absolute inset-0 bg-black/50"
          style={{
            clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${cropValues.x}% ${cropValues.y}%, ${cropValues.x}% ${cropValues.y + cropValues.height}%, ${cropValues.x + cropValues.width}% ${cropValues.y + cropValues.height}%, ${cropValues.x + cropValues.width}% ${cropValues.y}%, ${cropValues.x}% ${cropValues.y}%)`
          }}
        />
        
        {/* Crop area */}
        <div
          className="absolute border-2 border-blue-500 bg-transparent cursor-move"
          style={{
            left: `${cropValues.x}%`,
            top: `${cropValues.y}%`,
            width: `${cropValues.width}%`,
            height: `${cropValues.height}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
          {/* Corner handles - made larger for easier interaction */}
          <div 
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white -top-2 -left-2 cursor-nwse-resize rounded-sm"
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-tl'); }}
          />
          <div 
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white -top-2 -right-2 cursor-nesw-resize rounded-sm"
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-tr'); }}
          />
          <div 
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white -bottom-2 -left-2 cursor-nesw-resize rounded-sm"
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-bl'); }}
          />
          <div 
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white -bottom-2 -right-2 cursor-nwse-resize rounded-sm"
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-br'); }}
          />
          
          {/* Crop dimensions display */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {Math.round(cropValues.width)}% × {Math.round(cropValues.height)}%
          </div>
        </div>
      </div>
    </div>
  );
};


export default function Step2Image({
  photo, 
  images = [],
  onPhotoUpload, 
  updateElement, 
  pushToHistory, 
  canvasWidth, 
  canvasHeight, 
  isLoading, 
  adminSettings,
  isCropping,
  setIsCropping,
  selectedElementIds,
  setSelectedElementIds
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [cropValues, setCropValues] = useState({ x: 0, y: 0, width: 100, height: 100 });

  const imgControls = adminSettings?.imageControls || {};

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select a file under 5MB.");
      return;
    }

    setIsUploading(true);
    
    // Upload to Supabase Storage
    try {
      const currentUser = await authService.getCurrentUser();
      const userId = currentUser?.id || 'anonymous';
      
      console.log('📤 Uploading image to Supabase Storage...');
      const uploadResult = await storageService.uploadImage(file, userId, 'uploads');
      console.log('✅ Image uploaded successfully:', uploadResult.url);
      
      // Use the Supabase URL instead of data URL
      const img = new Image();
      img.onload = () => {
        const newPhotoId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        onPhotoUpload({
          id: newPhotoId,
          src: uploadResult.url, // Use Supabase URL
          supabasePath: uploadResult.path, // Store path for deletion
          width: img.naturalWidth,
          height: img.naturalHeight,
          opacity: 1,
          blur: 0,
          borderRadius: 0,
          borderWidth: 0,
          borderType: 'solid',
          borderColor: '#ffffff',
          borderGradient1: '#6366f1',
          borderGradient2: '#8b5cf6',
          crop: { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight }
        });
        setIsCropping(false);
        setCropValues({ x: 0, y: 0, width: 100, height: 100 });
        setIsUploading(false);
      };
      img.onerror = () => {
        setIsUploading(false);
        alert("Failed to load image from Supabase.");
      };
      img.src = uploadResult.url;
    } catch (uploadError) {
      console.error('❌ Failed to upload to Supabase:', uploadError);
      // Fallback to local data URL if Supabase upload fails
      console.log('⚠️ Falling back to local data URL');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const newPhotoId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          onPhotoUpload({
            id: newPhotoId,
            src: event.target.result,
            width: img.naturalWidth,
            height: img.naturalHeight,
            opacity: 1,
            blur: 0,
            borderRadius: 0,
            borderWidth: 0,
            borderType: 'solid',
            borderColor: '#ffffff',
            borderGradient1: '#6366f1',
            borderGradient2: '#8b5cf6',
            crop: { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight }
          });
          setIsCropping(false);
          setCropValues({ x: 0, y: 0, width: 100, height: 100 });
          setIsUploading(false);
        };
        img.onerror = () => {
          setIsUploading(false);
          alert("Failed to load image.");
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        setIsUploading(false);
        alert("Failed to read file.");
      };
      reader.readAsDataURL(file);
    }
  }, [onPhotoUpload, setIsCropping]);

  const removePhoto = () => {
    onPhotoUpload(null);
    setIsCropping(false);
    setCropValues({ x: 0, y: 0, width: 100, height: 100 });
  };

  const onValueChange = useCallback((key, value) => {
    if (!photo || !photo.id) return;
    pushToHistory();
    updateElement(photo.id, { [key]: value });
  }, [photo, pushToHistory, updateElement]);

  const snapAngle = useCallback((value, threshold = 5) => {
    const snapPoints = [0, 45, 90, 135, 180, 225, 270, 315, 360, -45, -90, -135, -180, -225, -270, -315];
    for (const p of snapPoints) {
      if (Math.abs(value - p) <= threshold) return p;
    }
    return value;
  }, []);

  // For InlineCropInterface (temporary updates during drag)
  const handleInlineCropChange = useCallback((newValues) => {
      setCropValues(newValues); // Only update local state, don't commit to history yet
  }, []);

  // For InlineCropInterface (commit after drag ends)
  const handleInlineCropEnd = useCallback(() => {
      if (!photo) return;
      // Commit the current local cropValues after drag ends
      pushToHistory();
      const newCrop = {
          x: Math.round((cropValues.x / 100) * photo.naturalWidth),
          y: Math.round((cropValues.y / 100) * photo.naturalHeight),
          width: Math.round((cropValues.width / 100) * photo.naturalWidth),
          height: Math.round((cropValues.height / 100) * photo.naturalHeight),
      };
      updateElement(photo.id, { crop: newCrop });
  }, [photo, cropValues, pushToHistory, updateElement]);

  const handleResetCrop = useCallback(() => {
    const defaultCrop = { x: 0, y: 0, width: 100, height: 100 };
    setCropValues(defaultCrop); // Update local state
    if (!photo) return;
    pushToHistory();
    const newCrop = {
        x: Math.round((defaultCrop.x / 100) * photo.naturalWidth),
        y: Math.round((defaultCrop.y / 100) * photo.naturalHeight),
        width: Math.round((defaultCrop.width / 100) * photo.naturalWidth),
        height: Math.round((defaultCrop.height / 100) * photo.naturalHeight),
    };
    updateElement(photo.id, { crop: newCrop });
  }, [photo, pushToHistory, updateElement]);


  // Update local crop values when photo changes or crop object changes
  React.useEffect(() => {
    if (photo && photo.crop && photo.naturalWidth && photo.naturalHeight) {
      setCropValues({
        x: Math.round((photo.crop.x / photo.naturalWidth) * 100 * 10) / 10,
        y: Math.round((photo.crop.y / photo.naturalHeight) * 100 * 10) / 10,
        width: Math.round((photo.crop.width / photo.naturalWidth) * 100 * 10) / 10,
        height: Math.round((photo.crop.height / photo.naturalHeight) * 100 * 10) / 10
      });
    } else {
      setCropValues({ x: 0, y: 0, width: 100, height: 100 });
    }
  }, [photo]);

  return (
    <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Image
        </h3>

        {imgControls?.uploadEnabled !== false ? (
          <div className="space-y-4">
            <label 
              htmlFor="image-upload" 
              className="flex flex-col items-center space-y-2 p-6 border border-white/20 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors duration-200"
            >
              <Upload className="w-6 h-6 text-white/70" />
              <p className="text-white/80 font-medium">Upload Image</p>
              <p className="text-white/60 text-xs">Click to select an image file (max 5MB)</p>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                  e.target.value = ''; // Reset input
                }}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            {isUploading && (
              <p className="text-center text-white/60 text-sm">Uploading...</p>
            )}
          </div>
        ) : (
          <p className="text-center text-white/60 text-sm">Image uploads are disabled.</p>
        )}

        {/* Image List */}
        {images.length > 0 && (
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-md font-semibold text-white/90 mb-4">Images ({images.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {images.map(image => (
                <div 
                  key={image.id} 
                  className={`p-3 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-3 ${selectedElementIds && selectedElementIds.includes(image.id) ? 'bg-white/10 ring-2 ring-indigo-400' : 'bg-white/5 hover:bg-white/10'}`}
                  onClick={() => setSelectedElementIds([image.id])}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                    <img 
                      src={image.src} 
                      alt="Image thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">Image {images.indexOf(image) + 1}</p>
                    <p className="text-white/60 text-xs">
                      {image.naturalWidth} × {image.naturalHeight}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {photo && (
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className="no-underline hover:no-underline w-full flex items-center justify-between text-left p-3 -mx-3 rounded-lg hover:bg-white/10 transition-colors duration-200 text-md font-semibold text-white/90">
                Image Settings
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-6">
                  {imgControls?.cropEnabled !== false && (
                    <div className="space-y-4">
                      <Label className="text-white/80 text-sm font-medium">Crop & Position</Label>
                      <Button 
                        onClick={() => setIsCropping(!isCropping)} 
                        variant="outline" 
                        className={`w-full text-white border-white/20 hover:text-white ${isCropping ? 'bg-blue-500/20 border-blue-500/40' : 'bg-white/5'} hover:bg-white/10`}
                      >
                        <Crop className="w-4 h-4 mr-2 text-white"/>
                        {isCropping ? 'Done Cropping' : 'Crop Image'}
                      </Button>
                      
                      {isCropping && (
                        <div className="space-y-4">
                            <InlineCropInterface 
                                photo={photo} 
                                cropValues={cropValues} 
                                onCropChange={handleInlineCropChange}
                                onCropEnd={handleInlineCropEnd}
                            />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-white/80 text-sm font-medium">Opacity</Label>
                      <EditableBadge
                        value={Math.round((photo.opacity ?? 1) * 100)}
                        onValueChange={(val) => onValueChange('opacity', val / 100)}
                        suffix="%"
                        max={100}
                      />
                    </div>
                    <Slider value={[photo.opacity ?? 1]} onValueChange={([val]) => onValueChange('opacity', val)} min={0} max={1} step={0.01} className="glass-slider" />
                  </div>

                  {imgControls?.blurEnabled !== false && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-white/80 text-sm font-medium">Blur</Label>
                          <EditableBadge
                            value={photo.blur || 0}
                            onValueChange={(val) => onValueChange('blur', val)}
                            suffix="px"
                            max={20}
                          />
                        </div>
                        <Slider value={[photo.blur || 0]} onValueChange={([val]) => onValueChange('blur', val)} min={0} max={20} step={0.5} className="glass-slider" />
                    </div>
                  )}

                  {/* Rotation control for main image */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-white/80 text-sm font-medium">Rotation</Label>
                      <EditableBadge
                        value={Math.round(photo.rotation || 0)}
                        onValueChange={(val) => onValueChange('rotation', snapAngle(val))}
                        suffix="°"
                        min={-360}
                        max={360}
                      />
                    </div>
                    <Slider
                      value={[photo.rotation || 0]}
                      onValueChange={([val]) => onValueChange('rotation', snapAngle(val))}
                      min={-180}
                      max={180}
                      step={1}
                      className="glass-slider"
                    />
                  </div>

                  {imgControls?.borderEnabled !== false && (
                    <>
                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <Label className="text-white/80 text-sm font-medium">Border Radius</Label>
                              <EditableBadge
                                value={photo.borderRadius || 0}
                                onValueChange={(val) => onValueChange('borderRadius', val)}
                                suffix="px"
                                max={500}
                              />
                          </div>
                          <Slider value={[photo.borderRadius || 0]} onValueChange={([val]) => onValueChange('borderRadius', val)} min={0} max={500} step={1} className="glass-slider" />
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <Label className="text-white/80 text-sm font-medium">Border Width</Label>
                              <EditableBadge
                                value={photo.borderWidth || 0}
                                onValueChange={(val) => onValueChange('borderWidth', val)}
                                suffix="px"
                                max={50}
                              />
                          </div>
                          <Slider value={[photo.borderWidth || 0]} onValueChange={([val]) => onValueChange('borderWidth', val)} min={0} max={50} step={1} className="glass-slider" />
                      </div>
                      {photo.borderWidth > 0 && (
                          <div className="space-y-3">
                              <Label className="text-white/80 text-sm font-medium">Border Style</Label>
                              <Tabs value={photo.borderType || 'solid'} onValueChange={(val) => onValueChange('borderType', val)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/20 h-auto p-1">
                                  <TabsTrigger value="solid" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">Solid</TabsTrigger>
                                  <TabsTrigger value="gradient" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">Gradient</TabsTrigger>
                                </TabsList>
                              </Tabs>

                              {(photo.borderType === 'solid' || !photo.borderType) ? (
                                <div className="space-y-2">
                                  <Label className="text-white/80 text-sm font-medium">Border Color</Label>
                                  <ColorPicker color={photo.borderColor || '#ffffff'} onChange={(color) => onValueChange('borderColor', color)} />
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-white/80 text-sm font-medium">Color 1</Label>
                                    <ColorPicker color={photo.borderGradient1 || '#6366f1'} onChange={(color) => onValueChange('borderGradient1', color)} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-white/80 text-sm font-medium">Color 2</Label>
                                    <ColorPicker color={photo.borderGradient2 || '#8b5cf6'} onChange={(color) => onValueChange('borderGradient2', color)} />
                                  </div>
                                </div>
                              )}
                          </div>
                      )}
                    </>
                  )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
      )}
      </div>
    </Card>
  );
}


import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, Shapes, Circle, Star, Square, Minus, Link2, Unlink } from "lucide-react";
import ColorPicker from '../ColorPicker';
import { EditableBadge } from './EditableBadge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileUploadArea } from '../FileUploadArea';

const ShapeIcon = ({ shapeType, ...props }) => {
  switch (shapeType) {
    case 'rectangle': return <Square {...props} />;
    case 'circle': return <Circle {...props} />;
    case 'line': return <Minus {...props} />;
    case 'star': return <Star {...props} />;
    default: return <Shapes {...props} />;
  }
};

export default function Step4Elements({
  elements,
  selectedElement,
  onLogoUpload,
  updateElement,
  addElement,
  setSelectedElementId,
  canvasWidth,
  canvasHeight,
  pushToHistory,
  removeElement,
  adminSettings,
}) {
  const shapeControls = adminSettings?.shapeControls || {};
  const [rectRadiiLinked, setRectRadiiLinked] = useState(true);

  useEffect(() => {
    // Only reset link state when a different element is selected
    if (!selectedElement || selectedElement.type !== 'shape' || selectedElement.shapeType !== 'rectangle') return;
    const br = selectedElement.borderRadius;
    setRectRadiiLinked(typeof br === 'number');
  }, [selectedElement?.id]);

  const snapAngle = (value, threshold = 5) => {
    const snapPoints = [0, 45, 90, 135, 180, 225, 270, 315, 360, -45, -90, -135, -180, -225, -270, -315];
    for (const p of snapPoints) {
      if (Math.abs(value - p) <= threshold) return p;
    }
    return value;
  };

  const handleAddShape = (shapeType) => {
    let newShape;
    const commonProps = {
      type: 'shape',
      shapeType,
      x: canvasWidth / 2 - 100,
      y: canvasHeight / 2 - 100,
      width: 200,
      height: 200,
      fillType: 'fill',
      colorType: 'solid',
      color1: '#ffffff',
      color2: '#8b5cf6',
      strokeWidth: 4,
      opacity: 1,
      blur: 0,
      rotation: 0
    };

    switch (shapeType) {
      case 'rectangle':
        newShape = { ...commonProps, borderRadius: { tl: 0, tr: 0, br: 0, bl: 0 } };
        break;
      case 'circle':
        newShape = { ...commonProps };
        break;
      case 'line':
        newShape = { ...commonProps, height: 4 };
        break;
      case 'star':
        newShape = { ...commonProps, spikes: 5, innerRadius: 0.5 };
        break;
      default:
        return;
    }
    addElement(newShape);
  };
  
  const wrappedUpdate = (props) => {
    if (!selectedElement) return;
    pushToHistory();
    updateElement(selectedElement.id, props);
  };
  
  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        onLogoUpload({
          url: event.target.result,
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const logoElement = elements.find(el => el.type === 'logo');
  const shapeElements = elements.filter(el => el.type === 'shape');

  return (
    <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <Shapes className="w-5 h-5" />
          Elements
        </h3>

        <div>
          <Label className="text-white/80 text-sm font-medium mb-3 block">Logo</Label>
          <FileUploadArea
              onFileSelect={processFile}
              uploadedImage={logoElement?.src}
              onRemoveImage={() => onLogoUpload(null)}
          >
              <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-6 h-6 text-white/70" />
                  <p className="text-white/80 font-medium">Upload Logo</p>
                  <p className="text-white/60 text-xs">Optional</p>
              </div>
          </FileUploadArea>
        </div>

        <div>
          <Label className="text-white/80 text-sm font-medium mb-3 block">Add Shape</Label>
          <div className="grid grid-cols-4 gap-2">
            {shapeControls.rectangleEnabled && <Button variant="outline" className="h-12 bg-white/5 border-white/20 text-white" onClick={() => handleAddShape('rectangle')}><ShapeIcon shapeType="rectangle" /></Button>}
            {shapeControls.circleEnabled && <Button variant="outline" className="h-12 bg-white/5 border-white/20 text-white" onClick={() => handleAddShape('circle')}><ShapeIcon shapeType="circle" /></Button>}
            {shapeControls.lineEnabled && <Button variant="outline" className="h-12 bg-white/5 border-white/20 text-white" onClick={() => handleAddShape('line')}><ShapeIcon shapeType="line" /></Button>}
            {shapeControls.starEnabled && <Button variant="outline" className="h-12 bg-white/5 border-white/20 text-white" onClick={() => handleAddShape('star')}><ShapeIcon shapeType="star" /></Button>}
          </div>
        </div>
        
        {shapeElements.length > 0 && (
          <div className="border-t border-white/10 pt-6 space-y-2">
            <h4 className="text-md font-semibold text-white/90 mb-4">Shape Layers</h4>
            {shapeElements.map(shapeEl => (
                <div 
                    key={shapeEl.id} 
                    className={`p-3 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-3 ${selectedElement?.id === shapeEl.id ? 'bg-white/10 ring-2 ring-indigo-400' : 'bg-white/5 hover:bg-white/10'}`}
                    onClick={() => setSelectedElementId(shapeEl.id)}
                >
                   <ShapeIcon shapeType={shapeEl.shapeType} className="w-5 h-5 text-white/80"/>
                   <p className="text-white capitalize flex-1">{shapeEl.shapeType}</p>
                   <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-red-500/20 text-white/70 hover:text-red-400" onClick={(e) => { e.stopPropagation(); removeElement(shapeEl.id); }}>
                      <X className="w-4 h-4" />
                   </Button>
                </div>
            ))}
          </div>
        )}

        {(selectedElement && ['logo', 'shape'].includes(selectedElement.type)) && (
          <div className="border-t border-white/10 pt-6 space-y-4">
            <h4 className="text-md font-semibold text-white/90 mb-4">Edit {selectedElement.type === 'logo' ? 'Logo' : 'Shape'}</h4>
            {selectedElement.type === 'shape' && (
            <>
            <div className="space-y-3 pt-2">
              <Label className="text-white/80 text-sm font-medium">Fill / Stroke</Label>
              <Tabs value={selectedElement.fillType || 'fill'} onValueChange={(val) => wrappedUpdate({ fillType: val })} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/20 h-auto p-1">
                  <TabsTrigger value="fill" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">Fill</TabsTrigger>
                  <TabsTrigger value="outline" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">Outline</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {selectedElement.fillType === 'outline' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-white/80 text-sm font-medium">Stroke Width</Label>
                  <EditableBadge value={selectedElement.strokeWidth || 4} onValueChange={(val) => wrappedUpdate({ strokeWidth: val })} suffix="px" max={50} />
                </div>
                <Slider value={[selectedElement.strokeWidth || 4]} onValueChange={([val]) => wrappedUpdate({ strokeWidth: val })} min={1} max={50} step={1} className="glass-slider" />
              </div>
            )}
            </>
            )}

            <div className="space-y-3 pt-2">
              <Label className="text-white/80 text-sm font-medium">Color</Label>
              <Tabs value={selectedElement.colorType || 'solid'} onValueChange={(val) => wrappedUpdate({ colorType: val })} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/20 h-auto p-1">
                  <TabsTrigger value="solid" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">Solid</TabsTrigger>
                  <TabsTrigger value="gradient" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">Gradient</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {selectedElement.colorType === 'solid' ?
                <ColorPicker color={selectedElement.color1} onChange={(color) => wrappedUpdate({ color1: color })} /> :
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker color={selectedElement.color1} onChange={(color) => wrappedUpdate({ color1: color })} />
                  <ColorPicker color={selectedElement.color2} onChange={(color) => wrappedUpdate({ color2: color })} />
                </div>
              }
            </div>

            {/* Effects - Opacity, Blur & Rotation in one row */}
            <div className="space-y-3 pt-2">
              <Label className="text-white/80 text-sm font-medium">Effects</Label>
              <div className="grid grid-cols-3 gap-4">
                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-white/80 text-xs font-medium">Opacity</Label>
                    <EditableBadge value={Math.round((selectedElement.opacity ?? 1) * 100)} onValueChange={(val) => wrappedUpdate({ opacity: val / 100 })} suffix="%" max={100} />
                  </div>
                  <Slider value={[selectedElement.opacity ?? 1]} onValueChange={([val]) => wrappedUpdate({ opacity: val })} min={0} max={1} step={0.01} className="glass-slider" />
                </div>

                {/* Blur */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-white/80 text-xs font-medium">Blur</Label>
                    <EditableBadge value={selectedElement.blur || 0} onValueChange={(val) => wrappedUpdate({ blur: val })} suffix="px" max={20} />
                  </div>
                  <Slider value={[selectedElement.blur || 0]} onValueChange={([val]) => wrappedUpdate({ blur: val })} min={0} max={20} step={0.5} className="glass-slider" />
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-white/80 text-xs font-medium">Rotation</Label>
                    <EditableBadge value={Math.round(selectedElement.rotation || 0)} onValueChange={(val) => wrappedUpdate({ rotation: snapAngle(val) })} suffix="°" min={-360} max={360} />
                  </div>
                  <Slider value={[selectedElement.rotation || 0]} onValueChange={([val]) => wrappedUpdate({ rotation: snapAngle(val) })} min={-180} max={180} step={1} className="glass-slider" />
                </div>
              </div>
            </div>

            {selectedElement.shapeType === 'rectangle' && (() => {
              const radii = typeof selectedElement.borderRadius === 'number'
                ? { tl: selectedElement.borderRadius, tr: selectedElement.borderRadius, br: selectedElement.borderRadius, bl: selectedElement.borderRadius }
                : {
                    tl: selectedElement.borderRadius?.tl || 0,
                    tr: selectedElement.borderRadius?.tr || 0,
                    br: selectedElement.borderRadius?.br || 0,
                    bl: selectedElement.borderRadius?.bl || 0,
                  };

              const toggleLinked = () => {
                const linkedNow = !rectRadiiLinked;
                setRectRadiiLinked(linkedNow);
                if (linkedNow) {
                  // When linking, unify to the top-left value
                  const v = radii.tl || 0;
                  wrappedUpdate({ borderRadius: v });
                } else {
                  // When unlinking, expand current value to all corners
                  const v = typeof selectedElement.borderRadius === 'number' ? selectedElement.borderRadius : radii.tl;
                  wrappedUpdate({ borderRadius: { tl: v, tr: v, br: v, bl: v } });
                }
              };

              const updateAll = (val) => {
                // If linked, store as single number for simplicity
                wrappedUpdate({ borderRadius: val });
              };

              const updateRadius = (corner, val) => {
                const next = { ...radii, [corner]: val };
                wrappedUpdate({ borderRadius: next });
              };

              const uniformVal = typeof selectedElement.borderRadius === 'number' ? selectedElement.borderRadius : radii.tl;

              return (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80 text-sm font-medium">Corner Radius</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white/80 hover:text-white"
                      onClick={toggleLinked}
                      title={rectRadiiLinked ? 'Unlink corners' : 'Link corners'}
                    >
                      {rectRadiiLinked ? <Link2 className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                    </Button>
                  </div>

                  {rectRadiiLinked ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-white/70 text-xs">All Corners</Label>
                        <EditableBadge value={uniformVal} onValueChange={(val) => updateAll(val)} suffix="px" max={300} />
                      </div>
                      <Slider value={[uniformVal]} onValueChange={([val]) => updateAll(val)} min={0} max={300} step={1} className="glass-slider" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-white/70 text-xs">Top Left</Label>
                          <EditableBadge value={radii.tl} onValueChange={(val) => updateRadius('tl', val)} suffix="px" max={300} />
                        </div>
                        <Slider value={[radii.tl]} onValueChange={([val]) => updateRadius('tl', val)} min={0} max={300} step={1} className="glass-slider" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-white/70 text-xs">Top Right</Label>
                          <EditableBadge value={radii.tr} onValueChange={(val) => updateRadius('tr', val)} suffix="px" max={300} />
                        </div>
                        <Slider value={[radii.tr]} onValueChange={([val]) => updateRadius('tr', val)} min={0} max={300} step={1} className="glass-slider" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-white/70 text-xs">Bottom Right</Label>
                          <EditableBadge value={radii.br} onValueChange={(val) => updateRadius('br', val)} suffix="px" max={300} />
                        </div>
                        <Slider value={[radii.br]} onValueChange={([val]) => updateRadius('br', val)} min={0} max={300} step={1} className="glass-slider" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-white/70 text-xs">Bottom Left</Label>
                          <EditableBadge value={radii.bl} onValueChange={(val) => updateRadius('bl', val)} suffix="px" max={300} />
                        </div>
                        <Slider value={[radii.bl]} onValueChange={([val]) => updateRadius('bl', val)} min={0} max={300} step={1} className="glass-slider" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </Card>
  );
}


import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type, ChevronDown, AlignLeft, AlignCenter, AlignRight } from "lucide-react"; // Changed Text to Type icon
import ColorPicker from '../ColorPicker';
import { EditableBadge } from './EditableBadge';
// Removed Accordion imports as per changes

const FONT_FAMILIES = [
  "Archivo Expanded",
  "DM Serif Text",
  "Playfair Display",
  "Inter",
  "Archivo"
];

const FONT_WEIGHTS = {
  'Archivo Expanded': ['300', '400', '500', '600', '700'],
  'DM Serif Text': ['400'],
  'Playfair Display': ['400', '500', '600', '700', '800', '900'],
  'Inter': ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  'Archivo': ['300', '400', '500', '600', '700']
};

export default function Step3Text({
  elements,
  selectedElement,
  updateElement,
  addElement,
  setSelectedElementId,
  canvasWidth,
  canvasHeight,
  pushToHistory,
  adminSettings,
}) {
  const selectedText = selectedElement;
  const fontSettings = adminSettings?.fonts || {};
  const textElements = elements.filter(el => el.type === 'text');

  const addNewText = () => {
    let defaultFont = 'Archivo Expanded';
    let defaultWeight = '600';
    let defaultSize = 80;

    if(fontSettings.lockFontStyles) {
        defaultFont = fontSettings.defaultFont || 'Archivo Expanded';
        defaultWeight = fontSettings.defaultWeight || '600';
        defaultSize = fontSettings.defaultSize || 80;
    } else if (fontSettings.enabled === false) {
        const allowedFonts = Array.isArray(fontSettings.allowedFonts) ? fontSettings.allowedFonts : ['Archivo Expanded'];
        if (allowedFonts.length > 0) {
            defaultFont = allowedFonts[0];
            defaultWeight = FONT_WEIGHTS[defaultFont]?.[0] || '400';
        }
    }

    const newText = {
      type: 'text',
      content: 'New Text',
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      size: defaultSize,
      font: defaultFont,
      weight: defaultWeight,
      style: 'normal', // Added default style
      colorType: 'solid',
      color1: '#FFFFFF',
      color2: '#8b5cf6',
      transform: 'none', // Added default transform
      opacity: 1,
      blur: 0,
      textAlign: 'center',
      lineHeight: 1.2
    };
    addElement(newText);
  };

  const wrappedUpdate = (props) => {
    if (!selectedText) return;
    pushToHistory();
    updateElement(selectedText.id, props);
  };

  // availableWeights is no longer needed with the new Select component for font weight.
  // const availableWeights = FONT_WEIGHTS[selectedText?.font] || ['400']; 
  const showFontControls = !fontSettings.lockFontStyles;
  const allowedFonts = Array.isArray(fontSettings.allowedFonts) ? fontSettings.allowedFonts : FONT_FAMILIES;

  const snapAngle = (value, threshold = 5) => {
    const snapPoints = [0, 45, 90, 135, 180, 225, 270, 315, 360, -45, -90, -135, -180, -225, -270, -315];
    for (const p of snapPoints) {
      if (Math.abs(value - p) <= threshold) return p;
    }
    return value;
  };

  return (
    <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
      <div className="space-y-6"> {/* Replaced Accordion with a div */}
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <Type className="w-5 h-5" /> {/* Changed icon from Text to Type */}
          Text
        </h3>

        <Button onClick={addNewText} className="w-full glass-input bg-white/10 hover:bg-white/20">Add New Text Field</Button>

        {textElements.length > 0 && (
          <div className="border-t border-white/10 pt-6 space-y-2">
              <h4 className="text-md font-semibold text-white/90 mb-4">Text Layers</h4>
              {textElements.map(textEl => (
                  <div 
                      key={textEl.id} 
                      className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${selectedElement?.id === textEl.id ? 'bg-white/10 ring-2 ring-indigo-400' : 'bg-white/5 hover:bg-white/10'}`}
                      onClick={() => setSelectedElementId(textEl.id)}
                  >
                      <p className="text-white truncate">{textEl.content}</p>
                  </div>
              ))}
          </div>
        )}
  
        {selectedText && (
          <div className="border-t border-white/10 pt-6 space-y-4">
            <h4 className="text-md font-semibold text-white/90 mb-4">Edit Text</h4>
            <Textarea
              value={selectedText.content}
              onChange={(e) => wrappedUpdate({ content: e.target.value })}
              placeholder="Your text here"
              className="glass-input bg-white/5 border-white/20 text-white placeholder-white/50 min-h-[80px]" />

            {/* Font Settings */}
            {showFontControls && (
              <div className="space-y-3 pt-2">
                <Label className="text-white/80 text-sm font-medium">Font Settings</Label>
                <div className="grid grid-cols-1 gap-4">
                    {fontSettings.enabled !== false && (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant="outline" className="glass-input bg-white/5 text-white hover:text-white px-4 py-2 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-white/10 h-10 justify-between">
                            {selectedText.font}
                            <ChevronDown className="w-4 h-4 text-white/50" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 glass-panel border border-white/20 backdrop-blur-xl bg-black/50">
                      {FONT_FAMILIES
                        .filter(fontName => allowedFonts.includes(fontName))
                        .map((fontName) => (
                            <button
                                key={fontName}
                                onClick={() => {
                                wrappedUpdate({ font: fontName, weight: FONT_WEIGHTS[fontName]?.[0] || '400' });
                                }}
                                className="w-full text-left px-2 py-1.5 text-sm text-white/90 hover:bg-white/10 rounded-sm hover:text-white"
                                style={{ fontFamily: `'${fontName}', sans-serif` }}>
                                {fontName}
                            </button>
                        ))}
                        </PopoverContent>
                    </Popover>
                    )}
                </div>
                {/* Font Weight and Style directly under font selection */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Font Weight Dropdown */}
                  <div>
                    <Select value={selectedText.weight?.toString() || '600'} onValueChange={(value) => { pushToHistory(); updateElement(selectedText.id, { weight: value }); }}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Weight" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/80 border-white/20 text-white">
                        {FONT_WEIGHTS[selectedText.font]?.map((weight) => (
                            <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Style Dropdown */}
                  <div>
                    <Select 
                      value={`${selectedText.style || 'normal'}-${selectedText.transform || 'none'}`} 
                      onValueChange={(value) => { 
                        const [style, transform] = value.split('-');
                        pushToHistory(); 
                        updateElement(selectedText.id, { style, transform }); 
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Style" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/80 border-white/20 text-white">
                        <SelectItem value="normal-none">Normal</SelectItem>
                        <SelectItem value="italic-none">Italic</SelectItem>
                        <SelectItem value="normal-capitalize">Capitalize</SelectItem>
                        <SelectItem value="normal-uppercase">UPPERCASE</SelectItem>
                        <SelectItem value="italic-capitalize">Italic Capitalize</SelectItem>
                        <SelectItem value="italic-uppercase">ITALIC UPPERCASE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Size and Line Height */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-4">
                  {/* Size controls */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-white/80 text-sm font-medium">Size</Label>
                        <EditableBadge
                        value={selectedText.size}
                        onValueChange={(val) => wrappedUpdate({ size: val })}
                        suffix="px"
                        max={500}
                        min={10}
                        step={1} />
                    </div>
                    <Slider
                    value={[selectedText.size]}
                    onValueChange={([val]) => wrappedUpdate({ size: val })}
                    min={10}
                    max={500}
                    step={1}
                    className="flex-1 glass-slider" />
                  </div>
                  {/* Line Height controls */}
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <Label className="text-white/80 text-sm font-medium">Line Height</Label>
                          <EditableBadge
                            value={(selectedText.lineHeight ?? 1.2).toFixed(1)}
                            onValueChange={(val) => wrappedUpdate({ lineHeight: parseFloat(val) })}
                            suffix="x"
                            min={0.5}
                            max={3}
                            step={0.1} />
                      </div>
                      <Slider
                        value={[selectedText.lineHeight ?? 1.2]}
                        onValueChange={([val]) => wrappedUpdate({ lineHeight: val })}
                        min={0.5}
                        max={3}
                        step={0.1}
                        className="flex-1 glass-slider" />
                  </div>
              </div>
            </div>

            {/* Alignment & Spacing */}
            <div className="space-y-3 pt-2">
              <Label className="text-white/80 text-sm font-medium">Alignment & Spacing</Label>
              <div className="grid grid-cols-1 gap-4">
                  <div>
                      <Tabs value={selectedText.textAlign || 'left'} onValueChange={(val) => wrappedUpdate({ textAlign: val })} className="w-full">
                          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/20 h-auto p-1">
                              <TabsTrigger value="left" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 p-2 h-full"><AlignLeft className="w-5 h-5" /></TabsTrigger>
                              <TabsTrigger value="center" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 p-2 h-full"><AlignCenter className="w-5 h-5" /></TabsTrigger>
                              <TabsTrigger value="right" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 p-2 h-full"><AlignRight className="w-5 h-5" /></TabsTrigger>
                          </TabsList>
                      </Tabs>
                  </div>
              </div>
            </div>

            
            {/* Color controls */}
            <div className="space-y-3 pt-2">
              <Label className="text-white/80 text-sm font-medium">Color</Label>
              <Tabs value={selectedText.colorType || 'solid'} onValueChange={(val) => wrappedUpdate({ colorType: val })} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/20 h-auto p-1">
                  <TabsTrigger value="solid" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">Solid</TabsTrigger>
                  <TabsTrigger value="gradient" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">Gradient</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {selectedText.colorType === 'solid' ?
                <ColorPicker color={selectedText.color1} onChange={(color) => wrappedUpdate({ color1: color })} /> :
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker color={selectedText.color1} onChange={(color) => wrappedUpdate({ color1: color })} />
                  <ColorPicker color={selectedText.color2} onChange={(color) => wrappedUpdate({ color2: color })} />
                </div>
              }
            </div>

            {/* Rotation, Opacity & Blur */}
            <div className="space-y-3 pt-2">
              <Label className="text-white/80 text-sm font-medium">Effects</Label>
              <div className="grid grid-cols-3 gap-4">
                  {/* Rotation */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-white/80 text-xs font-medium">Rotation</Label>
                      <EditableBadge
                        value={Math.round(selectedText.rotation || 0)}
                        onValueChange={(val) => wrappedUpdate({ rotation: snapAngle(val) })}
                        suffix="°"
                        min={-360}
                        max={360}
                      />
                    </div>
                    <Slider
                      value={[selectedText.rotation || 0]}
                      onValueChange={([val]) => wrappedUpdate({ rotation: snapAngle(val) })}
                      min={-180}
                      max={180}
                      step={1}
                      className="glass-slider"
                    />
                  </div>

                  {/* Opacity */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-white/80 text-xs font-medium">Opacity</Label>
                      <EditableBadge
                      value={Math.round((selectedText.opacity ?? 1) * 100)}
                      onValueChange={(val) => wrappedUpdate({ opacity: val / 100 })}
                      suffix="%"
                      max={100}
                      min={0}
                      step={1} />
                    </div>
                    <Slider
                    value={[selectedText.opacity ?? 1]}
                    onValueChange={([val]) => wrappedUpdate({ opacity: val })}
                    min={0}
                    max={1}
                    step={0.01}
                    className="flex-1 glass-slider" />
                  </div>

                  {/* Blur */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-white/80 text-xs font-medium">Blur</Label>
                      <EditableBadge
                      value={selectedText.blur || 0}
                      onValueChange={(val) => wrappedUpdate({ blur: val })}
                      suffix="px"
                      max={20}
                      min={0}
                      step={0.5} />
                    </div>
                    <Slider
                    value={[selectedText.blur || 0]}
                    onValueChange={([val]) => wrappedUpdate({ blur: val })}
                    min={0}
                    max={20}
                    step={0.5}
                    className="flex-1 glass-slider" />
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

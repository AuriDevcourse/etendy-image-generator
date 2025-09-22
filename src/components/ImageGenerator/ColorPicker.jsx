import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

// Basic color validation (not exhaustive)
const isValidHex = (color) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

export default function ColorPicker({ color, onChange }) {
  const safeColor = color || '#FFFFFF'; // Use white as a safe default

  const [hexValue, setHexValue] = useState(safeColor);
  const [colorMode, setColorMode] = useState('hex');

  useEffect(() => {
    setHexValue(safeColor);
  }, [safeColor]);

  const handleHexChange = (e) => {
    const newHex = e.target.value;
    setHexValue(newHex);
    if (isValidHex(newHex)) {
      onChange(newHex);
    }
  };
  
  const handlePickerChange = (e) => {
    onChange(e.target.value);
  }

  // A simple function to convert hex to an RGB object
  const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 }; // Default to white
  };
  
  // A simple function to convert rgb to hex
  const rgbToHex = (r, g, b) => "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');

  const handleRgbChange = (e, component) => {
    const currentRgb = hexToRgb(safeColor);
    const value = parseInt(e.target.value, 10);
    if (value >= 0 && value <= 255) {
      const newRgb = { ...currentRgb, [component]: value };
      onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }
  }

  const { r, g, b } = hexToRgb(safeColor);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full h-10 flex items-center gap-2 rounded-md border border-white/20 bg-white/5 p-1 pr-2">
          <div className="w-8 h-8 rounded" style={{ backgroundColor: safeColor }} />
          <span className="text-sm font-mono text-white/80">{safeColor.toUpperCase()}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 glass-panel border border-white/20 backdrop-blur-xl bg-black/50 p-3">
        <div className="space-y-3">
          <div className="relative w-full h-10">
            <input 
              type="color" 
              value={safeColor}
              onChange={handlePickerChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full rounded-md border border-white/20" style={{ backgroundColor: safeColor }}/>
          </div>
          
          <Tabs value={colorMode} onValueChange={setColorMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/20 h-auto p-1">
              <TabsTrigger value="hex" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-xs">HEX</TabsTrigger>
              <TabsTrigger value="rgb" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-xs">RGB</TabsTrigger>
            </TabsList>
          </Tabs>

          {colorMode === 'hex' ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/50">#</span>
              <Input
                type="text"
                value={hexValue.substring(1)}
                onChange={(e) => handleHexChange({ target: { value: '#' + e.target.value }})}
                className="glass-input bg-white/5 border-white/20 text-white placeholder:text-white/50 pl-6 font-mono"
                maxLength={6}
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-white/50 text-xs text-center block mb-1">R</Label>
                <Input type="number" value={r} onChange={(e) => handleRgbChange(e, 'r')} className="glass-input bg-white/5 border-white/20 text-white font-mono p-1 text-center" min="0" max="255" />
              </div>
              <div>
                <Label className="text-white/50 text-xs text-center block mb-1">G</Label>
                <Input type="number" value={g} onChange={(e) => handleRgbChange(e, 'g')} className="glass-input bg-white/5 border-white/20 text-white font-mono p-1 text-center" min="0" max="255" />
              </div>
              <div>
                <Label className="text-white/50 text-xs text-center block mb-1">B</Label>
                <Input type="number" value={b} onChange={(e) => handleRgbChange(e, 'b')} className="glass-input bg-white/5 border-white/20 text-white font-mono p-1 text-center" min="0" max="255" />
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
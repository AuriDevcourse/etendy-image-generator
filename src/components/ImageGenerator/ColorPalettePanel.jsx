import React, { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

const ColorPalettePanel = ({ elements, backgroundColor, gradientColor1, gradientColor2 }) => {
  const [copiedColor, setCopiedColor] = useState(null);

  // Extract unique colors from all elements and background
  const extractColors = () => {
    const colorSet = new Set();

    // Add background colors
    if (backgroundColor) colorSet.add(backgroundColor.toUpperCase());
    if (gradientColor1) colorSet.add(gradientColor1.toUpperCase());
    if (gradientColor2) colorSet.add(gradientColor2.toUpperCase());

    // Add element colors
    elements.forEach(element => {
      if (element.color1) colorSet.add(element.color1.toUpperCase());
      if (element.color2) colorSet.add(element.color2.toUpperCase());
      if (element.borderColor) colorSet.add(element.borderColor.toUpperCase());
    });

    return Array.from(colorSet).filter(color => color && color !== '#FFFFFF00'); // Filter out transparent
  };

  const colors = extractColors();

  const copyToClipboard = (color) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-white font-semibold mb-3 text-lg">Color Palette</h3>
        <p className="text-white/60 text-sm mb-4">
          Colors used in this design ({colors.length} {colors.length === 1 ? 'color' : 'colors'})
        </p>
      </div>

      {colors.length === 0 ? (
        <div className="text-white/40 text-sm text-center py-8">
          No colors found in the current design
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
          {colors.map((color, index) => (
            <div
              key={index}
              className="group relative bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-md border-2 border-white/20 shadow-lg flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white/90 text-xs font-mono truncate">
                    {color}
                  </div>
                  <button
                    onClick={() => copyToClipboard(color)}
                    className="mt-1 text-white/50 hover:text-white/90 text-xs flex items-center gap-1 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedColor === color ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-3 border-t border-white/10">
        <p className="text-white/40 text-xs">
          Click any color to copy its hex code to clipboard
        </p>
      </div>
    </div>
  );
};

export default ColorPalettePanel;

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

const TOOLTIP_ITEMS = [
  {
    id: 'canvas',
    title: 'Canvas',
    description: 'Click & drag elements to move. Use corner handles to resize. Right-click for more options. Ctrl+Click for multi-select.',
    selector: '[data-tour="canvas"]',
  },
  {
    id: 'background-tab',
    title: 'Background Panel',
    description: 'Set solid colors, gradients, or upload images. Drag background images directly on canvas when this panel is active. Add color overlays with adjustable opacity.',
    selector: '[data-tour="background-tab"]',
  },
  {
    id: 'image-tab',
    title: 'Images Panel',
    description: 'Upload images to canvas. Crop, resize, rotate, and add borders. Apply blur effects. Adjust opacity and positioning.',
    selector: '[data-tour="image-tab"]',
  },
  {
    id: 'text-tab',
    title: 'Text Panel',
    description: 'Add text fields with custom fonts, sizes, and weights. Apply colors or gradients. Transform text (uppercase, lowercase, capitalize). Rotate and adjust opacity.',
    selector: '[data-tour="text-tab"]',
  },
  {
    id: 'elements-tab',
    title: 'Shapes Panel',
    description: 'Add rectangles, circles, lines, and stars. Customize with solid colors or gradients. Adjust borders, blur, opacity, and rotation.',
    selector: '[data-tour="elements-tab"]',
  },
  {
    id: 'download-tab',
    title: 'Download Panel',
    description: 'Export your design as PNG or JPG. Choose quality settings (low, medium, high). Save to gallery or download directly.',
    selector: '[data-tour="download-tab"]',
  },
  {
    id: 'layers-button',
    title: 'Layers Panel',
    description: 'View all canvas elements. Reorder by dragging. Select, lock, or delete elements. Multi-select with Ctrl+Click.',
    selector: '[data-tour="layers-button"]',
  },
  {
    id: 'templates-button',
    title: 'Templates Panel',
    description: 'Save current design as template (max 4 per preset). Load saved templates. Edit names and colors. Set default template.',
    selector: '[data-tour="templates-button"]',
  },
  {
    id: 'gallery-button',
    title: 'Gallery Panel',
    description: 'View all saved images. Download or delete images. Images saved here are stored in your browser.',
    selector: '[data-tour="gallery-button"]',
  },
];

export default function QuickTooltips() {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [highlightStyle, setHighlightStyle] = useState(null);
  const panelRef = useRef(null);

  // Handle click outside to remove highlight
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (highlightedId && panelRef.current && !panelRef.current.contains(event.target)) {
        // Check if click is not on the highlighted element
        const highlightedElement = document.querySelector(
          TOOLTIP_ITEMS.find(item => item.id === highlightedId)?.selector
        );
        if (highlightedElement && !highlightedElement.contains(event.target)) {
          setHighlightedId(null);
          setHighlightStyle(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [highlightedId]);

  // Update highlight position when element is highlighted
  useEffect(() => {
    if (highlightedId) {
      const item = TOOLTIP_ITEMS.find(t => t.id === highlightedId);
      if (item) {
        const element = document.querySelector(item.selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightStyle({
            top: `${rect.top - 8}px`,
            left: `${rect.left - 8}px`,
            width: `${rect.width + 16}px`,
            height: `${rect.height + 16}px`,
          });
        }
      }
    } else {
      setHighlightStyle(null);
    }
  }, [highlightedId]);

  const handleTooltipClick = (item) => {
    if (highlightedId === item.id) {
      // Toggle off if already highlighted
      setHighlightedId(null);
      setHighlightStyle(null);
    } else {
      // Highlight new element
      setHighlightedId(item.id);
      const element = document.querySelector(item.selector);
      if (element) {
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <>
      {/* Highlight Overlay */}
      {highlightStyle && (
        <>
          {/* Dimmed backdrop */}
          <div className="fixed inset-0 bg-black/50 z-[9998] pointer-events-none transition-opacity duration-300" />
          
          {/* Highlight box */}
          <div
            className="fixed z-[9999] border-4 border-orange-500 rounded-xl pointer-events-none transition-all duration-300"
            style={highlightStyle}
          >
            <div className="absolute inset-0 bg-orange-500/10 rounded-lg animate-pulse" />
          </div>
        </>
      )}

      {/* Quick Tooltips Panel */}
      <div
        ref={panelRef}
        className="fixed bottom-4 right-4 z-[10000] flex flex-col items-end gap-2"
      >
        {/* Tooltips List */}
        {isOpen && (
          <div className="glass-panel border-2 border-orange-500/30 backdrop-blur-xl bg-white/10 rounded-2xl p-4 shadow-2xl w-96 max-h-[32rem] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-lg">Quick Help</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {TOOLTIP_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTooltipClick(item)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                    highlightedId === item.id
                      ? 'bg-orange-500/30 border-2 border-orange-500'
                      : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                  }`}
                >
                  <div className="font-semibold text-white text-sm mb-1">
                    {item.title}
                  </div>
                  <div className="text-white/70 text-xs">
                    {item.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
          title="Quick Help"
        >
          {isOpen ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <HelpCircle className="w-6 h-6" />
          )}
        </Button>
      </div>
    </>
  );
}

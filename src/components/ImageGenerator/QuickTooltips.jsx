import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

const TOOLTIP_ITEMS = [
  {
    id: 'canvas',
    title: 'Canvas',
    description: 'Click & drag elements to move. Use corner handles to resize. Right-click for more options. Ctrl+Click for multi-select. Use Shift+Drag to scale proportionally.',
    selector: '[data-tour="canvas"]',
  },
  {
    id: 'background-tab',
    title: 'Background Panel',
    description: 'Set solid colors, gradients, or upload images. Drag background images directly on canvas when this panel is active. Add color overlays with adjustable opacity. Apply blur effects to background images.',
    selector: '[data-tour="background-tab"]',
  },
  {
    id: 'image-tab',
    title: 'Images Panel',
    description: 'Upload images to canvas. Crop, resize, rotate, and add borders. Apply blur effects. Adjust opacity and positioning. Drag images directly on canvas to reposition.',
    selector: '[data-tour="image-tab"]',
  },
  {
    id: 'text-tab',
    title: 'Text Panel',
    description: 'Add text fields with custom fonts, sizes, and weights. Apply colors or gradients. Transform text (uppercase, lowercase, capitalize). Rotate and adjust opacity. Use Ctrl+G to group multiple text elements.',
    selector: '[data-tour="text-tab"]',
  },
  {
    id: 'elements-tab',
    title: 'Shapes Panel',
    description: 'Add rectangles, circles, lines, and stars. Customize with solid colors or gradients. Adjust borders, blur, opacity, and rotation. Group shapes with Ctrl+G for easier management.',
    selector: '[data-tour="elements-tab"]',
  },
  {
    id: 'download-tab',
    title: 'Download Panel',
    description: 'Export your design as PDF (PNG coming soon). Choose quality settings. Save to gallery (requires login) or download directly. Track your downloads in user statistics.',
    selector: '[data-tour="download-tab"]',
  },
  {
    id: 'layers-button',
    title: 'Layers Panel',
    description: 'View all canvas elements in order. Use up/down arrows to reorder layers. Select, lock, or delete elements. Multi-select with Ctrl+Click. Locked elements cannot be moved or edited.',
    selector: '[data-tour="layers-button"]',
  },
  {
    id: 'templates-button',
    title: 'Templates Panel',
    description: 'Save current design as template (max 4 per preset, requires login). Load saved templates instantly. Edit names and colors. Set default template. Templates sync across devices when logged in.',
    selector: '[data-tour="templates-button"]',
  },
  {
    id: 'gallery-button',
    title: 'Gallery Panel',
    description: 'View all saved images (requires login). Download or delete images. Gallery syncs across devices. Track total images generated in your user profile.',
    selector: '[data-tour="gallery-button"]',
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'View all available keyboard shortcuts. Includes undo/redo (Ctrl+Z/Ctrl+Shift+Z), delete (Delete key), grouping (Ctrl+G), and more. Master shortcuts for faster workflow.',
    selector: '[data-tour="keyboard-shortcuts-button"]',
  },
  {
    id: 'grid-toggle',
    title: 'Grid Overlay',
    description: 'Toggle canvas grid on/off for precise alignment. Grid helps position elements accurately. Use with snap-to-grid for perfect layouts. Grid is visual only and won\'t appear in exports.',
    selector: '[data-tour="grid-toggle-button"]',
  },
  {
    id: 'login-benefits',
    title: 'Sign In Benefits',
    description: '🔐 Login to unlock: Save templates (4 per preset), Save to gallery, Cross-device sync, Track statistics (images generated, downloads), Persistent preferences, Access saved work anywhere.',
    selector: '[data-tour="sign-in-button"]',
  },
];

export default function QuickTooltips() {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [highlightStyle, setHighlightStyle] = useState(null);
  const panelRef = useRef(null);

  // Handle click outside to close panel and remove highlight
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        // Close the panel if clicking outside
        if (isOpen) {
          setIsOpen(false);
        }
        
        // Remove highlight if clicking outside
        if (highlightedId) {
          const highlightedElement = document.querySelector(
            TOOLTIP_ITEMS.find(item => item.id === highlightedId)?.selector
          );
          if (highlightedElement && !highlightedElement.contains(event.target)) {
            setHighlightedId(null);
            setHighlightStyle(null);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [highlightedId, isOpen]);

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
      // Highlight new element (only if it has a selector)
      if (item.selector) {
        setHighlightedId(item.id);
        const element = document.querySelector(item.selector);
        if (element) {
          // Scroll element into view if needed
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // For items without selectors, just show them as selected without highlighting
        setHighlightedId(item.id);
        setHighlightStyle(null);
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
        className="relative flex flex-col items-end gap-2"
      >
        {/* Tooltips List */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 glass-panel border-2 border-orange-500/30 backdrop-blur-xl bg-white/10 rounded-2xl p-4 shadow-2xl w-96 max-h-[70vh] overflow-y-auto">
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
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 border-2 border-white/50 backdrop-blur-xl text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 animate-pulse"
          title="Quick Help - Interactive guide to all features (Canvas, Panels, Grid, Login Benefits, and more)"
        >
          {isOpen ? (
            <ChevronDown className="w-7 h-7" />
          ) : (
            <HelpCircle className="w-7 h-7" />
          )}
        </button>
      </div>
    </>
  );
}

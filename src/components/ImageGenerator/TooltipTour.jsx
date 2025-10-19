import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const TOUR_STEPS = [
  {
    id: 'canvas',
    title: 'Canvas Preview',
    description: 'This is your design canvas. Click and drag elements to move them, resize using corner handles, and see your design come to life in real-time.',
    position: 'center',
    highlightSelector: null, // Will highlight the canvas area
  },
  {
    id: 'background-tab',
    title: 'Background Controls',
    description: 'Customize your canvas background with solid colors, gradients, or images. Add color overlays for creative effects.',
    position: 'right',
    highlightSelector: '[data-tour="background-tab"]',
  },
  {
    id: 'image-tab',
    title: 'Image Upload',
    description: 'Upload images to your canvas. Crop, resize, add borders, and apply blur effects to make your images perfect.',
    position: 'right',
    highlightSelector: '[data-tour="image-tab"]',
  },
  {
    id: 'text-tab',
    title: 'Text Elements',
    description: 'Add text to your design. Choose from various fonts, adjust size, weight, and apply transformations like uppercase or lowercase.',
    position: 'right',
    highlightSelector: '[data-tour="text-tab"]',
  },
  {
    id: 'elements-tab',
    title: 'Shape Elements',
    description: 'Add shapes like rectangles, circles, lines, and stars. Customize colors, borders, blur, and opacity for each element.',
    position: 'right',
    highlightSelector: '[data-tour="elements-tab"]',
  },
  {
    id: 'download-tab',
    title: 'Download & Export',
    description: 'Export your design as PNG or JPG. Choose quality settings and download your creation.',
    position: 'right',
    highlightSelector: '[data-tour="download-tab"]',
  },
  {
    id: 'layers-button',
    title: 'Layers Panel',
    description: 'Manage all elements on your canvas. Reorder layers, select multiple elements, and organize your design.',
    position: 'bottom',
    highlightSelector: '[data-tour="layers-button"]',
  },
  {
    id: 'templates-button',
    title: 'Templates',
    description: 'Save your current design as a template or load previously saved templates for quick reuse.',
    position: 'bottom',
    highlightSelector: '[data-tour="templates-button"]',
  },
  {
    id: 'gallery-button',
    title: 'Gallery',
    description: 'Access your saved images. View, download, or delete images from your personal gallery.',
    position: 'bottom',
    highlightSelector: '[data-tour="gallery-button"]',
  },
];

export default function TooltipTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState(null);

  useEffect(() => {
    const step = TOUR_STEPS[currentStep];
    if (step.highlightSelector) {
      const element = document.querySelector(step.highlightSelector);
      setHighlightedElement(element);
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('etendy_tour_completed', 'true');
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  // Get position for tooltip
  const getTooltipPosition = () => {
    if (!highlightedElement) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const rect = highlightedElement.getBoundingClientRect();
    const tooltipWidth = 384; // w-96 = 384px
    const tooltipHeight = 300; // Approximate height
    const padding = 20;
    const position = {};

    switch (step.position) {
      case 'right':
        let rightLeft = rect.right + padding;
        // Check if tooltip would overflow right edge
        if (rightLeft + tooltipWidth > window.innerWidth) {
          rightLeft = window.innerWidth - tooltipWidth - padding;
        }
        let rightTop = rect.top + rect.height / 2;
        // Check if tooltip would overflow top/bottom
        if (rightTop - tooltipHeight / 2 < padding) {
          rightTop = padding + tooltipHeight / 2;
        } else if (rightTop + tooltipHeight / 2 > window.innerHeight) {
          rightTop = window.innerHeight - tooltipHeight / 2 - padding;
        }
        position.top = `${rightTop}px`;
        position.left = `${rightLeft}px`;
        position.transform = 'translateY(-50%)';
        break;
      case 'left':
        let leftRight = window.innerWidth - rect.left + padding;
        // Check if tooltip would overflow left edge
        if (window.innerWidth - leftRight - tooltipWidth < padding) {
          leftRight = window.innerWidth - padding;
        }
        let leftTop = rect.top + rect.height / 2;
        // Check if tooltip would overflow top/bottom
        if (leftTop - tooltipHeight / 2 < padding) {
          leftTop = padding + tooltipHeight / 2;
        } else if (leftTop + tooltipHeight / 2 > window.innerHeight) {
          leftTop = window.innerHeight - tooltipHeight / 2 - padding;
        }
        position.top = `${leftTop}px`;
        position.right = `${leftRight}px`;
        position.transform = 'translateY(-50%)';
        break;
      case 'bottom':
        let bottomTop = rect.bottom + padding;
        // Check if tooltip would overflow bottom edge
        if (bottomTop + tooltipHeight > window.innerHeight) {
          bottomTop = rect.top - tooltipHeight - padding;
        }
        let bottomLeft = rect.left + rect.width / 2;
        // Check if tooltip would overflow left/right
        if (bottomLeft - tooltipWidth / 2 < padding) {
          bottomLeft = padding + tooltipWidth / 2;
        } else if (bottomLeft + tooltipWidth / 2 > window.innerWidth) {
          bottomLeft = window.innerWidth - tooltipWidth / 2 - padding;
        }
        position.top = `${bottomTop}px`;
        position.left = `${bottomLeft}px`;
        position.transform = 'translateX(-50%)';
        break;
      case 'top':
        let topBottom = window.innerHeight - rect.top + padding;
        // Check if tooltip would overflow top edge
        if (window.innerHeight - topBottom - tooltipHeight < padding) {
          topBottom = window.innerHeight - rect.bottom - padding;
        }
        let topLeft = rect.left + rect.width / 2;
        // Check if tooltip would overflow left/right
        if (topLeft - tooltipWidth / 2 < padding) {
          topLeft = padding + tooltipWidth / 2;
        } else if (topLeft + tooltipWidth / 2 > window.innerWidth) {
          topLeft = window.innerWidth - tooltipWidth / 2 - padding;
        }
        position.bottom = `${topBottom}px`;
        position.left = `${topLeft}px`;
        position.transform = 'translateX(-50%)';
        break;
      default:
        position.top = '50%';
        position.left = '50%';
        position.transform = 'translate(-50%, -50%)';
    }

    return position;
  };

  // Get highlight position
  const getHighlightStyle = () => {
    if (!highlightedElement) return null;

    const rect = highlightedElement.getBoundingClientRect();
    return {
      top: `${rect.top - 8}px`,
      left: `${rect.left - 8}px`,
      width: `${rect.width + 16}px`,
      height: `${rect.height + 16}px`,
    };
  };

  return (
    <>
      {/* Dimmed Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-[9998] transition-opacity duration-300" />

      {/* Highlight Box */}
      {highlightedElement && (
        <div
          className="fixed z-[9999] border-4 border-orange-500 rounded-xl pointer-events-none transition-all duration-300"
          style={getHighlightStyle()}
        >
          <div className="absolute inset-0 bg-orange-500/10 rounded-lg animate-pulse" />
        </div>
      )}

      {/* Tooltip Card */}
      <div
        className="fixed z-[10000] w-96 glass-panel border-2 border-orange-500/50 backdrop-blur-xl bg-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-300"
        style={getTooltipPosition()}
      >
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/60 text-xs mt-2">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </p>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
        <p className="text-white/80 text-sm leading-relaxed mb-6">
          {step.description}
        </p>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Skip Tour
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              className="bg-white/10 border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              {currentStep < TOUR_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}


import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Heart, RotateCw, Save, Expand, Undo2, Redo2 } from "lucide-react";

const HANDLE_SIZE = 12;
const SNAP_THRESHOLD = 10; // Pixels for snapping

export default function CanvasPreview({
  elements, setElements,
  selectedElementIds, setSelectedElementIds, // Changed from selectedElementId to selectedElementIds
  updateElement,
  canvasWidth, canvasHeight, onCanvasSizeChange,
  backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage,
  backgroundImageScale, backgroundImageX, backgroundImageY, backgroundImageBlur,
  backgroundImageBorderRadius, backgroundImageBorderWidth, backgroundImageBorderColor,
  overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2,
  overlayGradientAngle, showCanvasBackgroundOverlay,
  onDownload, isDownloading,
  onSave, isSaving,
  onCanvasReset,
  onUndo, canUndo,
  onRedo, canRedo,
  onInteractionStart,
  onSaveTemplate, isSavingTemplate, // Keep prop even if UI is removed in this section, might be used elsewhere
  adminSettings,
  presetRestrictions, // Preset restrictions
  isAdmin, // Admin status prop
  isCropping, // New prop
  ctrlPressed, // New prop for multi-select
  onElementSelect, // Callback when element is selected
  setBackgroundImageX, // Callback to update background X position
  setBackgroundImageY, // Callback to update background Y position
  backgroundImageNaturalDimensions, // Natural dimensions of background image
  allowBackgroundDragging = false, // Whether background dragging is enabled
  showNotification, // Function to show notifications
  showGrid = false, // Whether to show grid
  backgroundDragAttempts = 0, // Track background drag attempts
  setBackgroundDragAttempts, // Update background drag attempts
  activeControlPanel, // Current active panel
  handleGroupElements, // Function to group elements
  handleUngroupElements, // Function to ungroup elements
}) {
  const canvasRef = useRef(null);
  const backgroundImageCacheRef = useRef(null); // Cache for background image
  const backgroundCacheKeyRef = useRef(''); // Track cache validity
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [interactionState, setInteractionState] = useState({ type: 'none' });
  const [canvasSizeMode, setCanvasSizeMode] = useState('custom'); // Changed default to 'custom'
  const [imageCache] = useState(new Map());
  const [shiftPressed, setShiftPressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);
  const [localCtrlPressed, setLocalCtrlPressed] = useState(false);
  // const [templateName, setTemplateName] = useState(''); // Removed, as template save UI is removed
  const [snapLines, setSnapLines] = useState({ horizontal: false, vertical: false, elementSnap: [] }); // elementSnap: array of {type: 'left'|'right'|'top'|'bottom', position: number}
  const [showCanvasSizePanel, setShowCanvasSizePanel] = useState(false); // New state for popover visibility
  const [showBottomCanvasSizePanel, setShowBottomCanvasSizePanel] = useState(false); // State for bottom popover
  const [selectionBox, setSelectionBox] = useState(null); // For drag-to-select: { startX, startY, endX, endY }
  const [contextMenu, setContextMenu] = useState(null); // { x, y, elementId }
  const [copiedElement, setCopiedElement] = useState(null); // Store copied element data
  const [interactionStarted, setInteractionStarted] = useState(false); // Track if history should be saved

  // Local state for custom input fields to avoid conflicts with global state
  const [customWidth, setCustomWidth] = useState(canvasWidth);
  const [customHeight, setCustomHeight] = useState(canvasHeight);

  // Track shift, alt, and ctrl keys for scaling and multi-select
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') setShiftPressed(true);
      if (e.key === 'Alt') setAltPressed(true);
      if (e.ctrlKey || e.metaKey) setLocalCtrlPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setShiftPressed(false);
      if (e.key === 'Alt') setAltPressed(false);
      if (!e.ctrlKey && !e.metaKey) setLocalCtrlPressed(false);
    };
    
    // Reset all modifier keys when window loses focus (prevents stuck keys)
    const handleBlur = () => {
      setShiftPressed(false);
      setAltPressed(false);
      setLocalCtrlPressed(false);
    };
    
    // Also reset on visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShiftPressed(false);
        setAltPressed(false);
        setLocalCtrlPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Effect for deleting selected elements with Delete key
  useEffect(() => {
    const handleDeleteKey = (e) => {
      // Don't delete if user is typing in an input, textarea, or content-editable field
      const activeElement = document.activeElement;
      const isTyping = activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);

      if (e.key === 'Delete' && selectedElementIds.length > 0 && !isTyping) {
        e.preventDefault(); // Prevent any default behavior
        setElements(prevElements => prevElements.filter(el => !selectedElementIds.includes(el.id)));
        setSelectedElementIds([]);
      }
    };

    window.addEventListener('keydown', handleDeleteKey);
    return () => {
      window.removeEventListener('keydown', handleDeleteKey);
    };
  }, [selectedElementIds, setElements, setSelectedElementIds]);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Promise.all([
          document.fonts.load('600 60px "Archivo Expanded"'),
          document.fonts.load('300 50px "Archivo"'),
          document.fonts.load('400 16px "Inter"'),
          document.fonts.load('400 16px "Playfair Display"'),
          document.fonts.load('400 16px "DM Serif Text"'),
        ]);
        setFontsLoaded(true);
      } catch (error) {
        console.error('Font loading failed:', error);
        setFontsLoaded(true); // Still set to true to avoid infinite loading state
      }
    };
    loadFonts();
  }, []);

  const loadImage = useCallback(async (src) => {
    if (!src) {
      return Promise.reject(new Error("Image source is undefined"));
    }
    if (imageCache.has(src)) {
      return imageCache.get(src);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imageCache.set(src, img); resolve(img); };
      img.onerror = (e) => { console.error(`Error loading image from ${src}:`, e); reject(e); };
      img.src = src;
    });
  }, [imageCache]);

  const getElementRect = useCallback((element) => {
    if (!element) return null;
    switch (element.type) {
      case 'image':
      case 'logo': {
        // Needs image's natural dimensions to correctly calculate cropped dimensions
        // Assuming element.naturalWidth/Height are already set on the element object
        const imgNaturalWidth = element.naturalWidth || 1; // Default to 1 to avoid division by zero
        const imgNaturalHeight = element.naturalHeight || 1;

        let sx, sy, sWidth, sHeight;
        const isImage = element.type === 'image';
        if (isImage && element.crop) {
            sx = element.crop.x;
            sy = element.crop.y;
            sWidth = element.crop.width;
            sHeight = element.crop.height;
        } else { // For logo, or image without explicit crop yet (though crop should ideally be set for images)
            sx = 0;
            sy = 0;
            sWidth = imgNaturalWidth;
            sHeight = imgNaturalHeight;
        }
        
        sWidth = Math.max(1, sWidth);
        sHeight = Math.max(1, sHeight);

        // Support independent width/height scaling (scaleX, scaleY) or fallback to uniform scale
        const scaleX = element.scaleX !== undefined ? element.scaleX : element.scale;
        const scaleY = element.scaleY !== undefined ? element.scaleY : element.scale;
        const scaledWidth = sWidth * scaleX;
        const scaledHeight = sHeight * scaleY;
        return { x: element.x - scaledWidth / 2, y: element.y - scaledHeight / 2, width: scaledWidth, height: scaledHeight };
      }
      case 'text': {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        ctx.font = `${element.style} ${element.weight} ${element.size}px "${element.font}", Arial, sans-serif`;
        
        const applyTextTransform = (text, transform) => {
            if (!text) return '';
            if (transform === 'uppercase') return text.toUpperCase();
            if (transform === 'capitalize') return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            return text;
        }

        const lines = applyTextTransform(element.content, element.transform).split('\n');
        let maxWidth = 0;
        lines.forEach(line => maxWidth = Math.max(maxWidth, ctx.measureText(line).width));
        
        const height = lines.length * element.size * (element.lineHeight || 1.2);

        // Bounding box is always at element.x, element.y (top-left corner)
        // Text aligns within this box, not by moving the box
        return { x: element.x, y: element.y, width: maxWidth, height: height };
      }
      case 'shape': {
        // For shapes, x, y are usually top-left, width, height are direct dimensions
        return { x: element.x, y: element.y, width: element.width, height: element.height };
      }
      default:
        return null;
    }
  }, [canvasRef]);

  const getHandles = useCallback((rect) => {
    if (!rect) return {};
    const midX = rect.x + rect.width / 2;
    const midY = rect.y + rect.height / 2;
    return {
      // Corner handles
      tl: { x: rect.x, y: rect.y, cursor: 'nwse-resize' },
      tr: { x: rect.x + rect.width, y: rect.y, cursor: 'nesw-resize' },
      bl: { x: rect.x, y: rect.y + rect.height, cursor: 'nesw-resize' },
      br: { x: rect.x + rect.width, y: rect.y + rect.height, cursor: 'nwse-resize' },
      // Side handles
      t: { x: midX, y: rect.y, cursor: 'ns-resize' },
      b: { x: midX, y: rect.y + rect.height, cursor: 'ns-resize' },
      l: { x: rect.x, y: midY, cursor: 'ew-resize' },
      r: { x: rect.x + rect.width, y: midY, cursor: 'ew-resize' }
    };
  }, []);

  const drawRoundedRectPath = useCallback((ctx, x, y, width, height, borderRadius) => {
    // Ensure borderRadius is an object with tl, tr, br, bl properties
    const radii = typeof borderRadius === 'number'
      ? { tl: borderRadius, tr: borderRadius, br: borderRadius, bl: borderRadius }
      : { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...borderRadius }; // Provide defaults if object is incomplete

    // Clamp each radius to at most half of the corresponding dimension
    const maxR = Math.min(width, height) / 2;
    radii.tl = Math.max(0, Math.min(maxR, radii.tl));
    radii.tr = Math.max(0, Math.min(maxR, radii.tr));
    radii.br = Math.max(0, Math.min(maxR, radii.br));
    radii.bl = Math.max(0, Math.min(maxR, radii.bl));

    ctx.beginPath();
    // Top line
    ctx.moveTo(x + radii.tl, y);
    ctx.lineTo(x + width - radii.tr, y);
    // Top-right corner
    ctx.arcTo(x + width, y, x + width, y + height, radii.tr);
    // Right line
    ctx.lineTo(x + width, y + height - radii.br);
    // Bottom-right corner
    ctx.arcTo(x + width, y + height, x, y + height, radii.br); // Fixed the third point here for arcTo
    // Bottom line
    ctx.lineTo(x + radii.bl, y + height);
    // Bottom-left corner
    ctx.arcTo(x, y + height, x, y, radii.bl);
    // Left line
    ctx.lineTo(x, y + radii.tl);
    // Top-left corner
    ctx.arcTo(x, y, x + width, y, radii.tl);
    ctx.closePath();
  }, []);

  const drawStarPath = useCallback((ctx, x, y, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
        rot += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
  }, []);

  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw Background
    if (backgroundType === 'image' && backgroundImage) {
      try {
        // Create cache key for background image
        const cacheKey = `${backgroundImage}_${backgroundImageScale}_${backgroundImageBlur}`;
        
        // Check if we need to regenerate the cached image
        if (backgroundCacheKeyRef.current !== cacheKey || !backgroundImageCacheRef.current) {
          const bgImg = await loadImage(backgroundImage);
          const naturalWidth = bgImg.naturalWidth || bgImg.width;
          const naturalHeight = bgImg.naturalHeight || bgImg.height;
          const scaledWidth = naturalWidth * backgroundImageScale;
          const scaledHeight = naturalHeight * backgroundImageScale;
          
          // Create offscreen canvas for caching
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = scaledWidth;
          offscreenCanvas.height = scaledHeight;
          const offscreenCtx = offscreenCanvas.getContext('2d');
          
          // Apply blur to cached image
          if (backgroundImageBlur > 0) {
            offscreenCtx.filter = `blur(${backgroundImageBlur}px)`;
          }
          offscreenCtx.drawImage(bgImg, 0, 0, scaledWidth, scaledHeight);
          offscreenCtx.filter = 'none';
          
          // Store in cache
          backgroundImageCacheRef.current = offscreenCanvas;
          backgroundCacheKeyRef.current = cacheKey;
        }
        
        // Use cached image
        const bgImg = await loadImage(backgroundImage);
        const naturalWidth = bgImg.naturalWidth || bgImg.width;
        const naturalHeight = bgImg.naturalHeight || bgImg.height;
        const scaledWidth = naturalWidth * backgroundImageScale;
        const scaledHeight = naturalHeight * backgroundImageScale;
        
        // Apply border radius and border if specified in admin settings
        if ((backgroundImageBorderRadius && backgroundImageBorderRadius > 0) || (backgroundImageBorderWidth && backgroundImageBorderWidth > 0)) {
          ctx.save();
          const radius = backgroundImageBorderRadius || 0;
          const borderWidth = backgroundImageBorderWidth || 0;
          const borderColor = backgroundImageBorderColor || '#ffffff';
          
          if (radius > 0) {
            // Corrected drawRoundedRectPath usage with single radius for all corners
            ctx.beginPath();
            ctx.moveTo(backgroundImageX + radius, backgroundImageY);
            ctx.lineTo(backgroundImageX + scaledWidth - radius, backgroundImageY);
            ctx.quadraticCurveTo(backgroundImageX + scaledWidth, backgroundImageY, backgroundImageX + scaledWidth, backgroundImageY + radius);
            ctx.lineTo(backgroundImageX + scaledWidth, backgroundImageY + scaledHeight - radius);
            ctx.quadraticCurveTo(backgroundImageX + scaledWidth, backgroundImageY + scaledHeight, backgroundImageX + scaledWidth - radius, backgroundImageY + scaledHeight);
            ctx.lineTo(backgroundImageX + radius, backgroundImageY + scaledHeight);
            ctx.quadraticCurveTo(backgroundImageX, backgroundImageY + scaledHeight, backgroundImageX, backgroundImageY + scaledHeight - radius);
            ctx.lineTo(backgroundImageX, backgroundImageY + radius);
            ctx.quadraticCurveTo(backgroundImageX, backgroundImageY, backgroundImageX + radius, backgroundImageY);
            ctx.closePath();
            ctx.clip();
          }
          
          // Draw from cached canvas (already has blur applied)
          ctx.drawImage(backgroundImageCacheRef.current, backgroundImageX, backgroundImageY);
          
          if (borderWidth > 0) {
            ctx.restore(); // Restore to remove clip to draw border
            ctx.save(); // Save again to re-apply drawing state for border
            // Redraw path for border
            ctx.beginPath();
            ctx.moveTo(backgroundImageX + radius, backgroundImageY);
            ctx.lineTo(backgroundImageX + scaledWidth - radius, backgroundImageY);
            ctx.quadraticCurveTo(backgroundImageX + scaledWidth, backgroundImageY, backgroundImageX + scaledWidth, backgroundImageY + radius);
            ctx.lineTo(backgroundImageX + scaledWidth, backgroundImageY + scaledHeight - radius);
            ctx.quadraticCurveTo(backgroundImageX + scaledWidth, backgroundImageY + scaledHeight, backgroundImageX + scaledWidth - radius, backgroundImageY + scaledHeight);
            ctx.lineTo(backgroundImageX + radius, backgroundImageY + scaledHeight);
            ctx.quadraticCurveTo(backgroundImageX, backgroundImageY + scaledHeight, backgroundImageX, backgroundImageY + scaledHeight - radius);
            ctx.lineTo(backgroundImageX, backgroundImageY + radius);
            ctx.quadraticCurveTo(backgroundImageX, backgroundImageY, backgroundImageX + radius, backgroundImageY);
            ctx.closePath();
            
            ctx.lineWidth = borderWidth;
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
          ctx.restore(); // Restore again after border drawing
        } else {
          // Draw from cached canvas (already has blur applied)
          ctx.drawImage(backgroundImageCacheRef.current, backgroundImageX, backgroundImageY);
        }
      } catch (error) { console.error('Error loading background image:', error); }
    } else if (backgroundType === 'color') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      const angleRad = ((gradientAngle || 135) * Math.PI) / 180;
      const length = Math.abs(canvasWidth * Math.cos(angleRad)) + Math.abs(canvasHeight * Math.sin(angleRad));
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const x0 = centerX - (Math.cos(angleRad) * length) / 2;
      const y0 = centerY - (Math.sin(angleRad) * length) / 2;
      const x1 = centerX + (Math.cos(angleRad) * length) / 2;
      const y1 = centerY + (Math.sin(angleRad) * length) / 2;
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, gradientColor1);
      gradient.addColorStop(1, gradientColor2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw Overlay
    if (overlayType === 'solid' && overlayOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = overlayOpacity;
      ctx.fillStyle = overlayColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    } else if (overlayType === 'gradient' && (overlayGradientOpacity1 > 0 || overlayGradientOpacity2 > 0)) {
      ctx.save();
      const angleRad = (overlayGradientAngle * Math.PI) / 180;
      const length = Math.abs(canvasWidth * Math.cos(angleRad)) + Math.abs(canvasHeight * Math.sin(angleRad));
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const x0 = centerX - (Math.cos(angleRad) * length) / 2;
      const y0 = centerY - (Math.sin(angleRad) * length) / 2;
      const x1 = centerX + (Math.cos(angleRad) * length) / 2;
      const y1 = centerY + (Math.sin(angleRad) * length) / 2;
      const overlayGradient = ctx.createLinearGradient(x0, y0, x1, y1);
      const color1WithAlpha = overlayGradientColor1 + Math.round(overlayGradientOpacity1 * 255).toString(16).padStart(2, '0');
      const color2WithAlpha = overlayGradientColor2 + Math.round(overlayGradientOpacity2 * 255).toString(16).padStart(2, '0');
      overlayGradient.addColorStop(0, color1WithAlpha);
      overlayGradient.addColorStop(1, color2WithAlpha);
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }
    
    // Draw all elements
    for (const el of elements) {
        ctx.save(); // Save context state before drawing each element
        
        // Apply global opacity
        if (el.opacity != null) { // Using != null checks for both undefined and null
          ctx.globalAlpha = el.opacity;
        }

        // Apply blur if specified
        if (el.blur && el.blur > 0) {
          ctx.filter = `blur(${el.blur}px)`;
        }

        if (el.type === 'image' || el.type === 'logo') {
            try {
                const img = await loadImage(el.src);
                const isImage = el.type === 'image';
                const rotation = Number(el.rotation || 0);

                const imgNaturalWidth = img.naturalWidth || img.width;
                const imgNaturalHeight = img.naturalHeight || img.height;

                // Source rectangle
                let sx, sy, sWidth, sHeight;
                if (isImage && el.crop) {
                    sx = el.crop.x; sy = el.crop.y; sWidth = el.crop.width; sHeight = el.crop.height;
                } else {
                    sx = 0; sy = 0; sWidth = imgNaturalWidth; sHeight = imgNaturalHeight;
                }
                sWidth = Math.max(1, sWidth);
                sHeight = Math.max(1, sHeight);

                // Support independent width/height scaling (scaleX, scaleY) or fallback to uniform scale
                const scaleX = el.scaleX !== undefined ? el.scaleX : el.scale;
                const scaleY = el.scaleY !== undefined ? el.scaleY : el.scale;
                const dWidth = sWidth * scaleX;
                const dHeight = sHeight * scaleY;
                const halfW = dWidth / 2;
                const halfH = dHeight / 2;
                const borderRadius = Math.min(el.borderRadius || 0, halfW, halfH);

                ctx.save();
                // Rotate around element center
                ctx.translate(el.x, el.y);
                if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);

                // Clip rounded rect if needed
                if (borderRadius > 0) {
                  ctx.beginPath();
                  ctx.moveTo(-halfW + borderRadius, -halfH);
                  ctx.lineTo(halfW - borderRadius, -halfH);
                  ctx.quadraticCurveTo(halfW, -halfH, halfW, -halfH + borderRadius);
                  ctx.lineTo(halfW, halfH - borderRadius);
                  ctx.quadraticCurveTo(halfW, halfH, halfW - borderRadius, halfH);
                  ctx.lineTo(-halfW + borderRadius, halfH);
                  ctx.quadraticCurveTo(-halfW, halfH, -halfW, halfH - borderRadius);
                  ctx.lineTo(-halfW, -halfH + borderRadius);
                  ctx.quadraticCurveTo(-halfW, -halfH, -halfW + borderRadius, -halfH);
                  ctx.closePath();
                  ctx.clip();
                }

                ctx.drawImage(img, sx, sy, sWidth, sHeight, -halfW, -halfH, dWidth, dHeight);

                // Border
                if (el.borderWidth > 0) {
                  ctx.beginPath();
                  ctx.moveTo(-halfW + borderRadius, -halfH);
                  ctx.lineTo(halfW - borderRadius, -halfH);
                  ctx.quadraticCurveTo(halfW, -halfH, halfW, -halfH + borderRadius);
                  ctx.lineTo(halfW, halfH - borderRadius);
                  ctx.quadraticCurveTo(halfW, halfH, halfW - borderRadius, halfH);
                  ctx.lineTo(-halfW + borderRadius, halfH);
                  ctx.quadraticCurveTo(-halfW, halfH, -halfW, halfH - borderRadius);
                  ctx.lineTo(-halfW, -halfH + borderRadius);
                  ctx.quadraticCurveTo(-halfW, -halfH, -halfW + borderRadius, -halfH);
                  ctx.closePath();
                  ctx.lineWidth = el.borderWidth;
                  if (el.borderType === 'gradient') {
                    const gradient = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
                    gradient.addColorStop(0, el.borderGradient1);
                    gradient.addColorStop(1, el.borderGradient2);
                    ctx.strokeStyle = gradient;
                  } else {
                    ctx.strokeStyle = el.borderColor;
                  }
                  ctx.stroke();
                }
                ctx.restore();
            } catch (error) {
                console.error(`Error loading ${el.type}:`, error);
                console.error('Element src:', el.src);
            }
        } else if (el.type === 'text') {
            const applyTextTransform = (text, transform) => {
              if (!text) return '';
              if (transform === 'uppercase') return text.toUpperCase();
              if (transform === 'capitalize') return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
              return text;
            }
            const rotation = Number(el.rotation || 0);
            ctx.font = `${el.style} ${el.weight} ${el.size}px "${el.font}", Arial, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left'; // Always use left alignment, we'll calculate offset manually

            const transformedText = applyTextTransform(el.content, el.transform);
            const textLines = transformedText.split('\n');
            const lineHeight = el.size * (el.lineHeight || 1.2);
            
            // Measure max width for alignment calculations
            const maxWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));

            ctx.save();
            ctx.translate(el.x, el.y);
            if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
            
            // Build gradient or solid fill AFTER translation
            if (el.colorType === 'gradient' && el.color1 && el.color2) {
              // Create gradient across the full text width (always left-aligned at 0)
              const gradient = ctx.createLinearGradient(0, 0, maxWidth, 0);
              gradient.addColorStop(0, el.color1);
              gradient.addColorStop(1, el.color2);
              ctx.fillStyle = gradient;
            } else {
              ctx.fillStyle = el.color1 || '#000000';
            }
            
            // Draw each line with alignment offset
            textLines.forEach((line, index) => {
              const lineWidth = ctx.measureText(line).width;
              let xOffset = 0;
              
              // Calculate x offset based on alignment within the text box
              if (el.textAlign === 'center') {
                xOffset = (maxWidth - lineWidth) / 2;
              } else if (el.textAlign === 'right') {
                xOffset = maxWidth - lineWidth;
              }
              
              ctx.fillText(line, xOffset, index * lineHeight);
            });
            ctx.restore();
        } else if (el.type === 'shape') {
            const { shapeType, x, y, width, height, colorType, color1, color2, borderRadius, fillType, strokeWidth, spikes, rotation = 0 } = el;
            
            const centerX = x + width / 2;
            const centerY = y + height / 2;

            // Apply rotation for ALL shapes
            if (rotation !== 0) {
              ctx.translate(centerX, centerY);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.translate(-centerX, -centerY);
            }
            
            // Safety check: ensure colors exist
            const safeColor1 = color1 || '#000000';
            const safeColor2 = color2 || color1 || '#FFFFFF';
            
            if (colorType === 'gradient') {
                try {
                  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
                  gradient.addColorStop(0, safeColor1);
                  gradient.addColorStop(1, safeColor2);
                  ctx.fillStyle = gradient;
                  ctx.strokeStyle = gradient;
                } catch (gradientError) {
                  console.warn('Gradient creation failed in CanvasPreview, using solid color:', gradientError);
                  ctx.fillStyle = safeColor1;
                  ctx.strokeStyle = safeColor1;
                }
            } else {
                ctx.fillStyle = safeColor1;
                ctx.strokeStyle = safeColor1;
            }

            if (shapeType === 'rectangle') {
                drawRoundedRectPath(ctx, x, y, width, height, borderRadius);
            } else if (shapeType === 'circle') {
                ctx.beginPath();
                // Ellipse to support non-proportional scaling
                ctx.ellipse(x + width / 2, y + height / 2, Math.max(0, width / 2), Math.max(0, height / 2), 0, 0, Math.PI * 2);
                ctx.closePath();
            } else if (shapeType === 'line') {
                ctx.lineWidth = strokeWidth || 4;
                ctx.beginPath();
                ctx.moveTo(x, y + height / 2);
                ctx.lineTo(x + width, y + height / 2);
                ctx.stroke();
                // Lines are always drawn as strokes, skip the fill/outline logic below
                ctx.restore(); // Restore context to remove blur/rotation before next element
                continue; // Move to the next element
            } else if (shapeType === 'star') {
                drawStarPath(ctx, x + width / 2, y + height / 2, spikes || 5, width / 2, height / 4);
            }
            
            // For non-line shapes, apply fill or outline
            if (fillType === 'fill') {
                ctx.fill();
            } else { // if fillType is 'outline' (previously 'stroke')
                ctx.lineWidth = strokeWidth || 2; // Default strokeWidth
                ctx.stroke();
            }
        }
        ctx.restore(); // Restore context state after drawing each element (resets filter, clip, opacity, rotation, etc.)
    }

    // Draw selection boxes and handles for all selected elements
    selectedElementIds.forEach(selectedId => {
      const selectedElement = elements.find(el => el.id === selectedId);
      if (selectedElement) {
        const rect = getElementRect(selectedElement);
        if (rect) {
          // Different color for locked elements
          if (selectedElement.locked) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)'; // Red for locked
          } else {
            ctx.strokeStyle = 'rgba(76, 126, 255, 0.9)'; // Blue for unlocked
          }
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 4]);
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
          ctx.setLineDash([]);
          
          // Show lock icon for locked elements
          if (selectedElement.locked) {
            ctx.save();
            ctx.font = '20px Arial';
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.fillText('🔒', rect.x + rect.width - 25, rect.y + 20);
            ctx.restore();
          }
          
          // Only show handles if single element is selected, not text, and not locked
          if (selectedElementIds.length === 1 && selectedElement.type !== 'text' && !selectedElement.locked) {
              const handles = getHandles(rect);
              ctx.fillStyle = '#FFFFFF';
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              Object.values(handles).forEach(handle => {
                ctx.beginPath();
                ctx.arc(handle.x, handle.y, HANDLE_SIZE / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
              });
          }
        }
      }
    });
    
    // Draw Canvas Edge Indicators for ALL elements (not just text)
    const edgeGlowWidth = 8;
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = edgeGlowWidth;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.8;
    elements.forEach(el => {
        const rect = getElementRect(el);
        if(!rect) return;
        if (rect.x < 0) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, canvasHeight); ctx.stroke(); }
        if (rect.x + rect.width > canvasWidth) { ctx.beginPath(); ctx.moveTo(canvasWidth, 0); ctx.lineTo(canvasWidth, canvasHeight); ctx.stroke(); }
        if (rect.y < 0) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(canvasWidth, 0); ctx.stroke(); }
        if (rect.y + rect.height > canvasHeight) { ctx.beginPath(); ctx.moveTo(0, canvasHeight); ctx.lineTo(canvasWidth, canvasHeight); ctx.stroke(); }
    });
    ctx.restore();

    // Draw Snapping Guidelines (center lines)
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // Red color for snap lines
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed lines
    if (snapLines.horizontal) {
      ctx.beginPath();
      ctx.moveTo(0, canvasHeight / 2);
      ctx.lineTo(canvasWidth, canvasHeight / 2);
      ctx.stroke();
    }
    if (snapLines.vertical) {
      ctx.beginPath();
      ctx.moveTo(canvasWidth / 2, 0);
      ctx.lineTo(canvasWidth / 2, canvasHeight);
      ctx.stroke();
    }
    
    // Draw element-to-element snap lines
    if (snapLines.elementSnap && snapLines.elementSnap.length > 0) {
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // Orange color for element snap lines
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      snapLines.elementSnap.forEach(snapLine => {
        ctx.beginPath();
        if (snapLine.type === 'left' || snapLine.type === 'right') {
          // Vertical line
          ctx.moveTo(snapLine.position, 0);
          ctx.lineTo(snapLine.position, canvasHeight);
        } else if (snapLine.type === 'top' || snapLine.type === 'bottom') {
          // Horizontal line
          ctx.moveTo(0, snapLine.position);
          ctx.lineTo(canvasWidth, snapLine.position);
        }
        ctx.stroke();
      });
    }
    ctx.restore();
    
    // Draw Selection Box (drag-to-select)
    if (selectionBox) {
      const { startX, startY, endX, endY } = selectionBox;
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      const width = maxX - minX;
      const height = maxY - minY;
      
      ctx.save();
      // Draw semi-transparent fill
      ctx.fillStyle = 'rgba(76, 126, 255, 0.1)';
      ctx.fillRect(minX, minY, width, height);
      
      // Draw border
      ctx.strokeStyle = 'rgba(76, 126, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(minX, minY, width, height);
      ctx.setLineDash([]);
      ctx.restore();
    }
    
    // Draw Grid Overlay (if enabled)
    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      
      const gridSize = 50; // Grid cell size in pixels
      
      // Draw vertical lines
      for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Draw Canvas Background Overlay Text
    // Only show "Canvas Background" overlay if no background customization has been done
    if (showCanvasBackgroundOverlay && backgroundType === 'color' && backgroundColor === '#211c1a' && overlayOpacity === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `600 ${Math.min(48, canvasWidth * 0.032)}px "Archivo Expanded", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Canvas Background', canvasWidth / 2, canvasHeight / 2);
      ctx.restore();
    }
  }, [
    elements, canvasWidth, canvasHeight, backgroundType, backgroundImage, backgroundColor, gradientColor1, gradientColor2, gradientAngle,
    overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2,
    overlayGradientAngle, showCanvasBackgroundOverlay, loadImage, getElementRect, getHandles, drawRoundedRectPath, drawStarPath, selectedElementIds,
    backgroundImageScale, backgroundImageX, backgroundImageY, backgroundImageBlur, snapLines, selectionBox,
    // New dependencies for background image border/radius
    backgroundImageBorderRadius, backgroundImageBorderWidth, backgroundImageBorderColor, showGrid
  ]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Sync local state when global canvas dimensions change (e.g., from presets)
  useEffect(() => {
    setCustomWidth(canvasWidth);
    setCustomHeight(canvasHeight);
  }, [canvasWidth, canvasHeight]);

  const getMousePosOnCanvas = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasWidth / rect.width),
      y: (e.clientY - rect.top) * (canvasHeight / rect.height)
    };
  }, [canvasWidth, canvasHeight]);

  const isPointInBackgroundImage = useCallback((mousePos) => {
    if (backgroundType !== 'image' || !backgroundImage || !backgroundImageNaturalDimensions) return false;
    
    const { width: naturalWidth, height: naturalHeight } = backgroundImageNaturalDimensions;
    const scaledWidth = naturalWidth * backgroundImageScale;
    const scaledHeight = naturalHeight * backgroundImageScale;
    
    return (
      mousePos.x >= backgroundImageX &&
      mousePos.x <= backgroundImageX + scaledWidth &&
      mousePos.y >= backgroundImageY &&
      mousePos.y <= backgroundImageY + scaledHeight
    );
  }, [backgroundType, backgroundImage, backgroundImageNaturalDimensions, backgroundImageScale, backgroundImageX, backgroundImageY]);

  const isPointInOutline = useCallback((mousePos, element) => {
    const HIT_TOLERANCE = 5;
    const rect = getElementRect(element);
    if (!rect) return false;

    const { x, y, width, height } = rect;
    const { shapeType, strokeWidth = 2, rotation = 0 } = element;

    // Special, more precise check for rotated lines
    if (shapeType === 'line') {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Translate mouse position to be relative to the line's center
        const translatedMouseX = mousePos.x - centerX;
        const translatedMouseY = mousePos.y - centerY;
        
        // Inverse-rotate the mouse position
        const angleRad = -rotation * Math.PI / 180;
        const cosAngle = Math.cos(angleRad);
        const sinAngle = Math.sin(angleRad);
        
        const rotatedMouseX = translatedMouseX * cosAngle - translatedMouseY * sinAngle;
        const rotatedMouseY = translatedMouseX * sinAngle + translatedMouseY * cosAngle;
        
        // Check if the inverse-rotated point is within the unrotated line's bounding box
        const lineThickness = (strokeWidth || 4);
        const halfLineThicknessWithTolerance = (lineThickness / 2) + HIT_TOLERANCE;

        return (
            rotatedMouseX >= -width / 2 - HIT_TOLERANCE &&
            rotatedMouseX <= width / 2 + HIT_TOLERANCE &&
            rotatedMouseY >= -halfLineThicknessWithTolerance &&
            rotatedMouseY <= halfLineThicknessWithTolerance
        );
    }
    
    if (shapeType === 'rectangle') {
        // Check if mouse position is within the stroke area (including tolerance)
        const isNearLeft = mousePos.x >= x - HIT_TOLERANCE && mousePos.x <= x + strokeWidth + HIT_TOLERANCE &&
                           mousePos.y >= y - HIT_TOLERANCE && mousePos.y <= y + height + HIT_TOLERANCE;
        const isNearRight = mousePos.x >= x + width - strokeWidth - HIT_TOLERANCE && mousePos.x <= x + width + HIT_TOLERANCE &&
                            mousePos.y >= y - HIT_TOLERANCE && mousePos.y <= y + height + HIT_TOLERANCE;
        const isNearTop = mousePos.y >= y - HIT_TOLERANCE && mousePos.y <= y + strokeWidth + HIT_TOLERANCE &&
                          mousePos.x >= x - HIT_TOLERANCE && mousePos.x <= x + width + HIT_TOLERANCE;
        const isNearBottom = mousePos.y >= y + height - strokeWidth - HIT_TOLERANCE && mousePos.y <= y + height + HIT_TOLERANCE &&
                             mousePos.x >= x - HIT_TOLERANCE && mousePos.x <= x + width + HIT_TOLERANCE;

        return isNearLeft || isNearRight || isNearTop || isNearBottom;
    }
    
    if (shapeType === 'circle') {
        // Treat as ellipse for hit detection; when width != height this still works
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const rx = Math.max(1, width / 2);
        const ry = Math.max(1, height / 2);
        const dx = mousePos.x - centerX;
        const dy = mousePos.y - centerY;
        // Normalize to unit circle and compute radial distance
        const d = Math.hypot(dx / rx, dy / ry);
        // Convert pixel tolerance to normalized tolerance using the smaller radius as scale
        const pixelTolerance = (strokeWidth || 2) + HIT_TOLERANCE;
        const tolNorm = pixelTolerance / Math.min(rx, ry);
        return d >= 1 - tolNorm && d <= 1 + tolNorm;
    }

    // For 'star' or other non-simple shapes that are stroked,
    // a basic bounding box check will be used as a fallback if specific outline hit detection isn't implemented.
    // However, for consistency with 'fill' shapes, this should ideally be more precise.
    // For now, if fillType is outline, we return false if not explicitly handled.
    return false;
  }, [getElementRect]);

  const handleMouseDown = useCallback((e) => {
    const mousePos = getMousePosOnCanvas(e);
    if (!mousePos) return;
    
    // Sync modifier key states with actual event state (prevents stuck keys)
    setShiftPressed(e.shiftKey);
    setAltPressed(e.altKey);
    
    const isCtrlHeld = e.ctrlKey || e.metaKey || localCtrlPressed;
    let foundInteraction = false;
    let newInteractionState = { type: 'none' };
    let elementToSelectId = null;

    // Check if clicking on background image first (before elements)
    if (isPointInBackgroundImage(mousePos) && setBackgroundImageX && setBackgroundImageY) {
      if (allowBackgroundDragging) {
        // Dragging is allowed - proceed normally
        newInteractionState = {
          type: 'dragBackgroundImage',
          startMouse: mousePos,
          startBackgroundX: backgroundImageX,
          startBackgroundY: backgroundImageY
        };
        setInteractionState(newInteractionState);
        setSelectedElementIds([]); // Deselect all elements
        setInteractionStarted(true); // Mark that an interaction started
        onInteractionStart(); // Save history before dragging
        // Reset attempts when successfully dragging
        if (setBackgroundDragAttempts) {
          setBackgroundDragAttempts(0);
        }
        return; // Exit early, don't check elements
      } else {
        // Dragging not allowed - track attempts
        if (setBackgroundDragAttempts && showNotification) {
          const newAttempts = backgroundDragAttempts + 1;
          setBackgroundDragAttempts(newAttempts);
          
          if (newAttempts >= 3) {
            showNotification('Trying to move the background? It works only when background panel is open', 'info');
            setBackgroundDragAttempts(0); // Reset after showing warning
          }
        }
      }
    }

    // Iterate backwards to check top layers first
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        const rect = getElementRect(element);
        
        // Skip locked elements
        if (element.locked) continue;
        
        // 1. Check resize handles first (but only if single element selected and not text)
        if (selectedElementIds.length === 1 && element.type !== 'text' && rect && selectedElementIds.includes(element.id)) {
            const handles = getHandles(rect);
            for (const [key, handle] of Object.entries(handles)) {
                if (Math.hypot(handle.x - mousePos.x, handle.y - mousePos.y) < HANDLE_SIZE) {
                    newInteractionState = { type: 'resize', elementId: element.id, handle: key, startMouse: mousePos, startRect: rect };
                    elementToSelectId = element.id;
                    foundInteraction = true;
                    break;
                }
            }
        }
        if (foundInteraction) break;

        // 2. Then check for drag/select
        let hit = false;
        if (element.type === 'shape' && element.fillType === 'outline') {
            hit = isPointInOutline(mousePos, element);
        } else if (element.type === 'shape' && element.shapeType === 'line') {
            hit = isPointInOutline(mousePos, element); // Use outline check for lines
        } else { // For filled shapes, images, logos, text - check if click is within the bounding box
            if (rect && mousePos.x > rect.x && mousePos.x < rect.x + rect.width &&
                mousePos.y > rect.y && mousePos.y < rect.y + rect.height) {
                hit = true;
            }
        }

        if (hit) {
            // If element is in a group, always select and drag the entire group
            if (element.groupId) {
              // Get all elements in this group
              const groupElementIds = elements.filter(el => el.groupId === element.groupId).map(el => el.id);
              newInteractionState = { 
                type: 'drag', 
                elementIds: groupElementIds, 
                startMouse: mousePos, 
                startPositions: groupElementIds.reduce((acc, id) => {
                  const el = elements.find(e => e.id === id);
                  if (el) acc[id] = { x: el.x, y: el.y };
                  return acc;
                }, {})
              };
              // Set to select all group members (will be handled below)
              elementToSelectId = groupElementIds; // Pass array instead of single ID
              foundInteraction = true;
            }
            // If clicking on an already selected element and there are multiple selections, drag all selected elements
            else if (selectedElementIds.includes(element.id) && selectedElementIds.length > 1) {
              // Drag all selected elements together
              newInteractionState = { 
                type: 'drag', 
                elementIds: selectedElementIds, 
                startMouse: mousePos, 
                startPositions: selectedElementIds.reduce((acc, id) => {
                  const el = elements.find(e => e.id === id);
                  if (el) acc[id] = { x: el.x, y: el.y };
                  return acc;
                }, {})
              };
              elementToSelectId = element.id;
              foundInteraction = true;
            } else {
              // Single element drag
              newInteractionState = { type: 'drag', elementId: element.id, startMouse: mousePos, startPos: { x: element.x, y: element.y } };
              elementToSelectId = element.id;
              foundInteraction = true;
            }
            break;
        }
    }
    
    setInteractionState(newInteractionState);
    if (foundInteraction) {
      // Only save history if we're starting a drag or resize operation
      if (newInteractionState.type === 'drag' || newInteractionState.type === 'resize') {
        setInteractionStarted(true); // Mark that an interaction started
        onInteractionStart(); // Save history before interaction
      }
      
      // Multi-select with Ctrl
      if (isCtrlHeld) {
        setSelectedElementIds(prev => {
          // Handle group selection (elementToSelectId is an array)
          if (Array.isArray(elementToSelectId)) {
            // For grouped elements, toggle the entire group
            const allSelected = elementToSelectId.every(id => prev.includes(id));
            if (allSelected) {
              // Deselect all group members
              return prev.filter(id => !elementToSelectId.includes(id));
            } else {
              // Add all group members
              return [...prev, ...elementToSelectId.filter(id => !prev.includes(id))];
            }
          } else {
            // Single element
            if (prev.includes(elementToSelectId)) {
              // Deselect if already selected
              return prev.filter(id => id !== elementToSelectId);
            } else {
              // Add to selection
              return [...prev, elementToSelectId];
            }
          }
        });
      } else {
        // Single select (replace selection)
        if (Array.isArray(elementToSelectId)) {
          // Select all group members
          setSelectedElementIds(elementToSelectId);
          // Trigger panel switch callback for first element
          if (onElementSelect && elementToSelectId[0]) {
            onElementSelect(elementToSelectId[0]);
          }
        } else {
          setSelectedElementIds([elementToSelectId]);
          // Trigger panel switch callback
          if (onElementSelect && elementToSelectId) {
            onElementSelect(elementToSelectId);
          }
        }
      }
    } else {
      // Clicked on empty space - start selection box (unless Ctrl is held)
      if (!isCtrlHeld) {
        setSelectedElementIds([]);
        // Start selection box
        newInteractionState = { type: 'selecting', startMouse: mousePos };
        setInteractionState(newInteractionState);
        setSelectionBox({ startX: mousePos.x, startY: mousePos.y, endX: mousePos.x, endY: mousePos.y });
      } else {
        setSelectedElementIds([]);
      }
    }
  }, [getMousePosOnCanvas, elements, getElementRect, getHandles, onInteractionStart, setSelectedElementIds, isPointInOutline, selectedElementIds, localCtrlPressed, isPointInBackgroundImage, setBackgroundImageX, setBackgroundImageY, backgroundImageX, backgroundImageY, onElementSelect, allowBackgroundDragging, setBackgroundDragAttempts, backgroundDragAttempts, showNotification]);

  const handleMouseMove = useCallback((e) => {
    const mousePos = getMousePosOnCanvas(e);
    if (!mousePos) return;

    if (interactionState.type === 'none') {
        let cursor = 'default';
        
        // Check if hovering over background image first - only show move cursor if dragging is allowed
        if (allowBackgroundDragging && isPointInBackgroundImage(mousePos)) {
          cursor = 'move';
        } else {
          // Then check elements
          for (let i = elements.length - 1; i >= 0; i--) {
              const element = elements[i];
              const rect = getElementRect(element);
              if (!rect) continue;
              
              // Only check for resize handle cursors on non-text elements
              // AND only for the currently selected element (single selection only)
              if (element.type !== 'text' && selectedElementIds.length === 1 && selectedElementIds.includes(element.id)) {
                  const handles = getHandles(rect);
                  // Correctly iterate over handle objects, not [key, value] pairs
                  for (const handle of Object.values(handles)) {
                      if (Math.hypot(handle.x - mousePos.x, handle.y - mousePos.y) < HANDLE_SIZE) {
                          cursor = handle.cursor;
                          break;
                      }
                  }
              }
              if (cursor !== 'default') break;

              let hit = false;
              if (element.type === 'shape' && element.fillType === 'outline') {
                  hit = isPointInOutline(mousePos, element);
              } else if (element.type === 'shape' && element.shapeType === 'line') {
                  hit = isPointInOutline(mousePos, element);
              } else {
                  hit = rect && mousePos.x > rect.x && mousePos.x < rect.x + rect.width &&
                        mousePos.y > rect.y && mousePos.y < rect.y + rect.height;
              }

              if (hit) {
                  cursor = 'move';
                  break;
              }
          }
        }
        if(canvasRef.current) canvasRef.current.style.cursor = cursor;
        return;
    }

    const { type, elementId, elementIds, startMouse, startPos, startPositions, handle, startRect, startBackgroundX, startBackgroundY } = interactionState;
    
    if (type === 'dragBackgroundImage') {
      // Handle background image dragging
      const deltaX = mousePos.x - startMouse.x;
      const deltaY = mousePos.y - startMouse.y;
      
      if (setBackgroundImageX && setBackgroundImageY) {
        setBackgroundImageX(startBackgroundX + deltaX);
        setBackgroundImageY(startBackgroundY + deltaY);
      }
      return;
    }
    
    if (type === 'selecting') {
      // Update selection box
      setSelectionBox({
        startX: startMouse.x,
        startY: startMouse.y,
        endX: mousePos.x,
        endY: mousePos.y
      });
      return;
    }
    
    if (type === 'drag') {
      // Handle group dragging (multiple elements)
      if (elementIds && startPositions) {
        const deltaX = mousePos.x - startMouse.x;
        const deltaY = mousePos.y - startMouse.y;
        
        // Update all elements in the group
        elementIds.forEach(id => {
          const startPosition = startPositions[id];
          if (startPosition) {
            updateElement(id, { 
              x: startPosition.x + deltaX, 
              y: startPosition.y + deltaY 
            });
          }
        });
        setSnapLines({ horizontal: false, vertical: false, elementSnap: [] });
      } else {
        // Single element drag
        const element = elements.find(el => el.id === elementId);
        if (!element) return;
        
        let currentX = startPos.x + (mousePos.x - startMouse.x);
        let currentY = startPos.y + (mousePos.y - startMouse.y);

        let isSnappedV = false;
        let isSnappedH = false;
        const elementSnapLines = [];

        const elementAtCurrentPos = { ...element, x: currentX, y: currentY };
        const currentRect = getElementRect(elementAtCurrentPos);

        if (currentRect) {
          // Canvas edge snapping
          if (Math.abs(currentRect.x) < SNAP_THRESHOLD) {
              currentX -= currentRect.x;
          }
          if (Math.abs(currentRect.x + currentRect.width - canvasWidth) < SNAP_THRESHOLD) {
              currentX -= (currentRect.x + currentRect.width - canvasWidth);
          }
          if (Math.abs(currentRect.y) < SNAP_THRESHOLD) {
              currentY -= currentRect.y;
          }
          if (Math.abs(currentRect.y + currentRect.height - canvasHeight) < SNAP_THRESHOLD) {
              currentY -= (currentRect.y + currentRect.height - canvasHeight);
          }

          // Canvas center snapping
          const elementCenterX = currentRect.x + currentRect.width / 2;
          const elementCenterY = currentRect.y + currentRect.height / 2;
          const canvasCenterX = canvasWidth / 2;
          const canvasCenterY = canvasHeight / 2;

          if (Math.abs(elementCenterX - canvasCenterX) < SNAP_THRESHOLD) {
            currentX -= (elementCenterX - canvasCenterX);
            isSnappedH = true;
          }
          if (Math.abs(elementCenterY - canvasCenterY) < SNAP_THRESHOLD) {
            currentY -= (elementCenterY - canvasCenterY);
            isSnappedV = true;
          }

          // Element-to-element snapping
          const ELEMENT_SNAP_THRESHOLD = 10;
          elements.forEach(otherElement => {
            if (otherElement.id === elementId || otherElement.locked) return;
            
            const otherRect = getElementRect(otherElement);
            if (!otherRect) return;

            // Recalculate current rect with adjusted position
            const adjustedElement = { ...element, x: currentX, y: currentY };
            const adjustedRect = getElementRect(adjustedElement);
            if (!adjustedRect) return;

            // Left edge alignment
            if (Math.abs(adjustedRect.x - otherRect.x) < ELEMENT_SNAP_THRESHOLD) {
              currentX -= (adjustedRect.x - otherRect.x);
              elementSnapLines.push({ type: 'left', position: otherRect.x });
            }
            // Right edge alignment
            if (Math.abs((adjustedRect.x + adjustedRect.width) - (otherRect.x + otherRect.width)) < ELEMENT_SNAP_THRESHOLD) {
              currentX -= ((adjustedRect.x + adjustedRect.width) - (otherRect.x + otherRect.width));
              elementSnapLines.push({ type: 'right', position: otherRect.x + otherRect.width });
            }
            // Top edge alignment
            if (Math.abs(adjustedRect.y - otherRect.y) < ELEMENT_SNAP_THRESHOLD) {
              currentY -= (adjustedRect.y - otherRect.y);
              elementSnapLines.push({ type: 'top', position: otherRect.y });
            }
            // Bottom edge alignment
            if (Math.abs((adjustedRect.y + adjustedRect.height) - (otherRect.y + otherRect.height)) < ELEMENT_SNAP_THRESHOLD) {
              currentY -= ((adjustedRect.y + adjustedRect.height) - (otherRect.y + otherRect.height));
              elementSnapLines.push({ type: 'bottom', position: otherRect.y + otherRect.height });
            }
          });
        }
        setSnapLines({ horizontal: isSnappedV, vertical: isSnappedH, elementSnap: elementSnapLines });
        updateElement(elementId, { x: currentX, y: currentY });
      }

    } else if (type === 'resize') {
        const element = elements.find(el => el.id === elementId);
        if (!element || element.type === 'text') {
            return; 
        }

        // Fixed corner/edge positions - the opposite side stays fixed
        const fixedCorner = {
            // Corner handles
            tl: { x: startRect.x + startRect.width, y: startRect.y + startRect.height }, // br stays fixed when dragging tl
            tr: { x: startRect.x, y: startRect.y + startRect.height }, // bl stays fixed when dragging tr
            bl: { x: startRect.x + startRect.width, y: startRect.y }, // tr stays fixed when dragging bl
            br: { x: startRect.x, y: startRect.y }, // tl stays fixed when dragging br
            // Side handles
            t: { x: startRect.x + startRect.width / 2, y: startRect.y + startRect.height }, // bottom edge stays fixed
            b: { x: startRect.x + startRect.width / 2, y: startRect.y }, // top edge stays fixed
            l: { x: startRect.x + startRect.width, y: startRect.y + startRect.height / 2 }, // right edge stays fixed
            r: { x: startRect.x, y: startRect.y + startRect.height / 2 } // left edge stays fixed
        }[handle];
        
        // Calculate new dimensions based on handle type
        let newWidth, newHeight, newRectX, newRectY;
        
        if (handle === 't' || handle === 'b') {
            // Top or bottom handle - only change height
            newWidth = startRect.width;
            newHeight = Math.max(10, Math.abs(mousePos.y - fixedCorner.y));
            newRectX = startRect.x;
            newRectY = Math.min(mousePos.y, fixedCorner.y);
        } else if (handle === 'l' || handle === 'r') {
            // Left or right handle - only change width
            newWidth = Math.max(10, Math.abs(mousePos.x - fixedCorner.x));
            newHeight = startRect.height;
            newRectX = Math.min(mousePos.x, fixedCorner.x);
            newRectY = startRect.y;
        } else {
            // Corner handles - change both dimensions
            newWidth = Math.max(10, Math.abs(mousePos.x - fixedCorner.x));
            newHeight = Math.max(10, Math.abs(mousePos.y - fixedCorner.y));
            newRectX = Math.min(mousePos.x, fixedCorner.x);
            newRectY = Math.min(mousePos.y, fixedCorner.y);
        }
        
        let updatedProps = {};

        if (element.type === 'image' || element.type === 'logo') {
            // Determine the source dimensions before scaling for aspect ratio calculation
            const isImage = element.type === 'image';
            const imgNaturalWidth = element.naturalWidth || 1;
            const imgNaturalHeight = element.naturalHeight || 1;

            let sWidth, sHeight;
            if (isImage && element.crop) {
                sWidth = element.crop.width;
                sHeight = element.crop.height;
            } else {
                sWidth = imgNaturalWidth;
                sHeight = imgNaturalHeight;
            }
            sWidth = Math.max(1, sWidth);
            sHeight = Math.max(1, sHeight);
            
            const originalAspectRatio = sWidth / sHeight;

            // Work exactly like rectangles: free resize by default, proportional when Shift is held
            if (shiftPressed) {
                // Shift held: maintain aspect ratio (same logic as rectangles)
                const aspectRatio = startRect.width / startRect.height;
                
                if (newWidth / newHeight > aspectRatio) {
                    newWidth = newHeight * aspectRatio;
                } else {
                    newHeight = newWidth / aspectRatio;
                }
                
                // Recalculate rect position with constrained dimensions, keeping fixedCorner truly fixed
                // This handles ALL handles (corners and sides) when shift is pressed
                if (handle === 'tl') {
                    newRectX = fixedCorner.x - newWidth;
                    newRectY = fixedCorner.y - newHeight;
                } else if (handle === 'tr') {
                    newRectX = fixedCorner.x;
                    newRectY = fixedCorner.y - newHeight;
                } else if (handle === 'bl') {
                    newRectX = fixedCorner.x - newWidth;
                    newRectY = fixedCorner.y;
                } else if (handle === 'br') {
                    newRectX = fixedCorner.x;
                    newRectY = fixedCorner.y;
                } else if (handle === 't') {
                    // Top handle with shift: width changes, need to recenter horizontally
                    newRectX = fixedCorner.x - newWidth / 2;
                    newRectY = fixedCorner.y - newHeight;
                } else if (handle === 'b') {
                    // Bottom handle with shift: width changes, need to recenter horizontally
                    newRectX = fixedCorner.x - newWidth / 2;
                    newRectY = fixedCorner.y;
                } else if (handle === 'l') {
                    // Left handle with shift: height changes, need to recenter vertically
                    newRectX = fixedCorner.x - newWidth;
                    newRectY = fixedCorner.y - newHeight / 2;
                } else if (handle === 'r') {
                    // Right handle with shift: height changes, need to recenter vertically
                    newRectX = fixedCorner.x;
                    newRectY = fixedCorner.y - newHeight / 2;
                }
            }
            // Without Shift: free resize (newWidth/newHeight already calculated based on handle type)
            
            // Use separate scaleX and scaleY for independent width/height scaling
            const newScaleX = newWidth / sWidth;
            const newScaleY = newHeight / sHeight;
            
            updatedProps = {
                scaleX: newScaleX,
                scaleY: newScaleY,
                x: newRectX + newWidth / 2,  // Center point
                y: newRectY + newHeight / 2  // Center point
            };

        } else if (element.type === 'shape') {
            if (shiftPressed && element.shapeType !== 'line') { // Lines are one-dimensional and handled separately
                const aspectRatio = startRect.width / startRect.height;
                // Apply aspect ratio
                if (newWidth / newHeight > aspectRatio) {
                    newWidth = newHeight * aspectRatio;
                } else {
                    newHeight = newWidth / aspectRatio;
                }
                
                // Recalculate rect position with constrained dimensions, keeping fixedCorner truly fixed
                if (handle === 'tl') {
                    newRectX = fixedCorner.x - newWidth;
                    newRectY = fixedCorner.y - newHeight;
                } else if (handle === 'tr') {
                    newRectX = fixedCorner.x;
                    newRectY = fixedCorner.y - newHeight;
                } else if (handle === 'bl') {
                    newRectX = fixedCorner.x - newWidth;
                    newRectY = fixedCorner.y;
                } else if (handle === 'br') {
                    newRectX = fixedCorner.x;
                    newRectY = fixedCorner.y;
                }
            }

            if (element.shapeType === 'circle') {
                // Allow ellipse when not holding Shift; lock to circle when Shift is held
                let w = newWidth;
                let h = newHeight;
                if (shiftPressed) {
                    const size = Math.max(newWidth, newHeight);
                    w = size;
                    h = size;
                    // Recalculate rect position with constrained dimensions, keeping fixed corner fixed
                    if (handle === 'tl') {
                        newRectX = fixedCorner.x - w;
                        newRectY = fixedCorner.y - h;
                    } else if (handle === 'tr') {
                        newRectX = fixedCorner.x;
                        newRectY = fixedCorner.y - h;
                    } else if (handle === 'bl') {
                        newRectX = fixedCorner.x - w;
                        newRectY = fixedCorner.y;
                    } else if (handle === 'br') {
                        newRectX = fixedCorner.x;
                        newRectY = fixedCorner.y;
                    }
                }
                updatedProps = { 
                    width: w, 
                    height: h, 
                    x: newRectX, // For shapes, x,y are top-left
                    y: newRectY 
                };
            } else if (element.shapeType === 'line') {
                if (shiftPressed) {
                    // Symmetrical resize for lines: expand from center
                    const dx = mousePos.x - startMouse.x;
                    const newWidthVal = Math.max(10, startRect.width + Math.abs(dx) * 2);
                    const newXVal = startRect.x - Math.abs(dx);
                    updatedProps = { width: newWidthVal, x: newXVal };
                } else {
                    // Standard line resize: width changes and x,y based on newRectX,Y
                    updatedProps = { width: newWidth, x: newRectX, y: newRectY };
                }
            } else { // rectangle or star
                if (altPressed && element.shapeType === 'rectangle') {
                    // Alt key: scale from center (both directions)
                    const centerX = startRect.x + startRect.width / 2;
                    const centerY = startRect.y + startRect.height / 2;
                    
                    // Calculate scale factor based on mouse movement
                    const dx = mousePos.x - startMouse.x;
                    const dy = mousePos.y - startMouse.y;
                    const avgDelta = (Math.abs(dx) + Math.abs(dy)) / 2;
                    const scaleFactor = 1 + (avgDelta / Math.max(startRect.width, startRect.height));
                    
                    const newW = Math.max(10, startRect.width * scaleFactor);
                    const newH = Math.max(10, startRect.height * scaleFactor);
                    
                    updatedProps = {
                        width: newW,
                        height: newH,
                        x: centerX - newW / 2,
                        y: centerY - newH / 2
                    };
                } else {
                    updatedProps = { 
                        width: newWidth, 
                        height: newHeight, 
                        x: newRectX, 
                        y: newRectY 
                    };
                }
            }
        }
        updateElement(elementId, updatedProps);
        setSnapLines({ horizontal: false, vertical: false, elementSnap: [] }); // Resize doesn't have center snapping guidelines
    }
  }, [interactionState, getMousePosOnCanvas, elements, updateElement, getElementRect, getHandles, shiftPressed, altPressed, isPointInOutline, canvasWidth, canvasHeight, setSnapLines, selectedElementIds, isPointInBackgroundImage, setBackgroundImageX, setBackgroundImageY, allowBackgroundDragging]);

  const handleMouseUp = useCallback(() => {
    // If we were selecting, find all elements in the selection box
    if (interactionState.type === 'selecting' && selectionBox) {
      const { startX, startY, endX, endY } = selectionBox;
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      // Find all elements whose bounding boxes intersect with the selection box
      const selectedIds = elements
        .filter(el => {
          const rect = getElementRect(el);
          if (!rect) return false;
          
          // Check if element rect intersects with selection box
          return !(
            rect.x + rect.width < minX ||
            rect.x > maxX ||
            rect.y + rect.height < minY ||
            rect.y > maxY
          );
        })
        .map(el => el.id);
      
      setSelectedElementIds(selectedIds);
      setSelectionBox(null);
    }
    
    setInteractionState({ type: 'none' });
    setSnapLines({ horizontal: false, vertical: false, elementSnap: [] }); // Reset snap lines on mouse up
    setInteractionStarted(false); // Reset interaction flag
  }, [interactionState, selectionBox, elements, getElementRect, setSelectedElementIds]);

  // Context menu handler
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const mousePos = getMousePosOnCanvas(e);
    if (!mousePos) return;

    // Find if we right-clicked on an element
    let clickedElementId = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      const rect = getElementRect(element);
      if (!rect) continue;

      let hit = false;
      if (element.type === 'text') {
        hit = mousePos.x >= rect.x && mousePos.x <= rect.x + rect.width &&
              mousePos.y >= rect.y && mousePos.y <= rect.y + rect.height;
      } else if (element.type === 'image' || element.type === 'logo') {
        hit = mousePos.x >= rect.x && mousePos.x <= rect.x + rect.width &&
              mousePos.y >= rect.y && mousePos.y <= rect.y + rect.height;
      } else if (element.type === 'shape') {
        if (element.fillType === 'outline') {
          hit = isPointInOutline(mousePos, element);
        } else {
          hit = mousePos.x >= rect.x && mousePos.x <= rect.x + rect.width &&
                mousePos.y >= rect.y && mousePos.y <= rect.y + rect.height;
        }
      }

      if (hit) {
        clickedElementId = element.id;
        break;
      }
    }

    // Show context menu
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId: clickedElementId
    });
  }, [elements, getElementRect, getMousePosOnCanvas, isPointInOutline]);

  // Context menu actions
  const handleCopyElement = useCallback(() => {
    if (contextMenu?.elementId) {
      const element = elements.find(el => el.id === contextMenu.elementId);
      if (element) {
        setCopiedElement({ ...element });
        if (showNotification) {
          showNotification('Element Copied', 'success');
        }
      }
    }
    setContextMenu(null);
  }, [contextMenu, elements, showNotification]);

  const handlePasteElement = useCallback(() => {
    if (copiedElement && contextMenu) {
      const newElement = {
        ...copiedElement,
        id: Date.now(),
        x: copiedElement.x + 20, // Offset slightly
        y: copiedElement.y + 20
      };
      setElements(prev => [...prev, newElement]);
      onInteractionStart();
    }
    setContextMenu(null);
  }, [copiedElement, contextMenu, setElements, onInteractionStart]);

  const handleLockElement = useCallback(() => {
    if (contextMenu?.elementId) {
      updateElement(contextMenu.elementId, { locked: true });
      onInteractionStart();
    }
    setContextMenu(null);
  }, [contextMenu, updateElement, onInteractionStart]);

  const handleUnlockElement = useCallback(() => {
    if (contextMenu?.elementId) {
      updateElement(contextMenu.elementId, { locked: false });
      onInteractionStart();
    }
    setContextMenu(null);
  }, [contextMenu, updateElement, onInteractionStart]);

  const handleSendToBack = useCallback(() => {
    if (contextMenu?.elementId) {
      setElements(prev => {
        const elementIndex = prev.findIndex(el => el.id === contextMenu.elementId);
        if (elementIndex === -1) return prev;
        const element = prev[elementIndex];
        const newElements = prev.filter((_, i) => i !== elementIndex);
        return [element, ...newElements]; // Put at beginning (back)
      });
      onInteractionStart();
    }
    setContextMenu(null);
  }, [contextMenu, setElements, onInteractionStart]);

  const handleBringToFront = useCallback(() => {
    if (contextMenu?.elementId) {
      setElements(prev => {
        const elementIndex = prev.findIndex(el => el.id === contextMenu.elementId);
        if (elementIndex === -1) return prev;
        const element = prev[elementIndex];
        const newElements = prev.filter((_, i) => i !== elementIndex);
        return [...newElements, element]; // Put at end (front)
      });
      onInteractionStart();
    }
    setContextMenu(null);
  }, [contextMenu, setElements, onInteractionStart]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (interactionState.type !== 'none') {
        document.body.classList.add('is-dragging-on-canvas');
    } else {
        document.body.classList.remove('is-dragging-on-canvas');
    }
    const mouseMoveHandler = (e) => handleMouseMove(e);
    const mouseUpHandler = (e) => handleMouseUp(e);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.body.classList.remove('is-dragging-on-canvas');
    };
  }, [handleMouseMove, handleMouseUp, interactionState.type]);

  const applyCustomSize = useCallback(() => {
    const width = parseInt(customWidth, 10);
    const height = parseInt(customHeight, 10);

    if (!isNaN(width) && !isNaN(height) &&
        width >= 100 && width <= 5000 &&
        height >= 100 && height <= 5000) {
      if (width !== canvasWidth || height !== canvasHeight) {
        onCanvasSizeChange({ width, height });
      }
      setShowBottomCanvasSizePanel(false);
    }
  }, [customWidth, customHeight, onCanvasSizeChange, canvasWidth, canvasHeight]);

  // Handle double-click for text selection (no popup, just select the element)
  const handleDoubleClick = useCallback((e) => {
    const mousePos = getMousePosOnCanvas(e);
    if (!mousePos) return;

    // Find if we double-clicked on a text element
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element.type !== 'text') continue;
      if (element.locked) continue;

      const rect = getElementRect(element);
      if (!rect) continue;

      if (mousePos.x >= rect.x && mousePos.x <= rect.x + rect.width &&
          mousePos.y >= rect.y && mousePos.y <= rect.y + rect.height) {
        // Just select the text element - editing happens in the panel
        setSelectedElementIds([element.id]);
        if (onElementSelect) {
          onElementSelect(element.id);
        }
        return;
      }
    }
  }, [elements, getElementRect, getMousePosOnCanvas, onElementSelect]);

  const handleCanvasSizePreset = useCallback((mode) => {
    setCanvasSizeMode(mode);
    
    if (mode === '16:9') {
      const newWidth = 1600;
      const newHeight = 900;
      setCustomWidth(newWidth.toString());
      setCustomHeight(newHeight.toString());
      onCanvasSizeChange({ width: newWidth, height: newHeight });
      setShowBottomCanvasSizePanel(false);
    } else if (mode === '1:1') {
      const newSize = 1500;
      setCustomWidth(newSize.toString());
      setCustomHeight(newSize.toString());
      onCanvasSizeChange({ width: newSize, height: newSize });
      setShowBottomCanvasSizePanel(false);
    }
    // For custom mode, don't auto-apply - let user input values and click apply
  }, [onCanvasSizeChange]);

  const handleCustomSizeChange = useCallback((dimension, value) => {
    if (dimension === 'width') {
      setCustomWidth(value);
    } else {
      setCustomHeight(value);
    }
  }, []);

  // Add handler for Enter key on inputs
  const handleCustomSizeKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      applyCustomSize();
    }
  }, [applyCustomSize]);

  return (
    <div className="w-full">
      <style>{`.is-dragging-on-canvas * { cursor: grabbing !important; }`}</style>
      

      {/* Canvas Container */}
      <div className="mx-16 relative rounded-xl overflow-hidden border border-white/20 bg-black/20" style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }} data-tour="canvas">
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="w-full h-full object-contain" onMouseDown={handleMouseDown} onContextMenu={handleContextMenu} onDoubleClick={handleDoubleClick}/>
        
        {!fontsLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white/80 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full mx-auto mb-2"></div>
              <p>Loading fonts...</p>
            </div>
          </div>
        )}
        
        {(isDownloading || isSaving || isSavingTemplate) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="text-white/90 text-center bg-black/50 rounded-lg p-4">
              <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full mx-auto mb-2"></div>
              <p className="font-medium">
                {isSavingTemplate ? 'Saving Template...' : 
                 isSaving ? 'Saving to Gallery...' : 
                 'Preparing Download...'}
              </p>
              <p className="text-sm text-white/70 mt-1">This may take a moment</p>
            </div>
          </div>
        )}

        {/* This is where a CropOverlay might be rendered, based on `isCropping` prop */}
        {/* Example:
        {isCropping && selectedElementId && (
          <CropOverlay 
            element={elements.find(el => el.id === selectedElementId)}
            updateElement={updateElement}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
        )}
        */}
      </div>

      {/* Canvas Footer */}
      <div className="flex items-center justify-between mt-3 px-16 text-white/80"> {/* Added px-16 for horizontal alignment */}
        <div className="flex items-center gap-3">
          {adminSettings?.generalControls?.resetEnabled !== false && onCanvasReset && (
            <Button onClick={onCanvasReset} size="sm" className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm border-0" title="Reset Canvas">
              <RotateCw className="w-4 h-4" />
            </Button>
          )}
          {adminSettings?.generalControls?.undoEnabled !== false && onUndo && (
            <Button onClick={onUndo} disabled={!canUndo} size="sm" className="text-white hover:bg-white/20 disabled:opacity-50 bg-white/10 backdrop-blur-sm border-0" title="Undo (Ctrl+Z)">
              <Undo2 className="w-4 h-4" />
            </Button>
          )}
          {adminSettings?.generalControls?.undoEnabled !== false && onRedo && (
            <Button onClick={onRedo} disabled={!canRedo} size="sm" className="text-white hover:bg-white/20 disabled:opacity-50 bg-white/10 backdrop-blur-sm border-0" title="Redo (Ctrl+Shift+Z)">
              <Redo2 className="w-4 h-4" />
            </Button>
          )}
          
          {/* Invisible divider for spacing after Redo */}
          {(adminSettings?.generalControls?.undoEnabled !== false && (onUndo || onRedo)) && (
            <div className="h-6 w-px bg-transparent mx-1"></div>
          )}
          
          {/* Show Save as Template button only if admin */}
          {isAdmin && onSaveTemplate && (
            <Button
              onClick={() => {
                const name = prompt("Enter a name for this template:");
                if (name) {
                  onSaveTemplate(name);
                }
              }}
              disabled={isSavingTemplate}
              size="sm"
              className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm border-0"
              title={isSavingTemplate ? "Saving Template..." : "Save as Template"}
            >
              <Save className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Removed: Save to Gallery, Save as Template, and Download buttons */}
          {(!presetRestrictions?.canvasControls?.lockCanvasSize && !adminSettings?.canvasControls?.lockCanvasSize) && (
            <Popover open={showBottomCanvasSizePanel} onOpenChange={setShowBottomCanvasSizePanel}>
              <PopoverTrigger asChild>
                <Button size="sm" className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm border-0" title="Canvas Size">
                  <Expand className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-64 glass-panel border border-white/20 backdrop-blur-xl bg-black/50 p-4"
                align="end"
              >
                <div className="space-y-4">
                  <Label className="text-white/80 font-semibold">Canvas Size</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={canvasSizeMode === '16:9' ? 'default' : 'outline'}
                      onClick={() => handleCanvasSizePreset('16:9')}
                      className="flex-1 text-xs h-8"
                    >
                      16:9
                    </Button>
                    <Button
                      variant={canvasSizeMode === '1:1' ? 'default' : 'outline'}
                      onClick={() => handleCanvasSizePreset('1:1')}
                      className="flex-1 text-xs h-8"
                    >
                      1:1
                    </Button>
                    <Button
                      variant={canvasSizeMode === 'custom' ? 'default' : 'outline'}
                      onClick={() => handleCanvasSizePreset('custom')}
                      className="flex-1 text-xs h-8"
                    >
                      Custom
                    </Button>
                  </div>
                  
                  {canvasSizeMode === 'custom' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-white/70 text-xs">Width</Label>
                          <Input
                            type="number"
                            placeholder="Width"
                            value={customWidth}
                            onChange={(e) => handleCustomSizeChange('width', e.target.value)}
                            onKeyDown={handleCustomSizeKeyDown}
                            className="bg-white/10 border-white/20 text-white text-xs h-8 mt-1"
                            min="100"
                            max="5000"
                          />
                        </div>
                        <div>
                          <Label className="text-white/70 text-xs">Height</Label>
                          <Input
                            type="number"
                            placeholder="Height"
                            value={customHeight}
                            onChange={(e) => handleCustomSizeChange('height', e.target.value)}
                            onKeyDown={handleCustomSizeKeyDown}
                            className="bg-white/10 border-white/20 text-white text-xs h-8 mt-1"
                            min="100"
                            max="5000"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={applyCustomSize}
                        className="w-full h-8 text-xs"
                      >
                        Apply Size
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl py-1 z-[9999] min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.elementId ? (
            <>
              {/* Element-specific options */}
              <button
                onClick={handleCopyElement}
                className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
              >
                <span>Copy Element</span>
              </button>
              
              {elements.find(el => el.id === contextMenu.elementId)?.locked ? (
                <button
                  onClick={handleUnlockElement}
                  className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
                >
                  <span>🔓 Unlock Element</span>
                </button>
              ) : (
                <button
                  onClick={handleLockElement}
                  className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
                >
                  <span>🔒 Lock Element</span>
                </button>
              )}
              
              <div className="h-px bg-white/10 my-1"></div>
              
              <button
                onClick={handleSendToBack}
                className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
              >
                <span>Send to Back</span>
              </button>
              
              <button
                onClick={handleBringToFront}
                className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
              >
                <span>Bring to Front</span>
              </button>
              
              <div className="h-px bg-white/10 my-1"></div>
              
              {/* Group/Ungroup options */}
              {selectedElementIds.length > 1 ? (
                <button
                  onClick={() => {
                    if (handleGroupElements) handleGroupElements();
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
                >
                  <span>Group Selected ({selectedElementIds.length})</span>
                </button>
              ) : (
                elements.find(el => el.id === contextMenu.elementId)?.groupId ? (
                  <button
                    onClick={() => {
                      if (handleUngroupElements) handleUngroupElements();
                      setContextMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
                  >
                    <span>Ungroup</span>
                  </button>
                ) : null
              )}
            </>
          ) : (
            <>
              {/* Canvas options - Always show all options, grey out disabled ones */}
              <button
                onClick={copiedElement ? handlePasteElement : undefined}
                disabled={!copiedElement}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                  copiedElement 
                    ? 'text-white/90 hover:bg-white/10 cursor-pointer' 
                    : 'text-white/30 cursor-not-allowed'
                }`}
              >
                <span>Paste Element</span>
              </button>
              
              <div className="h-px bg-white/10 my-1"></div>
              
              <button
                disabled={true}
                className="w-full px-4 py-2 text-left text-white/30 cursor-not-allowed text-sm flex items-center gap-2"
              >
                <span>Copy Element</span>
              </button>
              
              <button
                disabled={true}
                className="w-full px-4 py-2 text-left text-white/30 cursor-not-allowed text-sm flex items-center gap-2"
              >
                <span>🔒 Lock Element</span>
              </button>
              
              <div className="h-px bg-white/10 my-1"></div>
              
              <button
                disabled={true}
                className="w-full px-4 py-2 text-left text-white/30 cursor-not-allowed text-sm flex items-center gap-2"
              >
                <span>Send to Back</span>
              </button>
              
              <button
                disabled={true}
                className="w-full px-4 py-2 text-left text-white/30 cursor-not-allowed text-sm flex items-center gap-2"
              >
                <span>Bring to Front</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

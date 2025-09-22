
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Heart, RotateCw, Undo, Save, Expand, Undo2 } from "lucide-react"; // Added Undo2

const HANDLE_SIZE = 12;
const SNAP_THRESHOLD = 10; // Pixels for snapping

export default function CanvasPreview({
  elements, setElements,
  selectedElementId, setSelectedElementId,
  updateElement,
  canvasWidth, canvasHeight, onCanvasSizeChange,
  backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage,
  backgroundImageScale, backgroundImageX, backgroundImageY,
  backgroundImageBorderRadius, backgroundImageBorderWidth, backgroundImageBorderColor,
  overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2,
  overlayGradientAngle, showCanvasBackgroundOverlay,
  onDownload, isDownloading,
  onSave, isSaving,
  onCanvasReset,
  onUndo, canUndo,
  onInteractionStart,
  onSaveTemplate, isSavingTemplate, // Keep prop even if UI is removed in this section, might be used elsewhere
  adminSettings,
  isCropping, // New prop
}) {
  const canvasRef = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [interactionState, setInteractionState] = useState({ type: 'none' });
  const [canvasSizeMode, setCanvasSizeMode] = useState('custom'); // Changed default to 'custom'
  const [imageCache] = useState(new Map());
  const [shiftPressed, setShiftPressed] = useState(false);
  // const [templateName, setTemplateName] = useState(''); // Removed, as template save UI is removed
  const [snapLines, setSnapLines] = useState({ horizontal: false, vertical: false });
  const [showCanvasSizePanel, setShowCanvasSizePanel] = useState(false); // New state for popover visibility

  // Local state for custom input fields to avoid conflicts with global state
  const [customWidth, setCustomWidth] = useState(canvasWidth);
  const [customHeight, setCustomHeight] = useState(canvasHeight);

  // Track shift key for proportional scaling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') setShiftPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setShiftPressed(false); // Changed to false on keyup
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Effect for deleting selected element with Delete key only
  useEffect(() => {
    const handleDeleteKey = (e) => {
      // Don't delete if user is typing in an input, textarea, or content-editable field
      const activeElement = document.activeElement;
      const isTyping = activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);

      if (e.key === 'Delete' && selectedElementId && !isTyping) {
        e.preventDefault(); // Prevent any default behavior
        setElements(prevElements => prevElements.filter(el => el.id !== selectedElementId));
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleDeleteKey);
    return () => {
      window.removeEventListener('keydown', handleDeleteKey);
    };
  }, [selectedElementId, setElements, setSelectedElementId]);

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

        const scaledWidth = sWidth * element.scale;
        const scaledHeight = sHeight * element.scale; // Corrected from sHeight * sHeight
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

        let rectX = element.x;
        // Adjust rectX based on textAlign to represent the true top-left of the bounding box
        if (element.textAlign === 'center') {
          rectX = element.x - maxWidth / 2;
        } else if (element.textAlign === 'right') {
          rectX = element.x - maxWidth;
        }

        return { x: rectX, y: element.y, width: maxWidth, height: height };
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
    return {
      tl: { x: rect.x, y: rect.y, cursor: 'nwse-resize' },
      tr: { x: rect.x + rect.width, y: rect.y, cursor: 'nesw-resize' },
      bl: { x: rect.x, y: rect.y + rect.height, cursor: 'nesw-resize' },
      br: { x: rect.x + rect.width, y: rect.y + rect.height, cursor: 'nwse-resize' }
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
          
          ctx.drawImage(bgImg, backgroundImageX, backgroundImageY, scaledWidth, scaledHeight);
          
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
          ctx.drawImage(bgImg, backgroundImageX, backgroundImageY, scaledWidth, scaledHeight);
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

                const dWidth = sWidth * el.scale;
                const dHeight = sHeight * el.scale;
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
            ctx.textAlign = el.textAlign || 'left';

            const transformedText = applyTextTransform(el.content, el.transform);
            const textLines = transformedText.split('\n');
            const lineHeight = el.size * (el.lineHeight || 1.2);

            // Build gradient or solid fill
            if (el.colorType === 'gradient') {
              const rect = getElementRect(el);
              if (rect) {
                const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y);
                gradient.addColorStop(0, el.color1);
                gradient.addColorStop(1, el.color2);
                ctx.fillStyle = gradient;
              } else {
                ctx.fillStyle = el.color1;
              }
            } else {
              ctx.fillStyle = el.color1;
            }

            ctx.save();
            ctx.translate(el.x, el.y);
            if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
            // When rotated, draw relative to origin
            textLines.forEach((line, index) => {
              ctx.fillText(line, 0, index * lineHeight);
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
            
            if (colorType === 'gradient') {
                const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
                gradient.addColorStop(0, color1);
                gradient.addColorStop(1, color2);
                ctx.fillStyle = gradient;
                ctx.strokeStyle = gradient;
            } else {
                ctx.fillStyle = color1;
                ctx.strokeStyle = color1;
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

    // Draw selection box and handles for the selected element
    const selectedElement = elements.find(el => el.id === selectedElementId);
    if (selectedElement) {
      const rect = getElementRect(selectedElement);
      if (rect) {
        ctx.strokeStyle = 'rgba(76, 126, 255, 0.9)';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.setLineDash([]);
        
        // Only show handles for non-text elements
        if (selectedElement.type !== 'text') {
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
    ctx.restore();
    
    // Draw Canvas Background Overlay Text
    // Only show "Canvas Background" overlay if no background customization has been done
    if (showCanvasBackgroundOverlay && backgroundType === 'color' && backgroundColor === '#1e1b4b' && overlayOpacity === 0) {
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
    overlayGradientAngle, showCanvasBackgroundOverlay, loadImage, getElementRect, getHandles, drawRoundedRectPath, drawStarPath, selectedElementId,
    backgroundImageScale, backgroundImageX, backgroundImageY, snapLines, 
    // New dependencies for background image border/radius
    backgroundImageBorderRadius, backgroundImageBorderWidth, backgroundImageBorderColor
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
    
    let foundInteraction = false;
    let newInteractionState = { type: 'none' };
    let elementToSelectId = null;

    // Iterate backwards to check top layers first
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        const rect = getElementRect(element);
        
        // 1. Check resize handles first (but not for text)
        if (element.type !== 'text' && rect) {
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

        // 2. Then check for drag
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
            newInteractionState = { type: 'drag', elementId: element.id, startMouse: mousePos, startPos: { x: element.x, y: element.y } };
            elementToSelectId = element.id;
            foundInteraction = true;
            break;
        }
    }
    
    setInteractionState(newInteractionState);
    if (foundInteraction) {
      onInteractionStart();
      // Use the passed handleElementSelection if available, otherwise use setSelectedElementId
      if (typeof setSelectedElementId === 'function' && setSelectedElementId.name === 'handleElementSelection') {
        setSelectedElementId(elementToSelectId); // This branch would likely only be hit if setSelectedElementId was renamed by a parent
      } else {
        setSelectedElementId(elementToSelectId);
      }
    } else {
        setSelectedElementId(null);
    }
  }, [getMousePosOnCanvas, elements, getElementRect, getHandles, onInteractionStart, setSelectedElementId, isPointInOutline]);

  const handleMouseMove = useCallback((e) => {
    const mousePos = getMousePosOnCanvas(e);
    if (!mousePos) return;

    if (interactionState.type === 'none') {
        let cursor = 'default';
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            const rect = getElementRect(element);
            if (!rect) continue;
            
            // Only check for resize handle cursors on non-text elements
            // AND only for the currently selected element
            if (element.type !== 'text' && selectedElementId === element.id) {
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
        if(canvasRef.current) canvasRef.current.style.cursor = cursor;
        return;
    }

    const { type, elementId, startMouse, startPos, handle, startRect } = interactionState;
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    if (type === 'drag') {
      let currentX = startPos.x + (mousePos.x - startMouse.x);
      let currentY = startPos.y + (mousePos.y - startMouse.y);

      let isSnappedV = false;
      let isSnappedH = false;

      const elementAtCurrentPos = { ...element, x: currentX, y: currentY };
      const currentRect = getElementRect(elementAtCurrentPos);

      if (currentRect) {
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
      }
      setSnapLines({ horizontal: isSnappedV, vertical: isSnappedH });
      updateElement(elementId, { x: currentX, y: currentY });

    } else if (type === 'resize') {
        if (element.type === 'text') {
            return; 
        }

        // Fixed corner positions - the corner opposite to the one being dragged should stay fixed
        const fixedCorner = {
            tl: { x: startRect.x + startRect.width, y: startRect.y + startRect.height }, // br stays fixed when dragging tl
            tr: { x: startRect.x, y: startRect.y + startRect.height }, // bl stays fixed when dragging tr
            bl: { x: startRect.x + startRect.width, y: startRect.y }, // tr stays fixed when dragging bl
            br: { x: startRect.x, y: startRect.y } // tl stays fixed when dragging br
        }[handle];
        
        // Calculate new dimensions from mouse to fixed corner
        let newWidth = Math.max(10, Math.abs(mousePos.x - fixedCorner.x));
        let newHeight = Math.max(10, Math.abs(mousePos.y - fixedCorner.y));
        
        // Calculate new rect position (top-left corner of the bounding box)
        let newRectX = Math.min(mousePos.x, fixedCorner.x);
        let newRectY = Math.min(mousePos.y, fixedCorner.y);
        
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

            // Proportional scaling when shift is held
            if (shiftPressed) {
                let proportionalNewWidth = newWidth;
                let proportionalNewHeight = newHeight;

                if (Math.abs(mousePos.x - fixedCorner.x) > Math.abs(mousePos.y - fixedCorner.y)) {
                    proportionalNewHeight = newWidth / originalAspectRatio;
                } else {
                    proportionalNewWidth = newHeight * originalAspectRatio;
                }
                
                proportionalNewWidth = Math.max(10, proportionalNewWidth);
                proportionalNewHeight = Math.max(10, proportionalNewHeight);

                newWidth = proportionalNewWidth;
                newHeight = proportionalNewHeight;
                
                // Recalculate rect position with constrained dimensions, keeping fixedCorner truly fixed
                if (handle === 'tl') { // dragging top-left, fixed is bottom-right
                    newRectX = fixedCorner.x - newWidth;
                    newRectY = fixedCorner.y - newHeight;
                } else if (handle === 'tr') { // dragging top-right, fixed is bottom-left
                    newRectX = fixedCorner.x;
                    newRectY = fixedCorner.y - newHeight;
                } else if (handle === 'bl') { // dragging bottom-left, fixed is top-right
                    newRectX = fixedCorner.x - newWidth;
                    newRectY = fixedCorner.y;
                } else if (handle === 'br') { // dragging bottom-right, fixed is top-left
                    newRectX = fixedCorner.x;
                    newRectY = fixedCorner.y;
                }
            }
            
            const newScale = newWidth / sWidth; // Scale relative to the source width
            
            updatedProps = {
                scale: newScale,
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
                updatedProps = { 
                    width: newWidth, 
                    height: newHeight, 
                    x: newRectX, 
                    y: newRectY 
                };
            }
        }
        updateElement(elementId, updatedProps);
        setSnapLines({ horizontal: false, vertical: false }); // Resize doesn't have center snapping guidelines
    }
  }, [interactionState, getMousePosOnCanvas, elements, updateElement, getElementRect, getHandles, shiftPressed, isPointInOutline, canvasWidth, canvasHeight, setSnapLines, selectedElementId]);

  const handleMouseUp = useCallback(() => {
    setInteractionState({ type: 'none' });
    setSnapLines({ horizontal: false, vertical: false }); // Reset snap lines on mouse up
  }, [setInteractionState, setSnapLines]);

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
      setShowCanvasSizePanel(false);
    }
  }, [customWidth, customHeight, onCanvasSizeChange, canvasWidth, canvasHeight]);

  const handleCanvasSizePreset = useCallback((mode) => {
    setCanvasSizeMode(mode);
    
    if (mode === '16:9') {
      const newWidth = 1600;
      const newHeight = 900;
      setCustomWidth(newWidth.toString());
      setCustomHeight(newHeight.toString());
      onCanvasSizeChange({ width: newWidth, height: newHeight });
      setShowCanvasSizePanel(false);
    } else if (mode === '1:1') {
      const newSize = 1500;
      setCustomWidth(newSize.toString());
      setCustomHeight(newSize.toString());
      onCanvasSizeChange({ width: newSize, height: newSize });
      setShowCanvasSizePanel(false);
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
      
      {/* Top Controls (Canvas Size Popover only remains from previous toolbar) */}
      <div className="flex justify-end items-center mb-4 px-16">
        {(!adminSettings?.canvasControls?.lockCanvasSize) && (
          <Popover open={showCanvasSizePanel} onOpenChange={setShowCanvasSizePanel}>
            <PopoverTrigger asChild>
              <Button 
                size="icon" 
                className="bg-white/10 border-white/20 hover:opacity-80 text-white w-11 h-11 transition-opacity duration-200" 
                title="Canvas Size"
              >
                <Expand className="w-5 h-5" />
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
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs h-8"
                      disabled={!customWidth || !customHeight || parseInt(customWidth, 10) < 100 || parseInt(customHeight, 10) < 100}
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

      {/* Canvas Container */}
      <div className="mx-16 relative rounded-xl overflow-hidden border border-white/20 bg-black/20" style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}>
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="w-full h-full object-contain" onMouseDown={handleMouseDown}/>
        
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
            <Button onClick={onCanvasReset} variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white">
              <RotateCw className="w-4 h-4 mr-2" /> Reset
            </Button>
          )}
          {adminSettings?.generalControls?.undoEnabled !== false && onUndo && (
            <Button onClick={onUndo} disabled={!canUndo} variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50">
              <Undo2 className="w-4 h-4 mr-2" /> Undo
            </Button>
          )}
          {/* Show Save as Template button only if admin */}
          {adminSettings?.isAdmin && onSaveTemplate && (
            <Button
              onClick={() => {
                const name = prompt("Enter a name for this template:");
                if (name) {
                  onSaveTemplate(name);
                }
              }}
              disabled={isSavingTemplate}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingTemplate ? "Saving..." : "Save as Template"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onSave && (
            <Button onClick={onSave} disabled={isSaving} variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white">
              <Heart className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save to Gallery"}
            </Button>
          )}
          {onDownload && (
            <Button onClick={() => onDownload('png')} disabled={isDownloading} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg">
              <Download className="w-4 h-4 mr-2" /> {isDownloading ? "Downloading..." : "Download"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';

const HANDLE_SIZE = 12;

export default function CropOverlay({ imageElement, onCropChange }) {
  // --- Hooks (must be called unconditionally at the top) ---
  const [cropRect, setCropRect] = useState(null);
  const overlayRef = useRef(null);
  const [interaction, setInteraction] = useState(null);

  // --- Derived State & Calculations ---
  const { displayWidth, displayHeight, displayX, displayY } = React.useMemo(() => {
    if (!imageElement) return { displayWidth: 0, displayHeight: 0, displayX: 0, displayY: 0 };
    const { naturalWidth, naturalHeight, scale, x: centerX, y: centerY } = imageElement;
    const dW = naturalWidth * scale;
    const dH = naturalHeight * scale;
    return {
      displayWidth: dW,
      displayHeight: dH,
      displayX: centerX - dW / 2,
      displayY: centerY - dH / 2,
    };
  }, [imageElement]);

  useEffect(() => {
    if (imageElement && imageElement.crop) {
      const { crop, naturalWidth, naturalHeight } = imageElement;
      setCropRect({
        x: (crop.x / naturalWidth) * displayWidth,
        y: (crop.y / naturalHeight) * displayHeight,
        width: (crop.width / naturalWidth) * displayWidth,
        height: (crop.height / naturalHeight) * displayHeight,
      });
    } else {
      setCropRect(null);
    }
  }, [imageElement, displayWidth, displayHeight]);

  const getHandles = useCallback((rect) => {
    if (!rect) return {};
    return {
      tl: { x: rect.x, y: rect.y, cursor: 'nwse-resize' },
      tr: { x: rect.x + rect.width, y: rect.y, cursor: 'nesw-resize' },
      bl: { x: rect.x, y: rect.y + rect.height, cursor: 'nesw-resize' },
      br: { x: rect.x + rect.width, y: rect.y + rect.height, cursor: 'nwse-resize' }
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    if (!cropRect) return;

    const mousePos = { x: e.clientX, y: e.clientY };
    const overlayBounds = overlayRef.current.getBoundingClientRect();
    const mouseOnOverlay = {
      x: mousePos.x - overlayBounds.left,
      y: mousePos.y - overlayBounds.top
    };

    const handles = getHandles(cropRect);
    for (const [key, handle] of Object.entries(handles)) {
      if (Math.hypot(handle.x - mouseOnOverlay.x, handle.y - mouseOnOverlay.y) < HANDLE_SIZE) {
        setInteraction({ type: 'resize', handle: key, startRect: cropRect, startMouse: mousePos });
        return;
      }
    }
    
    if (mouseOnOverlay.x > cropRect.x && mouseOnOverlay.x < cropRect.x + cropRect.width &&
        mouseOnOverlay.y > cropRect.y && mouseOnOverlay.y < cropRect.y + cropRect.height) {
      setInteraction({ type: 'move', startRect: cropRect, startMouse: mousePos });
    }
  }, [cropRect, getHandles]);

  const handleMouseMove = useCallback((e) => {
    if (!interaction) return;
    e.stopPropagation();

    const mousePos = { x: e.clientX, y: e.clientY };
    const dx = mousePos.x - interaction.startMouse.x;
    const dy = mousePos.y - interaction.startMouse.y;
    
    let newRect = { ...interaction.startRect };

    if (interaction.type === 'move') {
      newRect.x += dx;
      newRect.y += dy;
    } else if (interaction.type === 'resize') {
      const { handle } = interaction;
      if (handle.includes('l')) { newRect.x += dx; newRect.width -= dx; }
      if (handle.includes('r')) { newRect.width += dx; }
      if (handle.includes('t')) { newRect.y += dy; newRect.height -= dy; }
      if (handle.includes('b')) { newRect.height += dy; }
    }
    
    newRect.x = Math.max(0, newRect.x);
    newRect.y = Math.max(0, newRect.y);
    newRect.width = Math.min(displayWidth - newRect.x, newRect.width);
    newRect.height = Math.min(displayHeight - newRect.y, newRect.height);
    newRect.width = Math.max(HANDLE_SIZE * 2, newRect.width);
    newRect.height = Math.max(HANDLE_SIZE * 2, newRect.height);

    setCropRect(newRect);
  }, [interaction, displayWidth, displayHeight]);

  const handleMouseUp = useCallback(() => {
    if (!interaction || !imageElement) return;

    const { naturalWidth, naturalHeight } = imageElement;
    const newCrop = {
      x: (cropRect.x / displayWidth) * naturalWidth,
      y: (cropRect.y / displayHeight) * naturalHeight,
      width: (cropRect.width / displayWidth) * naturalWidth,
      height: (cropRect.height / displayHeight) * naturalHeight,
    };
    onCropChange(newCrop);
    setInteraction(null);
  }, [interaction, cropRect, displayWidth, displayHeight, imageElement, onCropChange]);

  useEffect(() => {
    if (!interaction) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, handleMouseMove, handleMouseUp]);

  // --- Render Logic ---
  if (!imageElement || !imageElement.crop || !cropRect) {
    return null;
  }

  const handles = getHandles(cropRect);

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 z-10" 
      style={{
        width: displayWidth,
        height: displayHeight,
        left: displayX,
        top: displayY,
        cursor: interaction ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="absolute border-2 border-dashed border-white"
        style={{
          left: cropRect.x,
          top: cropRect.y,
          width: cropRect.width,
          height: cropRect.height,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          cursor: interaction?.type === 'move' ? 'grabbing' : 'move'
        }}
      />
      {Object.values(handles).map((handle, i) => (
        <div 
          key={i}
          className="absolute w-3 h-3 bg-white rounded-full border-2 border-gray-800"
          style={{
            left: handle.x - HANDLE_SIZE/2,
            top: handle.y - HANDLE_SIZE/2,
            cursor: handle.cursor
          }}
        />
      ))}
    </div>
  );
}
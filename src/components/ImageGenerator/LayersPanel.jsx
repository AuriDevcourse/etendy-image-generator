import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, ArrowUp, ArrowDown, Type, ImageIcon, Square, Circle } from "lucide-react";

const ElementIcon = ({ type }) => {
  switch (type) {
    case 'text': return <Type className="w-4 h-4 text-white/70" />;
    case 'image': return <ImageIcon className="w-4 h-4 text-white/70" />;
    case 'logo': return <ImageIcon className="w-4 h-4 text-white/70" />;
    case 'shape': return <Square className="w-4 h-4 text-white/70" />;
    default: return null;
  }
};

export default function LayersPanel({ elements, selectedElementId, onSelectElement, onDeleteElement, onMoveLayer, onReorderLayers }) {
  // Only show the panel if there are actually elements to display
  // Don't show "no elements" message unless user is actively working with elements
  const relevantElements = elements.filter(el => ['image', 'logo', 'text', 'shape'].includes(el.type));
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPos, setDragOverPos] = useState(null); // 'top' | 'bottom' | null
  
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-white/90 mb-2">Layers</h3>
      
      {relevantElements.length === 0 ? (
        <p className="text-sm text-white/60 text-center py-4">Layers will appear here as you add content to your canvas.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {[...relevantElements].reverse().map((element) => (
            <div 
              key={element.id} 
              onClick={() => onSelectElement(element.id)}
              className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors relative
                ${selectedElementId === element.id ? 'bg-indigo-500/30' : 'bg-white/5 hover:bg-white/10'}
                ${draggingId && draggingId !== element.id && dragOverId !== element.id ? 'opacity-40' : ''}
                ${dragOverId === element.id && dragOverPos === 'top' ? 'before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5 before:bg-indigo-400' : ''}
                ${dragOverId === element.id && dragOverPos === 'bottom' ? 'after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-indigo-400' : ''}
              `}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', element.id);
                e.dataTransfer.effectAllowed = 'move';
                setDraggingId(element.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverId(element.id);
                const rect = e.currentTarget.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                setDragOverPos(e.clientY < midpoint ? 'top' : 'bottom');
              }}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                if (draggedId && draggedId !== element.id && typeof onReorderLayers === 'function') {
                  onReorderLayers(draggedId, element.id, dragOverPos !== 'top');
                }
                setDragOverId(null);
                setDraggingId(null);
                setDragOverPos(null);
              }}
              onDragLeave={() => {
                setDragOverId(null);
                setDragOverPos(null);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
                setDragOverPos(null);
              }}
            >
              <GripVertical className="w-5 h-5 text-white/50 flex-shrink-0" />
              <ElementIcon type={element.type} />
              <span className="ml-2 text-sm text-white/90 truncate flex-1">
                {element.type === 'text' ? (element.content.substring(0, 20) || 'Empty Text') :
                 element.type === 'shape' ? `${element.shapeType}` :
                 element.type}
              </span>

              <div className="flex items-center gap-1 ml-2">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:bg-white/20 hover:text-white" onClick={(e) => { e.stopPropagation(); onMoveLayer(element.id, 'up'); }}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:bg-white/20 hover:text-white" onClick={(e) => { e.stopPropagation(); onMoveLayer(element.id, 'down'); }}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400/80 hover:bg-red-500/30 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
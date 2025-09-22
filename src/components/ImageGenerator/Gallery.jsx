import React from 'react';
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Download, X } from "lucide-react";

export default function Gallery({ images, onImageSelect, onClear, onDelete, onDownloadAll, isLoading }) {
  const showContent = !isLoading && images && images.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white/90">Saved Creations</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-[100px]">
           <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full"></div>
        </div>
      ) : showContent ? (
        <>
          <div className="grid grid-cols-2 gap-3 max-h-[26rem] overflow-y-auto pr-2 -mr-2">
            {images.map((image, index) => (
              <div key={image.id} className="relative flex-shrink-0 group">
                <button 
                  onClick={() => onImageSelect(index)}
                  className="w-full max-h-24 rounded-lg overflow-hidden border-2 border-white/10 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none transition-all duration-300 hover:opacity-80 flex items-center justify-center bg-white/5"
                >
                  <img 
                    src={image.image_url} 
                    alt="Saved graphic" 
                    className="max-w-full max-h-full object-contain transition-transform duration-300"
                  />
                </button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:opacity-90 text-white rounded-full transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={onDownloadAll}
              variant="outline"
              size="sm"
              className="w-full bg-blue-500/20 border-blue-500/30 text-white hover:opacity-80 transition-opacity duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
            <Button 
              onClick={onClear}
              variant="outline"
              size="sm"
              className="w-full bg-red-500/20 border-red-500/30 text-white hover:opacity-80 transition-opacity duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Camera className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">Your saved images will appear here.</p>
          <p className="text-white/40 text-sm">Click the heart icon on the preview to save a creation.</p>
        </div>
      )}
    </div>
  );
}
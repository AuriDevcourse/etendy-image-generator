import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const FileUploadArea = ({ onFileSelect, uploadedImage, onRemoveImage, children, disabled }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  
  const handleDragEnter = useCallback((e) => { 
    if (disabled) return;
    e.preventDefault(); e.stopPropagation(); setIsDragActive(true); 
  }, [disabled]);

  const handleDragLeave = useCallback((e) => { 
    if (disabled) return;
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false); 
  }, [disabled]);

  const handleDragOver = useCallback((e) => { 
    if (disabled) return;
    e.preventDefault(); e.stopPropagation(); 
  }, [disabled]);
  
  const handleDrop = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) onFileSelect(imageFile);
  }, [onFileSelect, disabled]);

  const handleFileChange = (e) => { 
    if (disabled) return;
    const file = e.target.files[0]; 
    if (file) onFileSelect(file); 
  };
  
  if (uploadedImage) {
    return (
      <div className="relative group aspect-video rounded-xl overflow-hidden border border-white/20">
        <img src={uploadedImage} alt="Uploaded preview" className="w-full h-full object-contain bg-black/20" />
        <Button 
          onClick={onRemoveImage} 
          size="icon" 
          variant="destructive" 
          className="absolute top-2 right-2 bg-red-500/50 backdrop-blur-sm border-red-500/30 text-white hover:bg-red-500/70 w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={disabled}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer aspect-video flex items-center justify-center 
        ${ disabled ? 'cursor-not-allowed border-white/10 bg-white/5' : isDragActive ? 'border-white/60 bg-white/15' : 'border-white/30 bg-white/5 hover:border-white/50' }`}
      onDragEnter={handleDragEnter} 
      onDragLeave={handleDragLeave} 
      onDragOver={handleDragOver} 
      onDrop={handleDrop}
    >
      <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={disabled} />
      {children}
    </div>
  );
};
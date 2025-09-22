import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function EditableBadge({ 
  value, 
  onValueChange, 
  suffix = '', 
  max = 100, 
  min = 0, 
  inputWidth = "w-16",
  className = ""
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleClick = () => {
    setTempValue(value.toString());
    setIsEditing(true);
  };

  const handleSubmit = () => {
    const numValue = parseInt(tempValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onValueChange(clampedValue);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSubmit();
  };

  if (isEditing) {
    return (
      <Input
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyPress}
        onBlur={handleBlur}
        className={`${inputWidth} h-6 px-2 text-xs glass-input bg-white/10 border-white/20 text-white ${className}`}
        autoFocus
        type="number"
        min={min}
        max={max}
      />
    );
  }

  return (
    <Badge
      className={`px-2 py-1 bg-white/10 border-white/20 text-white/90 hover:bg-white/20 cursor-pointer transition-colors ${className}`}
      onClick={handleClick}
    >
      {value}{suffix}
    </Badge>
  );
}
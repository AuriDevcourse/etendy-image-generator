import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check } from 'lucide-react';

const TAG_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#4b5563'];

export default function EditTemplateModal({ isOpen, onClose, template, onSave }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setColor(template.tag_color || '#4b5563');
    }
  }, [template]);

  if (!template) return null;

  const handleSave = () => {
    onSave(template.id, name, color);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/20 bg-black/50 text-white">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Rename your template and assign a color tag for better organization.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input bg-white/5 border-white/20"
            />
          </div>
          <div className="space-y-2">
            <Label>Color Tag</Label>
            <div className="flex gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all duration-200"
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 3px ${c}60` : 'none' }}
                >
                  {color === c && <Check className="w-5 h-5 text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-transparent text-white border-white/20 hover:bg-white/10">Cancel</Button>
          <Button onClick={handleSave} className="bg-indigo-500/80 hover:bg-indigo-500/90">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
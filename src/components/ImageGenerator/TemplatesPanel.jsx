import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Template } from "@/api/entities";
import { Palette, Trash2, X, Edit, Star } from "lucide-react";
import EditTemplateModal from './EditTemplateModal';

export default function TemplatesPanel({ 
  templates, 
  onLoadTemplate, 
  onDeleteTemplate, 
  isLoading,
  onRefresh,
  currentUser,
  onSetDefault
}) {
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const showContent = !isLoading && templates && templates.length > 0;

  const handleStartEdit = (template) => {
    setEditingTemplate(template);
  };

  const handleSaveEdit = async (templateId, newName, newColor) => {
    try {
      await Template.update(templateId, { name: newName, tag_color: newColor });
      onRefresh();
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white/90">Templates</h3>
            <p className="text-xs text-white/50">Maximum 4 templates</p>
          </div>
          <div className="text-sm text-white/60">
            {templates?.length || 0}/4
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[100px]">
             <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full"></div>
          </div>
        ) : showContent ? (
          <>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 -mr-2">
              {templates.map((template) => {
                const isDefault = currentUser?.default_template_id === template.id;
                return (
                  <div key={template.id} className="relative group">
                    <div 
                      onClick={() => onLoadTemplate(template)}
                      className={`w-full p-3 rounded-lg border-2 hover:border-orange-400 focus:outline-none transition-all duration-300 bg-white/5 hover:bg-white/10 text-left cursor-pointer ${isDefault ? 'border-amber-400' : 'border-white/10'}`}
                    >
                      {template.thumbnail_url ? (
                        <div className="w-full h-16 rounded overflow-hidden mb-2 bg-white/10">
                          <img 
                            src={template.thumbnail_url} 
                            alt={template.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-16 rounded bg-white/10 flex items-center justify-center mb-2">
                          <Palette className="w-6 h-6 text-white/30" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: template.tag_color || '#4b5563' }}
                          />
                          <p className="text-white/90 font-medium text-xs truncate" title={template.name}>
                            {template.name.length > 40 ? template.name.substring(0, 40) + '...' : template.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(template);
                                }}
                                className="bg-transparent text-white/60 hover:text-orange-400 transition-colors duration-200 flex-shrink-0 h-auto w-auto p-0"
                            >
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetDefault(template.id);
                                }}
                                className={`bg-transparent text-white/60 hover:text-amber-400 transition-colors duration-200 flex-shrink-0 h-auto w-auto p-0 ${isDefault ? 'text-amber-400 opacity-100' : ''}`}
                            >
                                <Star className={`w-4 h-4 ${isDefault ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 w-5 h-5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTemplate(template.id);
                      }}
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Palette className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No templates saved yet.</p>
            <p className="text-white/40 text-sm">Save your current design as a template to reuse it later.</p>
          </div>
        )}
      </div>

      <EditTemplateModal 
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        template={editingTemplate}
        onSave={handleSaveEdit}
      />
    </>
  );
}
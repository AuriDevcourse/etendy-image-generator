import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function Step5Download({ onDownload, isDownloading, onSave, isSaving, onSaveTemplate, isSavingTemplate }) {
  const [downloadFormat, setDownloadFormat] = useState('jpg');

  const handleDownload = () => {
    onDownload('jpg'); // Always download as JPG
  };

  return (
    <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Download
        </h3>

        <div className="space-y-4">
          <div className="text-xs text-white/60">
            <p>• Downloads as high-quality JPG format</p>
          </div>

          <Button 
            onClick={handleDownload} 
            disabled={isDownloading} 
            className="w-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-white/20 backdrop-blur-xl text-white hover:from-emerald-500/40 hover:to-teal-500/40 hover:border-white/30 transition-all duration-300 shadow-lg shadow-emerald-500/25 py-3 text-sm font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Download as JPG'}
          </Button>

          {(onSave || onSaveTemplate) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {onSave && (
                <Button 
                  onClick={onSave} 
                  disabled={isSaving} 
                  variant="outline"
                  className="w-full bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all duration-300 py-3 text-sm font-semibold"
                >
                  {isSaving ? 'Saving...' : 'Save to Gallery'}
                </Button>
              )}

              {onSaveTemplate && (
                <Button
                  onClick={() => {
                    const name = prompt('Enter a template name:');
                    if (name && name.trim()) onSaveTemplate(name.trim());
                  }}
                  disabled={isSavingTemplate}
                  variant="outline"
                  className="w-full bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all duration-300 py-3 text-sm font-semibold"
                >
                  {isSavingTemplate ? 'Saving...' : 'Save as Template'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
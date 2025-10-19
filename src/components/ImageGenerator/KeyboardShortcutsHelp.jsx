import React, { useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SHORTCUTS = [
  {
    category: 'General',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo action' },
      { keys: ['Delete'], description: 'Delete selected element' },
      { keys: ['Escape'], description: 'Deselect all elements' },
    ],
  },
  {
    category: 'Selection',
    shortcuts: [
      { keys: ['Ctrl', 'Click'], description: 'Multi-select elements' },
      { keys: ['Click'], description: 'Select single element' },
      { keys: ['Drag'], description: 'Move element freely' },
    ],
  },
  {
    category: 'Resizing',
    shortcuts: [
      { keys: ['Shift', 'Drag'], description: 'Scale proportionally' },
    ],
  },
  {
    category: 'Context Menu',
    shortcuts: [
      { keys: ['Right Click'], description: 'Open context menu' },
      { keys: ['Right Click', 'Element'], description: 'Copy, Lock, or Layer element' },
      { keys: ['Right Click', 'Canvas'], description: 'Paste copied element' },
    ],
  },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Keyboard Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 text-white shadow-lg"
        title="Keyboard Shortcuts"
      >
        <Keyboard className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-[9998] transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="glass-panel border-2 border-white/20 backdrop-blur-xl bg-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-8 h-8 text-orange-400" />
                  <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Shortcuts Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {SHORTCUTS.map((category, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-lg font-semibold text-orange-300 mb-3">
                      {category.category}
                    </h3>
                    <div className="space-y-2">
                      {category.shortcuts.map((shortcut, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <span className="text-white/80 text-sm">
                            {shortcut.description}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            {shortcut.keys.map((key, kIdx) => (
                              <React.Fragment key={kIdx}>
                                <kbd className="px-2 py-1 text-xs font-semibold text-white bg-white/20 border border-white/30 rounded shadow-sm">
                                  {key}
                                </kbd>
                                {kIdx < shortcut.keys.length - 1 && (
                                  <span className="text-white/50 text-xs self-center">
                                    +
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Got it!
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

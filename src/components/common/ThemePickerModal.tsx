import React from 'react';
import { 
  X, 
  Check, 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Sparkles,
  Layers
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({ isOpen, onClose }) => {
  const { 
    archetype, 
    setArchetype, 
    allArchetypes, 
    polarity, 
    setPolarity, 
    resolvedPolarity 
  } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-title"
        className="relative w-full max-w-2xl bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden z-10 my-auto transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-subtle/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 id="theme-modal-title" className="text-base font-display font-bold text-ink">
                Theme Studio & Archetypes
              </h2>
              <p className="text-xs text-ink-muted">
                Select your preferred visual design system and color polarity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
            aria-label="Close theme modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Polarity Segmented Control */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
              Color Polarity Mode
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-subtle rounded-lg border border-border-subtle">
              <button
                type="button"
                onClick={() => setPolarity('light')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  polarity === 'light'
                    ? 'bg-surface text-ink shadow-sm border border-border-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setPolarity('dark')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  polarity === 'dark'
                    ? 'bg-surface text-ink shadow-sm border border-border-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-accent-primary" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setPolarity('system')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  polarity === 'system'
                    ? 'bg-surface text-ink shadow-sm border border-border-subtle'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-ink-muted" />
                <span>Auto ({resolvedPolarity})</span>
              </button>
            </div>
          </div>

          {/* Archetypes Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Design Archetype ({allArchetypes.length} Available)
              </label>
              <span className="text-[11px] text-ink-muted flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent-primary" />
                0-WCAG contrast verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allArchetypes.map((theme) => {
                const isSelected = archetype === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setArchetype(theme.id)}
                    className={`text-left p-3.5 rounded-lg border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-accent-primary bg-accent-tint/40 shadow-sm ring-1 ring-accent-primary'
                        : 'border-border-subtle hover:border-border-default bg-subtle/30 hover:bg-subtle/60'
                    }`}
                  >
                    <div>
                      {/* Title & Badge */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-display font-bold text-sm text-ink">
                          {theme.name}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-surface border border-border-subtle text-ink-muted whitespace-nowrap">
                          {theme.badge}
                        </span>
                      </div>

                      {/* Tagline */}
                      <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed mb-3">
                        {theme.tagline}
                      </p>
                    </div>

                    <div>
                      {/* Typography specimen & palette strip */}
                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle/80 mt-2">
                        <span className="text-[10px] font-mono text-ink-muted truncate max-w-[150px]">
                          {theme.fontSample.display}
                        </span>

                        {/* Swatches */}
                        <div className="flex items-center space-x-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: theme.previewColors.canvas }}
                            title="Canvas"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: theme.previewColors.surface }}
                            title="Surface"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: theme.previewColors.accent }}
                            title="Accent Primary"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: theme.previewColors.secondary }}
                            title="Accent Secondary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-primary text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-subtle bg-subtle/40">
          <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
            <Layers className="w-3.5 h-3.5" />
            <span>Theme auto-persisted in local vault</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ios-btn ios-btn-primary rounded-lg text-xs font-semibold px-4 py-1.5 min-h-[34px]"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

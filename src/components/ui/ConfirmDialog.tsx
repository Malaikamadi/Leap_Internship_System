import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001a2e]/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white border border-slate-200 shadow-dropdown p-5 leap-dropdown-enter">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`h-9 w-9 shrink-0 rounded-md flex items-center justify-center ${
                variant === 'danger'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-[#002B49]/10 text-[#002B49] border border-[#002B49]/15'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-sm font-bold text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};


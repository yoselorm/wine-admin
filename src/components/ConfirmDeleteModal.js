import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

const ConfirmDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Deletion", 
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  isDeleting = false 
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop Mask */}
      <div 
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={isDeleting ? null : onClose} // Block clicking background while loading API call
      />

      {/* Modal Card Structure */}
      <div className="bg-white border border-zinc-100 rounded-xl shadow-2xl max-w-sm w-full relative z-50 p-6 overflow-hidden animate-slide-in flex flex-col gap-4">
        
        {/* Upper Close Button */}
        <button 
          onClick={onClose} 
          disabled={isDeleting}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors disabled:opacity-30"
        >
          <X size={16} />
        </button>

        {/* Content Details Warning Group */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-serif font-bold text-zinc-900 tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-500 font-light leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Form Controls Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg transition-all focus:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none disabled:opacity-50"
          >
            {isDeleting && <Loader2 size={12} className="animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ConfirmDeleteModal;
import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contactName?: string;
  count?: number;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, contactName, count, isLoading }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-surface-container rounded-[32px] border border-error/20 w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center text-error mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          
          <h2 className="text-2xl font-headline font-bold text-white mb-3">
            {count ? `¿Eliminar ${count} Contactos?` : '¿Eliminar Contacto?'}
          </h2>
          
          <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
            {count ? (
              <>
                Estás a punto de eliminar <span className="text-white font-bold">{count} contactos</span> seleccionados.
              </>
            ) : (
              <>
                Estás a punto de eliminar permanentemente a <span className="text-white font-bold">{contactName}</span>.
              </>
            )}
            <br />
            Esta acción es definitiva y se perderán todos los datos vinculados.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onConfirm();
              }}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-error text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-error/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                  Eliminando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  Sí, eliminar ahora
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-surface-container-highest text-on-surface font-bold text-sm hover:bg-surface-container-highest/80 active:scale-95 transition-all text-sm"
            >
              No, cancelar
            </button>
          </div>
        </div>
        
        <div className="bg-error/5 py-3 text-center border-t border-error/10">
          <span className="text-[10px] text-error/60 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-1 h-1 rounded-full bg-error/40 animate-pulse"></span>
            Acción Irreversible
            <span className="w-1 h-1 rounded-full bg-error/40 animate-pulse"></span>
          </span>
        </div>
      </div>
    </div>
  );
}

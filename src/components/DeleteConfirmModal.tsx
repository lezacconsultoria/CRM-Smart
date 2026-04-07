import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contactName?: string;
  count?: number;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, contactName, count }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-surface-container-low w-full max-w-md rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <span className="material-symbols-outlined text-[32px]">delete_forever</span>
          </div>
          
          <h3 className="text-xl font-bold text-white text-center mb-2">
            {count ? `¿Eliminar ${count} contactos?` : '¿Eliminar contacto?'}
          </h3>
          <p className="text-on-surface-variant text-center mb-8">
            {count ? (
              <>
                Estás a punto de eliminar <span className="text-white font-semibold">{count} contactos</span> seleccionados.
              </>
            ) : (
              <>
                Estás a punto de eliminar a <span className="text-white font-semibold">{contactName}</span>.
              </>
            )}
            <br />
            Esta acción no se puede deshacer y se borrarán también sus tareas y notas relacionadas.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-outline-variant/50 text-white font-bold hover:bg-surface-container-highest transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 h-12 rounded-xl bg-error text-on-error font-bold hover:bg-error/90 hover:shadow-lg hover:shadow-error/20 transition-all active:scale-[0.98]"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

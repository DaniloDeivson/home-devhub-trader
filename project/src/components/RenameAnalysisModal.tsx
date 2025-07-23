import React from 'react';
import { X } from 'lucide-react';

interface RenameAnalysisModalProps {
  showRenameModal: boolean;
  setShowRenameModal: (show: boolean) => void;
  renameName: string;
  setRenameName: (name: string) => void;
  confirmRenameAnalysis: () => void;
  setRenameAnalysisId: (id: string | null) => void;
}

export function RenameAnalysisModal({
  showRenameModal,
  setShowRenameModal,
  renameName,
  setRenameName,
  confirmRenameAnalysis,
  setRenameAnalysisId
}: RenameAnalysisModalProps) {
  if (!showRenameModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium mb-4">Renomear Análise</h3>
        <input
          type="text"
          placeholder="Novo nome..."  
          value={renameName} 
          onChange={(e) => setRenameName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowRenameModal(false);
              setRenameAnalysisId(null);
              setRenameName('');  
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={confirmRenameAnalysis}
            disabled={!renameName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Renomear
          </button>
        </div>
      </div>
    </div>
  );
}
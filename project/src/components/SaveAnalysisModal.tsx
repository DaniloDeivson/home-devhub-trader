import React from 'react';
import { X, Save } from 'lucide-react';

interface SaveAnalysisModalProps {
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  saveName: string;
  setSaveName: (name: string) => void;
  confirmSaveAnalysis: () => void;
}

export function SaveAnalysisModal({
  showSaveModal,
  setShowSaveModal,
  saveName,
  setSaveName,
  confirmSaveAnalysis
}: SaveAnalysisModalProps) {
  if (!showSaveModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium mb-4">Salvar Análise</h3>
        <input
          type="text"
          placeholder="Nome da análise..."
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowSaveModal(false);
              setSaveName('');
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={confirmSaveAnalysis}
            disabled={!saveName.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
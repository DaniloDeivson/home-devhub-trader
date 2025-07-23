import React, { useState } from 'react';
import { X, Edit3, Trash2, Search } from 'lucide-react';

interface SavedAnalysis {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  backtestResult: any;
  selectedStrategy: string | null;
  selectedAsset: string | null;
  csvContent: string | null;
  availableStrategies: string[];
  availableAssets: string[];
  totalTrades: number;
}

interface LoadAnalysisModalProps {
  showLoadModal: boolean;
  setShowLoadModal: (show: boolean) => void;
  savedAnalyses: SavedAnalysis[];
  handleRenameAnalysis: (id: string, name: string) => void;
  handleLoadAnalysis: (analysis: SavedAnalysis) => void;
  handleDeleteAnalysis: (id: string) => void;
}

export function LoadAnalysisModal({
  showLoadModal,
  setShowLoadModal,
  savedAnalyses,
  handleRenameAnalysis,
  handleLoadAnalysis,
  handleDeleteAnalysis
}: LoadAnalysisModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!showLoadModal) return null;
  
  // Filter analyses based on search query
  const filteredAnalyses = savedAnalyses.filter(analysis => 
    analysis.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Carregar Análise</h3>
          <button 
            onClick={() => setShowLoadModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar análises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {filteredAnalyses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {searchQuery ? "Nenhuma análise encontrada para esta busca" : "Nenhuma análise salva encontrada"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAnalyses.map((analysis) => (
              <div key={analysis.id} className="bg-gray-700 rounded-lg p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{analysis.name}</h4>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleRenameAnalysis(analysis.id, analysis.name)}
                      className="p-1.5 hover:bg-gray-600 rounded"
                      title="Renomear"
                    >
                      <Edit3 className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteAnalysis(analysis.id)}
                      className="p-1.5 hover:bg-gray-600 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  <div>Criado: {new Date(analysis.createdAt).toLocaleDateString()}</div>
                  <div>Trades: {analysis.totalTrades || 'N/A'}</div>
                </div>
                <button
                  onClick={() => handleLoadAnalysis(analysis)}
                  className="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                >
                  Carregar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
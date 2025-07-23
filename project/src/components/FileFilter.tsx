import React from 'react';
import { Filter, FileText, X } from 'lucide-react';

interface FileFilterProps {
  files: File[];
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void;
  showConsolidated: boolean;
  setShowConsolidated: (show: boolean) => void;
  hasMultipleFiles: boolean;
}

export function FileFilter({
  files,
  selectedFiles,
  setSelectedFiles,
  showConsolidated,
  setShowConsolidated,
  hasMultipleFiles
}: FileFilterProps) {
  if (!hasMultipleFiles) return null;

  const handleFileToggle = (fileName: string) => {
    if (selectedFiles.includes(fileName)) {
      setSelectedFiles(selectedFiles.filter(f => f !== fileName));
    } else {
      setSelectedFiles([...selectedFiles, fileName]);
    }
  };

  const selectAllFiles = () => {
    setSelectedFiles(files.map(f => f.name));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Filter className="w-5 h-5 text-blue-400 mr-2" />
          Filtros por Arquivo
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConsolidated(!showConsolidated)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              showConsolidated
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showConsolidated ? 'Mostrar Individual' : 'Mostrar Consolidado'}
          </button>
        </div>
      </div>

      {/* File Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Selecione os arquivos para análise ({selectedFiles.length}/{files.length} selecionados)
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={selectAllFiles}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              Selecionar Todos
            </button>
            <button
              onClick={clearAllFiles}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((file, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedFiles.includes(file.name)
                  ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
              onClick={() => handleFileToggle(file.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm truncate" title={file.name}>
                    {file.name.replace('.csv', '')}
                  </span>
                </div>
                
                {selectedFiles.includes(file.name) && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <X className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          ))}
        </div>

        {selectedFiles.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Nenhum arquivo selecionado</p>
            <p className="text-xs">Selecione pelo menos um arquivo para ver os resultados</p>
          </div>
        )}
      </div>
    </div>
  );
}
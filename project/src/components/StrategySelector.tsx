import React, { useMemo } from 'react';
import { Filter, FileText } from 'lucide-react';

interface StrategySelectorProps {
  selectedStrategy: string | null;
  setSelectedStrategy: (strategy: string | null) => void;
  selectedAsset: string | null;
  setSelectedAsset: (asset: string | null) => void;
  availableStrategies: string[];
  availableAssets: string[];
  setShowUploadForm: (show: boolean) => void;
  
  // Novas props para filtro de arquivos
  files?: File[];
  selectedFiles?: string[];
  setSelectedFiles?: (files: string[]) => void;
  showConsolidated?: boolean;
  setShowConsolidated?: (show: boolean) => void;
  onResetFilters?: () => void;
  
  // Props para dados de trades para extrair ativos dinamicamente
  trades?: any[];
  fileResults?: { [key: string]: any };
}

export function StrategySelector({
  selectedStrategy,
  setSelectedStrategy,
  selectedAsset,
  setSelectedAsset,
  availableStrategies,
  availableAssets,
  setShowUploadForm,
  files = [],
  selectedFiles = [],
  setSelectedFiles,
  showConsolidated = true,
  setShowConsolidated,
  onResetFilters,
  trades = [],
  fileResults
}: StrategySelectorProps) {
  const hasMultipleFiles = files.length > 1;
  
  // Extrair ativos disponíveis dinamicamente dos trades
  const dynamicAvailableAssets = useMemo(() => {
    const assets = new Set<string>();
    
    // Se há trades disponíveis, extrair ativos deles
    if (trades && trades.length > 0) {
      trades.forEach(trade => {
        if (trade.symbol) {
          assets.add(trade.symbol);
        }
      });
    }
    
    // Se há fileResults, extrair ativos de todas as estratégias
    if (fileResults && Object.keys(fileResults).length > 0) {
      Object.values(fileResults).forEach((strategyData: any) => {
        if (strategyData.trades && Array.isArray(strategyData.trades)) {
          strategyData.trades.forEach((trade: any) => {
            if (trade.symbol) {
              assets.add(trade.symbol);
            }
          });
        }
      });
    }
    
    // Se não há ativos extraídos dinamicamente, usar os disponíveis
    if (assets.size === 0 && availableAssets.length > 0) {
      availableAssets.forEach(asset => assets.add(asset));
    }
    
    return Array.from(assets).sort();
  }, [trades, fileResults, availableAssets]);
  
  // Verificar se há ativos disponíveis para mostrar o filtro
  const hasAvailableAssets = dynamicAvailableAssets.length > 0;
  
  console.log('🔍 StrategySelector renderizado:', {
    selectedStrategy,
    availableStrategies,
    hasMultipleFiles,
    dynamicAvailableAssets,
    hasAvailableAssets
  });

  const handleFileToggle = (fileName: string) => {
    if (!setSelectedFiles) return;
    
    if (selectedFiles.includes(fileName)) {
      setSelectedFiles(selectedFiles.filter(f => f !== fileName));
    } else {
      setSelectedFiles([...selectedFiles, fileName]);
    }
  };

  const selectAllFiles = () => {
    if (!setSelectedFiles) return;
    setSelectedFiles(files.map(f => f.name));
  };

  const clearAllFiles = () => {
    if (!setSelectedFiles) return;
    setSelectedFiles([]);
  };

  const handleResetFilters = () => {
    setSelectedStrategy(null);
    setSelectedAsset(null);
    if (onResetFilters) {
      onResetFilters();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4 flex-wrap">
          {/* Filtro de Estratégia */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Estratégia
            </label>
            <select
              value={selectedStrategy || ''}
              onChange={(e) => {
                const value = e.target.value || null;
                setSelectedStrategy(value);
                if (setSelectedFiles && value) {
                  setSelectedFiles([`${value}.csv`]);
                  if (setShowConsolidated) setShowConsolidated(false); // Força modo individual
                } else if (setSelectedFiles && !value) {
                  setSelectedFiles(files.map(f => f.name));
                  if (setShowConsolidated) setShowConsolidated(true); // Volta para consolidado
                }
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as estratégias</option>
              {availableStrategies.map(strategy => (
                <option key={strategy} value={strategy}>{strategy}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Ativo - só aparece quando há ativos disponíveis */}
          {hasAvailableAssets && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Ativo
              </label>
              <select
                value={selectedAsset || ''}
                onChange={(e) => setSelectedAsset(e.target.value || null)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os ativos</option>
                {dynamicAvailableAssets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Modo de Análise - só aparece com múltiplos arquivos */}
          {hasMultipleFiles && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Modo
              </label>
              <button
                onClick={() => setShowConsolidated && setShowConsolidated(!showConsolidated)}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  showConsolidated
                    ? 'bg-blue-600 text-white'
                    : 'bg-purple-600 text-white'
                }`}
              >
                {showConsolidated ? '📊 Consolidado' : '📁 Individual'}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Limpar Filtros
          </button>
          
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Adicionar CSV
          </button>
        </div>
      </div>

      {/* Informações sobre os filtros ativos */}
      {(hasMultipleFiles || selectedStrategy || selectedAsset) && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-3">
              {hasMultipleFiles && (
                <span>
                  📁 {showConsolidated 
                    ? `${files.length} arquivos consolidados` 
                    : `${selectedFiles.length}/${files.length} selecionados`
                  }
                </span>
              )}
              {selectedStrategy && <span>🎯 {selectedStrategy}</span>}
              {selectedAsset && <span>💰 {selectedAsset}</span>}
            </div>
            
            {hasMultipleFiles && !showConsolidated && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllFiles}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Selecionar Todos
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={clearAllFiles}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Desmarcar Todos
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seleção Individual de Arquivos - só aparece no modo individual */}
      {hasMultipleFiles && !showConsolidated && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className={`p-2 rounded border cursor-pointer transition-all text-xs ${
                  selectedFiles.includes(file.name)
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
                onClick={() => handleFileToggle(file.name)}
                title={file.name}
              >
                <div className="flex items-center space-x-1">
                  <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate">
                    {file.name.replace('.csv', '')}
                  </span>
                  {selectedFiles.includes(file.name) && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { FileText, BarChart3, RefreshCw } from 'lucide-react';

interface ActiveFilesInfoProps {
  mode: string;
  description: string;
  fileCount: number;
  files: File[];
  selectedFiles: string[];
  backtestResult: any;
  onReset: () => void;
}

export function ActiveFilesInfo({
  mode,
  description,
  fileCount,
  files,
  selectedFiles,
  backtestResult,
  onReset
}: ActiveFilesInfoProps) {
  const totalTrades = backtestResult?.["Performance Metrics"]?.["Total Trades"] || 0;
  const netProfit = backtestResult?.["Performance Metrics"]?.["Net Profit"] || 0;
  const winRate = backtestResult?.["Performance Metrics"]?.["Win Rate (%)"] || 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-medium">Modo: {mode}</h3>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
          
          {fileCount > 0 && (
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">
                  {totalTrades} trades
                </span>
              </div>
              
              <div className="text-gray-300">
                P&L: <span className={netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                  R$ {netProfit?.toFixed(2)}
                </span>
              </div>
              
              <div className="text-gray-300">
                Taxa: <span className="text-blue-400">{winRate?.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {mode === 'Individual' && selectedFiles.length > 0 && (
            <div className="text-xs text-gray-500">
              {selectedFiles.map((fileName, index) => (
                <span key={index} className="inline-block bg-gray-700 px-2 py-1 rounded mr-1 mb-1">
                  {fileName.replace('.csv', '')}
                </span>
              ))}
            </div>
          )}
          
          <button
            onClick={onReset}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm flex items-center space-x-1"
            title="Resetar filtros"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
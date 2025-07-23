import React from 'react';
import { FileText, X, RefreshCw, BarChart2, AlertTriangle } from 'lucide-react';

interface BacktestUploadFormProps {
  files: File[];
  setFiles: (files: File[]) => void;
  error: string | null;
  isLoading: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleRemoveFile: (index: number) => void;
  handleUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function BacktestUploadForm({
  files,
  setFiles,
  error,
  isLoading,
  handleFileChange,
  handleDragOver,
  handleDrop,
  handleRemoveFile,
  handleUpload,
  fileInputRef
}: BacktestUploadFormProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8 border-2 border-blue-600 border-opacity-30">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FileText className="w-5 h-5 text-blue-400 mr-2" />
        Upload de Arquivo CSV
      </h2>
      
      <div 
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-6 cursor-pointer hover:border-blue-500 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".csv"
          multiple
        />
        
        <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        
        {files.length > 0 ? (
          <div>
            <p className="text-lg font-medium text-blue-400">{files.length} arquivo(s) selecionado(s)</p>
            <ul className="mt-2 text-sm text-gray-400">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between py-1">
                  <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Arraste e solte seu(s) arquivo(s) CSV aqui
            </p>
            <p className="text-sm text-gray-400 mb-4">
              ou clique para selecionar arquivos
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md inline-flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Selecionar Arquivos
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center text-red-500">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isLoading}
          className={`px-4 py-2 rounded-md flex items-center ${
            files.length === 0 || isLoading
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <BarChart2 className="w-5 h-5 mr-2" />
              Analisar Backtest
            </>
          )}
        </button>
      </div>
    </div>
  );
}
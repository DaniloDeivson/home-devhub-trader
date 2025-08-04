import React from 'react';
import { Calendar, ChevronUp, ChevronDown, TrendingUp, XCircle, Check } from 'lucide-react';
import { BacktestResult } from '../types/backtest';

interface DailyResultsSectionProps {
  showDailyResults: boolean;
  setShowDailyResults: (show: boolean) => void;
  backtestResult: BacktestResult | null;
}

export function DailyResultsSection({
  showDailyResults,
  setShowDailyResults,
  backtestResult
}: DailyResultsSectionProps) {
  // Guard clause to prevent rendering if backtestResult is null or Performance Metrics is missing
  if (!backtestResult || !backtestResult["Performance Metrics"]) return null;
  
  const metrics = backtestResult["Performance Metrics"];
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium">Resultados Diários</h2>
        </div>
        <button 
          onClick={() => setShowDailyResults(!showDailyResults)}
          className="p-1.5 hover:bg-gray-700 rounded-md"
        >
          {showDailyResults ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      
      {showDailyResults && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
                Ganho Médio
              </h3>
              <div className="text-2xl font-bold text-green-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(metrics["Average Win"] || 0)}
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <XCircle className="w-4 h-4 text-red-400 mr-2" />
                Perda Média
              </h3>
              <div className="text-2xl font-bold text-red-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(metrics["Average Loss"] || 0)}
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Check className="w-4 h-4 text-blue-400 mr-2" />
                Taxa de Acerto
              </h3>
              <div className="text-2xl font-bold text-blue-400">
                {metrics["Win Rate (%)"]?.toFixed(1) || "0.0"}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
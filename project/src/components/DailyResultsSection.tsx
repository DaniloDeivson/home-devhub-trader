import React from 'react';
import { Calendar, ChevronUp, ChevronDown, TrendingUp, XCircle, Check, BarChart3, Activity } from 'lucide-react';
import { BacktestResult } from '../types/backtest';

interface DailyResultsSectionProps {
  showDailyResults: boolean;
  setShowDailyResults: (show: boolean) => void;
  backtestResult: BacktestResult | null;
  fileResults?: { [key: string]: BacktestResult };
}

export function DailyResultsSection({
  showDailyResults,
  setShowDailyResults,
  backtestResult,
  fileResults
}: DailyResultsSectionProps) {
  // Função para extrair Performance Metrics de um resultado
  const extractDailyMetrics= (result: BacktestResult) => {
    return result["Performance Metrics"] || {
      "Average Win": 0,
      "Average Loss": 0,
      "Win Rate (%)": 0,
      "Net Profit": 0,
      "Total Trades": 0,
      "Gross Profit": 0,
      "Gross Loss": 0,
    };
  };

  // Determinar se é único ou múltiplos CSVs
  const isMultipleCSVs = fileResults && Object.keys(fileResults).length > 0;
  
  // Processar dados baseado no tipo
  const processedData: { [strategy: string]: ReturnType<typeof extractPerformanceMetrics> } = {};
  
  if (isMultipleCSVs) {
    // Múltiplos CSVs - usar fileResults
    Object.entries(fileResults).forEach(([strategyName, result]) => {
      processedData[strategyName] = extractPerformanceMetrics(result);
    });
  } else if (backtestResult) {
    // Único CSV - criar fileResults simulado
    const fileName = "Estratégia";
    processedData[fileName] = extractPerformanceMetrics(backtestResult);
  }

  // Calcular métricas consolidadas
  const calculateConsolidatedMetrics = () => {
    const allMetrics = Object.values(processedData);
    
    if (allMetrics.length === 0) return null;
    
    const totalTrades = allMetrics.reduce((sum, metrics) => sum + (metrics["Total Trades"] || 0), 0);
    const totalNetProfit = allMetrics.reduce((sum, metrics) => sum + (metrics["Net Profit"] || 0), 0);
    const totalGrossProfit = allMetrics.reduce((sum, metrics) => sum + (metrics["Gross Profit"] || 0), 0);
    const totalGrossLoss = allMetrics.reduce((sum, metrics) => sum + (metrics["Gross Loss"] || 0), 0);
    
    // Calcular médias ponderadas
    const avgWin = allMetrics.reduce((sum, metrics) => sum + (metrics["Average Win"] || 0), 0) / allMetrics.length;
    const avgLoss = allMetrics.reduce((sum, metrics) => sum + (metrics["Average Loss"] || 0), 0) / allMetrics.length;
    const avgWinRate = allMetrics.reduce((sum, metrics) => sum + (metrics["Win Rate (%)"] || 0), 0) / allMetrics.length;
    
    return {
      totalTrades,
      totalNetProfit,
      totalGrossProfit,
      totalGrossLoss,
      avgWin,
      avgLoss,
      avgWinRate,
      profitFactor: totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : 0
    };
  };

  const consolidatedMetrics = calculateConsolidatedMetrics();

  // Guard clause
  if (!consolidatedMetrics) return null;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium">
            Resultados Diários {isMultipleCSVs ? `(${Object.keys(processedData).length} estratégias)` : ''}
          </h2>
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
          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
                Resultado Total
              </h3>
              <div className={`text-xl font-bold ${consolidatedMetrics.totalNetProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(consolidatedMetrics.totalNetProfit)}
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Activity className="w-4 h-4 text-blue-400 mr-2" />
                Ganho Médio
              </h3>
              <div className="text-xl font-bold text-green-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(consolidatedMetrics.avgWin)}
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <XCircle className="w-4 h-4 text-red-400 mr-2" />
                Perda Média
              </h3>
              <div className="text-xl font-bold text-red-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(consolidatedMetrics.avgLoss)}
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Check className="w-4 h-4 text-blue-400 mr-2" />
                Taxa de Acerto
              </h3>
              <div className="text-xl font-bold text-blue-400">
                {consolidatedMetrics.avgWinRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Métricas adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <BarChart3 className="w-4 h-4 text-yellow-400 mr-2" />
                Total Trades
              </h3>
              <div className="text-xl font-bold text-yellow-400">
                {consolidatedMetrics.totalTrades}
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
                Fator de Lucro
              </h3>
              <div className={`text-xl font-bold ${
                consolidatedMetrics.profitFactor >= 1.5 ? 'text-green-400' : 
                consolidatedMetrics.profitFactor >= 1.0 ? 'text-yellow-400' : 
                'text-red-400'
              }`}>
                {consolidatedMetrics.profitFactor.toFixed(2)}
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Activity className="w-4 h-4 text-purple-400 mr-2" />
                Lucro Bruto
              </h3>
              <div className="text-xl font-bold text-green-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(consolidatedMetrics.totalGrossProfit)}
              </div>
            </div>
          </div>

          {/* Tabela de dados por estratégia */}
          {isMultipleCSVs && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 text-blue-400 mr-2" />
                Análise por Estratégia
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-4 py-2 text-left">Estratégia</th>
                      <th className="px-4 py-2 text-center">Trades</th>
                      <th className="px-4 py-2 text-center">Taxa de Acerto</th>
                      <th className="px-4 py-2 text-center">Fator de Lucro</th>
                      <th className="px-4 py-2 text-right">Resultado</th>
                      <th className="px-4 py-2 text-right">Ganho Médio</th>
                      <th className="px-4 py-2 text-right">Perda Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(processedData).map(([strategyName, metrics]) => {
                      const profitFactor = metrics["Gross Loss"] > 0 ? 
                        metrics["Gross Profit"] / metrics["Gross Loss"] : 0;
                      
                      return (
                        <tr key={strategyName} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="px-4 py-3 font-medium">{strategyName}</td>
                          <td className="px-4 py-2 text-center">{metrics["Total Trades"] || 0}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              (metrics["Win Rate (%)"] || 0) >= 60 ? 'bg-green-900 text-green-300' : 
                              (metrics["Win Rate (%)"] || 0) >= 45 ? 'bg-yellow-900 text-yellow-300' : 
                              'bg-red-900 text-red-300'
                            }`}>
                              {(metrics["Win Rate (%)"] || 0).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              profitFactor >= 1.5 ? 'bg-green-900 text-green-300' : 
                              profitFactor >= 1.0 ? 'bg-yellow-900 text-yellow-300' : 
                              'bg-red-900 text-red-300'
                            }`}>
                              {profitFactor.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className={`font-medium ${(metrics["Net Profit"] || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(metrics["Net Profit"] || 0)}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="font-medium text-green-400">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(metrics["Average Win"] || 0)}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="font-medium text-red-400">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(metrics["Average Loss"] || 0)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
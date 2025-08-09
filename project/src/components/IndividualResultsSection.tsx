import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { MetricsDashboard } from './MetricsDashboard';
import type { FileResult } from '../types/backtest';

// Função auxiliar para converter dados do backtest para o formato do MetricsDashboard
const convertToMetricsDashboardFormat = (result: Record<string, unknown>) => {
  if (!result) return {};
  
  const metrics = result["Performance Metrics"] as Record<string, unknown>;
  if (!metrics) return {};
  
  // ✅ CORREÇÃO: Processar trades para calcular estatísticas corretas
  const trades = (result.trades as Array<Record<string, unknown>>) || [];
  console.log(`📊 Processando ${trades.length} trades para ${result.fileName as string || 'arquivo'}`);
  
  // Calcular estatísticas dos trades
  let profitableTrades = 0;
  let lossTrades = 0;
  let zeroTrades = 0;
  let totalPnL = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let maxWin = 0;
  let maxLoss = 0;
  
  trades.forEach((trade: Record<string, unknown>) => {
    const pnl = Number(trade.pnl) || 0;
    totalPnL += pnl;
    
    if (pnl > 0) {
      profitableTrades++;
      grossProfit += pnl;
      maxWin = Math.max(maxWin, pnl);
    } else if (pnl < 0) {
      lossTrades++;
      grossLoss += Math.abs(pnl);
      maxLoss = Math.max(maxLoss, Math.abs(pnl));
    } else {
      zeroTrades++;
    }
  });
  
  // Calcular médias
  const averageWin = profitableTrades > 0 ? grossProfit / profitableTrades : 0;
  const averageLoss = lossTrades > 0 ? grossLoss / lossTrades : 0;
  const averageTrade = trades.length > 0 ? totalPnL / trades.length : 0;
  
  console.log(`📊 Estatísticas calculadas:`, {
    totalTrades: trades.length,
    profitableTrades,
    lossTrades,
    zeroTrades,
    grossProfit,
    grossLoss,
    averageWin,
    averageLoss,
    maxWin,
    maxLoss
  });
  
  return {
    profitFactor: Number(metrics["Profit Factor"]) || 0,
    payoff: Number(metrics["Payoff"]) || 0,
    winRate: Number(metrics["Win Rate (%)"]) || 0,
    maxDrawdown: Number(metrics["Max Drawdown ($)"]) || 0,
    maxDrawdownAmount: Number(metrics["Max Drawdown ($)"]) || 0,
    netProfit: Number(metrics["Net Profit"]) || 0,
    grossProfit: grossProfit, // ✅ Usar valor calculado dos trades
    grossLoss: grossLoss,     // ✅ Usar valor calculado dos trades
    totalTrades: trades.length, // ✅ Usar número real de trades
    profitableTrades: profitableTrades, // ✅ Usar valor calculado
    lossTrades: lossTrades,   // ✅ Usar valor calculado
    averageWin: averageWin,   // ✅ Usar valor calculado
    averageLoss: averageLoss, // ✅ Usar valor calculado
    sharpeRatio: Number(metrics["Sharpe Ratio"]) || 0,
    recoveryFactor: Number(metrics["Recovery Factor"]) || 0,
    averageTrade: averageTrade, // ✅ Usar valor calculado
    averageTradeDuration: metrics["Time in Market"] as string,
    maxConsecutiveWins: metrics["Max Consecutive Wins"] as number,
    maxConsecutiveLosses: metrics["Max Consecutive Losses"] as number,
    maiorGanho: maxWin,       // ✅ Usar valor calculado
    maiorPerda: maxLoss       // ✅ Usar valor calculado
  };
};

interface IndividualResultsSectionProps {
  fileResults: Record<string, FileResult>;
  showIndividualResults: boolean;
  setShowIndividualResults: (show: boolean) => void;
}

export function IndividualResultsSection({
  fileResults,
  showIndividualResults,
  setShowIndividualResults
}: IndividualResultsSectionProps) {
  const [expandedFiles, setExpandedFiles] = useState<string[]>([]);

  const toggleFileExpansion = (fileName: string) => {
    setExpandedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (!fileResults || Object.keys(fileResults).length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-blue-500 bg-opacity-20 p-2 rounded-full mr-3">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="font-semibold text-lg text-white">
            Resultados Individuais ({Object.keys(fileResults).length} arquivos)
          </h3>
        </div>
        <button
          onClick={() => setShowIndividualResults(!showIndividualResults)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {showIndividualResults ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {showIndividualResults && (
        <div className="space-y-4">
          {Object.entries(fileResults).map(([fileName, result]) => {
            const hasError = (result as Record<string, unknown>).error !== undefined;
            const errorText = typeof (result as Record<string, unknown>).error === 'string'
              ? ((result as Record<string, unknown>).error as string)
              : (JSON.stringify((result as Record<string, unknown>).error ?? '') || '');
            const metrics = result["Performance Metrics"] as Record<string, unknown> | undefined;
            const info = result.info_arquivo as { total_registros?: number } | undefined;
            const sr = Number(metrics?.["Sharpe Ratio"]) || 0;
            
            return (
              <div key={fileName} className="bg-gray-700 rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-gray-600 p-2 rounded-full mr-3">
                      <FileText className="w-4 h-4 text-gray-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{fileName}</h4>
                      {info && (
                        <p className="text-sm text-gray-400">
                          {info.total_registros} registros
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFileExpansion(fileName)}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    {expandedFiles.includes(fileName) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {hasError ? (
                  <div className="bg-red-900 bg-opacity-20 border border-red-800 p-4 rounded-lg">
                    <p className="text-red-400 text-sm">{errorText}</p>
                  </div>
                ) : (
                  <>
                    {/* Métricas principais em cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                      {metrics && (
                        <>
                           <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                              <span className="text-xs text-gray-400">Lucro Líquido</span>
                            </div>
                             <p className={`text-lg font-semibold ${getPerformanceColor(Number(metrics["Net Profit"]) || 0)}`}>
                              {formatCurrency(Number(metrics["Net Profit"]) || 0)}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <BarChart3 className="w-4 h-4 text-blue-400 mr-1" />
                              <span className="text-xs text-gray-400">Total Trades</span>
                            </div>
                             <p className="text-lg font-semibold text-white">
                              {Number(metrics["Total Trades"]) || 0}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                              <span className="text-xs text-gray-400">Win Rate</span>
                            </div>
                             <p className="text-lg font-semibold text-green-400">
                              {formatPercentage(Number(metrics["Win Rate (%)"]) || 0)}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                              <span className="text-xs text-gray-400">Max Drawdown</span>
                            </div>
                             <p className="text-lg font-semibold text-red-400">
                              {formatCurrency(Number(metrics["Max Drawdown ($)"]) || 0)}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <BarChart3 className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-xs text-gray-400">Fator de Lucro</span>
                            </div>
                             <p className={`text-lg font-semibold ${(Number(metrics["Profit Factor"]) || 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                              {(Number(metrics["Profit Factor"]) || 0).toFixed(2)}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingUp className="w-4 h-4 text-purple-400 mr-1" />
                              <span className="text-xs text-gray-400">Sharpe Ratio</span>
                            </div>
                             <p className={`text-lg font-semibold ${sr >= 1 ? 'text-green-400' : sr >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {sr.toFixed(2)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                                         {/* Detalhes expandidos */}
                     {expandedFiles.includes(fileName) && (
                       <div className="bg-gray-800 rounded-lg p-4">
                         {(() => {
                           console.log(`📊 Trades para ${fileName}:`, result.trades?.length || 0);
                           console.log(`📊 Dados completos para ${fileName}:`, {
                             hasTrades: !!result.trades,
                             tradesLength: result.trades?.length || 0,
                             hasMetrics: !!result["Performance Metrics"],
                             metrics: result["Performance Metrics"]
                           });
                           return null;
                         })()}
                          <MetricsDashboard 
                           metrics={convertToMetricsDashboardFormat(result)}
                           tradeObject={{
                             trades: (result.trades || []).map((t: Record<string, unknown>) => ({
                               symbol: t.symbol as string | undefined,
                               entry_date: String(t.entry_date ?? t.date ?? ''),
                               exit_date: String(t.exit_date ?? t.entry_date ?? t.date ?? ''),
                               pnl: Number(t.pnl) || 0
                             }))
                           }}
                           showTitle={false}
                         />
                       </div>
                     )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 
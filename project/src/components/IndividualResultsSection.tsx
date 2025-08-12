import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { MetricsDashboard } from './MetricsDashboard';
import type { FileResult } from '../types/backtest';

// Função auxiliar para converter dados do backtest para o formato do MetricsDashboard
const convertToMetricsDashboardFormat = (result: Record<string, unknown>) => {
  if (!result) return {};
  
  const metrics = result["Performance Metrics"] as Record<string, unknown>;
  if (!metrics) return {};
  
  // Preferir sempre dados reais da API; usar trades apenas como fallback quando a API não retornar
  const trades = (result.trades as Array<Record<string, unknown>>) || [];
  console.log(`📊 Dados recebidos | trades: ${trades.length}`);

  // Fallbacks calculados APENAS se a API não trouxer
  let fallbackProfitableTrades = 0;
  let fallbackLossTrades = 0;
  let fallbackGrossProfit = 0;
  let fallbackGrossLoss = 0;
  let fallbackMaxWin = 0;
  let fallbackMaxLoss = 0;
  let fallbackTotalPnL = 0;

  if (trades.length > 0) {
  trades.forEach((trade: Record<string, unknown>) => {
    const pnl = Number(trade.pnl) || 0;
      fallbackTotalPnL += pnl;
    if (pnl > 0) {
        fallbackProfitableTrades++;
        fallbackGrossProfit += pnl;
        fallbackMaxWin = Math.max(fallbackMaxWin, pnl);
    } else if (pnl < 0) {
        fallbackLossTrades++;
        fallbackGrossLoss += Math.abs(pnl);
        fallbackMaxLoss = Math.max(fallbackMaxLoss, Math.abs(pnl));
      }
    });
  }
  const fallbackAverageWin = fallbackProfitableTrades > 0 ? fallbackGrossProfit / fallbackProfitableTrades : undefined;
  const fallbackAverageLoss = fallbackLossTrades > 0 ? fallbackGrossLoss / fallbackLossTrades : undefined;
  const fallbackAverageTrade = trades.length > 0 ? fallbackTotalPnL / trades.length : undefined;
  
  return {
    profitFactor: metrics["Profit Factor"] as number | undefined,
    payoff: metrics["Payoff"] as number | undefined,
    winRate: metrics["Win Rate (%)"] as number | undefined,
    maxDrawdown: metrics["Max Drawdown ($)"] as number | undefined,
    maxDrawdownAmount: metrics["Max Drawdown ($)"] as number | undefined,
    netProfit: metrics["Net Profit"] as number | undefined,
    grossProfit: (metrics["Gross Profit"] as number | undefined) ?? fallbackGrossProfit,
    grossLoss: (metrics["Gross Loss"] as number | undefined) ?? fallbackGrossLoss,
    totalTrades: (metrics["Total Trades"] as number | undefined) ?? (trades.length || undefined),
    profitableTrades:
      (metrics["Winning Trades"] as number | undefined) ??
      (metrics["Win Rate (%)"] !== undefined && ((metrics["Total Trades"] as number | undefined) ?? trades.length)
        ? Math.round(Number(metrics["Win Rate (%)"]) * Number(((metrics["Total Trades"] as number | undefined) ?? trades.length)) / 100)
        : (fallbackProfitableTrades || undefined)),
    lossTrades:
      (metrics["Losing Trades"] as number | undefined) ??
      (metrics["Win Rate (%)"] !== undefined && ((metrics["Total Trades"] as number | undefined) ?? trades.length)
        ? Math.max(0, Number(((metrics["Total Trades"] as number | undefined) ?? trades.length)) - Math.round(Number(metrics["Win Rate (%)"]) * Number(((metrics["Total Trades"] as number | undefined) ?? trades.length)) / 100))
        : (fallbackLossTrades || undefined)),
    averageWin: (metrics["Average Win"] as number | undefined) ?? fallbackAverageWin,
    averageLoss: (metrics["Average Loss"] as number | undefined) ?? fallbackAverageLoss,
    sharpeRatio: metrics["Sharpe Ratio"] as number | undefined,
    recoveryFactor: metrics["Recovery Factor"] as number | undefined,
    averageTrade: (metrics["Net Profit"] !== undefined && ((metrics["Total Trades"] as number | undefined) ?? trades.length)
      ? Number(metrics["Net Profit"]) / Number(((metrics["Total Trades"] as number | undefined) ?? trades.length) || 1)
      : fallbackAverageTrade),
    averageTradeDuration: metrics["Time in Market"] as string | undefined,
    maxConsecutiveWins: metrics["Max Consecutive Wins"] as number | undefined,
    maxConsecutiveLosses: metrics["Max Consecutive Losses"] as number | undefined,
    maiorGanho: (metrics["Max Trade Gain"] as number | undefined) ?? fallbackMaxWin,
    maiorPerda: (metrics["Max Trade Loss"] as number | undefined) ?? fallbackMaxLoss
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

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null || isNaN(Number(value))) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null || isNaN(Number(value))) return 'N/A';
    const v = Number(value);
    return `${v.toFixed(2)}%`;
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
                      {metrics && Object.keys(metrics).length > 0 ? (
                        <>
                           <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                              <span className="text-xs text-gray-400">Lucro Líquido</span>
                            </div>
                              <p className={`text-lg font-semibold ${getPerformanceColor(Number(metrics?.["Net Profit"]) || 0)}`}>
                              {formatCurrency(Number(metrics?.["Net Profit"]))}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <BarChart3 className="w-4 h-4 text-blue-400 mr-1" />
                              <span className="text-xs text-gray-400">Total Trades</span>
                            </div>
                             <p className="text-lg font-semibold text-white">
                              {metrics?.["Total Trades"] ?? 'N/A'}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                              <span className="text-xs text-gray-400">Win Rate</span>
                            </div>
                             <p className="text-lg font-semibold text-green-400">
                              {formatPercentage(Number(metrics?.["Win Rate (%)"]))}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                              <span className="text-xs text-gray-400">Max Drawdown</span>
                            </div>
                             <p className="text-lg font-semibold text-red-400">
                              {formatCurrency(Number(metrics?.["Max Drawdown ($)"]))}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <BarChart3 className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-xs text-gray-400">Fator de Lucro</span>
                            </div>
                              <p className={`text-lg font-semibold ${(Number(metrics?.["Profit Factor"]) || 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                              {isNaN(Number(metrics?.["Profit Factor"])) ? 'N/A' : Number(metrics?.["Profit Factor"]).toFixed(2)}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingUp className="w-4 h-4 text-purple-400 mr-1" />
                              <span className="text-xs text-gray-400">Sharpe Ratio</span>
                            </div>
                             <p className={`text-lg font-semibold ${sr >= 1 ? 'text-green-400' : sr >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {isNaN(sr) ? 'N/A' : sr.toFixed(2)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-full text-sm text-gray-400">Sem métricas disponíveis</div>
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
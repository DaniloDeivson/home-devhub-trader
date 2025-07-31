import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { MetricsDashboard } from './MetricsDashboard';

// Função auxiliar para converter dados do backtest para o formato do MetricsDashboard
const convertToMetricsDashboardFormat = (result: any) => {
  if (!result) return {};
  
  const metrics = result["Performance Metrics"];
  if (!metrics) return {};
  
  return {
    profitFactor: metrics["Profit Factor"],
    payoff: metrics["Payoff"],
    winRate: metrics["Win Rate (%)"],
    maxDrawdown: metrics["Max Drawdown ($)"],
    maxDrawdownAmount: metrics["Max Drawdown ($)"],
    netProfit: metrics["Net Profit"],
    grossProfit: metrics["Gross Profit"],
    grossLoss: metrics["Gross Loss"],
    totalTrades: metrics["Total Trades"],
    averageWin: metrics["Average Win"],
    averageLoss: metrics["Average Loss"],
    sharpeRatio: metrics["Sharpe Ratio"],
    recoveryFactor: metrics["Recovery Factor"],
    averageTrade: metrics["Average Trade"],
    averageTradeDuration: metrics["Time in Market"],
    maxConsecutiveWins: metrics["Max Consecutive Wins"],
    maxConsecutiveLosses: metrics["Max Consecutive Losses"]
  };
};

interface IndividualResultsSectionProps {
  fileResults: {[key: string]: any};
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
            const hasError = result.error;
            const metrics = result["Performance Metrics"];
            const info = result.info_arquivo;
            
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
                    <p className="text-red-400 text-sm">{result.error}</p>
                  </div>
                ) : (
                  <>
                    {/* Métricas principais em cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {metrics && (
                        <>
                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                              <span className="text-xs text-gray-400">Lucro Líquido</span>
                            </div>
                            <p className={`text-lg font-semibold ${getPerformanceColor(metrics["Net Profit"] || 0)}`}>
                              {formatCurrency(metrics["Net Profit"] || 0)}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <BarChart3 className="w-4 h-4 text-blue-400 mr-1" />
                              <span className="text-xs text-gray-400">Total Trades</span>
                            </div>
                            <p className="text-lg font-semibold text-white">
                              {metrics["Total Trades"] || 0}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                              <span className="text-xs text-gray-400">Win Rate</span>
                            </div>
                            <p className="text-lg font-semibold text-green-400">
                              {formatPercentage(metrics["Win Rate (%)"] || 0)}
                            </p>
                          </div>

                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center mb-1">
                              <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                              <span className="text-xs text-gray-400">Max Drawdown</span>
                            </div>
                            <p className="text-lg font-semibold text-red-400">
                              {formatCurrency(metrics["Max Drawdown ($)"] || 0)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                                         {/* Detalhes expandidos */}
                     {expandedFiles.includes(fileName) && (
                       <div className="bg-gray-800 rounded-lg p-4">
                         {console.log(`📊 Trades para ${fileName}:`, result.trades?.length || 0)}
                         <MetricsDashboard 
                           metrics={convertToMetricsDashboardFormat(result)}
                           tradeObject={{ trades: result.trades || [] }}
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
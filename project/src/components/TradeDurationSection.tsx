import React from 'react';
import { Clock, ChevronUp, ChevronDown, BarChart2 } from 'lucide-react';

interface TradeDurationSectionProps {
  showTradeDuration: boolean;
  setShowTradeDuration: (show: boolean) => void;
  backtestResult: any;
}

export function TradeDurationSection({
  showTradeDuration,
  setShowTradeDuration,
  backtestResult
}: TradeDurationSectionProps) {
  // Guard clause to prevent rendering if backtestResult is null
  if (!backtestResult) return null;
  
  // Function to calculate trade duration data from backtestResult
  const calculateTradeDurationData = () => {
    const trades = backtestResult?.trades || [];
    
    if (trades.length === 0) {
      return {
        averageDuration: '0h 0m',
        medianDuration: '0h 0m',
        maxDuration: '0h 0m',
        resultByDuration: []
      };
    }

    // Calculate duration for each trade
    const tradesWithDuration = trades.map((trade: any) => {
      const entryDate = new Date(trade.entry_date);
      const exitDate = new Date(trade.exit_date);
      const durationHours = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
      
      return {
        ...trade,
        durationHours: durationHours
      };
    });

    // Calculate basic duration statistics
    const durations = tradesWithDuration.map((t: any) => t.durationHours);
    const avgDuration = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
    const sortedDurations = [...durations].sort((a: number, b: number) => a - b);
    const medianDuration = sortedDurations[Math.floor(sortedDurations.length / 2)];
    const maxDuration = Math.max(...durations);

    // Format duration helper function
    const formatDuration = (hours: number) => {
      const h = Math.floor(hours);
      const m = Math.floor((hours - h) * 60);
      return `${h}h ${m}m`;
    };

    // Group trades by duration ranges
    const durationRanges = [
      { label: '< 15min', min: 0, max: 0.25 },
      { label: '15-30min', min: 0.25, max: 0.5 },
      { label: '30min - 1h', min: 0.5, max: 1 },
      { label: '1h - 2h', min: 1, max: 2 },
      { label: '2h - 4h', min: 2, max: 4 },
      { label: '4h - 9h', min: 4, max: 9 },
      { label: '9h - 24h', min: 9, max: 24 },
      { label: '24h - 72h', min: 24, max: 72},
      { label: '72h - 168h', min: 72, max: 168 },
      { label: '> 168h', min: 168, max: Infinity }
    ];

    const resultByDuration = durationRanges.map(range => {
      const rangeTradesData = tradesWithDuration.filter((t: any) => 
        t.durationHours >= range.min && t.durationHours < range.max
      );
      
      if (rangeTradesData.length === 0) {
        return {
          duration: range.label,
          result: 0,
          count: 0,
          profitFactor: 0,
          winRate: 0,
          payoff: 0
        };
      }

      const totalResult = rangeTradesData.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
      const winningTrades = rangeTradesData.filter((t: any) => (t.pnl || 0) > 0);
      const losingTrades = rangeTradesData.filter((t: any) => (t.pnl || 0) < 0);
      
      const winRate = (winningTrades.length / rangeTradesData.length) * 100;
      
      const grossProfit = winningTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
      const grossLoss = Math.abs(losingTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0));
      
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
      
      const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
      const payoff = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 999 : 0);

      return {
        duration: range.label,
        result: totalResult,
        count: rangeTradesData.length,
        profitFactor: profitFactor,
        winRate: winRate,
        payoff: payoff
      };
    }).filter(item => item.count > 0);

    return {
      averageDuration: formatDuration(avgDuration),
      medianDuration: formatDuration(medianDuration),
      maxDuration: formatDuration(maxDuration),
      resultByDuration: resultByDuration
    };
  };

  const tradeDurationData = calculateTradeDurationData();
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium">Duração dos Trades</h2>
        </div>
        <button 
          onClick={() => setShowTradeDuration(!showTradeDuration)}
          className="p-1.5 hover:bg-gray-700 rounded-md"
        >
          {showTradeDuration ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      
      {showTradeDuration && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Duração Média</p>
              <p className="text-xl font-bold">{tradeDurationData.averageDuration}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Duração Mediana</p>
              <p className="text-xl font-bold">{tradeDurationData.medianDuration}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Duração Máxima</p>
              <p className="text-xl font-bold">{tradeDurationData.maxDuration}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-3 text-gray-300">Resultado por Duração</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-3 py-2 text-left">Duração</th>
                    <th className="px-3 py-2 text-center">Trades</th>
                    <th className="px-3 py-2 text-center">Fator de Lucro</th>
                    <th className="px-3 py-2 text-center">Taxa de Acerto</th>
                    <th className="px-3 py-2 text-center">Payoff</th>
                    <th className="px-3 py-2 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeDurationData.resultByDuration.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="px-3 py-2">{item.duration}</td>
                      <td className="px-3 py-2 text-center">{item.count}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={
                          item.profitFactor >= 1.5 ? 'text-green-400' : 
                          item.profitFactor >= 1.0 ? 'text-yellow-400' : 
                          'text-red-400'
                        }>
                          {item.profitFactor.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={
                          item.winRate >= 60 ? 'text-green-400' : 
                          item.winRate >= 45 ? 'text-yellow-400' : 
                          'text-red-400'
                        }>
                          {item.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={
                          item.payoff >= 1.5 ? 'text-green-400' : 
                          item.payoff >= 1.0 ? 'text-yellow-400' : 
                          'text-red-400'
                        }>
                          {item.payoff.toFixed(2)}
                        </span>
                      </td>
                      <td className={`px-3 py-2 text-right ${item.result > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(item.result)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg">
            <div className="flex items-start">
              <BarChart2 className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-300 mb-2">Insights de Duração</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Trades entre 1-2 horas apresentam melhor resultado</li>
                  <li>• Operações muito curtas (menos de 30 min) tendem a ser negativas</li>
                  <li>• Período da manhã concentra maior volume e melhores resultados</li>
                  <li>• Trades no final do dia apresentam maior risco de perda</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
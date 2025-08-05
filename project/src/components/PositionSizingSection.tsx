import React from 'react';
import { BarChart3, ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';

interface PositionSizingSectionProps {
  showPositionSizing: boolean;
  setShowPositionSizing: (show: boolean) => void;
  backtestResult: any;
}

export function PositionSizingSection({
  showPositionSizing,
  setShowPositionSizing,
  backtestResult
}: PositionSizingSectionProps) {
  // Guard clause to prevent rendering if backtestResult is null
  if (!backtestResult) return null;
  
  // Função para detectar se é ação (4 letras + dígito) ou futuro
  const detectAssetType = (symbol: string): 'stock' | 'future' => {
    if (!symbol) return 'future';
    // Ações: 4 letras + dígito (ex: PETR4, VALE3, ITUB4)
    const stockPattern = /^[A-Z]{4}[0-9]$/;
    return stockPattern.test(symbol.toUpperCase()) ? 'stock' : 'future';
  };

  // Function to calculate position sizing data from backtestResult
  const calculatePositionSizingData = () => {
    const trades = backtestResult?.trades || [];
    
    if (!trades || trades.length === 0) {
      return {
        averagePosition: 0,
        medianPosition: 0,
        maxPosition: 0,
        maxSetupPerDay: 0,
        resultByPosition: [],
        unit: 'contratos'
      };
    }

    // Extract position sizes from trades, trying different possible field names
    const positionSizes = trades.map((trade: any) => {
      const positionSize = trade.quantity_total || trade.quantity_compra || trade.quantity_venda ||
                          trade.qty_buy || trade.qty_sell || trade.quantity || 
                          trade.qty || trade.quantity_buy || trade.quantity_sell ||
                          trade.position_size || trade.size || trade.volume || 0;
      return {
        ...trade,
        positionSize: Math.abs(positionSize)
      };
    }).filter((trade: any) => trade.positionSize > 0);

    if (positionSizes.length === 0) {
      return {
        averagePosition: 0,
        medianPosition: 0,
        maxPosition: 0,
        maxSetupPerDay: 0,
        resultByPosition: [],
        unit: 'contratos'
      };
    }

    // Determine unit based on most common asset type
    const assetTypes = positionSizes.map((trade: any) => detectAssetType(trade.symbol || ''));
    const stockCount = assetTypes.filter(type => type === 'stock').length;
    const unit = stockCount > assetTypes.length / 2 ? 'ações' : 'contratos';

    // Calculate basic statistics
    const positions = positionSizes.map((trade: any) => trade.positionSize);
    const averagePosition = positions.reduce((sum: number, pos: number) => sum + pos, 0) / positions.length;
    
    const sortedPositions = [...positions].sort((a: number, b: number) => a - b);
    const medianPosition = sortedPositions[Math.floor(sortedPositions.length / 2)];
    const maxPosition = Math.max(...positions);

    // Calculate max contracts per day
    const tradesByDate: { [key: string]: number } = {};
    positionSizes.forEach((trade: any) => {
      if (trade.entry_date) {
        const date = new Date(trade.entry_date).toDateString();
        tradesByDate[date] = (tradesByDate[date] || 0) + trade.positionSize;
      }
    });
    const maxSetupPerDay = Object.keys(tradesByDate).length > 0 ? Math.max(...Object.values(tradesByDate)) : 0;

    // Group trades by position ranges - more detailed for small positions
    const positionRanges = [
      { label: '1', min: 1, max: 1 },
      { label: '2', min: 2, max: 2 },
      { label: '3-5', min: 3, max: 5 },
      { label: '6-10', min: 6, max: 10 },
      { label: '11-20', min: 11, max: 20 },
      { label: '21-50', min: 21, max: 50 },
      { label: '51-100', min: 51, max: 100 },
      { label: '> 100', min: 101, max: Infinity }
    ];

    const resultByPosition = positionRanges.map(range => {
      const tradesInRange = positionSizes.filter((trade: any) => 
        trade.positionSize >= range.min && trade.positionSize <= range.max
      );
      
      const totalResult = tradesInRange.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0);
      const count = tradesInRange.length;
      const percentage = positions.length > 0 ? (count / positions.length) * 100 : 0;
      
      // Calculate additional metrics similar to trade duration section
      const winningTrades = tradesInRange.filter((trade: any) => (trade.pnl || 0) > 0);
      const losingTrades = tradesInRange.filter((trade: any) => (trade.pnl || 0) < 0);
      
      const totalWins = winningTrades.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0);
      const totalLosses = Math.abs(losingTrades.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0));
      
      const winRate = count > 0 ? (winningTrades.length / count) * 100 : 0;
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? 999 : 0);
      
      const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
      const payoff = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 999 : 0);
      
      return {
        position: range.label,
        result: totalResult,
        count: count,
        percentage: Math.round(percentage * 10) / 10,
        winRate: Math.round(winRate * 10) / 10,
        profitFactor: Math.round(profitFactor * 100) / 100,
        payoff: Math.round(payoff * 100) / 100
      };
    }).filter(item => item.count > 0);

    // Calculate additional parameters
    const totalVolume = positions.reduce((sum: number, pos: number) => sum + pos, 0);
    const standardDeviation = positions.length > 0 ? 
      Math.sqrt(positions.reduce((sum, pos) => sum + Math.pow(pos - averagePosition, 2), 0) / positions.length) : 0;
    
    // Risk concentration (percentage of total volume in largest position size)
    const largestPositionVolume = Math.max(...positions);
    const riskConcentration = totalVolume > 0 ? (largestPositionVolume / totalVolume) * 100 : 0;
    
    // Small positions ratio (1-2 contracts/shares)
    const smallPositions = positions.filter(pos => pos <= 2).length;
    const smallPositionsRatio = positions.length > 0 ? (smallPositions / positions.length) * 100 : 0;
    
    return {
      averagePosition: Math.round(averagePosition),
      medianPosition: Math.round(medianPosition),
      maxPosition: Math.round(maxPosition),
      maxSetupPerDay: Math.round(maxSetupPerDay),
      resultByPosition,
      unit,
      // Additional parameters
      totalVolume: Math.round(totalVolume),
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      riskConcentration: Math.round(riskConcentration * 10) / 10,
      smallPositionsRatio: Math.round(smallPositionsRatio * 10) / 10,
      totalTrades: positions.length,
      uniqueDays: Object.keys(tradesByDate).length
    };
  };

  const positionSizingData = calculatePositionSizingData();
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <BarChart3 className="w-5 h-5 text-green-400 mr-2" />
          <h2 className="text-lg font-medium">Dimensionamento de Posição</h2>
        </div>
        <button 
          onClick={() => setShowPositionSizing(!showPositionSizing)}
          className="p-1.5 hover:bg-gray-700 rounded-md"
        >
          {showPositionSizing ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      
      {!showPositionSizing ? (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Posição Média</p>
              <p className="text-xl font-bold">
                {positionSizingData.averagePosition.toLocaleString('pt-BR')} {positionSizingData.unit}
              </p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Mediana</p>
              <p className="text-xl font-bold">
                {positionSizingData.medianPosition.toLocaleString('pt-BR')} {positionSizingData.unit}
              </p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Máxima</p>
              <p className="text-xl font-bold">
                {positionSizingData.maxPosition.toLocaleString('pt-BR')} {positionSizingData.unit}
              </p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Giro médio diário</p>
              <p className="text-xl font-bold">
                {positionSizingData.maxSetupPerDay.toLocaleString('pt-BR')} {positionSizingData.unit}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Posição Média</p>
              <p className="text-xl font-bold">
                {positionSizingData.averagePosition.toLocaleString('pt-BR')} {positionSizingData.unit}
              </p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Mediana</p>
              <p className="text-xl font-bold">
                {positionSizingData.medianPosition.toLocaleString('pt-BR')} {positionSizingData.unit}
              </p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Máxima</p>
              <p className="text-xl font-bold">
                {positionSizingData.maxPosition.toLocaleString('pt-BR')} {positionSizingData.unit}
              </p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Giro médio diário</p>
              <p className="text-xl font-bold">
                {positionSizingData.maxSetupPerDay.toLocaleString('pt-BR')} {positionSizingData.unit}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-3 text-gray-300">
              Distribuição por {positionSizingData.unit === 'ações' ? 'Ações' : 'Contratos'}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-3 py-2 text-left">
                      {positionSizingData.unit === 'ações' ? 'Ações' : 'Contratos'}
                    </th>
                    <th className="px-3 py-2 text-center">Trades</th>
                    <th className="px-3 py-2 text-center">%</th>
                    <th className="px-3 py-2 text-center">Fator de Lucro</th>
                    <th className="px-3 py-2 text-center">Taxa de Acerto</th>
                    <th className="px-3 py-2 text-center">Payoff</th>
                    <th className="px-3 py-2 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {positionSizingData.resultByPosition.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="px-3 py-2 font-medium">{item.position}</td>
                      <td className="px-3 py-2 text-center">{item.count}</td>
                      <td className="px-3 py-2 text-center text-blue-400 font-medium">
                        {item.percentage}%
                      </td>
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
                      <td className={`px-3 py-2 text-right font-medium ${item.result > 0 ? 'text-green-400' : 'text-red-400'}`}>
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
          
          <div className="mt-4 p-3 bg-green-900 bg-opacity-20 border border-green-800 rounded-lg">
            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-300 mb-2">Insights de Posicionamento</h4>
                <ul className="text-sm text-green-200 space-y-1">
                  <li>• {positionSizingData.smallPositionsRatio}% das operações usam posições pequenas (≤2 {positionSizingData.unit})</li>
                  <li>• Desvio padrão de {positionSizingData.standardDeviation} indica {positionSizingData.standardDeviation < 2 ? 'baixa' : positionSizingData.standardDeviation < 5 ? 'moderada' : 'alta'} variação nos tamanhos</li>
                  <li>• Melhor performance por posição: {positionSizingData.resultByPosition.length > 0 ? positionSizingData.resultByPosition.reduce((best, current) => current.profitFactor > best.profitFactor ? current : best).position : 'N/A'} {positionSizingData.unit} com fator de lucro {positionSizingData.resultByPosition.length > 0 ? positionSizingData.resultByPosition.reduce((best, current) => current.profitFactor > best.profitFactor ? current : best).profitFactor.toFixed(2) : 'N/A'}</li>
                  <li>• Consistência: posições com taxa de acerto acima de 60% oferecem melhor estabilidade</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
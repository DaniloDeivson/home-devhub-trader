import { BarChart3, ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';

// Types for backtest input and computed output
type AssetType = 'stock' | 'future';
type UnitType = 'ações' | 'contratos';

interface BacktestTrade {
  symbol?: string;
  entry_date?: string | Date;
  pnl?: number;
  quantity_total?: number;
  quantity_compra?: number;
  quantity_venda?: number;
  qty_buy?: number;
  qty_sell?: number;
  quantity?: number;
  qty?: number;
  quantity_buy?: number;
  quantity_sell?: number;
  position_size?: number;
  size?: number;
  volume?: number;
  [key: string]: unknown;
}

type TradeWithPositionSize = BacktestTrade & { positionSize: number };

interface BacktestResult {
  trades?: BacktestTrade[];
}

interface PositionRange {
  label: string;
  min: number;
  max: number;
}

interface PositionRangeStats {
  position: string;
  result: number;
  count: number;
  percentage: number;
  winRate: number;
  profitFactor: number;
  payoff: number;
}

interface PositionSizingData {
  averagePosition: number;
  medianPosition: number;
  maxPosition: number;
  avgDailyTurnover: number; // Giro médio diário
  resultByPosition: PositionRangeStats[];
  unit: UnitType;
  totalVolume: number;
  standardDeviation: number;
  riskConcentration: number;
  smallPositionsRatio: number;
  totalTrades: number;
  uniqueDays: number;
}

interface PositionSizingSectionProps {
  showPositionSizing: boolean;
  setShowPositionSizing: (show: boolean) => void;
  backtestResult: BacktestResult | null;
}

export function PositionSizingSection({
  showPositionSizing,
  setShowPositionSizing,
  backtestResult
}: PositionSizingSectionProps) {
  const [selectedAsset, setSelectedAsset] = useState<string>('');

  // Robust symbol extractor (supports alternative keys and normalizes)
  const extractSymbol = (t: BacktestTrade): string => {
    const candidates = [
      t.symbol,
      (t as Record<string, unknown>)['asset'] as string | undefined,
      (t as Record<string, unknown>)['ativo'] as string | undefined,
      (t as Record<string, unknown>)['ticker'] as string | undefined,
      (t as Record<string, unknown>)['instrument'] as string | undefined,
    ];
    const raw = candidates.find((v) => typeof v === 'string' && v.trim().length > 0) || '';
    return String(raw).trim().toUpperCase();
  };
  
  const availableAssets: string[] = useMemo(() => {
    const trades: BacktestTrade[] = backtestResult?.trades ?? [];
    const symbols = trades
      .map((t: BacktestTrade) => extractSymbol(t))
      .filter((s: string) => s && s.trim().length > 0);
    return Array.from(new Set(symbols)).sort();
  }, [backtestResult?.trades]);
  
  // Função para detectar se é ação (4 letras + dígito) ou futuro
  const detectAssetType = (symbol: string): AssetType => {
    if (!symbol) return 'future';
    // Ações: 4 letras + dígito (ex: PETR4, VALE3, ITUB4)
    const stockPattern = /^[A-Z]{4}[0-9]$/;
    return stockPattern.test(symbol.toUpperCase()) ? 'stock' : 'future';
  };

  // Function to calculate position sizing data from backtestResult
  const calculatePositionSizingData = useCallback((): PositionSizingData => {
    const trades: BacktestTrade[] = backtestResult?.trades ?? [];
    const filteredTrades: BacktestTrade[] = selectedAsset
      ? trades.filter((t: BacktestTrade) => extractSymbol(t) === selectedAsset.trim().toUpperCase())
      : trades;
    
    // Helper: parse numbers robustly from strings like "1", "1.0", "1,0", "1 contrato"
    const parseNumeric = (value: unknown): number => {
      if (value == null) return 0;
      if (typeof value === 'number' && isFinite(value)) return value;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        const isParenNegative = /^\(.*\)$/.test(trimmed);
        const numericText = trimmed.replace(/[R$]|\s+/g, '');
        const match = numericText.match(/-?[0-9]+([.,][0-9]+)?/);
        if (!match) return 0;
        const normalized = match[0].replace(',', '.');
        let n = Number(normalized);
        if (isParenNegative) n = -Math.abs(n);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };

    // Helper: tamanho da posição com prioridade (sem somar lados, sem duplicar)
    // 1) Preferir campos de compra (qty_buy e variações, incluindo "Qtd Compra")
    // 2) Fallback para totais (quantity_total e variações)
    // 3) Fallback leve: variações genéricas de quantidade/tamanho (apenas o primeiro valor > 0)
    const extractPositionSize = (trade: BacktestTrade): number => {
      // 1) Chaves explícitas de compra
      const explicitBuyKeys = [
        'qty_buy', 'quantity_buy', 'Qtd Compra', 'QtdCompra',
        'qtd_compra', 'quantidade_compra', 'quantidade compra', 'qtd compra',
        'quantity_compra'
      ];
      for (const key of explicitBuyKeys) {
        if (key in trade) {
          const v = parseNumeric((trade as Record<string, unknown>)[key]);
          if (v > 0) return v;
        }
      }

      // 1b) Busca por regex de compra (caso a chave venha com variações)
      for (const key of Object.keys(trade)) {
        if (/qty.*buy|quantity.*buy|qtd[ _-]*compra|quantidade[ _-]*compra/i.test(key)) {
          const v = parseNumeric((trade as Record<string, unknown>)[key]);
          if (v > 0) return v;
        }
      }

      // 2) Nested scan em 1 nível para chaves de compra
      for (const [, v] of Object.entries(trade)) {
        if (v && typeof v === 'object') {
          const nested = v as Record<string, unknown>;
          for (const key of explicitBuyKeys) {
            if (key in nested) {
              const val = parseNumeric(nested[key]);
              if (val > 0) return val;
            }
          }
          // Regex de compra nas chaves aninhadas
          for (const nk of Object.keys(nested)) {
            if (/qty.*buy|quantity.*buy|qtd[ _-]*compra|quantidade[ _-]*compra/i.test(nk)) {
              const val = parseNumeric(nested[nk]);
              if (val > 0) return val;
            }
          }
        }
      }

      // 3) Fallback para totais
      const totalKeys = [
        'quantity_total', 'qtd_total', 'quantidade_total', 'quantity', 'qty'
      ];
      for (const key of totalKeys) {
        if (key in trade) {
          const v = parseNumeric((trade as Record<string, unknown>)[key]);
          if (v > 0) return v;
        }
      }

      // 3b) Totais aninhados (1 nível)
      for (const [, v] of Object.entries(trade)) {
        if (v && typeof v === 'object') {
          const nested = v as Record<string, unknown>;
          for (const key of totalKeys) {
            if (key in nested) {
              const val = parseNumeric(nested[key]);
              if (val > 0) return val;
            }
          }
        }
      }

      // 4) Fallback genérico (pegar o primeiro campo que pareça quantidade > 0)
      for (const key of Object.keys(trade)) {
        if (/^((?!sell|venda).)*(qty|quant|contrat|size|position|volume)/i.test(key)) {
          const v = parseNumeric((trade as Record<string, unknown>)[key]);
          if (v > 0) return v;
        }
      }
      // 4b) Genérico aninhado (1 nível)
      for (const [, v] of Object.entries(trade)) {
        if (v && typeof v === 'object') {
          const nested = v as Record<string, unknown>;
          for (const nk of Object.keys(nested)) {
            if (/^((?!sell|venda).)*(qty|quant|contrat|size|position|volume)/i.test(nk)) {
              const val = parseNumeric(nested[nk]);
              if (val > 0) return val;
            }
          }
        }
      }

      // 5) Último recurso: assumir 1 unidade quando não há campo de quantidade
      return 1;
    };

    // Helper: robust PnL extractor (handles numbers, strings and alternative keys)
    const extractPnl = (trade: BacktestTrade): number => {
      // Priority keys commonly seen across endpoints
      const pnlKeys = [
        'pnl', 'PnL', 'resultado', 'profit', 'net', 'net_profit', 'netProfit',
        'retorno', 'gain', 'result', 'resultado_trade'
      ];
      for (const key of pnlKeys) {
        if (key in trade) {
          const value = trade[key as keyof BacktestTrade];
          const parsed = parseNumeric(value);
          if (!isNaN(parsed)) return parsed;
        }
      }
      // As a last resort, deep-scan shallow nested objects for pnl-like fields
      const tryScanObject = (obj: unknown, depth = 0): number | undefined => {
        if (!obj || typeof obj !== 'object' || depth > 2) return undefined;
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          if (/pnl|profit|result|retorno|ganho|perda|net/i.test(k)) {
            const parsed = parseNumeric(v);
            if (!isNaN(parsed) && parsed !== 0) return parsed;
          }
          if (v && typeof v === 'object') {
            const nested = tryScanObject(v, depth + 1);
            if (nested !== undefined) return nested;
          }
        }
        return undefined;
      };
      const deep = tryScanObject(trade);
      if (deep !== undefined) return deep;
      return 0;
    };

    // Extract position sizes using robust extraction
    const positionSizes: TradeWithPositionSize[] = filteredTrades
      .map((trade: BacktestTrade) => {
        const positionSize = Math.abs(parseNumeric(extractPositionSize(trade)));
        return { ...trade, positionSize } as TradeWithPositionSize;
      })
      .filter((trade: TradeWithPositionSize): trade is TradeWithPositionSize => trade.positionSize > 0);

    // Removed unused intermediate counts/variables

    if (positionSizes.length === 0) {
      return {
        averagePosition: 0,
        medianPosition: 0,
        maxPosition: 0,
        avgDailyTurnover: 0,
        resultByPosition: [],
        unit: 'contratos',
        totalVolume: 0,
        standardDeviation: 0,
        riskConcentration: 0,
        smallPositionsRatio: 0,
        totalTrades: 0,
        uniqueDays: 0
      };
    }

    // Determine unit based on most common asset type
    const assetTypes: AssetType[] = positionSizes.map((trade: TradeWithPositionSize) =>
      detectAssetType(trade.symbol ?? '')
    );
    const stockCount = assetTypes.filter((type: AssetType) => type === 'stock').length;
    const unit: UnitType = stockCount > assetTypes.length / 2 ? 'ações' : 'contratos';

    // Calculate basic statistics
    const positions: number[] = positionSizes.map((trade: TradeWithPositionSize) => trade.positionSize);
    const averagePosition = positions.reduce((sum: number, pos: number) => sum + pos, 0) / positions.length;
    
    const sortedPositions = [...positions].sort((a: number, b: number) => a - b);
    const medianPosition = sortedPositions[Math.floor(sortedPositions.length / 2)];
    const maxPosition = Math.max(...positions);

    // Calculate Giro médio diário (qty_buy * 2 por dia, média entre dias). Fallback: Posição Média * 2
    const dailyBuyByDate: { [key: string]: number } = {};
    const makeDateKey = (value: unknown): string | null => {
      if (!value) return null;
      const d = new Date(String(value));
      if (!Number.isFinite(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    };
    const extractQtyBuy = (trade: BacktestTrade): number => {
      const buyKeys = [
        'qty_buy', 'quantity_buy', 'Qtd Compra', 'QtdCompra',
        'qtd_compra', 'quantidade_compra', 'quantidade compra', 'qtd compra',
        'quantity_compra'
      ];
      for (const key of buyKeys) {
        if (key in trade) {
          const v = parseNumeric((trade as Record<string, unknown>)[key]);
          if (v > 0) return v;
        }
      }
      // Regex fallback
      for (const key of Object.keys(trade)) {
        if (/qty.*buy|quantity.*buy|qtd[ _-]*compra|quantidade[ _-]*compra/i.test(key)) {
          const v = parseNumeric((trade as Record<string, unknown>)[key]);
          if (v > 0) return v;
        }
      }
      return 0;
    };
    const tradesByDate: { [key: string]: number } = {};
    positionSizes.forEach((trade: TradeWithPositionSize) => {
      const dateKey = makeDateKey(trade.entry_date || (trade as unknown as Record<string, unknown>)['date']);
      if (!dateKey) return;
      tradesByDate[dateKey] = (tradesByDate[dateKey] || 0) + trade.positionSize;
    });
    filteredTrades.forEach((trade: BacktestTrade) => {
      const dateKey = makeDateKey(trade.entry_date || (trade as unknown as Record<string, unknown>)['date'] || (trade as unknown as Record<string, unknown>)['Abertura'] || (trade as unknown as Record<string, unknown>)['datetime']);
      if (!dateKey) return;
      dailyBuyByDate[dateKey] = (dailyBuyByDate[dateKey] || 0) + extractQtyBuy(trade);
    });
    const dailyTurnoverValuesRaw: number[] = Object.values(dailyBuyByDate).map(v => v * 2);
    const dailyTurnoverValues = dailyTurnoverValuesRaw.filter(v => v > 0);
    const avgDailyTurnover = dailyTurnoverValues.length > 0
      ? dailyTurnoverValues.reduce((a, b) => a + b, 0) / dailyTurnoverValues.length
      : (averagePosition * 2);

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

    const resultByPosition: PositionRangeStats[] = positionRanges.map((range: PositionRange) => {
      const tradesInRange: TradeWithPositionSize[] = positionSizes.filter((trade: TradeWithPositionSize) =>
        trade.positionSize >= range.min && trade.positionSize <= range.max
      );
      
      const totalResult = tradesInRange.reduce((sum: number, trade: TradeWithPositionSize) => sum + extractPnl(trade), 0);
      const count = tradesInRange.length;
      const percentage = positions.length > 0 ? (count / positions.length) * 100 : 0;
      
      // Calculate additional metrics similar to trade duration section
      const winningTrades: TradeWithPositionSize[] = tradesInRange.filter((trade: TradeWithPositionSize) => extractPnl(trade) > 0);
      const losingTrades: TradeWithPositionSize[] = tradesInRange.filter((trade: TradeWithPositionSize) => extractPnl(trade) < 0);
      
      const totalWins = winningTrades.reduce((sum: number, trade: TradeWithPositionSize) => sum + extractPnl(trade), 0);
      const totalLosses = Math.abs(losingTrades.reduce((sum: number, trade: TradeWithPositionSize) => sum + extractPnl(trade), 0));
      
      const winRate = count > 0 ? (winningTrades.length / count) * 100 : 0;
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? 999 : 0);
      
      const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
      const payoff = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 999 : 0);
      
      const result: PositionRangeStats = {
        position: range.label,
        result: totalResult,
        count: count,
        percentage: Math.round(percentage * 10) / 10,
        winRate: Math.round(winRate * 10) / 10,
        profitFactor: Math.round(profitFactor * 100) / 100,
        payoff: Math.round(payoff * 100) / 100
      };
      
      return result;
    }).filter((item: PositionRangeStats) => item.count > 0);

    // Calculate additional parameters
    const totalVolume = positions.reduce((sum: number, pos: number) => sum + pos, 0);
    const standardDeviation = positions.length > 0
      ? Math.sqrt(
          positions.reduce((sum: number, pos: number) => sum + Math.pow(pos - averagePosition, 2), 0) / positions.length
        )
      : 0;
    
    // Risk concentration (percentage of total volume in largest position size)
    const largestPositionVolume = Math.max(...positions);
    const riskConcentration = totalVolume > 0 ? (largestPositionVolume / totalVolume) * 100 : 0;
    
    // Small positions ratio (1-2 contracts/shares)
    const smallPositions = positions.filter((pos: number) => pos <= 2).length;
    const smallPositionsRatio = positions.length > 0 ? (smallPositions / positions.length) * 100 : 0;
    
    return {
      averagePosition: Math.round(averagePosition),
      medianPosition: Math.round(medianPosition),
      maxPosition: Math.round(maxPosition),
      avgDailyTurnover: Math.round(avgDailyTurnover),
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
  }, [backtestResult?.trades, selectedAsset]);

  const positionSizingData = useMemo(() => calculatePositionSizingData(), [calculatePositionSizingData]);
  
  // Guard clause to prevent rendering if backtestResult is null
  if (!backtestResult) return null;
  
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
                {positionSizingData.avgDailyTurnover.toLocaleString('pt-BR')} {positionSizingData.unit}
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
                {positionSizingData.avgDailyTurnover.toLocaleString('pt-BR')} {positionSizingData.unit}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">
              Distribuição por {positionSizingData.unit === 'ações' ? 'Ações' : 'Contratos'}
            </h4>
            {availableAssets.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-400">Ativo:</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="bg-gray-700 text-sm text-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-600"
                >
                  <option value="">Todos</option>
                  {availableAssets.map((sym) => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
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
                    <td className="px-3 py-2 font-medium">
                      {item.position}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.count}
                    </td>
                    <td className="px-3 py-2 text-center text-blue-400 font-medium">
                      {`${item.percentage}%`}
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
                    <td className={`px-3 py-2 text-right font-medium ${item.result > 0 ? 'text-green-400' : item.result < 0 ? 'text-red-400' : 'text-gray-300'}`}>
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

export default PositionSizingSection;
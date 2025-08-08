/**
 * ✅ CONSOLIDAÇÃO DIRETA: Calcular drawdown consolidado diretamente dos fileResults
 * 
 * Esta função garante que estamos calculando drawdown consolidado cronológico
 * corretamente, sem passar por processamentos intermediários que podem corromper os dados.
 */

interface FileResult {
  trades: Array<{
    exit_date?: string;
    entry_date: string;
    pnl: number;
    symbol?: string;
    [key: string]: any;
  }>;
  "Performance Metrics": {
    "Net Profit": number;
    [key: string]: any;
  };
}

interface ConsolidatedMetrics {
  maxDrawdownAbsoluto: number;
  maxDrawdownPercent: number;
  peakMaximo: number;
  resultadoFinal: number;
  netProfitTotal: number;
  totalTrades: number;
}

export function calculateDirectConsolidation(
  fileResults: Record<string, FileResult>,
  selectedAsset?: string | null,
  timeRange: 'trade' | 'daily' | 'weekly' | 'monthly' = 'trade'
): ConsolidatedMetrics {
  
  // 1. ✅ Coletar TODAS as trades de TODAS as estratégias
  const allTrades: Array<{
    exit_date: string;
    pnl: number;
    strategy: string;
    symbol?: string;
  }> = [];
  
  let netProfitTotal = 0;
  let totalTrades = 0;
  
  Object.keys(fileResults).forEach(fileName => {
    const strategyData = fileResults[fileName];
    if (strategyData && strategyData.trades) {
      // Somar net profit das Performance Metrics
      if (strategyData["Performance Metrics"]) {
        netProfitTotal += strategyData["Performance Metrics"]["Net Profit"] || 0;
      }
      
      strategyData.trades.forEach((trade: any) => {
        // Filtrar por ativo se especificado
        if (selectedAsset && trade.symbol !== selectedAsset) {
          return;
        }
        
        allTrades.push({
          exit_date: (trade.exit_date || trade.entry_date).split('T')[0], // YYYY-MM-DD
          pnl: Number(trade.pnl) || 0,
          strategy: fileName,
          symbol: trade.symbol
        });
        totalTrades++;
      });
    }
  });
  

  
  if (allTrades.length === 0) {
    return {
      maxDrawdownAbsoluto: 0,
      maxDrawdownPercent: 0,
      peakMaximo: 0,
      resultadoFinal: 0,
      netProfitTotal: 0,
      totalTrades: 0
    };
  }
  
  // 2. ✅ Ordenar cronologicamente
  allTrades.sort((a, b) => new Date(a.exit_date).getTime() - new Date(b.exit_date).getTime());
  
  // 3. ✅ Consolidar por data/período
  const consolidatedByPeriod = new Map<string, {
    date: string;
    resultado: number;
    estrategias: Set<string>;
  }>();
  
  allTrades.forEach(trade => {
    let periodKey: string;
    const tradeDate = new Date(trade.exit_date);
    
    switch (timeRange) {
      case 'trade':
        // Para trade-by-trade, cada trade individual
        periodKey = `${trade.exit_date}_${Math.random()}`; // Único por trade
        break;
      case 'daily':
        periodKey = trade.exit_date; // YYYY-MM-DD
        break;
      case 'weekly':
        const weekStart = new Date(tradeDate);
        weekStart.setDate(tradeDate.getDate() - tradeDate.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        periodKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        periodKey = trade.exit_date;
    }
    
    if (!consolidatedByPeriod.has(periodKey)) {
      consolidatedByPeriod.set(periodKey, {
        date: trade.exit_date,
        resultado: 0,
        estrategias: new Set()
      });
    }
    
    const periodGroup = consolidatedByPeriod.get(periodKey)!;
    periodGroup.resultado += trade.pnl; // ✅ Somar resultados por período
    periodGroup.estrategias.add(trade.strategy);
  });
  
  // 4. ✅ Calcular drawdown consolidado cronológico CORRETO
  const sortedPeriods = Array.from(consolidatedByPeriod.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let cumsum = 0; // Equity acumulado
  let peak = 0;   // Pico máximo
  let maxDrawdownRaw = 0; // Maior drawdown (negativo)
  
  sortedPeriods.forEach((period, index) => {
    cumsum += period.resultado; // ✅ cumsum() consolidado
    
    if (cumsum > peak) {
      peak = cumsum; // ✅ cummax() consolidado
    }
    
    // ✅ drawdown = cumsum - peak (pode ser negativo)
    const drawdown = cumsum - peak;
    
    if (drawdown < maxDrawdownRaw) {
      maxDrawdownRaw = drawdown; // O mais negativo
    }
  });
  
  const maxDrawdownAbsoluto = Math.abs(maxDrawdownRaw);
  const maxDrawdownPercent = peak > 0 ? (maxDrawdownAbsoluto / peak) * 100 : 0;
  const resultadoFinal = cumsum;
  
  return {
    maxDrawdownAbsoluto,
    maxDrawdownPercent,
    peakMaximo: peak,
    resultadoFinal,
    netProfitTotal,
    totalTrades
  };
}
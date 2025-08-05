/**
 * ✅ METODOLOGIA EXATA DO PANDAS: Consolidação cronológica para múltiplos CSVs
 * 
 * Implementa EXATAMENTE a metodologia especificada:
 * 
 * ✅ 1. Organizar dados: DataFrame com data, estrategia, resultado
 * ✅ 2. Consolidar por data: df.groupby('data')['resultado'].sum()
 * ✅ 3. Lucro acumulado: df_consolidado['cumsum'] = df_consolidado['resultado'].cumsum()
 * ✅ 4. Máximo acumulado: df_consolidado['max_cumsum'] = df_consolidado['cumsum'].cummax()
 * ✅ 5. Drawdown: df_consolidado['drawdown'] = df_consolidado['cumsum'] - df_consolidado['max_cumsum']
 * 
 * Exemplo prático:
 * Data       | Estratégia | Resultado
 * 2025-01-01 | A          | 100
 * 2025-01-01 | B          | -50
 * 2025-01-02 | A          | -20
 * 2025-01-03 | A          | 200
 * 2025-01-03 | B          | -100
 * 
 * Após consolidação:
 * Data       | Resultado | Cumsum | Max_cumsum | Drawdown
 * 2025-01-01 | 50        | 50     | 50         | 0
 * 2025-01-02 | -20       | 30     | 50         | -20
 * 2025-01-03 | 100       | 130    | 130        | 0
 * 
 * Drawdown máximo: -20 (R$ 20,00 de perda em relação ao pico)
 */

interface Trade {
  exit_date?: string;
  entry_date: string;
  pnl: number;
  strategy?: string;
  [key: string]: any;
}

interface ConsolidatedPoint {
  fullDate: string;
  date: string;
  saldo: number;
  drawdown: number;
  drawdownPercent: number;
  peak: number;
  trades: number;
  trade_result?: number;
  resultado_periodo?: number;
  estrategias: string[];
  periodo?: string;
  isStart: boolean;
}

export function calculateConsolidatedDrawdown(
  sortedTrades: Trade[], 
  timeRange: 'trade' | 'daily' | 'weekly' | 'monthly'
): ConsolidatedPoint[] {
  console.log('🔧 CONSOLIDAÇÃO CRONOLÓGICA: Implementando metodologia correta para múltiplos CSVs');
  
  const alignedData: ConsolidatedPoint[] = [];
  
  if (timeRange === 'trade') {
    // ✅ 2. Consolidar resultados por data (trade-by-trade cronológico)
    const consolidatedByDate = new Map<string, { 
      date: string; 
      resultado: number; 
      trades: number; 
      estrategias: Set<string>; 
    }>();
    
    sortedTrades.forEach(trade => {
      const tradeDate = (trade.exit_date || trade.entry_date).split('T')[0]; // YYYY-MM-DD
      const estrategia = trade.strategy || 'default';
      
      if (!consolidatedByDate.has(tradeDate)) {
        consolidatedByDate.set(tradeDate, {
          date: tradeDate,
          resultado: 0,
          trades: 0,
          estrategias: new Set()
        });
      }
      
      const dateGroup = consolidatedByDate.get(tradeDate)!;
      dateGroup.resultado += trade.pnl; // ✅ Somar resultados de todas estratégias por data
      dateGroup.trades++;
      dateGroup.estrategias.add(estrategia);
    });
    
    // ✅ 3. Calcular lucro acumulado e drawdown cronológico
    const sortedDates = Array.from(consolidatedByDate.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let runningTotal = 0; // cumsum consolidado
    let peakTotal = 0; // máximo consolidado
    
    sortedDates.forEach((dateGroup, index) => {
      runningTotal += dateGroup.resultado; // ✅ cumsum() consolidado
      
      if (runningTotal > peakTotal) {
        peakTotal = runningTotal; // ✅ cummax() consolidado
      }
      
      // ✅ 4. Calcular drawdown EXATAMENTE como pandas
      // df_consolidado['drawdown'] = df_consolidado['cumsum'] - df_consolidado['max_cumsum']
      const drawdown = runningTotal - peakTotal; // ✅ Igual ao pandas: pode ser negativo
      const drawdownAbsoluto = Math.abs(drawdown); // Para exibição sempre positiva
      const drawdownPercentTotal = peakTotal > 0 ? (drawdownAbsoluto / peakTotal) * 100 : 0;
      
      if (index < 3) {
        console.log(`🔍 PANDAS METODOLOGIA - Data ${dateGroup.date}:`);
        console.log(`  📊 Estratégias: ${Array.from(dateGroup.estrategias).join(',')}`);
        console.log(`  📊 Resultado do dia: ${dateGroup.resultado}`);
        console.log(`  📊 Cumsum (equity): ${runningTotal}`);
        console.log(`  📊 Max_cumsum (peak): ${peakTotal}`);
        console.log(`  📊 Drawdown (cumsum - max_cumsum): ${drawdown}`);
        console.log(`  📊 Drawdown absoluto: ${drawdownAbsoluto}`);
      }
      
      alignedData.push({
        fullDate: dateGroup.date,
        date: dateGroup.date,
        saldo: runningTotal,
        drawdown: drawdownAbsoluto,
        drawdownPercent: drawdownPercentTotal,
        peak: peakTotal,
        trades: dateGroup.trades,
        trade_result: dateGroup.resultado,
        estrategias: Array.from(dateGroup.estrategias),
        isStart: index === 0
      });
    });
    
  } else {
    // ✅ Para daily/weekly/monthly: consolidação cronológica por período
    const consolidatedByPeriod = new Map<string, { 
      date: string; 
      resultado: number; 
      trades: number; 
      estrategias: Set<string>; 
    }>();
    
    sortedTrades.forEach(trade => {
      const tradeDate = new Date(trade.exit_date || trade.entry_date);
      const estrategia = trade.strategy || 'default';
      let periodKey: string;
      
      switch (timeRange) {
        case 'daily':
          periodKey = tradeDate.toISOString().split('T')[0]; // YYYY-MM-DD
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
          periodKey = tradeDate.toISOString().split('T')[0];
      }
      
      if (!consolidatedByPeriod.has(periodKey)) {
        consolidatedByPeriod.set(periodKey, {
          date: periodKey,
          resultado: 0,
          trades: 0,
          estrategias: new Set()
        });
      }
      
      const periodGroup = consolidatedByPeriod.get(periodKey)!;
      periodGroup.resultado += trade.pnl; // ✅ Somar resultados de todas estratégias por período
      periodGroup.trades++;
      periodGroup.estrategias.add(estrategia);
    });
    
    // ✅ 3. Calcular drawdown consolidado cronológico
    const sortedPeriods = Array.from(consolidatedByPeriod.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let runningTotal = 0; // cumsum consolidado
    let peakTotal = 0; // máximo consolidado
    
    sortedPeriods.forEach((period, index) => {
      runningTotal += period.resultado; // ✅ cumsum() consolidado
      
      if (runningTotal > peakTotal) {
        peakTotal = runningTotal; // ✅ cummax() consolidado
      }
      
      // ✅ 4. Calcular drawdown EXATAMENTE como pandas
      // df_consolidado['drawdown'] = df_consolidado['cumsum'] - df_consolidado['max_cumsum']
      const drawdown = runningTotal - peakTotal; // ✅ Igual ao pandas: pode ser negativo
      const drawdownAbsoluto = Math.abs(drawdown); // Para exibição sempre positiva
      const drawdownPercentTotal = peakTotal > 0 ? (drawdownAbsoluto / peakTotal) * 100 : 0;
      
      if (index < 3) {
        console.log(`🔍 PANDAS METODOLOGIA - Período ${period.date}:`);
        console.log(`  📊 Estratégias: ${Array.from(period.estrategias).join(',')}`);
        console.log(`  📊 Resultado do período: ${period.resultado}`);
        console.log(`  📊 Cumsum (equity): ${runningTotal}`);
        console.log(`  📊 Max_cumsum (peak): ${peakTotal}`);
        console.log(`  📊 Drawdown (cumsum - max_cumsum): ${drawdown}`);
        console.log(`  📊 Drawdown absoluto: ${drawdownAbsoluto}`);
      }
      
      alignedData.push({
        fullDate: period.date,
        date: period.date,
        saldo: runningTotal,
        drawdown: drawdownAbsoluto,
        drawdownPercent: drawdownPercentTotal,
        peak: peakTotal,
        trades: period.trades,
        resultado_periodo: period.resultado,
        estrategias: Array.from(period.estrategias),
        periodo: timeRange,
        isStart: index === 0
      });
    });
  }
  
  console.log(`✅ CONSOLIDAÇÃO CRONOLÓGICA CONCLUÍDA: ${alignedData.length} pontos processados`);
  if (alignedData.length > 0) {
    // ✅ Calcular drawdown máximo seguindo pandas: Math.min(...drawdowns) 
    // porque drawdown negativo indica perda em relação ao pico
    const allDrawdownsRaw = alignedData.map(p => p.saldo - p.peak); // cumsum - max_cumsum
    const maxDrawdownRaw = Math.min(...allDrawdownsRaw); // O mais negativo
    const maxDrawdownAbsoluto = Math.abs(maxDrawdownRaw); // Para exibição positiva
    
    console.log(`📊 Drawdown máximo consolidado (pandas): ${maxDrawdownRaw} → R$ ${maxDrawdownAbsoluto.toLocaleString()}`);
    console.log(`📊 Resultado final consolidado: R$ ${alignedData[alignedData.length - 1].saldo.toLocaleString()}`);
    console.log(`📊 Peak máximo atingido: R$ ${Math.max(...alignedData.map(p => p.peak)).toLocaleString()}`);
  }
  
  return alignedData;
}

/**
 * ✅ Calcular drawdown máximo seguindo metodologia pandas
 * 
 * @param consolidatedData - Dados já processados pela função calculateConsolidatedDrawdown
 * @returns Objeto com drawdown máximo e estatísticas
 */
export function getConsolidatedMaxDrawdown(consolidatedData: ConsolidatedPoint[]): {
  maxDrawdownRaw: number;
  maxDrawdownAbsoluto: number;
  maxDrawdownPercent: number;
  peakMaximo: number;
  resultadoFinal: number;
} {
  if (consolidatedData.length === 0) {
    return {
      maxDrawdownRaw: 0,
      maxDrawdownAbsoluto: 0,
      maxDrawdownPercent: 0,
      peakMaximo: 0,
      resultadoFinal: 0
    };
  }
  
  // ✅ Seguir pandas: drawdown = cumsum - max_cumsum (pode ser negativo)
  const allDrawdownsRaw = consolidatedData.map(p => p.saldo - p.peak); // cumsum - max_cumsum
  const maxDrawdownRaw = Math.min(...allDrawdownsRaw); // O mais negativo (maior perda)
  const maxDrawdownAbsoluto = Math.abs(maxDrawdownRaw); // Para exibição positiva
  
  const peakMaximo = Math.max(...consolidatedData.map(p => p.peak));
  const resultadoFinal = consolidatedData[consolidatedData.length - 1].saldo;
  const maxDrawdownPercent = peakMaximo > 0 ? (maxDrawdownAbsoluto / peakMaximo) * 100 : 0;
  
  console.log(`📊 PANDAS DD MÁXIMO: ${maxDrawdownRaw} (${maxDrawdownPercent.toFixed(2)}%)`);
  
  return {
    maxDrawdownRaw,
    maxDrawdownAbsoluto,
    maxDrawdownPercent,
    peakMaximo,
    resultadoFinal
  };
}
/**
 * 🧪 TESTE PRÁTICO: Demonstrar metodologia pandas funcionando
 * 
 * Este arquivo testa se nossa implementação está seguindo EXATAMENTE
 * a metodologia pandas especificada pelo usuário.
 */

import { calculateConsolidatedDrawdown, getConsolidatedMaxDrawdown } from './consolidatedDrawdown';

// ✅ Dados de exemplo exatamente como no exemplo pandas
const testTrades = [
  // Data 2025-01-01: Estratégia A (+100) + Estratégia B (-50) = +50
  { entry_date: '2025-01-01', exit_date: '2025-01-01', pnl: 100, strategy: 'A' },
  { entry_date: '2025-01-01', exit_date: '2025-01-01', pnl: -50, strategy: 'B' },
  
  // Data 2025-01-02: Estratégia A (-20) = -20
  { entry_date: '2025-01-02', exit_date: '2025-01-02', pnl: -20, strategy: 'A' },
  
  // Data 2025-01-03: Estratégia A (+200) + Estratégia B (-100) = +100
  { entry_date: '2025-01-03', exit_date: '2025-01-03', pnl: 200, strategy: 'A' },
  { entry_date: '2025-01-03', exit_date: '2025-01-03', pnl: -100, strategy: 'B' },
];

export function runConsolidationTest() {
  console.log('🧪 TESTE PANDAS CONSOLIDATION');
  console.log('================================');
  
  console.log('📊 Dados de entrada (trades individuais):');
  testTrades.forEach(trade => {
    console.log(`  ${trade.exit_date} | Estratégia ${trade.strategy} | R$ ${trade.pnl}`);
  });
  
  console.log('\n🔄 Processando consolidação...');
  const consolidatedData = calculateConsolidatedDrawdown(testTrades, 'trade');
  
  console.log('\n📊 Resultado esperado (pandas):');
  console.log('Data       | Resultado | Cumsum | Max_cumsum | Drawdown');
  console.log('2025-01-01 | 50        | 50     | 50         | 0');
  console.log('2025-01-02 | -20       | 30     | 50         | -20');
  console.log('2025-01-03 | 100       | 130    | 130        | 0');
  
  console.log('\n📊 Resultado obtido (nossa implementação):');
  console.log('Data       | Resultado | Cumsum | Max_cumsum | Drawdown');
  consolidatedData.forEach(point => {
    const drawdownRaw = point.saldo - point.peak; // cumsum - max_cumsum
    console.log(`${point.date} | ${point.trade_result?.toString().padStart(9)} | ${point.saldo.toString().padStart(6)} | ${point.peak.toString().padStart(10)} | ${drawdownRaw.toString().padStart(8)}`);
  });
  
  console.log('\n📊 Estatísticas finais:');
  const maxDD = getConsolidatedMaxDrawdown(consolidatedData);
  console.log(`  Drawdown máximo: ${maxDD.maxDrawdownRaw} (R$ ${maxDD.maxDrawdownAbsoluto})`);
  console.log(`  Percentual: ${maxDD.maxDrawdownPercent.toFixed(2)}%`);
  console.log(`  Peak máximo: R$ ${maxDD.peakMaximo}`);
  console.log(`  Resultado final: R$ ${maxDD.resultadoFinal}`);
  
  console.log('\n✅ VALIDAÇÃO:');
  console.log(`  Esperado: Drawdown máximo = -20`);
  console.log(`  Obtido: Drawdown máximo = ${maxDD.maxDrawdownRaw}`);
  console.log(`  Status: ${maxDD.maxDrawdownRaw === -20 ? '✅ CORRETO' : '❌ INCORRETO'}`);
  
  return consolidatedData;
}

// Para testar no console do navegador:
// import { runConsolidationTest } from './src/utils/testConsolidation';
// runConsolidationTest();
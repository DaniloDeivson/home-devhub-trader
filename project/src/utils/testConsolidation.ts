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
  const consolidatedData = calculateConsolidatedDrawdown(testTrades, 'trade');
  const maxDD = getConsolidatedMaxDrawdown(consolidatedData);
  
  return {
    consolidatedData,
    maxDrawdown: maxDD.maxDrawdownRaw,
    maxDrawdownAmount: maxDD.maxDrawdownAbsoluto,
    maxDrawdownPercent: maxDD.maxDrawdownPercent,
    peakMaximo: maxDD.peakMaximo,
    resultadoFinal: maxDD.resultadoFinal,
    isValid: maxDD.maxDrawdownRaw === -20
  };
}

// Para testar no console do navegador:
// import { runConsolidationTest } from './src/utils/testConsolidation';
// runConsolidationTest();
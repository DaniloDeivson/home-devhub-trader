import { useState, useEffect } from "react";
import {
  BarChart2,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Award,
  DollarSign
} from "lucide-react";
import { calculateDirectConsolidation } from '../utils/directConsolidation';

interface MetricsDashboardProps {
  tradeObject: {
    trades: Array<{
      symbol?: string;
      entry_date: string;
      exit_date: string;
      pnl: number;
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
    }>;
    file?: File;
  };
  showTitle?: boolean;
  fileResults?: { [key: string]: unknown } | null; // Adicionado para múltiplos CSVs
  metrics: {
    profitFactor?: number;
    payoff?: number;
    winRate?: number;
    maxDrawdown?: number;
    maxDrawdownAmount?: number;
    maxConsecutiveLosses?: number;
    maxConsecutiveWins?: number;
    sharpeRatio?: number;
    netProfit?: number;
    grossProfit?: number;
    grossLoss?: number;
    totalTrades?: number;
    profitableTrades?: number;
    lossTrades?: number;
    averageWin?: number;
    averageLoss?: number;
    recoveryFactor?: number;
    averageTrade?: number;
    averageTradeDuration?: string;
    dayOfWeekAnalysis?: Record<
      string,
      { trades: number; winRate: number; profitFactor: number }
    >;
    monthlyAnalysis?: Record<
      string,
      { trades: number; winRate: number; profitFactor: number }
    >;
    stopIdealPorDia?: number;
    resultadoDiasFuria?: number;
    numeroDiasFuria?: number;
    maiorGanho?: number;
    maiorPerda?: number;
    operacoesMaximasPorDia?: number;
    setupsMaximosPorDia?: number;
    mediaOperacoesDia?: number;
    riscoPorTrade?: number;
    capitalEmRisco?: number;
    posicaoRecomendada?: number;
    exposicaoMaxima?: number;
  };
}

export function MetricsDashboard({ metrics, tradeObject, fileResults, showTitle = true }: MetricsDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, unknown>>({});
  
  // ✅ CORREÇÃO: Consolidar trades de múltiplos CSVs
  const trade = (() => {
    // Se temos fileResults (múltiplos CSVs), consolidar todos os trades
    if (fileResults && Object.keys(fileResults).length > 0) {
      console.log('📊 MÚLTIPLOS CSVs: Consolidando trades para MetricsDashboard');
      const allTrades: unknown[] = [];
      
      Object.keys(fileResults).forEach(fileName => {
        const strategyData = fileResults[fileName] as { trades?: unknown[] };
        if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
          allTrades.push(...strategyData.trades);
        }
      });
      
      console.log(`📊 Consolidados ${allTrades.length} trades de ${Object.keys(fileResults).length} CSVs`);
      
      // ✅ DEBUG: Verificar se há trades com perda
      const losingTrades = allTrades.filter(t => ((t as { pnl?: number }).pnl || 0) < 0);
      const winningTrades = allTrades.filter(t => ((t as { pnl?: number }).pnl || 0) > 0);
      console.log(`📊 Trades com perda: ${losingTrades.length}`);
      console.log(`📊 Trades lucrativos: ${winningTrades.length}`);
      console.log(`📊 Total de trades: ${allTrades.length}`);
      
      return allTrades;
    } else {
      // Usar trades do tradeObject (arquivo único)
      return tradeObject?.trades || [];
    }
  })();

  // Animate metrics when they change
  useEffect(() => {
    // Set default values for metrics that might be missing with proper null checks
    const safeMetrics = metrics || {};

    // 🎯 LÓGICA CORRETA PARA DRAWDOWN:
    // Para múltiplos CSVs: Usa calculateDirectConsolidation() para calcular drawdown consolidado
    // Para CSV único: Usa dados da API (backtestResult["Performance Metrics"]["Max Drawdown ($)"])
    
    let maxDrawdownAmount = Number(safeMetrics.maxDrawdownAmount) || 0;
    let maxDrawdown = Number(safeMetrics.maxDrawdown) || 0;
    
    if (fileResults && Object.keys(fileResults).length > 1) {
      console.log('🔧 MÚLTIPLOS CSVs: Calculando drawdown consolidado com calculateDirectConsolidation()');
      
      try {
        const consolidatedDD = calculateDirectConsolidation(fileResults);
        console.log('✅ Drawdown consolidado calculado:', consolidatedDD);
        
        if (consolidatedDD && consolidatedDD.maxDrawdownAbsoluto > 0) {
          maxDrawdownAmount = consolidatedDD.maxDrawdownAbsoluto;
          
          // ✅ CORREÇÃO CRÍTICA: Calcular drawdown percent baseado no capital inicial
          const capitalInicial = 100000; // Valor padrão (mesmo do EquityCurveSection)
          maxDrawdown = capitalInicial > 0 ? (consolidatedDD.maxDrawdownAbsoluto / capitalInicial) * 100 : 0;
          
          console.log('✅ Usando drawdown consolidado:', { 
            maxDrawdownAmount, 
            maxDrawdown,
            capitalInicial,
            formula: `(${consolidatedDD.maxDrawdownAbsoluto} / ${capitalInicial}) * 100 = ${maxDrawdown.toFixed(2)}%`
          });
        }
      } catch (error) {
        console.error('❌ Erro ao calcular drawdown consolidado:', error);
      }
    } else {
      console.log('✅ CSV ÚNICO: Usando drawdown da API');
      
      // ✅ CORREÇÃO CRÍTICA: Para CSV único também calcular baseado no capital inicial
      const capitalInicial = 100000; // Valor padrão (mesmo do EquityCurveSection)
      if (maxDrawdownAmount > 0) {
        maxDrawdown = capitalInicial > 0 ? (maxDrawdownAmount / capitalInicial) * 100 : 0;
        console.log('✅ CSV ÚNICO - Drawdown percent calculado:', {
          maxDrawdownAmount,
          maxDrawdown,
          capitalInicial,
          formula: `(${maxDrawdownAmount} / ${capitalInicial}) * 100 = ${maxDrawdown.toFixed(2)}%`
        });
      }
    }

    const metricsWithDefaults = {
      profitFactor: Number(safeMetrics.profitFactor) || 0,
      sharpeRatio: Number(safeMetrics.sharpeRatio) || 0,
      recoveryFactor: Number(safeMetrics.recoveryFactor) || 0,
      averageTradeDuration: safeMetrics.averageTradeDuration || "N/A",
      maxConsecutiveWins: Number(safeMetrics.maxConsecutiveWins) || 0,
      maxConsecutiveLosses: Number(safeMetrics.maxConsecutiveLosses) || 0,
      payoff: Number(safeMetrics.payoff) || 0,
      totalTrades: Number(safeMetrics.totalTrades) || 0,
      profitableTrades: Number(safeMetrics.profitableTrades) || 0,
      lossTrades: Number(safeMetrics.lossTrades) || 0,
      averageWin: Number(safeMetrics.averageWin) || 0,
      averageLoss: Number(safeMetrics.averageLoss) || 0,
      netProfit: Number(safeMetrics.netProfit) || 0,
      maxDrawdown: maxDrawdown,
      maxDrawdownAmount: maxDrawdownAmount,
      averageTrade: Number(safeMetrics.averageTrade) || 0,
      winRate: Number(safeMetrics.winRate) || 0,
      grossProfit: Number(safeMetrics.grossProfit) || 0,
      grossLoss: Number(safeMetrics.grossLoss) || 0,
      // Métricas complementares
      stopIdealPorDia: Number(safeMetrics.stopIdealPorDia) || 120,
      resultadoDiasFuria: Number(safeMetrics.resultadoDiasFuria) || -1250.5,
      numeroDiasFuria: Number(safeMetrics.numeroDiasFuria) || 3,
      maiorGanho: Number(safeMetrics.maiorGanho) || 0,
      maiorPerda: Number(safeMetrics.maiorPerda) || 0,
      operacoesMaximasPorDia: Number(safeMetrics.operacoesMaximasPorDia) || 12,
      setupsMaximosPorDia: Number(safeMetrics.setupsMaximosPorDia) || 8,
      mediaOperacoesDia: Number(safeMetrics.mediaOperacoesDia) || 0,
      riscoPorTrade: Number(safeMetrics.riscoPorTrade) || 2.00,
      capitalEmRisco: Number(safeMetrics.capitalEmRisco) || 0.00,
      posicaoRecomendada: Number(safeMetrics.posicaoRecomendada) || 0,
      exposicaoMaxima: Number(safeMetrics.exposicaoMaxima) || 0.00,

      // Safe handling of analysis objects
      dayOfWeekAnalysis: safeMetrics.dayOfWeekAnalysis || {},
      monthlyAnalysis: safeMetrics.monthlyAnalysis || {},

      // Safe handling of best/worst day/month
      bestDay: safeMetrics.bestDay || null,
      worstDay: safeMetrics.worstDay || null,
      bestMonth: safeMetrics.bestMonth || null,
      worstMonth: safeMetrics.worstMonth || null,
    };

    setAnimatedMetrics(metricsWithDefaults);
  }, [metrics]);

  const getMetricColor = (metric: string, value: number): string => {
    if (isNaN(value) || value === null || value === undefined)
      return "text-gray-300";

    switch (metric) {
      case "profitFactor":
        return value >= 1.5
          ? "text-green-500"
          : value >= 1.0
          ? "text-yellow-500"
          : "text-red-500";
      case "payoff":
        return value >= 1.5
          ? "text-green-500"
          : value >= 1.0
          ? "text-yellow-500"
          : "text-red-500";
      case "winRate":
        return value >= 60
          ? "text-green-500"
          : value >= 45
          ? "text-yellow-500"
          : "text-red-500";
      case "maxDrawdown":
        return value <= 10
          ? "text-green-500"
          : value <= 20
          ? "text-yellow-500"
          : "text-red-500";
      case "sharpeRatio":
        return value >= 1.0
          ? "text-green-500"
          : value >= 0.5
          ? "text-yellow-500"
          : "text-red-500";
      case "recoveryFactor":
        return value >= 3
          ? "text-green-500"
          : value >= 1
          ? "text-yellow-500"
          : "text-red-500";
      case "netProfit":
        return value > 0
          ? "text-green-500"
          : value === 0
          ? "text-gray-300"
          : "text-red-500";
      default:
        return "text-gray-300";
    }
  };

  const formatMetric = (
    value: number | undefined,
    isPercentage = false,
    isCurrency = false
  ): string => {
    if (value === undefined || value === null || isNaN(Number(value)))
      return "N/A";

    const numValue = Number(value);

    if (isCurrency) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numValue);
    }

    return isPercentage ? `${numValue.toFixed(2)}%` : numValue.toFixed(2);
  };

  const tradesLucrativos = trade.filter(
    (trade: unknown) => (
      ((trade as { pnl?: number }).pnl || 0) > 0
      
    )
  )

  const tradesLoss = trade.filter(
    (trade: unknown) => (
      ((trade as { pnl?: number }).pnl || 0) < 0
    )
  )

  const tradesNull = trade.filter(
    (trade: unknown) => (
      ((trade as { pnl?: number }).pnl || 0) === 0
    )
  )
  const maiorGanho = Math.max(...trade.map((trade: unknown) => ((trade as { pnl?: number }).pnl || 0)));
  const maiorPerda = Math.min(...trade.map((trade: unknown) => ((trade as { pnl?: number }).pnl || 0)));

// ✅ DEBUG: Verificar estatísticas calculadas
console.log('📊 DEBUG - Estatísticas de Trades:');
console.log(`  📊 Total de trades: ${trade.length}`);
console.log(`  📊 Trades lucrativos: ${tradesLucrativos.length}`);
console.log(`  📊 Trades com perda: ${tradesLoss.length}`);
console.log(`  📊 Trades zerados: ${tradesNull.length}`);
console.log(`  📊 Maior ganho: ${maiorGanho}`);
console.log(`  📊 Maior perda: ${maiorPerda}`);

// ✅ DEBUG: Verificar dados do animatedMetrics para arquivo único
if (!fileResults || Object.keys(fileResults).length <= 1) {
  console.log('📊 DEBUG - Dados do animatedMetrics (arquivo único):');
  console.log(`  📊 Total de trades: ${animatedMetrics.totalTrades as number || 0}`);
  console.log(`  📊 Trades lucrativos: ${animatedMetrics.profitableTrades as number || 0}`);
  console.log(`  📊 Trades com perda: ${animatedMetrics.lossTrades as number || 0}`);
  console.log(`  📊 Trades zerados: ${(animatedMetrics.totalTrades as number || 0) - (animatedMetrics.profitableTrades as number || 0) - (animatedMetrics.lossTrades as number || 0)}`);
  
  console.log('📊 DEBUG - Métricas Avançadas (arquivo único):');
  console.log(`  📊 Maior Ganho (API): ${animatedMetrics.maiorGanho as number || 0}`);
  console.log(`  📊 Maior Perda (API): ${animatedMetrics.maiorPerda as number || 0}`);
  console.log(`  📊 Ganho Bruto (API): ${animatedMetrics.grossProfit as number || 0}`);
  console.log(`  📊 Perda Bruta (API): ${animatedMetrics.grossLoss as number || 0}`);
  console.log(`  📊 Trade Médio (calculado): ${((animatedMetrics.averageWin as number || 0) - Math.abs(animatedMetrics.averageLoss as number || 0))}`);
}

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      {showTitle && (
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center">
          <BarChart2 className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium">Métricas de Performance</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-800 rounded-full"
        >
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      )}

      {/* Dashboard Content */}
      {!isCollapsed && (
        <div className="p-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {/* Net Profit */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Lucro Líquido</p>
              <p
                className={`text-3xl font-bold ${getMetricColor(
                  "netProfit",
                  animatedMetrics.netProfit as number || 0
                )}`}
              >
                {formatMetric(animatedMetrics.netProfit as number || 0, false, true)}
              </p>
            </div>

            {/* Max Drawdown */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Drawdown Máximo R$</p>
              <p className="text-3xl font-bold text-red-500">
                {formatMetric(animatedMetrics.maxDrawdownAmount as number || 0, false, true)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatMetric(animatedMetrics.maxDrawdown as number || 0, true)} do capital
              </p>
            </div>

            {/* Total Trades */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total de Trades</p>
              <p className="text-3xl font-bold">
                {trade.length > 0 ? trade.length : (metrics?.totalTrades ?? 0)}
              </p>
            </div>

            {/* Profit Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Lucro</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "profitFactor",
                  animatedMetrics.profitFactor as number || 0
                )}`}
              >
                {formatMetric(animatedMetrics.profitFactor as number || 0)}
              </p>
            </div>

            {/* Payoff */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Payoff</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "payoff",
                  animatedMetrics.payoff as number || 0
                )}`}
              >
                {formatMetric(animatedMetrics.payoff as number || 0)}
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Sharpe Ratio</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "sharpeRatio",
                  animatedMetrics.sharpeRatio as number || 0
                )}`}
              >
                {formatMetric(animatedMetrics.sharpeRatio as number || 0)}
              </p>
            </div>

            {/* Recovery Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Recuperação</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "recoveryFactor",
                  animatedMetrics.recoveryFactor as number || 0
                )}`}
              >
                {formatMetric(animatedMetrics.recoveryFactor as number || 0)}
              </p>
            </div>

            {/* Win Rate */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Taxa de Acerto</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "winRate",
                  animatedMetrics.winRate as number || 0
                )}`}
              >
                {formatMetric(animatedMetrics.winRate as number || 0, true)}
              </p>
            </div>
          </div>

          {/* Trade Statistics and Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 text-blue-400 mr-2" />
                Estatísticas de Trades
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Total de Trades</td>
                    <td className="py-2 text-right">
                      {/* ✅ CORREÇÃO: Para arquivo único, usar animatedMetrics; para múltiplos, usar trade.length */}
                      {fileResults && Object.keys(fileResults).length > 1 
                        ? trade.length 
                        : (animatedMetrics.totalTrades as number || 0)
                      }
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right text-green-500">
                      {/* ✅ CORREÇÃO: Para arquivo único, usar animatedMetrics; para múltiplos, usar tradesLucrativos */}
                      {fileResults && Object.keys(fileResults).length > 1 
                        ? tradesLucrativos.length 
                        : (animatedMetrics.profitableTrades as number || 0)
                      }
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right text-red-500">
                      {/* ✅ CORREÇÃO: Para arquivo único, usar animatedMetrics; para múltiplos, usar tradesLoss */}
                      {fileResults && Object.keys(fileResults).length > 1 
                        ? tradesLoss.length 
                        : (animatedMetrics.lossTrades as number || 0)
                      }
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Zerados</td>
                    <td className="py-2 text-right text-white">
                      {/* ✅ CORREÇÃO: Para arquivo único, usar animatedMetrics; para múltiplos, usar tradesNull */}
                      {fileResults && Object.keys(fileResults).length > 1 
                        ? tradesNull.length 
                        : (animatedMetrics.totalTrades as number - (animatedMetrics.profitableTrades as number || 0) - (animatedMetrics.lossTrades as number || 0) || 0)
                      }
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Médio</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(animatedMetrics.averageWin as number || 0, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Média</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(
                        Math.abs(animatedMetrics.averageLoss as number || 0),
                        false,
                        true
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">
                      Máx. Perdas Consecutivas
                    </td>
                    <td className="py-2 text-right">
                      {animatedMetrics.maxConsecutiveLosses as number || "0"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">
                      Máx. Ganhos Consecutivos
                    </td>
                    <td className="py-2 text-right text-green-500">
                      {animatedMetrics.maxConsecutiveWins as number || "0"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Award className="w-4 h-4 text-blue-400 mr-2" />
                Métricas Avançadas
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trade Médio</td>
                    <td className="py-2 text-right">
                    {formatMetric(((animatedMetrics.averageWin as number || 0) - Math.abs(animatedMetrics.averageLoss as number || 0)), false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Ganho</td>
                    <td className="py-2 text-right text-green-500">
                      {/* ✅ CORREÇÃO: Para arquivo único, usar animatedMetrics; para múltiplos, usar maiorGanho calculado */}
                      {fileResults && Object.keys(fileResults).length > 1 
                        ? formatMetric(maiorGanho, false, true)
                        : formatMetric(animatedMetrics.maiorGanho as number || 0, false, true)
                      }
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Perda</td>
                    <td className="py-2 text-right text-red-500">
                      {/* ✅ CORREÇÃO: Para arquivo único, usar animatedMetrics; para múltiplos, usar maiorPerda calculado */}
                      {fileResults && Object.keys(fileResults).length > 1 
                        ? formatMetric(maiorPerda, false, true)
                        : formatMetric(animatedMetrics.maiorPerda as number || 0, false, true)
                      }
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Bruto</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(animatedMetrics.grossProfit as number || 0, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Bruta</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(animatedMetrics.grossLoss as number || 0, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right">
                      {formatMetric(animatedMetrics.winRate as number || 0, true)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right">
                      {formatMetric(100 - (animatedMetrics.winRate as number || 0), true)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
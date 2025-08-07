import { useState, useEffect } from "react";
import {
  BarChart2,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Award
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
  fileResults?: { [key: string]: { trades?: unknown[]; "Performance Metrics"?: unknown } } | null; // Adicionado para múltiplos CSVs
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
    if (fileResults && Object.keys(fileResults).length > 1) {
      console.log('📊 MÚLTIPLOS CSVs: Consolidando trades para MetricsDashboard');
      const allTrades: unknown[] = [];
      
      Object.keys(fileResults).forEach(fileName => {
        const strategyData = fileResults[fileName] as { trades?: unknown[] };
        if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
          allTrades.push(...strategyData.trades);
        }
      });

      return allTrades;
    } else {
      // ✅ CORREÇÃO: Para CSV único, sempre usar tradeObject.trades
      return tradeObject?.trades || [];
    }
  })();

  // ✅ CORREÇÃO: Calcular métricas diretamente dos trades ANTES do useEffect
  const tradesLucrativos = trade.filter(
    (trade: unknown) => (
      ((trade as { pnl?: number }).pnl || 0) > 0
    )
  );

  const tradesLoss = trade.filter(
    (trade: unknown) => (
      ((trade as { pnl?: number }).pnl || 0) < 0
    )
  );

  // ✅ CORREÇÃO: Calcular métricas de performance do TOTAL (sem agrupar por data)
  const ganhoMedio = tradesLucrativos.length > 0 
    ? tradesLucrativos.reduce((sum: number, t: unknown) => sum + ((t as { pnl?: number }).pnl || 0), 0) / tradesLucrativos.length 
    : 0;
    
  const perdaMedia = tradesLoss.length > 0 
    ? tradesLoss.reduce((sum: number, t: unknown) => sum + Math.abs((t as { pnl?: number }).pnl || 0), 0) / tradesLoss.length 
    : 0;
    
  const payoff = perdaMedia > 0 ? ganhoMedio / perdaMedia : 0;
  
  // ✅ CORREÇÃO: Payoff diário também do TOTAL (não agrupar por data)
  const payoffDiario = payoff; // Usar o mesmo payoff do total
  
  // ✅ CORREÇÃO: Calcular perda máxima diária
  const calcularPerdaMaximaDiaria = () => {
    if (trade.length === 0) return 0;
    
    const dailyResults = new Map<string, number>();
    
    trade.forEach((t) => {
      const tradeData = t as Record<string, unknown>;
      const date = new Date(tradeData.entry_date as string).toISOString().split('T')[0];
      const pnl = tradeData.pnl as number || 0;
      
      const current = dailyResults.get(date) || 0;
      dailyResults.set(date, current + pnl);
    });
    
    // Encontrar o dia com maior perda
    let perdaMaximaDiaria = 0;
    dailyResults.forEach((dailyPnL) => {
      if (dailyPnL < 0 && Math.abs(dailyPnL) > perdaMaximaDiaria) {
        perdaMaximaDiaria = Math.abs(dailyPnL);
      }
    });
    
    return perdaMaximaDiaria;
  };
  
  const perdaMaximaDiaria = calcularPerdaMaximaDiaria();
  
  // ✅ CORREÇÃO: Calcular perda máxima por operação (1 trade)
  const perdaMaximaPorOperacao = tradesLoss.length > 0 
    ? Math.min(...tradesLoss.map(t => (t as { pnl?: number }).pnl || 0))
    : 0;
  
  // ✅ CORREÇÃO: Calcular maior ganho/perda geral
  const maiorGanho = tradesLucrativos.length > 0 
    ? Math.max(...tradesLucrativos.map(t => (t as { pnl?: number }).pnl || 0))
    : 0;
    
  const maiorPerda = tradesLoss.length > 0 
    ? Math.min(...tradesLoss.map(t => (t as { pnl?: number }).pnl || 0))
    : 0;
  
  // ✅ CORREÇÃO: Calcular métricas adicionais
  const totalTrades = trade.length;
  const winRate = totalTrades > 0 ? (tradesLucrativos.length / totalTrades) * 100 : 0;
  const netProfit = trade.reduce((sum: number, t: unknown) => sum + ((t as { pnl?: number }).pnl || 0), 0);
  
  // ✅ CORREÇÃO: Calcular gross profit/loss localmente
  const grossProfit = tradesLucrativos.reduce((sum: number, t: unknown) => sum + ((t as { pnl?: number }).pnl || 0), 0);
  const grossLoss = Math.abs(tradesLoss.reduce((sum: number, t: unknown) => sum + ((t as { pnl?: number }).pnl || 0), 0));

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
        const consolidatedDD = calculateDirectConsolidation(fileResults as Record<string, { trades: Array<{ exit_date?: string; entry_date: string; pnl: number; symbol?: string; [key: string]: unknown }>; "Performance Metrics": { "Net Profit": number; [key: string]: unknown } }>);
        
        if (consolidatedDD && consolidatedDD.maxDrawdownAbsoluto > 0) {
          maxDrawdownAmount = consolidatedDD.maxDrawdownAbsoluto;
          
          // ✅ CORREÇÃO CRÍTICA: Calcular drawdown percent baseado no capital inicial
          const capitalInicial = 100000; // Valor padrão (mesmo do EquityCurveSection)
          maxDrawdown = capitalInicial > 0 ? (consolidatedDD.maxDrawdownAbsoluto / capitalInicial) * 100 : 0;
          console.log('✅ Usando drawdown consolidado:', {
            maxDrawdownAbsoluto: consolidatedDD.maxDrawdownAbsoluto,
            maxDrawdownPercent: maxDrawdown,
            capitalInicial: 100000
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
      } else {
        // ✅ NOVO: Se drawdown da API estiver zerado, calcular localmente
        console.log('⚠️ CSV ÚNICO - Drawdown da API zerado, calculando localmente');
        
        // Calcular drawdown localmente baseado nos trades
        if (trade.length > 0) {
          let runningBalance = 0;
          let peak = 0;
          let maxDrawdownLocal = 0;
          
          trade.forEach((t: unknown) => {
            const pnl = (t as { pnl?: number }).pnl || 0;
            runningBalance += pnl;
            
            if (runningBalance > peak) {
              peak = runningBalance;
            }
            
            const drawdown = peak - runningBalance;
            if (drawdown > maxDrawdownLocal) {
              maxDrawdownLocal = drawdown;
            }
          });
          
          maxDrawdownAmount = maxDrawdownLocal;
          maxDrawdown = capitalInicial > 0 ? (maxDrawdownLocal / capitalInicial) * 100 : 0;
          
          console.log('✅ CSV ÚNICO - Drawdown calculado localmente:', {
            maxDrawdownLocal,
            maxDrawdownAmount,
            maxDrawdown,
            capitalInicial,
            runningBalance: trade.reduce((sum: number, t: unknown) => sum + ((t as { pnl?: number }).pnl || 0), 0)
          });
        }
      }
    }

    // ✅ CORREÇÃO: Usar cálculos diretos dos trades em vez de métricas da API
    const metricsWithDefaults = {
      // Métricas calculadas diretamente dos trades
      payoff: payoff, // Ganho médio / Perda média
      payoffDiario: payoffDiario, // Payoff do total (não agrupado por data)
      perdaMaximaDiaria: perdaMaximaDiaria, // Perda máxima agrupada por dia
      perdaMaximaOperacao: perdaMaximaPorOperacao, // Perda em 1 trade
      ganhoMedio: ganhoMedio,
      perdaMedia: perdaMedia,
      maiorGanho: maiorGanho,
      maiorPerda: maiorPerda,
      
      // ✅ CORREÇÃO: Calcular métricas localmente em vez de usar API
      profitFactor: grossProfit > 0 && grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0),
      sharpeRatio: Number(safeMetrics.sharpeRatio) || 0, // Manter da API por enquanto (não calculamos localmente)
      recoveryFactor: Number(safeMetrics.recoveryFactor) || 0,
      averageTradeDuration: safeMetrics.averageTradeDuration || "N/A",
      maxConsecutiveWins: Number(safeMetrics.maxConsecutiveWins) || 0,
      maxConsecutiveLosses: Number(safeMetrics.maxConsecutiveLosses) || 0,
      totalTrades: trade.length, // Usar trades reais
      profitableTrades: tradesLucrativos.length, // Usar trades reais
      lossTrades: tradesLoss.length, // Usar trades reais
      averageWin: ganhoMedio, // Usar cálculo direto
      averageLoss: perdaMedia, // Usar cálculo direto
      netProfit: netProfit, // Usar cálculo direto
      maxDrawdown: maxDrawdown,
      maxDrawdownAmount: maxDrawdownAmount,
      averageTrade: ganhoMedio - perdaMedia, // Trade médio calculado
      winRate: winRate, // Taxa de acerto calculada
      grossProfit: grossProfit, // Usar cálculo direto
      grossLoss: grossLoss, // Usar cálculo direto
      
      // Métricas complementares da API
      stopIdealPorDia: Number(safeMetrics.stopIdealPorDia) || 120,
      resultadoDiasFuria: Number(safeMetrics.resultadoDiasFuria) || -1250.5,
      numeroDiasFuria: Number(safeMetrics.numeroDiasFuria) || 3,
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
    };

    setAnimatedMetrics(metricsWithDefaults);
  }, [metrics, trade, tradesLucrativos, tradesLoss, ganhoMedio, perdaMedia, payoff, payoffDiario, perdaMaximaDiaria, perdaMaximaPorOperacao, maiorGanho, maiorPerda, totalTrades, winRate, netProfit, grossProfit, grossLoss]);

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

  console.log('🔍 COMPARAÇÃO - Locais vs API:', {
    local: {
      profitFactor: grossProfit > 0 && grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0),
      payoff,
      winRate,
      netProfit,
      totalTrades,
      tradesLucrativos: tradesLucrativos.length,
      tradesLoss: tradesLoss.length
    },
    api: {
      profitFactor: metrics?.profitFactor,
      payoff: metrics?.payoff,
      winRate: metrics?.winRate,
      netProfit: metrics?.netProfit,
      totalTrades: metrics?.totalTrades
    },
    tradeObject: {
      tradesLength: tradeObject?.trades?.length || 0,
      hasTrades: !!tradeObject?.trades
    }
  });

  // ✅ NOVO: Debug detalhado para CSV único
  console.log('🔍 DEBUG CSV ÚNICO:', {
    tradeObject: {
      hasTrades: !!tradeObject?.trades,
      tradesLength: tradeObject?.trades?.length || 0,
      firstTrade: tradeObject?.trades?.[0],
      lastTrade: tradeObject?.trades?.[tradeObject?.trades?.length - 1]
    },
    trade: {
      length: trade.length,
      firstTrade: trade[0],
      lastTrade: trade[trade.length - 1]
    },
    metrics: {
      hasMetrics: !!metrics,
      maxDrawdownAmount: metrics?.maxDrawdownAmount,
      maxDrawdown: metrics?.maxDrawdown,
      netProfit: metrics?.netProfit,
      profitFactor: metrics?.profitFactor,
      payoff: metrics?.payoff,
      winRate: metrics?.winRate
    },
    fileResults: {
      hasFileResults: !!fileResults,
      fileResultsKeys: fileResults ? Object.keys(fileResults) : [],
      isMultipleFiles: fileResults && Object.keys(fileResults).length > 1
    },
    calculatedValues: {
      netProfit,
      grossProfit,
      grossLoss,
      profitFactor: grossProfit > 0 && grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0),
      payoff,
      winRate,
      totalTrades,
      tradesLucrativos: tradesLucrativos.length,
      tradesLoss: tradesLoss.length
    }
  });
  
  // ✅ NOVO: Calcular Estatísticas de Trades localmente
  const calcularEstatisticasTrades = () => {
    if (trade.length === 0) return {
      totalTrades: 0,
      tradesLucrativos: 0,
      tradesComPerda: 0,
      tradesZerados: 0,
      ganhoMedio: 0,
      perdaMedia: 0,
      maxPerdasConsecutivas: 0,
      maxGanhosConsecutivos: 0
    };
    
    // Calcular trades zerados (PnL = 0)
    const tradesZerados = trade.filter((t: unknown) => ((t as { pnl?: number }).pnl || 0) === 0).length;
    
    // Calcular sequências consecutivas
    let maxPerdasConsecutivas = 0;
    let maxGanhosConsecutivos = 0;
    let perdasConsecutivasAtual = 0;
    let ganhosConsecutivosAtual = 0;
    
    trade.forEach((t: unknown) => {
      const pnl = (t as { pnl?: number }).pnl || 0;
      
      if (pnl > 0) {
        ganhosConsecutivosAtual++;
        perdasConsecutivasAtual = 0;
        maxGanhosConsecutivos = Math.max(maxGanhosConsecutivos, ganhosConsecutivosAtual);
      } else if (pnl < 0) {
        perdasConsecutivasAtual++;
        ganhosConsecutivosAtual = 0;
        maxPerdasConsecutivas = Math.max(maxPerdasConsecutivas, perdasConsecutivasAtual);
      } else {
        // Trade zerado (PnL = 0)
        ganhosConsecutivosAtual = 0;
        perdasConsecutivasAtual = 0;
      }
    });
    
    return {
      totalTrades: trade.length,
      tradesLucrativos: tradesLucrativos.length,
      tradesComPerda: tradesLoss.length,
      tradesZerados,
      ganhoMedio,
      perdaMedia,
      maxPerdasConsecutivas,
      maxGanhosConsecutivos
    };
  };

  // ✅ NOVO: Calcular Métricas Avançadas localmente
  const calcularMetricasAvancadas = () => {
    if (trade.length === 0) return {
      tradeMedio: 0,
      maiorGanho: 0,
      maiorPerda: 0,
      ganhoBruto: 0,
      perdaBruta: 0,
      tradesLucrativosPercent: 0,
      tradesComPerdaPercent: 0
    };
    
    // Trade médio (lucro líquido / total de trades)
    const tradeMedio = totalTrades > 0 ? netProfit / totalTrades : 0;
    
    // Percentuais
    const tradesLucrativosPercent = totalTrades > 0 ? (tradesLucrativos.length / totalTrades) * 100 : 0;
    const tradesComPerdaPercent = totalTrades > 0 ? (tradesLoss.length / totalTrades) * 100 : 0;
    
    return {
      tradeMedio,
      maiorGanho,
      maiorPerda,
      ganhoBruto: grossProfit,
      perdaBruta: grossLoss,
      tradesLucrativosPercent,
      tradesComPerdaPercent
    };
  };
  
  // ✅ NOVO: Calcular valores das estatísticas
  const estatisticasTrades = calcularEstatisticasTrades();
  const metricasAvancadas = calcularMetricasAvancadas();
  



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
                  netProfit
                )}`}
              >
                {formatMetric(netProfit, false, true)}
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
                {totalTrades}
              </p>
            </div>

            {/* Profit Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Lucro</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "profitFactor",
                  grossProfit > 0 && grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0)
                )}`}
              >
                {formatMetric(grossProfit > 0 && grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0))}
              </p>
            </div>

            {/* Payoff */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Payoff</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "payoff",
                  payoff
                )}`}
              >
                {formatMetric(payoff)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ganho Médio / Perda Média (Total)
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
                  winRate
                )}`}
              >
                {formatMetric(winRate, true)}
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
                      {estatisticasTrades.totalTrades}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right text-green-500">
                      {estatisticasTrades.tradesLucrativos}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right text-red-500">
                      {estatisticasTrades.tradesComPerda}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Zerados</td>
                    <td className="py-2 text-right text-white">
                      {estatisticasTrades.tradesZerados}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Médio</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(estatisticasTrades.ganhoMedio, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Média</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(
                        Math.abs(estatisticasTrades.perdaMedia),
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
                      {estatisticasTrades.maxPerdasConsecutivas}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">
                      Máx. Ganhos Consecutivos
                    </td>
                    <td className="py-2 text-right text-green-500">
                      {estatisticasTrades.maxGanhosConsecutivos}
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
                      {formatMetric(metricasAvancadas.tradeMedio, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Ganho</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(metricasAvancadas.maiorGanho, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Perda</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(metricasAvancadas.maiorPerda, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Bruto</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(metricasAvancadas.ganhoBruto, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Bruta</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(metricasAvancadas.perdaBruta, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right">
                      {formatMetric(metricasAvancadas.tradesLucrativosPercent, true)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right">
                      {formatMetric(metricasAvancadas.tradesComPerdaPercent, true)}
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
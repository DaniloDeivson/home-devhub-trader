import { useState, useEffect } from "react";
import {
  BarChart2,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  BarChartHorizontal,
  Wallet,
  TrendingDown
} from "lucide-react";

interface MetricsDashboardProps {
  tradeObject: any;
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
    averageTradeDuration?: string; // Duration in hours, minutes
    dayOfWeekAnalysis?: Record<
      string,
      { trades: number; winRate: number; profitFactor: number }
    >;
    monthlyAnalysis?: Record<
      string,
      { trades: number; winRate: number; profitFactor: number }
    >;
    // Métricas complementares
    stopIdealPorDia?: number;
    resultadoDiasFuria?: number;
    numeroDiasFuria?: number;
    maiorGanho?: number;
    maiorPerda?: number;
    operacoesMaximasPorDia?: number;
    setupsMaximosPorDia?: number;
    mediaOperacoesDia?: number;
    // Dados diretos da API
    bestDay?: {
      day: string;
      trades: number;
      winRate: number;
      profitFactor: number;
    } | null;
    worstDay?: {
      day: string;
      trades: number;
      winRate: number;
      profitFactor: number;
    } | null;
    bestMonth?: {
      month: string;
      trades: number;
      winRate: number;
      profitFactor: number;
    } | null;
    worstMonth?: {
      month: string;
      trades: number;
      winRate: number;
      profitFactor: number;
    } | null;
  };
}

export function MetricsDashboard({ metrics,tradeObject }: MetricsDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animatedMetrics, setAnimatedMetrics] = useState<any>({});
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(true);
  const [showTradeDuration, setShowTradeDuration] = useState(false);
  const [showPositionSizing, setShowPositionSizing] = useState(false);
  const trade = tradeObject?.trades;
  // Sample data for the trade duration analysis with additional metrics
  // Calculate real trade duration data from the trades array
  const calculateTradeDurationData = () => {
    if (!trade || trade.length === 0) {
      return {
        averageDuration: '0h 0m',
        medianDuration: '0h 0m',
        maxDuration: '0h 0m',
        resultByDuration: []
      };
    }

    console.log("trades? ",trade);
    const tradesWithDuration = trade?.map(t => {
      const entryDate = new Date(t.entry_date);
      const exitDate = new Date(t.exit_date);
      const durationHours = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
      
      return {
        ...t,
        durationHours: durationHours
      };
    });

    // Calculate basic duration statistics
    const durations = tradesWithDuration.map(t => t.durationHours);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const medianDuration = sortedDurations[Math.floor(sortedDurations.length / 2)];
    const maxDuration = Math.max(...durations);

    // Format duration helper function
    const formatDuration = (hours) => {
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
      const rangeTradesData = tradesWithDuration.filter(t => 
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

      const totalResult = rangeTradesData.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winningTrades = rangeTradesData.filter(t => (t.pnl || 0) > 0);
      const losingTrades = rangeTradesData.filter(t => (t.pnl || 0) < 0);
      
      const winRate = (winningTrades.length / rangeTradesData.length) * 100;
      
      const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
      
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
    });

    return {
      averageDuration: formatDuration(avgDuration),
      medianDuration: formatDuration(medianDuration),
      maxDuration: formatDuration(maxDuration),
      resultByDuration: resultByDuration
    };
  };
 
    const  tradeDurationData = calculateTradeDurationData();
    console.log("duration data: ",tradeDurationData)
  

  // Sample data for position sizing
  const positionSizingData = {
    // Ações
    stocks: {
      maxPositionPerTrade: 500, // em ações
      avgPositionPerTrade: 285, // em ações
      medianPositionPerTrade: 250, // em ações
      avgLeverage: 0.85
    },
    // Futuros
    futures: {
      maxPositionPerTrade: 15, // em contratos
      avgPositionPerTrade: 8, // em contratos
      medianPositionPerTrade: 7, // em contratos
      avgLeverage: 3.2
    },
    // Dados gerais
    general: {
      maxOpenPositions: 3,
      setupsMaximosPorDia: 8
    }
  };

  // Animate metrics when they change
  useEffect(() => {
    // Set default values for metrics that might be missing with proper null checks
    const safeMetrics = metrics || {};

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
      maxDrawdown: Number(safeMetrics.maxDrawdown) || 0,
      maxDrawdownAmount: Number(safeMetrics.maxDrawdownAmount) || 0,
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
  const filteredTradeDurationData = tradeDurationData.resultByDuration.filter(
    (trade) =>trade.count !== 0
  )
  const tradesLucrativos = tradeObject?.trades.filter(
    (trade) => (
      trade.pnl > 0
      
    )
  )

  const tradesLoss = tradeObject?.trades.filter(
    (trade) => (
      trade.pnl < 0
    )
  )

  const tradesNull = tradeObject?.trades.filter(
    (trade) => (
      trade.pnl === 0
    )
  )
 const maiorGanho = Math.max(...(tradeObject?.trades || []).map(trade => (trade.pnl || 0) ));
const maiorPerda = Math.min(...(tradeObject?.trades || []).map(trade => (trade.pnl || 0) ));
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
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
                  animatedMetrics.netProfit || 0
                )}`}
              >
                {formatMetric(animatedMetrics.netProfit, false, true)}
              </p>
            </div>

            {/* Max Drawdown */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Drawdown Máximo R$</p>
              <p className="text-3xl font-bold text-red-500">
                {formatMetric(animatedMetrics.maxDrawdownAmount, false, true)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatMetric(animatedMetrics.maxDrawdown, true)} do capital
              </p>
            </div>

            {/* Total Trades */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total de Trades</p>
              <p className="text-3xl font-bold">
                {tradeObject?.trades?.length || "0"}
              </p>
            </div>

            {/* Profit Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Lucro</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "profitFactor",
                  animatedMetrics.profitFactor || 0
                )}`}
              >
                {formatMetric(animatedMetrics.profitFactor)}
              </p>
            </div>

            {/* Payoff */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Payoff</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "payoff",
                  animatedMetrics.payoff || 0
                )}`}
              >
                {formatMetric(animatedMetrics.payoff)}
              </p>
            </div>

            {/* Win Rate */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Taxa de Acerto</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "winRate",
                  animatedMetrics.winRate || 0
                )}`}
              >
                {formatMetric(animatedMetrics.winRate, true)}
              </p>
            </div>
          </div>

          {/* Position Sizing Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium">Dimensionamento de Posição</h3>
              </div>
              <button
                onClick={() => setShowPositionSizing(!showPositionSizing)}
                className="p-1 hover:bg-gray-800 rounded-full"
              >
                {showPositionSizing ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>

            {showPositionSizing && (
              <div className="space-y-6">
                {/* Stocks vs Futures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stocks Section */}
                  <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 className="text-lg font-medium mb-3 flex items-center">
                      <BarChartHorizontal className="w-5 h-5 text-blue-400 mr-2" />
                      Ações
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Máxima por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.stocks.maxPositionPerTrade} ações
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Média por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.stocks.avgPositionPerTrade} ações
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Mediana por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.stocks.medianPositionPerTrade} ações
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Futures Section */}
                  <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                    <h4 className="text-lg font-medium mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                      Futuros
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Máxima por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.futures.maxPositionPerTrade} contratos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Média por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.futures.avgPositionPerTrade} contratos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Mediana por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.futures.medianPositionPerTrade} contratos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Position Metrics */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 text-yellow-400 mr-2" />
                    Métricas Adicionais de Posição
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Posições Abertas Máximas</p>
                      <p className="text-lg font-medium">
                        {positionSizingData.general.maxOpenPositions} posições
                      </p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Setups Máximos por Dia</p>
                      <p className="text-lg font-medium">
                        {positionSizingData.general.setupsMaximosPorDia} setups
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <TrendingDown className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-300 mb-2">Análise de Risco e Posicionamento</h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        <li>• A distribuição de posição (500 ações / 15 contratos) está adequada para o capital</li>
                        <li>• Posição máxima por trade (15 contratos) está dentro dos limites recomendados</li>
                        <li>• Máximo de {positionSizingData.general.maxOpenPositions} posições abertas simultaneamente demonstra boa gestão</li>
                        <li>• Limite de {positionSizingData.general.setupsMaximosPorDia} setups por dia ajuda a manter a disciplina</li>
                        <li>• A posição média de 8 contratos por trade está adequada para o perfil de risco</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                     {tradeObject?.trades?.length || "0"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right text-green-500">
                      {tradesLucrativos.length|| "0"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right text-red-500">
                      {tradesLoss.length|| "0"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Zerados</td>
                    <td className="py-2 text-right text-white">
                      {tradesNull.length|| "0"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Médio</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(animatedMetrics.averageWin, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Média</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(
                        Math.abs(animatedMetrics.averageLoss || 0),
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
                      {animatedMetrics.maxConsecutiveLosses || "0"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">
                      Máx. Ganhos Consecutivos
                    </td>
                    <td className="py-2 text-right text-green-500">
                      {animatedMetrics.maxConsecutiveWins || "0"}
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
                    {formatMetric(((animatedMetrics.averageWin || 0) - Math.abs(animatedMetrics.averageLoss || 0)), false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Ganho</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(maiorGanho, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Perda</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(maiorPerda, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Bruto</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(animatedMetrics.grossProfit, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Bruta</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(animatedMetrics.grossLoss, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right">
                      {formatMetric(animatedMetrics.winRate, true)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right">
                      {formatMetric(100 - (animatedMetrics.winRate || 0), true)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trade Duration Section - Moved below advanced metrics */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium">Duração dos Trades</h3>
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
            
            {!showTradeDuration ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            ) : (
              <div>
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
                  <h4 className="text-sm font-medium mb-3 text-gray-300">Análise por Faixa de Duração</h4>
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
                        {filteredTradeDurationData.map((item, index) => (
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
                              {formatMetric(item.result, false, true)}
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
                        <li>• Trades entre 1-2 horas apresentam melhor resultado e fator de lucro (2.10)</li>
                        <li>• Operações muito curtas (menos de 30 min) tendem a ser negativas com baixa taxa de acerto (38.5%)</li>
                        <li>• Melhor payoff (1.65) e taxa de acerto (65.8%) na faixa de 1-2 horas</li>
                        <li>• Trades longos &gt;4h mostram baixo fator de lucro (0.78) e payoff abaixo de 1</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
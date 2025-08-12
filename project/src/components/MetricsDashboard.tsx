import { useState, useEffect, useCallback } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import {
  BarChart2,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Award
} from "lucide-react";

interface MetricsDashboardProps {
  // Trades já consolidados devem ser passados de fora; não consolidamos aqui
  tradeObject?: {
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

export function MetricsDashboard({ metrics, showTitle = true }: MetricsDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, unknown>>({});

  // Sempre usar diretamente os dados da API; apenas aplicar defaults seguros
  useEffect(() => {
    const safeMetrics = metrics || ({} as MetricsDashboardProps['metrics']);
    setAnimatedMetrics({
      ...safeMetrics,
    });
  }, [metrics]);

  // ✅ CORREÇÃO: Usar useCallback para funções que não precisam recriar
  const getMetricColor = useCallback((metric: string, value: number): string => {
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
  }, []);

  const formatMetric = useCallback((
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
  }, []);

  // Trades consolidados são recebidos via tradeObject, mas as métricas exibidas vêm da API

  // Estatísticas derivadas apenas de métricas da API (sem calcular localmente)
  const estatisticasTrades = {
    totalTrades: metrics?.totalTrades,
    tradesLucrativos: metrics?.profitableTrades,
    tradesComPerda: metrics?.lossTrades,
    ganhoMedio: metrics?.averageWin,
    perdaMedia: metrics?.averageLoss,
    maxPerdasConsecutivas: metrics?.maxConsecutiveLosses,
    maxGanhosConsecutivos: metrics?.maxConsecutiveWins,
  } as const;

  const metricasAvancadas = {
    tradeMedio: metrics?.averageTrade,
    maiorGanho: metrics?.maiorGanho,
    maiorPerda: metrics?.maiorPerda,
    ganhoBruto: metrics?.grossProfit,
    perdaBruta: metrics?.grossLoss,
    tradesLucrativosPercent: metrics?.winRate,
    tradesComPerdaPercent:
      metrics?.winRate !== undefined && metrics?.winRate !== null
        ? Math.max(0, 100 - Number(metrics?.winRate))
        : undefined,
  } as const;

  // Drawdown % exibido deve seguir a mesma regra da legenda da Equity Curve
  // Usar capital investido dinâmico vindo do store compartilhado
  const investedCapital = useSettingsStore((s) => s.investedCapital) || 100000;
  const ddPercentDisplay = (() => {
    const amount = metrics?.maxDrawdownAmount;
    if (typeof amount === 'number' && isFinite(amount)) {
      return investedCapital > 0 ? (amount / investedCapital) * 100 : undefined;
    }
    const pct = metrics?.maxDrawdown;
    return typeof pct === 'number' && isFinite(pct) ? pct : undefined;
  })();

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
                  Number(metrics?.netProfit)
                )}`}
              >
                {formatMetric(Number(metrics?.netProfit), false, true)}
              </p>
            </div>

            {/* Max Drawdown */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Drawdown Máximo R$</p>
              <p className="text-3xl font-bold text-red-500">
                {formatMetric(animatedMetrics.maxDrawdownAmount as number, false, true)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatMetric(ddPercentDisplay as number, true)} do capital
              </p>
            </div>

            {/* Total Trades */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total de Trades</p>
              <p className="text-3xl font-bold">
                {metrics?.totalTrades ?? 'N/A'}
              </p>
            </div>

            {/* Profit Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Lucro</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "profitFactor",
                  Number(metrics?.profitFactor)
                )}`}
              >
                {formatMetric(Number(metrics?.profitFactor))}
              </p>
            </div>

            {/* Payoff */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Payoff</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "payoff",
                  Number(metrics?.payoff)
                )}`}
              >
                {formatMetric(Number(metrics?.payoff))}
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
                  animatedMetrics.sharpeRatio as number
                )}`}
              >
                {formatMetric(animatedMetrics.sharpeRatio as number)}
              </p>
            </div>

            {/* Recovery Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Recuperação</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "recoveryFactor",
                  animatedMetrics.recoveryFactor as number
                )}`}
              >
                {formatMetric(animatedMetrics.recoveryFactor as number)}
              </p>
            </div>

            {/* Win Rate */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Taxa de Acerto</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "winRate",
                  Number(metrics?.winRate)
                )}`}
              >
                {formatMetric(Number(metrics?.winRate), true)}
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
                       {estatisticasTrades.totalTrades ?? 'N/A'}
                     </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                     <td className="py-2 text-right text-green-500">
                       {estatisticasTrades.tradesLucrativos ?? 'N/A'}
                     </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                     <td className="py-2 text-right text-red-500">
                       {estatisticasTrades.tradesComPerda ?? 'N/A'}
                     </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Médio</td>
                     <td className="py-2 text-right text-green-500">
                       {formatMetric(estatisticasTrades.ganhoMedio as number, false, true)}
                     </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Média</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(
                         estatisticasTrades.perdaMedia !== undefined && estatisticasTrades.perdaMedia !== null
                           ? Math.abs(Number(estatisticasTrades.perdaMedia))
                           : undefined,
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
                       {estatisticasTrades.maxPerdasConsecutivas ?? 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">
                      Máx. Ganhos Consecutivos
                    </td>
                    <td className="py-2 text-right text-green-500">
                       {estatisticasTrades.maxGanhosConsecutivos ?? 'N/A'}
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
                      {formatMetric(metricasAvancadas.tradeMedio as number, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Ganho</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(metricasAvancadas.maiorGanho as number, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Perda</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(metricasAvancadas.maiorPerda as number, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Bruto</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(metricasAvancadas.ganhoBruto as number, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Bruta</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(metricasAvancadas.perdaBruta as number, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right">
                      {formatMetric(metricasAvancadas.tradesLucrativosPercent as number, true)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right">
                      {formatMetric(metricasAvancadas.tradesComPerdaPercent as number, true)}
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
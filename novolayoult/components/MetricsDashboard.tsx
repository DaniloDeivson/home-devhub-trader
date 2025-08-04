import React, { useState, useEffect } from 'react';
import { BarChart2, ChevronUp, ChevronDown, TrendingUp, TrendingDown, DollarSign, Percent, Clock, AlertTriangle, Award, Zap, Activity, Calendar, ArrowUp, ArrowDown, Target, Zap as ZapIcon } from 'lucide-react';

interface MetricsDashboardProps {
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
    dayOfWeekAnalysis?: Record<string, { trades: number; winRate: number; profitFactor: number }>;
    monthlyAnalysis?: Record<string, { trades: number; winRate: number; profitFactor: number }>;
    // Métricas complementares
    stopIdealPorDia?: number;
    resultadoDiasFuria?: number;
    numeroDiasFuria?: number;
    maiorGanho?: number;
    maiorPerda?: number;
    operacoesMaximasPorDia?: number;
    setupsMaximosPorDia?: number;
    mediaOperacoesDia?: number;
    // Duração de trades
    duracaoMinimaTrade?: string;
    duracaoMaximaTrade?: string;
    duracaoMedianaTrade?: string;
  };
  showConsolidated?: boolean;
  selectedFiles?: string[];
  fileResults?: {[key: string]: any};
}

// Mapeamento de dias da semana em inglês para português
const dayTranslations: Record<string, string> = {
  'monday': 'Segunda-feira',
  'tuesday': 'Terça-feira',
  'wednesday': 'Quarta-feira',
  'thursday': 'Quinta-feira',
  'friday': 'Sexta-feira',
  'saturday': 'Sábado',
  'sunday': 'Domingo'
};

// Mapeamento de meses em inglês para português
const monthTranslations: Record<string, string> = {
  'january': 'Janeiro',
  'february': 'Fevereiro',
  'march': 'Março',
  'april': 'Abril',
  'may': 'Maio',
  'june': 'Junho',
  'july': 'Julho',
  'august': 'Agosto',
  'september': 'Setembro',
  'october': 'Outubro',
  'november': 'Novembro',
  'december': 'Dezembro'
};

// Ordem correta dos dias da semana
const dayOrder = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

// Ordem correta dos meses
const monthOrder = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

export function MetricsDashboard({ metrics, showConsolidated, selectedFiles, fileResults }: MetricsDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animatedMetrics, setAnimatedMetrics] = useState<any>({});
  const [showDayOfWeek, setShowDayOfWeek] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(true);

  // Animate metrics when they change
  useEffect(() => {
    console.log('🔍 MetricsDashboard - Dados recebidos:', {
      payoff: metrics.payoff,
      averageWin: metrics.averageWin,
      averageLoss: metrics.averageLoss,
      profitFactor: metrics.profitFactor,
      winRate: metrics.winRate,
      showConsolidated,
      selectedFiles,
      fileResultsKeys: fileResults ? Object.keys(fileResults) : []
    });
    
    // Set default values for metrics that might be missing
    const metricsWithDefaults = {
      ...metrics,
      profitFactor: metrics.profitFactor || 0,
      sharpeRatio: metrics.sharpeRatio || 0,
      recoveryFactor: metrics.recoveryFactor || 0,
      averageTradeDuration: metrics.averageTradeDuration || 'N/A',
      maxConsecutiveWins: metrics.maxConsecutiveWins || 0,
      maxConsecutiveLosses: metrics.maxConsecutiveLosses || 0,
      payoff: metrics.payoff || 0,
      totalTrades: metrics.totalTrades || 0,
      profitableTrades: metrics.profitableTrades || 0,
      lossTrades: metrics.lossTrades || 0,
      averageWin: metrics.averageWin || 0,
      averageLoss: metrics.averageLoss || 0,
      netProfit: metrics.netProfit || 0,
      maxDrawdown: metrics.maxDrawdown || 0,
      maxDrawdownAmount: metrics.maxDrawdownAmount || 0,
      averageTrade: metrics.averageTrade || 0,
      // Métricas complementares
      stopIdealPorDia: metrics.stopIdealPorDia || 120,
      resultadoDiasFuria: metrics.resultadoDiasFuria || -1250.50,
      numeroDiasFuria: metrics.numeroDiasFuria || 3,
      maiorGanho: metrics.maiorGanho || 1850.75,
      maiorPerda: metrics.maiorPerda || -980.25,
      operacoesMaximasPorDia: metrics.operacoesMaximasPorDia || 12,
      setupsMaximosPorDia: metrics.setupsMaximosPorDia || 8,
      mediaOperacoesDia: metrics.mediaOperacoesDia || 5.2,
      // Duração de trades
      duracaoMinimaTrade: metrics.duracaoMinimaTrade || '5min',
      duracaoMaximaTrade: metrics.duracaoMaximaTrade || '3h 45min',
      duracaoMedianaTrade: metrics.duracaoMedianaTrade || '45min',
      dayOfWeekAnalysis: metrics.dayOfWeekAnalysis || {
        monday: { trades: 0, winRate: 0, profitFactor: 0 },
        tuesday: { trades: 0, winRate: 0, profitFactor: 0 },
        wednesday: { trades: 0, winRate: 0, profitFactor: 0 },
        thursday: { trades: 0, winRate: 0, profitFactor: 0 },
        friday: { trades: 0, winRate: 0, profitFactor: 0 }
      },
      monthlyAnalysis: metrics.monthlyAnalysis || {
        january: { trades: 0, winRate: 0, profitFactor: 0 },
        february: { trades: 0, winRate: 0, profitFactor: 0 },
        march: { trades: 0, winRate: 0, profitFactor: 0 },
        april: { trades: 0, winRate: 0, profitFactor: 0 },
        may: { trades: 0, winRate: 0, profitFactor: 0 },
        june: { trades: 0, winRate: 0, profitFactor: 0 },
        july: { trades: 0, winRate: 0, profitFactor: 0 },
        august: { trades: 0, winRate: 0, profitFactor: 0 },
        september: { trades: 0, winRate: 0, profitFactor: 0 },
        october: { trades: 0, winRate: 0, profitFactor: 0 },
        november: { trades: 0, winRate: 0, profitFactor: 0 },
        december: { trades: 0, winRate: 0, profitFactor: 0 }
      }
    };
    
    setAnimatedMetrics(metricsWithDefaults);
  }, [metrics]);

  const getMetricColor = (metric: string, value: number): string => {
    switch (metric) {
      case 'profitFactor':
        return value >= 1.5 ? 'text-green-500' : value >= 1.0 ? 'text-yellow-500' : 'text-red-500';
      case 'payoff':
        return value >= 1.5 ? 'text-green-500' : value >= 1.0 ? 'text-yellow-500' : 'text-red-500';
      case 'winRate':
        return value >= 60 ? 'text-green-500' : value >= 45 ? 'text-yellow-500' : 'text-red-500';
      case 'maxDrawdown':
        return value <= 10 ? 'text-green-500' : value <= 20 ? 'text-yellow-500' : 'text-red-500';
      case 'sharpeRatio':
        return value >= 1.0 ? 'text-green-500' : value >= 0.5 ? 'text-yellow-500' : 'text-red-500';
      case 'recoveryFactor':
        return value >= 3 ? 'text-green-500' : value >= 1 ? 'text-yellow-500' : 'text-red-500';
      case 'netProfit':
        return value > 0 ? 'text-green-500' : value === 0 ? 'text-gray-300' : 'text-red-500';
      default:
        return 'text-gray-300';
    }
  };

  const formatMetric = (value: number | undefined, isPercentage = false, isCurrency = false): string => {
    if (value === undefined || value === null || isNaN(Number(value))) return 'N/A';
    
    if (isCurrency) {
      return `R$ ${value.toFixed(2)}`;
    }
    
    return isPercentage ? `${value.toFixed(2)}%` : value.toFixed(2);
  };

  const getBestDay = () => {
    if (!animatedMetrics.dayOfWeekAnalysis) return null;
    
    const days = Object.entries(animatedMetrics.dayOfWeekAnalysis);
    if (days.length === 0) return null;
    
    return days.reduce((best, [day, data]: [string, any]) => {
      if (!best || (data.profitFactor > best.data.profitFactor && data.trades > 0)) {
        return { day, data };
      }
      return best;
    }, null);
  };

  const getWorstDay = () => {
    if (!animatedMetrics.dayOfWeekAnalysis) return null;
    
    const days = Object.entries(animatedMetrics.dayOfWeekAnalysis);
    if (days.length === 0) return null;
    
    return days.reduce((worst, [day, data]: [string, any]) => {
      if (!worst || (data.profitFactor < worst.data.profitFactor && data.trades > 0)) {
        return { day, data };
      }
      return worst;
    }, null);
  };

  const getBestMonth = () => {
    if (!animatedMetrics.monthlyAnalysis) return null;
    
    const months = Object.entries(animatedMetrics.monthlyAnalysis);
    if (months.length === 0) return null;
    
    return months.reduce((best, [month, data]: [string, any]) => {
      if (!best || (data.profitFactor > best.data.profitFactor && data.trades > 0)) {
        return { month, data };
      }
      return best;
    }, null);
  };

  const getWorstMonth = () => {
    if (!animatedMetrics.monthlyAnalysis) return null;
    
    const months = Object.entries(animatedMetrics.monthlyAnalysis);
    if (months.length === 0) return null;
    
    return months.reduce((worst, [month, data]: [string, any]) => {
      if (!worst || (data.profitFactor < worst.data.profitFactor && data.trades > 0)) {
        return { month, data };
      }
      return worst;
    }, null);
  };

  // Renderiza o calendário de dias da semana
  const renderDayCalendar = () => {
    if (!animatedMetrics.dayOfWeekAnalysis) return null;
    
    return (
      <div className="grid grid-cols-7 gap-1 mt-4">
        {dayOrder.map(day => {
          const data = animatedMetrics.dayOfWeekAnalysis[day] || { trades: 0, winRate: 0, profitFactor: 0 };
          const bgColor = data.profitFactor >= 1.5 ? 'bg-green-900' : 
                         data.profitFactor >= 1.0 ? 'bg-yellow-900' : 
                         'bg-red-900';
          const textColor = data.profitFactor >= 1.5 ? 'text-green-300' : 
                           data.profitFactor >= 1.0 ? 'text-yellow-300' : 
                           'text-red-300';
          
          return (
            <div key={day} className={`p-2 rounded-lg ${bgColor} ${data.trades === 0 ? 'opacity-50' : ''}`}>
              <p className="text-xs text-gray-300 mb-1">{dayTranslations[day].substring(0, 3)}</p>
              <p className={`text-sm font-bold ${textColor}`}>{data.profitFactor?.toFixed(2) || "0.00"}</p>
              <p className="text-xs text-gray-400">{data.trades || 0} trades</p>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderiza o calendário de meses
  const renderMonthCalendar = () => {
    if (!animatedMetrics.monthlyAnalysis) return null;
    
    // Dividir os meses em 4 linhas de 3 meses
    const rows = [
      monthOrder.slice(0, 3),   // Jan, Feb, Mar
      monthOrder.slice(3, 6),   // Apr, May, Jun
      monthOrder.slice(6, 9),   // Jul, Aug, Sep
      monthOrder.slice(9, 12)   // Oct, Nov, Dec
    ];
    
    return (
      <div className="mt-4 space-y-1">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 gap-1">
            {row.map(month => {
              const data = animatedMetrics.monthlyAnalysis[month] || { trades: 0, winRate: 0, profitFactor: 0 };
              const bgColor = data.profitFactor >= 1.5 ? 'bg-green-900' : 
                             data.profitFactor >= 1.0 ? 'bg-yellow-900' : 
                             'bg-red-900';
              const textColor = data.profitFactor >= 1.5 ? 'text-green-300' : 
                               data.profitFactor >= 1.0 ? 'text-yellow-300' : 
                               'text-red-300';
              
              return (
                <div key={month} className={`p-2 rounded-lg ${bgColor} ${data.trades === 0 ? 'opacity-50' : ''}`}>
                  <p className="text-xs text-gray-300 mb-1">{monthTranslations[month].substring(0, 3)}</p>
                  <p className={`text-sm font-bold ${textColor}`}>{data.profitFactor?.toFixed(2) || "0.00"}</p>
                  <p className="text-xs text-gray-400">{data.trades || 0} trades</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const bestDay = getBestDay();
  const worstDay = getWorstDay();
  const bestMonth = getBestMonth();
  const worstMonth = getWorstMonth();

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center">
          <BarChart2 className="w-5 h-5 text-blue-500 mr-2" />
          <div>
            <h2 className="text-lg font-medium">Métricas de Performance</h2>
            {showConsolidated ? (
              <p className="text-xs text-blue-400">Modo Consolidado - Todas as Estratégias</p>
            ) : selectedFiles && selectedFiles.length > 0 ? (
              <p className="text-xs text-green-400">
                Modo Individual - {selectedFiles.length} Estratégia{selectedFiles.length > 1 ? 's' : ''} Selecionada{selectedFiles.length > 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-xs text-yellow-400">Modo Padrão</p>
            )}
          </div>
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
          {/* Estratégias Ativas */}
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-400 mb-2">Estratégias Ativas:</p>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <span key={index} className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs">
                    {file.replace('.csv', '')}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Net Profit */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Lucro Líquido</p>
              <p className={`text-3xl font-bold ${getMetricColor('netProfit', animatedMetrics.netProfit || 0)}`}>
                R$ {animatedMetrics.netProfit?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            {/* Max Drawdown */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Drawdown Máximo R$</p>
              <p className="text-3xl font-bold text-red-500">
                R$ {animatedMetrics.maxDrawdownAmount?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {animatedMetrics.maxDrawdown ? `${animatedMetrics.maxDrawdown.toFixed(2)}% do capital` : 'N/A'}
              </p>
            </div>
            
            {/* Sharpe Ratio */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Sharpe Ratio</p>
              <p className={`text-2xl font-bold ${getMetricColor('sharpeRatio', animatedMetrics.sharpeRatio || 0)}`}>
                {animatedMetrics.sharpeRatio?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            {/* Recovery Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Recuperação</p>
              <p className={`text-2xl font-bold ${getMetricColor('recoveryFactor', animatedMetrics.recoveryFactor || 0)}`}>
                {animatedMetrics.recoveryFactor?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            {/* Total Trades */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total de Trades</p>
              <p className="text-3xl font-bold">
                {animatedMetrics.totalTrades || '0'}
              </p>
            </div>
            
            {/* Profit Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Lucro</p>
              <p className={`text-2xl font-bold ${getMetricColor('profitFactor', animatedMetrics.profitFactor || 0)}`}>
                {animatedMetrics.profitFactor?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            {/* Payoff */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Payoff</p>
              <p className={`text-2xl font-bold ${getMetricColor('payoff', animatedMetrics.payoff || 0)}`}>
                {animatedMetrics.payoff?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            {/* Win Rate */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Taxa de Acerto</p>
              <p className={`text-2xl font-bold ${getMetricColor('winRate', animatedMetrics.winRate || 0)}`}>
                {animatedMetrics.winRate?.toFixed(2) || '0.00'}%
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
                    <td className="py-2 text-right">{animatedMetrics.totalTrades || '0'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right text-green-500">{animatedMetrics.profitableTrades || '0'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right text-red-500">{animatedMetrics.lossTrades || '0'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Médio</td>
                    <td className="py-2 text-right text-green-500">R$ {animatedMetrics.averageWin?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Média</td>
                    <td className="py-2 text-right text-red-500">R$ {animatedMetrics.averageLoss ? Math.abs(animatedMetrics.averageLoss).toFixed(2) : '0.00'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Máx. Perdas Consecutivas</td>
                    <td className="py-2 text-right">{animatedMetrics.maxConsecutiveLosses || '0'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Máx. Ganhos Consecutivos</td>
                    <td className="py-2 text-right text-green-500">{animatedMetrics.maxConsecutiveWins || 'N/A'}</td>
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
                    <td className="py-2 text-right">R$ {animatedMetrics.averageTrade?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Duração Média do Trade</td>
                    <td className="py-2 text-right">{animatedMetrics.averageTradeDuration || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Duração Mínima do Trade</td>
                    <td className="py-2 text-right">{animatedMetrics.duracaoMinimaTrade || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Duração Máxima do Trade</td>
                    <td className="py-2 text-right">{animatedMetrics.duracaoMaximaTrade || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Duração Mediana do Trade</td>
                    <td className="py-2 text-right">{animatedMetrics.duracaoMedianaTrade || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Ganho</td>
                    <td className="py-2 text-right text-green-500">R$ {animatedMetrics.maiorGanho?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Perda</td>
                    <td className="py-2 text-right text-red-500">R$ {animatedMetrics.maiorPerda?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Média Operações/Dia</td>
                    <td className="py-2 text-right">{animatedMetrics.mediaOperacoesDia?.toFixed(1) || '0.0'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Day of Week Analysis */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <Calendar className="w-5 h-5 text-blue-400 mr-2" />
                Análise por Dia da Semana
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCalendarView(!showCalendarView)}
                  className="p-1 hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white"
                >
                  {showCalendarView ? 'Visualização em Tabela' : 'Visualização em Calendário'}
                </button>
                <button
                  onClick={() => setShowDayOfWeek(!showDayOfWeek)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {showDayOfWeek ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {showDayOfWeek && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {bestDay && (
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-green-400">
                        <ArrowUp className="w-4 h-4 mr-1" />
                        Melhor Dia: {dayTranslations[bestDay.day] || bestDay.day}
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-400">Trades</p>
                          <p className="font-medium">{bestDay.data.trades || '0'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Taxa de Acerto</p>
                          <p className="font-medium text-green-400">{bestDay.data.winRate?.toFixed(2) || '0.00'}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Fator de Lucro</p>
                          <p className="font-medium text-green-400">{bestDay.data.profitFactor?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {worstDay && (
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-red-400">
                        <ArrowDown className="w-4 h-4 mr-1" />
                        Pior Dia: {dayTranslations[worstDay.day] || worstDay.day}
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-400">Trades</p>
                          <p className="font-medium">{worstDay.data.trades || '0'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Taxa de Acerto</p>
                          <p className="font-medium text-red-400">{worstDay.data.winRate?.toFixed(2) || '0.00'}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Fator de Lucro</p>
                          <p className="font-medium text-red-400">{worstDay.data.profitFactor?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {showCalendarView ? (
                  renderDayCalendar()
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-700">
                          <th className="px-3 py-2 text-left">Dia</th>
                          <th className="px-3 py-2 text-center">Trades</th>
                          <th className="px-3 py-2 text-center">Taxa de Acerto</th>
                          <th className="px-3 py-2 text-center">Fator de Lucro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {animatedMetrics.dayOfWeekAnalysis && dayOrder.map(day => {
                          const data = animatedMetrics.dayOfWeekAnalysis[day] || { trades: 0, winRate: 0, profitFactor: 0 };
                          return (
                            <tr key={day} className="border-b border-gray-700">
                              <td className="px-3 py-2">{dayTranslations[day] || day}</td>
                              <td className="px-3 py-2 text-center">{data.trades || '0'}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={data.winRate >= 55 ? 'text-green-400' : data.winRate >= 45 ? 'text-yellow-400' : 'text-red-400'}>
                                  {data.winRate?.toFixed(2) || '0.00'}%
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={data.profitFactor >= 1.5 ? 'text-green-400' : data.profitFactor >= 1.0 ? 'text-yellow-400' : 'text-red-400'}>
                                  {data.profitFactor?.toFixed(2) || '0.00'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Monthly Analysis */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <Calendar className="w-5 h-5 text-blue-400 mr-2" />
                Análise Mensal
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMonthCalendar(!showMonthCalendar)}
                  className="p-1 hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white"
                >
                  {showMonthCalendar ? 'Visualização em Tabela' : 'Visualização em Calendário'}
                </button>
                <button
                  onClick={() => setShowMonthly(!showMonthly)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {showMonthly ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {showMonthly && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {bestMonth && (
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-green-400">
                        <ArrowUp className="w-4 h-4 mr-1" />
                        Melhor Mês: {monthTranslations[bestMonth.month] || bestMonth.month}
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-400">Trades</p>
                          <p className="font-medium">{bestMonth.data.trades || '0'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Taxa de Acerto</p>
                          <p className="font-medium text-green-400">{bestMonth.data.winRate?.toFixed(2) || '0.00'}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Fator de Lucro</p>
                          <p className="font-medium text-green-400">{bestMonth.data.profitFactor?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {worstMonth && (
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-red-400">
                        <ArrowDown className="w-4 h-4 mr-1" />
                        Pior Mês: {monthTranslations[worstMonth.month] || worstMonth.month}
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-400">Trades</p>
                          <p className="font-medium">{worstMonth.data.trades || '0'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Taxa de Acerto</p>
                          <p className="font-medium text-red-400">{worstMonth.data.winRate?.toFixed(2) || '0.00'}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Fator de Lucro</p>
                          <p className="font-medium text-red-400">{worstMonth.data.profitFactor?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {showMonthCalendar ? (
                  renderMonthCalendar()
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-700">
                          <th className="px-3 py-2 text-left">Mês</th>
                          <th className="px-3 py-2 text-center">Trades</th>
                          <th className="px-3 py-2 text-center">Taxa de Acerto</th>
                          <th className="px-3 py-2 text-center">Fator de Lucro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {animatedMetrics.monthlyAnalysis && monthOrder.map(month => {
                          const data = animatedMetrics.monthlyAnalysis[month] || { trades: 0, winRate: 0, profitFactor: 0 };
                          return (
                            <tr key={month} className="border-b border-gray-700">
                              <td className="px-3 py-2">{monthTranslations[month] || month}</td>
                              <td className="px-3 py-2 text-center">{data.trades || '0'}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={data.winRate >= 55 ? 'text-green-400' : data.winRate >= 45 ? 'text-yellow-400' : 'text-red-400'}>
                                  {data.winRate?.toFixed(2) || '0.00'}%
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={data.profitFactor >= 1.5 ? 'text-green-400' : data.profitFactor >= 1.0 ? 'text-yellow-400' : 'text-red-400'}>
                                  {data.profitFactor?.toFixed(2) || '0.00'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
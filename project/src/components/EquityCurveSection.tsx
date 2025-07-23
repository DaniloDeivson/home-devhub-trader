
import React, { useState, useMemo } from 'react';
import { TrendingUp, ChevronUp, ChevronDown, BarChart, LineChart, Calendar, Filter, Settings, DollarSign, Percent } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, defs } from 'recharts';

interface EquityCurveSectionProps {
  showEquityCurve: boolean;
  setShowEquityCurve: (show: boolean) => void;
  data?: {
    "Performance Metrics": {
      "Net Profit": number;
      "Max Drawdown ($)": number;
      "Max Drawdown (%)": number;
      "Profit Factor": number;
      "Sharpe Ratio": number;
      "Win Rate (%)": number;
      "Gross Profit": number;
      "Gross Loss": number;
      "Average Win": number;
      "Average Loss": number;
      "Active Days": number;
      [key: string]: any;
    };
    "Monthly Analysis"?: {
      "Stats": {
        [month: string]: {
          "Net Profit": number;
          "Profit Factor": number;
          "Sharpe Ratio": number;
          "Trades": number;
          "Win Rate (%)": number;
          "Max Drawdown ($)"?: number;
          "Max Drawdown (%)"?: number;
        };
      };
    };
    "Day of Week Analysis"?: {
      "Stats": {
        [day: string]: {
          "Net Profit": number;
          "Profit Factor": number;
          "Sharpe Ratio": number;
          "Trades": number;
          "Win Rate (%)": number;
        };
      };
    };
    "Equity Curve Data"?: {
      "trade_by_trade": Array<{
        date: string;
        fullDate: string;
        valor: number;
        resultado: number;
        drawdown: number;
        drawdownPercent: number;
        peak: number;
        trades: number;
        trade_result?: number;
        trade_percent?: number;
        month?: string;
        isStart: boolean;
      }>;
      "daily": Array<{
        date: string;
        fullDate: string;
        valor: number;
        resultado: number;
        drawdown: number;
        drawdownPercent: number;
        peak: number;
        trades: number;
        resultado_periodo?: number;
        periodo?: string;
        isStart: boolean;
      }>;
      "weekly": Array<any>;
      "monthly": Array<any>;
    };
  } | null;
}

export function EquityCurveSection({
  showEquityCurve,
  setShowEquityCurve,
  data
}: EquityCurveSectionProps) {
  const [chartType, setChartType] = useState<'resultado' | 'drawdown'>('resultado');
  const [timeRange, setTimeRange] = useState<'trade' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [movingAverage, setMovingAverage] = useState<'9' | '20' | '50' | '200' | '2000' | 'nenhuma'>('20');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalInvestment, setTotalInvestment] = useState<string>('100000');

  // Buscar dados reais da API
  const chartData = useMemo(() => {
    if (!data?.["Equity Curve Data"]) {
      return [];
    }

    const equityData = data["Equity Curve Data"];
    
    // Selecionar dados baseado no timeRange
    let selectedData = [];
    switch (timeRange) {
      case 'trade':
        selectedData = equityData.trade_by_trade || [];
        break;
      case 'daily':
        selectedData = equityData.daily || [];
        break;
      case 'weekly':
        selectedData = equityData.weekly || [];
        break;
      case 'monthly':
        selectedData = equityData.monthly || [];
        break;
      default:
        selectedData = equityData.daily || [];
    }

    // Garantir que todos os valores sejam incluídos, mesmo os zeros
    const processedData = selectedData.map(item => ({
      ...item,
      saldo: Number(item.saldo) || Number(item.resultado) || 0,  // Priorizar saldo
      valor: Number(item.valor) || 0,
      resultado: Number(item.resultado) || 0,
      drawdown: Number(item.drawdown) || 0,
      drawdownPercent: Number(item.drawdownPercent) || 0,
      peak: Number(item.peak) || 0,
      trades: Number(item.trades) || 0
    }));

    // Filtrar por período se especificado
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return processedData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });
    }

    return processedData;
  }, [data, timeRange, startDate, endDate]);

  // Calcular média móvel
  const dataWithMA = useMemo(() => {
    if (movingAverage === 'nenhuma' || chartData.length === 0) return chartData;
    
    const maPeriod = parseInt(movingAverage);
    return chartData.map((item, index) => {
      if (index < maPeriod - 1) {
        return { ...item, saldoMA: null };
      }
      
      const sum = chartData
        .slice(index - maPeriod + 1, index + 1)
        .reduce((acc, curr) => acc + (curr.saldo || curr.resultado || 0), 0);
      
      return {
        ...item,
        saldoMA: sum / maPeriod
      };
    });
  }, [chartData, movingAverage]);

  // Calcular estatísticas usando dados reais da API
  const stats = useMemo(() => {
    if (data?.["Performance Metrics"] && chartData.length > 0) {
      const metrics = data["Performance Metrics"];
      
      // Usar valores da API diretamente
      const maxDrawdownAPI = Math.abs(metrics["Max Drawdown ($)"] || 0);
      const maxDrawdownPercentAPI = Math.abs(metrics["Max Drawdown (%)"] || 0);
      
      // Calcular drawdown médio dos dados do gráfico (incluindo zeros)
      const drawdownsValidos = chartData
        .filter(item => !item.isStart) // Excluir apenas ponto inicial
        .map(item => item.drawdown);
      
      const avgDrawdownCalculated = drawdownsValidos.length > 0 
        ? drawdownsValidos.reduce((acc, dd) => acc + dd, 0) / drawdownsValidos.length
        : 0;
      
      // Contar todos os pontos com dados (incluindo zeros)
      const pontosComDados = chartData.filter(item => !item.isStart).length;
      
      return {
        resultado: metrics["Net Profit"] || 0,
        maxDrawdown: maxDrawdownAPI,
        avgDrawdown: avgDrawdownCalculated,
        roi: ((metrics["Net Profit"] || 0) / parseFloat(totalInvestment || "100000")) * 100,
        fatorLucro: metrics["Profit Factor"] || 0,
        winRate: metrics["Win Rate (%)"] || 0,
        sharpeRatio: metrics["Sharpe Ratio"] || 0,
        grossProfit: metrics["Gross Profit"] || 0,
        grossLoss: Math.abs(metrics["Gross Loss"] || 0),
        avgWin: metrics["Average Win"] || 0,
        avgLoss: Math.abs(metrics["Average Loss"] || 0),
        activeDays: metrics["Active Days"] || 0,
        maxDrawdownPercent: maxDrawdownPercentAPI,
        pontosComDados: pontosComDados
      };
    }
    
    return {
      resultado: 0,
      maxDrawdown: 0,
      avgDrawdown: 0,
      roi: 0,
      fatorLucro: 0,
      winRate: 0,
      sharpeRatio: 0,
      grossProfit: 0,
      grossLoss: 0,
      avgWin: 0,
      avgLoss: 0,
      activeDays: 0,
      maxDrawdownPercent: 0,
      pontosComDados: 0
    };
  }, [data, totalInvestment, chartData]);

  // Componente de Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-2">{`Data: ${dataPoint?.fullDate || label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'saldo' && `Saldo: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              {entry.dataKey === 'valor' && `Patrimônio: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              {entry.dataKey === 'resultado' && `Resultado: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              {entry.dataKey === 'drawdown' && `Drawdown: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dataPoint?.drawdownPercent?.toFixed(2) || 0}%)`}
              {entry.dataKey === 'saldoMA' && `MM ${movingAverage}: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
          ))}
          {dataPoint && chartType === 'drawdown' && !dataPoint.isStart && (
            <>
              <p className="text-xs text-gray-400 mt-2">Detalhes do período:</p>
              <p className="text-xs text-gray-400">Trades: {dataPoint.trades || 0}</p>
              {timeRange === 'trade' && dataPoint.trade_result && (
                <p className="text-xs text-gray-400">Resultado do trade: R$ {dataPoint.trade_result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              )}
              {timeRange !== 'trade' && dataPoint.resultado_periodo && (
                <p className="text-xs text-gray-400">Resultado do período: R$ {dataPoint.resultado_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              )}
            </>
          )}
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'drawdown' && `Drawdown: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dataPoint?.drawdownPercent?.toFixed(2) || 0}%)`}
              {entry.dataKey === 'resultadoMA' && `MM ${movingAverage}: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
          ))}
          {dataPoint && chartType === 'resultado' && !dataPoint.isStart && (
            <>
              <p className="text-xs text-gray-400 mt-2">Detalhes do período:</p>
              <p className="text-xs text-gray-400">Trades: {dataPoint.trades || 0}</p>
              {timeRange === 'trade' && dataPoint.trade_result && (
                <p className="text-xs text-gray-400">Resultado do trade: R$ {dataPoint.trade_result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              )}
              {timeRange !== 'trade' && dataPoint.resultado_periodo && (
                <p className="text-xs text-gray-400">Resultado do período: R$ {dataPoint.resultado_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              )}
              <p className="text-xs text-gray-400">Saldo: R$ {(dataPoint.saldo || dataPoint.resultado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-400">DD: R$ {(dataPoint.drawdown || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-400">Pico: R$ {(dataPoint.peak || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Função para formatar labels do eixo X
  const formatXAxisLabel = (value: string) => {
    if (timeRange === 'trade') {
      // Para trade por trade, mostrar apenas alguns pontos
      return '';
    }
    
    if (value.includes('-')) {
      const date = new Date(value);
      if (timeRange === 'daily') {
        return `${date.getDate()}/${date.getMonth() + 1}`;
      } else if (timeRange === 'monthly') {
        return `${date.getMonth() + 1}/${date.getFullYear()}`;
      }
    }
    return value;
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <BarChart className="w-5 h-5 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium">Gráficos</h2>
        </div>
        <button 
          onClick={() => setShowEquityCurve(!showEquityCurve)}
          className="p-1.5 hover:bg-gray-700 rounded-md"
        >
          {showEquityCurve ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      
      {showEquityCurve && (
        <div className="p-4">
          {/* Investment Input */}
          <div className="mb-4 bg-gray-700 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-green-400 mr-2" />
                <h3 className="font-medium">Patrimônio Total Investido</h3>
              </div>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                  <input
                    type="number"
                    value={totalInvestment}
                    onChange={(e) => setTotalInvestment(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Valor investido"
                    min="1"
                  />
                </div>
                <div className="bg-blue-900 bg-opacity-20 px-3 py-2 rounded-md flex items-center">
                  <Percent className="w-4 h-4 text-blue-400 mr-2" />
                  <span className="text-blue-300 font-medium">ROI: {stats.roi.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Type and Time Range Selectors */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo de Gráfico
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'resultado' | 'drawdown')}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="resultado">Evolução do Resultado</option>
                  <option value="drawdown">Drawdown</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Granularidade
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as 'trade' | 'daily' | 'weekly' | 'monthly')}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="trade">Trade por Trade</option>
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Média Móvel
                </label>
                <select
                  value={movingAverage}
                  onChange={(e) => setMovingAverage(e.target.value as '9' | '20' | '50' | '200' | '2000' | 'nenhuma')}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="nenhuma">Nenhuma</option>
                  <option value="9">MM 9 períodos</option>
                  <option value="20">MM 20 períodos</option>
                  <option value="50">MM 50 períodos</option>
                  <option value="200">MM 200 períodos</option>
                  <option value="2000">MM 2000 períodos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="bg-gray-700 p-4 rounded-lg">
            {!data?.["Performance Metrics"] ? (
              <div className="text-center text-gray-400 mb-4">
                Nenhum dado de backtest disponível
              </div>
            ) : (
              <div className="text-center text-gray-400 mb-4">
                {chartType === 'resultado' 
                  ? `Evolução ${timeRange === 'trade' ? 'por Trade' : timeRange === 'daily' ? 'Diária' : timeRange === 'weekly' ? 'Semanal' : 'Mensal'} (${stats.pontosComDados} pontos) - Resultado Total: R$ ${stats.resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                  : `Drawdown ${timeRange === 'trade' ? 'por Trade' : timeRange === 'daily' ? 'Diário' : timeRange === 'weekly' ? 'Semanal' : 'Mensal'} (${stats.pontosComDados} pontos) - Máximo: R$ ${stats.maxDrawdown.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${stats.maxDrawdownPercent.toFixed(2)}%)`}
              </div>
            )}
            
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'resultado' ? (
                    <AreaChart data={dataWithMA}>
                      <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.6}/>
                          <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={formatXAxisLabel}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={(value) => {
                          if (value >= 1000) {
                            return `R$ ${(value/1000).toFixed(1)}k`;
                          }
                          return `R$ ${value.toFixed(0)}`;
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      
                      <Area
                        type="monotone"
                        dataKey="saldo"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#equityGradient)"
                        name="Saldo Cumulativo"
                      />
                      
                      {movingAverage !== 'nenhuma' && (
                        <Line
                          type="monotone"
                          dataKey="saldoMA"
                          stroke="#FBBF24"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name={`Média Móvel ${movingAverage}`}
                        />
                      )}
                    </AreaChart>
                  ) : (
                    <AreaChart data={dataWithMA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={formatXAxisLabel}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={(value) => {
                          if (value >= 1000) {
                            return `R$ ${(value/1000).toFixed(1)}k`;
                          }
                          return `R$ ${value.toFixed(0)}`;
                        }}
                        domain={[0, 'dataMax']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      
                      <Area
                        type="monotone"
                        dataKey="drawdown"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.3}
                        name="Drawdown"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  {chartType === 'resultado' 
                    ? <LineChart className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                    : <BarChart className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                  }
                  <p>Nenhum dado disponível para {timeRange}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Chart Legend and Info */}
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-4 md:mb-0">
                <h4 className="text-sm font-medium mb-2 text-gray-300">Legenda</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-b from-green-500 to-blue-600 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-400">
                      {chartType === 'resultado' ? `Saldo ${timeRange === 'trade' ? 'por Trade' : timeRange === 'daily' ? 'Diário' : timeRange === 'weekly' ? 'Semanal' : 'Mensal'}` : 'Drawdown'}
                    </span>
                  </div>
                  {movingAverage !== 'nenhuma' && chartType === 'resultado' && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-400">Média Móvel {movingAverage}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-gray-400">Resultado Total</p>
                  <p className={`text-lg font-medium ${stats.resultado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {stats.resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">DD Máximo</p>
                  <p className="text-lg font-medium text-red-400">
                    R$ {stats.maxDrawdown.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    <span className="text-sm text-gray-400 ml-1">({stats.maxDrawdownPercent.toFixed(2)}%)</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">DD Médio</p>
                  <p className="text-lg font-medium text-orange-400">R$ {stats.avgDrawdown.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Fator de Lucro</p>
                  <p className={`text-lg font-medium ${stats.fatorLucro >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.fatorLucro.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Win Rate</p>
                  <p className="text-lg font-medium text-blue-400">{stats.winRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">ROI</p>
                  <p className={`text-lg font-medium ${stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.roi.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

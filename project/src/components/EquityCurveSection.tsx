
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, BarChart, LineChart, DollarSign, Percent } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface EquityCurveSectionProps {
  showEquityCurve: boolean;
  setShowEquityCurve: (show: boolean) => void;
  selectedStrategy?: string | null;
  selectedAsset?: string | null;
  fileResults?: {[key: string]: any};
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
  selectedStrategy,
  selectedAsset,
  fileResults,
  data
}: EquityCurveSectionProps) {
  
  // Debug logs para verificar se os dados estão chegando
  console.log('🎯 EquityCurveSection - Props recebidas:');
  console.log('  📁 fileResults:', fileResults ? Object.keys(fileResults) : 'null');
  console.log('  🎯 selectedStrategy:', selectedStrategy);
  console.log('  🎯 selectedAsset:', selectedAsset);
  console.log('  📊 data:', data ? 'disponível' : 'null');
  

  const [chartType, setChartType] = useState<'resultado' | 'drawdown'>('resultado');
  const [timeRange, setTimeRange] = useState<'trade' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [movingAverage, setMovingAverage] = useState<'9' | '20' | '50' | '200' | '2000' | 'nenhuma'>('20');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalInvestment, setTotalInvestment] = useState<string>('100000');

  // Gerar dados do gráfico baseado nos filtros e dados reais
  const chartData = useMemo(() => {
    console.log('🔄 chartData useMemo executado');
    console.log('  🎯 selectedStrategy:', selectedStrategy);
    console.log('  🎯 selectedAsset:', selectedAsset);
    console.log('  📁 fileResults:', fileResults ? Object.keys(fileResults) : 'null');
    console.log('  📊 data:', data ? Object.keys(data) : 'null');
    
    // Se há estratégia selecionada, buscar dados reais do CSV correspondente
    if (selectedStrategy && fileResults) {
      console.log('✅ Condição atendida: estratégia selecionada e fileResults disponível');
      
      // Tentar encontrar os dados da estratégia com e sem extensão .csv
      const strategyData = fileResults[selectedStrategy] || fileResults[`${selectedStrategy}.csv`];
      console.log('📊 strategyData encontrado:', !!strategyData);
      console.log('🔍 Procurando por:', selectedStrategy, 'ou', `${selectedStrategy}.csv`);
      
      if (strategyData && strategyData["Equity Curve Data"]) {
        console.log('📈 Equity Curve Data encontrado');
        const equityData = strategyData["Equity Curve Data"];
        console.log('📋 Tipos de dados disponíveis:', Object.keys(equityData));
        
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

        console.log('📊 Dados selecionados:', selectedData.length, 'pontos');
        console.log('📅 TimeRange:', timeRange);

        // Processar dados reais
        const processedData = selectedData.map((item: any) => ({
          ...item,
          saldo: Number(item.saldo) || Number(item.resultado) || 0,
          valor: Number(item.valor) || 0,
          resultado: Number(item.resultado) || 0,
          drawdown: Number(item.drawdown) || 0,
          drawdownPercent: Number(item.drawdownPercent) || 0,
          peak: Number(item.peak) || 0,
          trades: Number(item.trades) || 0
        }));

        console.log('✅ Dados processados:', processedData.length, 'pontos');
        return processedData;
      } else {
        console.log('❌ strategyData ou Equity Curve Data não encontrado');
      }
    } else {
      console.log('❌ Condição não atendida: selectedStrategy ou fileResults não disponível');
    }
    
    // Caso contrário, usar dados da equity curve consolidada (comportamento atual)
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
  }, [data, timeRange, startDate, endDate, selectedStrategy, selectedAsset, fileResults]);

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

  // Calcular estatísticas usando dados reais do gráfico quando possível
  const stats = useMemo(() => {
    // Se há estratégia selecionada, usar dados reais da estratégia
    if (selectedStrategy && fileResults && fileResults[selectedStrategy]) {
      const strategyData = fileResults[selectedStrategy];
      const metrics = strategyData["Performance Metrics"];
      
      if (metrics && chartData.length > 0) {
        // Calcular estatísticas dos dados do gráfico
        const dadosValidos = chartData.filter((item: any) => !item.isStart);
        
        // Resultado total do gráfico (último valor)
        const ultimoValor = chartData.length > 0 ? chartData[chartData.length - 1] : null;
        const resultadoGrafico = ultimoValor ? (ultimoValor.saldo || ultimoValor.resultado || 0) : 0;
        
        // Drawdown máximo do gráfico
        const drawdownsGrafico = dadosValidos.map((item: any) => Math.abs(item.drawdown || 0));
        const maxDrawdownGrafico = drawdownsGrafico.length > 0 ? Math.max(...drawdownsGrafico) : 0;
        
        // Drawdown médio do gráfico
        const avgDrawdownCalculated = drawdownsGrafico.length > 0 
          ? drawdownsGrafico.reduce((acc: number, dd: number) => acc + dd, 0) / drawdownsGrafico.length
          : 0;
        
        // Drawdown percentual máximo do gráfico
        const drawdownsPercentGrafico = dadosValidos.map((item: any) => Math.abs(item.drawdownPercent || 0));
        const maxDrawdownPercentGrafico = drawdownsPercentGrafico.length > 0 ? Math.max(...drawdownsPercentGrafico) : 0;
        
        // Contar pontos com dados
        const pontosComDados = dadosValidos.length;
        
        return {
          resultado: resultadoGrafico,
          maxDrawdown: maxDrawdownGrafico,
          avgDrawdown: avgDrawdownCalculated,
          roi: (resultadoGrafico / parseFloat(totalInvestment || "100000")) * 100,
          fatorLucro: metrics["Profit Factor"] || 0,
          winRate: metrics["Win Rate (%)"] || 0,
          sharpeRatio: metrics["Sharpe Ratio"] || 0,
          grossProfit: metrics["Gross Profit"] || 0,
          grossLoss: Math.abs(metrics["Gross Loss"] || 0),
          avgWin: metrics["Average Win"] || 0,
          avgLoss: Math.abs(metrics["Average Loss"] || 0),
          activeDays: metrics["Active Days"] || 0,
          maxDrawdownPercent: maxDrawdownPercentGrafico,
          pontosComDados: pontosComDados
        };
      }
    }
    
    // Caso contrário, usar dados consolidados
    if (data?.["Performance Metrics"] && chartData.length > 0) {
      const metrics = data["Performance Metrics"];
      
      // Calcular estatísticas dos dados do gráfico
      const dadosValidos = chartData.filter(item => !item.isStart);
      
      // Resultado total do gráfico (último valor)
      const ultimoValor = chartData.length > 0 ? chartData[chartData.length - 1] : null;
      const resultadoGrafico = ultimoValor ? (ultimoValor.saldo || ultimoValor.resultado || 0) : 0;
      
      // Drawdown máximo do gráfico
      const drawdownsGrafico = dadosValidos.map(item => Math.abs(item.drawdown || 0));
      const maxDrawdownGrafico = drawdownsGrafico.length > 0 ? Math.max(...drawdownsGrafico) : 0;
      
      // Drawdown médio do gráfico
      const avgDrawdownCalculated = drawdownsGrafico.length > 0 
        ? drawdownsGrafico.reduce((acc, dd) => acc + dd, 0) / drawdownsGrafico.length
        : 0;
      
      // Drawdown percentual máximo do gráfico
      const drawdownsPercentGrafico = dadosValidos.map(item => Math.abs(item.drawdownPercent || 0));
      const maxDrawdownPercentGrafico = drawdownsPercentGrafico.length > 0 ? Math.max(...drawdownsPercentGrafico) : 0;
      
      // Contar pontos com dados
      const pontosComDados = dadosValidos.length;
      
      // Usar dados do gráfico quando disponível, senão usar API
      const resultadoFinal = resultadoGrafico !== 0 ? resultadoGrafico : (metrics["Net Profit"] || 0);
      const maxDrawdownFinal = maxDrawdownGrafico !== 0 ? maxDrawdownGrafico : Math.abs(metrics["Max Drawdown ($)"] || 0);
      const maxDrawdownPercentFinal = maxDrawdownPercentGrafico !== 0 ? maxDrawdownPercentGrafico : Math.abs(metrics["Max Drawdown (%)"] || 0);
      
      // PADRONIZAÇÃO: Usar valores padronizados quando disponíveis
      const maxDrawdownPadronizado = metrics["Max Drawdown Padronizado ($)"] || maxDrawdownFinal;
      const maxDrawdownPctPadronizado = metrics["Max Drawdown Padronizado (%)"] || maxDrawdownPercentFinal;
      
      // PADRONIZAÇÃO: Log para debug dos valores de drawdown
      console.log("🔍 DEBUG - Drawdown values:", {
        maxDrawdownGrafico,
        maxDrawdownPercentGrafico,
        apiDrawdown: metrics["Max Drawdown ($)"],
        apiDrawdownPercent: metrics["Max Drawdown (%)"],
        finalDrawdown: maxDrawdownFinal,
        finalDrawdownPercent: maxDrawdownPercentFinal
      });
      
      return {
        resultado: resultadoFinal,
        maxDrawdown: maxDrawdownPadronizado,
        avgDrawdown: avgDrawdownCalculated,
        roi: (resultadoFinal / parseFloat(totalInvestment || "100000")) * 100,
        fatorLucro: metrics["Profit Factor"] || 0,
        winRate: metrics["Win Rate (%)"] || 0,
        sharpeRatio: metrics["Sharpe Ratio"] || 0,
        grossProfit: metrics["Gross Profit"] || 0,
        grossLoss: Math.abs(metrics["Gross Loss"] || 0),
        avgWin: metrics["Average Win"] || 0,
        avgLoss: Math.abs(metrics["Average Loss"] || 0),
        activeDays: metrics["Active Days"] || 0,
        maxDrawdownPercent: maxDrawdownPctPadronizado,
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
  }, [data, totalInvestment, selectedStrategy, selectedAsset, fileResults, timeRange]);

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
                {(selectedStrategy || selectedAsset) && (
                  <div className="mb-2 p-2 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg">
                    <span className="text-blue-400 text-sm">
                      📊 Filtros ativos: {selectedStrategy && `Estratégia: ${selectedStrategy}`} {selectedStrategy && selectedAsset && ' | '} {selectedAsset && `Ativo: ${selectedAsset}`}
                    </span>
                  </div>
                )}
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
            <div className="mb-2 text-xs text-gray-400 flex items-center">
              <span className="text-green-400 mr-1">📊</span>
              Métricas sincronizadas com os dados do gráfico
            </div>
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
                  <p className="text-xs text-gray-400 flex items-center">
                    Resultado Total
                    <span className="ml-1 text-green-400 text-xs">📊</span>
                  </p>
                  <p className={`text-lg font-medium ${stats.resultado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {stats.resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 flex items-center">
                    DD Máximo
                    <span className="ml-1 text-green-400 text-xs">📊</span>
                  </p>
                  <p className="text-lg font-medium text-red-400">
                    R$ {stats.maxDrawdown.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    <span className="text-sm text-gray-400 ml-1">({stats.maxDrawdownPercent.toFixed(2)}%)</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 flex items-center">
                    DD Médio
                    <span className="ml-1 text-green-400 text-xs">📊</span>
                  </p>
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

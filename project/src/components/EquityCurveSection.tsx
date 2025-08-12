import { useState, useMemo, useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { ChevronUp, ChevronDown, BarChart, LineChart, DollarSign, Percent } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { calculateDirectConsolidation } from '../utils/directConsolidation';
import type { FileResult, EquityCurveData, EquityCurvePoint, Trade, PerformanceMetrics } from '../types/backtest';

interface EquityCurveSectionProps {
  showEquityCurve: boolean;
  setShowEquityCurve: (show: boolean) => void;
  selectedStrategy?: string | null;
  selectedAsset?: string | null;
  fileResults?: Record<string, FileResult>;
  data?: {
    "Performance Metrics": PerformanceMetrics & { [key: string]: unknown };
    "Monthly Analysis"?: { Stats: Record<string, unknown> };
    "Day of Week Analysis"?: { Stats: Record<string, unknown> };
    "Equity Curve Data"?: EquityCurveData;
    trades?: Trade[];
  } | null;
  // Novas props para suportar modo consolidado/individual
  showConsolidated?: boolean;
  selectedFiles?: string[];
  files?: File[];
  // NOVAS PROPS: Métricas já calculadas pelo BacktestAnalysisPage
  consolidatedMetrics?: {
    resultado: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    avgDrawdown: number;
    fatorLucro: number;
    winRate: number;
    roi: number;
    pontosComDados: number;
  };
}

export function EquityCurveSection({
  showEquityCurve,
  setShowEquityCurve,
  selectedStrategy,
  selectedAsset,
  fileResults,
  data,
  showConsolidated = true,
  selectedFiles = [],
  files = [],
  // consolidatedMetrics
}: EquityCurveSectionProps) {
  const [chartType, setChartType] = useState<'resultado' | 'drawdown'>('resultado');
  const [timeRange, setTimeRange] = useState<'trade' | 'daily'>('daily');
  const [movingAverage, setMovingAverage] = useState<'9' | '20' | '50' | '200' | '2000' | 'nenhuma'>('20');
  const investedCapital = useSettingsStore((s) => s.investedCapital);
  const setInvestedCapital = useSettingsStore((s) => s.setInvestedCapital);
  const [totalInvestment, setTotalInvestment] = useState<string>(String(investedCapital));

  // ✅ CORREÇÃO: Função centralizada para aplicar filtros
  const getFilteredFileResults = useCallback((): Record<string, FileResult> => {
    if (!fileResults) {
      return {} as Record<string, FileResult>;
    }
    
    let filteredResults: Record<string, FileResult> = { ...fileResults };
    
    // ✅ CORREÇÃO: Aplicar filtros baseado no modo e seleções
    if (!showConsolidated && selectedFiles.length > 0) {
      // Modo individual: usar apenas os arquivos selecionados
      filteredResults = {} as Record<string, FileResult>;
      selectedFiles.forEach(fileName => {
        if (fileResults[fileName]) {
          filteredResults[fileName] = fileResults[fileName];
        }
      });
    } else if (showConsolidated && selectedStrategy) {
      // Modo consolidado com filtro de estratégia
      filteredResults = {} as Record<string, FileResult>;
      Object.keys(fileResults).forEach(fileName => {
        if (fileName === selectedStrategy || fileName === `${selectedStrategy}.csv`) {
          filteredResults[fileName] = fileResults[fileName];
        }
      });
    }
    
    // ✅ CORREÇÃO: Aplicar filtro de ativo se selecionado
    if (selectedAsset) {
      const assetFilteredResults: Record<string, FileResult> = {};
      Object.keys(filteredResults).forEach(fileName => {
        const strategyData = filteredResults[fileName];
        if (strategyData && strategyData.trades) {
          const filteredTrades = strategyData.trades.filter((trade) => trade.symbol === selectedAsset);
          
          if (filteredTrades.length > 0) {
            assetFilteredResults[fileName] = {
              ...strategyData,
              trades: filteredTrades
            } as FileResult;
          }
        }
      });
      
      filteredResults = assetFilteredResults;
    }
    
    return filteredResults;
  }, [fileResults, showConsolidated, selectedFiles, selectedStrategy, selectedAsset]);

  type CombinedTrade = Trade & { strategy: string; date?: string; end_date?: string };


  // Função para gerar cores únicas para cada estratégia
  const getStrategyColor = (_strategyName: string, index: number) => {
    const colors = [
      '#10B981', // Verde
      '#3B82F6', // Azul
      '#F59E0B', // Amarelo
      '#EF4444', // Vermelho
      '#8B5CF6', // Roxo
      '#06B6D4', // Ciano
      '#F97316', // Laranja
      '#EC4899', // Rosa
      '#84CC16', // Verde lima
      '#6366F1', // Índigo
    ];
    
    return colors[index % colors.length];
  };

  // Gerar dados do gráfico baseado nos filtros e dados reais
  const chartData = useMemo(() => {
    console.log('🔄 chartData useMemo executado');
    console.log('🚨🚨🚨 VERIFICAÇÃO CRÍTICA - Parâmetros principais:');
    console.log('  📊 chartType:', chartType);
    console.log('  📊 showConsolidated:', showConsolidated);
    console.log('  🎯 selectedStrategy:', selectedStrategy);
    console.log('  🎯 selectedAsset:', selectedAsset);
    console.log('  📁 fileResults:', fileResults ? Object.keys(fileResults) : 'null');
    console.log('  📊 data:', data ? Object.keys(data) : 'null');
    console.log('  📊 showConsolidated:', showConsolidated);
    console.log('  📁 selectedFiles:', selectedFiles);
    console.log('  📁 files:', files.length);
    
    console.log('🚨🚨🚨 PONTO DE VERIFICAÇÃO - Chegando na lógica principal');
    console.log('🚨🚨🚨 chartType=' + chartType + ', showConsolidated=' + showConsolidated);
    
    // ✅ CORREÇÃO: Usar função centralizada para obter fileResults filtrados
    const filteredFileResults = getFilteredFileResults();
    const hasValidFileResults = filteredFileResults && Object.keys(filteredFileResults).length > 0;
    
    console.log('📊 FileResults filtrados:', Object.keys(filteredFileResults));
    console.log('📊 FileResults válidos:', hasValidFileResults);
    
    // ✅ CORREÇÃO: MODO INDIVIDUAL - Usar dados das estratégias selecionadas
    if (!showConsolidated && selectedFiles.length > 0 && hasValidFileResults) {
      console.log('🔧 MODO INDIVIDUAL: Usando dados das estratégias selecionadas');
      
      const strategiesList: string[] = Object.keys(filteredFileResults);
      console.log('📊 Estratégias selecionadas para modo individual:', strategiesList);
      
      // ✅ CORREÇÃO: Para modo individual, usar cálculo consolidado (como no modo consolidado)
      console.log('🔧 MODO INDIVIDUAL: Usando cálculo consolidado para gráfico');
      
      // METODOLOGIA PADRONIZADA PYTHON: Replicar exatamente FunCalculos.py
      console.log('🔧 APLICANDO METODOLOGIA PYTHON - Coletando todos os trades');
      console.log('📖 Referência: FunCalculos.py linhas 474-476 (cumsum, cummax, equity-peak)');
      
      // 1. Coletar todos os trades de todas as estratégias selecionadas
      const allTrades: CombinedTrade[] = [];
      
      strategiesList.forEach(fileName => {
        const strategyData = filteredFileResults[fileName];
        if (strategyData && strategyData.trades) {
          strategyData.trades.forEach((trade) => {
            const when = (trade.exit_date as string) ?? (trade.entry_date as string) ?? (trade.date as string) ?? '1970-01-01';
            allTrades.push({
              ...trade,
              strategy: fileName,
              pnl: Number(trade.pnl) || 0,
              entry_date: trade.entry_date ?? trade.date ?? when,
              exit_date: trade.exit_date ?? trade.entry_date ?? trade.date ?? when,
              date: when
            });
          });
        }
      });
      
      console.log(`📊 Total de trades coletados: ${allTrades.length}`);
      
      // VALIDAÇÃO: Verificar se há trades suficientes
      if (allTrades.length === 0) {
        console.warn('⚠️ Nenhum trade encontrado para processar');
        // Fallback não-vazio: usar dados de Equity Curve disponíveis nas estratégias selecionadas
        for (const fileName of strategiesList) {
          const strategyData = filteredFileResults[fileName];
          const equityData = strategyData?.["Equity Curve Data"] || strategyData?.equity_curve_data;
          if (equityData) {
            let selectedData: EquityCurvePoint[] = [] as EquityCurvePoint[];
            switch (timeRange) {
              case 'trade':
                selectedData = equityData.trade_by_trade || [];
                break;
              case 'daily':
                selectedData = equityData.daily || [];
                break;
              default:
                selectedData = equityData.daily || [];
            }
            if (selectedData.length > 0) {
              const processed = (selectedData as EquityCurvePoint[]).map((item) => ({
                ...item,
                saldo: Number(item.saldo ?? item.resultado ?? 0),
                valor: Number(item.valor ?? 0),
                resultado: Number(item.resultado ?? 0),
                drawdown: Number(item.drawdown ?? 0),
                drawdownPercent: Number(item.drawdownPercent ?? 0),
                peak: Number(item.peak ?? 0),
                trades: Number(item.trades ?? 0),
                strategy: fileName
              }));
              return processed;
            }
          }
        }
        // Se nada disponível, deixar seguir para outros caminhos fora deste bloco
      }
      
      // 2. Ordenar trades por data de entrada
      allTrades.sort((a, b) => new Date(a.exit_date ?? a.entry_date ?? a.date ?? '1970-01-01').getTime() - new Date(b.exit_date ?? b.entry_date ?? b.date ?? '1970-01-01').getTime());
      console.log('📊 Trades ordenados cronologicamente');
      
      // 3. CALCULAR EQUITY CURVE CONSOLIDADA (METODOLOGIA PYTHON)
      console.log('🔧 CALCULANDO EQUITY CURVE CONSOLIDADA');
      console.log('📖 Referência: FunCalculos.py - cumsum, cummax, equity-peak');
      
      let runningTotal = 0;
      let peak = 0;
      let maxDrawdown = 0;
      const equityCurve: Array<EquityCurvePoint & { strategy?: string }> = [];
      
      allTrades.forEach((trade, index) => {
        const pnl = Number(trade.pnl) || 0;
        runningTotal += pnl;
        
        // Atualizar peak
        if (runningTotal > peak) {
          peak = runningTotal;
        }
        
        // Calcular drawdown
        const drawdown = Math.abs(Math.min(0, runningTotal - peak));
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
        
        const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
        
        const timeKey = (trade.exit_date as string) ?? (trade.entry_date as string) ?? (trade.date as string) ?? '1970-01-01';
        equityCurve.push({
          date: timeKey,
          fullDate: timeKey,
          saldo: runningTotal,
          valor: runningTotal,
          resultado: pnl,
          drawdown: drawdown,
          drawdownPercent: drawdownPercent,
          peak: peak,
          trades: index + 1,
          strategy: 'Consolidado Individual'
        });
      });
      
      console.log('✅ Equity curve consolidada calculada:', equityCurve.length, 'pontos');
      console.log('📊 Exemplo de dados consolidados:', equityCurve[0]);
      console.log('📊 Último ponto consolidado:', equityCurve[equityCurve.length - 1]);
      console.log('📊 Máximo drawdown consolidado:', maxDrawdown);
      console.log('📊 Peak consolidado:', peak);
      
      return equityCurve;
    }
    
    // ✅ CORREÇÃO: MODO CONSOLIDADO - Usar cálculo consolidado
    if (showConsolidated && hasValidFileResults) {
      console.log('✅ ENTRANDO NO MODO CONSOLIDADO');
      const strategiesList: string[] = Object.keys(filteredFileResults);
      console.log('📊 Modo consolidado: combinando dados de todas as estratégias:', strategiesList);
      console.log('🎯 Filtro de estratégia:', selectedStrategy || 'Todas');
      console.log('🎯 Filtro de ativo:', selectedAsset || 'Todos');
      console.log('📊 Tipo de gráfico:', chartType);
      
      // ✅ CORREÇÃO: Para modo consolidado, usar cálculo consolidado adequado por granularidade
      console.log('🔧 MODO CONSOLIDADO: Usando cálculo consolidado para', timeRange === 'trade' ? 'trade-by-trade' : 'diário');
      
      // Primeiro, coletar todos os dados e encontrar o range de datas
      const allData: Array<EquityCurvePoint & { strategy?: string }> = [];
      const allDates = new Set<string>();
      
      strategiesList.forEach(fileName => {
        const strategyData = filteredFileResults[fileName];
        const equityData = strategyData?.["Equity Curve Data"] || strategyData?.equity_curve_data;
        console.log(`🔍 Verificando dados para ${fileName}:`, {
          hasStrategyData: !!strategyData,
          strategyDataKeys: strategyData ? Object.keys(strategyData) : [],
          hasEquityCurveData: !!equityData,
          equityCurveKeys: equityData ? Object.keys(equityData) : []
        });
        
        if (equityData) {
          
          // Selecionar dados baseado no timeRange
          let selectedData: EquityCurvePoint[] = [] as EquityCurvePoint[];
          switch (timeRange) {
            case 'trade':
              selectedData = equityData.trade_by_trade || [];
              break;
            case 'daily':
              selectedData = equityData.daily || [];
              break;
            default:
              selectedData = equityData.daily || [];
          }
          
          console.log(`📊 ${fileName} - Dados selecionados para ${timeRange}:`, {
            totalPoints: selectedData.length,
            sampleData: selectedData[0],
            lastData: selectedData[selectedData.length - 1]
          });
          
          // Processar dados da estratégia
          const processedData = (selectedData as EquityCurvePoint[]).map((item) => ({
            ...item,
            saldo: Number(item.saldo ?? item.resultado ?? 0),
            valor: Number(item.valor ?? 0),
            resultado: Number(item.resultado ?? 0),
            drawdown: Number(item.drawdown ?? 0),
            drawdownPercent: Number(item.drawdownPercent ?? 0),
            peak: Number(item.peak ?? 0),
            trades: Number(item.trades ?? 0),
            strategy: fileName
          }));
          
          // Adicionar datas ao conjunto
          processedData.forEach(item => {
            if (item.fullDate) {
              allDates.add(item.fullDate);
            }
          });
          
          allData.push(...processedData);
          console.log(`📊 ${fileName}: ${processedData.length} pontos adicionados`);
          console.log(`📊 ${fileName} - Exemplo de dados processados:`, processedData[0]);
          console.log(`📊 ${fileName} - Último ponto:`, processedData[processedData.length - 1]);
          console.log(`📊 ${fileName} - Range de valores saldo:`, {
            min: Math.min(...processedData.map((p) => p.saldo ?? 0)),
            max: Math.max(...processedData.map((p) => p.saldo ?? 0)),
            last: processedData[processedData.length - 1]?.saldo
          });
        }
      });
      
      // Ordenar todas as datas
      const sortedDates = Array.from(allDates)
        .filter(date => {
          // ✅ CORREÇÃO: Filtrar apenas datas válidas
          if (!date || date === 'Invalid Date' || date === 'undefined' || date === 'null') {
            return false;
          }
          try {
            const dateObj = new Date(date);
            return !isNaN(dateObj.getTime());
          } catch {
            return false;
          }
        })
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      console.log('📅 Range de datas válidas:', sortedDates[0], 'até', sortedDates[sortedDates.length - 1]);
      console.log('📅 Total de datas únicas válidas:', sortedDates.length);
      
      // Consolidar de acordo com a granularidade selecionada
      if (timeRange === 'daily') {
        // Alinhar exatamente à mesma lógica de consolidação usada no consolidado global
        const consolidated = calculateDirectConsolidation(filteredFileResults, selectedAsset, 'daily');
        // Reconstruir a série diária para o gráfico a partir de fileResults e do algoritmo de consolidação
        // 1) Agrupar por dia os PnLs de todos os trades
        const dailyResultByDate = new Map<string, number>();
        Object.keys(filteredFileResults).forEach(fileName => {
          const strategyData = filteredFileResults[fileName];
          const trades = (strategyData?.trades || []) as Array<{ exit_date?: string; entry_date?: string; date?: string; pnl?: number }>;
          trades.forEach((t) => {
            const day = String(((t.exit_date || t.entry_date || t.date || '') as string).toString().split('T')[0]);
            if (!day) return;
            const pnl = Number(t.pnl ?? 0) || 0;
            dailyResultByDate.set(day, (dailyResultByDate.get(day) || 0) + pnl);
          });
        });
        const sorted = Array.from(dailyResultByDate.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
        let cumsum = 0;
        let peak = 0;
        let maxDD = 0;
        const series: Array<EquityCurvePoint & { strategy?: string }> = [];
        sorted.forEach(([day, pnl], idx) => {
          cumsum += pnl;
          if (cumsum > peak) peak = cumsum;
          const ddNow = Math.abs(Math.min(0, cumsum - peak)); // drawdown instantâneo
          if (ddNow > maxDD) { maxDD = ddNow; } // máximo só para legenda/stats
          series.push({
            date: day,
            fullDate: day,
            saldo: cumsum,
            valor: cumsum,
            resultado: pnl,
            drawdown: ddNow, // usar drawdown instantâneo no gráfico
            drawdownPercent: peak > 0 ? (ddNow / peak) * 100 : 0,
            peak,
            trades: idx + 1,
            strategy: 'Consolidado Diário'
          });
        });
        console.log('✅ Equity curve diária (consolidation) calculada:', series.length, 'pontos', '| DD Máximo:', maxDD, '| DD calc util:', consolidated.maxDrawdownAbsoluto);
        return series;
      } else {
        // METODOLOGIA PADRONIZADA PYTHON: consolidar trade a trade pelos trades brutos
        console.log('🔧 APLICANDO METODOLOGIA PYTHON - Coletando todos os trades');
        console.log('📖 Referência: FunCalculos.py linhas 474-476 (cumsum, cummax, equity-peak)');
        const allTrades: CombinedTrade[] = [];
        strategiesList.forEach(fileName => {
          const strategyData = filteredFileResults[fileName];
          if (strategyData && strategyData.trades) {
            strategyData.trades.forEach((trade) => {
              const when = (trade.exit_date as string) ?? (trade.entry_date as string) ?? (trade.date as string) ?? '1970-01-01';
              allTrades.push({
                ...trade,
                strategy: fileName,
                pnl: Number(trade.pnl) || 0,
                entry_date: trade.entry_date ?? trade.date ?? when,
                exit_date: trade.exit_date ?? trade.entry_date ?? trade.date ?? when,
                date: when
              });
            });
          }
        });
        console.log(`📊 Total de trades coletados: ${allTrades.length}`);
        if (allTrades.length === 0) {
          console.warn('⚠️ Nenhum trade encontrado para processar (trade-by-trade)');
          return [] as EquityCurvePoint[];
        }
        allTrades.sort((a, b) => new Date(a.exit_date ?? a.entry_date ?? a.date ?? '1970-01-01').getTime() - new Date(b.exit_date ?? b.entry_date ?? b.date ?? '1970-01-01').getTime());
        console.log('📊 Trades ordenados cronologicamente');
        let runningTotal = 0;
        let peak = 0;
        let maxDrawdown = 0;
        const equityCurve: Array<EquityCurvePoint & { strategy?: string } > = [];
        allTrades.forEach((trade, index) => {
          const pnl = Number(trade.pnl) || 0;
          runningTotal += pnl;
          if (runningTotal > peak) peak = runningTotal;
          const drawdown = Math.abs(Math.min(0, runningTotal - peak));
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;
          const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
          const timeKey = (trade.exit_date as string) ?? (trade.entry_date as string) ?? (trade.date as string) ?? '1970-01-01';
          equityCurve.push({
            date: timeKey,
            fullDate: timeKey,
            saldo: runningTotal,
            valor: runningTotal,
            resultado: pnl,
            drawdown,
            drawdownPercent,
            peak,
            trades: index + 1,
            strategy: 'Consolidado'
          });
        });
        console.log('✅ Equity curve consolidada calculada:', equityCurve.length, 'pontos', '| DD Máximo:', maxDrawdown);
        console.log('📊 Exemplo de dados consolidados:', equityCurve[0]);
        console.log('📊 Último ponto consolidado:', equityCurve[equityCurve.length - 1]);
        console.log('📊 Máximo drawdown consolidado:', maxDrawdown);
        console.log('📊 Peak consolidado:', peak);
        return equityCurve;
      }
    }
    
    // ✅ CORREÇÃO: Caso específico para CSV único - verificar se há dados de equity curve
    if (data && data["Equity Curve Data"]) {
      console.log('✅ CSV ÚNICO: Usando dados de Equity Curve Data');
      const equityData = data["Equity Curve Data"];
      
      // Selecionar dados baseado no timeRange
      let selectedData: EquityCurvePoint[] = [] as EquityCurvePoint[];
          switch (timeRange) {
        case 'trade':
          selectedData = equityData.trade_by_trade || [];
          break;
            case 'daily':
          selectedData = equityData.daily || [];
              break;
            default:
          selectedData = equityData.daily || [];
      }
      
      console.log(`📊 CSV ÚNICO: Dados selecionados para ${timeRange}: ${selectedData.length} pontos`);
      
      if (selectedData.length > 0) {
        console.log('✅ Dados de equity curve encontrados:', selectedData.length, 'pontos');
        return (selectedData as EquityCurvePoint[]).map((item) => ({
          ...item,
          saldo: Number(item.saldo ?? item.resultado ?? 0),
          valor: Number(item.valor ?? 0),
          resultado: Number(item.resultado ?? 0),
          drawdown: Number(item.drawdown ?? 0),
          drawdownPercent: Number(item.drawdownPercent ?? 0),
          peak: Number(item.peak ?? 0),
          trades: Number(item.trades ?? 0)
        }));
      }
    }
    
    // Removido fallback vazio quando nenhum arquivo está selecionado no modo individual
    
    // Se há estratégia selecionada, usar dados reais da estratégia
    if (selectedStrategy && fileResults) {
      // Tentar encontrar os dados da estratégia com e sem extensão .csv
      const strategyData = fileResults[selectedStrategy] || fileResults[`${selectedStrategy}.csv`];
      console.log('🔍 Buscando dados da estratégia:', {
        selectedStrategy,
        hasStrategyData: !!strategyData,
        availableKeys: Object.keys(fileResults)
      });
      
      if (strategyData && strategyData["Equity Curve Data"]) {
          const equityData = strategyData["Equity Curve Data"];
          
          // Selecionar dados baseado no timeRange
      let selectedData: EquityCurvePoint[] = [];
          switch (timeRange) {
            case 'trade':
              selectedData = equityData.trade_by_trade || [];
              break;
            case 'daily':
              selectedData = equityData.daily || [];
              break;
            default:
              selectedData = equityData.daily || [];
          }
          
        if (selectedData.length > 0) {
          console.log('✅ Dados da estratégia encontrados:', selectedData.length, 'pontos');
          return (selectedData as EquityCurvePoint[]).map((item) => ({
            ...item,
            saldo: Number(item.saldo ?? item.resultado ?? 0),
            valor: Number(item.valor ?? 0),
            resultado: Number(item.resultado ?? 0),
            drawdown: Number(item.drawdown ?? 0),
            drawdownPercent: Number(item.drawdownPercent ?? 0),
            peak: Number(item.peak ?? 0),
            trades: Number(item.trades ?? 0)
          }));
        }
      }
    }
    
    // Removido fallback vazio: tentar aproveitar dados de Equity Curve quando disponíveis
    console.log('⚠️ Nenhum dado direto encontrado; tentando usar dados de Equity Curve do CSV (se houver)');
    const eq = data?.["Equity Curve Data"];
    const selectedData = eq ? (timeRange === 'trade' ? (eq.trade_by_trade || []) : (eq.daily || [])) : [];
    return (selectedData as EquityCurvePoint[]).map((item) => ({
      ...item,
      saldo: Number(item.saldo ?? item.resultado ?? 0),
      valor: Number(item.valor ?? 0),
      resultado: Number(item.resultado ?? 0),
      drawdown: Number(item.drawdown ?? 0),
      drawdownPercent: Number(item.drawdownPercent ?? 0),
      peak: Number(item.peak ?? 0),
      trades: Number(item.trades ?? 0)
    }));
  }, [data, timeRange, selectedAsset, fileResults, showConsolidated, selectedFiles, chartType, selectedStrategy, files.length, getFilteredFileResults]);

  // Calcular média móvel
  const dataWithMA = useMemo(() => {
    if (movingAverage === 'nenhuma' || !Array.isArray(chartData) || chartData.length === 0) return chartData;
    
    const maPeriod = parseInt(movingAverage);
    return (chartData as EquityCurvePoint[]).map((item, index: number) => {
      if (index < maPeriod - 1) {
        return { ...item, saldoMA: null };
      }
      
      const sum = (chartData as EquityCurvePoint[])
        .slice(index - maPeriod + 1, index + 1)
        .reduce((acc: number, curr: EquityCurvePoint) => acc + (Number(curr.saldo ?? curr.resultado ?? 0)), 0);
            
            return {
              ...item,
        saldoMA: sum / maPeriod
            };
          });
  }, [chartData, movingAverage]);

  // Calcular estatísticas usando dados reais do gráfico quando possível
  interface Stats {
    resultado: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    avgDrawdown: number;
    fatorLucro: number;
    winRate: number;
    roi: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    pontosComDados?: number;
  }

  const stats = useMemo<Stats>(() => {
    console.log('🔄 stats useMemo executado');
    console.log('🔧 DEBUG STATS - Parâmetros:');
    console.log('  📊 data existe:', !!data);
    console.log('  📁 fileResults keys:', fileResults ? Object.keys(fileResults) : 'null');
    console.log('  📊 fileResults length:', fileResults ? Object.keys(fileResults).length : 0);
    console.log('  📊 showConsolidated:', showConsolidated);
    console.log('  📊 selectedStrategy:', selectedStrategy);
    console.log('  📊 selectedAsset:', selectedAsset);
    console.log('  📁 selectedFiles:', selectedFiles);
    
    // ✅ CORREÇÃO: Usar função centralizada para obter fileResults filtrados
    const filteredFileResults = getFilteredFileResults();
    const hasValidFileResults = filteredFileResults && Object.keys(filteredFileResults).length > 0;
    
    console.log('📊 FileResults filtrados:', Object.keys(filteredFileResults));
    console.log('📊 FileResults válidos:', hasValidFileResults);
    
    // ✅ CORREÇÃO: MODO INDIVIDUAL - Usar dados das estratégias selecionadas
    if (!showConsolidated && selectedFiles.length > 0 && hasValidFileResults) {
      console.log('🔧 MODO INDIVIDUAL: Calculando stats para estratégias selecionadas');
      console.log('📊 selectedFiles:', selectedFiles);
      console.log('📊 filteredFileResults keys:', Object.keys(filteredFileResults));
      console.log('📊 showConsolidated:', showConsolidated);
      console.log('📊 hasValidFileResults:', hasValidFileResults);
      
      if (Object.keys(filteredFileResults).length === 1) {
        // Estratégia única: calcular métricas localmente baseado nos trades
        const strategyName = Object.keys(filteredFileResults)[0];
        const strategyData = filteredFileResults[strategyName];
        
        console.log(`🎯 MODO INDIVIDUAL - Estratégia única: ${strategyName}`);
        console.log('📊 Dados da estratégia:', strategyData);
        console.log('📊 Estrutura dos dados:', {
          keys: strategyData ? Object.keys(strategyData) : [],
          hasPerformanceMetrics: !!(strategyData && strategyData["Performance Metrics"]),
          performanceMetricsKeys: strategyData && strategyData["Performance Metrics"] ? Object.keys(strategyData["Performance Metrics"]) : []
        });
        
        console.log(`🔍 DEBUG: Verificando trades para ${strategyName}:`, {
          hasStrategyData: !!strategyData,
          hasTrades: !!(strategyData && strategyData.trades),
          isArray: !!(strategyData && strategyData.trades && Array.isArray(strategyData.trades)),
          tradesLength: strategyData && strategyData.trades ? strategyData.trades.length : 0
        });
        
        if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
          const capitalInicial = 100000; // Valor padrão
          const allTrades = strategyData.trades;
          
          // ✅ CORREÇÃO: Calcular todas as métricas localmente
          const tradesLucrativos = allTrades.filter(t => (Number(t.pnl) || 0) > 0);
          const tradesPrejuizo = allTrades.filter(t => (Number(t.pnl) || 0) < 0);
          
          const lucroBruto = tradesLucrativos.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
          const prejuizoBruto = Math.abs(tradesPrejuizo.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0));
          const fatorLucro = prejuizoBruto > 0 ? lucroBruto / prejuizoBruto : 0;
          const winRate = allTrades.length > 0 ? (tradesLucrativos.length / allTrades.length) * 100 : 0;
          
          // ✅ CORREÇÃO: Calcular resultado líquido e ROI localmente
          const resultadoLiquido = allTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
          const roi = capitalInicial > 0 ? (resultadoLiquido / capitalInicial) * 100 : 0;
          
          // ✅ CORREÇÃO: Usar DD médio da API em vez de calcular localmente
          let runningTotal = 0;
          let peak = 0;
          let maxDrawdown = 0;
          
          allTrades.sort((a, b) => new Date(a.entry_date ?? a.date ?? '1970-01-01').getTime() - new Date(b.entry_date ?? b.date ?? '1970-01-01').getTime());
          
          allTrades.forEach(trade => {
            const pnl = Number(trade.pnl) || 0;
            runningTotal += pnl;
            
            if (runningTotal > peak) {
              peak = runningTotal;
            }
            
            const drawdown = Math.abs(Math.min(0, runningTotal - peak));
            if (drawdown > maxDrawdown) {
              maxDrawdown = drawdown;
            }
          });
          
          const drawdownMaximoPct = capitalInicial > 0 ? (maxDrawdown / capitalInicial) * 100 : 0;
          
          // ✅ USAR DD MÉDIO DA API
          console.log(`🔍 DEBUG DD Médio - Dados completos para ${strategyName}:`, {
            hasStrategyData: !!strategyData,
            hasPerformanceMetrics: !!(strategyData && strategyData["Performance Metrics"]),
            performanceMetrics: strategyData && strategyData["Performance Metrics"],
            averageDrawdown: strategyData && strategyData["Performance Metrics"] ? strategyData["Performance Metrics"]["Average Drawdown"] : "N/A"
          });
          
          // ✅ NOVA LÓGICA: Calcular DD médio localmente com método mais robusto
          let drawdownMedio = 0;
          
          const performanceMetrics = strategyData && strategyData["Performance Metrics"] as Record<string, number> | undefined;
          if (performanceMetrics) {
            // Tentar obter da API primeiro
            const possibleKeys = [
              "Average Drawdown",
              "Average Drawdown ($)",
              "Average Drawdown (%)",
              "Avg Drawdown",
              "Avg Drawdown ($)",
              "Avg Drawdown (%)",
              "drawdown_medio",
              "drawdown_medio_pct"
            ];
            
            for (const key of possibleKeys) {
              if (performanceMetrics[key] !== undefined && performanceMetrics[key] > 0) {
                drawdownMedio = performanceMetrics[key];
                console.log(`✅ DD Médio da API: "${key}" = ${drawdownMedio}`);
                break;
              }
            }
            
            // Se não encontrou na API ou é zero, calcular localmente
            if (drawdownMedio === 0) {
              console.log(`🔄 Calculando DD médio localmente...`);
              
              // NOVA LÓGICA: Calcular DD médio baseado em todos os períodos de drawdown
              let runningTotal = 0;
              let peak = 0;
              const allDrawdowns: number[] = [];
              
              allTrades.sort((a, b) => new Date(a.entry_date ?? a.date ?? '1970-01-01').getTime() - new Date(b.entry_date ?? b.date ?? '1970-01-01').getTime());
              
              allTrades.forEach(trade => {
                const pnl = Number(trade.pnl) || 0;
                runningTotal += pnl;
                
                if (runningTotal > peak) {
                  peak = runningTotal;
                }
                
                // Calcular drawdown atual
                const currentDrawdown = peak - runningTotal;
                
                // Se estamos em drawdown (saldo abaixo do pico)
                if (currentDrawdown > 0) {
                  allDrawdowns.push(currentDrawdown);
                }
              });
              
              // Calcular média de todos os drawdowns
              if (allDrawdowns.length > 0) {
                drawdownMedio = allDrawdowns.reduce((sum, dd) => sum + dd, 0) / allDrawdowns.length;
                console.log(`✅ DD Médio calculado localmente: ${drawdownMedio.toFixed(2)}`);
                console.log(`📊 Total de períodos em drawdown: ${allDrawdowns.length}`);
                console.log(`📊 Drawdowns encontrados:`, allDrawdowns.slice(0, 5)); // Primeiros 5 para debug
              } else {
                console.log(`❌ Nenhum período de drawdown encontrado`);
              }
            }
          }
          
          console.log(`✅ DD Médio da API para ${strategyName}:`, {
            drawdownMedio,
            fromAPI: strategyData && strategyData["Performance Metrics"] ? true : false,
            isZero: drawdownMedio === 0
          });
          
          console.log(`✅ Métricas calculadas localmente para ${strategyName}:`, {
            resultadoLiquido,
            maxDrawdown,
            drawdownMaximoPct,
            drawdownMedio,
            fatorLucro,
            winRate,
            roi,
            totalTrades: allTrades.length,
            winningTrades: tradesLucrativos.length,
            losingTrades: tradesPrejuizo.length
          });
          
          return {
            resultado: resultadoLiquido,
            maxDrawdown: maxDrawdown,
            maxDrawdownPercent: drawdownMaximoPct,
            avgDrawdown: drawdownMedio,
            fatorLucro: fatorLucro,
            winRate: winRate,
            roi: roi,
            totalTrades: allTrades.length,
            winningTrades: tradesLucrativos.length,
            losingTrades: tradesPrejuizo.length,
            pontosComDados: allTrades.length
          };
        } else {
          // Sem fallback vazio: retornar métricas derivadas do que houver disponível
          console.log(`❌ MODO INDIVIDUAL - Estratégia única: ${strategyName} - Sem trades disponíveis`);
          console.log('📊 Dados da estratégia:', strategyData);
          const metrics = strategyData?.["Performance Metrics"] as unknown as Record<string, number | undefined> | undefined;
          if (metrics) {
            const capitalInicial = 100000;
            const resultadoLiquido = Number(metrics["Net Profit"]) || 0;
            const drawdownMaximo = Math.abs(Number(metrics["Max Drawdown ($)"]) || 0);
            const drawdownMaximoPct = capitalInicial > 0 ? (drawdownMaximo / capitalInicial) * 100 : 0;
            const roi = capitalInicial > 0 ? (resultadoLiquido / capitalInicial) * 100 : 0;
            return {
              resultado: resultadoLiquido,
              maxDrawdown: drawdownMaximo,
              maxDrawdownPercent: drawdownMaximoPct,
              avgDrawdown: Number(metrics["Average Drawdown ($)"]) || 0,
              fatorLucro: Number(metrics["Profit Factor"]) || 0,
              winRate: Number(metrics["Win Rate (%)"]) || 0,
              roi: roi,
              totalTrades: Number(metrics["Total Trades"]) || 0,
              winningTrades: Number(metrics["Winning Trades"]) || 0,
              losingTrades: Number(metrics["Losing Trades"]) || 0,
              pontosComDados: Number(metrics["Total Trades"]) || 0
            };
          }
          // Como última opção, manter valores calculáveis sem travar fluxo
          return {
            resultado: 0,
            maxDrawdown: 0,
            maxDrawdownPercent: 0,
            avgDrawdown: 0,
            fatorLucro: 0,
            winRate: 0,
            roi: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0
          };
        }
      } else {
        // Múltiplas estratégias: calcular métricas localmente
        console.log('🔧 MODO INDIVIDUAL - Múltiplas estratégias: Calculando métricas localmente');
        
        try {
        const consolidatedDD = calculateDirectConsolidation(filteredFileResults);
          console.log('✅ Métricas consolidadas calculadas:', consolidatedDD);
          
          if (consolidatedDD && consolidatedDD.maxDrawdownAbsoluto > 0) {
            // ✅ CORREÇÃO: Usar DD Máximo correto do calculateDirectConsolidation
            const capitalInicial = 100000; // Valor padrão
            const drawdownMaximoPct = capitalInicial > 0 ? (consolidatedDD.maxDrawdownAbsoluto / capitalInicial) * 100 : 0;
            console.log('📊 DD Máximo % calculado:', drawdownMaximoPct.toFixed(2) + '%');
            
            // ✅ CALCULO LOCAL: Calcular métricas localmente
            const allTrades: Trade[] = [];
            Object.values(filteredFileResults).forEach((strategyData) => {
              if (strategyData.trades && Array.isArray(strategyData.trades)) {
                allTrades.push(...strategyData.trades);
              }
            });
            
            // Calcular métricas localmente
            const tradesLucrativos = allTrades.filter(t => (Number(t.pnl) || 0) > 0);
            const tradesPrejuizo = allTrades.filter(t => (Number(t.pnl) || 0) < 0);
            
            const lucroBruto = tradesLucrativos.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
            const prejuizoBruto = Math.abs(tradesPrejuizo.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0));
            const fatorLucro = prejuizoBruto > 0 ? lucroBruto / prejuizoBruto : 0;
            const winRate = allTrades.length > 0 ? (tradesLucrativos.length / allTrades.length) * 100 : 0;
            
            // ✅ CORREÇÃO: Calcular ROI baseado nos trades consolidados das estratégias selecionadas
            const resultadoLiquidoConsolidado = allTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
            const roi = capitalInicial > 0 ? (resultadoLiquidoConsolidado / capitalInicial) * 100 : 0;
            
            // Calcular drawdown médio
            let runningTotal = 0;
            let peak = 0;
            const drawdowns: number[] = [];
            
            allTrades.sort((a, b) => new Date(a.entry_date ?? a.date ?? '1970-01-01').getTime() - new Date(b.entry_date ?? b.date ?? '1970-01-01').getTime());
            
            allTrades.forEach(trade => {
              const pnl = Number(trade.pnl) || 0;
              runningTotal += pnl;
              
              if (runningTotal > peak) {
                peak = runningTotal;
              }
              
              const drawdown = Math.abs(Math.min(0, runningTotal - peak));
              if (drawdown > 0) {
                drawdowns.push(drawdown);
              }
            });
            
            const avgDrawdown = drawdowns.length > 0 ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length : 0;
            
            console.log('✅ Métricas calculadas localmente:', {
              avgDrawdown,
              fatorLucro,
              winRate,
              roi,
              resultadoLiquidoConsolidado,
              winningTrades: tradesLucrativos.length,
              losingTrades: tradesPrejuizo.length
            });
            
            const result = {
              resultado: resultadoLiquidoConsolidado,
              maxDrawdown: consolidatedDD.maxDrawdownAbsoluto,
              maxDrawdownPercent: drawdownMaximoPct,
              avgDrawdown: avgDrawdown,
              fatorLucro: fatorLucro,
              winRate: winRate,
              roi: roi,
              totalTrades: allTrades.length,
              winningTrades: tradesLucrativos.length,
              losingTrades: tradesPrejuizo.length,
              pontosComDados: allTrades.length
            };
            
            console.log('✅ Resultado para modo individual consolidado:', result);
            return result;
          }
        } catch (error) {
          console.error('❌ Erro ao calcular drawdown consolidado para múltiplas estratégias:', error);
        }
      }
    }
    
    // 🎯 MODO CONSOLIDADO: Para múltiplos CSVs, sempre usar calculateDirectConsolidation
    if (showConsolidated && hasValidFileResults && Object.keys(filteredFileResults).length > 1) {
      console.log('🔧 MODO CONSOLIDADO: Usando calculateDirectConsolidation (prioridade 1)');
      
      try {
          const consolidatedDD = calculateDirectConsolidation(filteredFileResults);
          console.log('✅ Drawdown consolidado calculado:', consolidatedDD);
          
          if (consolidatedDD && consolidatedDD.maxDrawdownAbsoluto > 0) {
          // ✅ CORREÇÃO: Usar DD Máximo correto do calculateDirectConsolidation
          // O calculateDirectConsolidation já calcula o DD Máximo consolidado cronologicamente
          const capitalInicial = 100000; // Valor padrão
          const drawdownMaximoPct = capitalInicial > 0 ? (consolidatedDD.maxDrawdownAbsoluto / capitalInicial) * 100 : 0;
          console.log('📊 DD Máximo % calculado:', drawdownMaximoPct.toFixed(2) + '%');
          console.log('  📊 Fórmula: (', consolidatedDD.maxDrawdownAbsoluto, '/', capitalInicial, ') * 100 =', drawdownMaximoPct.toFixed(2) + '%');
          
          // ✅ CALCULO LOCAL: Calcular métricas localmente
          const allTrades: Trade[] = [];
          Object.values(filteredFileResults).forEach((strategyData) => {
            if (strategyData.trades && Array.isArray(strategyData.trades)) {
              allTrades.push(...strategyData.trades);
            }
          });
          
          // Calcular métricas localmente
          const tradesLucrativos = allTrades.filter(t => (Number(t.pnl) || 0) > 0);
          const tradesPrejuizo = allTrades.filter(t => (Number(t.pnl) || 0) < 0);
          
          const lucroBruto = tradesLucrativos.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
          const prejuizoBruto = Math.abs(tradesPrejuizo.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0));
          const fatorLucro = prejuizoBruto > 0 ? lucroBruto / prejuizoBruto : 0;
          const winRate = allTrades.length > 0 ? (tradesLucrativos.length / allTrades.length) * 100 : 0;
          
          // ✅ CORREÇÃO: Calcular ROI baseado nos trades consolidados
          const resultadoLiquidoConsolidado = allTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
          const roi = capitalInicial > 0 ? (resultadoLiquidoConsolidado / capitalInicial) * 100 : 0;
          
          // Calcular drawdown médio
          let runningTotal = 0;
          let peak = 0;
          const drawdowns: number[] = [];
          
          allTrades.sort((a, b) => new Date(a.entry_date ?? a.date ?? '1970-01-01').getTime() - new Date(b.entry_date ?? b.date ?? '1970-01-01').getTime());
          
          allTrades.forEach(trade => {
            const pnl = Number(trade.pnl) || 0;
            runningTotal += pnl;
            
            if (runningTotal > peak) {
              peak = runningTotal;
            }
            
            const drawdown = Math.abs(Math.min(0, runningTotal - peak));
            if (drawdown > 0) {
              drawdowns.push(drawdown);
            }
          });
          
          const avgDrawdown = drawdowns.length > 0 ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length : 0;
          
          console.log('✅ Métricas calculadas localmente:', {
            avgDrawdown,
            fatorLucro,
            winRate,
            roi,
            resultadoLiquidoConsolidado,
            winningTrades: tradesLucrativos.length,
            losingTrades: tradesPrejuizo.length
          });
          
            const result = {
            resultado: resultadoLiquidoConsolidado,
            maxDrawdown: consolidatedDD.maxDrawdownAbsoluto,
            maxDrawdownPercent: drawdownMaximoPct,
            avgDrawdown: avgDrawdown,
            fatorLucro: fatorLucro,
            winRate: winRate,
            roi: roi,
            totalTrades: allTrades.length,
            winningTrades: tradesLucrativos.length,
            losingTrades: tradesPrejuizo.length,
            pontosComDados: allTrades.length
          };
          
          console.log('✅ Resultado final para modo consolidado:', result);
          console.log('  📊 DD Máximo:', result.maxDrawdown);
          console.log('  📊 DD Máximo %:', result.maxDrawdownPercent);
          console.log('  📊 DD Médio:', result.avgDrawdown);
          console.log('  📊 Fator de Lucro:', result.fatorLucro);
          console.log('  📊 Win Rate:', result.winRate);
          console.log('  📊 ROI:', result.roi);
          
            return result;
          }
        } catch (error) {
          console.error('❌ Erro ao calcular drawdown consolidado:', error);
        }
      }
      
    // ✅ CORREÇÃO: MODO CONSOLIDADO - CSV único
    if (showConsolidated && hasValidFileResults && Object.keys(filteredFileResults).length === 1) {
      console.log('🔧 MODO CONSOLIDADO - CSV ÚNICO: Usando dados do CSV único');
      console.log('📊 showConsolidated:', showConsolidated);
      console.log('📊 hasValidFileResults:', hasValidFileResults);
      console.log('📊 filteredFileResults length:', Object.keys(filteredFileResults).length);
      
      const strategyName = Object.keys(filteredFileResults)[0];
      const strategyData = filteredFileResults[strategyName];
      
      console.log(`🎯 MODO CONSOLIDADO - CSV ÚNICO: ${strategyName}`);
      console.log('📊 Dados da estratégia:', strategyData);
      
      if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
        // ✅ CORREÇÃO: Calcular todas as métricas localmente baseado nos trades
        const capitalInicial = 100000; // Valor padrão
        const allTrades = strategyData.trades;
        
        // ✅ CORREÇÃO: Calcular todas as métricas localmente
        const tradesLucrativos = allTrades.filter(t => (Number(t.pnl) || 0) > 0);
        const tradesPrejuizo = allTrades.filter(t => (Number(t.pnl) || 0) < 0);
        
        const lucroBruto = tradesLucrativos.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
        const prejuizoBruto = Math.abs(tradesPrejuizo.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0));
        const fatorLucro = prejuizoBruto > 0 ? lucroBruto / prejuizoBruto : 0;
        const winRate = allTrades.length > 0 ? (tradesLucrativos.length / allTrades.length) * 100 : 0;
        
        // ✅ CORREÇÃO: Calcular resultado líquido e ROI localmente
        const resultadoLiquido = allTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
        const roi = capitalInicial > 0 ? (resultadoLiquido / capitalInicial) * 100 : 0;
        
        // Calcular drawdown máximo e médio
        let runningTotal = 0;
        let peak = 0;
        let maxDrawdown = 0;
        const drawdowns: number[] = [];
        
        allTrades.sort((a, b) => new Date(a.entry_date ?? a.date ?? '').getTime() - new Date(b.entry_date ?? b.date ?? '').getTime());
        
        allTrades.forEach(trade => {
          const pnl = Number(trade.pnl) || 0;
          runningTotal += pnl;
          
          if (runningTotal > peak) {
            peak = runningTotal;
          }
          
          const drawdown = Math.abs(Math.min(0, runningTotal - peak));
          if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
          }
          if (drawdown > 0) {
            drawdowns.push(drawdown);
          }
        });
        
        const drawdownMaximoPct = capitalInicial > 0 ? (maxDrawdown / capitalInicial) * 100 : 0;
        const avgDrawdown = drawdowns.length > 0 ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length : 0;
        
        console.log(`✅ Métricas calculadas localmente para ${strategyName}:`, {
          resultadoLiquido,
          maxDrawdown,
          drawdownMaximoPct,
          avgDrawdown,
          fatorLucro,
          winRate,
          roi,
          totalTrades: allTrades.length,
          winningTrades: tradesLucrativos.length,
          losingTrades: tradesPrejuizo.length
        });
        
        return {
          resultado: resultadoLiquido,
          maxDrawdown: maxDrawdown,
          maxDrawdownPercent: drawdownMaximoPct,
          avgDrawdown: avgDrawdown,
          fatorLucro: fatorLucro,
          winRate: winRate,
          roi: roi,
          totalTrades: allTrades.length,
          winningTrades: tradesLucrativos.length,
          losingTrades: tradesPrejuizo.length
        };
      } else if (strategyData && strategyData["Performance Metrics"]) {
        // Usar dados de métricas quando não houver trades
        const metrics = strategyData["Performance Metrics"] as Record<string, number>;
        const capitalInicial = 100000;
        const resultadoLiquido = Number(metrics["Net Profit"]) || 0;
        const drawdownMaximo = Math.abs(Number(metrics["Max Drawdown ($)"]) || 0);
        const drawdownMaximoPct = capitalInicial > 0 ? (drawdownMaximo / capitalInicial) * 100 : 0;
        const roi = capitalInicial > 0 ? (resultadoLiquido / capitalInicial) * 100 : 0;
        return {
          resultado: resultadoLiquido,
          maxDrawdown: drawdownMaximo,
          maxDrawdownPercent: drawdownMaximoPct,
          avgDrawdown: Number(metrics["Average Drawdown ($)"]) || 0,
          fatorLucro: Number(metrics["Profit Factor"]) || 0,
          winRate: Number(metrics["Win Rate (%)"]) || 0,
          roi: roi,
          totalTrades: Number(metrics["Total Trades"]) || 0,
          winningTrades: Number(metrics["Winning Trades"]) || 0,
          losingTrades: Number(metrics["Losing Trades"]) || 0
        };
      }
    }
    
    // ✅ CALCULO LOCAL: Para CSV único, calcular métricas localmente
    if (data && data["Performance Metrics"]) {
      console.log('✅ CSV ÚNICO: Calculando métricas localmente');
      
      // Obter trades para cálculo local
      const allTrades: Trade[] = [];
      if (data.trades && Array.isArray(data.trades)) {
        allTrades.push(...data.trades);
      } else if (fileResults) {
        // Tentar obter trades dos fileResults
        Object.values(fileResults).forEach((strategyData) => {
          if (strategyData.trades && Array.isArray(strategyData.trades)) {
            allTrades.push(...strategyData.trades);
          }
        });
      }
      
      console.log(`📊 Trades obtidos para cálculo local: ${allTrades.length}`);
      
      if (allTrades.length > 0) {
        // CALCULAR MÉTRICAS LOCALMENTE
        const capitalInicial = 100000;
        
        // 1. Calcular resultado líquido
        const resultadoLiquido = allTrades.reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);
        
        // 2. Calcular drawdown máximo
        let runningTotal = 0;
        let peak = 0;
        let maxDrawdown = 0;
        
        allTrades.sort((a, b) => new Date(a.entry_date ?? a.date ?? '1970-01-01').getTime() - new Date(b.entry_date ?? b.date ?? '1970-01-01').getTime());
        
        allTrades.forEach(trade => {
          const pnl = Number(trade.pnl) || 0;
          runningTotal += pnl;
          
          if (runningTotal > peak) {
            peak = runningTotal;
          }
          
          const drawdown = Math.abs(Math.min(0, runningTotal - peak));
          if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
          }
        });
        
        const drawdownMaximoPct = capitalInicial > 0 ? (maxDrawdown / capitalInicial) * 100 : 0;
        
        // 3. Calcular drawdown médio
        let runningTotal2 = 0;
        let peak2 = 0;
        const drawdowns: number[] = [];
        
        allTrades.forEach(trade => {
          const pnl = Number(trade.pnl) || 0;
          runningTotal2 += pnl;
          
          if (runningTotal2 > peak2) {
            peak2 = runningTotal2;
          }
          
          const drawdown = Math.abs(Math.min(0, runningTotal2 - peak2));
          if (drawdown > 0) {
            drawdowns.push(drawdown);
          }
        });
        
        const avgDrawdown = drawdowns.length > 0 ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length : 0;
        
        // 4. Calcular fator de lucro
        const tradesLucrativos = allTrades.filter(t => (Number(t.pnl) || 0) > 0);
        const tradesPrejuizo = allTrades.filter(t => (Number(t.pnl) || 0) < 0);
        
        const lucroBruto = tradesLucrativos.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
        const prejuizoBruto = Math.abs(tradesPrejuizo.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0));
        const fatorLucro = prejuizoBruto > 0 ? lucroBruto / prejuizoBruto : 0;
        
        // 5. Calcular win rate
        const winRate = allTrades.length > 0 ? (tradesLucrativos.length / allTrades.length) * 100 : 0;
        
        // 6. Calcular ROI
        const roi = capitalInicial > 0 ? (resultadoLiquido / capitalInicial) * 100 : 0;
        
        console.log('✅ Métricas calculadas localmente:', {
          resultado: resultadoLiquido,
          maxDrawdown,
          maxDrawdownPercent: drawdownMaximoPct,
          avgDrawdown,
          fatorLucro,
          winRate,
          roi
        });
        
        return {
          resultado: resultadoLiquido,
          maxDrawdown,
          maxDrawdownPercent: drawdownMaximoPct,
          avgDrawdown,
          fatorLucro,
          winRate,
          roi,
          totalTrades: allTrades.length,
          winningTrades: tradesLucrativos.length,
          losingTrades: tradesPrejuizo.length,
          pontosComDados: allTrades.length
        };
      }
    }
    
    // Removidos fallbacks vazios: tentar usar métricas do único CSV disponível em último caso
    console.log('🔧 Sem paths anteriores: utilizando métricas do CSV único (se presente)');
    const metrics = data?.["Performance Metrics"] as Record<string, number> | undefined;
    if (metrics) {
      const capitalInicial = 100000;
      const resultadoLiquido = Number(metrics["Net Profit"]) || 0;
      const drawdownMaximo = Math.abs(Number(metrics["Max Drawdown ($)"]) || 0);
      const drawdownMaximoPct = capitalInicial > 0 ? (drawdownMaximo / capitalInicial) * 100 : 0;
      const roi = capitalInicial > 0 ? (resultadoLiquido / capitalInicial) * 100 : 0;
      return {
        resultado: resultadoLiquido,
        maxDrawdown: drawdownMaximo,
        maxDrawdownPercent: drawdownMaximoPct,
        avgDrawdown: Number(metrics["Average Drawdown ($)"]) || 0,
        fatorLucro: Number(metrics["Profit Factor"]) || 0,
        winRate: Number(metrics["Win Rate (%)"]) || 0,
        roi: roi,
        totalTrades: Number(metrics["Total Trades"]) || 0,
        winningTrades: Number(metrics["Winning Trades"]) || 0,
        losingTrades: Number(metrics["Losing Trades"]) || 0,
        pontosComDados: Number(metrics["Total Trades"]) || 0
      };
    }
    // Default non-empty object to maintain UI stability
    return {
      resultado: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      avgDrawdown: 0,
      fatorLucro: 0,
      winRate: 0,
      roi: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    };
  }, [data, fileResults, showConsolidated, getFilteredFileResults, selectedAsset, selectedFiles, selectedStrategy]);

  // Componente de Tooltip customizado
  type TooltipEntry = { color?: string; dataKey?: string; value: number; payload: EquityCurvePoint };
  type CustomTooltipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string };
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-2">{timeRange === 'trade' ? `Trade: ${dataPoint?.trades || label}` : `Data: ${dataPoint?.fullDate || label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'saldo' && `Saldo: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              {entry.dataKey === 'valor' && `Patrimônio: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              {entry.dataKey === 'resultado' && `Resultado: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              {entry.dataKey === 'drawdown' && `Drawdown: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dataPoint?.drawdownPercent?.toFixed(2) || 0}%)`}
              {entry.dataKey === 'saldoMA' && `MM ${movingAverage}: R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
          ))}
          
          {/* Detalhes simplificados para drawdown */}
          {chartType === 'drawdown' && !dataPoint.isStart && (
            <>
              <p className="text-xs text-gray-400 mt-2">Detalhes do Drawdown Total:</p>
              <p className="text-xs text-gray-400">Drawdown: R$ {(dataPoint.drawdown || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({(dataPoint.drawdownPercent || 0).toFixed(2)}%)</p>
              <p className="text-xs text-gray-400">Pico Máximo: R$ {(dataPoint.peak || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-400">Saldo Atual: R$ {(dataPoint.saldo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-400">Total de Trades: {dataPoint.trades || 0}</p>
              {timeRange === 'trade' && dataPoint.trade_result && (
                <p className="text-xs text-gray-400">Resultado do trade: R$ {dataPoint.trade_result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              )}
              {timeRange !== 'trade' && dataPoint.resultado_periodo && (
                <p className="text-xs text-gray-400">Resultado do período: R$ {dataPoint.resultado_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              )}
            </>
          )}
          
          {payload.map((entry, index: number) => (
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
    // ✅ CORREÇÃO: Verificar se é uma data válida antes de tentar formatar
    if (!value || value === 'Invalid Date' || value === 'undefined' || value === 'null') {
      return 'Data Inválida';
    }
    
    try {
      const date = new Date(value);
      
      // ✅ CORREÇÃO: Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data Inválida';
      }
      
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
    } catch (error) {
      console.error('❌ Erro ao formatar data:', value, error);
      return 'Data Inválida';
    }
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
                    type="text"
                    value={totalInvestment.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '');
                      if (/^\d*$/.test(value)) {
                        setTotalInvestment(value);
                        const numeric = Number(value);
                        if (Number.isFinite(numeric)) setInvestedCapital(numeric);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Valor investido"
                  />
                </div>
                <div className="bg-blue-900 bg-opacity-20 px-3 py-2 rounded-md flex items-center">
                  <Percent className="w-4 h-4 text-blue-400 mr-2" />
                  <span className="text-blue-300 font-medium">ROI: {(stats.roi ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
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
                  onChange={(e) => setTimeRange(e.target.value as 'trade' | 'daily')}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="trade">Trade por Trade</option>
                  <option value="daily">Diário</option>
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
                  ? `Evolução do Resultado Total ${timeRange === 'trade' ? 'por Trade' : 'Diária'} (${stats.pontosComDados ?? 0} pontos) - Resultado: R$ ${(stats.resultado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                  : `Drawdown Total ${timeRange === 'trade' ? 'por Trade' : 'Diário'} (${stats.pontosComDados ?? 0} pontos) - Máximo: R$ ${(stats.maxDrawdown ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${(stats.maxDrawdownPercent ?? 0).toFixed(2)}%)`}
              </div>
            )}
            
            {Array.isArray(chartData) && chartData.length > 0 ? (
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
                        dataKey={timeRange === 'trade' ? 'trades' : 'date'} 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={(value) => (timeRange === 'trade' ? String(value) : formatXAxisLabel(String(value)))}
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
                      
                      {/* APENAS UMA LINHA: Evolução do resultado total consolidado */}
                      <Area
                        type="monotone"
                        dataKey="saldo"
                        stroke="#10B981"
                        strokeWidth={3}
                        fill="url(#equityGradient)"
                        fillOpacity={0.6}
                        name="Evolução do Resultado Total"
                      />
                      
                      {/* Média móvel opcional */}
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
                        dataKey={timeRange === 'trade' ? 'trades' : 'date'} 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={(value) => (timeRange === 'trade' ? String(value) : formatXAxisLabel(String(value)))}
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
                      
                      {/* APENAS UMA LINHA: Drawdown total consolidado com cálculo específico */}
                      <Area
                        type="monotone"
                        dataKey="drawdown"
                        stroke="#EF4444"
                        strokeWidth={3}
                        fill="#EF4444"
                        fillOpacity={0.3}
                        name="Drawdown Total"
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
              Visualização simplificada - 1 linha por categoria
            </div>
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-4 md:mb-0">
                <h4 className="text-sm font-medium mb-2 text-gray-300">Legenda</h4>
                <div className="flex flex-wrap items-center gap-4">
                  {/* Legenda simplificada */}
                  <div className="flex items-center">
                    <div 
                      className={`w-3 h-3 rounded-full mr-2 ${
                        chartType === 'resultado' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <span className="text-sm text-gray-400">
                      {chartType === 'resultado' 
                        ? 'Evolução do Resultado Total' 
                        : 'Drawdown Total (Cálculo Específico)'
                      }
                    </span>
                  </div>
                  
                  {/* Média móvel opcional */}
                  {movingAverage !== 'nenhuma' && chartType === 'resultado' && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-400">Média Móvel {movingAverage}</span>
                    </div>
                  )}
                </div>
                
                {/* Informações sobre o modo consolidado */}
                {showConsolidated && fileResults && Object.keys(fileResults).length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Estratégias consolidadas ({Object.keys(fileResults).length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(fileResults).map((fileName, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs rounded"
                          style={{ 
                            backgroundColor: `${getStrategyColor(fileName, index)}20`,
                            color: getStrategyColor(fileName, index),
                            border: `1px solid ${getStrategyColor(fileName, index)}40`
                          }}
                        >
                          {fileName.replace('.csv', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Informações sobre o modo individual */}
                {!showConsolidated && selectedFiles.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Estratégias selecionadas ({selectedFiles.length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedFiles.map((fileName, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs rounded"
                          style={{ 
                            backgroundColor: `${getStrategyColor(fileName, index)}20`,
                            color: getStrategyColor(fileName, index),
                            border: `1px solid ${getStrategyColor(fileName, index)}40`
                          }}
                        >
                          {fileName.replace('.csv', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-gray-400 flex items-center">
                    Resultado Total
                    <span className="ml-1 text-green-400 text-xs">📊</span>
                  </p>
                  <p className={`text-lg font-medium ${(stats.resultado ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {(stats.resultado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 flex items-center">
                    DD Máximo
                    <span className="ml-1 text-green-400 text-xs">📊</span>
                  </p>
                  <p className="text-lg font-medium text-red-400">
                    R$ {(stats.maxDrawdown ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    <span className="text-sm text-gray-400 ml-1">({(stats.maxDrawdownPercent ?? 0).toFixed(2)}%)</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 flex items-center">
                    DD Médio
                    <span className="ml-1 text-green-400 text-xs">📊</span>
                  </p>
                  <p className="text-lg font-medium text-orange-400">R$ {(stats.avgDrawdown ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Fator de Lucro</p>
                  <p className={`text-lg font-medium ${(stats.fatorLucro ?? 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {(stats.fatorLucro ?? 0).toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Win Rate</p>
                  <p className="text-lg font-medium text-blue-400">{(stats.winRate ?? 0).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">ROI</p>
                  <p className={`text-lg font-medium ${(stats.roi ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(stats.roi ?? 0).toFixed(2)}%
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

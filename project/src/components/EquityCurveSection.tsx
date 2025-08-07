import React, { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, BarChart, LineChart, DollarSign, Percent } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { calculateDirectConsolidation } from '../utils/directConsolidation';

interface EquityCurveSectionProps {
  showEquityCurve: boolean;
  setShowEquityCurve: (show: boolean) => void;
  selectedStrategy?: string | null;
  selectedAsset?: string | null;
  fileResults?: {[key: string]: unknown};
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
      [key: string]: unknown;
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
      "weekly": Array<unknown>;
      "monthly": Array<unknown>;
    };
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
  consolidatedMetrics
}: EquityCurveSectionProps) {
  const [chartType, setChartType] = useState<'resultado' | 'drawdown'>('resultado');
  const [timeRange, setTimeRange] = useState<'trade' | 'daily'>('daily');
  const [movingAverage, setMovingAverage] = useState<'9' | '20' | '50' | '200' | '2000' | 'nenhuma'>('20');
    const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalInvestment, setTotalInvestment] = useState<string>('100000');
  const [dailyMetricsFromApi, setDailyMetricsFromApi] = useState<any>(null);
  const [capitalInicial, setCapitalInicial] = useState(100000);

  // ✅ CORREÇÃO: Função centralizada para aplicar filtros
  const getFilteredFileResults = () => {
    if (!fileResults) {
      console.log('❌ fileResults é null/undefined');
      return {};
    }
    
    console.log('🔧 getFilteredFileResults - Parâmetros:');
    console.log('  📊 showConsolidated:', showConsolidated);
    console.log('  📁 selectedFiles:', selectedFiles);
    console.log('  🎯 selectedStrategy:', selectedStrategy);
    console.log('  🎯 selectedAsset:', selectedAsset);
    console.log('  📁 fileResults keys:', Object.keys(fileResults));
    
    let filteredResults = { ...fileResults };
    
    // ✅ CORREÇÃO: Aplicar filtros baseado no modo e seleções
    if (!showConsolidated && selectedFiles.length > 0) {
      // Modo individual: usar apenas os arquivos selecionados
      console.log('🎯 MODO INDIVIDUAL: Aplicando filtros para arquivos selecionados');
      console.log('📁 selectedFiles:', selectedFiles);
      
      filteredResults = {};
      selectedFiles.forEach(fileName => {
        if (fileResults[fileName]) {
          filteredResults[fileName] = fileResults[fileName];
          console.log(`✅ Adicionado ${fileName} ao filtro individual`);
        } else {
          console.log(`❌ ${fileName} não encontrado em fileResults`);
        }
      });
      
      console.log('📊 FileResults filtrado para modo individual:', Object.keys(filteredResults));
    } else if (showConsolidated && selectedStrategy) {
      // Modo consolidado com filtro de estratégia
      console.log('🎯 MODO CONSOLIDADO: Aplicando filtro de estratégia:', selectedStrategy);
      
      filteredResults = {};
      Object.keys(fileResults).forEach(fileName => {
        if (fileName === selectedStrategy || fileName === `${selectedStrategy}.csv`) {
          filteredResults[fileName] = fileResults[fileName];
          console.log(`✅ Adicionado ${fileName} ao filtro consolidado`);
        }
      });
      
      console.log('📊 FileResults filtrado para estratégia:', Object.keys(filteredResults));
    } else if (showConsolidated) {
      // Modo consolidado sem filtro de estratégia: usar todos os arquivos
      console.log('🎯 MODO CONSOLIDADO: Usando todos os arquivos (sem filtro de estratégia)');
      console.log('📊 FileResults original:', Object.keys(filteredResults));
    }
    
    // ✅ CORREÇÃO: Aplicar filtro de ativo se selecionado
    if (selectedAsset) {
      console.log('🎯 Aplicando filtro de ativo:', selectedAsset);
      
      const assetFilteredResults = {};
      Object.keys(filteredResults).forEach(fileName => {
        const strategyData = filteredResults[fileName] as Record<string, unknown>;
        if (strategyData && strategyData.trades) {
          const filteredTrades = (strategyData.trades as any[]).filter((trade: any) => 
            trade.symbol === selectedAsset
          );
          
          if (filteredTrades.length > 0) {
            (assetFilteredResults as Record<string, unknown>)[fileName] = {
              ...strategyData,
              trades: filteredTrades
            };
            console.log(`✅ ${fileName}: ${filteredTrades.length} trades após filtro de ativo`);
      } else {
            console.log(`❌ ${fileName}: Nenhum trade encontrado para ativo ${selectedAsset}`);
          }
        }
      });
      
      filteredResults = assetFilteredResults;
      console.log('📊 FileResults após filtro de ativo:', Object.keys(filteredResults));
    }
    
    console.log('🔧 getFilteredFileResults - Resultado final:', Object.keys(filteredResults));
    return filteredResults;
  };

  // ✅ CORREÇÃO: Função para obter trades filtrados
  const getFilteredTrades = () => {
    const filteredFileResults = getFilteredFileResults();
    const allTrades: any[] = [];
    
    Object.values(filteredFileResults).forEach((strategyData: any) => {
      if (strategyData.trades && Array.isArray(strategyData.trades)) {
        allTrades.push(...strategyData.trades);
      }
    });
    
    console.log('📊 Trades filtrados obtidos:', allTrades.length);
    return allTrades;
  };

  useEffect(() => {
    // ✅ CORREÇÃO: Usar função centralizada para obter trades filtrados
    const filteredTrades = getFilteredTrades();
    
    if (filteredTrades.length > 0) {
      console.log('📊 Carregando métricas da API para', filteredTrades.length, 'trades filtrados');
        fetch('/api/trades/metrics-from-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: filteredTrades }),
        })
          .then(res => res.json())
          .then(data => {
            console.log('✅ Métricas carregadas da API:', data);
            setDailyMetricsFromApi(data);
          })
          .catch((error) => {
            console.error('❌ Erro ao carregar métricas da API:', error);
            setDailyMetricsFromApi(null);
          });
    } else {
      console.log('⚠️ Nenhum trade válido após filtros aplicados');
      setDailyMetricsFromApi(null);
      }
  }, [fileResults, showConsolidated, selectedAsset, selectedFiles]);

  // Função para gerar cores únicas para cada estratégia
  const getStrategyColor = (strategyName: string, index: number) => {
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
      
      const strategiesList = Object.keys(filteredFileResults);
      console.log('📊 Estratégias selecionadas para modo individual:', strategiesList);
      
      // ✅ CORREÇÃO: Para modo individual, usar cálculo consolidado (como no modo consolidado)
      console.log('🔧 MODO INDIVIDUAL: Usando cálculo consolidado para gráfico');
      
      // METODOLOGIA PADRONIZADA PYTHON: Replicar exatamente FunCalculos.py
      console.log('🔧 APLICANDO METODOLOGIA PYTHON - Coletando todos os trades');
      console.log('📖 Referência: FunCalculos.py linhas 474-476 (cumsum, cummax, equity-peak)');
      
      // 1. Coletar todos os trades de todas as estratégias selecionadas
      const allTrades: any[] = [];
      
      strategiesList.forEach(fileName => {
        const strategyData = filteredFileResults[fileName];
        if (strategyData && strategyData.trades) {
          strategyData.trades.forEach((trade: any) => {
            allTrades.push({
              ...trade,
              strategy: fileName,
              pnl: Number(trade.pnl) || 0,
              entry_date: trade.entry_date || trade.date,
              exit_date: trade.exit_date || trade.end_date
            });
          });
        }
      });
      
      console.log(`📊 Total de trades coletados: ${allTrades.length}`);
      
      // VALIDAÇÃO: Verificar se há trades suficientes
      if (allTrades.length === 0) {
        console.warn('⚠️ Nenhum trade encontrado para processar');
        return [];
      }
      
      // 2. Ordenar trades por data de entrada
      allTrades.sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
      console.log('📊 Trades ordenados cronologicamente');
      
      // 3. CALCULAR EQUITY CURVE CONSOLIDADA (METODOLOGIA PYTHON)
      console.log('🔧 CALCULANDO EQUITY CURVE CONSOLIDADA');
      console.log('📖 Referência: FunCalculos.py - cumsum, cummax, equity-peak');
      
      let runningTotal = 0;
      let peak = 0;
      let maxDrawdown = 0;
      const equityCurve: any[] = [];
      
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
        
        equityCurve.push({
          date: trade.entry_date,
          fullDate: trade.entry_date,
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
      const strategiesList = Object.keys(filteredFileResults);
      console.log('📊 Modo consolidado: combinando dados de todas as estratégias:', strategiesList);
      console.log('🎯 Filtro de estratégia:', selectedStrategy || 'Todas');
      console.log('🎯 Filtro de ativo:', selectedAsset || 'Todos');
      console.log('📊 Tipo de gráfico:', chartType);
      
      // ✅ CORREÇÃO: Para modo consolidado, sempre usar cálculo consolidado
      console.log('🔧 MODO CONSOLIDADO: Usando cálculo consolidado para drawdown');
      
      // Primeiro, coletar todos os dados e encontrar o range de datas
      const allData: unknown[] = [];
      const allDates = new Set<string>();
      
      strategiesList.forEach(fileName => {
        const strategyData = filteredFileResults[fileName];
        console.log(`🔍 Verificando dados para ${fileName}:`, {
          hasStrategyData: !!strategyData,
          strategyDataKeys: strategyData ? Object.keys(strategyData) : [],
          hasEquityCurveData: strategyData && !!strategyData["Equity Curve Data"],
          equityCurveKeys: strategyData && strategyData["Equity Curve Data"] ? Object.keys(strategyData["Equity Curve Data"]) : []
        });
        
        if (strategyData && strategyData["Equity Curve Data"]) {
          const equityData = strategyData["Equity Curve Data"];
          
          // Selecionar dados baseado no timeRange
          let selectedData = [];
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
          const processedData = selectedData.map((item: unknown) => ({
            ...item,
            saldo: Number((item as any).saldo) || Number((item as any).resultado) || 0,
            valor: Number((item as any).valor) || 0,
            resultado: Number((item as any).resultado) || 0,
            drawdown: Number((item as any).drawdown) || 0,
            drawdownPercent: Number((item as any).drawdownPercent) || 0,
            peak: Number((item as any).peak) || 0,
            trades: Number((item as any).trades) || 0,
            strategy: fileName // Adicionar identificador da estratégia
          }));
          
          // Adicionar datas ao conjunto
          processedData.forEach(item => {
            if ((item as any).fullDate) {
              allDates.add((item as any).fullDate);
            }
          });
          
          allData.push(...processedData);
          console.log(`📊 ${fileName}: ${processedData.length} pontos adicionados`);
          console.log(`📊 ${fileName} - Exemplo de dados processados:`, processedData[0]);
          console.log(`📊 ${fileName} - Último ponto:`, processedData[processedData.length - 1]);
          console.log(`📊 ${fileName} - Range de valores saldo:`, {
            min: Math.min(...processedData.map((p: any) => p.saldo)),
            max: Math.max(...processedData.map((p: any) => p.saldo)),
            last: processedData[processedData.length - 1]?.saldo
          });
        } else {
          console.log(`❌ Dados não encontrados para ${fileName}`);
          console.log(`❌ filteredFileResults keys:`, Object.keys(filteredFileResults));
          console.log(`❌ Tentando encontrar ${fileName} em:`, Object.keys(filteredFileResults));
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
      
      // METODOLOGIA PADRONIZADA PYTHON: Replicar exatamente FunCalculos.py
      console.log('🔧 APLICANDO METODOLOGIA PYTHON - Coletando todos os trades');
      console.log('📖 Referência: FunCalculos.py linhas 474-476 (cumsum, cummax, equity-peak)');
      
      // 1. Coletar todos os trades de todas as estratégias
      const allTrades: any[] = [];
      
      strategiesList.forEach(fileName => {
        const strategyData = filteredFileResults[fileName];
        if (strategyData && strategyData.trades) {
          strategyData.trades.forEach((trade: any) => {
            allTrades.push({
              ...trade,
              strategy: fileName,
              pnl: Number(trade.pnl) || 0,
              entry_date: trade.entry_date || trade.date,
              exit_date: trade.exit_date || trade.end_date
            });
          });
        }
      });
      
      console.log(`📊 Total de trades coletados: ${allTrades.length}`);
      
      // VALIDAÇÃO: Verificar se há trades suficientes
      if (allTrades.length === 0) {
        console.warn('⚠️ Nenhum trade encontrado para processar');
        
        // Caso específico para CSV único - verificar se há dados de equity curve
        if (data && data["Equity Curve Data"]) {
          console.log('✅ CSV ÚNICO: Usando dados de Equity Curve Data');
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
            default:
              selectedData = equityData.daily || [];
          }
          
          if (selectedData.length > 0) {
            console.log('✅ Dados de equity curve encontrados:', selectedData.length, 'pontos');
            return selectedData.map((item: any) => ({
              ...item,
              saldo: Number(item.saldo) || Number(item.resultado) || 0,
              valor: Number(item.valor) || 0,
              resultado: Number(item.resultado) || 0,
              drawdown: Number(item.drawdown) || 0,
              drawdownPercent: Number(item.drawdownPercent) || 0,
              peak: Number(item.peak) || 0,
              trades: Number(item.trades) || 0
            }));
          }
        }
        
        console.warn('⚠️ Nenhum dado válido encontrado');
        return [];
      }
      
      // 2. Ordenar trades por data de entrada
      allTrades.sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
      console.log('📊 Trades ordenados cronologicamente');
      
      // 3. CALCULAR EQUITY CURVE CONSOLIDADA (METODOLOGIA PYTHON)
      console.log('🔧 CALCULANDO EQUITY CURVE CONSOLIDADA');
      console.log('📖 Referência: FunCalculos.py - cumsum, cummax, equity-peak');
      
      let runningTotal = 0;
      let peak = 0;
      let maxDrawdown = 0;
      const equityCurve: any[] = [];
      
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
        
        equityCurve.push({
          date: trade.entry_date,
          fullDate: trade.entry_date,
            saldo: runningTotal,
          valor: runningTotal,
          resultado: pnl,
          drawdown: drawdown,
          drawdownPercent: drawdownPercent,
          peak: peak,
            trades: index + 1,
          strategy: 'Consolidado'
          });
        });
      
      console.log('✅ Equity curve consolidada calculada:', equityCurve.length, 'pontos');
      console.log('📊 Exemplo de dados consolidados:', equityCurve[0]);
      console.log('📊 Último ponto consolidado:', equityCurve[equityCurve.length - 1]);
      console.log('📊 Máximo drawdown consolidado:', maxDrawdown);
      console.log('📊 Peak consolidado:', peak);
      
      return equityCurve;
    }
    
    // ✅ CORREÇÃO: Caso específico para CSV único - verificar se há dados de equity curve
    if (data && data["Equity Curve Data"]) {
      console.log('✅ CSV ÚNICO: Usando dados de Equity Curve Data');
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
            default:
          selectedData = equityData.daily || [];
      }
      
      console.log(`📊 CSV ÚNICO: Dados selecionados para ${timeRange}: ${selectedData.length} pontos`);
      
      if (selectedData.length > 0) {
        console.log('✅ Dados de equity curve encontrados:', selectedData.length, 'pontos');
        return selectedData.map((item: any) => ({
          ...item,
          saldo: Number(item.saldo) || Number(item.resultado) || 0,
          valor: Number(item.valor) || 0,
          resultado: Number(item.resultado) || 0,
          drawdown: Number(item.drawdown) || 0,
          drawdownPercent: Number(item.drawdownPercent) || 0,
          peak: Number(item.peak) || 0,
          trades: Number(item.trades) || 0
        }));
      }
    }
    
    // ✅ CORREÇÃO: Se está no modo individual mas não há arquivos selecionados, voltar para consolidado
    if (!showConsolidated && selectedFiles.length === 0) {
      console.log('⚠️ Modo individual sem arquivos selecionados, voltando para consolidado');
      return [];
    }
    
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
          let selectedData = [];
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
          return selectedData.map((item: any) => ({
            ...item,
            saldo: Number(item.saldo) || Number(item.resultado) || 0,
            valor: Number(item.valor) || 0,
            resultado: Number(item.resultado) || 0,
            drawdown: Number(item.drawdown) || 0,
            drawdownPercent: Number(item.drawdownPercent) || 0,
            peak: Number(item.peak) || 0,
            trades: Number(item.trades) || 0
          }));
        }
      }
    }
    
    // ✅ CORREÇÃO: Retornar array vazio se não há dados
    console.log('⚠️ Nenhum dado válido encontrado para o gráfico');
    return [];
  }, [data, timeRange, selectedAsset, fileResults, showConsolidated, selectedFiles, totalInvestment, chartType]);

  // Calcular média móvel
  const dataWithMA = useMemo(() => {
    if (movingAverage === 'nenhuma' || !Array.isArray(chartData) || chartData.length === 0) return chartData;
    
    const maPeriod = parseInt(movingAverage);
    return chartData.map((item: any, index: number) => {
      if (index < maPeriod - 1) {
        return { ...item, saldoMA: null };
      }
      
      const sum = chartData
        .slice(index - maPeriod + 1, index + 1)
        .reduce((acc: number, curr: any) => acc + (curr.saldo || curr.resultado || 0), 0);
            
            return {
              ...item,
        saldoMA: sum / maPeriod
            };
          });
  }, [chartData, movingAverage]);

  // Calcular estatísticas usando dados reais do gráfico quando possível
  const stats = useMemo(() => {
    console.log('🔄 stats useMemo executado');
    console.log('🔧 DEBUG STATS - Parâmetros:');
    console.log('  📊 data existe:', !!data);
    console.log('  📊 dailyMetricsFromApi existe:', !!dailyMetricsFromApi);
    console.log('  📁 fileResults keys:', fileResults ? Object.keys(fileResults) : 'null');
    console.log('  �� fileResults length:', fileResults ? Object.keys(fileResults).length : 0);
    console.log('  📊 showConsolidated:', showConsolidated);
    console.log('  📊 selectedStrategy:', selectedStrategy);
    console.log('  📊 selectedAsset:', selectedAsset);
    console.log('  📁 selectedFiles:', selectedFiles);
    console.log('  📊 dailyMetricsFromApi valor:', dailyMetricsFromApi);
    
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
      
      if (Object.keys(filteredFileResults).length === 1) {
        // Estratégia única: usar dados diretos da estratégia
        const strategyName = Object.keys(filteredFileResults)[0];
        const strategyData = filteredFileResults[strategyName];
        
        if (strategyData && strategyData["Performance Metrics"]) {
          const metrics = strategyData["Performance Metrics"];
          const capitalInicial = 100000; // Valor padrão
          
          console.log(`🎯 MODO INDIVIDUAL - Estratégia única: ${strategyName}`);
          console.log('📊 Métricas da estratégia:', metrics);
          
          const resultadoLiquido = metrics["Net Profit"] || 0;
          const drawdownMaximo = Math.abs(metrics["Max Drawdown ($)"] || 0);
          const drawdownMaximoPct = capitalInicial > 0 ? (drawdownMaximo / capitalInicial) * 100 : 0;
          
          // ✅ CORREÇÃO: Calcular DD Médio para estratégia individual
          let drawdownMedio = 0;
          if (strategyData.trades && strategyData.trades.length > 0) {
            // Calcular drawdown médio baseado nos trades
            const drawdowns: number[] = [];
            let runningTotal = 0;
            let peak = 0;
            
            strategyData.trades.forEach((trade: any) => {
              runningTotal += Number(trade.pnl) || 0;
              if (runningTotal > peak) {
                peak = runningTotal;
              }
              const drawdown = Math.abs(Math.min(0, runningTotal - peak));
              if (drawdown > 0) {
                drawdowns.push(drawdown);
              }
            });
            
            drawdownMedio = drawdowns.length > 0 ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length : 0;
            console.log(`📊 DD Médio calculado para ${strategyName}: R$ ${drawdownMedio.toLocaleString()}`);
          }
          
          return {
            resultado: resultadoLiquido,
            maxDrawdown: drawdownMaximo,
            maxDrawdownPercent: drawdownMaximoPct,
            avgDrawdown: drawdownMedio, // ✅ CORREÇÃO: DD Médio calculado
            fatorLucro: metrics["Profit Factor"] || 0,
            winRate: metrics["Win Rate (%)"] || 0,
            roi: metrics["ROI (%)"] || 0,
            totalTrades: metrics["Total Trades"] || 0,
            winningTrades: metrics["Winning Trades"] || 0,
            losingTrades: metrics["Losing Trades"] || 0
          };
        }
      } else {
        // Múltiplas estratégias: usar calculateDirectConsolidation + dailyMetricsFromApi
        console.log('🔧 MODO INDIVIDUAL - Múltiplas estratégias: Calculando métricas consolidadas');
        
        try {
          const consolidatedDD = calculateDirectConsolidation(filteredFileResults);
          console.log('✅ Métricas consolidadas calculadas:', consolidatedDD);
          
          if (consolidatedDD && consolidatedDD.maxDrawdownAbsoluto > 0) {
            // ✅ CORREÇÃO: Usar DD Máximo correto do calculateDirectConsolidation
            const capitalInicial = 100000; // Valor padrão
            const drawdownMaximoPct = capitalInicial > 0 ? (consolidatedDD.maxDrawdownAbsoluto / capitalInicial) * 100 : 0;
            console.log('📊 DD Máximo % calculado:', drawdownMaximoPct.toFixed(2) + '%');
            
            // ✅ CORREÇÃO: Usar dailyMetricsFromApi para campos que calculateDirectConsolidation não retorna
            let avgDrawdown = 0;
            let fatorLucro = 0;
            let winRate = 0;
            let roi = 0;
            let winningTrades = 0;
            let losingTrades = 0;
            
            if (dailyMetricsFromApi && dailyMetricsFromApi.metricas_principais) {
              const metricas = dailyMetricsFromApi.metricas_principais;
              avgDrawdown = metricas.drawdown_medio || 0;
              fatorLucro = metricas.fator_lucro || 0;
              winRate = metricas.win_rate || 0;
              roi = metricas.roi || 0;
              winningTrades = metricas.trades_lucrativos || 0;
              losingTrades = metricas.trades_prejuizo || 0;
              
              console.log('✅ Usando dailyMetricsFromApi para métricas consolidadas:', {
                avgDrawdown,
                fatorLucro,
                winRate,
                roi,
                winningTrades,
                losingTrades
              });
            }
            
            const result = {
              resultado: consolidatedDD.resultadoFinal || 0,
              maxDrawdown: consolidatedDD.maxDrawdownAbsoluto, // ✅ DD Máximo correto do calculateDirectConsolidation
              maxDrawdownPercent: drawdownMaximoPct, // ✅ DD Máximo % baseado no capital inicial
              avgDrawdown: avgDrawdown, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
              fatorLucro: fatorLucro, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
              winRate: winRate, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
              roi: roi, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
              totalTrades: consolidatedDD.totalTrades || 0,
              winningTrades: winningTrades, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
              losingTrades: losingTrades // ✅ CORREÇÃO: Usar dailyMetricsFromApi
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
          
          // ✅ CORREÇÃO: Usar dailyMetricsFromApi para campos que calculateDirectConsolidation não retorna
          let avgDrawdown = 0;
          let fatorLucro = 0;
          let winRate = 0;
          let roi = 0;
          let winningTrades = 0;
          let losingTrades = 0;
          
          if (dailyMetricsFromApi && dailyMetricsFromApi.metricas_principais) {
            const metricas = dailyMetricsFromApi.metricas_principais;
            avgDrawdown = metricas.drawdown_medio || 0;
            fatorLucro = metricas.fator_lucro || 0;
            winRate = metricas.win_rate || 0;
            roi = metricas.roi || 0;
            winningTrades = metricas.trades_lucrativos || 0;
            losingTrades = metricas.trades_prejuizo || 0;
            
            console.log('✅ Usando dailyMetricsFromApi para campos adicionais:', {
              avgDrawdown,
              fatorLucro,
              winRate,
              roi,
              winningTrades,
              losingTrades
            });
          }
          
            const result = {
            resultado: consolidatedDD.resultadoFinal || 0,
            maxDrawdown: consolidatedDD.maxDrawdownAbsoluto, // ✅ DD Máximo correto do calculateDirectConsolidation
            maxDrawdownPercent: drawdownMaximoPct, // ✅ DD Máximo % baseado no capital inicial
            avgDrawdown: avgDrawdown, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
            fatorLucro: fatorLucro, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
            winRate: winRate, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
            roi: roi, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
            totalTrades: consolidatedDD.totalTrades || 0,
            winningTrades: winningTrades, // ✅ CORREÇÃO: Usar dailyMetricsFromApi
            losingTrades: losingTrades // ✅ CORREÇÃO: Usar dailyMetricsFromApi
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
      
      const strategyName = Object.keys(filteredFileResults)[0];
      const strategyData = filteredFileResults[strategyName];
      
      if (strategyData && strategyData["Performance Metrics"]) {
        const metrics = strategyData["Performance Metrics"];
        const capitalInicial = 100000; // Valor padrão
        
        console.log(`🎯 MODO CONSOLIDADO - CSV ÚNICO: ${strategyName}`);
        console.log('📊 Métricas da estratégia:', metrics);
        
        const resultadoLiquido = metrics["Net Profit"] || 0;
        const drawdownMaximo = Math.abs(metrics["Max Drawdown ($)"] || 0);
        const drawdownMaximoPct = capitalInicial > 0 ? (drawdownMaximo / capitalInicial) * 100 : 0;
        
        // ✅ CORREÇÃO: Usar dailyMetricsFromApi para campos adicionais se disponível
        let avgDrawdown = metrics["Average Drawdown"] || 0;
        let fatorLucro = metrics["Profit Factor"] || 0;
        let winRate = metrics["Win Rate (%)"] || 0;
        let roi = metrics["ROI (%)"] || 0;
        let winningTrades = metrics["Winning Trades"] || 0;
        let losingTrades = metrics["Losing Trades"] || 0;
        
        if (dailyMetricsFromApi && dailyMetricsFromApi.metricas_principais) {
          const metricas = dailyMetricsFromApi.metricas_principais;
          avgDrawdown = metricas.drawdown_medio || avgDrawdown;
          fatorLucro = metricas.fator_lucro || fatorLucro;
          winRate = metricas.win_rate || winRate;
          roi = metricas.roi || roi;
          winningTrades = metricas.trades_lucrativos || winningTrades;
          losingTrades = metricas.trades_prejuizo || losingTrades;
          
          console.log('✅ Usando dailyMetricsFromApi para campos adicionais (CSV único):', {
            avgDrawdown,
            fatorLucro,
            winRate,
            roi,
            winningTrades,
            losingTrades
          });
        }
        
        return {
          resultado: resultadoLiquido,
          maxDrawdown: drawdownMaximo,
          maxDrawdownPercent: drawdownMaximoPct,
          avgDrawdown: avgDrawdown,
          fatorLucro: fatorLucro,
          winRate: winRate,
          roi: roi,
          totalTrades: metrics["Total Trades"] || 0,
          winningTrades: winningTrades,
          losingTrades: losingTrades
        };
      }
    }
    
    // ✅ CORREÇÃO: Caso específico para CSV único - usar Performance Metrics do data
    if (data && data["Performance Metrics"]) {
      console.log('✅ CSV ÚNICO: Usando Performance Metrics do data');
      const metrics = data["Performance Metrics"];
      const capitalInicial = 100000; // Valor padrão
      
      console.log('📊 Performance Metrics do data:', metrics);
      
      const resultadoLiquido = metrics["Net Profit"] || 0;
      const drawdownMaximo = Math.abs(metrics["Max Drawdown ($)"] || 0);
      const drawdownMaximoPct = capitalInicial > 0 ? (drawdownMaximo / capitalInicial) * 100 : 0;
      
      // ✅ CORREÇÃO: Calcular ROI baseado no Net Profit e capital inicial
      let roi = capitalInicial > 0 ? (resultadoLiquido / capitalInicial) * 100 : 0;
      
      // ✅ CORREÇÃO: Usar dailyMetricsFromApi para campos adicionais se disponível
      let avgDrawdown = 0; // Será calculado se dailyMetricsFromApi estiver disponível
      let fatorLucro = metrics["Profit Factor"] || 0;
      let winRate = metrics["Win Rate (%)"] || 0;
      let winningTrades = metrics["Winning Trades"] || 0;
      let losingTrades = metrics["Losing Trades"] || 0;
      
      if (dailyMetricsFromApi && dailyMetricsFromApi.metricas_principais) {
        const metricas = dailyMetricsFromApi.metricas_principais;
        avgDrawdown = metricas.drawdown_medio || 0;
        fatorLucro = metricas.fator_lucro || fatorLucro;
        winRate = metricas.win_rate || winRate;
        roi = metricas.roi || roi; // Usar ROI da API se disponível
        winningTrades = metricas.trades_lucrativos || winningTrades;
        losingTrades = metricas.trades_prejuizo || losingTrades;
        
        console.log('✅ Usando dailyMetricsFromApi para campos adicionais (CSV único - data):', {
          avgDrawdown,
          fatorLucro,
          winRate,
          roi,
          winningTrades,
          losingTrades
        });
      } else {
        // ✅ CORREÇÃO: Se não há dailyMetricsFromApi, calcular DD Médio manualmente
        if (data["Equity Curve Data"] && data["Equity Curve Data"].daily) {
          const dailyData = data["Equity Curve Data"].daily;
          const drawdowns = dailyData
            .map((item: any) => Number(item.drawdown) || 0)
            .filter(dd => dd > 0);
          
          if (drawdowns.length > 0) {
            avgDrawdown = drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length;
            console.log('✅ DD Médio calculado manualmente:', avgDrawdown);
          }
        }
      }
      
      console.log('✅ Resultado para CSV único usando Performance Metrics do data:', {
        resultado: resultadoLiquido,
        maxDrawdown: drawdownMaximo,
        maxDrawdownPercent: drawdownMaximoPct,
        avgDrawdown,
        fatorLucro,
        winRate,
        roi
      });
    
    return {
        resultado: resultadoLiquido,
        maxDrawdown: drawdownMaximo,
        maxDrawdownPercent: drawdownMaximoPct,
        avgDrawdown: avgDrawdown,
        fatorLucro: fatorLucro,
        winRate: winRate,
        roi: roi,
        totalTrades: metrics["Total Trades"] || 0,
        winningTrades: winningTrades,
        losingTrades: losingTrades
      };
    }
    
    // 🎯 FALLBACK: Para CSV único ou quando calculateDirectConsolidation falha
    if (dailyMetricsFromApi) {
      console.log('🔧 FALLBACK: Usando dailyMetricsFromApi');
      console.log('📊 dailyMetricsFromApi completo:', dailyMetricsFromApi);
      
      // ✅ CORREÇÃO: Garantir que campos zerados sejam calculados corretamente
      const metricas = dailyMetricsFromApi.metricas_principais || {};
      
      // 🎯 Cálculos alternativos para campos que podem estar zerados
      const resultadoLiquido = metricas.resultado_liquido || 0;
      const drawdownMaximo = Math.abs(metricas.drawdown_maximo || 0);
      
      // ✅ CORREÇÃO CRÍTICA: Calcular drawdown percent baseado no capital inicial
      const capitalInicial = metricas.capital_inicial || 100000; // Valor padrão
      const drawdownMaximoPct = capitalInicial > 0 ? (drawdownMaximo / capitalInicial) * 100 : 0;
      
      // ✅ DD Médio: Se estiver zerado, tentar calcular ou usar valor padrão
      const drawdownMedio = metricas.drawdown_medio || 0;
      
      // ✅ Fator de Lucro: Se estiver zerado, calcular baseado em lucro/prejuízo
      const lucroBruto = metricas.lucro_bruto || 0;
      const prejuizoBruto = Math.abs(metricas.prejuizo_bruto || 0);
      const fatorLucro = metricas.fator_lucro || (prejuizoBruto > 0 ? lucroBruto / prejuizoBruto : 0);
      
      // ✅ Win Rate: Se estiver zerado, calcular baseado em trades
      const totalTrades = metricas.total_trades || 0;
      const tradesLucrativos = metricas.trades_lucrativos || 0;
      const winRate = metricas.win_rate || (totalTrades > 0 ? (tradesLucrativos / totalTrades) * 100 : 0);
      
      // ✅ ROI: Se estiver zerado, calcular baseado no resultado
      let roi = metricas.roi || (capitalInicial > 0 ? (resultadoLiquido / capitalInicial) * 100 : 0);
      
      // ✅ DEBUG: Verificar cálculo do drawdown percent
      console.log('🔍 DEBUG Drawdown Percent:');
      console.log('  📊 Capital Inicial:', capitalInicial);
      console.log('  📊 Drawdown Máximo:', drawdownMaximo);
      console.log('  📊 Drawdown Percent Calculado:', drawdownMaximoPct.toFixed(2) + '%');
      console.log('  📊 Fórmula: (', drawdownMaximo, '/', capitalInicial, ') * 100 =', drawdownMaximoPct.toFixed(2) + '%');
      
      const result = {
        resultado: resultadoLiquido,
        maxDrawdown: drawdownMaximo,
        maxDrawdownPercent: drawdownMaximoPct, // ✅ CORREÇÃO: Usar cálculo baseado no capital inicial
        avgDrawdown: drawdownMedio,
        fatorLucro: fatorLucro,
        winRate: winRate,
        roi: roi,
        totalTrades: totalTrades,
        profitableTrades: tradesLucrativos,
        losingTrades: metricas.trades_prejudiciais || 0,
        avgWin: metricas.lucro_medio || 0,
        avgLoss: metricas.prejuizo_medio || 0,
        profitFactor: fatorLucro, // Usar o mesmo valor calculado
        sharpeRatio: metricas.sharpe_ratio || 0,
        maxConsecutiveWins: metricas.max_consecutive_wins || 0,
        maxConsecutiveLosses: metricas.max_consecutive_losses || 0,
        avgTrade: metricas.lucro_medio_trade || 0,
        expectancy: metricas.expectancy || 0,
        calmarRatio: metricas.calmar_ratio || 0,
        sortinoRatio: metricas.sortino_ratio || 0,
        recoveryFactor: metricas.recovery_factor || 0,
        riskRewardRatio: metricas.risk_reward_ratio || 0,
        maxDrawdownDuration: metricas.max_drawdown_duration || 0,
        avgDrawdownDuration: metricas.avg_drawdown_duration || 0,
        totalReturn: metricas.total_return || 0,
        annualizedReturn: metricas.annualized_return || 0,
        volatility: metricas.volatility || 0,
        downsideDeviation: metricas.downside_deviation || 0,
        informationRatio: metricas.information_ratio || 0,
        treynorRatio: metricas.treynor_ratio || 0,
        jensenAlpha: metricas.jensen_alpha || 0,
        kellyCriterion: metricas.kelly_criterion || 0,
        ulcerIndex: metricas.ulcer_index || 0,
        gainToPainRatio: metricas.gain_to_pain_ratio || 0,
        payoffRatio: metricas.payoff_ratio || 0,
        averageWin: metricas.lucro_medio || 0,
        averageLoss: metricas.prejuizo_medio || 0,
        largestWin: metricas.maior_lucro || 0,
        largestLoss: metricas.maior_prejuizo || 0,
        consecutiveWins: metricas.max_consecutive_wins || 0,
        consecutiveLosses: metricas.max_consecutive_losses || 0,
        currentStreak: metricas.current_streak || 0,
        maxEquity: metricas.max_equity || 0,
        minEquity: metricas.min_equity || 0,
        finalEquity: metricas.final_equity || 0,
        initialCapital: capitalInicial,
        totalPnL: metricas.total_pnl || 0,
        grossProfit: lucroBruto,
        grossLoss: prejuizoBruto,
        netProfit: resultadoLiquido
      };
      
      console.log('✅ Resultado fallback corrigido:', result);
      console.log('🔍 CAMPOS CORRIGIDOS:');
      console.log('  📊 DD Médio:', drawdownMedio);
      console.log('  📊 Fator de Lucro:', fatorLucro);
      console.log('  📊 Win Rate:', winRate);
      console.log('  📊 ROI:', roi);
      
      return result;
    }
    
    // 🎯 FALLBACK FINAL: Valores padrão
    console.log('🔧 FALLBACK FINAL: Usando valores padrão');
    return {
      resultado: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      avgDrawdown: 0,
      fatorLucro: 0,
      winRate: 0,
      totalTrades: 0,
      profitableTrades: 0,
      losingTrades: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      roi: 0,
      avgTrade: 0,
      expectancy: 0,
      calmarRatio: 0,
      sortinoRatio: 0,
      recoveryFactor: 0,
      riskRewardRatio: 0,
      maxDrawdownDuration: 0,
      avgDrawdownDuration: 0,
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      downsideDeviation: 0,
      informationRatio: 0,
      treynorRatio: 0,
      jensenAlpha: 0,
      kellyCriterion: 0,
      ulcerIndex: 0,
      gainToPainRatio: 0,
      payoffRatio: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      currentStreak: 0,
      maxEquity: 0,
      minEquity: 0,
      finalEquity: 0,
      initialCapital: 0,
      totalPnL: 0,
      grossProfit: 0,
      grossLoss: 0,
      netProfit: 0
    };
  }, [data, dailyMetricsFromApi, fileResults, showConsolidated]);

  // Componente de Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: unknown) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-2">{`Data: ${dataPoint?.fullDate || label}`}</p>
          {payload.map((entry: unknown, index: number) => (
            <p key={index} className="text-sm" style={{ color: (entry as any).color }}>
              {(entry as any).dataKey === 'saldo' && `Saldo: R$ ${(entry as any).value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              {(entry as any).dataKey === 'valor' && `Patrimônio: R$ ${(entry as any).value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              {(entry as any).dataKey === 'resultado' && `Resultado: R$ ${(entry as any).value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              {(entry as any).dataKey === 'drawdown' && `Drawdown: R$ ${(entry as any).value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dataPoint?.drawdownPercent?.toFixed(2) || 0}%)`}
              {(entry as any).dataKey === 'saldoMA' && `MM ${movingAverage}: R$ ${(entry as any).value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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
          
          {payload.map((entry: unknown, index: number) => (
            <p key={index} className="text-sm" style={{ color: (entry as any).color }}>
              {(entry as any).dataKey === 'drawdown' && `Drawdown: R$ ${(entry as any).value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dataPoint?.drawdownPercent?.toFixed(2) || 0}%)`}
              {(entry as any).dataKey === 'resultadoMA' && `MM ${movingAverage}: R$ ${(entry as any).value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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

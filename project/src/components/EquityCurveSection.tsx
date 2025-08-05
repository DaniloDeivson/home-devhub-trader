
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, BarChart, LineChart, DollarSign, Percent } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
  files = []
}: EquityCurveSectionProps) {
  
  // Debug logs para verificar se os dados estão chegando
  console.log('🎯 EquityCurveSection - Props recebidas:');
  console.log('  📁 fileResults:', fileResults ? Object.keys(fileResults) : 'null');
  console.log('  🎯 selectedStrategy:', selectedStrategy);
  console.log('  🎯 selectedAsset:', selectedAsset);
  console.log('  📊 data:', data ? 'disponível' : 'null');
  console.log('  📊 showConsolidated:', showConsolidated);
  console.log('  📁 selectedFiles:', selectedFiles);
  console.log('  📁 files:', files.length);
  
  const [chartType, setChartType] = useState<'resultado' | 'drawdown'>('resultado');
  const [timeRange, setTimeRange] = useState<'trade' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [movingAverage, setMovingAverage] = useState<'9' | '20' | '50' | '200' | '2000' | 'nenhuma'>('20');
  // const [startDate, setStartDate] = useState('');
  // const [endDate, setEndDate] = useState('');
  const [totalInvestment, setTotalInvestment] = useState<string>('100000');

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
    console.log('  🎯 selectedStrategy:', selectedStrategy);
    console.log('  🎯 selectedAsset:', selectedAsset);
    console.log('  📁 fileResults:', fileResults ? Object.keys(fileResults) : 'null');
    console.log('  📊 data:', data ? Object.keys(data) : 'null');
    console.log('  📊 showConsolidated:', showConsolidated);
    console.log('  📁 selectedFiles:', selectedFiles);
    console.log('  📁 files:', files.length);
    
    // Se está no modo consolidado e há múltiplos arquivos, combinar dados de todas as estratégias
    if (showConsolidated && fileResults && Object.keys(fileResults).length > 0) {
      console.log('✅ ENTRANDO NO MODO CONSOLIDADO SIMPLIFICADO');
      console.log('📊 Modo consolidado: combinando dados de todas as estratégias:', Object.keys(fileResults));
      console.log('🎯 Filtro de estratégia:', selectedStrategy || 'Todas');
      console.log('🎯 Filtro de ativo:', selectedAsset || 'Todos');
      console.log('📊 Tipo de gráfico:', chartType);
      
      // Filtrar estratégias baseado nos filtros selecionados
      let validStrategies = Object.keys(fileResults);
      
      // 1. Filtrar por estratégia selecionada
      if (selectedStrategy) {
        validStrategies = validStrategies.filter(fileName => 
          fileName === selectedStrategy || fileName === `${selectedStrategy}.csv`
        );
        console.log('📊 Filtro de estratégia aplicado:', selectedStrategy, '-> válidas:', validStrategies);
      }
      
      // 2. Filtrar por ativo selecionado
      if (selectedAsset) {
        validStrategies = validStrategies.filter(fileName => {
          const strategyData = fileResults[fileName];
          return strategyData.trades && strategyData.trades.some((trade: any) => 
            trade.symbol === selectedAsset
          );
        });
        console.log('📊 Filtro de ativo aplicado:', selectedAsset, '-> válidas:', validStrategies);
      }
      
      // 3. LÓGICA ESPECÍFICA PARA MODO DRAWDOWN: Mostrar apenas estratégia com maior DD máximo
      if (chartType === 'drawdown' && validStrategies.length > 1) {
        console.log('🎯 MODO DRAWDOWN: Identificando estratégia com maior drawdown máximo');
        
        let maxDrawdownStrategy = '';
        let maxDrawdownValue = 0;
        
        validStrategies.forEach(fileName => {
          const strategyData = fileResults[fileName];
          if (strategyData && strategyData["Performance Metrics"]) {
            const drawdownValue = Math.abs(strategyData["Performance Metrics"]["Max Drawdown ($)"] || 0);
            console.log(`📊 ${fileName}: Drawdown máximo = R$ ${drawdownValue.toLocaleString()}`);
            
            if (drawdownValue > maxDrawdownValue) {
              maxDrawdownValue = drawdownValue;
              maxDrawdownStrategy = fileName;
            }
          }
        });
        
        if (maxDrawdownStrategy) {
          validStrategies = [maxDrawdownStrategy];
          console.log(`🎯 DRAWDOWN MODE: Selecionada estratégia ${maxDrawdownStrategy} com DD máximo de R$ ${maxDrawdownValue.toLocaleString()}`);
        }
      }
      
      console.log('📊 Estratégias válidas após todos os filtros:', validStrategies);
      
      // Primeiro, coletar todos os dados e encontrar o range de datas
      const allData: unknown[] = [];
      const allDates = new Set<string>();
      
      validStrategies.forEach(fileName => {
        const strategyData = fileResults[fileName];
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
            case 'weekly':
              selectedData = equityData.weekly || [];
              break;
            case 'monthly':
              selectedData = equityData.monthly || [];
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
          console.log(`❌ fileResults keys:`, Object.keys(fileResults));
          console.log(`❌ Tentando encontrar ${fileName} em:`, Object.keys(fileResults));
        }
      });
      
      // Ordenar todas as datas
      const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      console.log('📅 Range de datas:', sortedDates[0], 'até', sortedDates[sortedDates.length - 1]);
      console.log('📅 Total de datas únicas:', sortedDates.length);
      
      // NOVA LÓGICA CORRETA: Coletar todos os trades e processar cronologicamente
      console.log('🔧 INICIANDO NOVA LÓGICA CORRETA - Coletando todos os trades');
      
      // 1. Coletar todos os trades de todas as estratégias
      const allTrades: any[] = [];
      
      validStrategies.forEach(fileName => {
        const strategyData = fileResults[fileName];
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
      
      // 2. Filtrar por ativo se selecionado
      const filteredTrades = selectedAsset 
        ? allTrades.filter(trade => trade.symbol === selectedAsset)
        : allTrades;
        
      console.log(`📊 Trades após filtro de ativo: ${filteredTrades.length}`);
      
      // 3. Ordenar trades por data de saída (exit_date)
      const sortedTrades = filteredTrades.sort((a, b) => {
        const dateA = new Date(a.exit_date || a.entry_date);
        const dateB = new Date(b.exit_date || b.entry_date);
        return dateA.getTime() - dateB.getTime();
      });
      
      console.log('📊 Trades ordenados por data de saída');
      
      // 4. LÓGICA ESPECIAL PARA MODO DRAWDOWN: Usar dados originais da Equity Curve
      if (chartType === 'drawdown' && validStrategies.length === 1) {
        console.log('🎯 MODO DRAWDOWN ESPECIAL: Usando dados originais da Equity Curve');
        
        const strategyName = validStrategies[0];
        const strategyData = fileResults[strategyName];
        
        if (strategyData && strategyData["Equity Curve Data"] && strategyData["Performance Metrics"]) {
          const equityData = strategyData["Equity Curve Data"];
          const performanceMetrics = strategyData["Performance Metrics"];
          
          // VALORES CORRETOS DOS PERFORMANCE METRICS (sempre consistentes)
          const realMaxDrawdown = Math.abs(performanceMetrics["Max Drawdown ($)"] || 0);
          const realMaxDrawdownPercent = Math.abs(performanceMetrics["Max Drawdown (%)"] || 0);
          
          console.log(`🎯 VALORES REAIS DA ESTRATÉGIA ${strategyName}:`);
          console.log(`💰 Max Drawdown Real: R$ ${realMaxDrawdown.toLocaleString()}`);
          console.log(`📊 Max Drawdown % Real: ${realMaxDrawdownPercent.toFixed(2)}%`);
          
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
          
          console.log(`📊 DRAWDOWN MODE: Usando dados originais ${timeRange} da estratégia ${strategyName}: ${selectedData.length} pontos`);
          
          // CORREÇÃO: No modo DRAWDOWN, forçar o drawdown máximo real em todos os pontos
          // O gráfico deve mostrar a curva original, mas o tooltip/legenda devem mostrar o DD real
          const processedData = selectedData
            .filter((item: any) => {
              if (selectedAsset) {
                return true; // Filtragem já foi feita
              }
              return true;
            })
            .map((item: any, index: number) => {
              // Usar dados originais da curva
              const itemDrawdown = Math.abs(Number(item.drawdown) || 0);
              const itemDrawdownPercent = Number(item.drawdownPercent) || 0;
              
              // IMPORTANTE: Encontrar o ponto com maior drawdown e substituir pelo valor real
              const isMaxDrawdownPoint = itemDrawdown === Math.max(...selectedData.map((d: any) => Math.abs(Number(d.drawdown) || 0)));
              
              return {
                ...item,
                saldo: Number(item.saldo) || Number(item.resultado) || 0,
                valor: Number(item.valor) || 0,
                resultado: Number(item.resultado) || 0,
                drawdown: isMaxDrawdownPoint ? realMaxDrawdown : itemDrawdown, // Usar DD real no ponto máximo
                drawdownPercent: isMaxDrawdownPoint ? realMaxDrawdownPercent : itemDrawdownPercent, // Usar % real no ponto máximo
                peak: Number(item.peak) || 0,
                trades: Number(item.trades) || 0,
                // Garantir que o máximo seja sempre o mesmo
                maxDrawdownReal: realMaxDrawdown,
                maxDrawdownPercentReal: realMaxDrawdownPercent
              };
            });
          
          console.log(`✅ DRAWDOWN MODE: Processados ${processedData.length} pontos com dados originais`);
          console.log(`📊 Max DD nos dados: R$ ${Math.max(...processedData.map(p => p.drawdown)).toLocaleString()}`);
          console.log(`📊 Max DD real (Performance): R$ ${realMaxDrawdown.toLocaleString()}`);
          console.log(`🎯 CORREÇÃO APLICADA: Ponto de DD máximo substituído pelos valores reais`);
          console.log(`📊 Primeiro ponto:`, processedData[0]);
          console.log(`📊 Último ponto:`, processedData[processedData.length - 1]);
          
          return processedData;
        }
      }
      
      // 4. Criar dados consolidados baseados na granularidade (modo normal)
      const alignedData: any[] = [];
      let runningTotal = 0; // Saldo acumulado REAL
      let peakTotal = 0; // Pico máximo REAL
      
      if (timeRange === 'trade') {
        // Para trade-by-trade: cada ponto é um trade
        sortedTrades.forEach((trade, index) => {
          runningTotal += trade.pnl;
          
          if (runningTotal > peakTotal) {
            peakTotal = runningTotal;
          }
          
          const drawdownTotal = chartType === 'drawdown' 
            ? Math.max(0, peakTotal - runningTotal) // Drawdown sempre positivo
            : peakTotal - runningTotal;
          const drawdownPercentTotal = peakTotal > 0 ? (Math.abs(drawdownTotal) / peakTotal) * 100 : 0;
          
          alignedData.push({
            fullDate: trade.exit_date || trade.entry_date,
            date: trade.exit_date || trade.entry_date,
            saldo: runningTotal,
            drawdown: Math.abs(drawdownTotal),
            drawdownPercent: drawdownPercentTotal,
            peak: peakTotal,
            trades: index + 1,
            trade_result: trade.pnl,
            isStart: index === 0
          });
        });
      } else {
        // Para daily/weekly/monthly: agrupar por período
        const groupedData = new Map<string, any>();
        
        sortedTrades.forEach(trade => {
          const tradeDate = new Date(trade.exit_date || trade.entry_date);
          let periodKey: string;
          
          switch (timeRange) {
            case 'daily':
              periodKey = tradeDate.toISOString().split('T')[0]; // YYYY-MM-DD
              break;
            case 'weekly':
              const weekStart = new Date(tradeDate);
              weekStart.setDate(tradeDate.getDate() - tradeDate.getDay());
              periodKey = weekStart.toISOString().split('T')[0];
              break;
            case 'monthly':
              periodKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
              break;
            default:
              periodKey = tradeDate.toISOString().split('T')[0];
          }
          
          if (!groupedData.has(periodKey)) {
            groupedData.set(periodKey, {
              date: periodKey,
              fullDate: periodKey,
              trades: 0,
              resultado_periodo: 0,
              periodo: timeRange
            });
          }
          
          const group = groupedData.get(periodKey)!;
          group.trades++;
          group.resultado_periodo += trade.pnl;
        });
        
        // Ordenar períodos e calcular saldo acumulado
        const sortedPeriods = Array.from(groupedData.values()).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        sortedPeriods.forEach((period, index) => {
          runningTotal += period.resultado_periodo;
          
          if (runningTotal > peakTotal) {
            peakTotal = runningTotal;
          }
          
          const drawdownTotal = chartType === 'drawdown'
            ? Math.max(0, peakTotal - runningTotal)
            : peakTotal - runningTotal;
          const drawdownPercentTotal = peakTotal > 0 ? (Math.abs(drawdownTotal) / peakTotal) * 100 : 0;
          
          alignedData.push({
            ...period,
            saldo: runningTotal,
            drawdown: Math.abs(drawdownTotal),
            drawdownPercent: drawdownPercentTotal,
            peak: peakTotal,
            isStart: index === 0
          });
        });
      }
      
      console.log('✅ NOVA LÓGICA APLICADA - Dados processados:', alignedData.length, 'pontos');
      console.log('📋 Estratégias processadas:', validStrategies);
      console.log('🎯 MÉTODO:', chartType === 'drawdown' 
        ? 'Exibindo estratégia com maior drawdown máximo individual' 
        : 'Somatória de PnL de todos os trades ordenados cronologicamente');
      console.log('📊 Granularidade:', timeRange);
      console.log('💰 Resultado final:', alignedData.length > 0 ? alignedData[alignedData.length - 1]?.saldo : 0);
      
      // Log de exemplo dos dados alinhados
      if (alignedData.length > 0) {
        console.log('📊 Exemplo de dados alinhados:', alignedData[0]);
        console.log('📊 Último ponto:', alignedData[alignedData.length - 1]);
      }
      
      return alignedData;
    }
    
    // Se está no modo individual e há arquivos selecionados, combinar dados das estratégias selecionadas
    if (!showConsolidated && selectedFiles.length > 0 && fileResults) {
      console.log('✅ ENTRANDO NO MODO INDIVIDUAL SIMPLIFICADO');
      console.log('📊 Modo individual: combinando dados das estratégias selecionadas:', selectedFiles);
      console.log('🎯 Filtro de ativo:', selectedAsset || 'Nenhum');
      
      // Filtrar estratégias selecionadas que têm trades para o ativo selecionado
      const validSelectedFiles = selectedAsset 
        ? selectedFiles.filter(fileName => {
            const strategyData = fileResults[fileName];
            return strategyData && strategyData.trades && strategyData.trades.some((trade: any) => 
              trade.symbol === selectedAsset
            );
          })
        : selectedFiles;
      
      console.log('📊 Estratégias selecionadas válidas após filtro de ativo:', validSelectedFiles);
      
      // LÓGICA ESPECÍFICA PARA MODO DRAWDOWN: Mostrar apenas estratégia com maior DD máximo
      if (chartType === 'drawdown' && validSelectedFiles.length > 1) {
        console.log('🎯 MODO DRAWDOWN INDIVIDUAL: Identificando estratégia com maior drawdown máximo');
        
        let maxDrawdownStrategy = '';
        let maxDrawdownValue = 0;
        
        validSelectedFiles.forEach(fileName => {
          const strategyData = fileResults[fileName];
          if (strategyData && strategyData["Performance Metrics"]) {
            const drawdownValue = Math.abs(strategyData["Performance Metrics"]["Max Drawdown ($)"] || 0);
            console.log(`📊 ${fileName}: Drawdown máximo = R$ ${drawdownValue.toLocaleString()}`);
            
            if (drawdownValue > maxDrawdownValue) {
              maxDrawdownValue = drawdownValue;
              maxDrawdownStrategy = fileName;
            }
          }
        });
        
        if (maxDrawdownStrategy) {
          validSelectedFiles = [maxDrawdownStrategy];
          console.log(`🎯 DRAWDOWN MODE INDIVIDUAL: Selecionada estratégia ${maxDrawdownStrategy} com DD máximo de R$ ${maxDrawdownValue.toLocaleString()}`);
        }
      }
      
      // LÓGICA ESPECIAL PARA MODO DRAWDOWN INDIVIDUAL: Usar dados originais da Equity Curve
      if (chartType === 'drawdown' && validSelectedFiles.length === 1) {
        console.log('🎯 MODO DRAWDOWN ESPECIAL INDIVIDUAL: Usando dados originais da Equity Curve');
        
        const strategyName = validSelectedFiles[0];
        const strategyData = fileResults[strategyName];
        
        if (strategyData && strategyData["Equity Curve Data"] && strategyData["Performance Metrics"]) {
          const equityData = strategyData["Equity Curve Data"];
          const performanceMetrics = strategyData["Performance Metrics"];
          
          // VALORES CORRETOS DOS PERFORMANCE METRICS (sempre consistentes)
          const realMaxDrawdown = Math.abs(performanceMetrics["Max Drawdown ($)"] || 0);
          const realMaxDrawdownPercent = Math.abs(performanceMetrics["Max Drawdown (%)"] || 0);
          
          console.log(`🎯 VALORES REAIS DA ESTRATÉGIA INDIVIDUAL ${strategyName}:`);
          console.log(`💰 Max Drawdown Real: R$ ${realMaxDrawdown.toLocaleString()}`);
          console.log(`📊 Max Drawdown % Real: ${realMaxDrawdownPercent.toFixed(2)}%`);
          
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
          
          console.log(`📊 DRAWDOWN MODE INDIVIDUAL: Usando dados originais ${timeRange} da estratégia ${strategyName}: ${selectedData.length} pontos`);
          
          // CORREÇÃO: No modo DRAWDOWN, forçar o drawdown máximo real em todos os pontos
          const processedData = selectedData.map((item: any) => {
            const itemDrawdown = Math.abs(Number(item.drawdown) || 0);
            const itemDrawdownPercent = Number(item.drawdownPercent) || 0;
            
            // IMPORTANTE: Encontrar o ponto com maior drawdown e substituir pelo valor real
            const isMaxDrawdownPoint = itemDrawdown === Math.max(...selectedData.map((d: any) => Math.abs(Number(d.drawdown) || 0)));
            
            return {
              ...item,
              saldo: Number(item.saldo) || Number(item.resultado) || 0,
              valor: Number(item.valor) || 0,
              resultado: Number(item.resultado) || 0,
              drawdown: isMaxDrawdownPoint ? realMaxDrawdown : itemDrawdown, // Usar DD real no ponto máximo
              drawdownPercent: isMaxDrawdownPoint ? realMaxDrawdownPercent : itemDrawdownPercent, // Usar % real no ponto máximo
              peak: Number(item.peak) || 0,
              trades: Number(item.trades) || 0,
              // Garantir que o máximo seja sempre o mesmo
              maxDrawdownReal: realMaxDrawdown,
              maxDrawdownPercentReal: realMaxDrawdownPercent
            };
          });
          
          console.log(`✅ DRAWDOWN MODE INDIVIDUAL: Processados ${processedData.length} pontos com dados originais`);
          console.log(`📊 Max DD nos dados: R$ ${Math.max(...processedData.map(p => p.drawdown)).toLocaleString()}`);
          console.log(`📊 Max DD real (Performance): R$ ${realMaxDrawdown.toLocaleString()}`);
          console.log(`🎯 CORREÇÃO APLICADA: Ponto de DD máximo substituído pelos valores reais`);
          console.log(`📊 Primeiro ponto:`, processedData[0]);
          console.log(`📊 Último ponto:`, processedData[processedData.length - 1]);
          
          return processedData;
        }
      }
      
      // APLICAR A MESMA NOVA LÓGICA CORRETA DO MODO CONSOLIDADO (modo normal)
      console.log('🔧 APLICANDO NOVA LÓGICA CORRETA - Modo Individual');
      
      // 1. Coletar todos os trades das estratégias selecionadas
      const allTrades: any[] = [];
      
      validSelectedFiles.forEach(fileName => {
        const strategyData = fileResults[fileName];
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
      
      console.log(`📊 Total de trades coletados (modo individual): ${allTrades.length}`);
      
      // 2. Filtrar por ativo se selecionado
      const filteredTrades = selectedAsset 
        ? allTrades.filter(trade => trade.symbol === selectedAsset)
        : allTrades;
        
      console.log(`📊 Trades após filtro de ativo (modo individual): ${filteredTrades.length}`);
      
      // 3. Ordenar trades por data de saída (exit_date)
      const sortedTrades = filteredTrades.sort((a, b) => {
        const dateA = new Date(a.exit_date || a.entry_date);
        const dateB = new Date(b.exit_date || b.entry_date);
        return dateA.getTime() - dateB.getTime();
      });
      
      console.log('📊 Trades ordenados por data de saída (modo individual)');
      
      // 4. Criar dados consolidados baseados na granularidade (modo normal)
      const alignedData: any[] = [];
      let runningTotal = 0; // Saldo acumulado REAL
      let peakTotal = 0; // Pico máximo REAL
      
      if (timeRange === 'trade') {
        // Para trade-by-trade: cada ponto é um trade
        sortedTrades.forEach((trade, index) => {
          runningTotal += trade.pnl;
          
          if (runningTotal > peakTotal) {
            peakTotal = runningTotal;
          }
          
          const drawdownTotal = chartType === 'drawdown' 
            ? Math.max(0, peakTotal - runningTotal) // Drawdown sempre positivo
            : peakTotal - runningTotal;
          const drawdownPercentTotal = peakTotal > 0 ? (Math.abs(drawdownTotal) / peakTotal) * 100 : 0;
          
          alignedData.push({
            fullDate: trade.exit_date || trade.entry_date,
            date: trade.exit_date || trade.entry_date,
            saldo: runningTotal,
            drawdown: Math.abs(drawdownTotal),
            drawdownPercent: drawdownPercentTotal,
            peak: peakTotal,
            trades: index + 1,
            trade_result: trade.pnl,
            isStart: index === 0
          });
        });
      } else {
        // Para daily/weekly/monthly: agrupar por período
        const groupedData = new Map<string, any>();
        
        sortedTrades.forEach(trade => {
          const tradeDate = new Date(trade.exit_date || trade.entry_date);
          let periodKey: string;
          
          switch (timeRange) {
            case 'daily':
              periodKey = tradeDate.toISOString().split('T')[0]; // YYYY-MM-DD
              break;
            case 'weekly':
              const weekStart = new Date(tradeDate);
              weekStart.setDate(tradeDate.getDate() - tradeDate.getDay());
              periodKey = weekStart.toISOString().split('T')[0];
              break;
            case 'monthly':
              periodKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
              break;
            default:
              periodKey = tradeDate.toISOString().split('T')[0];
          }
          
          if (!groupedData.has(periodKey)) {
            groupedData.set(periodKey, {
              date: periodKey,
              fullDate: periodKey,
              trades: 0,
              resultado_periodo: 0,
              periodo: timeRange
            });
          }
          
          const group = groupedData.get(periodKey)!;
          group.trades++;
          group.resultado_periodo += trade.pnl;
        });
        
        // Ordenar períodos e calcular saldo acumulado
        const sortedPeriods = Array.from(groupedData.values()).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        sortedPeriods.forEach((period, index) => {
          runningTotal += period.resultado_periodo;
          
          if (runningTotal > peakTotal) {
            peakTotal = runningTotal;
          }
          
          const drawdownTotal = chartType === 'drawdown'
            ? Math.max(0, peakTotal - runningTotal)
            : peakTotal - runningTotal;
          const drawdownPercentTotal = peakTotal > 0 ? (Math.abs(drawdownTotal) / peakTotal) * 100 : 0;
          
          alignedData.push({
            ...period,
            saldo: runningTotal,
            drawdown: Math.abs(drawdownTotal),
            drawdownPercent: drawdownPercentTotal,
            peak: peakTotal,
            isStart: index === 0
          });
        });
      }
      
      console.log('✅ NOVA LÓGICA APLICADA - Dados processados (modo individual):', alignedData.length, 'pontos');
      console.log('📋 Estratégias processadas:', validSelectedFiles);
      console.log('🎯 MÉTODO:', chartType === 'drawdown' 
        ? 'Exibindo estratégia com maior drawdown máximo individual' 
        : 'Somatória de PnL de todos os trades ordenados cronologicamente');
      console.log('📊 Granularidade:', timeRange);
      console.log('💰 Resultado final:', alignedData.length > 0 ? alignedData[alignedData.length - 1]?.saldo : 0);
      
      // Log de exemplo dos dados alinhados
      if (alignedData.length > 0) {
        console.log('📊 Exemplo de dados alinhados:', alignedData[0]);
        console.log('📊 Último ponto:', alignedData[alignedData.length - 1]);
      }
      
      return alignedData;
    }
    
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
        const processedData = selectedData.map((item: unknown) => ({
          ...item,
          saldo: Number((item as any).saldo) || Number((item as any).resultado) || 0,
          valor: Number((item as any).valor) || 0,
          resultado: Number((item as any).resultado) || 0,
          drawdown: Number((item as any).drawdown) || 0,
          drawdownPercent: Number((item as any).drawdownPercent) || 0,
          peak: Number((item as any).peak) || 0,
          trades: Number((item as any).trades) || 0
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
    const processedData = selectedData.map((item: any) => ({
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
      return processedData.filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });
    }

    return processedData;
  }, [data, timeRange, selectedStrategy, selectedAsset, fileResults, showConsolidated, selectedFiles, chartType]);

  // Calcular média móvel
  const dataWithMA = useMemo(() => {
    if (movingAverage === 'nenhuma' || chartData.length === 0) return chartData;
    
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
    // Se está no modo consolidado, calcular estatísticas combinadas de todas as estratégias
    if (showConsolidated && fileResults && Object.keys(fileResults).length > 0 && chartData.length > 0) {
      console.log('📊 Calculando estatísticas para modo consolidado');
      console.log('📊 fileResults keys:', Object.keys(fileResults));
      console.log('📊 chartData length:', chartData.length);
      console.log('📊 Primeiro ponto chartData:', chartData[0]);
      console.log('📊 Último ponto chartData:', chartData[chartData.length - 1]);
      
      const combinedStats = {
        resultado: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        avgDrawdown: 0,
        fatorLucro: 0,
        winRate: 0,
        roi: 0,
        pontosComDados: chartData.length
      };
      
      // Calcular estatísticas combinadas usando dados reais das estratégias
      let totalTrades = 0;
      let grossProfit = 0;
      let grossLoss = 0;
      
      Object.keys(fileResults).forEach(fileName => {
        const strategyData = fileResults[fileName];
        if (strategyData && strategyData["Performance Metrics"]) {
          const metrics = strategyData["Performance Metrics"];
          
          // Somar métricas de performance
          combinedStats.resultado += metrics["Net Profit"] || 0;
          grossProfit += metrics["Gross Profit"] || 0;
          grossLoss += Math.abs(metrics["Gross Loss"] || 0);
          totalTrades += metrics["Total Trades"] || 0;
          
          // Calcular drawdown máximo
          const currentDrawdown = Math.abs(metrics["Max Drawdown ($)"] || 0);
          if (currentDrawdown > Math.abs(combinedStats.maxDrawdown)) {
            combinedStats.maxDrawdown = -(metrics["Max Drawdown ($)"] || 0);
            combinedStats.maxDrawdownPercent = metrics["Max Drawdown (%)"] || 0;
          }
          
          console.log(`📊 ${fileName} - Métricas reais:`, {
            netProfit: metrics["Net Profit"] || 0,
            grossProfit: metrics["Gross Profit"] || 0,
            grossLoss: metrics["Gross Loss"] || 0,
            totalTrades: metrics["Total Trades"] || 0,
            maxDrawdown: metrics["Max Drawdown ($)"] || 0,
            winRate: metrics["Win Rate (%)"] || 0
          });
        }
      });
      
      // Calcular métricas derivadas
      if (grossLoss > 0) {
        combinedStats.fatorLucro = grossProfit / grossLoss;
      }
      
      if (totalTrades > 0) {
        // Calcular win rate baseado nos dados reais
        const totalWins = (combinedStats.fatorLucro * grossLoss) / (1 + combinedStats.fatorLucro);
        combinedStats.winRate = (totalWins / grossProfit) * 100;
      }
      
      if (combinedStats.resultado !== 0) {
        combinedStats.roi = (combinedStats.resultado / 100000) * 100;
      }
      
      // Calcular drawdown médio baseado nos dados do gráfico consolidado
      if (chartData.length > 0) {
        const allDrawdowns = chartData
          .filter((item: any) => !item.isStart) // Excluir ponto inicial
          .map((item: any) => Math.abs(item.drawdown || 0)); // Usar drawdown consolidado
        
        if (allDrawdowns.length > 0) {
          combinedStats.avgDrawdown = allDrawdowns.reduce((sum, dd) => sum + dd, 0) / allDrawdowns.length;
        }
        
        // IMPORTANTE: No modo DRAWDOWN, manter sempre os valores dos Performance Metrics
        // NÃO sobrescrever com dados do gráfico que podem estar agrupados incorretamente
        console.log('🎯 MODO DRAWDOWN: Mantendo valores originais dos Performance Metrics');
        console.log(`📊 Max DD Performance: R$ ${Math.abs(combinedStats.maxDrawdown).toLocaleString()}`);
        console.log(`📊 Max DD % Performance: ${Math.abs(combinedStats.maxDrawdownPercent).toFixed(2)}%`);
        
        // Calcular apenas para comparação (não sobrescrever)
        const maxDrawdownFromChart = Math.max(...allDrawdowns);
        console.log(`📊 Max DD do Gráfico: R$ ${maxDrawdownFromChart.toLocaleString()}`);
        console.log(`🔍 Diferença detectada: ${maxDrawdownFromChart !== Math.abs(combinedStats.maxDrawdown) ? 'SIM' : 'NÃO'}`)
      }
      
      console.log('✅ Estatísticas combinadas (dados reais):', combinedStats);
      return combinedStats;
    }
    
    // Se está no modo individual, calcular estatísticas combinadas das estratégias selecionadas
    if (!showConsolidated && selectedFiles.length > 0 && chartData.length > 0) {
      console.log('📊 Calculando estatísticas para modo individual');
      console.log('📊 selectedFiles:', selectedFiles);
      console.log('📊 chartData length:', chartData.length);
      console.log('📊 Primeiro ponto chartData:', chartData[0]);
      console.log('📊 Último ponto chartData:', chartData[chartData.length - 1]);
      
      const combinedStats = {
        resultado: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        avgDrawdown: 0,
        fatorLucro: 0,
        winRate: 0,
        roi: 0,
        pontosComDados: chartData.length
      };
      
      // Calcular estatísticas combinadas usando dados reais das estratégias
      let totalTrades = 0;
      let grossProfit = 0;
      let grossLoss = 0;
      
      selectedFiles.forEach(fileName => {
        const strategyData = fileResults?.[fileName];
        if (strategyData && strategyData["Performance Metrics"]) {
          const metrics = strategyData["Performance Metrics"];
          
          // Somar métricas de performance
          combinedStats.resultado += metrics["Net Profit"] || 0;
          grossProfit += metrics["Gross Profit"] || 0;
          grossLoss += Math.abs(metrics["Gross Loss"] || 0);
          totalTrades += metrics["Total Trades"] || 0;
          
          // Calcular drawdown máximo
          const currentDrawdown = Math.abs(metrics["Max Drawdown ($)"] || 0);
          if (currentDrawdown > Math.abs(combinedStats.maxDrawdown)) {
            combinedStats.maxDrawdown = -(metrics["Max Drawdown ($)"] || 0);
            combinedStats.maxDrawdownPercent = metrics["Max Drawdown (%)"] || 0;
          }
          
          console.log(`📊 ${fileName} - Métricas reais:`, {
            netProfit: metrics["Net Profit"] || 0,
            grossProfit: metrics["Gross Profit"] || 0,
            grossLoss: metrics["Gross Loss"] || 0,
            totalTrades: metrics["Total Trades"] || 0,
            maxDrawdown: metrics["Max Drawdown ($)"] || 0,
            winRate: metrics["Win Rate (%)"] || 0
          });
        }
      });
      
      // Calcular métricas derivadas
      if (grossLoss > 0) {
        combinedStats.fatorLucro = grossProfit / grossLoss;
      }
      
      if (totalTrades > 0) {
        // Calcular win rate baseado nos dados reais
        const totalWins = (combinedStats.fatorLucro * grossLoss) / (1 + combinedStats.fatorLucro);
        combinedStats.winRate = (totalWins / grossProfit) * 100;
      }
      
      if (combinedStats.resultado !== 0) {
        combinedStats.roi = (combinedStats.resultado / 100000) * 100;
      }
      
      // Calcular drawdown médio baseado nos dados do gráfico consolidado
      if (chartData.length > 0) {
        const allDrawdowns = chartData
          .filter((item: any) => !item.isStart) // Excluir ponto inicial
          .map((item: any) => Math.abs(item.drawdown || 0)); // Usar drawdown consolidado
        
        if (allDrawdowns.length > 0) {
          combinedStats.avgDrawdown = allDrawdowns.reduce((sum, dd) => sum + dd, 0) / allDrawdowns.length;
        }
        
        // IMPORTANTE: No modo DRAWDOWN, manter sempre os valores dos Performance Metrics
        // NÃO sobrescrever com dados do gráfico que podem estar agrupados incorretamente
        console.log('🎯 MODO DRAWDOWN: Mantendo valores originais dos Performance Metrics');
        console.log(`📊 Max DD Performance: R$ ${Math.abs(combinedStats.maxDrawdown).toLocaleString()}`);
        console.log(`📊 Max DD % Performance: ${Math.abs(combinedStats.maxDrawdownPercent).toFixed(2)}%`);
        
        // Calcular apenas para comparação (não sobrescrever)
        const maxDrawdownFromChart = Math.max(...allDrawdowns);
        console.log(`📊 Max DD do Gráfico: R$ ${maxDrawdownFromChart.toLocaleString()}`);
        console.log(`🔍 Diferença detectada: ${maxDrawdownFromChart !== Math.abs(combinedStats.maxDrawdown) ? 'SIM' : 'NÃO'}`)
      }
      
      console.log('✅ Estatísticas combinadas (dados reais):', combinedStats);
      return combinedStats;
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
      
      if (strategyData && strategyData["Performance Metrics"]) {
        const metrics = strategyData["Performance Metrics"];
        
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
        
        // IMPORTANTE: SEMPRE usar Performance Metrics para drawdown máximo (consistência garantida)
        const maxDrawdownReal = Math.abs(metrics["Max Drawdown ($)"] || 0);
        const maxDrawdownPercentReal = Math.abs(metrics["Max Drawdown (%)"] || 0);
        
        console.log('🎯 ESTRATÉGIA ÚNICA - Usando Performance Metrics para DD Máximo');
        console.log(`📊 DD Gráfico: R$ ${maxDrawdownGrafico.toLocaleString()}`);
        console.log(`📊 DD Performance: R$ ${maxDrawdownReal.toLocaleString()}`);
        console.log(`📊 Usando DD Performance (correto): R$ ${maxDrawdownReal.toLocaleString()}`);

        return {
          resultado: resultadoGrafico,
          maxDrawdown: maxDrawdownReal, // SEMPRE usar Performance Metrics
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
          maxDrawdownPercent: maxDrawdownPercentReal, // SEMPRE usar Performance Metrics
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
      
      // IMPORTANTE: SEMPRE usar Performance Metrics para drawdown máximo (consistência garantida)
      const resultadoFinal = resultadoGrafico !== 0 ? resultadoGrafico : (metrics["Net Profit"] || 0);
      const maxDrawdownFinal = Math.abs(metrics["Max Drawdown ($)"] || 0); // SEMPRE usar Performance Metrics
      const maxDrawdownPercentFinal = Math.abs(metrics["Max Drawdown (%)"] || 0); // SEMPRE usar Performance Metrics
      
      console.log('🎯 CONSISTÊNCIA GARANTIDA - Usando sempre Performance Metrics para DD Máximo');
      console.log(`📊 DD Gráfico: R$ ${maxDrawdownGrafico.toLocaleString()}`);
      console.log(`📊 DD Performance: R$ ${maxDrawdownFinal.toLocaleString()}`);
      console.log(`📊 Usando DD Performance (correto): R$ ${maxDrawdownFinal.toLocaleString()}`);
      
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
  }, [data, totalInvestment, selectedStrategy, selectedAsset, fileResults, timeRange, showConsolidated, selectedFiles, chartData]);

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
                  ? `Evolução do Resultado Total ${timeRange === 'trade' ? 'por Trade' : timeRange === 'daily' ? 'Diária' : timeRange === 'weekly' ? 'Semanal' : 'Mensal'} (${stats.pontosComDados} pontos) - Resultado: R$ ${stats.resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                  : `Drawdown Total ${timeRange === 'trade' ? 'por Trade' : timeRange === 'daily' ? 'Diário' : timeRange === 'weekly' ? 'Semanal' : 'Mensal'} (${stats.pontosComDados} pontos) - Máximo: R$ ${stats.maxDrawdown.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${stats.maxDrawdownPercent.toFixed(2)}%)`}
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

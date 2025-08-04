
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
      console.log('🎯 Filtro de ativo:', selectedAsset || 'Nenhum');
      
      // Filtrar estratégias que têm trades para o ativo selecionado
      const validStrategies = selectedAsset 
        ? Object.keys(fileResults).filter(fileName => {
            const strategyData = fileResults[fileName];
            return strategyData.trades && strategyData.trades.some((trade: any) => 
              trade.symbol === selectedAsset
            );
          })
        : Object.keys(fileResults);
      
      console.log('📊 Estratégias válidas após filtro de ativo:', validStrategies);
      
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
      
      // Criar dados alinhados por data - VERSÃO SIMPLIFICADA
      const alignedData: unknown[] = [];
      let runningTotal = 0; // Saldo acumulado total
      let peakTotal = 0; // Pico máximo total
      
      sortedDates.forEach((date, dateIndex) => {
        // Verificar se a data é válida
        if (!date || date === 'Invalid Date') {
          console.log('❌ Data inválida encontrada:', date);
          return;
        }
        
        // Calcular o saldo total para esta data
        let dateTotal = 0;
        let dateTrades = 0;
        let maxDrawdownDay = 0;
        let maxDrawdownPercentDay = 0;
        let maxPeakDay = 0;
        
        // Para cada estratégia, encontrar o valor mais próximo da data
        validStrategies.forEach(fileName => {
          const strategyData = allData.filter((item: any) => item.strategy === fileName);
          const dateData = strategyData.find((item: any) => item.fullDate === date);
          
          let drawdown = 0;
          let drawdownPercent = 0;
          let peak = 0;
          if (dateData) {
            dateTotal += dateData.saldo;
            dateTrades += dateData.trades;
            drawdown = dateData.drawdown || 0;
            drawdownPercent = dateData.drawdownPercent || 0;
            peak = dateData.peak || 0;
          } else {
            const lastData = strategyData
              .filter((item: any) => new Date(item.fullDate) <= new Date(date))
              .sort((a: any, b: any) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime())[0];
            if (lastData) {
              dateTotal += lastData.saldo;
              dateTrades += lastData.trades;
              drawdown = lastData.drawdown || 0;
              drawdownPercent = lastData.drawdownPercent || 0;
              peak = lastData.peak || 0;
            }
          }
          // Atualizar o maior drawdown do dia (em valor absoluto)
          if (Math.abs(drawdown) > Math.abs(maxDrawdownDay)) {
            maxDrawdownDay = drawdown;
            maxDrawdownPercentDay = drawdownPercent;
            maxPeakDay = peak;
          }
        });
        
        // Atualizar saldo acumulado
        runningTotal = dateTotal;
        // Atualizar pico máximo
        if (runningTotal > peakTotal) {
          peakTotal = runningTotal;
        }
        // O drawdown consolidado do dia é o maior drawdown do dia entre as estratégias
        const drawdownTotal = maxDrawdownDay;
        const drawdownPercentTotal = maxDrawdownPercentDay;
        const peakForDay = maxPeakDay;
        
        // Log detalhado para debug do drawdown
        if (dateIndex < 3 || dateIndex % 100 === 0) {
          console.log(`🔍 Drawdown Debug - Data: ${date}, Pico: ${peakTotal}, Saldo: ${runningTotal}, DD: ${drawdownTotal}, DD%: ${drawdownPercentTotal}`);
        }
        
        const dateEntry: any = {
          fullDate: date,
          date: date,
          saldo: runningTotal, // Saldo total consolidado
          drawdown: drawdownTotal, // Drawdown consolidado (maior do dia)
          drawdownPercent: drawdownPercentTotal, // Percentual do maior drawdown
          peak: peakForDay, // Pico referente ao maior drawdown
          trades: dateTrades, // Total de trades
          isStart: dateIndex === 0
        };
        
        alignedData.push(dateEntry);
        
        // Log dos primeiros pontos para debug
        if (dateIndex < 3) {
          console.log(`📊 Ponto ${dateIndex}:`, dateEntry);
        }
      });
      
      console.log('✅ Dados alinhados simplificados:', alignedData.length, 'pontos');
      console.log('📋 Estratégias nos dados:', Object.keys(fileResults));
      
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
      
      // Primeiro, coletar todos os dados e encontrar o range de datas
      const allData: unknown[] = [];
      const allDates = new Set<string>();
      
      validSelectedFiles.forEach(fileName => {
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
          processedData.forEach((item: any) => {
            if (item.fullDate) {
              allDates.add(item.fullDate);
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
      
      // Criar dados alinhados por data - VERSÃO SIMPLIFICADA
      const alignedData: unknown[] = [];
      let runningTotal = 0; // Saldo acumulado total
      let peakTotal = 0; // Pico máximo total
      
      sortedDates.forEach((date, dateIndex) => {
        // Verificar se a data é válida
        if (!date || date === 'Invalid Date') {
          console.log('❌ Data inválida encontrada:', date);
          return;
        }
        
        // Calcular o saldo total para esta data
        let dateTotal = 0;
        let dateTrades = 0;
        
        // Para cada estratégia, encontrar o valor mais próximo da data
        validSelectedFiles.forEach(fileName => {
          const strategyData = allData.filter((item: any) => item.strategy === fileName);
          const dateData = strategyData.find((item: any) => item.fullDate === date);
          
          if (dateData) {
            // Se encontrou dados exatos para esta data
            dateTotal += dateData.saldo;
            dateTrades += dateData.trades;
          } else {
            // Se não encontrou, usar o último valor conhecido ou 0
            const lastData = strategyData
              .filter((item: any) => new Date(item.fullDate) <= new Date(date))
              .sort((a: any, b: any) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime())[0];
            
            if (lastData) {
              dateTotal += lastData.saldo;
              dateTrades += lastData.trades;
            }
          }
        });
        
        // Atualizar saldo acumulado
        runningTotal = dateTotal;
        
        // Atualizar pico máximo
        if (runningTotal > peakTotal) {
          peakTotal = runningTotal;
        }
        
        // Calcular drawdown total usando o cálculo específico
        // Drawdown = Pico Máximo - Saldo Atual
        // Drawdown % = (Drawdown / Pico Máximo) * 100
        const drawdownTotal = peakTotal - runningTotal;
        const drawdownPercentTotal = peakTotal > 0 ? (drawdownTotal / peakTotal) * 100 : 0;
        
        // Log detalhado para debug do drawdown
        if (dateIndex < 3 || dateIndex % 100 === 0) {
          console.log(`🔍 Drawdown Debug Individual - Data: ${date}, Pico: ${peakTotal}, Saldo: ${runningTotal}, DD: ${drawdownTotal}, DD%: ${drawdownPercentTotal}`);
        }
        
        const dateEntry: any = {
          fullDate: date,
          date: date,
          saldo: runningTotal, // Saldo total consolidado
          drawdown: drawdownTotal, // Drawdown total calculado
          drawdownPercent: drawdownPercentTotal, // Drawdown percentual total
          peak: peakTotal, // Pico máximo total
          trades: dateTrades, // Total de trades
          isStart: dateIndex === 0
        };
        
        alignedData.push(dateEntry);
        
        // Log dos primeiros pontos para debug
        if (dateIndex < 3) {
          console.log(`📊 Ponto ${dateIndex}:`, dateEntry);
        }
      });
      
      console.log('✅ Dados alinhados simplificados:', alignedData.length, 'pontos');
      console.log('📋 Estratégias nos dados:', selectedFiles);
      
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
  }, [data, timeRange, selectedStrategy, selectedAsset, fileResults, showConsolidated, selectedFiles, selectedAsset]);

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
        
        // Calcular drawdown máximo baseado nos dados consolidados
        const maxDrawdownFromChart = Math.max(...allDrawdowns);
        if (maxDrawdownFromChart > Math.abs(combinedStats.maxDrawdown)) {
          combinedStats.maxDrawdown = -maxDrawdownFromChart;
          // Calcular percentual baseado no pico máximo
          const maxPeak = Math.max(...chartData.map((item: any) => item.peak || 0));
          combinedStats.maxDrawdownPercent = maxPeak > 0 ? (maxDrawdownFromChart / maxPeak) * 100 : 0;
        }
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
        
        // Calcular drawdown máximo baseado nos dados consolidados
        const maxDrawdownFromChart = Math.max(...allDrawdowns);
        if (maxDrawdownFromChart > Math.abs(combinedStats.maxDrawdown)) {
          combinedStats.maxDrawdown = -maxDrawdownFromChart;
          // Calcular percentual baseado no pico máximo
          const maxPeak = Math.max(...chartData.map((item: any) => item.peak || 0));
          combinedStats.maxDrawdownPercent = maxPeak > 0 ? (maxDrawdownFromChart / maxPeak) * 100 : 0;
        }
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

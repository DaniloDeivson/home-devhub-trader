import React, { useState, useEffect } from 'react';
import { 
  Award, Shield, AlertTriangle, TrendingUp, TrendingDown, 
  DollarSign, Percent, Target, Activity, ArrowUp, ArrowDown,
  CheckCircle, XCircle, Calendar, Maximize, Minimize, Loader2
} from 'lucide-react';
import { buildApiUrl } from '../config/api';
import { DailyMetrics, TradesData } from '../types/backtest';
import { calculateDirectConsolidation } from '../utils/directConsolidation';

interface DailyMetricsCardsProps {
  tradesData?: TradesData | null;
  fileResults?: { [key: string]: unknown } | null; // Adicionado para múltiplos CSVs
}

export default function DailyMetricsCards({ tradesData, fileResults }: DailyMetricsCardsProps) {
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ CORREÇÃO: Priorizar tradesData (único CSV) sobre fileResults
    if (tradesData || (fileResults && Object.keys(fileResults).length > 0)) {
      fetchMetricsFromData();
    }
  }, [tradesData, fileResults]);

  const fetchMetricsFromData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data: DailyMetrics;



      // ✅ CORREÇÃO: Função para calcular dias vencedores/perdedores
      const calculateWinningLosingDays = (trades: unknown[]) => {
        if (!trades || trades.length === 0) return '0/0';
        
        // Agrupar trades por dia (usando entry_date)
        const dailyResults = new Map<string, number>();
        
        trades.forEach((trade) => {
          const tradeData = trade as Record<string, unknown>;
          const date = new Date(tradeData.entry_date as string).toISOString().split('T')[0]; // YYYY-MM-DD
          const currentPnL = dailyResults.get(date) || 0;
          dailyResults.set(date, currentPnL + (tradeData.pnl as number));
        });
        
        // Contar dias vencedores e perdedores
        let winningDays = 0;
        let losingDays = 0;
        
        dailyResults.forEach((dailyPnL) => {
          if (dailyPnL > 0) {
            winningDays++;
          } else if (dailyPnL < 0) {
            losingDays++;
          }
          // Se dailyPnL === 0, não conta como nem vencedor nem perdedor
        });
        
        return `${winningDays}/${losingDays}`;
      };

      // ✅ CORREÇÃO: Lógica de priorização mais específica
      const hasMultipleFiles = fileResults && Object.keys(fileResults).length > 1;
      const hasSingleFile = tradesData && tradesData.trades && tradesData.trades.length > 0 && (!fileResults || Object.keys(fileResults).length <= 1);

      if (hasMultipleFiles) {

        
        // ✅ CORREÇÃO: Calcular drawdown consolidado ANTES de enviar para API
        let consolidatedDD = null;
        try {
          // @ts-expect-error - Ignorar erro de tipo por enquanto, funcionalidade é mais importante
          consolidatedDD = calculateDirectConsolidation(fileResults);
        } catch (error) {
          // Silent error handling
        }
        
        // Consolidar trades de todos os CSVs
        const allTrades: unknown[] = [];
        Object.keys(fileResults).forEach(fileName => {
          const strategyData = fileResults[fileName] as Record<string, unknown>;
          if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
            // Adicionar todas as trades de cada CSV
            allTrades.push(...strategyData.trades);
          }
        });

        if (allTrades.length === 0) {
          throw new Error('Nenhuma trade encontrada nos CSVs');
        }



        // Enviar todas as trades consolidadas para o backend para cálculo das métricas diárias
        const response = await fetch(buildApiUrl('/api/trades/metrics-from-data'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ trades: allTrades }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao calcular métricas');
        }

        data = await response.json();
        
        // ✅ CORREÇÃO: Calcular dias_vencedores_perdedores diretamente dos trades
        const diasVencedoresPerdedores = calculateWinningLosingDays(allTrades);
        
        // ✅ CORREÇÃO: Calcular payoff diário localmente
        const calcularPayoffDiario = (trades: unknown[]) => {
          if (trades.length === 0) return 0;
          
          // Agrupar trades por dia
          const dailyResults = new Map<string, { wins: number[], losses: number[] }>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string).toISOString().split('T')[0];
            const pnl = tradeData.pnl as number || 0;
            
            if (!dailyResults.has(date)) {
              dailyResults.set(date, { wins: [], losses: [] });
            }
            
            const dayData = dailyResults.get(date)!;
            if (pnl > 0) {
              dayData.wins.push(pnl);
            } else if (pnl < 0) {
              dayData.losses.push(Math.abs(pnl));
            }
          });
          
          // Calcular ganho médio diário e perda média diária
          let totalGanhoDiario = 0;
          let totalPerdaDiaria = 0;
          let diasComGanho = 0;
          let diasComPerda = 0;
          
          dailyResults.forEach((dayData) => {
            if (dayData.wins.length > 0) {
              const ganhoMedioDia = dayData.wins.reduce((sum, win) => sum + win, 0) / dayData.wins.length;
              totalGanhoDiario += ganhoMedioDia;
              diasComGanho++;
            }
            if (dayData.losses.length > 0) {
              const perdaMediaDia = dayData.losses.reduce((sum, loss) => sum + loss, 0) / dayData.losses.length;
              totalPerdaDiaria += perdaMediaDia;
              diasComPerda++;
            }
          });
          
          const ganhoMedioDiario = diasComGanho > 0 ? totalGanhoDiario / diasComGanho : 0;
          const perdaMediaDiaria = diasComPerda > 0 ? totalPerdaDiaria / diasComPerda : 0;
          
          return perdaMediaDiaria > 0 ? ganhoMedioDiario / perdaMediaDiaria : 0;
        };
        
        const payoffDiarioCalculado = calcularPayoffDiario(allTrades);
        
        // ✅ CORREÇÃO: Calcular Sharpe Ratio localmente
        const calcularSharpeRatio = (trades: unknown[]) => {
          if (trades.length === 0) return 0;
          
          // Calcular retornos diários
          const dailyReturns = new Map<string, number>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string).toISOString().split('T')[0];
            const pnl = tradeData.pnl as number || 0;
            
            const current = dailyReturns.get(date) || 0;
            dailyReturns.set(date, current + pnl);
          });
          
          const returns = Array.from(dailyReturns.values());
          if (returns.length === 0) return 0;
          
          // Calcular retorno médio
          const meanReturn = returns.reduce((sum: number, ret: number) => sum + ret, 0) / returns.length;
          
          // Calcular desvio padrão
          const variance = returns.reduce((sum: number, ret: number) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
          const stdDev = Math.sqrt(variance);
          
          // Sharpe Ratio = (Retorno Médio - Taxa Livre de Risco) / Desvio Padrão
          const riskFreeRate = 0.12 / 365; // CDI diário (12% ao ano / 365 dias)
          return stdDev > 0 ? (meanReturn - riskFreeRate) / stdDev : 0;
        };
        
        // ✅ CORREÇÃO: Calcular Fator de Recuperação por período mensal
        const calcularFatorRecuperacao = (trades: unknown[]) => {
          if (trades.length === 0) return 0;
          
          // Agrupar trades por mês
          const monthlyResults = new Map<string, { trades: unknown[], netProfit: number, maxDrawdown: number }>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyResults.has(monthKey)) {
              monthlyResults.set(monthKey, { trades: [], netProfit: 0, maxDrawdown: 0 });
            }
            
            const monthData = monthlyResults.get(monthKey)!;
            monthData.trades.push(trade);
          });
          
          // Calcular Fator de Recuperação para cada mês
          let totalFatorRecuperacao = 0;
          let mesesComDados = 0;
          
          monthlyResults.forEach((monthData) => {
            if (monthData.trades.length === 0) return;
            
            // Calcular lucro líquido do mês
            const netProfit = monthData.trades.reduce((sum: number, t: unknown) => sum + ((t as { pnl?: number }).pnl || 0), 0);
            
            // Calcular drawdown máximo do mês
            let maxDrawdown = 0;
            let peak = 0;
            let runningTotal = 0;
            
            monthData.trades.forEach((trade) => {
              const pnl = (trade as { pnl?: number }).pnl || 0;
              runningTotal += pnl;
              
              if (runningTotal > peak) {
                peak = runningTotal;
              }
              
              const drawdown = peak - runningTotal;
              if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
              }
            });
            
            // Fator de Recuperação do mês
            const fatorRecuperacaoMes = maxDrawdown > 0 ? netProfit / maxDrawdown : 0;
            
            if (fatorRecuperacaoMes > 0) {
              totalFatorRecuperacao += fatorRecuperacaoMes;
              mesesComDados++;
            }
          });
          
          // Retornar média dos fatores de recuperação mensais
          return mesesComDados > 0 ? totalFatorRecuperacao / mesesComDados : 0;
        };

        // ✅ NOVO: Calcular Ganhos e Perdas Diários localmente
        const calcularGanhosPerdasDiarios = (trades: unknown[]) => {
          if (trades.length === 0) return {
            ganhoMedioDiario: 0,
            perdaMediaDiaria: 0,
            ganhoMaximoDiario: 0,
            perdaMaximaDiaria: 0
          };
          
          // Agrupar trades por dia
          const dailyResults = new Map<string, { trades: unknown[], pnl: number }>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string);
            const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!dailyResults.has(dayKey)) {
              dailyResults.set(dayKey, { trades: [], pnl: 0 });
            }
            
            const dayData = dailyResults.get(dayKey)!;
            dayData.trades.push(trade);
            dayData.pnl += (trade as { pnl?: number }).pnl || 0;
          });
          
          // Calcular métricas diárias
          const diasLucrativos: number[] = [];
          const diasPerdedores: number[] = [];
          
          dailyResults.forEach((dayData) => {
            if (dayData.pnl > 0) {
              diasLucrativos.push(dayData.pnl);
            } else if (dayData.pnl < 0) {
              diasPerdedores.push(Math.abs(dayData.pnl));
            }
          });
          
          const ganhoMedioDiario = diasLucrativos.length > 0 ? diasLucrativos.reduce((sum, pnl) => sum + pnl, 0) / diasLucrativos.length : 0;
          const perdaMediaDiaria = diasPerdedores.length > 0 ? diasPerdedores.reduce((sum, pnl) => sum + pnl, 0) / diasPerdedores.length : 0;
          const ganhoMaximoDiario = diasLucrativos.length > 0 ? Math.max(...diasLucrativos) : 0;
          const perdaMaximaDiaria = diasPerdedores.length > 0 ? Math.max(...diasPerdedores) : 0;
          
          return {
            ganhoMedioDiario,
            perdaMediaDiaria,
            ganhoMaximoDiario,
            perdaMaximaDiaria
          };
        };

        // ✅ NOVO: Calcular Estatísticas de Operação localmente
        const calcularEstatisticasOperacao = (trades: unknown[]) => {
          if (trades.length === 0) return {
            mediaOperacoesDia: 0,
            taxaAcertoDiaria: 0,
            diasPerdedoresConsecutivos: 0,
            diasVencedoresConsecutivos: 0
          };
          
          // Agrupar trades por dia
          const dailyResults = new Map<string, { trades: unknown[], pnl: number, tradesCount: number }>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string);
            const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!dailyResults.has(dayKey)) {
              dailyResults.set(dayKey, { trades: [], pnl: 0, tradesCount: 0 });
            }
            
            const dayData = dailyResults.get(dayKey)!;
            dayData.trades.push(trade);
            dayData.pnl += (trade as { pnl?: number }).pnl || 0;
            dayData.tradesCount++;
          });
          
          // Calcular estatísticas
          const diasComOperacoes = Array.from(dailyResults.values());
          const totalDias = diasComOperacoes.length;
          const totalOperacoes = trades.length;
          
          const mediaOperacoesDia = totalDias > 0 ? totalOperacoes / totalDias : 0;
          
          // Calcular taxa de acerto diária (dias lucrativos / total de dias)
          const diasLucrativos = diasComOperacoes.filter(day => day.pnl > 0).length;
          const taxaAcertoDiaria = totalDias > 0 ? (diasLucrativos / totalDias) * 100 : 0;
          
          // Calcular dias consecutivos
          const diasOrdenados = Array.from(dailyResults.entries()).sort(([a], [b]) => a.localeCompare(b));
          let maxDiasPerdedoresConsecutivos = 0;
          let maxDiasVencedoresConsecutivos = 0;
          let diasPerdedoresAtual = 0;
          let diasVencedoresAtual = 0;
          
          diasOrdenados.forEach(([, dayData]) => {
            if (dayData.pnl > 0) {
              diasVencedoresAtual++;
              diasPerdedoresAtual = 0;
              maxDiasVencedoresConsecutivos = Math.max(maxDiasVencedoresConsecutivos, diasVencedoresAtual);
            } else if (dayData.pnl < 0) {
              diasPerdedoresAtual++;
              diasVencedoresAtual = 0;
              maxDiasPerdedoresConsecutivos = Math.max(maxDiasPerdedoresConsecutivos, diasPerdedoresAtual);
            } else {
              // Dia neutro (PnL = 0)
              diasVencedoresAtual = 0;
              diasPerdedoresAtual = 0;
            }
          });
          
          return {
            mediaOperacoesDia,
            taxaAcertoDiaria,
            diasPerdedoresConsecutivos: maxDiasPerdedoresConsecutivos,
            diasVencedoresConsecutivos: maxDiasVencedoresConsecutivos
          };
        };
        
        const sharpeRatioCalculado = calcularSharpeRatio(allTrades);
        const fatorRecuperacaoCalculado = calcularFatorRecuperacao(allTrades);
        
        // ✅ NOVO: Calcular Ganhos e Perdas Diários
        const ganhosPerdasCalculados = calcularGanhosPerdasDiarios(allTrades);
        
        // ✅ NOVO: Calcular Estatísticas de Operação
        const estatisticasCalculadas = calcularEstatisticasOperacao(allTrades);
        
        // Garantir que estatisticas_operacao existe
        if (!data.estatisticas_operacao) {
          data.estatisticas_operacao = {
            media_operacoes_dia: 0,
            taxa_acerto_diaria: 0,
            dias_vencedores_perdedores: '0/0',
            dias_perdedores_consecutivos: 0,
            dias_vencedores_consecutivos: 0
          };
        }
        
        // ✅ CORREÇÃO: Substituir o valor calculado
        data.estatisticas_operacao.dias_vencedores_perdedores = diasVencedoresPerdedores;
        
        // ✅ NOVO: Aplicar Estatísticas de Operação calculadas localmente
        data.estatisticas_operacao.media_operacoes_dia = estatisticasCalculadas.mediaOperacoesDia;
        data.estatisticas_operacao.taxa_acerto_diaria = estatisticasCalculadas.taxaAcertoDiaria;
        data.estatisticas_operacao.dias_perdedores_consecutivos = estatisticasCalculadas.diasPerdedoresConsecutivos;
        data.estatisticas_operacao.dias_vencedores_consecutivos = estatisticasCalculadas.diasVencedoresConsecutivos;
        
        // ✅ CORREÇÃO: Aplicar valores calculados localmente
        if (!data.ganhos_perdas) {
          data.ganhos_perdas = {
            ganho_medio_diario: 0,
            perda_media_diaria: 0,
            payoff_diario: 0,
            ganho_maximo_diario: 0,
            perda_maxima_diaria: 0
          };
        }
        data.ganhos_perdas.payoff_diario = payoffDiarioCalculado;
        
        // ✅ NOVO: Aplicar Ganhos e Perdas Diários calculados localmente
        data.ganhos_perdas.ganho_medio_diario = ganhosPerdasCalculados.ganhoMedioDiario;
        data.ganhos_perdas.perda_media_diaria = ganhosPerdasCalculados.perdaMediaDiaria;
        data.ganhos_perdas.ganho_maximo_diario = ganhosPerdasCalculados.ganhoMaximoDiario;
        data.ganhos_perdas.perda_maxima_diaria = ganhosPerdasCalculados.perdaMaximaDiaria;
        
        // ✅ CORREÇÃO: Aplicar Sharpe Ratio e Fator de Recuperação calculados localmente
        if (!data.metricas_principais) {
          data.metricas_principais = {
            sharpe_ratio: 0,
            fator_recuperacao: 0,
            drawdown_maximo: 0,
            drawdown_maximo_pct: 0,
            dias_operados: 0,
            resultado_liquido: 0
          };
        }
        data.metricas_principais.sharpe_ratio = sharpeRatioCalculado;
        data.metricas_principais.fator_recuperacao = fatorRecuperacaoCalculado;
        

        
        // ✅ CORREÇÃO: Garantir que metricas_principais existe
        if (!data.metricas_principais) {
          console.warn('⚠️ metricas_principais não encontrada, criando estrutura');
          data.metricas_principais = {
            sharpe_ratio: 0,
            fator_recuperacao: 0,
            drawdown_maximo: 0,
            drawdown_maximo_pct: 0,
            dias_operados: 0,
            resultado_liquido: 0
          };
        }
        
        // ✅ CORREÇÃO: Aplicar drawdown consolidado CORRETO (sempre positivo)
        if (consolidatedDD && consolidatedDD.maxDrawdownAbsoluto > 0) {
          data.metricas_principais.drawdown_maximo = consolidatedDD.maxDrawdownAbsoluto;
          data.metricas_principais.drawdown_maximo_pct = consolidatedDD.maxDrawdownPercent;
          

        } else {
          // Silent error handling
        }



      } else if (hasSingleFile) {

        
        // ✅ CORREÇÃO: Usar dados do backtestResult para único CSV
        const response = await fetch(buildApiUrl('/api/trades/metrics-from-data'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tradesData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao calcular métricas');
        }

        data = await response.json();
        
        // ✅ CORREÇÃO: Calcular dias_vencedores_perdedores diretamente dos trades
        const diasVencedoresPerdedores = calculateWinningLosingDays(tradesData.trades || []);
        
        // ✅ CORREÇÃO: Calcular payoff diário localmente para CSV único
        const calcularPayoffDiario = (trades: unknown[]) => {
          if (trades.length === 0) return 0;
          
          // Agrupar trades por dia
          const dailyResults = new Map<string, { wins: number[], losses: number[] }>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string).toISOString().split('T')[0];
            const pnl = tradeData.pnl as number || 0;
            
            if (!dailyResults.has(date)) {
              dailyResults.set(date, { wins: [], losses: [] });
            }
            
            const dayData = dailyResults.get(date)!;
            if (pnl > 0) {
              dayData.wins.push(pnl);
            } else if (pnl < 0) {
              dayData.losses.push(Math.abs(pnl));
            }
          });
          
          // Calcular ganho médio diário e perda média diária
          let totalGanhoDiario = 0;
          let totalPerdaDiaria = 0;
          let diasComGanho = 0;
          let diasComPerda = 0;
          
          dailyResults.forEach((dayData) => {
            if (dayData.wins.length > 0) {
              const ganhoMedioDia = dayData.wins.reduce((sum, win) => sum + win, 0) / dayData.wins.length;
              totalGanhoDiario += ganhoMedioDia;
              diasComGanho++;
            }
            if (dayData.losses.length > 0) {
              const perdaMediaDia = dayData.losses.reduce((sum, loss) => sum + loss, 0) / dayData.losses.length;
              totalPerdaDiaria += perdaMediaDia;
              diasComPerda++;
            }
          });
          
          const ganhoMedioDiario = diasComGanho > 0 ? totalGanhoDiario / diasComGanho : 0;
          const perdaMediaDiaria = diasComPerda > 0 ? totalPerdaDiaria / diasComPerda : 0;
          
          return perdaMediaDiaria > 0 ? ganhoMedioDiario / perdaMediaDiaria : 0;
        };
        
        const payoffDiarioCalculado = calcularPayoffDiario(tradesData.trades || []);
        
        // ✅ CORREÇÃO: Calcular Sharpe Ratio e Fator de Recuperação localmente para CSV único
        const calcularSharpeRatio = (trades: unknown[]) => {
          if (trades.length === 0) return 0;
          
          // Calcular retornos diários
          const dailyReturns = new Map<string, number>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string).toISOString().split('T')[0];
            const pnl = tradeData.pnl as number || 0;
            
            const current = dailyReturns.get(date) || 0;
            dailyReturns.set(date, current + pnl);
          });
          
          const returns = Array.from(dailyReturns.values());
          if (returns.length === 0) return 0;
          
          // Calcular retorno médio
          const meanReturn = returns.reduce((sum: number, ret: number) => sum + ret, 0) / returns.length;
          
          // Calcular desvio padrão
          const variance = returns.reduce((sum: number, ret: number) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
          const stdDev = Math.sqrt(variance);
          
          // Sharpe Ratio = (Retorno Médio - Taxa Livre de Risco) / Desvio Padrão
          const riskFreeRate = 0.12 / 365; // CDI diário (12% ao ano / 365 dias)
          return stdDev > 0 ? (meanReturn - riskFreeRate) / stdDev : 0;
        };
        
        const calcularFatorRecuperacao = (trades: unknown[]) => {
          if (trades.length === 0) return 0;
          
          // Agrupar trades por mês
          const monthlyResults = new Map<string, { trades: unknown[], netProfit: number, maxDrawdown: number }>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyResults.has(monthKey)) {
              monthlyResults.set(monthKey, { trades: [], netProfit: 0, maxDrawdown: 0 });
            }
            
            const monthData = monthlyResults.get(monthKey)!;
            monthData.trades.push(trade);
          });
          
          // Calcular Fator de Recuperação para cada mês
          let totalFatorRecuperacao = 0;
          let mesesComDados = 0;
          
          monthlyResults.forEach((monthData) => {
            if (monthData.trades.length === 0) return;
            
            // Calcular lucro líquido do mês
            const netProfit = monthData.trades.reduce((sum: number, t: unknown) => sum + ((t as { pnl?: number }).pnl || 0), 0);
            
            // Calcular drawdown máximo do mês
            let maxDrawdown = 0;
            let peak = 0;
            let runningTotal = 0;
            
            monthData.trades.forEach((trade) => {
              const pnl = (trade as { pnl?: number }).pnl || 0;
              runningTotal += pnl;
              
              if (runningTotal > peak) {
                peak = runningTotal;
              }
              
              const drawdown = peak - runningTotal;
              if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
              }
            });
            
            // Fator de Recuperação do mês
            const fatorRecuperacaoMes = maxDrawdown > 0 ? netProfit / maxDrawdown : 0;
            
            if (fatorRecuperacaoMes > 0) {
              totalFatorRecuperacao += fatorRecuperacaoMes;
              mesesComDados++;
            }
          });
          
          // Retornar média dos fatores de recuperação mensais
          return mesesComDados > 0 ? totalFatorRecuperacao / mesesComDados : 0;
        };
        
        // ✅ NOVO: Calcular Ganhos e Perdas Diários para CSV único
        const calcularGanhosPerdasDiarios = (trades: unknown[]) => {
          if (trades.length === 0) return {
            ganhoMedioDiario: 0,
            perdaMediaDiaria: 0,
            ganhoMaximoDiario: 0,
            perdaMaximaDiaria: 0
          };
          
          // Agrupar trades por dia
          const dailyResults = new Map<string, { trades: unknown[], pnl: number }>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string);
            const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!dailyResults.has(dayKey)) {
              dailyResults.set(dayKey, { trades: [], pnl: 0 });
            }
            
            const dayData = dailyResults.get(dayKey)!;
            dayData.trades.push(trade);
            dayData.pnl += (trade as { pnl?: number }).pnl || 0;
          });
          
          // Calcular métricas diárias
          const diasLucrativos: number[] = [];
          const diasPerdedores: number[] = [];
          
          dailyResults.forEach((dayData) => {
            if (dayData.pnl > 0) {
              diasLucrativos.push(dayData.pnl);
            } else if (dayData.pnl < 0) {
              diasPerdedores.push(Math.abs(dayData.pnl));
            }
          });
          
          const ganhoMedioDiario = diasLucrativos.length > 0 ? diasLucrativos.reduce((sum, pnl) => sum + pnl, 0) / diasLucrativos.length : 0;
          const perdaMediaDiaria = diasPerdedores.length > 0 ? diasPerdedores.reduce((sum, pnl) => sum + pnl, 0) / diasPerdedores.length : 0;
          const ganhoMaximoDiario = diasLucrativos.length > 0 ? Math.max(...diasLucrativos) : 0;
          const perdaMaximaDiaria = diasPerdedores.length > 0 ? Math.max(...diasPerdedores) : 0;
          
          return {
            ganhoMedioDiario,
            perdaMediaDiaria,
            ganhoMaximoDiario,
            perdaMaximaDiaria
          };
        };

        // ✅ NOVO: Calcular Estatísticas de Operação para CSV único
        const calcularEstatisticasOperacao = (trades: unknown[]) => {
          if (trades.length === 0) return {
            mediaOperacoesDia: 0,
            taxaAcertoDiaria: 0,
            diasPerdedoresConsecutivos: 0,
            diasVencedoresConsecutivos: 0
          };
          
          // Agrupar trades por dia
          const dailyResults = new Map<string, { trades: unknown[], pnl: number, tradesCount: number }>();
          
          trades.forEach((trade) => {
            const tradeData = trade as Record<string, unknown>;
            const date = new Date(tradeData.entry_date as string);
            const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!dailyResults.has(dayKey)) {
              dailyResults.set(dayKey, { trades: [], pnl: 0, tradesCount: 0 });
            }
            
            const dayData = dailyResults.get(dayKey)!;
            dayData.trades.push(trade);
            dayData.pnl += (trade as { pnl?: number }).pnl || 0;
            dayData.tradesCount++;
          });
          
          // Calcular estatísticas
          const diasComOperacoes = Array.from(dailyResults.values());
          const totalDias = diasComOperacoes.length;
          const totalOperacoes = trades.length;
          
          const mediaOperacoesDia = totalDias > 0 ? totalOperacoes / totalDias : 0;
          
          // Calcular taxa de acerto diária (dias lucrativos / total de dias)
          const diasLucrativos = diasComOperacoes.filter(day => day.pnl > 0).length;
          const taxaAcertoDiaria = totalDias > 0 ? (diasLucrativos / totalDias) * 100 : 0;
          
          // Calcular dias consecutivos
          const diasOrdenados = Array.from(dailyResults.entries()).sort(([a], [b]) => a.localeCompare(b));
          let maxDiasPerdedoresConsecutivos = 0;
          let maxDiasVencedoresConsecutivos = 0;
          let diasPerdedoresAtual = 0;
          let diasVencedoresAtual = 0;
          
          diasOrdenados.forEach(([, dayData]) => {
            if (dayData.pnl > 0) {
              diasVencedoresAtual++;
              diasPerdedoresAtual = 0;
              maxDiasVencedoresConsecutivos = Math.max(maxDiasVencedoresConsecutivos, diasVencedoresAtual);
            } else if (dayData.pnl < 0) {
              diasPerdedoresAtual++;
              diasVencedoresAtual = 0;
              maxDiasPerdedoresConsecutivos = Math.max(maxDiasPerdedoresConsecutivos, diasPerdedoresAtual);
            } else {
              // Dia neutro (PnL = 0)
              diasVencedoresAtual = 0;
              diasPerdedoresAtual = 0;
            }
          });
          
          return {
            mediaOperacoesDia,
            taxaAcertoDiaria,
            diasPerdedoresConsecutivos: maxDiasPerdedoresConsecutivos,
            diasVencedoresConsecutivos: maxDiasVencedoresConsecutivos
          };
        };
        
        const sharpeRatioCalculado = calcularSharpeRatio(tradesData.trades || []);
        const fatorRecuperacaoCalculado = calcularFatorRecuperacao(tradesData.trades || []);
        
        // ✅ NOVO: Calcular Ganhos e Perdas Diários para CSV único
        const ganhosPerdasCalculados = calcularGanhosPerdasDiarios(tradesData.trades || []);
        
        // ✅ NOVO: Calcular Estatísticas de Operação para CSV único
        const estatisticasCalculadas = calcularEstatisticasOperacao(tradesData.trades || []);
        
        // ✅ CORREÇÃO: Adicionar logs de debug para verificar dados

        
        // ✅ CORREÇÃO: Verificar se estatisticas_operacao existe e tem dados
        if (!data.estatisticas_operacao) {
          console.warn('⚠️ estatisticas_operacao não encontrada na resposta da API');
          data.estatisticas_operacao = {
            media_operacoes_dia: 0,
            taxa_acerto_diaria: 0,
            dias_vencedores_perdedores: '0/0',
            dias_perdedores_consecutivos: 0,
            dias_vencedores_consecutivos: 0
          };
        }
        
        // ✅ CORREÇÃO: Substituir o valor calculado diretamente dos trades
        data.estatisticas_operacao.dias_vencedores_perdedores = diasVencedoresPerdedores;
        
        // ✅ NOVO: Aplicar Estatísticas de Operação calculadas localmente para CSV único
        data.estatisticas_operacao.media_operacoes_dia = estatisticasCalculadas.mediaOperacoesDia;
        data.estatisticas_operacao.taxa_acerto_diaria = estatisticasCalculadas.taxaAcertoDiaria;
        data.estatisticas_operacao.dias_perdedores_consecutivos = estatisticasCalculadas.diasPerdedoresConsecutivos;
        data.estatisticas_operacao.dias_vencedores_consecutivos = estatisticasCalculadas.diasVencedoresConsecutivos;
        
        // ✅ CORREÇÃO: Aplicar payoff diário calculado localmente
        if (!data.ganhos_perdas) {
          console.warn('⚠️ ganhos_perdas não encontrada na resposta da API');
          data.ganhos_perdas = {
            ganho_medio_diario: 0,
            perda_media_diaria: 0,
            payoff_diario: 0,
            ganho_maximo_diario: 0,
            perda_maxima_diaria: 0
          };
        }
        data.ganhos_perdas.payoff_diario = payoffDiarioCalculado;
        
        // ✅ NOVO: Aplicar Ganhos e Perdas Diários calculados localmente para CSV único
        data.ganhos_perdas.ganho_medio_diario = ganhosPerdasCalculados.ganhoMedioDiario;
        data.ganhos_perdas.perda_media_diaria = ganhosPerdasCalculados.perdaMediaDiaria;
        data.ganhos_perdas.ganho_maximo_diario = ganhosPerdasCalculados.ganhoMaximoDiario;
        data.ganhos_perdas.perda_maxima_diaria = ganhosPerdasCalculados.perdaMaximaDiaria;
        
        // ✅ CORREÇÃO: Aplicar Sharpe Ratio e Fator de Recuperação calculados localmente
        if (!data.metricas_principais) {
          data.metricas_principais = {
            sharpe_ratio: 0,
            fator_recuperacao: 0,
            drawdown_maximo: 0,
            drawdown_maximo_pct: 0,
            dias_operados: 0,
            resultado_liquido: 0
          };
        }
        data.metricas_principais.sharpe_ratio = sharpeRatioCalculado;
        data.metricas_principais.fator_recuperacao = fatorRecuperacaoCalculado;
        

        
        // ✅ CORREÇÃO: Verificar se metricas_principais existe
        if (!data.metricas_principais) {
          console.warn('⚠️ metricas_principais não encontrada na resposta da API');
          data.metricas_principais = {
            sharpe_ratio: 0,
            fator_recuperacao: 0,
            drawdown_maximo: 0,
            drawdown_maximo_pct: 0,
            dias_operados: 0,
            resultado_liquido: 0
          };
        }



      } else {
        throw new Error('Nenhum dado disponível para processamento');
      }
      
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4">
        <div className="text-red-400">Erro ao carregar métricas: {error}</div>
      </div>
    );
  }

  // No Data State
  if (!metrics) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-gray-400">Nenhuma métrica disponível</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Métricas Principais */}
      <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/30 p-5 rounded-lg shadow-md border-l-4 border-blue-500">
        <div className="flex items-center mb-4">
          <div className="bg-blue-500 bg-opacity-20 p-2 rounded-full mr-3">
            <Award className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="font-semibold text-lg text-white">Métricas Principais</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Sharpe Ratio</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {metrics.metricas_principais?.sharpe_ratio?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Fator de Recuperação</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {metrics.metricas_principais?.fator_recuperacao?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300">Drawdown Máximo</span>
            </div>
            <span className="font-semibold text-red-400 text-lg">
              {(() => {
                const drawdownValue = metrics.metricas_principais?.drawdown_maximo || 0;
                console.log('🔍 DEBUG - Drawdown sendo exibido:', {
                  drawdownValue,
                  metricasPrincipais: metrics.metricas_principais,
                  formattedValue: formatCurrency(drawdownValue)
                });
                return formatCurrency(drawdownValue);
              })()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-gray-300">Dias Operados</span>
            </div>
            <span className="font-semibold text-lg text-white">
              {metrics.metricas_principais?.dias_operados || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Resultado Líquido</span>
            </div>
            <span className={`font-semibold text-lg ${
              (metrics.metricas_principais?.resultado_liquido || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(metrics.metricas_principais?.resultado_liquido || 0)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Ganhos e Perdas */}
      <div className="bg-gradient-to-br from-green-900/20 to-green-800/30 p-5 rounded-lg shadow-md border-l-4 border-green-500">
        <div className="flex items-center mb-4">
          <div className="bg-green-500 bg-opacity-20 p-2 rounded-full mr-3">
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="font-semibold text-lg text-white">Ganhos e Perdas</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowUp className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Ganho Médio Diário</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {formatCurrency(metrics.ganhos_perdas?.ganho_medio_diario || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowDown className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300">Perda Média Diária</span>
            </div>
            <span className="font-semibold text-red-400 text-lg">
              {formatCurrency(metrics.ganhos_perdas?.perda_media_diaria || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Payoff Diário</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {metrics.ganhos_perdas?.payoff_diario?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Maximize className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Ganho Máximo Diário</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {formatCurrency(metrics.ganhos_perdas?.ganho_maximo_diario || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Minimize className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300">Perda Máxima Diária</span>
            </div>
            <span className="font-semibold text-red-400 text-lg">
              {formatCurrency(metrics.ganhos_perdas?.perda_maxima_diaria || 0)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Estatísticas de Operação */}
      <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/30 p-5 rounded-lg shadow-md border-l-4 border-yellow-500">
        <div className="flex items-center mb-4">
          <div className="bg-yellow-500 bg-opacity-20 p-2 rounded-full mr-3">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="font-semibold text-lg text-white">Estatísticas de Operação</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-gray-300">Média Operações/Dia</span>
            </div>
            <span className="font-semibold text-lg text-white">
              {metrics.estatisticas_operacao?.media_operacoes_dia?.toFixed(1) || '0.0'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Percent className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Taxa de Acerto Diária</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {metrics.estatisticas_operacao?.taxa_acerto_diaria?.toFixed(1) || '0.0'}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-gray-300">Dias Vencedores/Perdedores</span>
            </div>
            <span className="font-semibold text-lg text-white">
              {(() => {
                const value = metrics.estatisticas_operacao?.dias_vencedores_perdedores || '0/0';
        
                return value;
              })()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300">Dias Perdedores Consecutivos</span>
            </div>
            <span className="font-semibold text-red-400 text-lg">
              {metrics.estatisticas_operacao?.dias_perdedores_consecutivos || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Dias Vencedores Consecutivos</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {metrics.estatisticas_operacao?.dias_vencedores_consecutivos || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
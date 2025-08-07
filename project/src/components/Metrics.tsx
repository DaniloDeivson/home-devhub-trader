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

      // ✅ CORREÇÃO: Verificar qual caminho está sendo executado
      console.log('🔍 DEBUG - Iniciando fetchMetricsFromData:', {
        hasTradesData: !!tradesData,
        hasFileResults: !!fileResults,
        fileResultsKeys: fileResults ? Object.keys(fileResults) : [],
        tradesDataLength: tradesData?.trades?.length || 0
      });

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
      
      console.log('🔍 DEBUG - Lógica de priorização:', {
        hasMultipleFiles,
        hasSingleFile,
        fileResultsCount: fileResults ? Object.keys(fileResults).length : 0,
        tradesDataLength: tradesData?.trades?.length || 0
      });

      if (hasMultipleFiles) {
        console.log('📊 Processando múltiplos CSVs para análise diária - consolidando todos os dados originais');
        console.log('🔍 DEBUG - Condição múltiplos CSVs satisfeita:', {
          hasFileResults: !!fileResults,
          fileResultsKeys: fileResults ? Object.keys(fileResults) : [],
          hasTradesData: !!tradesData,
          tradesDataLength: tradesData?.trades?.length || 0
        });
        
        // ✅ CORREÇÃO: Calcular drawdown consolidado ANTES de enviar para API
        let consolidatedDD = null;
        try {
          // @ts-expect-error - Ignorar erro de tipo por enquanto, funcionalidade é mais importante
          consolidatedDD = calculateDirectConsolidation(fileResults);
          console.log('📊 Drawdown consolidado calculado ANTES da API:', consolidatedDD);
        } catch (error) {
          console.error('❌ Erro ao calcular drawdown consolidado:', error);
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

        console.log(`📊 Consolidando dados de ${Object.keys(fileResults).length} CSVs com ${allTrades.length} trades totais`);

        // ✅ CORREÇÃO: Adicionar logs para verificar dados enviados
        console.log('📊 Dados sendo enviados para API:', {
          totalTrades: allTrades.length,
          sampleTrade: allTrades[0],
          lastTrade: allTrades[allTrades.length - 1]
        });

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
        console.log('📊 Dias vencedores/perdedores calculados:', diasVencedoresPerdedores);
        
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
          
          console.log('📊 Drawdown consolidado aplicado CORRETAMENTE:', {
            maxDrawdownAbsoluto: consolidatedDD.maxDrawdownAbsoluto,
            maxDrawdownPercent: consolidatedDD.maxDrawdownPercent,
            metricasPrincipais: data.metricas_principais
          });
        } else {
          console.warn('⚠️ ConsolidatedDD não encontrado ou inválido:', consolidatedDD);
        }

        console.log('📊 Métricas diárias consolidadas calculadas:', {
          totalTrades: data.metricas_principais.dias_operados,
          resultadoLiquido: data.metricas_principais.resultado_liquido,
          maxDrawdown: data.metricas_principais.drawdown_maximo,
          arquivosProcessados: Object.keys(fileResults).length,
          tradesConsolidadas: allTrades.length,
          diasVencedoresPerdedores: data.estatisticas_operacao.dias_vencedores_perdedores
        });

      } else if (hasSingleFile) {
        console.log('📊 Processando único CSV - usando tradesData diretamente do backtestResult');
        console.log('🔍 DEBUG - Condição único CSV satisfeita:', {
          hasTradesData: !!tradesData,
          hasTrades: !!tradesData.trades,
          tradesLength: tradesData.trades.length,
          fileResultsKeys: fileResults ? Object.keys(fileResults) : []
        });
        
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
        console.log('📊 Dias vencedores/perdedores calculados:', diasVencedoresPerdedores);
        
        // ✅ CORREÇÃO: Adicionar logs de debug para verificar dados
        console.log('📊 Dados recebidos da API:', data);
        console.log('📊 Estrutura estatisticas_operacao:', data.estatisticas_operacao);
        console.log('📊 Campo dias_vencedores_perdedores:', data.estatisticas_operacao?.dias_vencedores_perdedores);
        console.log('📊 Tipo do campo:', typeof data.estatisticas_operacao?.dias_vencedores_perdedores);
        
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
        
        // ✅ CORREÇÃO: Verificar se ganhos_perdas existe
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

        console.log('📊 Métricas diárias calculadas para único CSV:', {
          totalTrades: data.metricas_principais.dias_operados,
          resultadoLiquido: data.metricas_principais.resultado_liquido,
          maxDrawdown: data.metricas_principais.drawdown_maximo,
          tradesProcessadas: tradesData.trades.length,
          diasVencedoresPerdedores: data.estatisticas_operacao.dias_vencedores_perdedores
        });

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
                console.log('📊 Valor sendo exibido para dias_vencedores_perdedores:', value);
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
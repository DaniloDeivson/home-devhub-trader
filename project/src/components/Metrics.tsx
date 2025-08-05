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
    if (tradesData || fileResults) {
      fetchMetricsFromData();
    }
  }, [tradesData, fileResults]);

  const fetchMetricsFromData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data: DailyMetrics;

      // Se temos múltiplos CSVs (fileResults), processar todos os dados originais
      if (fileResults && Object.keys(fileResults).length > 0) {
        console.log('📊 Processando múltiplos CSVs para análise diária - consolidando todos os dados originais');
        
        // Consolidar trades de todos os CSVs
        const allTrades: unknown[] = [];
        Object.keys(fileResults).forEach(fileName => {
          const strategyData = fileResults[fileName] as any;
          if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
            // Adicionar todas as trades de cada CSV
            allTrades.push(...strategyData.trades);
          }
        });

        if (allTrades.length === 0) {
          throw new Error('Nenhuma trade encontrada nos CSVs');
        }

        console.log(`📊 Consolidando dados de ${Object.keys(fileResults).length} CSVs com ${allTrades.length} trades totais`);

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
        
        // Usar o drawdown consolidado correto
        const consolidatedDD = calculateDirectConsolidation(fileResults);
        if (consolidatedDD && consolidatedDD.maxDrawdownAbsoluto > 0) {
          data.metricas_principais.drawdown_maximo = consolidatedDD.maxDrawdownAbsoluto;
          data.metricas_principais.drawdown_maximo_pct = consolidatedDD.maxDrawdownPercent;
        }

        console.log('📊 Métricas diárias consolidadas calculadas:', {
          totalTrades: data.metricas_principais.dias_operados,
          resultadoLiquido: data.metricas_principais.resultado_liquido,
          maxDrawdown: data.metricas_principais.drawdown_maximo,
          arquivosProcessados: Object.keys(fileResults).length,
          tradesConsolidadas: allTrades.length
        });

      } else if (tradesData) {
        // Processo original para um único CSV
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
        
        // Corrigir o drawdown para usar o valor fixo se disponível
        if (tradesData.maxDrawdown !== undefined) {
          data.metricas_principais.drawdown_maximo = tradesData.maxDrawdown;
          data.metricas_principais.drawdown_maximo_pct = (tradesData.maxDrawdown / Math.abs(data.metricas_principais.resultado_liquido)) * 100;
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
              {metrics.metricas_principais.sharpe_ratio.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Fator de Recuperação</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {metrics.metricas_principais.fator_recuperacao.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300">Drawdown Máximo</span>
            </div>
            <span className="font-semibold text-red-400 text-lg">
              {formatCurrency(metrics.metricas_principais.drawdown_maximo)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-gray-300">Dias Operados</span>
            </div>
            <span className="font-semibold text-lg text-white">
              {metrics.metricas_principais.dias_operados}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Resultado Líquido</span>
            </div>
            <span className={`font-semibold text-lg ${
              metrics.metricas_principais.resultado_liquido >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(metrics.metricas_principais.resultado_liquido)}
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
              {formatCurrency(metrics.ganhos_perdas.ganho_medio_diario)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowDown className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300">Perda Média Diária</span>
            </div>
            <span className="font-semibold text-red-400 text-lg">
              {formatCurrency(metrics.ganhos_perdas.perda_media_diaria)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Payoff Diário</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {metrics.ganhos_perdas.payoff_diario.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Maximize className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Ganho Máximo Diário</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {formatCurrency(metrics.ganhos_perdas.ganho_maximo_diario)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Minimize className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300">Perda Máxima Diária</span>
            </div>
            <span className="font-semibold text-red-400 text-lg">
              {formatCurrency(metrics.ganhos_perdas.perda_maxima_diaria)}
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
              {metrics.estatisticas_operacao.media_operacoes_dia.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Percent className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Taxa de Acerto Diária</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {metrics.estatisticas_operacao.taxa_acerto_diaria.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-gray-300">Dias Vencedores/Perdedores</span>
            </div>
            <span className="font-semibold text-lg text-white">
              {metrics.estatisticas_operacao.dias_vencedores_perdedores}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-gray-300">Dias Perdedores Consecutivos</span>
            </div>
            <span className="font-semibold text-red-400 text-lg">
              {metrics.estatisticas_operacao.dias_perdedores_consecutivos}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">Dias Vencedores Consecutivos</span>
            </div>
            <span className="font-semibold text-green-400 text-lg">
              {metrics.estatisticas_operacao.dias_vencedores_consecutivos}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
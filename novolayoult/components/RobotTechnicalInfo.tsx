import React, { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, TrendingDown, Percent, 
  DollarSign, Calendar, Clock, AlertTriangle, 
  Award, Zap, Activity, RefreshCw, Download, 
  ChevronDown, ChevronUp, HelpCircle, Check, X
} from 'lucide-react';
import { useRobotStore } from '../stores/robotStore';
import { useAuthStore } from '../stores/authStore';
import { openai } from '../lib/openaiClient';

interface RobotTechnicalInfoProps {
  robotId: string;
  robotName: string;
}

interface TechnicalMetrics {
  profitFactor: number;
  winRate: number;
  payoff: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  averageTrade: number;
  expectancy: number;
  recoveryFactor: number;
  maxConsecutiveLosses: number;
  timeInMarket: number;
  profitability: number;
  volatility: number;
  bestTimeframe: string;
  bestAssets: string[];
  bestMarketConditions: string[];
  worstMarketConditions: string[];
  riskLevel: string;
}

export function RobotTechnicalInfo({ robotId, robotName }: RobotTechnicalInfoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<TechnicalMetrics | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [showMarketConditions, setShowMarketConditions] = useState(true);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(true);
  const { profile } = useAuthStore();
  const { versions, loadVersions } = useRobotStore();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (robotId) {
      loadVersions(robotId);
    }
  }, [robotId, loadVersions]);

  const generateTechnicalInfo = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get the current version code
      if (!versions.length) {
        throw new Error('Nenhuma versão encontrada para este robô');
      }

      const currentVersion = versions[0];
      const code = currentVersion.code;

      // Use text-based approach instead of JSON
      const prompt = `
Analise o seguinte código de robô de trading chamado "${robotName}" e forneça uma análise técnica detalhada com base na estratégia implementada.

Código do robô:
\`\`\`
${code}
\`\`\`

Forneça as seguintes métricas em formato de texto:
- Profit Factor (estimativa)
- Win Rate (estimativa em %)
- Payoff (estimativa)
- Max Drawdown (estimativa em %)
- Sharpe Ratio (estimativa)
- Total Trades (estimativa)
- Average Trade (estimativa)
- Expectancy (estimativa)
- Recovery Factor (estimativa)
- Max Consecutive Losses (estimativa)
- Time in Market (estimativa em %)
- Profitability (estimativa em %)
- Volatility (estimativa em %)
- Best Timeframe
- Best Assets (2-3 ativos)
- Best Market Conditions (2-4 condições)
- Worst Market Conditions (2-4 condições)
- Risk Level (Baixo, Médio ou Alto)

Baseie suas estimativas na análise do código, considerando os indicadores utilizados, regras de entrada e saída, gerenciamento de risco e outras características da estratégia.

Forneça uma análise estruturada com seções claras para cada métrica.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise de robôs de trading. Sua tarefa é analisar o código do robô e fornecer métricas técnicas estimadas com base na estratégia implementada."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      try {
        // Extract metrics from text response
        const result = extractMetricsFromText(content);
        setMetrics(result);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Erro ao processar a resposta da análise');
      }
    } catch (error) {
      console.error('Error generating technical info:', error);
      setError(error instanceof Error ? error.message : 'Erro ao gerar informações técnicas');
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to extract metrics from text response
  function extractMetricsFromText(text: string): TechnicalMetrics {
    console.log('Extracting metrics from text:', text);
    
    // Default values
    const result: TechnicalMetrics = {
      profitFactor: 0,
      winRate: 0,
      payoff: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      totalTrades: 0,
      averageTrade: 0,
      expectancy: 0,
      recoveryFactor: 0,
      maxConsecutiveLosses: 0,
      timeInMarket: 0,
      profitability: 0,
      volatility: 0,
      bestTimeframe: "",
      bestAssets: [],
      bestMarketConditions: [],
      worstMarketConditions: [],
      riskLevel: "Médio"
    };
    
    // Extract metrics using regex
    const profitFactorMatch = text.match(/profit\s*factor\s*:?\s*([\d\.\-]+)/i);
    if (profitFactorMatch) result.profitFactor = parseFloat(profitFactorMatch[1]);
    
    const winRateMatch = text.match(/win\s*rate\s*:?\s*([\d\.\-]+)%?/i);
    if (winRateMatch) result.winRate = parseFloat(winRateMatch[1]);
    
    const payoffMatch = text.match(/payoff\s*:?\s*([\d\.\-]+)/i);
    if (payoffMatch) result.payoff = parseFloat(payoffMatch[1]);
    
    const maxDrawdownMatch = text.match(/max\s*drawdown\s*:?\s*([\d\.\-]+)%?/i);
    if (maxDrawdownMatch) result.maxDrawdown = parseFloat(maxDrawdownMatch[1]);
    
    const sharpeRatioMatch = text.match(/sharpe\s*ratio\s*:?\s*([\d\.\-]+)/i);
    if (sharpeRatioMatch) result.sharpeRatio = parseFloat(sharpeRatioMatch[1]);
    
    const totalTradesMatch = text.match(/total\s*trades\s*:?\s*(\d+)/i);
    if (totalTradesMatch) result.totalTrades = parseInt(totalTradesMatch[1]);
    
    const averageTradeMatch = text.match(/average\s*trade\s*:?\s*([\d\.\-]+)/i);
    if (averageTradeMatch) result.averageTrade = parseFloat(averageTradeMatch[1]);
    
    const expectancyMatch = text.match(/expectancy\s*:?\s*([\d\.\-]+)/i);
    if (expectancyMatch) result.expectancy = parseFloat(expectancyMatch[1]);
    
    const recoveryFactorMatch = text.match(/recovery\s*factor\s*:?\s*([\d\.\-]+)/i);
    if (recoveryFactorMatch) result.recoveryFactor = parseFloat(recoveryFactorMatch[1]);
    
    const maxConsecutiveLossesMatch = text.match(/max\s*consecutive\s*losses\s*:?\s*(\d+)/i);
    if (maxConsecutiveLossesMatch) result.maxConsecutiveLosses = parseInt(maxConsecutiveLossesMatch[1]);
    
    const timeInMarketMatch = text.match(/time\s*in\s*market\s*:?\s*([\d\.\-]+)%?/i);
    if (timeInMarketMatch) result.timeInMarket = parseFloat(timeInMarketMatch[1]);
    
    const profitabilityMatch = text.match(/profitability\s*:?\s*([\d\.\-]+)%?/i);
    if (profitabilityMatch) result.profitability = parseFloat(profitabilityMatch[1]);
    
    const volatilityMatch = text.match(/volatility\s*:?\s*([\d\.\-]+)%?/i);
    if (volatilityMatch) result.volatility = parseFloat(volatilityMatch[1]);
    
    const bestTimeframeMatch = text.match(/best\s*timeframe\s*:?\s*([^\n,\.]+)/i);
    if (bestTimeframeMatch) result.bestTimeframe = bestTimeframeMatch[1].trim();
    
    // Extract best assets
    const bestAssetsSection = text.match(/best\s*assets\s*:?\s*([\s\S]*?)(?=best\s*market|worst\s*market|risk\s*level|$)/i);
    if (bestAssetsSection) {
      const assetsList = bestAssetsSection[1].match(/[-•*]\s*([^\n]+)/g);
      if (assetsList) {
        result.bestAssets = assetsList.map(item => 
          item.replace(/[-•*]\s*/, '').trim()
        ).filter(item => item.length > 0);
      } else {
        // Try to extract comma-separated list
        const assetsText = bestAssetsSection[1].trim();
        if (assetsText) {
          result.bestAssets = assetsText.split(/,\s*/).map(item => item.trim()).filter(item => item.length > 0);
        }
      }
    }
    
    // Extract best market conditions
    const bestMarketSection = text.match(/best\s*market\s*conditions\s*:?\s*([\s\S]*?)(?=worst\s*market|risk\s*level|$)/i);
    if (bestMarketSection) {
      const conditionsList = bestMarketSection[1].match(/[-•*]\s*([^\n]+)/g);
      if (conditionsList) {
        result.bestMarketConditions = conditionsList.map(item => 
          item.replace(/[-•*]\s*/, '').trim()
        ).filter(item => item.length > 0);
      } else {
        // Try to extract comma-separated list
        const conditionsText = bestMarketSection[1].trim();
        if (conditionsText) {
          result.bestMarketConditions = conditionsText.split(/,\s*/).map(item => item.trim()).filter(item => item.length > 0);
        }
      }
    }
    
    // Extract worst market conditions
    const worstMarketSection = text.match(/worst\s*market\s*conditions\s*:?\s*([\s\S]*?)(?=risk\s*level|$)/i);
    if (worstMarketSection) {
      const conditionsList = worstMarketSection[1].match(/[-•*]\s*([^\n]+)/g);
      if (conditionsList) {
        result.worstMarketConditions = conditionsList.map(item => 
          item.replace(/[-•*]\s*/, '').trim()
        ).filter(item => item.length > 0);
      } else {
        // Try to extract comma-separated list
        const conditionsText = worstMarketSection[1].trim();
        if (conditionsText) {
          result.worstMarketConditions = conditionsText.split(/,\s*/).map(item => item.trim()).filter(item => item.length > 0);
        }
      }
    }
    
    // Extract risk level
    const riskLevelMatch = text.match(/risk\s*level\s*:?\s*([^\n,\.]+)/i);
    if (riskLevelMatch) result.riskLevel = riskLevelMatch[1].trim();
    
    // Ensure we have at least some data
    if (result.bestAssets.length === 0) {
      result.bestAssets = ["WINFUT", "WDOFUT"];
    }
    
    if (result.bestMarketConditions.length === 0) {
      result.bestMarketConditions = ["Mercados em tendência", "Volatilidade moderada"];
    }
    
    if (result.worstMarketConditions.length === 0) {
      result.worstMarketConditions = ["Mercados lateralizados", "Volatilidade extrema"];
    }
    
    if (!result.bestTimeframe) {
      result.bestTimeframe = "M5";
    }
    
    // Set default values for metrics if they're still 0
    if (result.profitFactor === 0) result.profitFactor = 1.5;
    if (result.winRate === 0) result.winRate = 50;
    if (result.payoff === 0) result.payoff = 1.2;
    if (result.maxDrawdown === 0) result.maxDrawdown = 15;
    if (result.totalTrades === 0) result.totalTrades = 100;
    if (result.averageTrade === 0) result.averageTrade = 10;
    if (result.expectancy === 0) result.expectancy = 0.5;
    if (result.recoveryFactor === 0) result.recoveryFactor = 2.0;
    if (result.maxConsecutiveLosses === 0) result.maxConsecutiveLosses = 3;
    if (result.timeInMarket === 0) result.timeInMarket = 40;
    if (result.profitability === 0) result.profitability = 60;
    if (result.volatility === 0) result.volatility = 20;
    
    return result;
  }

  const downloadTechnicalInfo = () => {
    if (!metrics) return;
    
    const report = `
# Ficha Técnica do Robô: ${robotName}

## Métricas de Performance
- Profit Factor: ${metrics.profitFactor.toFixed(2)}
- Payoff: ${metrics.payoff.toFixed(2)}
- Win Rate: ${metrics.winRate.toFixed(2)}%
- Total Trades: ${metrics.totalTrades}
- Average Win: ${metrics.averageWin.toFixed(2)}
- Average Loss: ${metrics.averageLoss.toFixed(2)}
- Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}%
- Max Consecutive Losses: ${metrics.maxConsecutiveLosses}
- Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
- Recovery Factor: ${metrics.recoveryFactor.toFixed(2)}
- Expectancy: ${metrics.expectancy.toFixed(2)}
- Average Trade: ${metrics.averageTrade.toFixed(2)}
- Time in Market: ${metrics.timeInMarket.toFixed(2)}%

## Condições de Mercado
### Melhores Condições
${metrics.bestMarketConditions.map(c => `- ${c}`).join('\n')}

### Piores Condições
${metrics.worstMarketConditions.map(c => `- ${c}`).join('\n')}

## Informações Adicionais
- Timeframe Ideal: ${metrics.bestTimeframe}
- Ativos Recomendados: ${metrics.bestAssets.join(', ')}
- Nível de Risco: ${metrics.riskLevel}

Relatório gerado em: ${new Date().toLocaleString()}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha-tecnica-${robotName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatMetric = (value: number | undefined, isPercentage = false, decimalPlaces = 2) => {
    if (value === undefined || value === null) return 'N/A';
    
    // Convert to text format with qualitative assessment
    if (isPercentage) {
      if (value >= 70) return `Excelente (${value.toFixed(decimalPlaces)}%)`;
      if (value >= 55) return `Bom (${value.toFixed(decimalPlaces)}%)`;
      if (value >= 45) return `Regular (${value.toFixed(decimalPlaces)}%)`;
      return `Baixo (${value.toFixed(decimalPlaces)}%)`;
    } else {
      // For non-percentage metrics
      if (value <= 0) return `Negativo (${value.toFixed(decimalPlaces)})`;
      
      // For Profit Factor
      if (value >= 2.0) return `Excelente (${value.toFixed(decimalPlaces)})`;
      if (value >= 1.5) return `Bom (${value.toFixed(decimalPlaces)})`;
      if (value >= 1.0) return `Aceitável (${value.toFixed(decimalPlaces)})`;
      return `Insuficiente (${value.toFixed(decimalPlaces)})`;
    }
  };

  const getMetricColor = (metric: string, value: number): string => {
    switch (metric) {
      case 'profitFactor':
        return value >= 1.5 ? 'text-green-500' : value >= 1.0 ? 'text-yellow-500' : 'text-red-500';
      case 'winRate':
        return value >= 60 ? 'text-green-500' : value >= 45 ? 'text-yellow-500' : 'text-red-500';
      case 'payoff':
        return value >= 1.5 ? 'text-green-500' : value >= 1.0 ? 'text-yellow-500' : 'text-red-500';
      case 'maxDrawdown':
        return value <= 10 ? 'text-green-500' : value <= 20 ? 'text-yellow-500' : 'text-red-500';
      case 'sharpeRatio':
        return value >= 1.0 ? 'text-green-500' : value >= 0.5 ? 'text-yellow-500' : 'text-red-500';
      case 'recoveryFactor':
        return value >= 3 ? 'text-green-500' : value >= 1 ? 'text-yellow-500' : 'text-red-500';
      case 'expectancy':
        return value >= 0.5 ? 'text-green-500' : value >= 0 ? 'text-yellow-500' : 'text-red-500';
      case 'profitability':
        return value >= 60 ? 'text-green-500' : value >= 40 ? 'text-yellow-500' : 'text-red-500';
      default:
        return 'text-gray-300';
    }
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'baixo':
        return 'bg-green-500 bg-opacity-20 text-green-400';
      case 'médio':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'alto':
        return 'bg-red-500 bg-opacity-20 text-red-400';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <BarChart2 className="w-5 h-5 text-blue-400 mr-2" />
          <h3 className="font-medium">Ficha Técnica do Robô</h3>
        </div>
        <div className="flex items-center space-x-2">
          {metrics ? (
            <>
              <button
                onClick={downloadTechnicalInfo}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                title="Baixar ficha técnica"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                title={showDetails ? "Ocultar detalhes" : "Mostrar detalhes"}
              >
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <button
              onClick={generateTechnicalInfo}
              disabled={isGenerating}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                isGenerating 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1.5" />
                  Gerar Ficha Técnica
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500 bg-opacity-10 border-b border-red-500 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {metrics && showDetails && (
        <div className="p-4 space-y-6">
          {/* Performance Metrics */}
          <div>
            <h4 className="text-lg font-medium mb-3 flex items-center">
              <Award className="w-4 h-4 text-yellow-500 mr-2" />
              Métricas de Performance
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Fator de Lucro</p>
                <p className={`text-lg font-bold ${getMetricColor('profitFactor', metrics.profitFactor)}`}>
                  {formatMetric(metrics.profitFactor)}
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Taxa de Acerto</p>
                <p className={`text-lg font-bold ${getMetricColor('winRate', metrics.winRate)}`}>
                  {formatMetric(metrics.winRate, true)}
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Payoff</p>
                <p className={`text-lg font-bold ${getMetricColor('payoff', metrics.payoff)}`}>
                  {formatMetric(metrics.payoff)}
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Drawdown Máx.</p>
                <p className={`text-lg font-bold ${getMetricColor('maxDrawdown', metrics.maxDrawdown)}`}>
                  {formatMetric(metrics.maxDrawdown, true)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div>
            <h4 className="text-lg font-medium mb-3 flex items-center">
              <Activity className="w-4 h-4 text-blue-500 mr-2" />
              Métricas Adicionais
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Total de Trades</p>
                <p className="text-lg font-bold">
                  {metrics.totalTrades > 100 ? 
                    `Alto Volume (${metrics.totalTrades})` : 
                    `Baixo Volume (${metrics.totalTrades})`}
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Sharpe Ratio</p>
                <p className={`text-lg font-bold ${getMetricColor('sharpeRatio', metrics.sharpeRatio)}`}>
                  {metrics.sharpeRatio >= 1.0 ? 
                    `Excelente (${metrics.sharpeRatio.toFixed(2)})` : 
                    metrics.sharpeRatio >= 0.5 ? 
                      `Bom (${metrics.sharpeRatio.toFixed(2)})` : 
                      `Baixo (${metrics.sharpeRatio.toFixed(2)})`}
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Expectativa</p>
                <p className={`text-lg font-bold ${getMetricColor('expectancy', metrics.expectancy)}`}>
                  {metrics.expectancy >= 0.5 ? 
                    `Excelente (${metrics.expectancy.toFixed(2)})` : 
                    metrics.expectancy >= 0 ? 
                      `Positivo (${metrics.expectancy.toFixed(2)})` : 
                      `Negativo (${metrics.expectancy.toFixed(2)})`}
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Rentabilidade</p>
                <p className={`text-lg font-bold ${getMetricColor('profitability', metrics.profitability)}`}>
                  {metrics.profitability >= 60 ? 
                    `Excelente (${metrics.profitability.toFixed(2)}%)` : 
                    metrics.profitability >= 40 ? 
                      `Bom (${metrics.profitability.toFixed(2)}%)` : 
                      `Baixo (${metrics.profitability.toFixed(2)}%)`}
                </p>
              </div>
            </div>
          </div>

          {/* Market Conditions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                Condições de Mercado
              </h4>
              <button
                onClick={() => setShowMarketConditions(!showMarketConditions)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {showMarketConditions ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            
            {showMarketConditions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-2 text-green-400">Melhores Condições</h5>
                  <ul className="space-y-1.5">
                    {metrics.bestMarketConditions.map((condition, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-1.5 flex-shrink-0 mt-0.5" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-2 text-red-400">Piores Condições</h5>
                  <ul className="space-y-1.5">
                    {metrics.worstMarketConditions.map((condition, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <X className="w-4 h-4 text-red-500 mr-1.5 flex-shrink-0 mt-0.5" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Risk Analysis */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                Análise de Risco
              </h4>
              <button
                onClick={() => setShowRiskAnalysis(!showRiskAnalysis)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {showRiskAnalysis ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            
            {showRiskAnalysis && (
              <>
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">Nível de Risco</p>
                  <div className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                    metrics.riskLevel.toLowerCase().includes('alto') ? 'bg-red-500 bg-opacity-20 text-red-400' :
                    metrics.riskLevel.toLowerCase().includes('médio') ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                    'bg-green-500 bg-opacity-20 text-green-400'
                  }`}>
                    {metrics.riskLevel.toLowerCase() === 'baixo' ? 
                      'Baixo - Adequado para iniciantes' : 
                      metrics.riskLevel.toLowerCase() === 'médio' ? 
                        'Médio - Para traders intermediários' : 
                        'Alto - Para traders experientes'}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Timeframe Ideal</p>
                    <p className="text-lg font-bold">{metrics.bestTimeframe}</p>
                  </div>
                  
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Ativos Recomendados</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {metrics.bestAssets.map((asset, index) => (
                        <span key={index} className="px-2 py-0.5 bg-blue-900 bg-opacity-50 rounded text-blue-300 text-xs">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Volatilidade</p>
                    <p className="text-lg font-bold">
                      {metrics.volatility > 30 ? 
                        `Alta (${metrics.volatility.toFixed(2)}%)` : 
                        metrics.volatility < 10 ? 
                          `Baixa (${metrics.volatility.toFixed(2)}%)` : 
                          `Média (${metrics.volatility.toFixed(2)}%)`}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Fator de Recuperação</p>
              <p className="text-lg font-bold">
                {metrics.recoveryFactor >= 3 ? 
                  `Excelente (${metrics.recoveryFactor.toFixed(2)})` : 
                  metrics.recoveryFactor >= 1 ? 
                    `Bom (${metrics.recoveryFactor.toFixed(2)})` : 
                    `Insuficiente (${metrics.recoveryFactor.toFixed(2)})`}
              </p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Máx. Perdas Consecutivas</p>
              <p className="text-lg font-bold">
                {metrics.maxConsecutiveLosses > 5 ? 
                  `Preocupante (${metrics.maxConsecutiveLosses})` : 
                  `Aceitável (${metrics.maxConsecutiveLosses})`}
              </p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Tempo no Mercado</p>
              <p className="text-lg font-bold">
                {metrics.timeInMarket > 80 ? 
                  `Muito Exposto (${metrics.timeInMarket.toFixed(2)}%)` : 
                  metrics.timeInMarket < 20 ? 
                    `Pouco Exposto (${metrics.timeInMarket.toFixed(2)}%)` : 
                    `Equilibrado (${metrics.timeInMarket.toFixed(2)}%)`}
              </p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Volatilidade</p>
              <p className="text-lg font-bold">
                {metrics.volatility > 30 ? 
                  `Alta (${metrics.volatility.toFixed(2)}%)` : 
                  metrics.volatility < 10 ? 
                    `Baixa (${metrics.volatility.toFixed(2)}%)` : 
                    `Média (${metrics.volatility.toFixed(2)}%)`}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg">
            <div className="flex items-start">
              <HelpCircle className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">
                <strong>Nota:</strong> Estas métricas são estimativas baseadas na análise do código do robô e podem variar dependendo das condições de mercado, configurações e outros fatores. Recomendamos realizar backtests e testes em conta demo antes de utilizar o robô em operações reais.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
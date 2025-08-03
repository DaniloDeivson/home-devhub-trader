import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileSpreadsheet, AlertTriangle, Check, 
  BarChart2, TrendingUp, Zap, RefreshCw, Download, 
  ChevronDown, ChevronUp, Trash2, PieChart, Briefcase, 
  Layers, Shuffle, MessageSquare, Lightbulb, XCircle, X,
  DollarSign, Calendar, Clock
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { AIResponseChat } from '../components/AIResponseChat';
import { MetricsDashboard } from '../components/MetricsDashboard';

interface BacktestResult {
  profitFactor: number;
  payoff: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  lossTrades: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  maxDrawdownAmount: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  sharpeRatio: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  recoveryFactor: number;
  averageTrade: number;
  timeInMarket: number;
  lastUpdated: string;
}

interface AnalysisResult {
  metrics: BacktestResult;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  portfolioRecommendations: {
    description: string;
    combinations: string[];
  };
  rawResponse?: string;
}

export function BacktestAnalysisPage() {
  const navigate = useNavigate();
  const { profile, updateTokenBalance } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const [showPortfolio, setShowPortfolio] = useState<boolean>(true);
  const [showStrengths, setShowStrengths] = useState<boolean>(true);
  const [showWeaknesses, setShowWeaknesses] = useState<boolean>(true);
  const [showDrawdownDetails, setShowDrawdownDetails] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [loadingSavedAnalyses, setLoadingSavedAnalyses] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [analysisTimeout, setAnalysisTimeout] = useState<NodeJS.Timeout | null>(null);
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);

  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  // Timer for tracking analysis duration
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isAnalyzing && analysisStartTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - analysisStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else if (!isAnalyzing) {
      setElapsedTime(0);
      setAnalysisStartTime(null);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAnalyzing, analysisStartTime]);

  const loadSavedAnalyses = async () => {
    try {
      setLoadingSavedAnalyses(true);
      
      if (!supabase || typeof supabase.from !== 'function') {
        console.warn('Supabase not available, skipping saved analyses');
        return;
      }
      
      const { data, error } = await supabase
        .from('strategy_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSavedAnalyses(data || []);
    } catch (error) {
      console.error('Error loading saved analyses:', error);
    } finally {
      setLoadingSavedAnalyses(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a valid CSV file.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      readCSVFile(selectedFile);
    }
  };

  const readCSVFile = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      setIsUploading(false);
    };
    
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
        setError('Please select a valid CSV file.');
        return;
      }
      
      setFile(droppedFile);
      setError(null);
      readCSVFile(droppedFile);
    }
  };

  const analyzeCSV = async () => {
    if (!csvData) return;
    
    setError('Análise de backtest não está disponível no momento. Esta funcionalidade requer configuração da API OpenAI.');
    return;
  };

  const saveAnalysisToDatabase = async (result: AnalysisResult) => {
    try {
      if (!supabase || typeof supabase.from !== 'function') {
        console.warn('Supabase not available, cannot save analysis');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('strategy_analyses')
        .insert({
          user_id: user.id,
          analysis_data: result
        });
      
      if (error) throw error;
      
      await loadSavedAnalyses();
      
    } catch (error) {
      console.error('Error saving analysis to database:', error);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCsvData(null);
    setAnalysisResult(null);
    setDashboardMetrics(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelAnalysis = () => {
    if (analysisTimeout) {
      clearTimeout(analysisTimeout);
      setAnalysisTimeout(null);
    }
    setIsAnalyzing(false);
    setError('Análise cancelada pelo usuário.');
  };

  const downloadAnalysisReport = () => {
    if (!analysisResult) return;
    
    const report = analysisResult.rawResponse || `
# Relatório de Análise de Backtest

## Métricas Principais
- Profit Factor: ${analysisResult.metrics.profitFactor.toFixed(2)}
- Payoff: ${analysisResult.metrics.payoff.toFixed(2)}
- Win Rate: ${analysisResult.metrics.winRate.toFixed(2)}%
- Total de Trades: ${analysisResult.metrics.totalTrades}
- Trades Lucrativos: ${analysisResult.metrics.profitableTrades}
- Trades Perdedores: ${analysisResult.metrics.lossTrades}
- Ganho Médio: R$ ${analysisResult.metrics.averageWin.toFixed(2)}
- Perda Média: R$ ${analysisResult.metrics.averageLoss.toFixed(2)}
- Drawdown Máximo: ${analysisResult.metrics.maxDrawdown.toFixed(2)}%
- Valor do Drawdown: R$ ${analysisResult.metrics.maxDrawdownAmount.toFixed(2)}
- Máx. Perdas Consecutivas: ${analysisResult.metrics.maxConsecutiveLosses}
- Máx. Ganhos Consecutivos: ${analysisResult.metrics.maxConsecutiveWins}
- Sharpe Ratio: ${analysisResult.metrics.sharpeRatio.toFixed(2)}
- Lucro Líquido: R$ ${analysisResult.metrics.netProfit.toFixed(2)}
- Lucro Bruto: R$ ${analysisResult.metrics.grossProfit.toFixed(2)}
- Perda Bruta: R$ ${analysisResult.metrics.grossLoss.toFixed(2)}
- Média por Trade: R$ ${analysisResult.metrics.averageTrade.toFixed(2)}
- Tempo no Mercado: ${analysisResult.metrics.timeInMarket.toFixed(2)}%

Relatório gerado em: ${new Date().toLocaleString()}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analise-backtest.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadSavedAnalysis = (analysisData: any) => {
    setAnalysisResult(analysisData);
    setDashboardMetrics(analysisData.metrics);
    setShowChat(true);
    setAnalysisCompleted(true);
    
    setNotificationMessage('Análise carregada com sucesso!');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  const handleMetricsReceived = (metrics: any) => {
    console.log("Metrics received from chat:", metrics);
    
    if (analysisResult) {
      const updatedResult = {
        ...analysisResult,
        metrics: {
          ...analysisResult.metrics,
          ...metrics
        }
      };
      setAnalysisResult(updatedResult);
      setDashboardMetrics(updatedResult.metrics);
      
      saveAnalysisToDatabase(updatedResult);
      
      setNotificationMessage('Métricas atualizadas com sucesso!');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      
      return;
    }
    
    const newAnalysisResult: AnalysisResult = {
      metrics: {
        profitFactor: metrics.profitFactor || 0,
        payoff: metrics.payoff || 0,
        winRate: metrics.winRate || 0,
        totalTrades: metrics.totalTrades || 0,
        profitableTrades: metrics.profitableTrades || 0,
        lossTrades: metrics.lossTrades || 0,
        averageWin: metrics.averageWin || 0,
        averageLoss: metrics.averageLoss || 0,
        maxDrawdown: metrics.maxDrawdown || 0,
        maxDrawdownAmount: metrics.maxDrawdownAmount || 0,
        maxConsecutiveLosses: metrics.maxConsecutiveLosses || 0,
        maxConsecutiveWins: metrics.maxConsecutiveWins || 0,
        sharpeRatio: metrics.sharpeRatio || 0,
        netProfit: metrics.netProfit || 0,
        grossProfit: metrics.grossProfit || 0,
        grossLoss: metrics.grossLoss || 0,
        recoveryFactor: metrics.recoveryFactor || 0,
        averageTrade: metrics.averageTrade || 0,
        timeInMarket: metrics.timeInMarket || 0,
        lastUpdated: new Date().toISOString()
      },
      strengths: metrics.strengths || ["Strategy shows potential"],
      weaknesses: metrics.weaknesses || ["Needs further optimization"],
      suggestions: ["Consider backtesting with different parameters"],
      portfolioRecommendations: {
        description: "Consider combining this strategy with others for diversification",
        combinations: ["Trend following strategies", "Mean reversion strategies"]
      }
    };
    
    setAnalysisResult(newAnalysisResult);
    setDashboardMetrics(newAnalysisResult.metrics);
    setAnalysisCompleted(true);
    
    setNotificationMessage('Nova análise criada com base no chat!');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
    
    saveAnalysisToDatabase(newAnalysisResult);
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/robots')}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Back to robots"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Análise de Backtest</h1>
          </div>
          
          {isAnalyzing && (
            <div className="flex items-center bg-blue-900 bg-opacity-20 px-4 py-2 rounded-md">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin text-blue-400" />
              <span className="text-blue-300">
                Analisando... {elapsedTime}s
              </span>
            </div>
          )}
        </div>

        {/* Notification */}
        {showNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md z-50 flex items-center justify-between">
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2" />
              <span>{notificationMessage}</span>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard */}
        {dashboardMetrics && (
          <div className="mb-8">
            <MetricsDashboard metrics={dashboardMetrics} />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - File Upload */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-400 mr-2" />
                Upload de Dados
              </h2>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  file ? 'border-green-500 bg-green-500 bg-opacity-5' : 'border-gray-600 hover:border-blue-500'
                } transition-colors cursor-pointer`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <Check className="w-12 h-12 text-green-500 mb-2" />
                    <p className="font-medium text-green-400">{file.name}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="font-medium">Arraste seu arquivo CSV aqui ou clique para selecionar</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Suporta arquivos CSV de backtest
                    </p>
                  </div>
                )}
              </div>
              
              {error && !showChat && (
                <div className="mt-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center text-red-500">
                  <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <button
                onClick={analyzeCSV}
                disabled={!csvData || isAnalyzing}
                className={`w-full mt-4 py-2 rounded-md flex items-center justify-center ${
                  !csvData || isAnalyzing
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <BarChart2 className="w-5 h-5 mr-2" />
                    Analisar Backtest
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-400 mt-2 text-center">
                Funcionalidade temporariamente indisponível
              </p>
            </div>
            
            {/* Saved Analyses */}
            {savedAnalyses.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Layers className="w-5 h-5 text-blue-400 mr-2" />
                  Análises Recentes
                </h2>
                
                <div className="space-y-3">
                  {savedAnalyses.map((analysis, index) => (
                    <button
                      key={index}
                      onClick={() => loadSavedAnalysis(analysis.analysis_data)}
                      className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left flex items-center"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          Análise {index + 1}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(analysis.created_at).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chat Section */}
            {showChat && (
              <div className="bg-gray-800 rounded-lg overflow-hidden h-[500px] mb-6">
                <AIResponseChat 
                  isAnalyzing={isAnalyzing}
                  setIsAnalyzing={setIsAnalyzing}
                  onCancelAnalysis={handleCancelAnalysis}
                  error={error}
                  setError={setError}
                  analysisResult={analysisResult}
                  onMetricsReceived={handleMetricsReceived}
                />
              </div>
            )}
            
            {!showChat && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 text-yellow-400 mr-2" />
                  Como Funciona
                </h2>
                
                <ol className="space-y-4 text-gray-300">
                  <li className="flex">
                    <span className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">1</span>
                    <p>Faça upload do arquivo CSV com os resultados do backtest do seu robô</p>
                  </li>
                  <li className="flex">
                    <span className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">2</span>
                    <p>Nossa IA analisará os dados e calculará métricas importantes</p>
                  </li>
                  <li className="flex">
                    <span className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">3</span>
                    <p>Obtenha insights sobre os pontos fortes e fracos da estratégia</p>
                  </li>
                  <li className="flex">
                    <span className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">4</span>
                    <p>Receba sugestões de melhorias e recomendações de portfólio</p>
                  </li>
                </ol>
                
                <div className="mt-6 p-4 bg-yellow-900 bg-opacity-20 rounded-lg border border-yellow-800">
                  <p className="text-sm text-yellow-300">
                    <strong>Aviso:</strong> A funcionalidade de análise de backtest está temporariamente indisponível. Estamos trabalhando para reativá-la em breve.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Analysis Results */}
          <div className="lg:col-span-2">
            {analysisResult ? (
              <div className="space-y-6">
                {/* Raw Response Display */}
                {rawResponse && (
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <MessageSquare className="w-5 h-5 text-blue-400 mr-2" />
                        Resposta Completa da Análise
                      </h2>
                      <button
                        onClick={() => downloadAnalysisReport()}
                        className="p-1.5 hover:bg-gray-700 rounded-md"
                        title="Download full report"
                      >
                        <Download className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg overflow-auto max-h-[500px]">
                      <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">
                        {analysisResult.rawResponse || rawResponse}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={downloadAnalysisReport}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Baixar Relatório
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/robots');
                    }}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-md flex items-center justify-center"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Consultar IA para Melhorias
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center justify-center text-center h-full">
                <PieChart className="w-16 h-16 text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Nenhuma análise disponível</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  Faça upload de um arquivo CSV de backtest para receber uma análise detalhada e recomendações personalizadas.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Selecionar Arquivo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
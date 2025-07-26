import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Save, FolderOpen, RefreshCw, AlertTriangle, Check, X
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../stores/authStore';
import { MetricsDashboard } from '../components/MetricsDashboard';
import { AIResponseChat } from '../components/AIResponseChat';
import { BacktestUploadForm } from '../components/BacktestUploadForm';
import { StrategySelector } from '../components/StrategySelector';
import { TradesTable } from '../components/TradesTable';
import { EquityCurveSection } from '../components/EquityCurveSection';
import { DailyResultsSection } from '../components/DailyResultsSection';
import { SpecialEventsSection } from '../components/SpecialEventsSection';
import { SimpleCorrelationComponent } from '../components/CorrelationSection';
import { SaveAnalysisModal } from '../components/SaveAnalysisModal';
import { LoadAnalysisModal } from '../components/LoadAnalysisModal';
import { RenameAnalysisModal } from '../components/RenameAnalysisModal';
import { EmotionalProfileSection } from '../components/EmotionalProfileSection';
import { DailyAnalysisSection } from '../components/DailyAnalysisSection';
import { PlanRestrictedSection } from '../components/PlanRestrictedSection';
import { supabase } from '../lib/supabase';
import { FileFilter } from '../components/FileFilter';
import { ActiveFilesInfo } from '../components/ActiveFilesInfo';

// Special events data
const specialEvents = [
  { name: 'Payroll', date: '2023-05-05', impact: 'alto' },
  { name: 'FED', date: '2023-05-03', impact: 'alto' },
  { name: 'COPOM', date: '2023-05-10', impact: 'alto' },
  { name: 'CPI', date: '2023-05-12', impact: 'médio' },
  { name: 'Vencimento de Opções', date: '2023-05-19', impact: 'médio' },
  { name: 'Vencimento Índice Futuro', date: '2023-05-17', impact: 'médio' },
  { name: 'Vencimento Dólar Futuro', date: '2023-05-01', impact: 'médio' },
  { name: 'Véspera de Feriado', date: '2023-05-31', impact: 'baixo' },
  { name: 'Semana de Feriado', date: '2023-05-29', impact: 'baixo' }
];

interface Trade {
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  pnl_pct: number;
  direction: 'long' | 'short';
  symbol?: string;
}

interface DayOfWeekStats {
  "Profit Factor": number;
  "Trades": number;
  "Win Rate (%)": number;
}

interface MonthStats {
  "Profit Factor": number;
  "Trades": number;
  "Win Rate (%)": number;
}

interface BacktestResult {
  trades?: Trade[];
  "Performance Metrics"?: {
    "Average Loss": number;
    "Average Win": number;
    "Gross Loss": number;
    "Gross Profit": number;
    "Max Drawdown ($)": number;
    "Net Profit": number;
    "Payoff": number;
    "Profit Factor": number;
    "Sharpe Ratio": number;
    "Time in Market": string;
    "Total Trades": number;
    "Win Rate (%)": number;
  };
  "Day of Week Analysis"?: {
    "Best Day": {
      "Day": string;
      "Profit Factor": number;
      "Trades": number;
      "Win Rate (%)": number;
    };
    "Stats": {
      [key: string]: DayOfWeekStats;
    };
    "Worst Day": {
      "Day": string;
      "Profit Factor": number;
      "Trades": number;
      "Win Rate (%)": number;
    };
  };
  "Monthly Analysis"?: {
    "Best Month": {
      "Month": string;
      "Profit Factor": number;
      "Trades": number;
      "Win Rate (%)": number;
    };
    "Stats": {
      [key: string]: MonthStats;
    };
    "Worst Month": {
      "Month": string;
      "Profit Factor": number;
      "Trades": number;
      "Win Rate (%)": number;
    };
  };
  equity_curve?: number[];
  emotionalAnalysis?: {
    stopDisciplineIndex: number;
    dailyLossDisciplineIndex: number;
    leverageDisciplineIndex: number;
    furyProbability: number;
  };
}

interface SavedAnalysis {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  backtestResult: BacktestResult;
  selectedStrategy: string | null;
  selectedAsset: string | null;
  csvContent: string | null;
  availableStrategies: string[];
  availableAssets: string[];
  totalTrades: number;
}

export function BacktestAnalysisPage() {
  const navigate = useNavigate();
  const { profile, updateTokenBalance } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
const [showConsolidated, setShowConsolidated] = useState(true);
const [fileResults, setFileResults] = useState<{[key: string]: BacktestResult}>({});
const [individualAnalysisMode, setIndividualAnalysisMode] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showDailyResults, setShowDailyResults] = useState(false);
  const [showDailyAnalysis, setShowDailyAnalysis] = useState(true);
  const [showTrades, setShowTrades] = useState(false);
  const [trades,setTrades] = useState<Trade[]>([]);
  const [showEquityCurve, setShowEquityCurve] = useState(true);
  const [showSpecialEvents, setShowSpecialEvents] = useState(false);
  const [showCorrelation, setShowCorrelation] = useState(false);
  const [showEmotionalProfile, setShowEmotionalProfile] = useState(false);
  const [showStrategySelector, setShowStrategySelector] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [availableStrategies, setAvailableStrategies] = useState<string[]>(['Estratégia 1', 'Estratégia 2', 'Estratégia 3']);
  const [availableAssets, setAvailableAssets] = useState<string[]>(['WINFUT', 'WDOFUT', 'PETR4', 'VALE3']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drata,setDrata] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error2, setError2] = useState<string | null>(null);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [tradeSearch, setTradeSearch] = useState('');
  const [emocional, setEmocional] = useState<any>(null);
  // Save system states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [renameAnalysisId, setRenameAnalysisId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  function createFormData(file) {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}
  // Check if user has PRO plan
  const hasPro = React.useMemo(() => {
    if (!profile?.plan) return false;
    return profile.plan.toLowerCase().includes('pro');
  }, [profile?.plan]);

  // Check if user has at least Starter plan
  const hasStarter = React.useMemo(() => {
    if (!profile?.plan) return false;
    const plan = profile.plan.toLowerCase();
    return plan.includes('starter') || plan.includes('pro');
  }, [profile?.plan]);

  // Load saved analyses from database
  useEffect(() => {
    const loadSavedAnalyses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("strategy_analyses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Convert database format to our app format
          const analyses: SavedAnalysis[] = data.map(item => ({
            id: item.id,
            name: item.analysis_data.name || `Análise ${item.id.slice(0, 8)}`,
            createdAt: item.created_at,
            updatedAt: item.created_at,
            backtestResult: item.analysis_data.metrics || {},
            selectedStrategy: null,
            selectedAsset: null,
            csvContent: null,
            availableStrategies: [],
            availableAssets: [],
            totalTrades: item.analysis_data.metrics?.trades?.length || 0
          }));
          
          setSavedAnalyses(analyses);
        }
      } catch (error) {
        console.error("Error loading saved analyses:", error);
      }
    };

    loadSavedAnalyses();
  }, []);

 useEffect(() => {
  if (backtestResult?.trades) {
    let trades = [...backtestResult.trades];
    
    // Apply strategy filter
    if (selectedStrategy && selectedStrategy !== '') {
      // Filtrar por estratégia usando o nome do arquivo como estratégia
      const strategyFiles = files.filter(file => 
        file.name.replace('.csv', '') === selectedStrategy
      );
      
      if (strategyFiles.length > 0) {
        // Em uma implementação real, você filtraria pelos trades da estratégia específica
        // Por enquanto, mantemos todos os trades se a estratégia existe
      }
    }
    
    // Apply asset filter
    if (selectedAsset && selectedAsset !== '') {
      trades = trades.filter(trade => 
        trade.symbol === selectedAsset || 
        // If symbol is not available, keep all trades
        !trade.symbol
      );
    }
    
    // Apply search filter
    if (tradeSearch) {
      const searchLower = tradeSearch.toLowerCase();
      trades = trades.filter(trade => 
        (trade.symbol && trade.symbol.toLowerCase().includes(searchLower)) ||
        trade.entry_date.toLowerCase().includes(searchLower) ||
        trade.exit_date.toLowerCase().includes(searchLower) ||
        trade.pnl.toString().includes(searchLower)
      );
    }
    
    setFilteredTrades(trades);
  } else {
    setFilteredTrades([]);
  }
}, [backtestResult?.trades, selectedStrategy, selectedAsset, tradeSearch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      setFile(newFiles[0]); // Set the first file as the current file for backward compatibility
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      setFile(newFiles[0]); // Set the first file as the current file for backward compatibility
      setError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
  if (files.length === 0) {
    setError('Por favor, selecione pelo menos um arquivo CSV para análise');
    return;
  }
  
  // Check file extensions
  const invalidFiles = files.filter(file => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    return fileExtension !== 'csv';
  });
  
  if (invalidFiles.length > 0) {
    setError(`Os seguintes arquivos não são CSVs válidos: ${invalidFiles.map(f => f.name).join(', ')}`);
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    let response;
    let data;
    let correlationData = null;

    if (files.length === 1) {
      // Single file - use original API
      const fileContent = await readFileAsText(files[0]);
      setCsvContent(fileContent);

      const formData = new FormData();
      formData.append('file', files[0]);

      response = await fetch('https://api.devhubtrader.com.br//api/tabela', {
        method: 'POST',
        body: formData,
      });
     
    // Implement your fetch emotional profile logic here
    try {
      const wwx = await fetch('https://api.devhubtrader.com.br//api/disciplina-completa', {
        method: 'POST', 
        body: formData
      });
      
      const responses = await fetch('https://api.devhubtrader.com.br//api/trades', {
          method: 'POST',
          body: formData
      });

      const datara = await responses.json();
      
      if (wwx.ok) {
        const dataemocional = await wwx.json();
        setEmocional(dataemocional);
      } else {
        console.warn('Failed to fetch emotional data:', wwx.status, wwx.statusText);
        setEmocional(null);
      }
      
      setTrades(datara);
    } catch (error) {
      console.error('Error fetching emotional data:', error);
      setEmocional(null);
    }

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      data = await response.json();
      setDrata(data);
      console.log(JSON.stringify(data.EquityCurveData))
    } else if (files.length >= 2) {
    try {
      let correlationData = null;
      let dateDirectionData = null;
      
      // 1. Correlação tradicional (apenas para 2 arquivos)
      if (files.length === 2) {
        // Análises individuais primeiro
        const [response1, response2] = await Promise.all([
          fetch('https://api.devhubtrader.com.br//api/tabela', {
            method: 'POST',
            body: createFormData(files[0])
          }),
          fetch('https://api.devhubtrader.com.br//api/tabela', {
            method: 'POST', 
            body: createFormData(files[1])
          })
        ]);

        const [data1, data2] = await Promise.all([
          response1.json(),
          response2.json()
        ]);

        // Correlação principal
        const correlationResponse = await fetch('https://api.devhubtrader.com.br//api/correlacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arquivo1: data1, arquivo2: data2 })
        });

        if (correlationResponse.ok) {
          correlationData = await correlationResponse.json();
        }
      }

      // 2. Correlação por data/direção (para 2+ arquivos)
      const formDataCorrelacao = new FormData();
      files.forEach((file) => {
        formDataCorrelacao.append('files', file);
      });

      const dateDirectionResponse = await fetch('https://api.devhubtrader.com.br//api/correlacao', {
        method: 'POST',
        body: formDataCorrelacao,
      });

      if (dateDirectionResponse.ok) {
        dateDirectionData = await dateDirectionResponse.json();
      }

      // 3. Análise consolidada principal
      const consolidatedResponse = await fetch('https://api.devhubtrader.com.br//api/tabela-multipla', {
        method: 'POST',
        body: formDataCorrelacao, // Mesmo FormData
      });
      try {
        const wwx = await fetch('https://api.devhubtrader.com.br//api/disciplina-completa', {
          method: 'POST', 
          body: formDataCorrelacao
        });
        
        const responses = await fetch('https://api.devhubtrader.com.br//api/trades', {
            method: 'POST',
            body: formDataCorrelacao
        });

        const datara = await responses.json();
        
        if (wwx.ok) {
          const dataemocional = await wwx.json();
          setEmocional(dataemocional);
        } else {
          console.warn('Failed to fetch emotional data:', wwx.status, wwx.statusText);
          setEmocional(null);
        }
        
        setTrades(datara);
      } catch (error) {
        console.error('Error fetching emotional data:', error);
        setEmocional(null);
      }
      if (!consolidatedResponse.ok) {
        throw new Error('Erro na análise consolidada');
      }

      data = await consolidatedResponse.json();
      setDrata(data);

      // 4. ADICIONAR DADOS DE CORRELAÇÃO (CÓDIGO CORRIGIDO)
      if (correlationData && files.length === 2) {
        data.correlationAnalysis = correlationData.correlation_analysis;
        data.correlationMetadata = correlationData.metadata;
        data.individualResults = {
          file1: { name: files[0].name, data: data1 },
          file2: { name: files[1].name, data: data2 }
        };
        console.log('📊 Correlação tradicional adicionada (2 arquivos)');
      } else if (files.length > 2) {
        // Para 3+ arquivos, podemos ter uma correlação matricial no futuro
        data.multipleFilesCount = files.length;
        data.fileNames = files.map(f => f.name);
        console.log(`📊 Análise para \${files.length} arquivos preparada`);
      }

      if (dateDirectionData) {
        data.dateDirectionCorrelation = dateDirectionData;
        console.log(`📅 Correlação data/direção adicionada (${files.length} arquivos)`);
      }

      setCsvContent(`Análise de \${files.length} estratégias: ${files.map(f => f.name).join(', ')}`);

    } catch (error) {
      console.error('Erro no processamento:', error);
    }
  } else {
      // Multiple files (3+) - use consolidated API only
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('files', file);
      });

      response = await fetch('https://api.devhubtrader.com.br//api/tabela-multipla', {
        method: 'POST',
        body: formData,
      });
      const wwx = await fetch('https://api.devhubtrader.com.br//api/disciplina-completa', {
      method: 'POST', 
      body: formData
    })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      data = await response.json();
      setDrata(data);
      setCsvContent(`Análise consolidada de ${files.length} arquivos: ${files.map(f => f.name).join(', ')}`);
    }
    
    // Add emotional analysis data if not present
    if (!data.emotionalAnalysis) {
      data.emotionalAnalysis = {
        stopDisciplineIndex: 85.7,
        dailyLossDisciplineIndex: 72.3,
        leverageDisciplineIndex: 91.2,
        furyProbability: 8.5
      };
    }
    
    // Process and set the result
    setBacktestResult(data);
    setShowUploadForm(false);
    setShowChat(true);
    setCurrentAnalysisId(null);
    
    // Extract available assets from the data if possible
    if (data.trades && data.trades.length > 0) {
      const assets = Array.from(new Set(data.trades.map((trade) => trade.asset || trade.symbol || 'Unknown')));
      if (assets.length > 0 && assets[0] !== 'Unknown') {
        setAvailableAssets(assets);
      }
    }
    
    // Set filtered trades initially to all trades
    if (data.trades) {
      setFilteredTrades(data.trades);
    }
    
    // Update available strategies based on file names
    setAvailableStrategies(files.map(file => file.name.replace('.csv', '')));
    
    // Deduct tokens for analysis (extra tokens for correlation analysis)
    const tokensToDeduct = files.length === 1 ? -1000 : 
                          files.length === 2 ? -2500 : // Extra tokens for correlation
                          -1500 * files.length;
    await updateTokenBalance(tokensToDeduct);
    
    // Show correlation summary if available
    if (correlationData && correlationData.correlation_analysis) {
      const summary = correlationData.correlation_analysis.resumo_executivo;
      const complementarity = correlationData.correlation_analysis.analise_complementaridade.resumo;
      
      
      
      // Optional: You could show a success message or notification here
      // For example, if you have a toast notification system:
      // showToast({
      //   type: 'success',
      //   title: 'Análise de correlação concluída!',
      //   message: `Estratégias são ${complementarity.estrategias_complementares ? 'complementares' : 'sobrepostas'}. Verifique os detalhes completos no dashboard.`
      // });
    }
    
  } catch (err) {
    console.error('Error uploading file:', err);
    setError(err instanceof Error ? err.message : 'Erro ao processar o arquivo');
  } finally {
    setIsLoading(false);
  }
};

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const handleReset = () => {
    setFile(null);
    setFiles([]);
    setBacktestResult(null);
    setShowUploadForm(true);
    setError(null);
    setShowChat(false);
    setFilteredTrades([]);
    setCurrentAnalysisId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  

  // Convert API response to the format expected by MetricsDashboard
  const convertToMetricsDashboardFormat = (result: BacktestResult | null) => {
    // Return empty object if result is null/undefined
    if (!result) return {};
    
    // Check if Performance Metrics exists, if not return default values
    const perfMetrics = result["Performance Metrics"];
    if (!perfMetrics) {
      return {
        profitFactor: 0,
        winRate: 0,
        payoff: 0,
        maxDrawdown: 0,
        maxDrawdownAmount: 0,
        netProfit: 0,
        grossProfit: 0,
        grossLoss: 0,
        totalTrades: 0,
        profitableTrades: 0,
        lossTrades: 0,
        averageWin: 0,
        averageLoss: 0,
        sharpeRatio: 0,
        averageTrade: 0,
        averageTradeDuration: "0",
        dayOfWeekAnalysis: {},
        monthlyAnalysis: {},
        bestDay: null,
        worstDay: null,
        bestMonth: null,
        worstMonth: null,
        maxConsecutiveLosses: 0,
        maxConsecutiveWins: 0,
        maiorGanho: 0,
        maiorPerda: 0,
        recoveryFactor: 0
      };
    }
    
    const dayOfWeekAnalysis = result["Day of Week Analysis"];
    const monthlyAnalysis = result["Monthly Analysis"];
    
    // Convert day of week analysis with null/undefined safety
    const convertedDayOfWeekAnalysis: Record<string, { trades: number; winRate: number; profitFactor: number }> = {};
    if (dayOfWeekAnalysis?.Stats) {
      Object.entries(dayOfWeekAnalysis.Stats).forEach(([day, data]) => {
        convertedDayOfWeekAnalysis[day.toLowerCase()] = {
          trades: data["Trades"] ?? 0,
          winRate: data["Win Rate (%)"] ?? 0,
          profitFactor: data["Profit Factor"] ?? 0
        };
      });
    }
    
    // Convert monthly analysis with null/undefined safety
    const convertedMonthlyAnalysis: Record<string, { trades: number; winRate: number; profitFactor: number }> = {};
    if (monthlyAnalysis?.Stats) {
      Object.entries(monthlyAnalysis.Stats).forEach(([month, data]) => {
        convertedMonthlyAnalysis[month.toLowerCase()] = {
          trades: data["Trades"] ?? 0,
          winRate: data["Win Rate (%)"] ?? 0,
          profitFactor: data["Profit Factor"] ?? 0
        };
      });
    }
    
    return {
      profitFactor: perfMetrics["Profit Factor"] ?? 0,
      winRate: perfMetrics["Win Rate (%)"] ?? 0,
      payoff: perfMetrics["Payoff"] ?? 0,
      maxDrawdown: 15, // Not directly provided in the API, using a default value
      maxDrawdownAmount: perfMetrics["Max Drawdown ($)"] ?? 0,
      netProfit: perfMetrics["Net Profit"] ?? 0,
      grossProfit: perfMetrics["Gross Profit"] ?? 0,
      grossLoss: perfMetrics["Gross Loss"] ?? 0,
      totalTrades: perfMetrics["Total Trades"] ?? 0,
      profitableTrades: Math.round((perfMetrics["Total Trades"] ?? 0) * (perfMetrics["Win Rate (%)"] ?? 0) / 100),
      lossTrades: Math.round((perfMetrics["Total Trades"] ?? 0) * (1 - (perfMetrics["Win Rate (%)"] ?? 0) / 100)),
      averageWin: perfMetrics["Average Win"] ?? 0,
      averageLoss: perfMetrics["Average Loss"] ?? 0,
      sharpeRatio: perfMetrics["Sharpe Ratio"] ?? 0,
      averageTrade: ((perfMetrics["Net Profit"] ?? 0) / (perfMetrics["Total Trades"] ?? 1)),
      averageTradeDuration: perfMetrics["Time in Market"] ?? "0",
      dayOfWeekAnalysis: convertedDayOfWeekAnalysis,
      monthlyAnalysis: convertedMonthlyAnalysis,
      
      // Best/worst day/month with null safety
      bestDay: dayOfWeekAnalysis?.["Best Day"] || null,
      worstDay: dayOfWeekAnalysis?.["Worst Day"] || null,
      bestMonth: monthlyAnalysis?.["Best Month"] || null,
      worstMonth: monthlyAnalysis?.["Worst Month"] || null,
      
      // Métricas complementares moved to advanced metrics section
      maxConsecutiveLosses: 4,
      maxConsecutiveWins: 7,
      maiorGanho: 1850.75,
      maiorPerda: -980.25,
      recoveryFactor: 2.5
    };
  };

  const handleMetricsReceived = (metrics: any) => {
    console.log("Metrics received from chat:", metrics);
    setAnalysisResult(metrics);
  };

  // Save system functions
  const handleSaveAnalysis = async () => {
    if (!backtestResult) return;
    
    if (currentAnalysisId) {
      try {
        // Update existing analysis in database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        
        const { error } = await supabase
          .from("strategy_analyses")
          .update({ 
            analysis_data: {
              name: savedAnalyses.find(a => a.id === currentAnalysisId)?.name,
              metrics: backtestResult,
              file_name: file?.name,
              created_at: new Date().toISOString(),
            }
          })
          .eq("id", currentAnalysisId);

        if (error) throw error;
        
        // Update local state
        setSavedAnalyses(prev => prev.map(analysis => 
          analysis.id === currentAnalysisId 
            ? {
                ...analysis,
                updatedAt: new Date().toISOString(),
                backtestResult,
                selectedStrategy,
                selectedAsset,
                csvContent,
                availableStrategies,
                availableAssets
              }
            : analysis
        ));
      } catch (error) {
        console.error("Error updating analysis:", error);
        setError("Erro ao atualizar análise");
      }
    } else {
      // Save new analysis
      setShowSaveModal(true);
    }
  };

  const confirmSaveAnalysis = async () => {
    if (!backtestResult || !saveName.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Save to database
      const { data, error } = await supabase
        .from("strategy_analyses")
        .insert({
          user_id: user.id,
          analysis_data: {
            name: saveName.trim(),
            metrics: backtestResult,
            file_name: file?.name,
            created_at: new Date().toISOString(),
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create new analysis object for local state
      const newAnalysis: SavedAnalysis = {
        id: data.id,
        name: saveName.trim(),
        createdAt: data.created_at,
        updatedAt: data.created_at,
        backtestResult,
        selectedStrategy,
        selectedAsset,
        csvContent,
        availableStrategies,
        availableAssets,
        totalTrades: backtestResult.trades?.length || 0
      };
      
      setSavedAnalyses(prev => [...prev, newAnalysis]);
      setCurrentAnalysisId(newAnalysis.id);
      setShowSaveModal(false);
      setSaveName('');
    } catch (error) {
      console.error("Error saving analysis:", error);
      setError("Erro ao salvar análise");
    }
  };

  const handleLoadAnalysis = async (analysis: SavedAnalysis) => {
    try {
      // If this is a database analysis, we need to load the full data
      if (!analysis.backtestResult || Object.keys(analysis.backtestResult).length === 0) {
        const { data, error } = await supabase
          .from("strategy_analyses")
          .select("*")
          .eq("id", analysis.id)
          .single();
          
        if (error) throw error;
        
        if (data && data.analysis_data && data.analysis_data.metrics) {
          // Update the backtestResult with the loaded metrics
          analysis.backtestResult = data.analysis_data.metrics;
        }
      }
      
      // Set the backtestResult state with the loaded data
      setBacktestResult(analysis.backtestResult);
      setSelectedStrategy(analysis.selectedStrategy);
      setSelectedAsset(analysis.selectedAsset);
      setCsvContent(analysis.csvContent);
      
      // Fix for loading saved files - ensure these arrays are properly set
      setAvailableStrategies(analysis.availableStrategies || []);
      setAvailableAssets(analysis.availableAssets || []);
      
      // Create a File object from the saved CSV content if available
      if (analysis.csvContent) {
        try {
          const blob = new Blob([analysis.csvContent], { type: 'text/csv' });
          const file = new File([blob], `${analysis.name}.csv`, { type: 'text/csv' });
          setFiles([file]);
          setFile(file);
        } catch (error) {
          console.error('Error creating file from saved content:', error);
        }
      }
      
      setCurrentAnalysisId(analysis.id);
      setShowUploadForm(false);
      setShowChat(true);
      setShowLoadModal(false);
      
      // Set filtered trades
      if (analysis.backtestResult.trades) {
        setFilteredTrades(analysis.backtestResult.trades);
      }
    } catch (error) {
      console.error("Error loading analysis:", error);
      setError("Erro ao carregar análise");
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from("strategy_analyses")
        .delete()
        .eq("id", analysisId);
        
      if (error) throw error;
      
      // Update local state
      setSavedAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      if (currentAnalysisId === analysisId) {
        setCurrentAnalysisId(null);
      }
      
      setSuccess("Análise excluída com sucesso");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting analysis:", error);
      setError("Erro ao excluir análise");
    }
  };

  const handleDeleteAllAnalyses = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Delete all analyses for this user
      const { error } = await supabase
        .from("strategy_analyses")
        .delete()
        .eq("user_id", user.id);
        
      if (error) throw error;
      
      // Update local state
      setSavedAnalyses([]);
      setCurrentAnalysisId(null);
      
      setSuccess("Todas as análises foram excluídas com sucesso");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting all analyses:", error);
      setError("Erro ao excluir todas as análises");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRenameAnalysis = (analysisId: string, currentName: string) => {
    setRenameAnalysisId(analysisId);
    setRenameName(currentName);
    setShowRenameModal(true);
  };

  const confirmRenameAnalysis = async () => {
    if (!renameAnalysisId || !renameName.trim()) return;
    
    try {
      // Get the analysis to update
      const analysis = savedAnalyses.find(a => a.id === renameAnalysisId);
      if (!analysis) return;
      
      // Update in database
      const { data, error } = await supabase
        .from("strategy_analyses")
        .select("*")
        .eq("id", renameAnalysisId)
        .single();
        
      if (error) throw error;
      
      const updatedData = {
        ...data.analysis_data,
        name: renameName.trim()
      };
      
      const { error: updateError } = await supabase
        .from("strategy_analyses")
        .update({ analysis_data: updatedData })
        .eq("id", renameAnalysisId);
        
      if (updateError) throw updateError;
      
      // Update local state
      setSavedAnalyses(prev => prev.map(analysis => 
        analysis.id === renameAnalysisId 
          ? { ...analysis, name: renameName.trim(), updatedAt: new Date().toISOString() }
          : analysis
      ));
      
      setShowRenameModal(false);
      setRenameAnalysisId(null);
      setRenameName('');
    } catch (error) {
      console.error("Error renaming analysis:", error);
      setError("Erro ao renomear análise");
    }
  };
  useEffect(() => {
  if (files.length > 0) {
    setSelectedFiles(files.map(f => f.name));
  }
}, [files]);

useEffect(() => {
  if (backtestResult && files.length > 1 && !showConsolidated) {
    // Lógica para modo individual (implementar quando necessário)
  }
}, [selectedFiles, showConsolidated, backtestResult, files]);

// 4. Adicione estas funções auxiliares:
const getFilteredBacktestResult = (): BacktestResult | null => {
  if (!backtestResult) return null;
  
  if (showConsolidated || files.length <= 1) {
    return backtestResult;
  }
  
  // Implementar filtro individual quando necessário
  return backtestResult;
};

const getActiveFilesInfo = () => {
  if (showConsolidated) {
    return {
      mode: 'Consolidado',
      description: `Análise consolidada de ${files.length} arquivo(s)`,
      fileCount: files.length
    };
  } else {
    return {
      mode: 'Individual', 
      description: `${selectedFiles.length} arquivo(s) selecionado(s)`,
      fileCount: selectedFiles.length
    };
  }
};

const handleResetFilters = () => {
  setSelectedFiles(files.map(f => f.name));
  setShowConsolidated(true);
  setIndividualAnalysisMode(false);
  setSelectedStrategy(null);
  setSelectedAsset(null);
  setTradeSearch('');
  
  // Recarregar dados no modo consolidado
  setTimeout(() => {
    reloadFilteredData();
  }, 100);
};
const reloadFilteredData = async () => {
  if (files.length === 0) return;
  
  try {
    setIsLoading(true);
    setError(null);
    
    let response;
    let data;
    
    // Se modo consolidado OU arquivo único, usa todos os arquivos
    if (showConsolidated || files.length === 1) {
      if (files.length === 1) {
        // Single file
        const formData = new FormData();
        formData.append('file', files[0]);
        
        response = await fetch('https://api.devhubtrader.com.br//api/tabela', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Multiple files consolidated
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        
        response = await fetch('https://api.devhubtrader.com.br//api/tabela-multipla', {
          method: 'POST',
          body: formData,
        });
      }
    } else {
      // Modo individual - usar apenas arquivos selecionados
      const selectedFileObjects = files.filter(file => 
        selectedFiles.includes(file.name)
      );
      
      if (selectedFileObjects.length === 0) {
        // Nenhum arquivo selecionado - limpar resultados
        setBacktestResult(null);
        setFilteredTrades([]);
        return;
      }
      
      const formData = new FormData();
      selectedFileObjects.forEach((file) => {
        formData.append('files', file);
      });
      
      response = await fetch('https://api.devhubtrader.com.br//api/tabela-multipla', {
        method: 'POST',
        body: formData,
      });
    }
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    data = await response.json();
    
    // Add emotional analysis if not present
    if (!data.emotionalAnalysis) {
      data.emotionalAnalysis = {
        stopDisciplineIndex: 85.7,
        dailyLossDisciplineIndex: 72.3,
        leverageDisciplineIndex: 91.2,
        furyProbability: 8.5
      };
    }
    
    setBacktestResult(data);
    
  } catch (err) {
    console.error('Error reloading filtered data:', err);
    setError(err instanceof Error ? err.message : 'Erro ao filtrar dados');
  } finally {
    setIsLoading(false);
  }
};

// 2. Adicione este useEffect para reagir a mudanças nos filtros de arquivo:
useEffect(() => {
  // Só recarrega se não estiver em upload e houver arquivos
  if (!showUploadForm && files.length > 0) {
    // Delay para evitar muitas chamadas seguidas
    const timeoutId = setTimeout(() => {
      reloadFilteredData();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }
}, [showConsolidated, selectedFiles, files.length]);

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/robots')}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Voltar para robôs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Análise de Backtest</h1>
            {currentAnalysisId && (
              <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded-full">
                Salvo
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {!showUploadForm && backtestResult && (
  <div className="bg-gray-800 rounded-lg p-3 mb-4 border-l-4 border-blue-500">
    <div className="flex items-center justify-between text-sm">
      <div className="text-gray-300">
        {showConsolidated 
          ? `📊 Mostrando análise consolidada de ${files.length} arquivo(s)`
          : `📁 Mostrando análise de ${selectedFiles.length} arquivo(s) selecionado(s)`
        }
        {selectedStrategy && ` | Estratégia: ${selectedStrategy}`}
        {selectedAsset && ` | Ativo: ${selectedAsset}`}
      </div>
      <div className="text-blue-400">
        {backtestResult["Performance Metrics"]?.["Total Trades"] || 0} trades
      </div>
    </div>
  </div>
)}
            
            <button
              onClick={() => setShowLoadModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Carregar Análise
              {savedAnalyses.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-800 text-blue-100 text-xs rounded-full">
                  {savedAnalyses.length}
                </span>
              )}
            </button>
            
            {!showUploadForm && (
              <>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Relatório
                </button>
                
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                  Analisar Outro Arquivo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Delete All Analyses Button */}
        {savedAnalyses.length > 0 && (
          <div className="mb-6">
            <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium">Você tem {savedAnalyses.length} análises salvas</p>
                  <p className="text-red-300 text-sm">Deseja excluir todas as análises para liberar espaço?</p>
                </div>
              </div>
              <button
                onClick={handleDeleteAllAnalyses}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md flex items-center"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Excluir Todas
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-md flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <p className="text-green-500">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Chat Section - Shown after CSV upload */}
        {showChat && (
          <PlanRestrictedSection 
            title="Chat com IA" 
            description="Consulte a IA para obter insights detalhados sobre seu backtest. Disponível apenas para usuários PRO."
            requiredPlan="Pro"
          >
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium">Chat com IA</h2>
                </div>
              </div>
              <div className="p-4 h-[600px]">
                <AIResponseChat 
                  isAnalyzing={isAnalyzing}
                  setIsAnalyzing={setIsAnalyzing}
                  onCancelAnalysis={() => {}}
                  error={error2}
                  setError={setError2}
                  analysisResult={analysisResult}
                  onMetricsReceived={handleMetricsReceived}
                  backtestData={backtestResult}
                />
              </div>
            </div>
          </PlanRestrictedSection>
        )}

        {/* Strategy and Asset Selector */}
       {!showUploadForm && (
  <StrategySelector
    selectedStrategy={selectedStrategy}
    setSelectedStrategy={setSelectedStrategy}
    selectedAsset={selectedAsset}
    setSelectedAsset={setSelectedAsset}
    availableStrategies={availableStrategies}
    availableAssets={availableAssets}
    setShowUploadForm={setShowUploadForm}
    
    // Novas props para filtro de arquivos
    files={files}
    selectedFiles={selectedFiles}
    setSelectedFiles={setSelectedFiles}
    showConsolidated={showConsolidated}
    setShowConsolidated={setShowConsolidated}
    onResetFilters={handleResetFilters}
  />
)}

        {/* Upload Form */}
        {showUploadForm ? (
          <BacktestUploadForm
            files={files}
            setFiles={setFiles}
            error={error}
            isLoading={isLoading}
            handleFileChange={handleFileChange}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleRemoveFile={handleRemoveFile}
            handleUpload={handleUpload}
            fileInputRef={fileInputRef}
          />
        ) : (
          <>
            {/* Results */}
            {backtestResult && (
              <div className="space-y-6">
                {/* Equity Curve Section - Available to all users */}
                <EquityCurveSection 
                  showEquityCurve={showEquityCurve}
                  setShowEquityCurve={setShowEquityCurve}
                  data={drata}

                />
                
                {/* Trades Section - Available to all users */}
                <TradesTable
                  sampleTrades={trades}
                  setShowTrades={setShowTrades}
                  filteredTrades={filteredTrades}
                  tradeSearch={tradeSearch}
                  setTradeSearch={setTradeSearch}
                  selectedAsset={selectedAsset}
                  setSelectedAsset={setSelectedAsset}
                  selectedStrategy={selectedStrategy}
                  setSelectedStrategy={setSelectedStrategy}
                  availableAssets={availableAssets}
                  availableStrategies={availableStrategies}
                />
                
                {/* Daily Analysis Section - PRO only */}
                <PlanRestrictedSection 
                  title="Análise Diár" 
                  description="Acesse análises detalhadas por dia da semana, mês e horário. Disponível apenas para usuários PRO."
                  requiredPlan="Pro"
                >
                  <DailyAnalysisSection
                    showDailyAnalysis={showDailyAnalysis}
                    setShowDailyAnalysis={setShowDailyAnalysis}
                    backtestResult={backtestResult}
                    tradesData={trades}
                  />
                </PlanRestrictedSection>
                
                {/* Metrics Dashboard - Available to all users */}
                <div>
                  <MetricsDashboard metrics={convertToMetricsDashboardFormat(backtestResult)}  tradeObject={trades}/>
                </div>
                
                {/* Emotional Profile Section - PRO only */}
                <PlanRestrictedSection 
                  title="Perfil Emocional" 
                  description="Analise seu perfil emocional de trading com métricas de disciplina e controle. Disponível apenas para usuários PRO."
                  requiredPlan="Pro"
                >
                  <EmotionalProfileSection 
                    emotionalMetrics={emocional}
                    showEmotionalProfile={showEmotionalProfile}
                    setShowEmotionalProfile={setShowEmotionalProfile}
                    
                  />
                </PlanRestrictedSection>
                
                {/* Daily Results Section - Starter plan and above */}
                
                {/* Special Events Section - PRO only */}
                <PlanRestrictedSection 
                  title="Eventos Especiais" 
                  description="Analise o impacto de eventos econômicos em seus resultados. Disponível apenas para usuários PRO."
                  requiredPlan="Pro"
                >
                  <SpecialEventsSection
                    showSpecialEvents={showSpecialEvents}
                    setShowSpecialEvents={setShowSpecialEvents}
                    tadesData={trades}
                    
                  />
                </PlanRestrictedSection>
                
                {/* Correlation Analysis Section - PRO only */}
                <PlanRestrictedSection 
                  title="Análise de Correlação" 
                  description="Compare a correlação entre diferentes estratégias para otimizar seu portfólio. Disponível apenas para usuários PRO."
                  requiredPlan="Pro"
                >
                   <SimpleCorrelationComponent
                      showCorrelation={showCorrelation}
                      setShowCorrelation={setShowCorrelation}
                      backtestResult={backtestResult}
                    />
                </PlanRestrictedSection>
              </div>
            )}
            

{/* Active Files Info */}
{files.length > 0 && (
  <ActiveFilesInfo
    {...getActiveFilesInfo()}
    files={files}
    selectedFiles={selectedFiles}
    backtestResult={getFilteredBacktestResult()}
    onReset={handleResetFilters}
  />
)}
          </>
        )}
      </div>

      {/* Modals */}
      <SaveAnalysisModal
        showSaveModal={showSaveModal}
        setShowSaveModal={setShowSaveModal}
        saveName={saveName}
        setSaveName={setSaveName}
        confirmSaveAnalysis={confirmSaveAnalysis}
      />
      
      <LoadAnalysisModal
        showLoadModal={showLoadModal}
        setShowLoadModal={setShowLoadModal}
        savedAnalyses={savedAnalyses}
        handleRenameAnalysis={handleRenameAnalysis}
        handleLoadAnalysis={handleLoadAnalysis}
        handleDeleteAnalysis={handleDeleteAnalysis}
      />
      
      <RenameAnalysisModal
        showRenameModal={showRenameModal}
        setShowRenameModal={setShowRenameModal}
        renameName={renameName}
        setRenameName={setRenameName}
        confirmRenameAnalysis={confirmRenameAnalysis}
        setRenameAnalysisId={setRenameAnalysisId}
      />
    </div>
  );
}
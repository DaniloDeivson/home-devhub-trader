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
import { IndividualResultsSection } from '../components/IndividualResultsSection';
import { supabase } from '../lib/supabase';
import { FileFilter } from '../components/FileFilter';
import { ActiveFilesInfo } from '../components/ActiveFilesInfo';
import { buildApiUrl } from '../config/api';

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
  strategy?: string; // Added strategy field
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
    "Max Drawdown (%)": number;
    "Max Drawdown Padronizado ($)": number;
    "Max Drawdown Padronizado (%)": number;
    "Max Consecutive Losses": number;
    "Max Consecutive Wins": number;
    "Max Trade Gain": number;
    "Max Trade Loss": number;
    "Recovery Factor": number;
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
  // Dados adicionais para recuperação completa
  files: File[];
  fileResults: {[key: string]: BacktestResult};
  individualAnalysisMode: boolean;
  showConsolidated: boolean;
  selectedFiles: string[]; // Adicionado selectedFiles
  trades: Trade[];
  filteredTrades: Trade[];
  tradeSearch: string;
  emocional: any;
  analysisResult: any;
  drata: any;
  // Estados de visualização
  showMetrics: boolean;
  showDailyResults: boolean;
  showDailyAnalysis: boolean;
  showTrades: boolean;
  showEquityCurve: boolean;
  showSpecialEvents: boolean;
  showCorrelation: boolean;
  showEmotionalProfile: boolean;
  showStrategySelector: boolean;
  showChat: boolean;
}

export function BacktestAnalysisPage() {
  const navigate = useNavigate();
  const { profile, updateTokenBalance } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
const [showConsolidated, setShowConsolidated] = useState(true);
const [fileResults, setFileResults] = useState<{[key: string]: BacktestResult}>({});
  const [individualAnalysisMode, setIndividualAnalysisMode] = useState(false);
  const [showIndividualResults, setShowIndividualResults] = useState(true);
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
  // Estado para dados de correlação original (não afetados por filtros)
  const [originalCorrelationData, setOriginalCorrelationData] = useState<any>(null);
  const [recalculatedMetrics, setRecalculatedMetrics] = useState<any>(null);
  const [error2, setError2] = useState<string | null>(null);
  
  // useEffect para recalcular métricas quando necessário
  useEffect(() => {
    const recalculateMetrics = async () => {
      // Só recalcular se há fileResults e estamos no modo consolidado ou com estratégias selecionadas
      if (!fileResults || Object.keys(fileResults).length === 0) {
        setRecalculatedMetrics(null);
        return;
      }

      let allTrades: any[] = [];
      
      // Determinar quais trades consolidar
      if (!showConsolidated && selectedFiles.length > 0) {
        // Modo individual com estratégias selecionadas
        selectedFiles.forEach(fileName => {
          const strategyData = fileResults[fileName];
          if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
            allTrades.push(...strategyData.trades);
          }
        });
      } else if (!selectedStrategy) {
        // Modo consolidado (todos os CSVs)
        Object.keys(fileResults).forEach(fileName => {
          const strategyData = fileResults[fileName];
          if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
            allTrades.push(...strategyData.trades);
          }
        });
      }

      // Só recalcular se há trades para processar
      if (allTrades.length === 0) {
        setRecalculatedMetrics(null);
        return;
      }

      try {
        console.log('📊 Recalculando métricas com dados consolidados:', allTrades.length, 'trades');
        
        const response = await fetch(buildApiUrl('/api/trades/metrics-from-data'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ trades: allTrades }),
        });

        if (response.ok) {
          const recalculatedData = await response.json();
          setRecalculatedMetrics(recalculatedData);
          
          console.log('📊 Métricas recalculadas com sucesso:', {
            sharpeRatio: recalculatedData.metricas_principais?.sharpe_ratio,
            profitFactor: recalculatedData.metricas_principais?.fator_lucro,
            totalTrades: allTrades.length
          });
        } else {
          console.error('❌ Erro ao recalcular métricas:', response.status);
          setRecalculatedMetrics(null);
        }
      } catch (error) {
        console.error('❌ Erro ao recalcular métricas:', error);
        setRecalculatedMetrics(null);
      }
    };

    recalculateMetrics();
  }, [fileResults, showConsolidated, selectedFiles, selectedStrategy]);
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
          const analyses: SavedAnalysis[] = data.map(item => {
            const analysisData = item.analysis_data || {};
            return {
              id: item.id,
              name: analysisData.name || `Análise ${item.id.slice(0, 8)}`,
              createdAt: item.created_at,
              updatedAt: item.updated_at || item.created_at,
              backtestResult: analysisData.metrics || {},
              selectedStrategy: analysisData.selectedStrategy || null,
              selectedAsset: analysisData.selectedAsset || null,
              csvContent: analysisData.csvContent || null,
              availableStrategies: analysisData.availableStrategies || [],
              availableAssets: analysisData.availableAssets || [],
              totalTrades: analysisData.trades?.length || analysisData.metrics?.trades?.length || analysisData.metrics?.["Performance Metrics"]?.["Total Trades"] || 0,
              // Dados adicionais
              files: analysisData.files || [],
              fileResults: analysisData.fileResults || {},
              individualAnalysisMode: analysisData.individualAnalysisMode ?? false,
              showConsolidated: analysisData.showConsolidated ?? true,
              trades: analysisData.trades || [],
              filteredTrades: analysisData.filteredTrades || [],
              tradeSearch: analysisData.tradeSearch || '',
              emocional: analysisData.emocional || null,
              analysisResult: analysisData.analysisResult || null,
              drata: analysisData.drata || null,
              // Estados de visualização
              showMetrics: analysisData.showMetrics ?? true,
              showDailyResults: analysisData.showDailyResults ?? false,
              showDailyAnalysis: analysisData.showDailyAnalysis ?? true,
              showTrades: analysisData.showTrades ?? false,
              showEquityCurve: analysisData.showEquityCurve ?? true,
              showSpecialEvents: analysisData.showSpecialEvents ?? false,
              showCorrelation: analysisData.showCorrelation ?? false,
              showEmotionalProfile: analysisData.showEmotionalProfile ?? false,
              showStrategySelector: analysisData.showStrategySelector ?? true,
              showChat: analysisData.showChat ?? true
            };
          });
          
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
      trades = trades.filter(trade => 
        trade.strategy === selectedStrategy
      );
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
        (trade.strategy && trade.strategy.toLowerCase().includes(searchLower)) ||
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

  // Atualizar estratégias disponíveis baseadas nos dados do backend
  useEffect(() => {
    if (backtestResult?.trades) {
      const strategies = [...new Set(backtestResult.trades.map(trade => trade.strategy).filter(Boolean))];
      setAvailableStrategies(strategies);
    }
  }, [backtestResult?.trades]);

  // Atualizar ativos disponíveis baseadas nos dados do backend
  useEffect(() => {
    if (backtestResult?.trades) {
      const assets = [...new Set(backtestResult.trades.map(trade => trade.symbol).filter(Boolean))];
      setAvailableAssets(assets);
    }
  }, [backtestResult?.trades]);

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
    const correlationData = null;

    if (files.length === 1) {
      // Single file - use original API
      const fileContent = await readFileAsText(files[0]);
      setCsvContent(fileContent);

      const formData = new FormData();
      formData.append('file', files[0]);

      response = await fetch(buildApiUrl('/api/tabela'), {
        method: 'POST',
        body: formData,
      });
     
    // Implement your fetch emotional profile logic here
    try {
      const wwx = await fetch(buildApiUrl('/api/disciplina-completa'), {
        method: 'POST', 
        body: formData
      });
      
      const responses = await fetch(buildApiUrl('/api/trades'), {
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
      
      const parsedTrades = Array.isArray(datara) ? datara : (datara?.trades || []);
        setTrades(parsedTrades);
    } catch (error) {
      console.error('Error fetching emotional data:', error);
      setEmocional(null);
    }

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      data = await response.json();
      
      // Para 1 arquivo, não há correlação, mas podemos definir dados vazios
      data.dateDirectionCorrelation = {
        correlacao_data_direcao: {
          resumo: { erro: "Correlação requer pelo menos 2 arquivos" }
        },
        correlacao_data_resultado: {
          resumo: { erro: "Correlação requer pelo menos 2 arquivos" }
        },
        info_arquivos: {
          total_arquivos: 1,
          nomes_arquivos: [files[0].name],
          tipo_analise: "insuficiente"
        }
      };
      
      setDrata(data);
      
      console.log(JSON.stringify(data.EquityCurveData))
    } else if (files.length >= 2) {
    try {
      let correlationData = null;
      let dateDirectionData = null;
      
      // 1. Correlação tradicional (apenas para 2 arquivos)
      // Criar FormData para todos os casos
      const formDataCorrelacao = new FormData();
      files.forEach((file) => {
        formDataCorrelacao.append('files', file);
      });

      // Variáveis para dados individuais (para 2 arquivos)
      let data1, data2;

      if (files.length === 2) {
        // Análises individuais primeiro
        const [response1, response2] = await Promise.all([
          fetch(buildApiUrl('/api/tabela'), {
            method: 'POST',
            body: createFormData(files[0])
          }),
          fetch(buildApiUrl('/api/tabela'), {
            method: 'POST', 
            body: createFormData(files[1])
          })
        ]);

        [data1, data2] = await Promise.all([
          response1.json(),
          response2.json()
        ]);

        // Correlação principal - usar FormData em vez de JSON
        const correlationResponse = await fetch(buildApiUrl('/api/correlacao'), {
          method: 'POST',
          body: formDataCorrelacao
        });

        if (correlationResponse.ok) {
          const correlationResult = await correlationResponse.json();
          correlationData = correlationResult;
          dateDirectionData = correlationResult;
        }
      }

      // 3. Análise consolidada principal com resultados individuais
      const consolidatedResponse = await fetch(buildApiUrl('/api/tabela-multipla'), {
        method: 'POST',
        body: formDataCorrelacao, // Mesmo FormData
      });
      try {
        const wwx = await fetch(buildApiUrl('/api/disciplina-completa'), {
          method: 'POST', 
          body: formDataCorrelacao
        });
        
        const responses = await fetch(buildApiUrl('/api/trades'), {
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
        
        const parsedTrades = Array.isArray(datara) ? datara : (datara?.trades || []);
        setTrades(parsedTrades);
      } catch (error) {
        console.error('Error fetching emotional data:', error);
        setEmocional(null);
      }
      if (!consolidatedResponse.ok) {
        throw new Error('Erro na análise consolidada');
      }

      const responseData = await consolidatedResponse.json();
      
      // Processar novos dados com resultados individuais
      if (responseData.consolidado && responseData.individuais) {
        // Salvar resultados individuais
        setFileResults(responseData.individuais);
        
        // Usar dados consolidados como principal
        data = responseData.consolidado;
        
        console.log('📊 Resultados individuais processados:', Object.keys(responseData.individuais));
      } else {
        // Fallback para formato antigo
        data = responseData;

      }
      
      setDrata(data);

      // 4. ADICIONAR DADOS DE CORRELAÇÃO (CÓDIGO CORRIGIDO)
      if (correlationData && files.length === 2) {
        data.correlationAnalysis = correlationData.correlation_analysis;
        data.correlationMetadata = correlationData.metadata;
        data.individualResults = {
          file1: { name: files[0].name, data: data1 },
          file2: { name: files[1].name, data: data2 }
        };
        // Salvar dados de correlação original (não afetados por filtros)
        setOriginalCorrelationData({
          correlationAnalysis: correlationData.correlation_analysis,
          correlationMetadata: correlationData.metadata,
          dateDirectionCorrelation: dateDirectionData
        });
        console.log('📊 Correlação tradicional adicionada (2 arquivos)');
      } else if (files.length >= 3) {
        // Para 3+ arquivos, chamar API de correlação matricial
        try {
                  const correlationResponse = await fetch(buildApiUrl('/api/correlacao'), {
          method: 'POST',
          body: formDataCorrelacao
        });

          if (correlationResponse.ok) {
            const correlationResult = await correlationResponse.json();
            data.correlationMatricial = correlationResult;
            data.dateDirectionCorrelation = correlationResult;
            // Salvar dados de correlação original (não afetados por filtros)
            setOriginalCorrelationData({
              correlationMatricial: correlationResult,
              dateDirectionCorrelation: correlationResult
            });
            console.log(`📊 Análise matricial adicionada (${files.length} arquivos)`);
          }
        } catch (error) {
          console.error('Erro ao chamar API de correlação matricial:', error);
        }
      }

      // Adicionar dados de correlação por data/direção para todos os casos
      if (dateDirectionData) {
        if (data) {
          data.dateDirectionCorrelation = dateDirectionData;
          console.log(`📅 Correlação data/direção adicionada (${files.length} arquivos)`);
        }
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

      // Para 3+ arquivos, fazer correlação matricial
      let correlationData = null;
      try {
        const correlationResponse = await fetch(buildApiUrl('/api/correlacao'), {
          method: 'POST',
          body: formData
        });

        if (correlationResponse.ok) {
          correlationData = await correlationResponse.json();
          // Salvar dados de correlação original (não afetados por filtros)
          setOriginalCorrelationData({
            correlationMatricial: correlationData,
            dateDirectionCorrelation: correlationData
          });
          console.log('📊 Correlação matricial obtida para 3+ arquivos');
        }
      } catch (error) {
        console.error('Erro ao chamar API de correlação:', error);
      }

      response = await fetch(buildApiUrl('/api/tabela-multipla'), {
        method: 'POST',
        body: formData,
      });
      
      try {
        const wwx = await fetch(buildApiUrl('/api/disciplina-completa'), {
          method: 'POST', 
          body: formData
        });
        
        const responses = await fetch(buildApiUrl('/api/trades'), {
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
        
        const parsedTrades = Array.isArray(datara) ? datara : (datara?.trades || []);
        setTrades(parsedTrades);
      } catch (error) {
        console.error('Error fetching emotional data:', error);
        setEmocional(null);
      }

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      data = await response.json();
      
      // Adicionar dados de correlação matricial
      if (correlationData) {
        data.correlationMatricial = correlationData;
        data.dateDirectionCorrelation = correlationData;
      }
      
      setDrata(data);
      
      setCsvContent(`Análise consolidada de ${files.length} arquivos: ${files.map(f => f.name).join(', ')}`);
    }
    
    // Add emotional analysis data if not present
    if (data && !data.emotionalAnalysis) {
      data.emotionalAnalysis = {
        stopDisciplineIndex: 85.7,
        dailyLossDisciplineIndex: 72.3,
        leverageDisciplineIndex: 91.2,
        furyProbability: 8.5
      };
    }
    
    // Process and set the result
    if (data) {
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
    }
    
    // Update available strategies based on file names (keep full names for fileResults lookup)
    setAvailableStrategies(files.map(file => file.name));
    
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
    // Limpar dados de correlação original
    setOriginalCorrelationData(null);
    setRecalculatedMetrics(null);
    
    // Resetar estados de visualização
    setShowMetrics(true);
    setShowDailyResults(false);
    setShowDailyAnalysis(true);
    setShowTrades(false);
    setShowEquityCurve(true);
    setShowSpecialEvents(false);
    setShowCorrelation(false);
    setShowEmotionalProfile(false);
    setShowStrategySelector(true);
    
    // Resetar dados de análise
    setTrades([]);
    setEmocional(null);
    setAnalysisResult(null);
    setDrata(null);
    setCsvContent(null);
    setTradeSearch('');
    
    // Resetar seleções
    setSelectedStrategy(null);
    setSelectedAsset(null);
    setAvailableStrategies(['Estratégia 1', 'Estratégia 2', 'Estratégia 3']);
    setAvailableAssets(['WINFUT', 'WDOFUT', 'PETR4', 'VALE3']);
    
    // Resetar estados de análise
    setIndividualAnalysisMode(false);
    setShowConsolidated(true);
    setSelectedFiles([]);
    setFileResults({});
    
    // Resetar input de arquivo
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
    
    console.log('🔍 convertToMetricsDashboardFormat - Performance Metrics:', {
      payoff: perfMetrics["Payoff"],
      averageWin: perfMetrics["Average Win"],
      averageLoss: perfMetrics["Average Loss"],
      profitFactor: perfMetrics["Profit Factor"]
    });
    
    return {
      profitFactor: perfMetrics["Profit Factor"] ?? 0,
      winRate: perfMetrics["Win Rate (%)"] ?? 0,
      payoff: perfMetrics["Payoff"] ?? 0,
      maxDrawdown: perfMetrics["Max Drawdown (%)"] ?? 0,
      maxDrawdownAmount: perfMetrics["Max Drawdown ($)"] ?? 0,
      // PADRONIZAÇÃO: Valores padronizados
      maxDrawdownPadronizado: perfMetrics["Max Drawdown Padronizado ($)"] ?? perfMetrics["Max Drawdown ($)"] ?? 0,
      maxDrawdownPctPadronizado: perfMetrics["Max Drawdown Padronizado (%)"] ?? perfMetrics["Max Drawdown (%)"] ?? 0,
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
      maxConsecutiveLosses: perfMetrics["Max Consecutive Losses"] ?? 0,
      maxConsecutiveWins: perfMetrics["Max Consecutive Wins"] ?? 0,
      maiorGanho: perfMetrics["Max Trade Gain"] ?? 0,
      maiorPerda: perfMetrics["Max Trade Loss"] ?? 0,
      recoveryFactor: perfMetrics["Recovery Factor"] ?? 0
    };
  };

  const handleMetricsReceived = (metrics: any) => {
    console.log("Metrics received from chat:", metrics);
    setAnalysisResult(metrics);
  };

  // Save system functions
  const handleSaveAnalysis = async () => {
    if (!backtestResult) {
      setError("Nenhum resultado de backtest disponível para salvar");
      return;
    }
    
    if (currentAnalysisId) {
      try {
        // Update existing analysis in database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        
        // Preparar dados completos para salvamento
        const completeAnalysisData = {
          name: savedAnalyses.find(a => a.id === currentAnalysisId)?.name,
          metrics: backtestResult,
          file_name: file?.name,
          created_at: new Date().toISOString(),
          // Dados adicionais para recuperação completa
          files: files,
          fileResults: fileResults,
          individualAnalysisMode: individualAnalysisMode,
          showConsolidated: showConsolidated,
          trades: trades,
          filteredTrades: filteredTrades,
          tradeSearch: tradeSearch,
          emocional: emocional,
          analysisResult: analysisResult,
          drata: drata,
          selectedStrategy: selectedStrategy,
          selectedAsset: selectedAsset,
          csvContent: csvContent,
          availableStrategies: availableStrategies,
          availableAssets: availableAssets,
          // Estados de visualização
          showMetrics: showMetrics,
          showDailyResults: showDailyResults,
          showDailyAnalysis: showDailyAnalysis,
          showTrades: showTrades,
          showEquityCurve: showEquityCurve,
          showSpecialEvents: showSpecialEvents,
          showCorrelation: showCorrelation,
          showEmotionalProfile: showEmotionalProfile,
          showStrategySelector: showStrategySelector,
          showChat: showChat
        };
        
        const { error } = await supabase
          .from("strategy_analyses")
          .update({ 
            analysis_data: completeAnalysisData
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
                availableAssets,
                totalTrades: trades.length || backtestResult.trades?.length || 0,
                files,
                fileResults,
                individualAnalysisMode,
                showConsolidated,
                trades,
                filteredTrades,
                tradeSearch,
                emocional,
                analysisResult,
                drata,
                showMetrics,
                showDailyResults,
                showDailyAnalysis,
                showTrades,
                showEquityCurve,
                showSpecialEvents,
                showCorrelation,
                showEmotionalProfile,
                showStrategySelector,
                showChat
              }
            : analysis
        ));
        
        setSuccess("Análise atualizada com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
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
      
      // Preparar dados completos para salvamento
      const completeAnalysisData = {
        name: saveName.trim(),
        metrics: backtestResult,
        file_name: file?.name,
        created_at: new Date().toISOString(),
        // Dados adicionais para recuperação completa
        files: files,
        fileResults: fileResults,
        individualAnalysisMode: individualAnalysisMode,
        showConsolidated: showConsolidated,
        selectedFiles: selectedFiles, // Adicionado selectedFiles
        trades: trades,
        filteredTrades: filteredTrades,
        tradeSearch: tradeSearch,
        emocional: emocional,
        analysisResult: analysisResult,
        drata: drata,
        selectedStrategy: selectedStrategy,
        selectedAsset: selectedAsset,
        csvContent: csvContent,
        availableStrategies: availableStrategies,
        availableAssets: availableAssets,
        // Estados de visualização
        showMetrics: showMetrics,
        showDailyResults: showDailyResults,
        showDailyAnalysis: showDailyAnalysis,
        showTrades: showTrades,
        showEquityCurve: showEquityCurve,
        showSpecialEvents: showSpecialEvents,
        showCorrelation: showCorrelation,
        showEmotionalProfile: showEmotionalProfile,
        showStrategySelector: showStrategySelector,
        showChat: showChat
      };
      
      // Save to database
      const { data, error } = await supabase
        .from("strategy_analyses")
        .insert({
          user_id: user.id,
          analysis_data: completeAnalysisData
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
        totalTrades: trades.length || backtestResult.trades?.length || 0,
        // Dados adicionais
        files,
        fileResults,
        individualAnalysisMode,
        showConsolidated,
        selectedFiles, // Adicionado selectedFiles
        trades,
        filteredTrades,
        tradeSearch,
        emocional,
        analysisResult,
        drata,
        // Estados de visualização
        showMetrics,
        showDailyResults,
        showDailyAnalysis,
        showTrades,
        showEquityCurve,
        showSpecialEvents,
        showCorrelation,
        showEmotionalProfile,
        showStrategySelector,
        showChat
      };
      
      setSavedAnalyses(prev => [...prev, newAnalysis]);
      setCurrentAnalysisId(newAnalysis.id);
      setShowSaveModal(false);
      setSaveName('');
      setSuccess("Relatório salvo com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving analysis:", error);
      setError("Erro ao salvar relatório");
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
        
        if (data && data.analysis_data) {
          // Restaurar todos os dados salvos
          const savedData = data.analysis_data;
          
          // Dados principais
          setBacktestResult(savedData.metrics || analysis.backtestResult);
          setSelectedStrategy(savedData.selectedStrategy || analysis.selectedStrategy);
          setSelectedAsset(savedData.selectedAsset || analysis.selectedAsset);
          setCsvContent(savedData.csvContent || analysis.csvContent);
          setAvailableStrategies(savedData.availableStrategies || analysis.availableStrategies || []);
          setAvailableAssets(savedData.availableAssets || analysis.availableAssets || []);
          
          // Dados adicionais
          setFiles(savedData.files || analysis.files || []);
          setFileResults(savedData.fileResults || analysis.fileResults || {});
          setIndividualAnalysisMode(savedData.individualAnalysisMode ?? analysis.individualAnalysisMode ?? false);
          setShowConsolidated(savedData.showConsolidated ?? analysis.showConsolidated ?? true);
          setSelectedFiles(savedData.selectedFiles || analysis.selectedFiles || []); // Adicionado selectedFiles
          setTrades(savedData.trades || analysis.trades || []);
          setFilteredTrades(savedData.filteredTrades || analysis.filteredTrades || []);
          setTradeSearch(savedData.tradeSearch || analysis.tradeSearch || '');
          setEmocional(savedData.emocional || analysis.emocional || null);
          setAnalysisResult(savedData.analysisResult || analysis.analysisResult || null);
          setDrata(savedData.drata || analysis.drata || null);
          
          // Estados de visualização
          setShowMetrics(savedData.showMetrics ?? analysis.showMetrics ?? true);
          setShowDailyResults(savedData.showDailyResults ?? analysis.showDailyResults ?? false);
          setShowDailyAnalysis(savedData.showDailyAnalysis ?? analysis.showDailyAnalysis ?? true);
          setShowTrades(savedData.showTrades ?? analysis.showTrades ?? false);
          setShowEquityCurve(savedData.showEquityCurve ?? analysis.showEquityCurve ?? true);
          setShowSpecialEvents(savedData.showSpecialEvents ?? analysis.showSpecialEvents ?? false);
          setShowCorrelation(savedData.showCorrelation ?? analysis.showCorrelation ?? false);
          setShowEmotionalProfile(savedData.showEmotionalProfile ?? analysis.showEmotionalProfile ?? false);
          setShowStrategySelector(savedData.showStrategySelector ?? analysis.showStrategySelector ?? true);
          setShowChat(savedData.showChat ?? analysis.showChat ?? true);
        }
      } else {
        // Restaurar dados do objeto analysis (para análises já carregadas)
        setBacktestResult(analysis.backtestResult);
        setSelectedStrategy(analysis.selectedStrategy);
        setSelectedAsset(analysis.selectedAsset);
        setCsvContent(analysis.csvContent);
        setAvailableStrategies(analysis.availableStrategies || []);
        setAvailableAssets(analysis.availableAssets || []);
        
        // Dados adicionais
        setFiles(analysis.files || []);
        setFileResults(analysis.fileResults || {});
        setIndividualAnalysisMode(analysis.individualAnalysisMode ?? false);
        setShowConsolidated(analysis.showConsolidated ?? true);
        setSelectedFiles(analysis.selectedFiles || []); // Adicionado selectedFiles
        setTrades(analysis.trades || []);
        setFilteredTrades(analysis.filteredTrades || []);
        setTradeSearch(analysis.tradeSearch || '');
        setEmocional(analysis.emocional || null);
        setAnalysisResult(analysis.analysisResult || null);
        setDrata(analysis.drata || null);
        
        // Estados de visualização
        setShowMetrics(analysis.showMetrics ?? true);
        setShowDailyResults(analysis.showDailyResults ?? false);
        setShowDailyAnalysis(analysis.showDailyAnalysis ?? true);
        setShowTrades(analysis.showTrades ?? false);
        setShowEquityCurve(analysis.showEquityCurve ?? true);
        setShowSpecialEvents(analysis.showSpecialEvents ?? false);
        setShowCorrelation(analysis.showCorrelation ?? false);
        setShowEmotionalProfile(analysis.showEmotionalProfile ?? false);
        setShowStrategySelector(analysis.showStrategySelector ?? true);
        setShowChat(analysis.showChat ?? true);
      }
      
      // Create a File object from the saved CSV content if no files were restored
      if (analysis.csvContent && (!analysis.files || analysis.files.length === 0)) {
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
      setShowLoadModal(false);
      
      setSuccess("Relatório carregado com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error loading analysis:", error);
      setError("Erro ao carregar relatório");
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
  // Não recarregar se estiver carregando uma análise salva
  if (currentAnalysisId) {
    console.log('Skipping reloadFilteredData - loading saved analysis');
    return;
  }
  
  if (files.length === 0) {
    console.log('Skipping reloadFilteredData - no files available');
    return;
  }
  
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
        
        response = await fetch(buildApiUrl('/api/tabela'), {
          method: 'POST',
          body: formData,
        });
      } else {
        // Multiple files consolidated
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        
        response = await fetch(buildApiUrl('/api/tabela-multipla'), {
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
      
      response = await fetch(buildApiUrl('/api/tabela-multipla'), {
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
  // Só recarrega se não estiver em upload, houver arquivos e não for um carregamento de análise salva
  if (!showUploadForm && files.length > 0 && !currentAnalysisId) {
    // Delay para evitar muitas chamadas seguidas
    const timeoutId = setTimeout(() => {
      reloadFilteredData();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }
}, [showConsolidated, selectedFiles, files.length, currentAnalysisId]);

  // Wrapper para setSelectedStrategy com log
  const handleSetSelectedStrategy = (strategy: string | null) => {
    console.log('🔍 setSelectedStrategy chamado:', {
      newValue: strategy,
      previousValue: selectedStrategy
    });
    setSelectedStrategy(strategy);
  };
  
  // Monitorar mudanças no selectedStrategy
  useEffect(() => {
    console.log('🔄 selectedStrategy mudou:', selectedStrategy);
  }, [selectedStrategy]);

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
                  onClick={handleSaveAnalysis}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Relatório
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
    setSelectedStrategy={handleSetSelectedStrategy}
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
    
    // Props para dados de trades para extrair ativos dinamicamente
    trades={trades}
    fileResults={fileResults}
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
                {(() => {
                  // 🎯 CALCULAR MÉTRICAS CONSOLIDADAS PARA EQUITY CURVE SECTION
                  let consolidatedMetricsForEquity = undefined;
                  
                  if (showConsolidated && fileResults && Object.keys(fileResults).length > 1) {
                    console.log('🔧 CALCULANDO MÉTRICAS CONSOLIDADAS PARA EQUITY CURVE SECTION');
                    
                    const allTrades: any[] = [];
                    
                    // Coletar todos os trades de todas as estratégias
                    Object.keys(fileResults).forEach(fileName => {
                      const strategyData = fileResults[fileName];
                      if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
                        allTrades.push(...strategyData.trades);
                      }
                    });
                    
                    console.log(`📊 Total de trades coletados para Equity Curve: ${allTrades.length}`);
                    
                    if (allTrades.length > 0) {
                      // Ordenar trades cronologicamente
                      const sortedTrades = allTrades.sort((a, b) => {
                        const dateA = new Date(a.exit_date || a.entry_date || a.date);
                        const dateB = new Date(b.exit_date || b.entry_date || b.date);
                        return dateA.getTime() - dateB.getTime();
                      });
                      
                      // Calcular métricas consolidadas usando metodologia Python
                      let equity = 0.0;
                      let peak = 0.0;
                      let maxDrawdown = 0.0;
                      let totalProfit = 0.0;
                      let grossProfit = 0.0;
                      let grossLoss = 0.0;
                      let profitableTrades = 0;
                      let lossTrades = 0;
                      
                      sortedTrades.forEach((trade) => {
                        const pnl = trade.pnl || 0;
                        totalProfit += pnl;
                        
                        if (pnl > 0) {
                          grossProfit += pnl;
                          profitableTrades++;
                        } else {
                          grossLoss += Math.abs(pnl);
                          lossTrades++;
                        }
                        
                        equity += pnl; // cumsum()
                        if (equity > peak) {
                          peak = equity; // cummax()
                        }
                        const drawdown = peak - equity; // saldo_maximo - saldo_atual
                        if (drawdown > maxDrawdown) {
                          maxDrawdown = drawdown;
                        }
                      });
                      
                      // Calcular métricas derivadas
                      const totalTrades = sortedTrades.length;
                      const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
                      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
                      const roi = totalProfit / 100000 * 100; // Assumindo investimento de R$ 100.000
                      
                      consolidatedMetricsForEquity = {
                        resultado: totalProfit,
                        maxDrawdown: maxDrawdown,
                        maxDrawdownPercent: peak > 0 ? (maxDrawdown / peak) * 100 : 0,
                        avgDrawdown: 0, // Será calculado se necessário
                        fatorLucro: profitFactor,
                        winRate: winRate,
                        roi: roi,
                        pontosComDados: totalTrades
                      };
                      
                      console.log('✅ MÉTRICAS CONSOLIDADAS CALCULADAS PARA EQUITY CURVE:', {
                        resultado: totalProfit,
                        maxDrawdown: maxDrawdown,
                        maxDrawdownPercent: peak > 0 ? (maxDrawdown / peak) * 100 : 0,
                        fatorLucro: profitFactor,
                        winRate: winRate,
                        roi: roi,
                        totalTrades: totalTrades
                      });
                    }
                  }
                  
                  return (
                    <EquityCurveSection 
                      showEquityCurve={showEquityCurve}
                      setShowEquityCurve={setShowEquityCurve}
                      selectedStrategy={selectedStrategy}
                      selectedAsset={selectedAsset}
                      fileResults={fileResults}
                      data={drata}
                      showConsolidated={showConsolidated}
                      selectedFiles={selectedFiles}
                      files={files}
                      consolidatedMetrics={consolidatedMetricsForEquity}
                    />
                  );
                })()}
                
                {/* Debug: Verificar dados passados */}
                {Object.keys(fileResults).length > 0 && (
                  <div className="bg-green-900 bg-opacity-20 border border-green-800 rounded-lg p-2 mb-4 text-xs">
                    <p className="text-green-300">
                      🔍 Debug: fileResults com {Object.keys(fileResults).length} arquivos
                    </p>
                    <p className="text-green-300">
                      🎯 selectedStrategy: {selectedStrategy || 'null'}
                    </p>
                    <p className="text-green-300">
                      📁 Arquivos: {Object.keys(fileResults).join(', ')}
                    </p>
                    <p className="text-green-300">
                      🎛️ availableStrategies: {availableStrategies.join(', ')}
                    </p>
                    <p className="text-green-300">
                      📊 showConsolidated: {showConsolidated ? 'true' : 'false'}
                    </p>
                    <p className="text-green-300">
                      📁 selectedFiles: {selectedFiles.join(', ')}
                    </p>
                    <p className="text-green-300">
                      📁 files: {files.length} arquivos
                    </p>
                  </div>
                )}
                
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
                    tradesData={{ trades }}
                    fileResults={fileResults}
                  />
                </PlanRestrictedSection>
                
                {/* Metrics Dashboard - Available to all users */}
                <div>
                  {(() => {
                    // 🎯 CORREÇÃO: Usar sempre os dados corretos da API
                    let metricsToUse = convertToMetricsDashboardFormat(backtestResult);
                    let tradesToUse = { trades: Array.isArray(trades) ? trades : [] };
                    
                    console.log('🔍 MetricsDashboard - Verificando dados:', {
                      selectedStrategy,
                      hasFileResults: !!fileResults,
                      fileResultsKeys: fileResults ? Object.keys(fileResults) : [],
                      backtestResultKeys: backtestResult ? Object.keys(backtestResult) : []
                    });
                    
                    // 🎯 CORREÇÃO: Sempre usar dados da API para garantir consistência
                    console.log('✅ Usando dados corretos da API para MetricsDashboard');
                    
                    // Se há estratégia específica selecionada, usar dados dessa estratégia
                    if (selectedStrategy && fileResults && Object.keys(fileResults).length > 0) {
                      console.log('✅ Entrou na condição para buscar dados da estratégia');
                      
                      // Tentar encontrar o arquivo correspondente à estratégia
                      const strategyFileName = selectedStrategy;
                      const strategyFileNameWithCsv = `${selectedStrategy}.csv`;
                      
                      console.log('🔍 Procurando estratégia:', {
                        strategyFileName,
                        strategyFileNameWithCsv,
                        availableFiles: Object.keys(fileResults),
                        selectedStrategy
                      });
                      
                      // Verificar se existe o arquivo exato
                      if (fileResults[strategyFileName]) {
                        console.log('✅ Encontrado arquivo exato:', strategyFileName);
                        metricsToUse = convertToMetricsDashboardFormat(fileResults[strategyFileName]);
                        const strategyTrades = fileResults[strategyFileName].trades;
                        tradesToUse = { trades: Array.isArray(strategyTrades) ? strategyTrades : [] };
                        
                        console.log('📊 Métricas da estratégia:', {
                          winRate: metricsToUse.winRate,
                          profitFactor: metricsToUse.profitFactor,
                          maxDrawdown: metricsToUse.maxDrawdown,
                          totalTrades: metricsToUse.totalTrades
                        });
                      }
                      // Verificar se existe com extensão .csv
                      else if (fileResults[strategyFileNameWithCsv]) {
                        console.log('✅ Encontrado arquivo com .csv:', strategyFileNameWithCsv);
                        metricsToUse = convertToMetricsDashboardFormat(fileResults[strategyFileNameWithCsv]);
                        const strategyTrades = fileResults[strategyFileNameWithCsv].trades;
                        tradesToUse = { trades: Array.isArray(strategyTrades) ? strategyTrades : [] };
                        
                        console.log('📊 Métricas da estratégia:', {
                          winRate: metricsToUse.winRate,
                          profitFactor: metricsToUse.profitFactor,
                          maxDrawdown: metricsToUse.maxDrawdown,
                          totalTrades: metricsToUse.totalTrades
                        });
                      }
                      // Procurar por arquivos que contenham o nome da estratégia
                      else {
                        const matchingFiles = Object.keys(fileResults).filter(fileName => 
                          fileName.toLowerCase().includes(selectedStrategy.toLowerCase()) ||
                          fileName.toLowerCase().replace('.csv', '').includes(selectedStrategy.toLowerCase())
                        );
                        
                        console.log('🔍 Arquivos que correspondem:', matchingFiles);
                        
                        if (matchingFiles.length > 0) {
                          console.log('✅ Encontrado arquivo similar:', matchingFiles[0]);
                          metricsToUse = convertToMetricsDashboardFormat(fileResults[matchingFiles[0]]);
                          const strategyTrades = fileResults[matchingFiles[0]].trades;
                          tradesToUse = { trades: Array.isArray(strategyTrades) ? strategyTrades : [] };
                          
                          console.log('📊 Métricas da estratégia:', {
                            winRate: metricsToUse.winRate,
                            profitFactor: metricsToUse.profitFactor,
                            maxDrawdown: metricsToUse.maxDrawdown,
                            totalTrades: metricsToUse.totalTrades
                          });
                        } else {
                          console.log('❌ Nenhum arquivo encontrado para estratégia:', selectedStrategy);
                          console.log('🔍 Detalhes da busca:', {
                            selectedStrategy,
                            availableFiles: Object.keys(fileResults),
                            searchTerms: [
                              selectedStrategy.toLowerCase(),
                              selectedStrategy.toLowerCase().replace('.csv', '')
                            ]
                          });
                        }
                      }
                    }
                    // 🎯 CORREÇÃO: Sempre usar dados da API para garantir consistência
                    console.log('✅ Usando dados corretos da API para MetricsDashboard (modo consolidado)');
                    
                    if (fileResults && Object.keys(fileResults).length > 0 && !selectedStrategy) {
                      console.log('✅ Usando dados corretos da API para MetricsDashboard (modo consolidado)');
                      // ❌ REMOVIDO: Todo o processamento adicional foi removido para usar dados da API
                      // console.log('📊 Calculando métricas automáticas de todos os CSVs carregados');
                      
                      const allMetrics = {
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
                      
                      const allTrades: any[] = [];
                      
                      // Calcular métricas de todos os CSVs
                      Object.keys(fileResults).forEach(fileName => {
                        const strategyData = fileResults[fileName];
                        if (strategyData && strategyData["Performance Metrics"]) {
                          const metrics = strategyData["Performance Metrics"];
                          
                          console.log(`📊 Processando ${fileName}:`, {
                            totalTrades: metrics["Total Trades"] || 0,
                            netProfit: metrics["Net Profit"] || 0,
                            maxDrawdown: metrics["Max Drawdown ($)"] || 0
                          });
                          
                          // Somar métricas
                          allMetrics.totalTrades += metrics["Total Trades"] || 0;
                          allMetrics.netProfit += metrics["Net Profit"] || 0;
                          allMetrics.grossProfit += metrics["Gross Profit"] || 0;
                          allMetrics.grossLoss += Math.abs(metrics["Gross Loss"] || 0);
                          allMetrics.maiorGanho = Math.max(allMetrics.maiorGanho, metrics["Max Trade Gain"] || 0);
                          allMetrics.maiorPerda = Math.min(allMetrics.maiorPerda, -(metrics["Max Trade Loss"] || 0));
                          allMetrics.maxConsecutiveLosses = Math.max(allMetrics.maxConsecutiveLosses, metrics["Max Consecutive Losses"] || 0);
                          allMetrics.maxConsecutiveWins = Math.max(allMetrics.maxConsecutiveWins, metrics["Max Consecutive Wins"] || 0);
                          
                          // ❌ REMOVIDO: Não mais usar maior drawdown individual
                          // Drawdown consolidado será calculado após coleta de todos os trades
                          
                          // NÃO somar Sharpe Ratio e Recovery Factor - serão recalculados
                          // allMetrics.sharpeRatio += metrics["Sharpe Ratio"] || 0;
                          // allMetrics.recoveryFactor += metrics["Recovery Factor"] || 0;
                          
                          // Adicionar trades da estratégia
                          if (strategyData.trades && Array.isArray(strategyData.trades)) {
                            allTrades.push(...strategyData.trades);
                          }
                        }
                      });
                      
                      // Calcular métricas derivadas
                      if (allMetrics.totalTrades > 0) {
                        allMetrics.averageTrade = allMetrics.netProfit / allMetrics.totalTrades;
                      }
                      
                      if (allMetrics.grossLoss > 0) {
                        allMetrics.profitFactor = allMetrics.grossProfit / allMetrics.grossLoss;
                      }
                      
                      if (allMetrics.totalTrades > 0) {
                        // Calcular win rate baseado nos trades lucrativos vs perdedores
                        const profitableTrades = allTrades.filter(trade => trade.pnl > 0).length;
                        const lossTrades = allTrades.filter(trade => trade.pnl < 0).length;
                        allMetrics.profitableTrades = profitableTrades;
                        allMetrics.lossTrades = lossTrades;
                        allMetrics.winRate = (profitableTrades / allMetrics.totalTrades) * 100;
                      }
                      
                      // Calcular average win/loss
                      const profitableTradesData = allTrades.filter(trade => trade.pnl > 0);
                      const lossTradesData = allTrades.filter(trade => trade.pnl < 0);
                      
                      if (profitableTradesData.length > 0) {
                        allMetrics.averageWin = profitableTradesData.reduce((sum, trade) => sum + trade.pnl, 0) / profitableTradesData.length;
                      }
                      
                      if (lossTradesData.length > 0) {
                        allMetrics.averageLoss = Math.abs(lossTradesData.reduce((sum, trade) => sum + trade.pnl, 0) / lossTradesData.length);
                      }
                      
                      // 🎯 CORREÇÃO CRÍTICA: Calcular drawdown consolidado cronológico (seção allMetrics)
                      console.log('🔧 CALCULANDO DRAWDOWN CONSOLIDADO CRONOLÓGICO (ALL METRICS)');
                      console.log(`📊 Total de trades ALL: ${allTrades.length}`);
                      
                      if (allTrades.length > 0) {
                        // Ordenar trades cronologicamente
                        const sortedAllTrades = allTrades.sort((a, b) => {
                          const dateA = new Date(a.exit_date || a.entry_date || a.date);
                          const dateB = new Date(b.exit_date || b.entry_date || b.date);
                          return dateA.getTime() - dateB.getTime();
                        });
                        
                        // Aplicar metodologia Python: equity = pnl.cumsum(), peak = equity.cummax()
                        let equity = 0.0;
                        let peak = 0.0;
                        let maxDrawdown = 0.0;
                        
                        sortedAllTrades.forEach((trade, index) => {
                          equity += (trade.pnl || 0); // cumsum()
                          if (equity > peak) {
                            peak = equity; // cummax()
                          }
                          const drawdown = peak - equity; // saldo_maximo - saldo_atual (sempre positivo)
                          if (drawdown > maxDrawdown) {
                            maxDrawdown = drawdown;
                          }
                        });
                        
                        // Atualizar allMetrics com drawdown consolidado correto
                        allMetrics.maxDrawdownAmount = maxDrawdown;
                        allMetrics.maxDrawdown = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
                        
                        console.log(`🎯 DRAWDOWN CONSOLIDADO ALL FINAL: R$ ${maxDrawdown.toFixed(2)} (${allMetrics.maxDrawdown.toFixed(2)}%)`);
                      } else {
                        console.log('⚠️ Nenhum trade encontrado para calcular drawdown consolidado (ALL)');
                        allMetrics.maxDrawdownAmount = 0;
                        allMetrics.maxDrawdown = 0;
                      }
                      
                      // Calcular payoff (averageWin / averageLoss)
                      if (allMetrics.averageLoss > 0) {
                        allMetrics.payoff = allMetrics.averageWin / allMetrics.averageLoss;
                      } else {
                        allMetrics.payoff = allMetrics.averageWin > 0 ? 999 : 0;
                      }
                      
                      // Usar valores recalculados se disponíveis, senão usar valores calculados pelo frontend
                      if (recalculatedMetrics && recalculatedMetrics.metricas_principais) {
                        console.log('📊 Usando valores recalculados pelo backend (todos os CSVs)');
                        allMetrics.sharpeRatio = recalculatedMetrics.metricas_principais.sharpe_ratio || 0;
                        allMetrics.recoveryFactor = recalculatedMetrics.metricas_principais.fator_recuperacao || 0;
                        // Profit Factor é calculado pelo frontend com base nos dados consolidados
                      } else {
                        console.log('📊 Usando valores calculados pelo frontend para Sharpe Ratio e Recovery Factor (todos os CSVs)');
                      }
                      
                      metricsToUse = allMetrics;
                      tradesToUse = { trades: allTrades };
                      
                      console.log('📊 Métricas automáticas calculadas de todos os CSVs:', {
                        totalTrades: allMetrics.totalTrades,
                        netProfit: allMetrics.netProfit,
                        winRate: allMetrics.winRate,
                        profitFactor: allMetrics.profitFactor,
                        maxDrawdown: allMetrics.maxDrawdown,
                        payoff: allMetrics.payoff,
                        averageWin: allMetrics.averageWin,
                        averageLoss: allMetrics.averageLoss,
                        filesProcessed: Object.keys(fileResults).length
                      });
                    } else {
                      console.log('📊 Usando dados consolidados:', {
                        winRate: metricsToUse.winRate,
                        profitFactor: metricsToUse.profitFactor,
                        maxDrawdown: metricsToUse.maxDrawdown,
                        totalTrades: metricsToUse.totalTrades,
                        payoff: metricsToUse.payoff,
                        averageWin: metricsToUse.averageWin,
                        averageLoss: metricsToUse.averageLoss
                      });
                    }
                    
                    return (
                      <MetricsDashboard 
                        metrics={metricsToUse}  // Já contém o DD consolidado correto
                        tradeObject={tradesToUse}
                        fileResults={fileResults}
                        showTitle={true}
                      />
                    );
                  })()}
                </div>
                
                {/* Individual Results Section - Show when multiple files */}
                {Object.keys(fileResults).length > 0 && (
                  <IndividualResultsSection
                    fileResults={fileResults}
                    showIndividualResults={showIndividualResults}
                    setShowIndividualResults={setShowIndividualResults}
                  />
                )}
                

                
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
                
              </div>
            )}
            
            {/* Spacing between sections */}
            <div className="mb-8"></div>
            
            {/* Correlation Analysis Section - PRO only - SEMPRE VISÍVEL */}
            <PlanRestrictedSection 
              title="Análise de Correlação" 
              description="Compare a correlação entre diferentes estratégias para otimizar seu portfólio. Disponível apenas para usuários PRO."
              requiredPlan="Pro"
            >
               <SimpleCorrelationComponent
                  showCorrelation={showCorrelation}
                  setShowCorrelation={setShowCorrelation}
                  backtestResult={originalCorrelationData || backtestResult}
                  onResetCorrelation={handleResetFilters}
                  isUsingOriginalData={!!originalCorrelationData}
                />
            </PlanRestrictedSection>

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
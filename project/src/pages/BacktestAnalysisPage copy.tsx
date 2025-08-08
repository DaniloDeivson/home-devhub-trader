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
import { openai } from '../lib/openaiClient';
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
  maxDrawdownAmount: number; // Financial drawdown in currency
  maxConsecutiveLosses: number;
    maxConsecutivegains: number;
  sharpeRatio: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  recoveryFactor: number;
  averageTrade: number;
  timeInMarket: number;
  lastUpdated: string; // Timestamp of last update
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
  rawResponse?: string; // Store the raw response
}

// Utility function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff retry function
async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let currentTry = 0;
  
  while (currentTry < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      currentTry++;
      
      if (currentTry >= maxRetries) {
        throw error;
      }
      
      const retryAfter = error?.response?.headers?.['retry-after'];
      const waitTime = retryAfter 
        ? parseInt(retryAfter) * 1000 
        : Math.min(initialDelay * Math.pow(2, currentTry - 1), maxDelay);
      
      await delay(waitTime);
    }
  }
  
  throw new Error('Max retries reached');
}

// Function to extract structured data from text response
function extractStructuredData(text: string): AnalysisResult {
  console.log('Extracting structured data from text:', text);
  
  // Normalize text for easier extraction
  const normalizedText = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  
  // Default values
  const result: AnalysisResult = {
    metrics: {
      profitFactor: 0,
      payoff: 0,
      winRate: 0,
      totalTrades: 0,
      profitableTrades: 0,
      lossTrades: 0,
      averageWin: 0,
      averageLoss: 0,
      maxDrawdown: 0,
      maxDrawdownAmount: 0,
      maxDrawdownStart: '',
      maxDrawdownEnd: '',
      maxDrawdownDuration: 0,
      maxConsecutiveLosses: 0,
      sharpeRatio: 0,
      netProfit: 0,
      grossProfit: 0,
      grossLoss: 0,
      recoveryFactor: 0,
      expectancy: 0,
      averageTrade: 0,
      timeInMarket: 0,
      lastUpdated: new Date().toISOString()
    },
    strengths: [],
    weaknesses: [],
    suggestions: [],
    portfolioRecommendations: {
      description: "",
      combinations: []
    },
    rawResponse: text // Store the raw response
  };
  
  // Try to isolate the metrics section if it exists
  const metricsBlockMatch = normalizedText.match(/##\s*metricas\s*\/?\s*metrics([\s\S]*?)(?=##|$)/i);
  const metricsBlock = metricsBlockMatch ? metricsBlockMatch[1] : normalizedText;
  
  // Define patterns for all metrics we want to extract
  const patterns = {
    profitFactor: /(profit\s*factor|fator\s*de\s*lucro)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    payoff: /(payoff|relacao\s*ganho\s*perda)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    winRate: /(win\s*rate|taxa\s*de\s*acerto)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)(?:%)?/,
    maxDrawdown: /(max\s*drawdown|drawdown\s*maximo)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)(?:%)?/,
    totalTrades: /(total\s*trades|total\s*de\s*operacoes)\s*[:\-]\s*(\d+)/,
    profitableTrades: /(profitable\s*trades|operacoes\s*lucrativas)\s*[:\-]\s*(\d+)/,
    lossTrades: /(loss\s*trades|operacoes\s*perdedoras)\s*[:\-]\s*(\d+)/,
    averageWin: /(average\s*win|ganho\s*medio)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    averageLoss: /(average\s*loss|perda\s*media)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    sharpeRatio: /(sharpe\s*ratio|indice\s*sharpe)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    netProfit: /(net\s*profit|lucro\s*liquido)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    grossProfit: /(gross\s*profit|lucro\s*bruto)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    grossLoss: /(gross\s*loss|perda\s*bruta)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    maxConsecutiveLosses: /(max\s*consecutive\s*losses|maximo\s*de\s*perdas\s*consecutivas)\s*[:\-]\s*(\d+)/,
    recoveryFactor: /(recovery\s*factor|fator\s*de\s*recuperacao)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    averageTrade: /(average\s*trade|media\s*por\s*operacao)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)/,
    timeInMarket: /(time\s*in\s*market|tempo\s*no\s*mercado)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)(?:%)?/,
  };
  
  // Extract metrics using the patterns
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = metricsBlock.match(pattern);
    if (match && match[2]) {
      // For date fields, keep as string
      if (key === 'maxDrawdownStart' || key === 'maxDrawdownEnd') {
        (result.metrics as any)[key] = match[2];
        console.log(`Found ${key}: ${match[2]}`);
      } else {
        // For numeric fields, parse as float
        const value = parseFloat(match[2].replace('%', ''));
        if (!isNaN(value)) {
          (result.metrics as any)[key] = value;
          console.log(`Found ${key}: ${value}`);
        }
      }
    } else {
      console.log(`No match found for ${key}`);
    }
  }
  
  // Try alternative patterns for metrics that weren't found
  if (!result.metrics.profitFactor) {
    const altMatch = normalizedText.match(/profit\s*factor.*?([0-9]+(?:\.[0-9]+)?)/);
    if (altMatch) result.metrics.profitFactor = parseFloat(altMatch[1]);
  }
  
  if (!result.metrics.winRate) {
    const altMatch = normalizedText.match(/win\s*rate.*?([0-9]+(?:\.[0-9]+)?)/);
    if (altMatch) result.metrics.winRate = parseFloat(altMatch[1]);
  }
  
  if (!result.metrics.payoff) {
    const altMatch = normalizedText.match(/payoff.*?([0-9]+(?:\.[0-9]+)?)/);
    if (altMatch) result.metrics.payoff = parseFloat(altMatch[1]);
  }
  
  if (!result.metrics.maxDrawdown) {
    // Try to find drawdown in percentage format
    const altMatch = normalizedText.match(/drawdown.*?([0-9]+(?:\.[0-9]+)?)\s*%/);
    if (altMatch) result.metrics.maxDrawdown = parseFloat(altMatch[1]);
  }
  
  if (!result.metrics.maxDrawdownAmount) {
    // Try to find financial drawdown
    const altMatch = normalizedText.match(/drawdown.*?[r$]?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (altMatch) result.metrics.maxDrawdownAmount = parseFloat(altMatch[1]);
    
    // If still not found, estimate from maxDrawdown and netProfit
    if (!result.metrics.maxDrawdownAmount && result.metrics.maxDrawdown && result.metrics.netProfit) {
      // Rough estimate: maxDrawdownAmount = netProfit * (maxDrawdown/100)
      result.metrics.maxDrawdownAmount = result.metrics.netProfit * (result.metrics.maxDrawdown / 100);
    }
  }
  
  // Calculate derived metrics if possible
  if (result.metrics.totalTrades && result.metrics.winRate && !result.metrics.profitableTrades) {
    result.metrics.profitableTrades = Math.round(result.metrics.totalTrades * (result.metrics.winRate / 100));
  }
  
  if (result.metrics.totalTrades && result.metrics.profitableTrades && !result.metrics.lossTrades) {
    result.metrics.lossTrades = result.metrics.totalTrades - result.metrics.profitableTrades;
  }
  
  // If we have maxDrawdownStart and maxDrawdownEnd but no duration, calculate it
  if (result.metrics.maxDrawdownStart && result.metrics.maxDrawdownEnd && !result.metrics.maxDrawdownDuration) {
    try {
      const start = new Date(result.metrics.maxDrawdownStart);
      const end = new Date(result.metrics.maxDrawdownEnd);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      result.metrics.maxDrawdownDuration = diffDays;
    } catch (e) {
      console.error('Error calculating drawdown duration:', e);
    }
  }
  
  // Extract strengths
  const strengthsSection = normalizedText.match(/strengths?:?\s*([\s\S]*?)(?=weaknesses?:|$)/i);
  if (strengthsSection) {
    const strengthsList = strengthsSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (strengthsList) {
      result.strengths = strengthsList.map(item => 
        item.replace(/[-•*]\s*/, '').trim()
      ).filter(item => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = strengthsSection[1].split('\n').filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        result.strengths = lines.map(line => line.trim());
      }
    }
  }
  
  // Extract weaknesses
  const weaknessesSection = normalizedText.match(/weaknesses?:?\s*([\s\S]*?)(?=suggestions?:|improvements?:|$)/i);
  if (weaknessesSection) {
    const weaknessesList = weaknessesSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (weaknessesList) {
      result.weaknesses = weaknessesList.map(item => 
        item.replace(/[-•*]\s*/, '').trim()
      ).filter(item => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = weaknessesSection[1].split('\n').filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        result.weaknesses = lines.map(line => line.trim());
      }
    }
  }
  
  // Extract suggestions
  const suggestionsSection = normalizedText.match(/suggestions?:|improvements?:?\s*([\s\S]*?)(?=portfolio|recommendations?:|$)/i);
  if (suggestionsSection) {
    const suggestionsList = suggestionsSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (suggestionsList) {
      result.suggestions = suggestionsList.map(item => 
        item.replace(/[-•*]\s*/, '').trim()
      ).filter(item => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = suggestionsSection[1].split('\n').filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        result.suggestions = lines.map(line => line.trim());
      }
    }
  }
  
  // Extract portfolio recommendations
  const portfolioSection = normalizedText.match(/portfolio\s*recommendations?:?\s*([\s\S]*?)(?=\n\n|$)/i);
  if (portfolioSection) {
    result.portfolioRecommendations.description = portfolioSection[1].split('\n')[0].trim();
    
    const combinationsList = portfolioSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (combinationsList) {
      result.portfolioRecommendations.combinations = combinationsList.map(item => 
        item.replace(/[-•*]\s*/, '').trim()
      ).filter(item => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = portfolioSection[1].split('\n').slice(1).filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        result.portfolioRecommendations.combinations = lines.map(line => line.trim());
      }
    }
  }
  
  // Ensure we have at least some data in each section
  if (result.strengths.length === 0) result.strengths = ["Strategy shows potential"];
  if (result.weaknesses.length === 0) result.weaknesses = ["Needs further optimization"];
  if (result.suggestions.length === 0) result.suggestions = ["Consider backtesting with different parameters"];
  if (result.portfolioRecommendations.description === "") {
    result.portfolioRecommendations.description = "Consider combining this strategy with others for diversification";
  }
  if (result.portfolioRecommendations.combinations.length === 0) {
    result.portfolioRecommendations.combinations = ["Trend following strategies", "Mean reversion strategies"];
  }
  
  return result;
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
    
    setIsAnalyzing(true);
    setError(null);
    setShowChat(true);
    setAnalysisStartTime(Date.now());
    setRawResponse(''); // Clear previous raw response
    setAnalysisCompleted(false);
    
    // Set a timeout for the analysis (2 minutes)
    const timeout = setTimeout(() => {
      if (isAnalyzing) {
        setError('A análise demorou muito tempo e foi cancelada. A API OpenAI pode estar sobrecarregada. Por favor, tente novamente mais tarde.');
        setIsAnalyzing(false);
      }
    }, 120000); // 2 minutes
    
    setAnalysisTimeout(timeout);
    
    try {
      // Check token balance
      const tokenBalance = profile?.token_balance || 0;
      if (tokenBalance < 1000) {
        setError('Insufficient token balance. This analysis requires 1000 tokens.');
        setIsAnalyzing(false);
        clearTimeout(timeout);
        setAnalysisTimeout(null);
        return;
      }
      
      // Create a file from the CSV data
      const csvBlob = new Blob([csvData], { type: 'text/csv' });
      const csvFile = new File([csvBlob], file?.name || 'backtest.csv', { type: 'text/csv' });
      
      // Upload the file to OpenAI
      const uploadResponse = await openai.files.create({
        file: csvFile,
        purpose: 'assistants'
      });

      console.log('File uploaded successfully:', uploadResponse);

      // Create a thread
      const thread = await openai.beta.threads.create();
      setThreadId(thread.id);

      // Add a message to the thread with the file attached
      await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: `Analyze this backtest data from the attached CSV file. I need a comprehensive analysis of the trading strategy performance.

Please analyze the data and provide:
1. Calculate all key performance metrics (Profit Factor, Win Rate, Payoff, Max Drawdown, etc.)

return a JSON object. Just provide a clear, well-structured text analysis with metrics

Please include the following metrics with their numerical values:
- Profit Factor
- Win Rate (%)
- Payoff
- Max Drawdown topo ao fundo($)
- lucro liquido (gross profit minus gross loss)
- Gross Profit
- Gross Loss
- Total Trades
- win Trades
- Loss Trades
- Average Win
- Average Loss
- Max Consecutive Losses
- Max Consecutive gains
- Recovery Factor
- sharpe ratio
- Average Trade (ganho médio minus perda média)
- Time in Market (horario de saida - horario de entrada)

Format the metrics section as:

## Métricas / Metrics

Profit Factor: X.XX
Win Rate: XX.XX%
Payoff: X.XX
...and so on`,
          attachments: [
            {
              file_id: uploadResponse.id,
              tools: [{ type: "code_interpreter" }]
            }
          ]
        }
      );

      // Create a run with the assistant
      const run = await openai.beta.threads.runs.create(
        thread.id,
        {
          assistant_id: "asst_Ur6pQ7T4OcKentyqLYNhdlrI",
          tools: [{ type: "code_interpreter" }]
        }
      );

      // Poll for the run to complete
      let runStatus;
      do {
        await delay(1000); // Wait 1 second between polls
        runStatus = await openai.beta.threads.runs.retrieve(
          thread.id, 
          run.id
        );
        console.log(`Run status: ${runStatus.status}`);
        
        if (runStatus.status === 'failed') {
          throw new Error('Analysis run failed: ' + (runStatus.last_error?.message || 'Unknown error'));
        }
      } while (runStatus.status !== 'completed');

      // Get the messages from the thread
      const messages = await openai.beta.threads.messages.list(
        thread.id
      );
      
      // Find the assistant's response
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      if (!assistantMessage) {
        throw new Error('No response from assistant');
      }

      // Extract the content from the message
      const content = assistantMessage.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format');
      }

      const textContent = content.text.value;
      console.log('Received text content:', textContent);
      
      // Store the raw response
      setRawResponse(textContent);
      
      try {
        // Extract structured data from the text
        const result = extractStructuredData(textContent);
        
        setAnalysisResult(result);
        setDashboardMetrics(result.metrics);
        setAnalysisCompleted(true);
        
        // Show notification
        setNotificationMessage('Análise concluída com sucesso!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
        
        // Save analysis and update tokens
        await saveAnalysisToDatabase(result);
        await updateTokenBalance(-1000);
        
        // Clean up the file after analysis
        try {
          await openai.files.del(uploadResponse.id);
        } catch (deleteError) {
          console.error('Error deleting file:', deleteError);
          // Continue even if file deletion fails
        }
        
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error(`Error processing response: ${parseError.message}`);
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during analysis');
      
      if (error instanceof Error && error.message.includes('Rate limit')) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setIsAnalyzing(false);
      if (analysisTimeout) {
        clearTimeout(analysisTimeout);
        setAnalysisTimeout(null);
      }
    }
  };

  const saveAnalysisToDatabase = async (result: AnalysisResult) => {
    try {
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
    
    // Use the raw response if available, otherwise generate a formatted report
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
- Máx. gains Consecutivas: ${analysisResult.metrics.maxConsecutiveLosses}
- Sharpe Ratio: ${analysisResult.metrics.sharpeRatio.toFixed(2)}
- Lucro Líquido(net profit): R$ ${analysisResult.metrics.netProfit.toFixed(2)}
- Lucro Bruto: R$ ${analysisResult.metrics.grossProfit.toFixed(2)}
- Perda Bruta: R$ ${analysisResult.metrics.grossLoss.toFixed(2)}
- Média por Trade: R$ ${analysisResult.metrics.averageTrade.toFixed(2)}
- Tempo no Mercado: ${analysisResult.metrics.timeInMarket.toFixed(2)}time


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

  const formatMetric = (value: number | undefined, isPercentage = false, decimalPlaces = 2) => {
    if (value === undefined || value === null) return 'N/A';
    return isPercentage 
      ? `${value.toFixed(decimalPlaces)}%` 
      : value.toFixed(decimalPlaces);
  };

  const getMetricColor = (metric: string, value: number): string => {
    switch (metric) {
      case 'profitFactor':
        return value >= 1.5 ? 'text-green-500' : value >= 1.0 ? 'text-yellow-500' : 'text-red-500';
      case 'payoff':
        return value >= 1.5 ? 'text-green-500' : value >= 1.0 ? 'text-yellow-500' : 'text-red-500';
      case 'winRate':
        return value >= 60 ? 'text-green-500' : value >= 45 ? 'text-yellow-500' : 'text-red-500';
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

  const loadSavedAnalysis = (analysisData: any) => {
    setAnalysisResult(analysisData);
    setDashboardMetrics(analysisData.metrics);
    setShowChat(true);
    setAnalysisCompleted(true);
    
    // Show notification
    setNotificationMessage('Análise carregada com sucesso!');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  const handleMetricsReceived = (metrics: any) => {
    console.log("Metrics received from chat:", metrics);
    
    // If we already have an analysis result, update it with new metrics
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
      
      // Save to database
      saveAnalysisToDatabase(updatedResult);
      
      // Show notification
      setNotificationMessage('Métricas atualizadas com sucesso!');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      
      return;
    }
    
    // Create a new analysis result with the received metrics
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
        maxConsecutiveLosses: metrics.maxConsecutiveLosses || 0,
               maxConsecutivegains: metrics.maxConsecutiveLosses || 0,
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
    
    // Show notification
    setNotificationMessage('Nova análise criada com base no chat!');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
    
    // Save to database
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

        {/* Financial Drawdown Panel */}
        {dashboardMetrics && dashboardMetrics.maxDrawdownAmount && (
          <div className="mb-8 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <DollarSign className="w-6 h-6 text-red-500 mr-2" />
                  Análise de Drawdown Financeiro
                </h2>
                <button 
                  onClick={() => setShowDrawdownDetails(!showDrawdownDetails)}
                  className="p-1 hover:bg-gray-800 rounded-full"
                >
                  {showDrawdownDetails ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {showDrawdownDetails && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-800 rounded-lg p-5">
                    <p className="text-sm text-gray-400 mb-2">Valor do Drawdown</p>
                    <p className="text-3xl font-bold text-red-500">
                      R$ {dashboardMetrics.maxDrawdownAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {dashboardMetrics.maxDrawdown.toFixed(2)}% do capital
                    </p>
                  </div>
                  

                </div>
                
                <div className="bg-gray-800 rounded-lg p-5">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                    Análise de Impacto
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Impacto Financeiro</p>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-700 rounded-full h-4">
                          <div 
                            className={`h-4 rounded-full ${
                              dashboardMetrics.maxDrawdown <= 10 
                                ? 'bg-green-500' 
                                : dashboardMetrics.maxDrawdown <= 20 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, dashboardMetrics.maxDrawdown)}%` }}
                          />
                        </div>
                        <span className="ml-2 font-medium">
                          {dashboardMetrics.maxDrawdown.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        {dashboardMetrics.maxDrawdown <= 10 
                          ? 'Baixo impacto - Drawdown saudável' 
                          : dashboardMetrics.maxDrawdown <= 20 
                          ? 'Impacto moderado - Atenção recomendada' 
                          : 'Alto impacto - Revisão necessária'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Tempo de Recuperação</p>
                      <div className="flex items-center">
                        <p className="text-xl font-bold">
                          {dashboardMetrics.recoveryFactor 
                            ? `${(dashboardMetrics.maxDrawdownDuration / dashboardMetrics.recoveryFactor).toFixed(0)} dias estimados`
                            : 'Não disponível'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Baseado no fator de recuperação de {dashboardMetrics.recoveryFactor?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  {error.includes('Rate limit') && (
                    <p className="text-sm mt-1">
                      Tentativa {retryCount}/3. Aguarde alguns segundos e tente novamente.
                    </p>
                  )}
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
                Esta análise consumirá 1000 tokens
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
                
                <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-800">
                  <p className="text-sm text-blue-300">
                    <strong>Dica:</strong> Para melhores resultados, certifique-se de que seu CSV inclua colunas para data, preço de entrada, preço de saída, direção do trade (compra/venda), resultado (lucro/perda) e duração do trade.
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
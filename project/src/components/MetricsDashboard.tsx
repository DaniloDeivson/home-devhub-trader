import { useState, useEffect } from "react";
import {
  BarChart2,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  BarChartHorizontal,
  Wallet,
  TrendingDown,
  ChevronRight,
  BarChart
} from "lucide-react";

interface MetricsDashboardProps {
  tradeObject: {
    trades: Array<{
      symbol?: string;
      entry_date: string;
      exit_date: string;
      pnl: number;
      quantity_total?: number;
      quantity_compra?: number;
      quantity_venda?: number;
      qty_buy?: number;
      qty_sell?: number;
      quantity?: number;
      qty?: number;
      quantity_buy?: number;
      quantity_sell?: number;
      position_size?: number;
      size?: number;
      volume?: number;
      [key: string]: any;
    }>;
    file?: File;
  };
  showTitle?: boolean;
  metrics: {
    profitFactor?: number;
    payoff?: number;
    winRate?: number;
    maxDrawdown?: number;
    maxDrawdownAmount?: number;
    maxConsecutiveLosses?: number;
    maxConsecutiveWins?: number;
    sharpeRatio?: number;
    netProfit?: number;
    grossProfit?: number;
    grossLoss?: number;
    totalTrades?: number;
    profitableTrades?: number;
    lossTrades?: number;
    averageWin?: number;
    averageLoss?: number;
    recoveryFactor?: number;
    averageTrade?: number;
    averageTradeDuration?: string;
    dayOfWeekAnalysis?: Record<
      string,
      { trades: number; winRate: number; profitFactor: number }
    >;
    monthlyAnalysis?: Record<
      string,
      { trades: number; winRate: number; profitFactor: number }
    >;
    stopIdealPorDia?: number;
    resultadoDiasFuria?: number;
    numeroDiasFuria?: number;
    maiorGanho?: number;
    maiorPerda?: number;
    operacoesMaximasPorDia?: number;
    setupsMaximosPorDia?: number;
    mediaOperacoesDia?: number;
    riscoPorTrade?: number;
    capitalEmRisco?: number;
    posicaoRecomendada?: number;
    exposicaoMaxima?: number;
  };
}

export function MetricsDashboard({ metrics, tradeObject, showTitle = true }: MetricsDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPositionSizing, setShowPositionSizing] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [showAssetDetails, setShowAssetDetails] = useState(false);
  const [selectedMetricForDetails, setSelectedMetricForDetails] = useState<string | null>(null);
  const [positionSizingData, setPositionSizingData] = useState({
    stocks: {
      avgPositionPerTrade: 0,
      medianPositionPerTrade: 0,
      maxPositionPerTrade: 0,
      maxContractsPerDay: 0
    },
    futures: {
      avgPositionPerTrade: 0,
      medianPositionPerTrade: 0,
      maxPositionPerTrade: 0,
      maxContractsPerDay: 0
    },
    general: {
      maxOpenPositions: 0,
      setupsMaximosPorDia: 0,
      accountRisk: 0,
      maxRiskPerTrade: 0,
      riscoPorTrade: 2.00,
      capitalEmRisco: 0.00,
      posicaoRecomendada: 0,
      exposicaoMaxima: 0.00
    }
  });
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, any>>({});
  const [showTradeDuration, setShowTradeDuration] = useState(false);
  const trade = tradeObject?.trades;

  // Function to detect asset type based on symbol
  const detectAssetType = (symbol: string): string => {
    if (!symbol) return 'acoes';
    
    const symbolUpper = symbol.toUpperCase();
    
    // Check for Bitcoin
    if (symbolUpper.includes('BTC') || symbolUpper.includes('BITCOIN')) {
      return 'bitcoin';
    }
    
    // Check for Dollar
    if (symbolUpper.includes('USD') || symbolUpper.includes('DOLAR') || symbolUpper.includes('DÓLAR')) {
      return 'dolar';
    }
    
    // Check for Index
    if (symbolUpper.includes('IBOV') || symbolUpper.includes('INDICE') || symbolUpper.includes('ÍNDICE')) {
      return 'indice';
    }
    
    // Check for specific futures
    if (symbolUpper.includes('WINFUT') || symbolUpper.includes('WDOFUT') || symbolUpper.includes('BITFUT')) {
      return 'futuro';
    }
    
    // Check if it's a stock (4 letters + number pattern)
    const stockPattern = /^[A-Z]{4}\d+$/;
    if (stockPattern.test(symbolUpper)) {
      return 'acao';
    }
    
    // Default to futures
    return 'futuro';
  };

  // Get unique assets from trades
  const getUniqueAssets = () => {
    if (!trade || trade.length === 0) return [];
    
    const assets = trade.map(t => t.symbol || 'N/A').filter((symbol, index, arr) => arr.indexOf(symbol) === index);
    return assets;
  };

  // Get position sizing data for specific asset
  const getAssetPositionData = (assetSymbol: string) => {
    if (!trade || trade.length === 0) return null;
    
    const assetTrades = trade.filter(t => t.symbol === assetSymbol);
    if (assetTrades.length === 0) return null;
    
    const assetType = detectAssetType(assetSymbol);
    
    // Calculate position sizes for this specific asset
    const positionSizes = assetTrades.map(trade => {
      const positionSize = trade.quantity_total || trade.quantity_compra || trade.quantity_venda ||
                          trade.qty_buy || trade.qty_sell || trade.quantity || 
                          trade.qty || trade.quantity_buy || trade.quantity_sell ||
                          trade.position_size || trade.size || trade.volume || 0;
      return positionSize;
    }).filter(size => size > 0);

    if (positionSizes.length === 0) return null;

    const maxPosition = Math.max(...positionSizes);
    const avgPosition = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
    const sortedPositions = [...positionSizes].sort((a, b) => a - b);
    
    let medianPosition = 0;
    if (sortedPositions.length > 0) {
      if (sortedPositions.length % 2 === 0) {
        // Even number of elements - take average of two middle values
        const mid1 = sortedPositions[sortedPositions.length / 2 - 1];
        const mid2 = sortedPositions[sortedPositions.length / 2];
        medianPosition = (mid1 + mid2) / 2;
      } else {
        // Odd number of elements - take middle value
        medianPosition = sortedPositions[Math.floor(sortedPositions.length / 2)];
      }
    }

    // Calculate max contracts per day for this asset
    const tradesByDate = {};
    assetTrades.forEach(trade => {
      const date = new Date(trade.entry_date).toDateString();
      if (!tradesByDate[date]) {
        tradesByDate[date] = [];
      }
      tradesByDate[date].push(trade);
    });

    const maxContractsPerDay = Math.max(...Object.values(tradesByDate).map(trades => trades.length));
    const avgContractsPerDay = assetTrades.length / Object.keys(tradesByDate).length;

    console.log(`📊 Asset ${assetSymbol} analysis:`);
    console.log(`  - Position sizes:`, positionSizes);
    console.log(`  - Average position:`, avgPosition);
    console.log(`  - Median position:`, medianPosition);
    console.log(`  - Max position:`, maxPosition);
    console.log(`  - Total trades:`, assetTrades.length);

    return {
      assetType,
      maxPosition,
      avgPosition: Math.round(avgPosition),
      medianPosition: Math.round(medianPosition),
      maxContractsPerDay,
      avgContractsPerDay: Math.round(avgContractsPerDay),
      totalTrades: assetTrades.length
    };
  };

  // Sample data for the trade duration analysis with additional metrics
  // Calculate real trade duration data from the trades array
  const calculateTradeDurationData = () => {
    if (!trade || trade.length === 0) {
      return {
        averageDuration: '0h 0m',
        medianDuration: '0h 0m',
        maxDuration: '0h 0m',
        resultByDuration: []
      };
    }

    console.log("trades? ",trade);
    const tradesWithDuration = trade?.map((t: any) => {
      const entryDate = new Date(t.entry_date);
      const exitDate = new Date(t.exit_date);
      const durationHours = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
      
      return {
        ...t,
        durationHours: durationHours
      };
    });

    // Calculate basic duration statistics
    const durations = tradesWithDuration.map((t: any) => t.durationHours);
    const avgDuration = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
    const sortedDurations = [...durations].sort((a: number, b: number) => a - b);
    const medianDuration = sortedDurations[Math.floor(sortedDurations.length / 2)];
    const maxDuration = Math.max(...durations);

    // Format duration helper function
    const formatDuration = (hours: number) => {
      const h = Math.floor(hours);
      const m = Math.floor((hours - h) * 60);
      return `${h}h ${m}m`;
    };

    // Group trades by duration ranges
    const durationRanges = [
       { label: '< 15min', min: 0, max: 0.25 },
      { label: '15-30min', min: 0.25, max: 0.5 },
      { label: '30min - 1h', min: 0.5, max: 1 },
      { label: '1h - 2h', min: 1, max: 2 },
      { label: '2h - 4h', min: 2, max: 4 },
      { label: '4h - 9h', min: 4, max: 9 },
      { label: '9h - 24h', min: 9, max: 24 },
      { label: '24h - 72h', min: 24, max: 72},
      { label: '72h - 168h', min: 72, max: 168 },
      { label: '> 168h', min: 168, max: Infinity }
    ];

    const resultByDuration = durationRanges.map(range => {
      const rangeTradesData = tradesWithDuration.filter((t: any) => 
        t.durationHours >= range.min && t.durationHours < range.max
      );
      
      if (rangeTradesData.length === 0) {
        return {
          duration: range.label,
          result: 0,
          count: 0,
          profitFactor: 0,
          winRate: 0,
          payoff: 0
        };
      }

      const totalResult = rangeTradesData.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
      const winningTrades = rangeTradesData.filter((t: any) => (t.pnl || 0) > 0);
      const losingTrades = rangeTradesData.filter((t: any) => (t.pnl || 0) < 0);
      
      const winRate = (winningTrades.length / rangeTradesData.length) * 100;
      
      const grossProfit = winningTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
      const grossLoss = Math.abs(losingTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0));
      
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
      
      const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
      const payoff = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 999 : 0);

      return {
        duration: range.label,
        result: totalResult,
        count: rangeTradesData.length,
        profitFactor: profitFactor,
        winRate: winRate,
        payoff: payoff
      };
    });

    return {
      averageDuration: formatDuration(avgDuration),
      medianDuration: formatDuration(medianDuration),
      maxDuration: formatDuration(maxDuration),
      resultByDuration: resultByDuration
    };
  };
 
    const  tradeDurationData = calculateTradeDurationData();
    console.log("duration data: ",tradeDurationData)
  



  // Calculate position sizing data using backend API
  const calculatePositionSizingData = async () => {
    if (!tradeObject?.trades || tradeObject.trades.length === 0) {
      console.log("📊 No trades available for position sizing calculation");
      return {
    stocks: {
          maxPositionPerTrade: 0,
          avgPositionPerTrade: 0,
          medianPositionPerTrade: 0,
          avgLeverage: 0,
          recommendedPosition: 0,
          riskPerTrade: 0
        },
    futures: {
          maxPositionPerTrade: 0,
          avgPositionPerTrade: 0,
          medianPositionPerTrade: 0,
          avgLeverage: 0,
          recommendedPosition: 0,
          riskPerTrade: 0
        },
    general: {
          maxOpenPositions: 0,
          setupsMaximosPorDia: 0,
          accountRisk: 0,
          maxRiskPerTrade: 0
        }
      };
    }

    try {
      console.log("📊 Calling position sizing API...");
      
      // Create FormData with trades data
      const formData = new FormData();
      
      console.log("📊 TradeObject structure:", {
        hasFile: !!tradeObject.file,
        hasTrades: !!tradeObject.trades,
        tradesLength: tradeObject.trades?.length,
        fileType: tradeObject.file?.type,
        fileName: tradeObject.file?.name
      });
      
      // If we have file data, use it; otherwise create a mock file
      if (tradeObject.file) {
        formData.append('file', tradeObject.file);
        console.log("📊 Using original file for position sizing API");
      } else {
        // Create a mock file from trades data for API testing
        console.log("📊 Creating mock CSV from trades data");
        const csvContent = createCSVFromTrades(tradeObject.trades);
        console.log("📊 CSV Content preview:", csvContent.substring(0, 200) + "...");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', blob, 'trades.csv');
      }

      const response = await fetch('/api/position-sizing', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Position sizing API error:", errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log("📊 Position sizing API response:", data);
      
      return data;
      
    } catch (error) {
      console.error("❌ Error calling position sizing API:", error);
      
      // Fallback to local calculation
      console.log("📊 Falling back to local position sizing calculation");
      return calculatePositionSizingLocal();
    }
  };

  // Local fallback calculation
  const calculatePositionSizingLocal = () => {
    const trades = tradeObject.trades;
    console.log("📊 Calculating position sizing locally from", trades.length, "trades");
    console.log("📊 Sample trade structure:", trades[0] ? Object.keys(trades[0]) : "No trades");
    console.log("📊 First trade data:", trades[0]);
    
    if (!trades || trades.length === 0) {
      console.log("📊 No trades available for position sizing calculation");
      return {
        stocks: {
          avgPositionPerTrade: 0,
          medianPositionPerTrade: 0,
          maxPositionPerTrade: 0,
          maxContractsPerDay: 0
        },
        futures: {
          avgPositionPerTrade: 0,
          medianPositionPerTrade: 0,
          maxPositionPerTrade: 0,
          maxContractsPerDay: 0
        },
        general: {
          maxOpenPositions: 0,
          setupsMaximosPorDia: 0,
          accountRisk: 0,
          maxRiskPerTrade: 0,
          riscoPorTrade: 2.00,
          capitalEmRisco: 0.00,
          posicaoRecomendada: 0,
          exposicaoMaxima: 0.00
        }
      };
    }
    
    // Calculate account risk (2% rule from position sizing principles)
    const totalPnL = trades.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0);
    const netProfit = Math.max(0, totalPnL); // Assume positive capital
    const accountRisk = netProfit * 0.02; // 2% risk per trade
    
    // Calculate max risk per trade (1% of account)
    const maxRiskPerTrade = netProfit * 0.01; // 1% max risk per trade
    
    // Calculate position sizes based on actual trade data
    const positionSizes = trades.map((trade: any) => {
      // Try different possible column names for position size
      const positionSize = trade.quantity_total || trade.quantity_compra || trade.quantity_venda ||
                          trade.qty_buy || trade.qty_sell || trade.quantity || 
                          trade.qty || trade.quantity_buy || trade.quantity_sell ||
                          trade.position_size || trade.size || trade.volume || 
                          trade.quantity_total || trade.quantity_compra || trade.quantity_venda || 0;
      return positionSize;
    }).filter((size: number) => size > 0);

    console.log("📊 Position sizes found:", positionSizes.length, "valid positions");
    console.log("📊 Position sizes sample:", positionSizes.slice(0, 5));
    
    // Log detailed position data for debugging
    if (trades.length > 0) {
      console.log("📊 Position data analysis:");
      trades.slice(0, 3).forEach((trade: any, index: number) => {
        console.log(`  Trade ${index + 1}:`, {
          quantity_total: trade.quantity_total,
          quantity_compra: trade.quantity_compra,
          quantity_venda: trade.quantity_venda,
          qty_buy: trade.qty_buy,
          qty_sell: trade.qty_sell,
          pnl: trade.pnl,
          symbol: trade.symbol
        });
      });
    }

    // Calculate basic position statistics
    const maxPositionPerTrade = positionSizes.length > 0 ? Math.max(...positionSizes) : 0;
    const avgPositionPerTrade = positionSizes.length > 0 ? 
      positionSizes.reduce((sum: number, size: number) => sum + size, 0) / positionSizes.length : 0;
    
    const sortedPositions = [...positionSizes].sort((a: number, b: number) => a - b);
    let medianPositionPerTrade = 0;
    
    if (sortedPositions.length > 0) {
      if (sortedPositions.length % 2 === 0) {
        // Even number of elements - take average of two middle values
        const mid1 = sortedPositions[sortedPositions.length / 2 - 1];
        const mid2 = sortedPositions[sortedPositions.length / 2];
        medianPositionPerTrade = (mid1 + mid2) / 2;
      } else {
        // Odd number of elements - take middle value
        medianPositionPerTrade = sortedPositions[Math.floor(sortedPositions.length / 2)];
      }
    }

    // Calculate max contracts per day
    const tradesByDay = trades.reduce((acc: any, trade: any) => {
      const date = new Date(trade.entry_date).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(trade);
      return acc;
    }, {});

    const maxContractsPerDay = Math.max(...Object.values(tradesByDay).map((dayTrades: any) => dayTrades.length), 0);

    // Determine if stocks or futures based on position sizes and symbols
    const avgPosition = avgPositionPerTrade;
    const symbols = trades.map((trade: any) => trade.symbol).filter(Boolean);
    const mostCommonSymbol = symbols.length > 0 ? 
      symbols.reduce((a: string, b: string) => 
        symbols.filter(v => v === a).length >= symbols.filter(v => v === b).length ? a : b
      ) : '';
    
    const assetType = detectAssetType(mostCommonSymbol);
    const isStocks = avgPosition > 100 || assetType === 'acao' || avgPosition === 0; // Default to stocks if no position data

    // Calculate recommended position based on risk management
    const recommendedPosition = maxRiskPerTrade > 0 ? Math.floor(maxRiskPerTrade / (avgPosition || 1)) : 0;

    // Calculate exposure percentage
    const totalExposure = positionSizes.reduce((sum: number, size: number) => sum + size, 0);
    const exposurePercentage = netProfit > 0 ? (totalExposure / netProfit) * 100 : 0;

    console.log("📊 Position sizing calculations:", {
      totalPnL,
      netProfit,
      accountRisk,
      maxRiskPerTrade,
      avgPositionPerTrade,
      medianPositionPerTrade,
      maxPositionPerTrade,
      maxContractsPerDay,
      isStocks,
      assetType,
      mostCommonSymbol,
      recommendedPosition,
      exposurePercentage,
      symbols: symbols.slice(0, 5)
    });

    return {
      stocks: {
        avgPositionPerTrade: isStocks ? avgPositionPerTrade : 0,
        medianPositionPerTrade: isStocks ? medianPositionPerTrade : 0,
        maxPositionPerTrade: isStocks ? maxPositionPerTrade : 0,
        maxContractsPerDay: isStocks ? maxContractsPerDay : 0
      },
      futures: {
        avgPositionPerTrade: !isStocks ? avgPositionPerTrade : 0,
        medianPositionPerTrade: !isStocks ? medianPositionPerTrade : 0,
        maxPositionPerTrade: !isStocks ? maxPositionPerTrade : 0,
        maxContractsPerDay: !isStocks ? maxContractsPerDay : 0
      },
      general: {
        maxOpenPositions: maxContractsPerDay,
        setupsMaximosPorDia: maxContractsPerDay,
        accountRisk: accountRisk,
        maxRiskPerTrade: maxRiskPerTrade,
        riscoPorTrade: 2.00,
        capitalEmRisco: accountRisk,
        posicaoRecomendada: recommendedPosition,
        exposicaoMaxima: exposurePercentage
      }
    };
  };

  // Helper function to create CSV from trades data
  const createCSVFromTrades = (trades: any[]) => {
    console.log("📊 Creating CSV from trades:", trades.length, "trades");
    console.log("📊 Sample trade structure:", trades[0] ? Object.keys(trades[0]) : "No trades");
    
    // Create CSV with proper headers that match the backend expectations
    const csvHeaders = [
      'Ativo', 'Abertura', 'Fechamento', 'Tempo Operação', 'Qtd Compra', 'Qtd Venda',
      'Lado', 'Preço Compra', 'Preço Venda', 'Preço de Mercado', 'Médio',
      'Res. Intervalo', 'Res. Intervalo (%)', 'Número Operação', 'Res. Operação', 'Res. Operação (%)',
      'Drawdown', 'Ganho Max.', 'Perda Max.', 'TET', 'Total'
    ];
    
    const csvRows = [csvHeaders.join(';')];
    
    trades.forEach((trade: any, index: number) => {
      // Map trade data to CSV format expected by backend
      // Formatar datas no formato esperado pelo backend (dd/mm/yyyy hh:mm:ss)
      const formatDate = (dateStr: any) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return '';
          return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });
        } catch {
          return '';
        }
      };

      const row = [
        trade.symbol || 'N/A',                    // Ativo
        formatDate(trade.entry_date),             // Abertura
        formatDate(trade.exit_date),              // Fechamento
        trade.duration_str || '00:00:00',        // Tempo Operação
        trade.quantity_compra || trade.qty_buy || '0',  // Qtd Compra
        trade.quantity_venda || trade.qty_sell || '0',  // Qtd Venda
        trade.direction === 'long' ? 'C' : 'V',  // Lado
        trade.entry_price || '0',                 // Preço Compra
        trade.exit_price || '0',                  // Preço Venda
        trade.market_price || '0',                // Preço de Mercado
        trade.avg_price || '0',                   // Médio
        trade.pnl || '0',                         // Res. Intervalo
        trade.pnl_pct || '0',                     // Res. Intervalo (%)
        trade.trade_number || index + 1,          // Número Operação
        trade.operation_result || trade.pnl || '0', // Res. Operação
        trade.operation_result_pct || '0',        // Res. Operação (%)
        trade.drawdown || '0',                    // Drawdown
        trade.max_gain || '0',                    // Ganho Max.
        trade.max_loss || '0',                    // Perda Max.
        trade.tet || '0',                         // TET
        trade.total || '0'                        // Total
      ];
      
      csvRows.push(row.join(';'));
    });
    
    const csvContent = csvRows.join('\n');
    console.log("📊 Generated CSV with", csvRows.length - 1, "trades");
    console.log("📊 CSV Headers:", csvHeaders.join(';'));
    console.log("📊 CSV Sample (first 2 rows):", csvRows.slice(0, 2).join('\n'));
    
    return csvContent;
  };

  // Load position sizing data when component mounts or trades change
  useEffect(() => {
    const loadPositionSizingData = async () => {
      if (tradeObject?.trades && tradeObject.trades.length > 0) {
        console.log("📊 Loading position sizing data for", tradeObject.trades.length, "trades");
        const data = await calculatePositionSizingData();
        console.log("📊 Position sizing data calculated:", data);
        setPositionSizingData(data);
      } else {
        console.log("📊 No trades available for position sizing calculation");
      }
    };

    loadPositionSizingData();
  }, [tradeObject?.trades]);

  // Debug effect to log current state
  useEffect(() => {
    console.log("📊 Current position sizing data:", positionSizingData);
    console.log("📊 Trade object:", tradeObject);
    console.log("📊 Selected asset:", selectedAsset);
    console.log("📊 Trades length:", tradeObject?.trades?.length);
    console.log("📊 Sample trade:", tradeObject?.trades?.[0]);
  }, [positionSizingData, tradeObject, selectedAsset]);

  // Animate metrics when they change
  useEffect(() => {
    // Set default values for metrics that might be missing with proper null checks
    const safeMetrics = metrics || {};

    const metricsWithDefaults = {
      profitFactor: Number(safeMetrics.profitFactor) || 0,
      sharpeRatio: Number(safeMetrics.sharpeRatio) || 0,
      recoveryFactor: Number(safeMetrics.recoveryFactor) || 0,
      averageTradeDuration: safeMetrics.averageTradeDuration || "N/A",
      maxConsecutiveWins: Number(safeMetrics.maxConsecutiveWins) || 0,
      maxConsecutiveLosses: Number(safeMetrics.maxConsecutiveLosses) || 0,
      payoff: Number(safeMetrics.payoff) || 0,
      totalTrades: Number(safeMetrics.totalTrades) || 0,
      profitableTrades: Number(safeMetrics.profitableTrades) || 0,
      lossTrades: Number(safeMetrics.lossTrades) || 0,
      averageWin: Number(safeMetrics.averageWin) || 0,
      averageLoss: Number(safeMetrics.averageLoss) || 0,
      netProfit: Number(safeMetrics.netProfit) || 0,
      maxDrawdown: Number(safeMetrics.maxDrawdown) || 0,
      maxDrawdownAmount: Number(safeMetrics.maxDrawdownAmount) || 0,
      averageTrade: Number(safeMetrics.averageTrade) || 0,
      winRate: Number(safeMetrics.winRate) || 0,
      grossProfit: Number(safeMetrics.grossProfit) || 0,
      grossLoss: Number(safeMetrics.grossLoss) || 0,
      // Métricas complementares
      stopIdealPorDia: Number(safeMetrics.stopIdealPorDia) || 120,
      resultadoDiasFuria: Number(safeMetrics.resultadoDiasFuria) || -1250.5,
      numeroDiasFuria: Number(safeMetrics.numeroDiasFuria) || 3,
      maiorGanho: Number(safeMetrics.maiorGanho) || 0,
      maiorPerda: Number(safeMetrics.maiorPerda) || 0,
      operacoesMaximasPorDia: Number(safeMetrics.operacoesMaximasPorDia) || 12,
      setupsMaximosPorDia: Number(safeMetrics.setupsMaximosPorDia) || 8,
      mediaOperacoesDia: Number(safeMetrics.mediaOperacoesDia) || 0,
      riscoPorTrade: Number(safeMetrics.riscoPorTrade) || 2.00,
      capitalEmRisco: Number(safeMetrics.capitalEmRisco) || 0.00,
      posicaoRecomendada: Number(safeMetrics.posicaoRecomendada) || 0,
      exposicaoMaxima: Number(safeMetrics.exposicaoMaxima) || 0.00,

      // Safe handling of analysis objects
      dayOfWeekAnalysis: safeMetrics.dayOfWeekAnalysis || {},
      monthlyAnalysis: safeMetrics.monthlyAnalysis || {},

      // Safe handling of best/worst day/month
      bestDay: safeMetrics.bestDay || null,
      worstDay: safeMetrics.worstDay || null,
      bestMonth: safeMetrics.bestMonth || null,
      worstMonth: safeMetrics.worstMonth || null,
    };

    setAnimatedMetrics(metricsWithDefaults);
  }, [metrics]);

  const getMetricColor = (metric: string, value: number): string => {
    if (isNaN(value) || value === null || value === undefined)
      return "text-gray-300";

    switch (metric) {
      case "profitFactor":
        return value >= 1.5
          ? "text-green-500"
          : value >= 1.0
          ? "text-yellow-500"
          : "text-red-500";
      case "payoff":
        return value >= 1.5
          ? "text-green-500"
          : value >= 1.0
          ? "text-yellow-500"
          : "text-red-500";
      case "winRate":
        return value >= 60
          ? "text-green-500"
          : value >= 45
          ? "text-yellow-500"
          : "text-red-500";
      case "maxDrawdown":
        return value <= 10
          ? "text-green-500"
          : value <= 20
          ? "text-yellow-500"
          : "text-red-500";
      case "sharpeRatio":
        return value >= 1.0
          ? "text-green-500"
          : value >= 0.5
          ? "text-yellow-500"
          : "text-red-500";
      case "recoveryFactor":
        return value >= 3
          ? "text-green-500"
          : value >= 1
          ? "text-yellow-500"
          : "text-red-500";
      case "netProfit":
        return value > 0
          ? "text-green-500"
          : value === 0
          ? "text-gray-300"
          : "text-red-500";
      default:
        return "text-gray-300";
    }
  };

  const formatMetric = (
    value: number | undefined,
    isPercentage = false,
    isCurrency = false
  ): string => {
    if (value === undefined || value === null || isNaN(Number(value)))
      return "N/A";

    const numValue = Number(value);

    if (isCurrency) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numValue);
    }

    return isPercentage ? `${numValue.toFixed(2)}%` : numValue.toFixed(2);
  };
  const filteredTradeDurationData = tradeDurationData.resultByDuration.filter(
    (trade: any) => trade.count !== 0
  )
  const tradesLucrativos = tradeObject?.trades.filter(
    (trade: any) => (
      trade.pnl > 0
      
    )
  )

  const tradesLoss = tradeObject?.trades.filter(
    (trade: any) => (
      trade.pnl < 0
    )
  )

  const tradesNull = tradeObject?.trades.filter(
    (trade: any) => (
      trade.pnl === 0
    )
  )
 const maiorGanho = Math.max(...(tradeObject?.trades || []).map((trade: any) => (trade.pnl || 0) ));
const maiorPerda = Math.min(...(tradeObject?.trades || []).map((trade: any) => (trade.pnl || 0) ));

  // Função para abrir modal de detalhes
  const handleShowDetails = (metricType: string, assetType?: string) => {
    console.log(`📊 Abrindo detalhes para: ${metricType}${assetType ? ` - ${assetType}` : ''}`);
    setSelectedMetricForDetails(metricType);
    setShowAssetDetails(true);
  };

  // Função para obter informações detalhadas
  const getDetailedInfo = (metricType: string, assetType?: string) => {
    const trades = tradeObject?.trades || [];
    const totalTrades = trades.length;
    
    // Obter dados corretos baseados no assetType
    const getDataForAssetType = (type: string) => {
      if (type === 'stocks') {
        return positionSizingData.stocks;
      } else if (type === 'futures') {
        return positionSizingData.futures;
      } else {
        // Para 'all' ou undefined, usar dados consolidados
        return {
          avgPositionPerTrade: positionSizingData.stocks.avgPositionPerTrade || positionSizingData.futures.avgPositionPerTrade || 0,
          medianPositionPerTrade: positionSizingData.stocks.medianPositionPerTrade || positionSizingData.futures.medianPositionPerTrade || 0,
          maxPositionPerTrade: positionSizingData.stocks.maxPositionPerTrade || positionSizingData.futures.maxPositionPerTrade || 0,
          maxContractsPerDay: positionSizingData.general.setupsMaximosPorDia || 0
        };
      }
    };
    
    const assetData = getDataForAssetType(assetType || 'all');
    
    console.log('📊 getDetailedInfo debug:', {
      metricType,
      assetType,
      assetData,
      positionSizingData,
      totalTrades
    });
    
    switch (metricType) {
      case 'Posição Média':
        const avgPosition = assetData.avgPositionPerTrade || 0;
        return {
          title: 'Posição Média por Trade',
          description: 'Representa o volume médio de contratos utilizados em cada operação',
          value: `${Math.round(avgPosition)} contratos`,
          details: [
            `Total de trades analisados: ${totalTrades}`,
            `Tipo de ativo: ${assetType === 'stocks' ? 'Ações' : assetType === 'futures' ? 'Futuros' : 'Misto'}`,
            `Baseado em dados reais dos trades`,
            `Valor calculado: ${avgPosition.toFixed(2)}`
          ]
        };
      
      case 'Posição Mediana':
        const medianPosition = assetData.medianPositionPerTrade || 0;
        return {
          title: 'Posição Mediana por Trade',
          description: 'Indica o valor central da distribuição de posições',
          value: `${Math.round(medianPosition)} contratos`,
          details: [
            `Representa o valor do meio quando ordenados por tamanho`,
            `Mais robusto que a média para dados assimétricos`,
            `Total de trades: ${totalTrades}`,
            `Valor calculado: ${medianPosition.toFixed(2)}`
          ]
        };
      
      case 'Posição Máxima':
        const maxPosition = assetData.maxPositionPerTrade || 0;
        return {
          title: 'Maior Posição Utilizada',
          description: 'Representa o maior volume negociado em um único trade',
          value: `${Math.round(maxPosition)} contratos`,
          details: [
            `Maior posição encontrada nos dados`,
            `Útil para entender o limite máximo utilizado`,
            `Baseado em ${totalTrades} trades analisados`,
            `Valor calculado: ${maxPosition.toFixed(2)}`
          ]
        };
      
      case 'Setup Máximo por Dia':
        const maxSetups = assetData.maxContractsPerDay || 0;
        return {
          title: 'Máximo de Setups por Dia',
          description: 'Indica o limite de operações diárias recomendado',
          value: `${maxSetups} setups`,
          details: [
            `Baseado na análise de trades por dia`,
            `Recomendação para controle de risco`,
            `Análise de ${totalTrades} trades no total`,
            `Valor calculado: ${maxSetups}`
          ]
        };
      
      default:
        return {
          title: 'Informações Detalhadas',
          description: 'Detalhes da métrica selecionada',
          value: 'N/A',
          details: ['Informações não disponíveis']
        };
    }
  };
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      {showTitle && (
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center">
          <BarChart2 className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="text-lg font-medium">Métricas de Performance</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-800 rounded-full"
        >
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      )}

      {/* Dashboard Content */}
      {!isCollapsed && (
        <div className="p-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {/* Net Profit */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Lucro Líquido</p>
              <p
                className={`text-3xl font-bold ${getMetricColor(
                  "netProfit",
                  animatedMetrics.netProfit || 0
                )}`}
              >
                {formatMetric(animatedMetrics.netProfit, false, true)}
              </p>
            </div>

            {/* Max Drawdown */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Drawdown Máximo R$</p>
              <p className="text-3xl font-bold text-red-500">
                {formatMetric(animatedMetrics.maxDrawdownAmount, false, true)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatMetric(animatedMetrics.maxDrawdown, true)} do capital
              </p>
            </div>

            {/* Total Trades */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total de Trades</p>
              <p className="text-3xl font-bold">
                {tradeObject?.trades?.length || "0"}
              </p>
            </div>

            {/* Profit Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Lucro</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "profitFactor",
                  animatedMetrics.profitFactor || 0
                )}`}
              >
                {formatMetric(animatedMetrics.profitFactor)}
              </p>
            </div>

            {/* Payoff */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Payoff</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "payoff",
                  animatedMetrics.payoff || 0
                )}`}
              >
                {formatMetric(animatedMetrics.payoff)}
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Sharpe Ratio</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "sharpeRatio",
                  animatedMetrics.sharpeRatio || 0
                )}`}
              >
                {formatMetric(animatedMetrics.sharpeRatio)}
              </p>
            </div>

            {/* Recovery Factor */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Fator de Recuperação</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "recoveryFactor",
                  animatedMetrics.recoveryFactor || 0
                )}`}
              >
                {formatMetric(animatedMetrics.recoveryFactor)}
              </p>
            </div>

            {/* Win Rate */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Taxa de Acerto</p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  "winRate",
                  animatedMetrics.winRate || 0
                )}`}
              >
                {formatMetric(animatedMetrics.winRate, true)}
              </p>
            </div>
          </div>



          {/* Trade Statistics and Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 text-blue-400 mr-2" />
                Estatísticas de Trades
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Total de Trades</td>
                    <td className="py-2 text-right">
                     {tradeObject?.trades?.length || "0"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right text-green-500">
                      {tradesLucrativos.length|| "0"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right text-red-500">
                      {tradesLoss.length|| "0"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Zerados</td>
                    <td className="py-2 text-right text-white">
                      {tradesNull.length|| "0"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Médio</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(animatedMetrics.averageWin, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Média</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(
                        Math.abs(animatedMetrics.averageLoss || 0),
                        false,
                        true
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">
                      Máx. Perdas Consecutivas
                    </td>
                    <td className="py-2 text-right">
                      {animatedMetrics.maxConsecutiveLosses || "0"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">
                      Máx. Ganhos Consecutivos
                    </td>
                    <td className="py-2 text-right text-green-500">
                      {animatedMetrics.maxConsecutiveWins || "0"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Award className="w-4 h-4 text-blue-400 mr-2" />
                Métricas Avançadas
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trade Médio</td>
                    <td className="py-2 text-right">
                    {formatMetric(((animatedMetrics.averageWin || 0) - Math.abs(animatedMetrics.averageLoss || 0)), false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Ganho</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(maiorGanho, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Maior Perda</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(maiorPerda, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Ganho Bruto</td>
                    <td className="py-2 text-right text-green-500">
                      {formatMetric(animatedMetrics.grossProfit, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Perda Bruta</td>
                    <td className="py-2 text-right text-red-500">
                      {formatMetric(animatedMetrics.grossLoss, false, true)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Trades Lucrativos</td>
                    <td className="py-2 text-right">
                      {formatMetric(animatedMetrics.winRate, true)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-400">Trades com Perda</td>
                    <td className="py-2 text-right">
                      {formatMetric(100 - (animatedMetrics.winRate || 0), true)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trade Duration Section - Moved below advanced metrics */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium">Duração dos Trades</h3>
              </div>
              <button 
                onClick={() => setShowTradeDuration(!showTradeDuration)}
                className="p-1.5 hover:bg-gray-700 rounded-md"
              >
                {showTradeDuration ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {!showTradeDuration ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Duração Média</p>
                  <p className="text-xl font-bold">{tradeDurationData.averageDuration}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Duração Mediana</p>
                  <p className="text-xl font-bold">{tradeDurationData.medianDuration}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Duração Máxima</p>
                  <p className="text-xl font-bold">{tradeDurationData.maxDuration}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Duração Média</p>
                    <p className="text-xl font-bold">{tradeDurationData.averageDuration}</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Duração Mediana</p>
                    <p className="text-xl font-bold">{tradeDurationData.medianDuration}</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Duração Máxima</p>
                    <p className="text-xl font-bold">{tradeDurationData.maxDuration}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3 text-gray-300">Análise por Faixa de Duração</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-700">
                          <th className="px-3 py-2 text-left">Duração</th>
                          <th className="px-3 py-2 text-center">Trades</th>
                          <th className="px-3 py-2 text-center">Fator de Lucro</th>
                          <th className="px-3 py-2 text-center">Taxa de Acerto</th>
                          <th className="px-3 py-2 text-center">Payoff</th>
                          <th className="px-3 py-2 text-right">Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTradeDurationData.map((item, index) => (
                          <tr key={index} className="border-b border-gray-700">
                            <td className="px-3 py-2">{item.duration}</td>
                            <td className="px-3 py-2 text-center">{item.count}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={
                                item.profitFactor >= 1.5 ? 'text-green-400' : 
                                item.profitFactor >= 1.0 ? 'text-yellow-400' : 
                                'text-red-400'
                              }>
                                {item.profitFactor.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={
                                item.winRate >= 60 ? 'text-green-400' : 
                                item.winRate >= 45 ? 'text-yellow-400' : 
                                'text-red-400'
                              }>
                                {item.winRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={
                                item.payoff >= 1.5 ? 'text-green-400' : 
                                item.payoff >= 1.0 ? 'text-yellow-400' : 
                                'text-red-400'
                              }>
                                {item.payoff.toFixed(2)}
                              </span>
                            </td>
                            <td className={`px-3 py-2 text-right ${item.result > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatMetric(item.result, false, true)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg">
                  <div className="flex items-start">
                    <BarChart2 className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-300 mb-2">Insights de Duração</h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        <li>• Trades entre 1-2 horas apresentam melhor resultado e fator de lucro (2.10)</li>
                        <li>• Operações muito curtas (menos de 30 min) tendem a ser negativas com baixa taxa de acerto (38.5%)</li>
                        <li>• Melhor payoff (1.65) e taxa de acerto (65.8%) na faixa de 1-2 horas</li>
                        <li>• Trades longos &gt;4h mostram baixo fator de lucro (0.78) e payoff abaixo de 1</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Position Sizing Section - Moved below Trade Duration */}
          <div className="mb-6">
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-5 mb-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-purple-500 bg-opacity-20 p-2 rounded-full mr-3">
                    <Wallet className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-lg">Dimensionamento de Posição</h3>
                </div>
                <button
                  onClick={() => setShowPositionSizing(!showPositionSizing)}
                  className="p-1.5 hover:bg-gray-600 rounded"
                >
                  {showPositionSizing ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              {showPositionSizing && (
                <div className="space-y-6">
                  {/* Asset Selector */}
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-md font-medium mb-3 flex items-center text-white">
                      <BarChartHorizontal className="w-5 h-5 text-gray-300 mr-2" />
                      Seletor de Ativo
                    </h4>
                    
                    {/* Asset Dropdown */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">Selecione o Ativo:</label>
                      <select 
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="all">Todos os Ativos</option>
                        {getUniqueAssets().map((asset, index) => (
                          <option key={index} value={asset}>
                            {asset} ({detectAssetType(asset)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Position Metrics Table - Using the same visual as "Resultado por Horário" */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-3 px-4 font-medium text-gray-300">Métrica</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-300">Ações</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-300">Futuros</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-300">Consolidado</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700 bg-gray-800">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Wallet className="w-4 h-4 text-purple-400 mr-2" />
                                <span className="text-white">Posição Média</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">{Math.round(positionSizingData.stocks.avgPositionPerTrade || 0)}</span>
                                <button
                                  onClick={() => handleShowDetails('Posição Média', 'stocks')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Ações"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">{Math.round(positionSizingData.futures.avgPositionPerTrade || 0)}</span>
                                <button
                                  onClick={() => handleShowDetails('Posição Média', 'futures')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Futuros"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">
                                  {selectedAsset === 'all' 
                                    ? Math.round(positionSizingData.stocks.avgPositionPerTrade || positionSizingData.futures.avgPositionPerTrade || 0)
                                    : Math.round(getAssetPositionData(selectedAsset)?.avgPosition || 0)
                                  }
                                </span>
                                <button
                                  onClick={() => handleShowDetails('Posição Média', 'all')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Consolidado"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700 bg-gray-700">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Wallet className="w-4 h-4 text-purple-400 mr-2" />
                                <span className="text-white">Posição Mediana</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">{Math.round(positionSizingData.stocks.medianPositionPerTrade || 0)}</span>
                                <button
                                  onClick={() => handleShowDetails('Posição Mediana', 'stocks')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Ações"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">{Math.round(positionSizingData.futures.medianPositionPerTrade || 0)}</span>
                                <button
                                  onClick={() => handleShowDetails('Posição Mediana', 'futures')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Futuros"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">
                                  {selectedAsset === 'all' 
                                    ? Math.round(positionSizingData.stocks.medianPositionPerTrade || positionSizingData.futures.medianPositionPerTrade || 0)
                                    : Math.round(getAssetPositionData(selectedAsset)?.medianPosition || 0)
                                  }
                                </span>
                                <button
                                  onClick={() => handleShowDetails('Posição Mediana', 'all')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Consolidado"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700 bg-gray-800">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Wallet className="w-4 h-4 text-purple-400 mr-2" />
                                <span className="text-white">Posição Máxima</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">{Math.round(positionSizingData.stocks.maxPositionPerTrade || 0)}</span>
                                <button
                                  onClick={() => handleShowDetails('Posição Máxima', 'stocks')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Ações"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">{Math.round(positionSizingData.futures.maxPositionPerTrade || 0)}</span>
                                <button
                                  onClick={() => handleShowDetails('Posição Máxima', 'futures')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Futuros"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">
                                  {selectedAsset === 'all' 
                                    ? Math.round(positionSizingData.stocks.maxPositionPerTrade || positionSizingData.futures.maxPositionPerTrade || 0)
                                    : Math.round(getAssetPositionData(selectedAsset)?.maxPosition || 0)
                                  }
                                </span>
                                <button
                                  onClick={() => handleShowDetails('Posição Máxima', 'all')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Consolidado"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700 bg-gray-700">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Wallet className="w-4 h-4 text-purple-400 mr-2" />
                                <span className="text-white">Setup Máximo por Dia</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">{positionSizingData.stocks.maxContractsPerDay || 0}</span>
                                <button
                                  onClick={() => handleShowDetails('Setup Máximo por Dia', 'stocks')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Ações"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">{positionSizingData.futures.maxContractsPerDay || 0}</span>
                                <button
                                  onClick={() => handleShowDetails('Setup Máximo por Dia', 'futures')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Futuros"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-white">
                                  {selectedAsset === 'all' 
                                    ? positionSizingData.general.setupsMaximosPorDia || 0
                                    : getAssetPositionData(selectedAsset)?.maxContractsPerDay || 0
                                  }
                                </span>
                                <button
                                  onClick={() => handleShowDetails('Setup Máximo por Dia', 'all')}
                                  className="hover:bg-gray-600 p-1 rounded transition-colors"
                                  title="Detalhes - Consolidado"
                                >
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                   {/* Asset Details Modal */}
                   {showAssetDetails && selectedMetricForDetails && (
                     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                       <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
                         <div className="flex items-center justify-between mb-4">
                           <h3 className="text-lg font-semibold text-white">
                             {getDetailedInfo(selectedMetricForDetails).title}
                           </h3>
                           <button
                             onClick={() => setShowAssetDetails(false)}
                             className="text-gray-400 hover:text-white transition-colors"
                           >
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                           </button>
                         </div>
                         
                         <div className="space-y-4">
                           <div>
                             <p className="text-gray-300 text-sm mb-2">
                               {getDetailedInfo(selectedMetricForDetails).description}
                             </p>
                             <div className="bg-gray-700 p-3 rounded-lg">
                               <p className="text-2xl font-bold text-white">
                                 {getDetailedInfo(selectedMetricForDetails).value}
                               </p>
                             </div>
                           </div>
                           
                           <div>
                             <h4 className="text-sm font-medium text-gray-300 mb-2">Detalhes:</h4>
                             <ul className="space-y-1">
                               {getDetailedInfo(selectedMetricForDetails).details.map((detail, index) => (
                                 <li key={index} className="text-sm text-gray-400 flex items-start">
                                   <span className="text-purple-400 mr-2">•</span>
                                   {detail}
                                 </li>
                               ))}
                             </ul>
                           </div>
                           
                           <div className="flex justify-end pt-4">
                             <button
                               onClick={() => setShowAssetDetails(false)}
                               className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                             >
                               Fechar
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
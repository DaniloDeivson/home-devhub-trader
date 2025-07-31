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
  TrendingDown
} from "lucide-react";

interface MetricsDashboardProps {
  tradeObject: any;
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
    averageTradeDuration?: string; // Duration in hours, minutes
    dayOfWeekAnalysis?: Record<
      string,
      { trades: number; winRate: number; profitFactor: number }
    >;
    monthlyAnalysis?: Record<
      string,
      { trades: number; winRate: number; profitFactor: number }
    >;
    // Métricas complementares
    stopIdealPorDia?: number;
    resultadoDiasFuria?: number;
    numeroDiasFuria?: number;
    maiorGanho?: number;
    maiorPerda?: number;
    operacoesMaximasPorDia?: number;
    setupsMaximosPorDia?: number;
    mediaOperacoesDia?: number;
    // Dados diretos da API
    bestDay?: {
      day: string;
      trades: number;
      winRate: number;
      profitFactor: number;
    } | null;
    worstDay?: {
      day: string;
      trades: number;
      winRate: number;
      profitFactor: number;
    } | null;
    bestMonth?: {
      month: string;
      trades: number;
      winRate: number;
      profitFactor: number;
    } | null;
    worstMonth?: {
      month: string;
      trades: number;
      winRate: number;
      profitFactor: number;
    } | null;
  };
}

export function MetricsDashboard({ metrics, tradeObject, showTitle = true }: MetricsDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animatedMetrics, setAnimatedMetrics] = useState<any>({});
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(true);
  const [showTradeDuration, setShowTradeDuration] = useState(false);
  const [showPositionSizing, setShowPositionSizing] = useState(false);
  const trade = tradeObject?.trades;
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
    const tradesWithDuration = trade?.map(t => {
      const entryDate = new Date(t.entry_date);
      const exitDate = new Date(t.exit_date);
      const durationHours = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
      
      return {
        ...t,
        durationHours: durationHours
      };
    });

    // Calculate basic duration statistics
    const durations = tradesWithDuration.map(t => t.durationHours);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const medianDuration = sortedDurations[Math.floor(sortedDurations.length / 2)];
    const maxDuration = Math.max(...durations);

    // Format duration helper function
    const formatDuration = (hours) => {
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
      const rangeTradesData = tradesWithDuration.filter(t => 
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

      const totalResult = rangeTradesData.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winningTrades = rangeTradesData.filter(t => (t.pnl || 0) > 0);
      const losingTrades = rangeTradesData.filter(t => (t.pnl || 0) < 0);
      
      const winRate = (winningTrades.length / rangeTradesData.length) * 100;
      
      const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
      
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
    
    // Calculate account risk (2% rule from position sizing principles)
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const netProfit = Math.max(0, totalPnL); // Assume positive capital
    const accountRisk = netProfit * 0.02; // 2% risk per trade
    
    // Calculate max risk per trade (1% of account)
    const maxRiskPerTrade = netProfit * 0.01; // 1% max risk per trade
    
    // Calculate position sizes based on actual trade data
    const positionSizes = trades.map(trade => {
      // Try different possible column names for position size
      const positionSize = trade.quantity_total || trade.quantity_compra || trade.quantity_venda ||
                          trade.qty_buy || trade.qty_sell || trade.quantity || 
                          trade.qty || trade.quantity_buy || trade.quantity_sell ||
                          trade.position_size || trade.size || trade.volume || 0;
      return positionSize;
    }).filter(size => size > 0);

    console.log("📊 Position sizes found:", positionSizes.length, "valid positions");
    console.log("📊 Sample trade structure:", trades[0] ? Object.keys(trades[0]) : "No trades");
    console.log("📊 First trade data:", trades[0]);
    
    // Log detailed position data for debugging
    if (trades.length > 0) {
      console.log("📊 Position data analysis:");
      trades.slice(0, 3).forEach((trade, index) => {
        console.log(`  Trade ${index + 1}:`, {
          quantity_total: trade.quantity_total,
          quantity_compra: trade.quantity_compra,
          quantity_venda: trade.quantity_venda,
          qty_buy: trade.qty_buy,
          qty_sell: trade.qty_sell,
          pnl: trade.pnl
        });
      });
    }

    // Calculate basic position statistics
    const maxPositionPerTrade = positionSizes.length > 0 ? Math.max(...positionSizes) : 0;
    const avgPositionPerTrade = positionSizes.length > 0 ? 
      positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length : 0;
    
    const sortedPositions = [...positionSizes].sort((a, b) => a - b);
    const medianPositionPerTrade = sortedPositions.length > 0 ? 
      sortedPositions[Math.floor(sortedPositions.length / 2)] : 0;

    // Calculate max open positions (trades on the same day)
    const tradesByDate = {};
    trades.forEach(trade => {
      const date = new Date(trade.entry_date).toDateString();
      if (!tradesByDate[date]) {
        tradesByDate[date] = [];
      }
      tradesByDate[date].push(trade);
    });

    const maxOpenPositions = Math.max(...Object.values(tradesByDate).map(trades => trades.length));
    const setupsMaximosPorDia = maxOpenPositions;

    // Calculate average trade risk (stop loss distance)
    const tradeRisks = trades.map(trade => {
      // Estimate risk based on average loss
      return Math.abs(trade.pnl || 0);
    }).filter(risk => risk > 0);
    
    const avgTradeRisk = tradeRisks.length > 0 ? 
      tradeRisks.reduce((sum, risk) => sum + risk, 0) / tradeRisks.length : 0;

    // Calculate recommended position size using position sizing formula
    // Position Size = Account Risk / Trade Risk
    const recommendedPosition = avgTradeRisk > 0 ? Math.floor(accountRisk / avgTradeRisk) : 0;

    // Determine if it's stocks or futures based on position sizes and trade characteristics
    const avgTradeValue = Math.abs(trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / trades.length);
    const isStocks = avgPositionPerTrade > 100 || avgTradeValue > 1000; // Stocks typically have larger position sizes
    
    console.log("📊 Position sizing analysis:");
    console.log("  - Account risk (2%):", accountRisk);
    console.log("  - Max risk per trade (1%):", maxRiskPerTrade);
    console.log("  - Average trade risk:", avgTradeRisk);
    console.log("  - Recommended position size:", recommendedPosition);
    console.log("  - Asset type:", isStocks ? "Stocks" : "Futures");
    
    // Calculate leverage based on asset type
    const avgLeverage = isStocks ? 0.85 : 3.2;

    return {
      stocks: isStocks ? {
        maxPositionPerTrade: maxPositionPerTrade,
        avgPositionPerTrade: Math.round(avgPositionPerTrade),
        medianPositionPerTrade: Math.round(medianPositionPerTrade),
        avgLeverage: avgLeverage,
        recommendedPosition: recommendedPosition,
        riskPerTrade: avgTradeRisk
      } : {
        maxPositionPerTrade: 0,
        avgPositionPerTrade: 0,
        medianPositionPerTrade: 0,
        avgLeverage: 0,
        recommendedPosition: 0,
        riskPerTrade: 0
      },
      futures: !isStocks ? {
        maxPositionPerTrade: maxPositionPerTrade,
        avgPositionPerTrade: Math.round(avgPositionPerTrade),
        medianPositionPerTrade: Math.round(medianPositionPerTrade),
        avgLeverage: avgLeverage,
        recommendedPosition: recommendedPosition,
        riskPerTrade: avgTradeRisk
      } : {
        maxPositionPerTrade: 0,
        avgPositionPerTrade: 0,
        medianPositionPerTrade: 0,
        avgLeverage: 0,
        recommendedPosition: 0,
        riskPerTrade: 0
      },
      general: {
        maxOpenPositions: maxOpenPositions,
        setupsMaximosPorDia: setupsMaximosPorDia,
        accountRisk: accountRisk,
        maxRiskPerTrade: maxRiskPerTrade
      }
    };
  };

  // Helper function to create CSV from trades data
  const createCSVFromTrades = (trades) => {
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
    
    trades.forEach((trade, index) => {
      // Map trade data to CSV format expected by backend
      // Formatar datas no formato esperado pelo backend (dd/mm/yyyy hh:mm:ss)
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return '';
          return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });
        } catch (e) {
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

  const [positionSizingData, setPositionSizingData] = useState({
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
  });

  // Load position sizing data when component mounts or trades change
  useEffect(() => {
    const loadPositionSizingData = async () => {
      if (tradeObject?.trades && tradeObject.trades.length > 0) {
        const data = await calculatePositionSizingData();
        setPositionSizingData(data);
      }
    };

    loadPositionSizingData();
  }, [tradeObject?.trades]);

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
        // PADRONIZAÇÃO: Usar valores padronizados quando disponíveis
        maxDrawdownPadronizado: Number(safeMetrics.maxDrawdownPadronizado) || Number(safeMetrics.maxDrawdown) || 0,
        maxDrawdownPctPadronizado: Number(safeMetrics.maxDrawdownPctPadronizado) || Number(safeMetrics.maxDrawdownPct) || 0,
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
    (trade) =>trade.count !== 0
  )
  const tradesLucrativos = tradeObject?.trades.filter(
    (trade) => (
      trade.pnl > 0
      
    )
  )

  const tradesLoss = tradeObject?.trades.filter(
    (trade) => (
      trade.pnl < 0
    )
  )

  const tradesNull = tradeObject?.trades.filter(
    (trade) => (
      trade.pnl === 0
    )
  )
 const maiorGanho = Math.max(...(tradeObject?.trades || []).map(trade => (trade.pnl || 0) ));
const maiorPerda = Math.min(...(tradeObject?.trades || []).map(trade => (trade.pnl || 0) ));
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
                {formatMetric(animatedMetrics.maxDrawdownPadronizado || animatedMetrics.maxDrawdownAmount, false, true)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatMetric(animatedMetrics.maxDrawdownPctPadronizado || animatedMetrics.maxDrawdown, true)} do capital
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

          {/* Position Sizing Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-medium">Dimensionamento de Posição</h3>
              </div>
              <button
                onClick={() => setShowPositionSizing(!showPositionSizing)}
                className="p-1 hover:bg-gray-800 rounded-full"
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
                {/* Stocks vs Futures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stocks Section */}
                  <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 className="text-lg font-medium mb-3 flex items-center">
                      <BarChartHorizontal className="w-5 h-5 text-blue-400 mr-2" />
                      Ações
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Máxima por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.stocks.maxPositionPerTrade} ações
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Média por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.stocks.avgPositionPerTrade} ações
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Mediana por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.stocks.medianPositionPerTrade} ações
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Recomendada</span>
                        <span className="font-medium text-blue-400">
                          {positionSizingData.stocks.recommendedPosition} ações
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Risco por Trade</span>
                        <span className="font-medium text-red-400">
                          {formatMetric(positionSizingData.stocks.riskPerTrade, false, true)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Futures Section */}
                  <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                    <h4 className="text-lg font-medium mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                      Futuros
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Máxima por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.futures.maxPositionPerTrade} contratos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Média por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.futures.avgPositionPerTrade} contratos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Mediana por Trade</span>
                        <span className="font-medium">
                          {positionSizingData.futures.medianPositionPerTrade} contratos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Posição Recomendada</span>
                        <span className="font-medium text-blue-400">
                          {positionSizingData.futures.recommendedPosition} contratos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Risco por Trade</span>
                        <span className="font-medium text-red-400">
                          {formatMetric(positionSizingData.futures.riskPerTrade, false, true)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Position Metrics */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 text-yellow-400 mr-2" />
                    Métricas de Risco e Posicionamento
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Posições Abertas Máximas</p>
                      <p className="text-lg font-medium">
                        {positionSizingData.general.maxOpenPositions} posições
                      </p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Setups Máximos por Dia</p>
                      <p className="text-lg font-medium">
                        {positionSizingData.general.setupsMaximosPorDia} setups
                      </p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Risco por Trade (2%)</p>
                      <p className="text-lg font-medium text-blue-400">
                        {formatMetric(positionSizingData.general.accountRisk, false, true)}
                      </p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Risco Máximo por Trade (1%)</p>
                      <p className="text-lg font-medium text-red-400">
                        {formatMetric(positionSizingData.general.maxRiskPerTrade, false, true)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <TrendingDown className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-300 mb-2">Análise de Risco e Position Sizing</h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        <li>• <strong>Account Risk (2%):</strong> {formatMetric(positionSizingData.general.accountRisk, false, true)} - Risco máximo por trade</li>
                        <li>• <strong>Max Risk (1%):</strong> {formatMetric(positionSizingData.general.maxRiskPerTrade, false, true)} - Limite conservador por operação</li>
                        <li>• <strong>Posição Recomendada:</strong> {positionSizingData.stocks.recommendedPosition || positionSizingData.futures.recommendedPosition} unidades baseada no risco</li>
                        <li>• <strong>Máximo de {positionSizingData.general.maxOpenPositions} posições simultâneas</strong> - Controle de exposição</li>
                        <li>• <strong>Limite de {positionSizingData.general.setupsMaximosPorDia} setups/dia</strong> - Gestão de disciplina</li>
                        <li>• <strong>Fórmula aplicada:</strong> Position Size = Account Risk ÷ Trade Risk</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
        </div>
      )}
    </div>
  );
}
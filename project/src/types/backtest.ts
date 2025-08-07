// Interfaces compartilhadas para tipagem do backtest

export interface PerformanceMetrics {
  "Average Win": number;
  "Average Loss": number;
  "Win Rate (%)": number;
  "Net Profit"?: number;
  "Total Trades"?: number;
  "Gross Profit"?: number;
  "Gross Loss"?: number;
}

export interface DayStats {
  Trades: number;
  "Win Rate (%)": number;
  "Profit Factor": number;
  "Average Win"?: number;
  "Average Loss"?: number;
  "Rentabilidade ($)"?: number;
}

export interface WeekStats {
  Trades: number;
  "Win Rate (%)": number;
  "Profit Factor": number;
  "Average Win"?: number;
  "Average Loss"?: number;
  "Rentabilidade ($)"?: number;
}

export interface MonthStats {
  Trades: number;
  "Win Rate (%)": number;
  "Profit Factor": number;
  "Average Win"?: number;
  "Average Loss"?: number;
  "Rentabilidade ($)"?: number;
}

export interface BestWorstDay {
  Day: string;
  Trades: number;
  "Win Rate (%)": number;
  "Profit Factor": number;
  "Average Win"?: number;
  "Average Loss"?: number;
}

export interface BestWorstMonth {
  Month: string;
  Trades: number;
  "Win Rate (%)": number;
  "Profit Factor": number;
  "Average Win"?: number;
  "Average Loss"?: number;
}

export interface BestWorstWeek {
  Week: string;
  Trades: number;
  "Win Rate (%)": number;
  "Profit Factor": number;
  "Average Win"?: number;
  "Average Loss"?: number;
}

export interface DayOfWeekAnalysis {
  "Best Day": BestWorstDay;
  "Worst Day": BestWorstDay;
  Stats: Record<string, DayStats>;
}

export interface MonthlyAnalysis {
  "Best Month": BestWorstMonth;
  "Worst Month": BestWorstMonth;
  Stats: Record<string, MonthStats>;
}

export interface WeeklyAnalysis {
  "Best Week": BestWorstWeek;
  "Worst Week": BestWorstWeek;
  Stats: Record<string, WeekStats>;
}

export interface BacktestResult {
  "Performance Metrics": PerformanceMetrics;
  "Day of Week Analysis"?: DayOfWeekAnalysis;
  "Monthly Analysis"?: MonthlyAnalysis;
  "Weekly Analysis"?: WeeklyAnalysis;
  "Max Drawdown"?: number; // Drawdown fixo de todas as estratégias
}

export interface Trade {
  entry_date: string;
  pnl: number;
  [key: string]: unknown;
}

export interface TradesData {
  trades?: Trade[];
  maxDrawdown?: number; // Drawdown fixo de todas as estratégias
  statistics?: {
    temporal?: {
      hourly?: Record<string, { count: number; sum: number }>;
    };
  };
  [key: string]: unknown;
}

export interface DailyMetrics {
  metricas_principais: {
    sharpe_ratio: number;
    fator_recuperacao: number;
    drawdown_maximo: number;
    drawdown_maximo_pct: number;
    dias_operados: number;
    resultado_liquido: number;
  };
  ganhos_perdas: {
    ganho_medio_diario: number;
    perda_media_diaria: number;
    payoff_diario: number;
    ganho_maximo_diario: number;
    perda_maxima_diaria: number;
  };
  estatisticas_operacao: {
    media_operacoes_dia: number;
    taxa_acerto_diaria: number;
    dias_vencedores_perdedores: string;
    dias_perdedores_consecutivos: number;
    dias_vencedores_consecutivos: number;
  };
}

export interface HourlyData {
  horario: string;
  trades: number;
  winRate: number;
  profitFactor: number;
  resultado: number;
}

export interface CategoryData {
  nome: string;
  horarios: HourlyData[];
  totalTrades: number;
  totalResultado: number;
  avgWinRate: number;
  avgProfitFactor: number;
} 
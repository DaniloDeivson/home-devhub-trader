import React from 'react';
import DailyMetricsCards from './Metrics';
import { 
  BarChart2, ChevronUp, ChevronDown, Calendar, 
  AlertTriangle, BarChart, PieChart,
  Star
} from 'lucide-react';
import HourlyAnalysis from './hour';
import { BacktestResult, TradesData } from '../types/backtest';

interface DailyAnalysisSectionProps {
  showDailyAnalysis: boolean;
  setShowDailyAnalysis: (show: boolean) => void;
  backtestResult: BacktestResult | null;
  tradesData: TradesData | null;
  fileResults?: { [key: string]: unknown } | null; // Adicionado para múltiplos CSVs
}

// Mapeamento de dias da semana em inglês para português
const dayTranslations: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

// Mapeamento de meses em inglês para português
const monthTranslations: Record<string, string> = {
  january: "Janeiro",
  february: "Fevereiro",
  march: "Março",
  april: "Abril",
  may: "Maio",
  june: "Junho",
  july: "Julho",
  august: "Agosto",
  september: "Setembro",
  october: "Outubro",
  november: "Novembro",
  december: "Dezembro",
};

// Ordem correta dos dias da semana
const dayOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Ordem correta dos meses
const monthOrder = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// Função para traduzir nomes de semanas
const translateWeekName = (weekName: string): string => {
  if (weekName.startsWith("Week ")) {
    const weekNumber = weekName.replace("Week ", "");
    return `Semana ${weekNumber}`;
  }
  return weekName;
};

export function DailyAnalysisSection({
  showDailyAnalysis,
  setShowDailyAnalysis,
  tradesData,
  backtestResult,
  fileResults
}: DailyAnalysisSectionProps) {
  // State for showing/hiding sections - set to false by default
  const [showDayOfWeek, setShowDayOfWeek] = React.useState(false);
  const [showMonthly, setShowMonthly] = React.useState(false);
  const [showWeekly, setShowWeekly] = React.useState(false);
  const [showCalendarView, setShowCalendarView] = React.useState(true);
  const [showMonthCalendar, setShowMonthCalendar] = React.useState(true);
  const [showWeekCalendar, setShowWeekCalendar] = React.useState(true);

  // Guard clause to prevent rendering if backtestResult is null
  if (!backtestResult) return null;
  
  // Day of Week Analysis data
  const dayOfWeekAnalysis = backtestResult["Day of Week Analysis"];
  const bestDay = dayOfWeekAnalysis?.["Best Day"];
  const worstDay = dayOfWeekAnalysis?.["Worst Day"];
  
  // Monthly Analysis data
  const monthlyAnalysis = backtestResult["Monthly Analysis"];
  const bestMonth = monthlyAnalysis?.["Best Month"];
  const worstMonth = monthlyAnalysis?.["Worst Month"];
  
  // Weekly Analysis data
  const weeklyAnalysis = backtestResult["Weekly Analysis"];
  const bestWeek = weeklyAnalysis?.["Best Week"];
  const worstWeek = weeklyAnalysis?.["Worst Week"];

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



  const renderDayCalendar = () => {
  return (
    <div className="grid grid-cols-7 gap-1 mt-4">
      {dayOrder.map((day) => {
        // CORREÇÃO: Buscar nos dados corretos
        let data = null;
        
        if (dayOfWeekAnalysis?.Stats) {
          const dayKeyMap = {
            "monday": "Monday",
            "tuesday": "Tuesday", 
            "wednesday": "Wednesday",
            "thursday": "Thursday",
            "friday": "Friday",
            "saturday": "Saturday",
            "sunday": "Sunday"
          };
          
          const apiKey = dayKeyMap[day];
          data = dayOfWeekAnalysis.Stats[apiKey];
        }
        
        // Dados padrão se não encontrar
        if (!data) {
          data = {
            Trades: 0,
            "Win Rate (%)": 0,
            "Profit Factor": 0,
          };
        }

        const profitFactor = Number(data["Profit Factor"]) || 0;
        const trades = Number(data["Trades"]) || 0;
        const winRate = Number(data["Win Rate (%)"]) || 0;

        const bgColor =
          profitFactor >= 1.5
            ? "bg-green-900"
            : profitFactor >= 1.0
            ? "bg-yellow-900"
            : "bg-red-900";
        const textColor =
          profitFactor >= 1.5
            ? "text-green-300"
            : profitFactor >= 1.0
            ? "text-yellow-300"
            : "text-red-300";

        return (
          <div
            key={day}
            className={`p-3 rounded-lg ${bgColor} ${
              trades === 0 ? "opacity-50" : ""
            }`}
          >
            <p className="text-sm font-medium mb-2 text-white">
              {dayTranslations[day]?.substring(0, 3) || day.substring(0, 3)}
            </p>
            <div className="flex flex-col space-y-2">
              <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                <p className="text-xs text-gray-400">Fator</p>
                <p className={`text-sm font-bold ${textColor}`}>
                  {profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                <p className="text-xs text-gray-400">Acerto</p>
                <p className={`text-sm font-bold ${
                  winRate >= 60 ? "text-green-300" : 
                  winRate >= 45 ? "text-yellow-300" : 
                  "text-red-300"
                }`}>
                  {winRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                <p className="text-xs text-gray-400">Trades</p>
                <p className="text-sm font-bold text-white">{trades}</p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                <p className="text-xs text-gray-400">Rentabilidade</p>
                <p className={`text-sm font-bold ${
                  (data["Rentabilidade ($)"] || 0) > 0 ? "text-green-300" : 
                  (data["Rentabilidade ($)"] || 0) < 0 ? "text-red-300" : 
                  "text-gray-300"
                }`}>
                  {formatMetric(data["Rentabilidade ($)"], false, true)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

  // Renderiza o calendário de semanas
  const renderWeekCalendar = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {weeklyAnalysis?.Stats && Object.entries(weeklyAnalysis.Stats)
          .sort(([weekA], [weekB]) => {
            // Extrair números das semanas para ordenação numérica
            const numA = parseInt(weekA.replace(/\D/g, '')) || 0;
            const numB = parseInt(weekB.replace(/\D/g, '')) || 0;
            return numA - numB;
          })
          .map(([week, data]) => {
          const profitFactor = Number(data["Profit Factor"]) || 0;
          const trades = Number(data["Trades"]) || 0;
          const winRate = Number(data["Win Rate (%)"]) || 0;

          // Determine background color based on profit factor
          const bgColor =
            profitFactor >= 1.5
              ? "bg-green-900"
              : profitFactor >= 1.0
              ? "bg-yellow-900"
              : "bg-red-900";
          
          // Determine text color based on profit factor
          const textColor =
            profitFactor >= 1.5
              ? "text-green-300"
              : profitFactor >= 1.0
              ? "text-yellow-300"
              : "text-red-300";

          return (
            <div
              key={week}
              className={`p-3 rounded-lg ${bgColor} ${
                trades === 0 ? "opacity-50" : ""
              }`}
            >
              <p className="text-sm font-medium mb-2 text-white">
                {translateWeekName(week)}
              </p>
              <div className="flex flex-col space-y-2">
                <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                  <p className="text-xs text-gray-400">Fator</p>
                  <p className={`text-sm font-bold ${textColor}`}>
                    {profitFactor.toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                  <p className="text-xs text-gray-400">Acerto</p>
                  <p className={`text-sm font-bold ${
                    winRate >= 60 ? "text-green-300" : 
                    winRate >= 45 ? "text-yellow-300" : 
                    "text-red-300"
                  }`}>
                    {winRate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                  <p className="text-xs text-gray-400">Trades</p>
                  <p className="text-sm font-bold text-white">{trades}</p>
                </div>
                <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                  <p className="text-xs text-gray-400">Média Ganho</p>
                  <p className="text-sm font-bold text-green-300">
                    {formatMetric(data["Average Win"], false, true)}
                  </p>
                </div>
                <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                  <p className="text-xs text-gray-400">Média Perda</p>
                  <p className="text-sm font-bold text-red-300">
                    {formatMetric(data["Average Loss"], false, true)}
                  </p>
                </div>
                <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                  <p className="text-xs text-gray-400">Rentabilidade</p>
                  <p className={`text-sm font-bold ${
                    (data["Rentabilidade ($)"] || 0) > 0 ? "text-green-300" : 
                    (data["Rentabilidade ($)"] || 0) < 0 ? "text-red-300" : 
                    "text-gray-300"
                  }`}>
                    {formatMetric(data["Rentabilidade ($)"], false, true)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderiza o calendário de meses
  const renderMonthCalendar = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {monthOrder.map((month) => {
        // CORREÇÃO: Buscar nos dados corretos da API
        let data = null;
        
        if (monthlyAnalysis?.Stats) {
          const monthKeyMap = {
            "january": "January",
            "february": "February",
            "march": "March",
            "april": "April",
            "may": "May",
            "june": "June",
            "july": "July",
            "august": "August",
            "september": "September",
            "october": "October",
            "november": "November",
            "december": "December"
          };
          
          const apiKey = monthKeyMap[month];
          data = monthlyAnalysis.Stats[apiKey];
        }
        
        // Dados padrão se não encontrar
        if (!data) {
          data = {
            Trades: 0,
            "Win Rate (%)": 0,
            "Profit Factor": 0,
          };
        }

        const profitFactor = Number(data["Profit Factor"]) || 0;
        const trades = Number(data["Trades"]) || 0;
        const winRate = Number(data["Win Rate (%)"]) || 0;

        // Determine background color based on profit factor
        const bgColor =
          profitFactor >= 1.5
            ? "bg-green-900"
            : profitFactor >= 1.0
            ? "bg-yellow-900"
            : "bg-red-900";
        
        // Determine text color based on profit factor
        const textColor =
          profitFactor >= 1.5
            ? "text-green-300"
            : profitFactor >= 1.0
            ? "text-yellow-300"
            : "text-red-300";

        return (
          <div
            key={month}
            className={`p-3 rounded-lg ${bgColor} ${
              trades === 0 ? "opacity-50" : ""
            }`}
          >
            <p className="text-sm font-medium mb-2 text-white">
              {monthTranslations[month] || month}
            </p>
            <div className="flex flex-col space-y-2">
              <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                <p className="text-xs text-gray-400">Fator</p>
                <p className={`text-sm font-bold ${textColor}`}>
                  {profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                <p className="text-xs text-gray-400">Acerto</p>
                <p className={`text-sm font-bold ${
                  winRate >= 60 ? "text-green-300" : 
                  winRate >= 45 ? "text-yellow-300" : 
                  "text-red-300"
                }`}>
                  {winRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                <p className="text-xs text-gray-400">Trades</p>
                <p className="text-sm font-bold text-white">{trades}</p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 p-2 rounded">
                <p className="text-xs text-gray-400">Rentabilidade</p>
                <p className={`text-sm font-bold ${
                  (data["Rentabilidade ($)"] || 0) > 0 ? "text-green-300" : 
                  (data["Rentabilidade ($)"] || 0) < 0 ? "text-red-300" : 
                  "text-gray-300"
                }`}>
                  {formatMetric(data["Rentabilidade ($)"], false, true)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden mb-6 shadow-lg">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <BarChart2 className="w-6 h-6 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium">Análise Diária</h2>
        </div>
        <button 
          onClick={() => setShowDailyAnalysis(!showDailyAnalysis)}
          className="p-1.5 hover:bg-gray-700 rounded-md"
        >
          {showDailyAnalysis ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      <br></br>
      
      {showDailyAnalysis && (
        <div className="p-6 pt-8">
          {/* Primary Metrics - Redesigned with better visual hierarchy */}
          
          {/* Métricas Principais */}
          <div className="mb-8">
            <DailyMetricsCards tradesData={tradesData} fileResults={fileResults} />
          </div>
          
          {/* Resultado por Horário Section - Enhanced with better visuals */}
          <div className="mb-8">
            <HourlyAnalysis tradesData={tradesData} />
          </div>
          
          {/* Day of Week Analysis - Enhanced with better visuals */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-5 mb-6 shadow-md">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center">
      <div className="bg-blue-500 bg-opacity-20 p-2 rounded-full mr-3">
        <Calendar className="w-6 h-6 text-blue-400" />
      </div>
      <h3 className="font-semibold text-lg">Análise por Dia da Semana</h3>
    </div>
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setShowCalendarView(!showCalendarView)}
        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-xs font-medium text-gray-300 hover:text-white"
      >
        {showCalendarView
          ? "Visualização em Tabela"
          : "Visualização em Calendário"}
      </button>
      <button
        onClick={() => setShowDayOfWeek(!showDayOfWeek)}
        className="p-1.5 hover:bg-gray-600 rounded"
      >
        {showDayOfWeek ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
    </div>
  </div>

  {showDayOfWeek && (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {bestDay && (
          <div className="bg-green-900 bg-opacity-20 border border-green-800 p-4 rounded-lg shadow-md">
            <h4 className="text-md font-medium mb-3 flex items-center text-green-400">
              <Star className="w-5 h-5 mr-2" />
              Melhor Dia:{" "}
              {dayTranslations[bestDay.Day?.toLowerCase()] ||
                bestDay.Day}
            </h4>
                                  <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Trades</p>
                          <p className="text-lg font-medium">{bestDay.Trades || "0"}</p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Taxa de Acerto
                          </p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(bestDay["Win Rate (%)"], true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Fator de Lucro
                          </p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(bestDay["Profit Factor"])}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Ganho</p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(bestDay["Average Win"], false, true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Perda</p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(bestDay["Average Loss"], false, true)}
                          </p>
                        </div>
                      </div>
          </div>
        )}

        {worstDay && (
          <div className="bg-red-900 bg-opacity-20 border border-red-800 p-4 rounded-lg shadow-md">
            <h4 className="text-md font-medium mb-3 flex items-center text-red-400">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Pior Dia:{" "}
              {dayTranslations[worstDay.Day?.toLowerCase()] ||
                worstDay.Day}
            </h4>
                                  <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Trades</p>
                          <p className="text-lg font-medium">
                            {worstDay.Trades || "0"}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Taxa de Acerto
                          </p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(worstDay["Win Rate (%)"], true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Fator de Lucro
                          </p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(worstDay["Profit Factor"])}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Ganho</p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(worstDay["Average Win"], false, true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Perda</p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(worstDay["Average Loss"], false, true)}
                          </p>
                        </div>
                      </div>
          </div>
        )}
      </div>

      {showCalendarView ? (
        renderDayCalendar()
      ) : (
        <div className="overflow-x-auto bg-gray-700 rounded-lg p-4 shadow-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800">
                <th className="px-4 py-3 text-left rounded-l-lg">Dia</th>
                <th className="px-4 py-3 text-center">Trades</th>
                <th className="px-4 py-3 text-center">
                  Taxa de Acerto
                </th>
                <th className="px-4 py-3 text-center">
                  Fator de Lucro
                </th>
                <th className="px-4 py-3 text-center">
                  Sharpe Ratio
                </th>
                <th className="px-4 py-3 text-center">
                  Média Ganho
                </th>
                <th className="px-4 py-3 text-center">
                  Média Perda
                </th>
                <th className="px-4 py-3 text-center rounded-r-lg">
                  Rentabilidade
                </th>
              </tr>
            </thead>
            <tbody>
              {dayOrder.map((day) => {
                // CORREÇÃO: Usar os dados corretos do backtestResult
                let data = null;
                
                // Buscar nos dados do Day of Week Analysis
                if (dayOfWeekAnalysis?.Stats) {
                  const dayKeyMap = {
                    "monday": "Monday",
                    "tuesday": "Tuesday", 
                    "wednesday": "Wednesday",
                    "thursday": "Thursday",
                    "friday": "Friday",
                    "saturday": "Saturday",
                    "sunday": "Sunday"
                  };
                  
                  const apiKey = dayKeyMap[day];
                  data = dayOfWeekAnalysis.Stats[apiKey];
                }
                
                // Dados padrão se não encontrar
                if (!data) {
                  data = {
                    Trades: 0,
                    "Win Rate (%)": 0,
                    "Profit Factor": 0,
                    "Rentabilidade ($)": 0
                  };
                }
                
                return (
                  <tr
                    key={day}
                    className="border-b border-gray-600 last:border-b-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {dayTranslations[day] || day}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {data.Trades || "0"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (data["Win Rate (%)"] || 0) >= 55
                            ? "bg-green-900 text-green-300"
                            : (data["Win Rate (%)"] || 0) >= 45
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {formatMetric(data["Win Rate (%)"], true)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (data["Profit Factor"] || 0) >= 1.5
                            ? "bg-green-900 text-green-300"
                            : (data["Profit Factor"] || 0) >= 1.0
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {formatMetric(data["Profit Factor"])}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (data["Sharpe Ratio"] || 0) >= 1.0
                            ? "bg-green-900 text-green-300"
                            : (data["Sharpe Ratio"] || 0) >= 0.5
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {formatMetric(data["Sharpe Ratio"])}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                        {formatMetric(data["Average Win"], false, true)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">
                        {formatMetric(data["Average Loss"], false, true)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (data["Rentabilidade ($)"] || 0) > 0
                            ? "bg-green-900 text-green-300"
                            : (data["Rentabilidade ($)"] || 0) < 0
                            ? "bg-red-900 text-red-300"
                            : "bg-gray-900 text-gray-300"
                        }`}
                      >
                        {formatMetric(data["Rentabilidade ($)"], false, true)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )}
</div>

          {/* Monthly Analysis - Fixed to display properly */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-5 mb-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-purple-500 bg-opacity-20 p-2 rounded-full mr-3">
                  <PieChart className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg">Análise Mensal</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMonthCalendar(!showMonthCalendar)}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-xs font-medium text-gray-300 hover:text-white"
                >
                  {showMonthCalendar
                    ? "Visualização em Tabela"
                    : "Visualização em Calendário"}
                </button>
                <button
                  onClick={() => setShowMonthly(!showMonthly)}
                  className="p-1.5 hover:bg-gray-600 rounded"
                >
                  {showMonthly ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {showMonthly && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {bestMonth && (
                    <div className="bg-green-900 bg-opacity-20 border border-green-800 p-4 rounded-lg shadow-md">
                      <h4 className="text-md font-medium mb-3 flex items-center text-green-400">
                        <Star className="w-5 h-5 mr-2" />
                        Melhor Mês:{" "}
                        {monthTranslations[bestMonth.Month?.toLowerCase()] ||
                          bestMonth.Month}
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Trades</p>
                          <p className="text-lg font-medium">
                            {bestMonth.Trades || "0"}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Taxa de Acerto
                          </p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(bestMonth["Win Rate (%)"], true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Fator de Lucro
                          </p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(bestMonth["Profit Factor"])}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Ganho</p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(bestMonth["Average Win"], false, true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Perda</p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(bestMonth["Average Loss"], false, true)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {worstMonth && (
                    <div className="bg-red-900 bg-opacity-20 border border-red-800 p-4 rounded-lg shadow-md">
                      <h4 className="text-md font-medium mb-3 flex items-center text-red-400">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Pior Mês:{" "}
                        {monthTranslations[worstMonth.Month?.toLowerCase()] ||
                          worstMonth.Month}
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Trades</p>
                          <p className="text-lg font-medium">
                            {worstMonth.Trades || "0"}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Taxa de Acerto
                          </p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(worstMonth["Win Rate (%)"], true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Fator de Lucro
                          </p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(worstMonth["Profit Factor"])}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Ganho</p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(worstMonth["Average Win"], false, true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Perda</p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(worstMonth["Average Loss"], false, true)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {showMonthCalendar ? (
                  renderMonthCalendar()
                ) : (
                  <div className="overflow-x-auto bg-gray-700 rounded-lg p-4 shadow-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800">
                          <th className="px-4 py-3 text-left rounded-l-lg">Mês</th>
                          <th className="px-4 py-3 text-center">Trades</th>
                          <th className="px-4 py-3 text-center">
                            Taxa de Acerto
                          </th>
                            <th className="px-4 py-3 text-center">
                            Fator de Lucro
                          </th>
                            <th className="px-4 py-3 text-center">
                              Média Ganho
                            </th>
                            <th className="px-4 py-3 text-center">
                              Média Perda
                            </th>
                            <th className="px-4 py-3 text-center rounded-r-lg">
                              Rentabilidade
                            </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthOrder.map((month) => {
                          // CORREÇÃO: Usar os dados corretos do backtestResult
                          let data = null;
                          
                          // Buscar nos dados do Monthly Analysis
                          if (monthlyAnalysis?.Stats) {
                            const monthKeyMap = {
                              "january": "January",
                              "february": "February",
                              "march": "March",
                              "april": "April",
                              "may": "May",
                              "june": "June",
                              "july": "July",
                              "august": "August",
                              "september": "September",
                              "october": "October",
                              "november": "November",
                              "december": "December"
                            };
                            
                            const apiKey = monthKeyMap[month];
                            data = monthlyAnalysis.Stats[apiKey];
                          }
                          
                          // Dados padrão se não encontrar
                          if (!data) {
                            data = {
                              Trades: 0,
                              "Win Rate (%)": 0,
                              "Profit Factor": 0,
                              "Rentabilidade ($)": 0
                            };
                          }
                          return (
                            <tr
                              key={month}
                              className="border-b border-gray-600 last:border-b-0"
                            >
                              <td className="px-4 py-3 font-medium">
                                {monthTranslations[month] || month}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {data.Trades || "0"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (data["Win Rate (%)"] || 0) >= 55
                                      ? "bg-green-900 text-green-300"
                                      : (data["Win Rate (%)"] || 0) >= 45
                                      ? "bg-yellow-900 text-yellow-300"
                                      : "bg-red-900 text-red-300"
                                  }`}
                                >
                                  {formatMetric(data["Win Rate (%)"], true)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (data["Profit Factor"] || 0) >= 1.5
                                      ? "bg-green-900 text-green-300"
                                      : (data["Profit Factor"] || 0) >= 1.0
                                      ? "bg-yellow-900 text-yellow-300"
                                      : "bg-red-900 text-red-300"
                                  }`}
                                >
                                  {formatMetric(data["Profit Factor"])}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                                  {formatMetric(data["Average Win"], false, true)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">
                                  {formatMetric(data["Average Loss"], false, true)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (data["Rentabilidade ($)"] || 0) > 0
                                      ? "bg-green-900 text-green-300"
                                      : (data["Rentabilidade ($)"] || 0) < 0
                                      ? "bg-red-900 text-red-300"
                                      : "bg-gray-900 text-gray-300"
                                  }`}
                                >
                                  {formatMetric(data["Rentabilidade ($)"], false, true)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Weekly Analysis Section */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-5 mb-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-orange-500 bg-opacity-20 p-2 rounded-full mr-3">
                  <BarChart className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="font-semibold text-lg">Análise Semanal</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowWeekCalendar(!showWeekCalendar)}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-xs font-medium text-gray-300 hover:text-white"
                >
                  {showWeekCalendar
                    ? "Visualização em Tabela"
                    : "Visualização em Calendário"}
                </button>
                <button
                  onClick={() => setShowWeekly(!showWeekly)}
                  className="p-1.5 hover:bg-gray-600 rounded"
                >
                  {showWeekly ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {showWeekly && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {bestWeek && (
                    <div className="bg-green-900 bg-opacity-20 border border-green-800 p-4 rounded-lg shadow-md">
                      <h4 className="text-md font-medium mb-3 flex items-center text-green-400">
                        <Star className="w-5 h-5 mr-2" />
                        Melhor Semana: {translateWeekName(bestWeek.Week)}
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Trades</p>
                          <p className="text-lg font-medium">{bestWeek.Trades || "0"}</p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Taxa de Acerto
                          </p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(bestWeek["Win Rate (%)"], true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Fator de Lucro
                          </p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(bestWeek["Profit Factor"])}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Ganho</p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(bestWeek["Average Win"], false, true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Perda</p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(bestWeek["Average Loss"], false, true)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {worstWeek && (
                    <div className="bg-red-900 bg-opacity-20 border border-red-800 p-4 rounded-lg shadow-md">
                      <h4 className="text-md font-medium mb-3 flex items-center text-red-400">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Pior Semana: {translateWeekName(worstWeek.Week)}
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Trades</p>
                          <p className="text-lg font-medium">{worstWeek.Trades || "0"}</p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Taxa de Acerto
                          </p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(worstWeek["Win Rate (%)"], true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Fator de Lucro
                          </p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(worstWeek["Profit Factor"])}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Ganho</p>
                          <p className="text-lg font-medium text-green-400">
                            {formatMetric(worstWeek["Average Win"], false, true)}
                          </p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Média Perda</p>
                          <p className="text-lg font-medium text-red-400">
                            {formatMetric(worstWeek["Average Loss"], false, true)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {showWeekCalendar ? (
                  renderWeekCalendar()
                ) : (
                  <div className="overflow-x-auto bg-gray-700 rounded-lg p-4 shadow-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800">
                          <th className="px-4 py-3 text-left rounded-l-lg">Semana</th>
                          <th className="px-4 py-3 text-center">Trades</th>
                          <th className="px-4 py-3 text-center">
                            Taxa de Acerto
                          </th>
                          <th className="px-4 py-3 text-center">
                            Fator de Lucro
                          </th>
                          <th className="px-4 py-3 text-center">
                            Média Ganho
                          </th>
                          <th className="px-4 py-3 text-center">
                            Média Perda
                          </th>
                          <th className="px-4 py-3 text-center rounded-r-lg">
                            Rentabilidade
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyAnalysis?.Stats && Object.entries(weeklyAnalysis.Stats)
                          .sort(([weekA], [weekB]) => {
                            // Extrair números das semanas para ordenação numérica
                            const numA = parseInt(weekA.replace(/\D/g, '')) || 0;
                            const numB = parseInt(weekB.replace(/\D/g, '')) || 0;
                            return numA - numB;
                          })
                          .map(([week, data]) => {
                          return (
                            <tr
                              key={week}
                              className="border-b border-gray-600 last:border-b-0"
                            >
                              <td className="px-4 py-3 font-medium">
                                {translateWeekName(week)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {data.Trades || "0"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (data["Win Rate (%)"] || 0) >= 55
                                      ? "bg-green-900 text-green-300"
                                      : (data["Win Rate (%)"] || 0) >= 45
                                      ? "bg-yellow-900 text-yellow-300"
                                      : "bg-red-900 text-red-300"
                                  }`}
                                >
                                  {formatMetric(data["Win Rate (%)"], true)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (data["Profit Factor"] || 0) >= 1.5
                                      ? "bg-green-900 text-green-300"
                                      : (data["Profit Factor"] || 0) >= 1.0
                                      ? "bg-yellow-900 text-yellow-300"
                                      : "bg-red-900 text-red-300"
                                  }`}
                                >
                                  {formatMetric(data["Profit Factor"])}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                                  {formatMetric(data["Average Win"], false, true)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">
                                  {formatMetric(data["Average Loss"], false, true)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (data["Rentabilidade ($)"] || 0) > 0
                                      ? "bg-green-900 text-green-300"
                                      : (data["Rentabilidade ($)"] || 0) < 0
                                      ? "bg-red-900 text-red-300"
                                      : "bg-gray-900 text-gray-300"
                                  }`}
                                >
                                  {formatMetric(data["Rentabilidade ($)"], false, true)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Interpretation - Enhanced with better visuals */}
          
        </div>
      )}
    </div>
  );
}
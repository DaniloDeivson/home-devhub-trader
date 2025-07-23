import React from 'react';
import DailyMetricsCards from './Metrics';
import { 
  BarChart2, ChevronUp, ChevronDown, Calendar, Clock, 
  Award, Shield, AlertTriangle, TrendingUp, TrendingDown, 
  DollarSign, Percent, Target, Activity, ArrowUp, ArrowDown,
  Zap, CheckCircle, XCircle, BarChart, PieChart, Layers,
  Star, Compass, Maximize, Minimize
} from 'lucide-react';
import HourlyAnalysis from './hour';
interface DailyAnalysisSectionProps {
  showDailyAnalysis: boolean;
  setShowDailyAnalysis: (show: boolean) => void;
  backtestResult: any;
  tradesData: any;
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

export function DailyAnalysisSection({
  showDailyAnalysis,
  setShowDailyAnalysis,
  tradesData,
  backtestResult
}: DailyAnalysisSectionProps) {
  // Guard clause to prevent rendering if backtestResult is null
  if (!backtestResult) return null;
  
  // Sample data for the analysis - in a real implementation, this would come from backtestResult
  const dailyAnalysis = {
    sharpeRatio: 1.85,
    recoveryFactor: 2.30,
    averageDailyGain: 450.75,
    averageDailyLoss: -280.50,
    maxDailyLoss: -1250.80,
    maxDailyGain: 2350.40,
    averageTradesPerDay: 4.2,
    dailyWinRate: 62.5,
    maxDrawdown: 15.8,
    tradingDays: 42,
    furyProbability: 8.5,
    netResult: 12450.75,
    dailyPayoff: 1.60,
    consecutiveLossDays: 3,
    consecutiveWinDays: 5
  };
  
  // Sample data for resultado por horário - in a real implementation, this would come from backtestResult
  const resultadoPorHorario = [
    { 
      horario: 'Pré Mercado (9h-10h)', 
      trades: 18, 
      resultado: 2150.25,
      winRate: 72.2,
      profitFactor: 2.85
    },
    { 
      horario: 'Manhã (10h-12h)', 
      trades: 35, 
      resultado: 4250.75,
      winRate: 68.5,
      profitFactor: 2.35
    },
    { 
      horario: 'Tarde (12h-16h)', 
      trades: 25, 
      resultado: 1850.25,
      winRate: 56.0,
      profitFactor: 1.75
    },
    { 
      horario: 'Fechamento (16h-18h30)', 
      trades: 15, 
      resultado: -650.50,
      winRate: 33.3,
      profitFactor: 0.65
    }
  ];

  // Day of Week Analysis data
  const dayOfWeekAnalysis = backtestResult["Day of Week Analysis"];
  const bestDay = dayOfWeekAnalysis?.["Best Day"];
  const worstDay = dayOfWeekAnalysis?.["Worst Day"];
  
  // Monthly Analysis data
  const monthlyAnalysis = backtestResult["Monthly Analysis"];
  const bestMonth = monthlyAnalysis?.["Best Month"];
  const worstMonth = monthlyAnalysis?.["Worst Month"];
  
  // State for showing/hiding sections - set to false by default
  const [showDayOfWeek, setShowDayOfWeek] = React.useState(false);
  const [showMonthly, setShowMonthly] = React.useState(false);
  const [showCalendarView, setShowCalendarView] = React.useState(true);
  const [showMonthCalendar, setShowMonthCalendar] = React.useState(true);
  const [showTimeAnalysis, setShowTimeAnalysis] = React.useState(true);

  const formatMetric = (
    value: number | undefined,
    isPercentage = false,
    isCurrency = false
  ): string => {
    if (value === undefined || value === null || isNaN(Number(value)))
      return "N/A";

    const numValue = Number(value);

    if (isCurrency) {
      return `R$ ${numValue.toFixed(2)}`;
    }

    return isPercentage ? `${numValue.toFixed(2)}%` : numValue.toFixed(2);
  };

  // Função para gerar dados de exemplo para o calendário se não houver dados reais
  const generateSampleDayData = () => {
    const sampleData: Record<string, any> = {};
    
    dayOrder.forEach(day => {
      const profitFactor = Math.random() * 2 + 0.5;
      const winRate = Math.random() * 40 + 40;
      const trades = Math.floor(Math.random() * 20) + 5;
      
      sampleData[day] = {
        "Trades": trades,
        "Win Rate (%)": winRate,
        "Profit Factor": profitFactor
      };
    });
    
    return sampleData;
  };
  
  // Função para gerar dados de exemplo para o calendário mensal se não houver dados reais
  const generateSampleMonthData = () => {
    const sampleData: Record<string, any> = {};
    
    monthOrder.forEach(month => {
      const profitFactor = Math.random() * 2 + 0.5;
      const winRate = Math.random() * 40 + 40;
      const trades = Math.floor(Math.random() * 50) + 10;
      
      sampleData[month] = {
        "Trades": trades,
        "Win Rate (%)": winRate,
        "Profit Factor": profitFactor
      };
    });
    
    return sampleData;
  };
  
  // Usar dados reais ou gerar dados de exemplo
  const dayStats = dayOfWeekAnalysis?.Stats || {};
  const monthStats = monthlyAnalysis?.Stats || generateSampleMonthData();

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
      
      {showDailyAnalysis && (
        <div className="p-6">
          {/* Primary Metrics - Redesigned with better visual hierarchy */}
          
            {/* Métricas Principais */}
            <DailyMetricsCards tradesData={tradesData} />
        
          
          {/* Resultado por Horário Section - Enhanced with better visuals */}
          <HourlyAnalysis tradesData={tradesData} />
          
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
                <th className="px-4 py-3 text-center rounded-r-lg">
                  Fator de Lucro
                </th>
              </tr>
            </thead>
            <tbody>
              {dayOrder.map((day) => {
                // CORREÇÃO: Procurar nos mesmos dados que geram bestDay e worstDay
                // Assumindo que você tem um array de dados por dia (como dayOfWeekData)
                let data = null;
                
                // Opção 1: Se você tem um array de dados por dia da semana
                if (Array.isArray(dayOfWeekData)) {
                  data = dayOfWeekData.find(d => 
                    d.Day?.toLowerCase() === day.toLowerCase() ||
                    d.Day?.toLowerCase() === dayTranslations[day]?.toLowerCase()
                  );
                }
                
                // Opção 2: Se você tem um objeto com as chaves sendo os dias
                if (!data && dayStats) {
                  // Tentar diferentes variações da chave
                  data = dayStats[day] || 
                         dayStats[day.toLowerCase()] || 
                         dayStats[day.charAt(0).toUpperCase() + day.slice(1)] ||
                         dayStats[dayTranslations[day]];
                }
                
                // Opção 3: Se você tem uma função que calcula os stats por dia
                if (!data && typeof calculateDayStats === 'function') {
                  data = calculateDayStats(day);
                }
                
                // Dados padrão se não encontrar nada
                if (!data) {
                  data = {
                    Trades: 0,
                    "Win Rate (%)": 0,
                    "Profit Factor": 0,
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
                          <th className="px-4 py-3 text-center rounded-r-lg">
                            Fator de Lucro
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthOrder.map((month) => {
                          const data = monthStats[month] || {
                            Trades: 0,
                            "Win Rate (%)": 0,
                            "Profit Factor": 0,
                          };
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
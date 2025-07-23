import React, { useState } from 'react';
import { Clock, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';

interface HourlyAnalysisProps {
  tradesData?: any; // Dados das trades já carregados
}

interface HourlyData {
  horario: string;
  trades: number;
  winRate: number;
  profitFactor: number;
  resultado: number;
}

interface CategoryData {
  nome: string;
  horarios: HourlyData[];
  totalTrades: number;
  totalResultado: number;
  avgWinRate: number;
  avgProfitFactor: number;
}

// Dados de exemplo para demonstração
const sampleTradesData = {
  trades: [
    { entry_date: '2024-01-15T09:30:00', pnl: 500 },
    { entry_date: '2024-01-15T10:15:00', pnl: -200 },
    { entry_date: '2024-01-15T11:45:00', pnl: 300 },
    { entry_date: '2024-01-15T13:20:00', pnl: -150 },
    { entry_date: '2024-01-15T14:30:00', pnl: 400 },
    { entry_date: '2024-01-15T15:45:00', pnl: 250 },
    { entry_date: '2024-01-15T16:30:00', pnl: -100 },
    { entry_date: '2024-01-15T17:15:00', pnl: 350 },
  ],
  statistics: {
    temporal: {
      hourly: {
        '9': { count: 1, sum: 500 },
        '10': { count: 1, sum: -200 },
        '11': { count: 1, sum: 300 },
        '13': { count: 1, sum: -150 },
        '14': { count: 1, sum: 400 },
        '15': { count: 1, sum: 250 },
        '16': { count: 1, sum: -100 },
        '17': { count: 1, sum: 350 },
      }
    }
  }
};

export default function HourlyAnalysis({ tradesData }: HourlyAnalysisProps) {
  const [showTimeAnalysis, setShowTimeAnalysis] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Usar dados de exemplo se não houver dados fornecidos
  const data = tradesData || sampleTradesData;
  
  const horarios = [
    {
      horario: [9, 10],
      nome: "09:00 - 10:00 (Pré-Mercado)"
    },
    {
      horario: [10, 12],
      nome: "10:00 - 12:00 (Manhã)"
    },
    {
      horario: [12, 14],
      nome: "12:00 - 14:00 (Almoço)"
    },
    {
      horario: [14, 16],
      nome: "14:00 - 16:00 (Tarde)"
    },
    {
      horario: [16, 19],
      nome: "16:00 - 18:30 (Fechamento)"
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para calcular win rate por horário
  const calculateWinRate = (trades: any[], hour: string) => {
    if (!trades || trades.length === 0) return 0;
    
    const hourTrades = trades.filter(trade => {
      const entryHour = new Date(trade.entry_date).getHours();
      return entryHour.toString() === hour;
    });
    
    if (hourTrades.length === 0) return 0;
    
    const winningTrades = hourTrades.filter(trade => trade.pnl > 0).length;
    return (winningTrades / hourTrades.length) * 100;
  };

  // Função para calcular profit factor por horário
  const calculateProfitFactor = (trades: any[], hour: string) => {
    if (!trades || trades.length === 0) return 0;
    
    const hourTrades = trades.filter(trade => {
      const entryHour = new Date(trade.entry_date).getHours();
      return entryHour.toString() === hour;
    });
    
    if (hourTrades.length === 0) return 0;
    
    const grossProfit = hourTrades
      .filter(trade => trade.pnl > 0)
      .reduce((sum, trade) => sum + trade.pnl, 0);
    
    const grossLoss = Math.abs(hourTrades
      .filter(trade => trade.pnl < 0)
      .reduce((sum, trade) => sum + trade.pnl, 0));
    
    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 2.0 : 0;
  };

  // Processar dados por horário individual
  const getHourlyData = (): HourlyData[] => {
    if (!data?.statistics?.temporal?.hourly) {
      return [];
    }

    const hourlyStats = data.statistics.temporal.hourly;
    const trades = data.trades || [];

    return Object.entries(hourlyStats).map(([hour, dataItem]: [string, any]) => {
      const winRate = calculateWinRate(trades, hour);
      const profitFactor = calculateProfitFactor(trades, hour);

      return {
        horario: `${hour}h`,
        trades: dataItem.count || 0,
        winRate: winRate,
        profitFactor: profitFactor,
        resultado: dataItem.sum || 0
      };
    }).sort((a, b) => parseInt(a.horario) - parseInt(b.horario));
  };

  // Agrupar dados por categorias
  const getCategorizedData = (): CategoryData[] => {
    const hourlyData = getHourlyData();
    
    return horarios.map(categoria => {
      const horariosNaCategoria = hourlyData.filter(item => {
        const hora = parseInt(item.horario.replace('h', ''));
        return hora >= categoria.horario[0] && hora < categoria.horario[1];
      });

      const totalTrades = horariosNaCategoria.reduce((sum, item) => sum + item.trades, 0);
      const totalResultado = horariosNaCategoria.reduce((sum, item) => sum + item.resultado, 0);
      
      // Calcular médias ponderadas
      const avgWinRate = totalTrades > 0 ? 
        horariosNaCategoria.reduce((sum, item) => sum + (item.winRate * item.trades), 0) / totalTrades : 0;
      const avgProfitFactor = totalTrades > 0 ? 
        horariosNaCategoria.reduce((sum, item) => sum + (item.profitFactor * item.trades), 0) / totalTrades : 0;

      return {
        nome: categoria.nome,
        horarios: horariosNaCategoria,
        totalTrades,
        totalResultado,
        avgWinRate,
        avgProfitFactor
      };
    }).filter(categoria => categoria.totalTrades > 0); // Filtrar categorias sem trades
  };

  const categorizedData = getCategorizedData();

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Se não há dados, não renderizar
  if (!data || categorizedData.length === 0) {
    return (
      <div className="mb-8 mt-8">
        <div className="flex items-center mb-4">
          <div className="bg-purple-500 bg-opacity-20 p-2 rounded-full mr-3">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg text-white">Resultado por Horário</h3>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400">Nenhum dado de horário disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-purple-500 bg-opacity-20 p-2 rounded-full mr-3">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg text-white">Resultado por Horário</h3>
        </div>
        <button 
          onClick={() => setShowTimeAnalysis(!showTimeAnalysis)}
          className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
        >
          {showTimeAnalysis ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      
      {showTimeAnalysis && (
        <div className="overflow-x-auto bg-gray-700 rounded-lg p-4 shadow-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 rounded-lg">
                <th className="px-4 py-3 text-left rounded-l-lg text-white">Período</th>
                <th className="px-4 py-3 text-center text-white">Trades</th>
                <th className="px-4 py-3 text-center text-white">Taxa de Acerto</th>
                <th className="px-4 py-3 text-center text-white">Fator de Lucro</th>
                <th className="px-4 py-3 text-right text-white">Resultado</th>
                <th className="px-4 py-3 text-center rounded-r-lg text-white">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {categorizedData.map((categoria, categoryIndex) => (
                <React.Fragment key={categoryIndex}>
                  {/* Linha da categoria */}
                  <tr className="border-b border-gray-600 bg-gray-800 bg-opacity-50">
                    <td className="px-4 py-3 font-bold text-white">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-purple-400" />
                        {categoria.nome}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-white">
                      {categoria.totalTrades}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        categoria.avgWinRate >= 60 ? 'bg-green-900 text-green-300' : 
                        categoria.avgWinRate >= 45 ? 'bg-yellow-900 text-yellow-300' : 
                        'bg-red-900 text-red-300'
                      }`}>
                        {categoria.avgWinRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        categoria.avgProfitFactor >= 1.5 ? 'bg-green-900 text-green-300' : 
                        categoria.avgProfitFactor >= 1.0 ? 'bg-yellow-900 text-yellow-300' : 
                        'bg-red-900 text-red-300'
                      }`}>
                        {categoria.avgProfitFactor.toFixed(2)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${categoria.totalResultado > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(categoria.totalResultado)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleCategory(categoria.nome)}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                      >
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                          expandedCategories.includes(categoria.nome) ? 'rotate-90' : ''
                        }`} />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Linhas dos horários individuais (quando expandido) */}
                  {expandedCategories.includes(categoria.nome) && 
                    categoria.horarios.map((item, index) => (
                      <tr key={`${categoryIndex}-${index}`} className="border-b border-gray-600 bg-gray-700 bg-opacity-30 hover:bg-gray-600 hover:bg-opacity-30 transition-colors">
                        <td className="px-8 py-2 text-sm text-gray-300">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                            {item.horario}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center text-sm text-gray-300">{item.trades}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.winRate >= 60 ? 'bg-green-900 text-green-300' : 
                            item.winRate >= 45 ? 'bg-yellow-900 text-yellow-300' : 
                            'bg-red-900 text-red-300'
                          }`}>
                            {item.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.profitFactor >= 1.5 ? 'bg-green-900 text-green-300' : 
                            item.profitFactor >= 1.0 ? 'bg-yellow-900 text-yellow-300' : 
                            'bg-red-900 text-red-300'
                          }`}>
                            {item.profitFactor.toFixed(2)}
                          </span>
                        </td>
                        <td className={`px-4 py-2 text-right text-sm ${item.resultado > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(item.resultado)}
                        </td>
                        <td className="px-4 py-2"></td>
                      </tr>
                    ))
                  }
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
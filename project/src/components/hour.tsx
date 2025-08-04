import React, { useState } from 'react';
import { Clock, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { TradesData, HourlyData, CategoryData } from '../types/backtest';

interface HourlyAnalysisProps {
  tradesData?: TradesData | null;
}

// Dados de exemplo para demonstração
const sampleTradesData: TradesData = {
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

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para calcular win rate por horário
  const calculateWinRate = (trades: Trade[], hour: string): number => {
    if (!trades || trades.length === 0) return 0;
    
    const hourTrades = trades.filter(trade => {
      const entryHour = new Date(trade.entry_date).getHours();
      return entryHour.toString() === hour;
    });
    
    if (hourTrades.length === 0) return 0;
    
    const winningTrades = hourTrades.filter(trade => trade.pnl > 0);
    return (winningTrades.length / hourTrades.length) * 100;
  };

  // Função para calcular profit factor por horário
  const calculateProfitFactor = (trades: Trade[], hour: string): number => {
    if (!trades || trades.length === 0) return 0;
    
    const hourTrades = trades.filter(trade => {
      const entryHour = new Date(trade.entry_date).getHours();
      return entryHour.toString() === hour;
    });
    
    if (hourTrades.length === 0) return 0;
    
    const totalProfit = hourTrades
      .filter(trade => trade.pnl > 0)
      .reduce((sum, trade) => sum + trade.pnl, 0);
    
    const totalLoss = Math.abs(hourTrades
      .filter(trade => trade.pnl < 0)
      .reduce((sum, trade) => sum + trade.pnl, 0));
    
    return totalLoss > 0 ? totalProfit / totalLoss : 0;
  };

  // Função para obter dados por horário
  const getHourlyData = (): HourlyData[] => {
    if (!data.trades) return [];
    
    const hourlyData: HourlyData[] = [];
    
    for (let hour = 9; hour <= 17; hour++) {
      const hourTrades = data.trades!.filter(trade => {
        const entryHour = new Date(trade.entry_date).getHours();
        return entryHour === hour;
      });
      
      const totalResult = hourTrades.reduce((sum, trade) => sum + trade.pnl, 0);
      const winRate = calculateWinRate(data.trades!, hour.toString());
      const profitFactor = calculateProfitFactor(data.trades!, hour.toString());
      
      hourlyData.push({
        horario: `${hour.toString().padStart(2, '0')}:00`,
        trades: hourTrades.length,
        winRate,
        profitFactor,
        resultado: totalResult
      });
    }
    
    return hourlyData;
  };

  // Função para obter dados categorizados
  const getCategorizedData = (): CategoryData[] => {
    const hourlyData = getHourlyData();
    const categories: CategoryData[] = [];
    
    horarios.forEach(({ horario, nome }) => {
      const [startHour, endHour] = horario;
      const relevantData = hourlyData.filter(data => {
        const hour = parseInt(data.horario.split(':')[0]);
        return hour >= startHour && hour < endHour;
      });
      
      if (relevantData.length > 0) {
        const totalTrades = relevantData.reduce((sum, data) => sum + data.trades, 0);
        const totalResultado = relevantData.reduce((sum, data) => sum + data.resultado, 0);
        const avgWinRate = relevantData.reduce((sum, data) => sum + data.winRate, 0) / relevantData.length;
        const avgProfitFactor = relevantData.reduce((sum, data) => sum + data.profitFactor, 0) / relevantData.length;
        
        categories.push({
          nome,
          horarios: relevantData,
          totalTrades,
          totalResultado,
          avgWinRate,
          avgProfitFactor
        });
      }
    });
    
    return categories;
  };

  const categorizedData = getCategorizedData();

  return (
    <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-5 mb-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-purple-500 bg-opacity-20 p-2 rounded-full mr-3">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg">Resultado por Horário</h3>
        </div>
        <button
          onClick={() => setShowTimeAnalysis(!showTimeAnalysis)}
          className="p-1.5 hover:bg-gray-600 rounded"
        >
          {showTimeAnalysis ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {showTimeAnalysis && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4 font-medium text-gray-300">Período</th>
                <th className="text-center py-3 px-4 font-medium text-gray-300">Trades</th>
                <th className="text-center py-3 px-4 font-medium text-gray-300">Taxa de Acerto</th>
                <th className="text-center py-3 px-4 font-medium text-gray-300">Fator de Lucro</th>
                <th className="text-center py-3 px-4 font-medium text-gray-300">Resultado</th>
                <th className="text-center py-3 px-4 font-medium text-gray-300">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {categorizedData.map((category, index) => (
                <tr key={category.nome} className={`border-b border-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-purple-400 mr-2" />
                      <span className="text-white">{category.nome}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-white">{category.totalTrades}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="inline-block bg-red-600 text-white px-2 py-1 rounded text-xs">
                      {category.avgWinRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      category.avgProfitFactor >= 1.0 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {category.avgProfitFactor.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-medium ${
                      category.totalResultado >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(category.totalResultado)}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <ChevronRight className="w-4 h-4 text-gray-400 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
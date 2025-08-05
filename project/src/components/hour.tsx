import React, { useState } from 'react';
import { Clock, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { TradesData, HourlyData, CategoryData } from '../types/backtest';

interface Trade {
  entry_date: string;
  pnl: number;
}

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
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
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
      
      // Só processar horas que tenham pelo menos 1 trade
      if (hourTrades.length > 0) {
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
        
        // Só adicionar categorias que tenham pelo menos 1 trade
        if (totalTrades > 0) {
          categories.push({
            nome,
            horarios: relevantData,
            totalTrades,
            totalResultado,
            avgWinRate,
            avgProfitFactor
          });
        }
      }
    });
    
    return categories;
  };

  const categorizedData = getCategorizedData();

  const handleShowDetails = (category: CategoryData) => {
    setSelectedCategory(category);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCategory(null);
  };

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
        <div>
          {categorizedData.length === 0 ? (
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400">Nenhum trade encontrado nos horários analisados</p>
            </div>
          ) : (
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
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          category.avgWinRate >= 60 ? 'bg-green-600 text-white' :
                          category.avgWinRate >= 45 ? 'bg-yellow-600 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          {category.avgWinRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          category.avgProfitFactor >= 1.5 ? 'bg-green-600 text-white' :
                          category.avgProfitFactor >= 1.0 ? 'bg-yellow-600 text-white' :
                          'bg-red-600 text-white'
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
                        <button
                          onClick={() => handleShowDetails(category)}
                          className="hover:bg-gray-600 p-1 rounded transition-colors"
                          title="Ver detalhes do período"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-400 mr-2" />
                <h3 className="text-xl font-semibold text-white">
                  Detalhes - {selectedCategory.nome}
                </h3>
              </div>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Resumo do Período */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-3">Resumo do Período</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-3 rounded">
                    <p className="text-xs text-gray-400 mb-1">Total de Trades</p>
                    <p className="text-lg font-semibold text-white">{selectedCategory.totalTrades}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded">
                    <p className="text-xs text-gray-400 mb-1">Taxa de Acerto</p>
                    <p className="text-lg font-semibold text-white">{selectedCategory.avgWinRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded">
                    <p className="text-xs text-gray-400 mb-1">Fator de Lucro</p>
                    <p className="text-lg font-semibold text-white">{selectedCategory.avgProfitFactor.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded">
                    <p className="text-xs text-gray-400 mb-1">Resultado Total</p>
                    <p className={`text-lg font-semibold ${selectedCategory.totalResultado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(selectedCategory.totalResultado)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalhes por Hora */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-3">Breakdown por Hora</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-600">
                        <th className="px-3 py-2 text-left text-gray-300">Horário</th>
                        <th className="px-3 py-2 text-center text-gray-300">Trades</th>
                        <th className="px-3 py-2 text-center text-gray-300">Taxa de Acerto</th>
                        <th className="px-3 py-2 text-center text-gray-300">Fator de Lucro</th>
                        <th className="px-3 py-2 text-right text-gray-300">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCategory.horarios.map((hourData, index) => (
                        <tr key={hourData.horario} className="border-b border-gray-600">
                          <td className="px-3 py-2 text-white font-medium">{hourData.horario}</td>
                          <td className="px-3 py-2 text-center text-white">{hourData.trades}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              hourData.winRate >= 60 ? 'bg-green-600 text-white' :
                              hourData.winRate >= 45 ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {hourData.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              hourData.profitFactor >= 1.5 ? 'bg-green-600 text-white' :
                              hourData.profitFactor >= 1.0 ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {hourData.profitFactor.toFixed(2)}
                            </span>
                          </td>
                          <td className={`px-3 py-2 text-right font-medium ${
                            hourData.resultado >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(hourData.resultado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-purple-900 bg-opacity-20 border border-purple-800 rounded-lg p-4">
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-300 mb-2">Insights do Período</h4>
                    <ul className="text-sm text-purple-200 space-y-1">
                      <li>• Melhor hora: {selectedCategory.horarios.reduce((best, current) => current.resultado > best.resultado ? current : best).horario} com {formatCurrency(selectedCategory.horarios.reduce((best, current) => current.resultado > best.resultado ? current : best).resultado)}</li>
                      <li>• Taxa de acerto média: {selectedCategory.avgWinRate.toFixed(1)}% ({selectedCategory.avgWinRate >= 60 ? 'excelente' : selectedCategory.avgWinRate >= 45 ? 'boa' : 'ruim'})</li>
                      <li>• Fator de lucro: {selectedCategory.avgProfitFactor.toFixed(2)} ({selectedCategory.avgProfitFactor >= 1.5 ? 'excelente' : selectedCategory.avgProfitFactor >= 1.0 ? 'positivo' : 'negativo'})</li>
                      <li>• Volume de trades: {selectedCategory.totalTrades} operações no período</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeDetailsModal}
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
  );
}
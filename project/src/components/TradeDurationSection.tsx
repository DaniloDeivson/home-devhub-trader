import React from 'react';
import { Clock, ChevronUp, ChevronDown, BarChart2 } from 'lucide-react';

interface TradeDurationSectionProps {
  showTradeDuration: boolean;
  setShowTradeDuration: (show: boolean) => void;
  backtestResult: any;
}

export function TradeDurationSection({
  showTradeDuration,
  setShowTradeDuration,
  backtestResult
}: TradeDurationSectionProps) {
  // Guard clause to prevent rendering if backtestResult is null
  if (!backtestResult) return null;
  
  // Sample data for the analysis - in a real implementation, this would come from backtestResult
  const tradeDurationData = {
    averageDuration: '2h 15m',
    medianDuration: '1h 45m',
    maxDuration: '6h 30m',
    resultByDuration: [
      { duration: '< 30min', result: -350.25, count: 15 },
      { duration: '30min - 1h', result: 780.50, count: 22 },
      { duration: '1h - 2h', result: 1250.75, count: 18 },
      { duration: '2h - 4h', result: 850.25, count: 12 },
      { duration: '> 4h', result: -180.50, count: 8 }
    ]
  };
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium">Duração dos Trades</h2>
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
      
      {showTradeDuration && (
        <div className="p-4">
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
            <h4 className="text-sm font-medium mb-3 text-gray-300">Resultado por Duração</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-3 py-2 text-left">Duração</th>
                    <th className="px-3 py-2 text-center">Trades</th>
                    <th className="px-3 py-2 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeDurationData.resultByDuration.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="px-3 py-2">{item.duration}</td>
                      <td className="px-3 py-2 text-center">{item.count}</td>
                      <td className={`px-3 py-2 text-right ${item.result > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(item.result)}
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
                  <li>• Trades entre 1-2 horas apresentam melhor resultado</li>
                  <li>• Operações muito curtas (menos de 30 min) tendem a ser negativas</li>
                  <li>• Período da manhã concentra maior volume e melhores resultados</li>
                  <li>• Trades no final do dia apresentam maior risco de perda</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
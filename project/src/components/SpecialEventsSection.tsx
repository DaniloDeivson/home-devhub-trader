import { Zap, ChevronUp, ChevronDown, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

// Definir todas as datas dos eventos especiais (2022-2027 completo)
const SPECIAL_EVENTS = {
  'PIB EUA': [
    // 2022
    '2022-04-28', '2022-07-28', '2022-10-27',
    // 2023
    '2023-01-26', '2023-04-27', '2023-07-27', '2023-10-26',
    '2025-06-17',
    // 2024
    '2024-01-25', '2024-04-25', '2024-07-25', '2024-10-30',
    // 2025
    '2025-01-30', '2025-04-30', '2025-07-30', '2025-10-30', '2026-01-29',
    '2026-04-29', '2026-07-29', '2026-10-28', '2027-01-28',
    '2027-04-28', '2027-07-28', '2027-10-27', '2028-01-27'
  ],
  
  'PIB Brasil': [
    // 2022
    '2022-06-02', '2022-09-01', '2022-12-01',
    // 2023
    '2023-03-02', '2023-06-01', '2023-09-01', '2023-12-05',
    // 2024
    '2024-03-01', '2024-06-04', '2024-09-02', '2024-12-02',
    // 2025
    '2025-03-07', '2025-06-02', '2025-09-01', '2025-12-01',
    '2026-03-02', '2026-06-01', '2026-09-01', '2026-12-01',
    '2027-03-02', '2027-06-01', '2027-09-01', '2027-12-01'
  ],
 
  
  'Vespera de Feriados': [
     '2022-03-28', '2022-04-14', '2022-06-15',
    // 2023
    '2023-04-06', '2023-06-07',
    // 2024
    '2024-03-28', '2024-05-29',
    // 2025
    '2025-04-17', '2025-06-18', '2026-04-02', '2026-06-03',
    '2027-03-25', '2027-06-23',
    // 2022
    '2022-04-20', '2022-04-30', '2022-09-06', '2022-10-11',
    '2022-11-01', '2022-11-14', '2022-12-24',
    // 2023
    '2023-04-20', '2023-04-30', '2023-09-06', '2023-10-11',
    '2023-11-01', '2023-11-14', '2023-12-24',
    // 2024
    '2024-04-20', '2024-04-30', '2024-09-06', '2024-10-11',
    '2024-11-01', '2024-11-14', '2024-12-24',
    // 2025
    '2025-04-20', '2025-04-30', '2025-09-06', '2025-10-11',
    '2025-11-01', '2025-11-14', '2025-12-24', '2026-04-20',
    '2026-04-30', '2026-09-06', '2026-10-11', '2026-11-01',
    '2026-11-14', '2026-12-24', '2027-04-20', '2027-04-30',
    '2027-09-06', '2027-10-11', '2027-11-01', '2027-11-14',
    '2027-12-24'
  ],
  
  'Vencimento Dólar Futuro': [
    // 2022
    '2022-01-03', '2022-02-01', '2022-03-01', '2022-04-01',
    '2022-05-02', '2022-06-01', '2022-07-01', '2022-08-01',
    '2022-09-01', '2022-10-03', '2022-11-01', '2022-12-01',
    // 2023
    '2023-01-02', '2023-02-01', '2023-03-01', '2023-04-03',
    '2023-05-01', '2023-06-01', '2023-07-03', '2023-08-01',
    '2023-09-01', '2023-10-02', '2023-11-01', '2023-12-01',
    // 2024
    '2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01',
    '2024-05-01', '2024-06-03', '2024-07-01', '2024-08-01',
    '2024-09-02', '2024-10-01', '2024-11-01', '2024-12-02',
    // 2025
    '2025-01-01', '2025-02-03', '2025-03-03', '2025-04-01',
    '2025-05-01', '2025-06-02', '2025-07-01', '2025-08-01',
    '2025-09-01', '2025-10-01', '2025-11-03', '2025-12-01'
  ],
  
  'Vencimento WIN Futuro': [
    // 2022
    '2022-02-16', '2022-04-13', '2022-06-15', '2022-08-17',
    '2022-10-12', '2022-12-14',
    // 2023
    '2023-02-15', '2023-04-12', '2023-06-14', '2023-08-16',
    '2023-10-18', '2023-12-13',
    // 2024
    '2024-02-14', '2024-04-17', '2024-06-12', '2024-08-14',
    '2024-10-16', '2024-12-18',
    // 2025
    '2025-02-12', '2025-04-16', '2025-06-18', '2025-08-13',
    '2025-10-15', '2025-12-17', '2026-02-18', '2026-04-15',
    '2026-06-17', '2026-08-12', '2026-10-14', '2026-12-16'
  ],
  
  'Vencimento Opções Bovespa': [
    // 2022
    '2022-01-21', '2022-02-18', '2022-03-18', '2022-04-15',
    '2022-05-20', '2022-06-17', '2022-07-15', '2022-08-19',
    '2022-09-16', '2022-10-21', '2022-11-18', '2022-12-16',
    // 2023
    '2023-01-20', '2023-02-17', '2023-03-17', '2023-04-21',
    '2023-05-19', '2023-06-16', '2023-07-21', '2023-08-18',
    '2023-09-15', '2023-10-20', '2023-11-17', '2023-12-15',
    // 2024
    '2024-01-19', '2024-02-16', '2024-03-15', '2024-04-19',
    '2024-05-17', '2024-06-21', '2024-07-19', '2024-08-16',
    '2024-09-20', '2024-10-18', '2024-11-15', '2024-12-20',
    // 2025
    '2025-01-17', '2025-02-21', '2025-03-21', '2025-04-18',
    '2025-05-16', '2025-06-20', '2025-07-18', '2025-08-15',
    '2025-09-19', '2025-10-17', '2025-11-21', '2025-12-19'
  ],
  
  'Super Quartas (Fed + Copom)': [
    // 2022
    '2022-03-16', '2022-05-04', '2022-09-21',
    // 2023
    '2023-02-01', '2023-03-22', '2023-05-03', '2023-09-20',
    '2023-11-01', '2023-12-13',
    // 2024
    '2024-01-31', '2024-03-20', '2024-07-31', '2024-09-18',
    // 2025
    '2025-01-29', '2025-03-19', '2025-05-07', '2025-06-18',
    '2025-07-30', '2025-09-17', '2025-12-10', '2026-01-28',
    '2026-03-18', '2026-04-29', '2026-06-17', '2026-09-16',
    '2026-12-09', '2027-01-27'
  ],
  
  'Payroll EUA': [
    // 2022
    '2022-01-07', '2022-02-04', '2022-03-04', '2022-04-01',
    '2022-05-06', '2022-06-03', '2022-07-08', '2022-08-05',
    '2022-09-02', '2022-10-07', '2022-11-04', '2022-12-02',
    // 2023
    '2023-01-06', '2023-02-03', '2023-03-03', '2023-04-07',
    '2023-05-05', '2023-06-02', '2023-07-07', '2023-08-04',
    '2023-09-01', '2023-10-06', '2023-11-03', '2023-12-01',
    // 2024
    '2024-01-05', '2024-02-02', '2024-03-01', '2024-04-05',
    '2024-05-03', '2024-06-07', '2024-07-05', '2024-08-02',
    '2024-09-06', '2024-10-04', '2024-11-01', '2024-12-06',
    // 2025
    '2025-01-03', '2025-02-07', '2025-03-07', '2025-04-04',
    '2025-05-02', '2025-06-06', '2025-07-04', '2025-08-01',
    '2025-09-05', '2025-10-03', '2025-11-07', '2025-12-05'
  ],
  
  'FOMC (Fed)': [
    // 2022
    '2022-01-25', '2022-01-26', '2022-03-15', '2022-03-16',
    '2022-05-03', '2022-05-04', '2022-06-14', '2022-06-15',
    '2022-07-26', '2022-07-27', '2022-09-20', '2022-09-21',
    '2022-11-01', '2022-11-02', '2022-12-13', '2022-12-14',
    // 2023
    '2023-01-31', '2023-02-01', '2023-03-21', '2023-03-22',
    '2023-05-02', '2023-05-03', '2023-06-13', '2023-06-14',
    '2023-07-25', '2023-07-26', '2023-09-19', '2023-09-20',
    '2023-10-31', '2023-11-01', '2023-12-12', '2023-12-13',
    // 2024
    '2024-01-30', '2024-01-31', '2024-03-19', '2024-03-20',
    '2024-04-30', '2024-05-01', '2024-06-11', '2024-06-12',
    '2024-07-30', '2024-07-31', '2024-09-17', '2024-09-18',
    '2024-11-06', '2024-11-07', '2024-12-17', '2024-12-18',
    // 2025
    '2025-01-28', '2025-01-29', '2025-03-18', '2025-03-19',
    '2025-05-06', '2025-05-07', '2025-06-17', '2025-06-18',
    '2025-07-29', '2025-07-30', '2025-09-16', '2025-09-17',
    '2025-10-28', '2025-10-29', '2025-12-09', '2025-12-10'
  ]
};

// Função para normalizar data - CORRIGIDA
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  
  // Se já está no formato YYYY-MM-DD, retorna
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Se é uma string com data e hora (ISO format), extrai apenas a data
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  
  // Se é uma string com data e hora usando espaço
  if (typeof dateStr === 'string' && dateStr.includes(' ')) {
    const datePart = dateStr.split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }
  
  // Se é um objeto Date
  if (dateStr instanceof Date) {
    return dateStr.toISOString().split('T')[0];
  }
  
  // Tratar formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Tratar formato MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('Data inválida:', dateStr);
  }
  
  return null;
};

// Função para calcular métricas de eventos especiais - MELHORADA
const calculateSpecialEventsMetrics = (tradesData) => {
  if (!tradesData || !Array.isArray(tradesData)) {
    return [];
  }
  
  const specialDatesMap = new Map();
  
  // Criar mapa de datas especiais
  Object.entries(SPECIAL_EVENTS).forEach(([eventType, dates]) => {
    dates.forEach(date => {
      const normalizedDate = normalizeDate(date);
      if (normalizedDate) {
        if (!specialDatesMap.has(normalizedDate)) {
          specialDatesMap.set(normalizedDate, []);
        }
        specialDatesMap.get(normalizedDate).push(eventType);
      }
    });
  });
  

  
  const eventMetrics = {};
  
  // Inicializar métricas
  Object.keys(SPECIAL_EVENTS).forEach(eventType => {
    eventMetrics[eventType] = {
      name: eventType,
      trades: [],
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      result: 0
    };
  });
  
  // Processar trades
  let tradesProcessados = 0;
  let tradesComEventos = 0;
  
  tradesData.forEach((trade, index) => {
    // Tentar diferentes formatos de data possíveis
    const possibleDateFields = [
      trade.date,
      trade.Date,
      trade.data,
      trade.Abertura,
      trade.Data,
      trade.timestamp,
      trade.entry_date,
      trade.entry_time,
      trade.open_time,
      trade.datetime
    ];
    
    let tradeDate = null;
    
    for (const dateField of possibleDateFields) {
      if (dateField) {
        tradeDate = normalizeDate(dateField);
        if (tradeDate) break;
      }
    }
    

    
    tradesProcessados++;
    
    if (tradeDate && specialDatesMap.has(tradeDate)) {
      const eventTypes = specialDatesMap.get(tradeDate);
      tradesComEventos++;
      
      console.log(`✓ Trade em evento especial - Data: ${tradeDate}, Eventos: ${eventTypes.join(', ')}`);
      
      // Tentar diferentes formatos de resultado possíveis
      const possibleResultFields = [
        trade.pnl,
        trade.PnL,
        trade.resultado,
        trade['Res. Operação'],
        trade.profit,
        trade.dailyPnL,
        trade.return,
        trade.net_pnl,
        trade.realized_pnl,
        trade.total_pnl
      ];
      
      let result = 0;
      
      for (const resultField of possibleResultFields) {
        if (resultField !== undefined && resultField !== null) {
          const parsed = parseFloat(resultField);
          if (!isNaN(parsed)) {
            result = parsed;
            break;
          }
        }
      }
      
      if (!isNaN(result)) {
        eventTypes.forEach(eventType => {
          const metrics = eventMetrics[eventType];
          
          metrics.trades.push({ date: tradeDate, result, ...trade });
          metrics.totalTrades++;
          metrics.result += result;
          
          if (result > 0) {
            metrics.winningTrades++;
            metrics.totalProfit += result;
          } else if (result < 0) {
            metrics.losingTrades++;
            metrics.totalLoss += Math.abs(result);
          }
          // Trades com resultado zero não contam como win nem loss
        });
      }
    }
  });
  
  console.log(`Trades processados: ${tradesProcessados}`);
  console.log(`Trades com eventos especiais: ${tradesComEventos}`);

  
  // Calcular métricas finais
  return Object.values(eventMetrics)
    .filter(metrics => metrics.totalTrades > 0)
    .map(metrics => {
      const winRate = metrics.totalTrades > 0 
        ? (metrics.winningTrades / metrics.totalTrades) * 100 
        : 0;
      
      // Corrigir cálculo do Profit Factor
      let profitFactor = 0;
      if (metrics.totalLoss > 0 && metrics.totalProfit > 0) {
        profitFactor = metrics.totalProfit / metrics.totalLoss;
      } else if (metrics.totalProfit > 0 && metrics.totalLoss === 0) {
        // Se só tem lucros, profit factor é alto mas não infinito
        profitFactor = 99.99;
      } else if (metrics.totalProfit === 0 && metrics.totalLoss > 0) {
        // Se só tem perdas, profit factor é 0
        profitFactor = 0;
      }
      
      return {
        name: metrics.name,
        date: `${metrics.totalTrades} trades`,
        impact: metrics.result > 0 ? 'Positivo' : 'Negativo',
        profitFactor: Number(profitFactor.toFixed(2)),
        winRate: Number(winRate.toFixed(1)),
        trades: metrics.totalTrades,
        result: Number(metrics.result.toFixed(2))
      };
    })
    .sort((a, b) => Math.abs(b.result) - Math.abs(a.result));
};

// Componente principal
export function SpecialEventsSection({
  showSpecialEvents,
  setShowSpecialEvents,
  tadesData // data.EquityCurveData.daily ou fileResults para múltiplos CSV
}) {
  // Para múltiplos CSV, consolidar todos os trades
  let tradesData;
  if (tadesData && typeof tadesData === 'object' && !tadesData.trades) {
    // É fileResults (múltiplos CSV)
    console.log('📊 MÚLTIPLOS CSVs: Consolidando trades para Eventos Especiais');
    const allTrades = [];
    Object.keys(tadesData).forEach(fileName => {
      const strategyData = tadesData[fileName] as any;
      if (strategyData && strategyData.trades && Array.isArray(strategyData.trades)) {
        allTrades.push(...strategyData.trades);
      }
    });
    tradesData = allTrades;
    console.log(`📊 Consolidados ${allTrades.length} trades de ${Object.keys(tadesData).length} CSVs`);
  } else {
    // É trades único
    tradesData = tadesData?.trades || [];
  }
  
  // Debug: verificar estrutura dos dados
  console.log('Dados recebidos para eventos especiais:', tadesData);
  
  const specialEvents = calculateSpecialEventsMetrics(tradesData);
  
  // Estatísticas gerais
  const totalSpecialTrades = specialEvents.reduce((sum, event) => sum + event.trades, 0);
  const totalSpecialProfit = specialEvents.reduce((sum, event) => sum + event.result, 0);
  const avgWinRate = specialEvents.length > 0 
    ? specialEvents.reduce((sum, event) => sum + event.winRate, 0) / specialEvents.length 
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Zap className="w-5 h-5 text-yellow-400 mr-2" />
          <h2 className="text-lg font-medium">Eventos Especiais</h2>
          {totalSpecialTrades > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
              {totalSpecialTrades} trades
            </span>
          )}
        </div>
        <button 
          onClick={() => setShowSpecialEvents(!showSpecialEvents)}
          className="p-1.5 hover:bg-gray-700 rounded-md"
        >
          {showSpecialEvents ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      
      {showSpecialEvents && (
        <div className="p-4">
          {specialEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Nenhum trade encontrado em dias de eventos especiais</p>
              <p className="text-xs text-gray-500 mt-1">
                Total de trades analisados: {tradesData?.length || 0}
              </p>
              {tradesData?.length > 0 && (
                <div className="text-xs text-gray-600 mt-2 p-3 bg-gray-700 rounded">
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div>
                      <strong>Primeiro trade:</strong>
                      <br />Data: {normalizeDate(tradesData[0]?.entry_date || tradesData[0]?.date || tradesData[0]?.Date) || 'N/A'}
                      <br />PnL: R$ {tradesData[0]?.pnl || tradesData[0]?.PnL || 'N/A'}
                      <br />Símbolo: {tradesData[0]?.symbol || tradesData[0]?.Symbol || 'N/A'}
                    </div>
                    <div>
                      <strong>Último trade:</strong>
                      <br />Data: {normalizeDate(tradesData[tradesData.length - 1]?.entry_date || tradesData[tradesData.length - 1]?.date || tradesData[tradesData.length - 1]?.Date) || 'N/A'}
                      <br />PnL: R$ {tradesData[tradesData.length - 1]?.pnl || tradesData[tradesData.length - 1]?.PnL || 'N/A'}
                      <br />Direção: {tradesData[tradesData.length - 1]?.direction || tradesData[tradesData.length - 1]?.Direction || 'N/A'}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <strong>Período analisado:</strong> {normalizeDate(tradesData[0]?.entry_date || tradesData[0]?.date)} a {normalizeDate(tradesData[tradesData.length - 1]?.entry_date || tradesData[tradesData.length - 1]?.date)}
                    <br /><strong>Eventos próximos a 2024-09-12:</strong> Payroll EUA (2024-09-06), FOMC (2024-09-17, 2024-09-18), Super Quarta (2024-09-18), Vencimento Opções (2024-09-20)
                    <br /><strong>Eventos próximos a 2025-06-17:</strong> Vencimento WIN (2025-06-18), FOMC (2025-06-17, 2025-06-18), Super Quarta (2025-06-18), Vencimento Opções (2025-06-20)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Resumo geral */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{totalSpecialTrades}</div>
                  <div className="text-xs text-gray-400">Total Trades</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <div className={`text-2xl font-bold ${totalSpecialProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalSpecialProfit >= 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totalSpecialProfit)}
                  </div>
                  <div className="text-xs text-gray-400">Resultado Total</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-400">{avgWinRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Taxa Média</div>
                </div>
              </div>

              {/* Tabela de eventos */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-4 py-3 text-left">Evento</th>
                      <th className="px-4 py-2 text-center">Fator de Lucro</th>
                      <th className="px-4 py-2 text-center">Taxa de Acerto</th>
                      <th className="px-4 py-2 text-right">Resultado</th>
                      <th className="px-4 py-2 text-center">Trades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specialEvents.map((event, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {event.result > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400 mr-2" />
                            )}
                            <div>
                              <div className="font-medium">{event.name}</div>
                              <div className="text-xs text-gray-400">{event.date}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            event.profitFactor >= 1.5 ? 'bg-green-900 text-green-300' : 
                            event.profitFactor >= 1.0 ? 'bg-yellow-900 text-yellow-300' : 
                            'bg-red-900 text-red-300'
                          }`}>
                            {event.profitFactor === 99.99 ? '99.99+' : event.profitFactor.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            event.winRate >= 60 ? 'bg-green-900 text-green-300' : 
                            event.winRate >= 45 ? 'bg-yellow-900 text-yellow-300' : 
                            'bg-red-900 text-red-300'
                          }`}>
                            {event.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className={`font-medium ${event.result > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {event.result > 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(event.result)}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                            {event.trades}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Insights */}
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Zap className="w-4 h-4 text-yellow-400 mr-2" />
                  Insights dos Eventos Especiais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-gray-300 mb-1">Melhor Evento:</div>
                    <div className="text-green-400 font-medium">
                      {specialEvents.length > 0 ? specialEvents[0].name : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-300 mb-1">Eventos com Resultado Positivo:</div>
                    <div className="text-blue-400 font-medium">
                      {specialEvents.filter(e => e.result > 0).length} de {specialEvents.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-300 mb-1">Maior Impacto:</div>
                    <div className={`font-medium ${specialEvents.length > 0 && specialEvents[0].result > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {specialEvents.length > 0 ? new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Math.abs(specialEvents[0].result)) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-300 mb-1">Volatilidade:</div>
                    <div className="text-yellow-400 font-medium">
                      {totalSpecialTrades > 0 ? 'Alta' : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
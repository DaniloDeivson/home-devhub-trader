import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, ChevronUp, ChevronDown, Search, ArrowUpDown, TrendingUp, TrendingDown, Calendar, DollarSign, Filter, X, Eye } from 'lucide-react';

interface Trade {
  id?: number;
  entry_date: string;
  exit_date: string;
  entry_price: number;
  quantity_total: number;
  quantity_compra: number;
  quantity_venda: number;

  exit_price: number;
  pnl: number;
  pnl_pct: number;
  direction: 'long' | 'short';
  symbol?: string;
  strategy?: string;
  quantity?: number;
  duration?: number; // em horas
  drawdown?: number;
  max_gain?: number;
  max_loss?: number;
}

interface TradesData {
  trades: Trade[];
  statistics?: any;
  filters?: any;
  metadata?: any;
}

type SortField = 'entry_date' | 'exit_date' | 'pnl' | 'pnl_pct' | 'symbol' | 'duration';
type SortDirection = 'asc' | 'desc';

export function TradesTable({ sampleTrades }: { sampleTrades: Trade[] | TradesData }) {
  const [showTrades, setShowTrades] = useState(false);
  const [tradeSearch, setTradeSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortField, setSortField] = useState<SortField>('entry_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Extrair trades do objeto ou usar array diretamente
  const trades = Array.isArray(sampleTrades) ? sampleTrades : (sampleTrades?.trades || []);

  const availableAssets = useMemo(() => 
    [...new Set(trades.map(t => t.symbol).filter(Boolean))].sort(),
    [trades]
  );

  const availableStrategies = useMemo(() => 
    [...new Set(trades.map(t => t.strategy).filter(Boolean))].sort(),
    [trades]
  );

  useEffect(() => {
    console.log('sampleTrades', sampleTrades);
    console.log('extracted trades', trades);
  }, [sampleTrades, trades]);

  const filteredTrades = useMemo(() => {
    if (!trades || !Array.isArray(trades)) {
      return [];
    }

    let filtered = trades.filter(trade => {
      // Filtro de busca por texto
      if (tradeSearch) {
        const searchLower = tradeSearch.toLowerCase();
        if (!(
          trade.symbol?.toLowerCase().includes(searchLower) ||
          trade.strategy?.toLowerCase().includes(searchLower) ||
          trade.direction.toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }

      // Filtro por ativo
      if (selectedAsset && trade.symbol !== selectedAsset) {
        return false;
      }

      // Filtro por estratégia
      if (selectedStrategy && trade.strategy !== selectedStrategy) {
        return false;
      }

      // Filtro por direção
      if (selectedDirection && trade.direction !== selectedDirection) {
        return false;
      }

      // Filtro por data
      if (dateFilter !== 'all') {
        const entryDate = new Date(trade.entry_date);
        const now = new Date();
        const diffTime = now.getTime() - entryDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        switch (dateFilter) {
          case 'today':
            if (diffDays > 1) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
        }
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'entry_date':
          aValue = new Date(a.entry_date).getTime();
          bValue = new Date(b.entry_date).getTime();
          break;
        case 'exit_date':
          aValue = new Date(a.exit_date).getTime();
          bValue = new Date(b.exit_date).getTime();
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [trades, tradeSearch, selectedAsset, selectedStrategy, selectedDirection, dateFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
    setTradeSearch('');
    setSelectedAsset(null);
    setSelectedStrategy(null);
    setSelectedDirection(null);
    setDateFilter('all');
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winRate = filteredTrades.length > 0 ? 
    (filteredTrades.filter(t => t.pnl > 0).length / filteredTrades.length) * 100 : 0;

  return (
    <div className="rounded-lg bg-gray-800 text-white p-6 flex-col ">
      <div className="max-w-7xl mx-auto ">
        <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <BarChart className="w-6 h-6 text-blue-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold">Histórico de Operações</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {filteredTrades.length} operações • P&L Total: 
                  <span className={`ml-1 font-medium ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(totalPnL)}
                  </span>
                  • Win Rate: <span className="text-blue-400 font-medium">{winRate.toFixed(1)}%</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowTrades(!showTrades)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {showTrades ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
          
          {showTrades && (
            <div className="p-6 ">
              {/* Barra de filtros */}
              <div className="mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar por ativo, estratégia..."
                        value={tradeSearch}
                        onChange={(e) => setTradeSearch(e.target.value)}
                        className="pl-9 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Todas as datas</option>
                        <option value="today">Hoje</option>
                        <option value="week">Última semana</option>
                        <option value="month">Último mês</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        showFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      Filtros
                    </button>
                    
                    {(selectedAsset || selectedStrategy || selectedDirection || tradeSearch) && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtros expandidos */}
                {showFilters && (
                  <div className="mt-4 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium">Ativo</label>
                        <select
                          value={selectedAsset || ''}
                          onChange={(e) => setSelectedAsset(e.target.value || null)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Todos os ativos</option>
                          {availableAssets.map(asset => (
                            <option key={asset} value={asset}>{asset}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium">Estratégia</label>
                        <select
                          value={selectedStrategy || ''}
                          onChange={(e) => setSelectedStrategy(e.target.value || null)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Todas as estratégias</option>
                          {availableStrategies.map(strategy => (
                            <option key={strategy} value={strategy}>{strategy}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium">Direção</label>
                        <select
                          value={selectedDirection || ''}
                          onChange={(e) => setSelectedDirection(e.target.value || null)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Todas as direções</option>
                          <option value="long">Compra (Long)</option>
                          <option value="short">Venda (Short)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Tabela */}
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                {filteredTrades.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('entry_date')}
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                          >
                            Data Entrada
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('exit_date')}
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                          >
                            Data Saída
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleSort('symbol')}
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                          >
                            Ativo
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-center">Estratégia</th>
                        <th className="px-4 py-3 text-center">Direção</th>
                        <th className="px-4 py-3 text-right">Entrada</th>
                        <th className="px-4 py-3 text-right">Saída</th>
                        <th className="px-4 py-3 text-center">Duração</th>
                        <th className="px-4 py-3 text-center">Giro Total</th>
                        <th className="px-4 py-3 text-center">Quantidade</th>
                        <th className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleSort('pnl')}
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                          >
                            P&L (R$)
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleSort('pnl_pct')}
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                          >
                            P&L (%)
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-center">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades.slice(0, 100).map((trade, index) => (
                        <tr 
                          key={trade.id || index} 
                          className={`border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-50 transition-colors ${
                            trade.pnl > 0 ? 'hover:bg-green-900 hover:bg-opacity-10' : 'hover:bg-red-900 hover:bg-opacity-10'
                          }`}
                        >
                          <td className="px-4 py-3 text-xs">
                            {new Date(trade.entry_date).toLocaleDateString('pt-BR')}<br/>
                            <span className="text-gray-400">{new Date(trade.entry_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {new Date(trade.exit_date).toLocaleDateString('pt-BR')}<br/>
                            <span className="text-gray-400">{new Date(trade.exit_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-blue-400">{trade.symbol || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-gray-600 rounded-full text-xs">
                              {trade.strategy || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs ${
                              trade.direction === 'long' 
                                ? 'bg-green-900 bg-opacity-50 text-green-300' 
                                : 'bg-red-900 bg-opacity-50 text-red-300'
                            }`}>
                              {trade.direction === 'long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {trade.direction === 'long' ? 'Long' : 'Short'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatCurrency(trade.entry_price)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatCurrency(trade.exit_price)}
                          </td>
                          <td className="px-4 py-3 text-center text-xs">
                            {trade.duration ? formatDuration(trade.duration) : 'N/A'}
                          </td>
                           <td className="px-4 py-3 text-center text-xs">
                            {trade?.quantity_total  || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center text-xs">
                            {trade?.quantity_compra || 'N/A'}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-medium ${
                            trade.pnl > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.pnl > 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-medium ${
                            trade.pnl_pct > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.pnl_pct > 0 ? '+' : ''}{trade.pnl_pct.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedTrade(trade)}
                              className="p-1 hover:bg-gray-600 rounded transition-colors"
                            >
                              <Eye className="w-4 h-4 text-gray-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 bg-gray-700 bg-opacity-30">
                    <BarChart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <div className="text-gray-400 text-lg mb-2">
                      Nenhuma operação encontrada
                    </div>
                    <div className="text-gray-500 text-sm">
                      Tente ajustar os filtros de busca
                    </div>
                  </div>
                )}
              </div>
              
              {filteredTrades.length > 100 && (
                <div className="mt-4 text-center text-gray-400 text-sm bg-gray-700 bg-opacity-30 rounded-lg py-3">
                  Mostrando 100 de {filteredTrades.length} operações
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de detalhes */}
        {selectedTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalhes da Operação</h3>
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                {selectedTrade.id && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID:</span>
                    <span>#{selectedTrade.id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Ativo:</span>
                  <span className="font-medium text-blue-400">{selectedTrade.symbol || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estratégia:</span>
                  <span>{selectedTrade.strategy || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Direção:</span>
                  <span className={`flex items-center gap-1 ${
                    selectedTrade.direction === 'long' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedTrade.direction === 'long' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {selectedTrade.direction === 'long' ? 'Long' : 'Short'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantidade:</span>
                  <span>{selectedTrade.quantity || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duração:</span>
                  <span>{selectedTrade.duration ? formatDuration(selectedTrade.duration) : 'N/A'}</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between">
                  <span className="text-gray-400">Preço de Entrada:</span>
                  <span className="font-mono">{formatCurrency(selectedTrade.entry_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Preço de Saída:</span>
                  <span className="font-mono">{formatCurrency(selectedTrade.exit_price)}</span>
                </div>
                {selectedTrade.drawdown !== undefined && selectedTrade.drawdown !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Drawdown:</span>
                    <span className="text-red-400">{formatCurrency(selectedTrade.drawdown)}</span>
                  </div>
                )}
                {selectedTrade.max_gain !== undefined && selectedTrade.max_gain !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ganho Máximo:</span>
                    <span className="text-green-400">{formatCurrency(selectedTrade.max_gain)}</span>
                  </div>
                )}
                {selectedTrade.max_loss !== undefined && selectedTrade.max_loss !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Perda Máxima:</span>
                    <span className="text-red-400">{formatCurrency(selectedTrade.max_loss)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-gray-400">P&L Total:</span>
                  <span className={selectedTrade.pnl > 0 ? 'text-green-400' : 'text-red-400'}>
                    {selectedTrade.pnl > 0 ? '+' : ''}{formatCurrency(selectedTrade.pnl)} ({selectedTrade.pnl_pct > 0 ? '+' : ''}{selectedTrade.pnl_pct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
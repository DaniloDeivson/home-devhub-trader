import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, ChevronUp, ChevronDown, Search, ArrowUpDown, TrendingUp, TrendingDown, Calendar, Filter, X, Eye, Download } from 'lucide-react';

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
  statistics?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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
  const [selectedTradesForDownload, setSelectedTradesForDownload] = useState<Set<number>>(new Set());

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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

    const filtered = trades.filter(trade => {
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
      let aValue: string | number | Date;
      let bValue: string | number | Date;

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
          aValue = a[sortField] as string | number;
          bValue = b[sortField] as string | number;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [trades, tradeSearch, selectedAsset, selectedStrategy, selectedDirection, dateFilter, sortField, sortDirection]);

  // Calcular dados de paginação
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrades = filteredTrades.slice(startIndex, endIndex);

  // Resetar página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [tradeSearch, selectedAsset, selectedStrategy, selectedDirection, dateFilter]);

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
    setCurrentPage(1);
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

  const downloadTrades = (tradesToDownload: Trade[]) => {
    const csvContent = [
      // Cabeçalho
      ['ID', 'Data Entrada', 'Data Saída', 'Ativo', 'Estratégia', 'Direção', 'Preço Entrada', 'Preço Saída', 'Duração', 'Giro Total', 'Quantidade', 'P&L (R$)', 'P&L (%)'],
      // Dados
      ...tradesToDownload.map(trade => [
        trade.id || '',
        new Date(trade.entry_date).toLocaleDateString('pt-BR') + ' ' + new Date(trade.entry_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
        new Date(trade.exit_date).toLocaleDateString('pt-BR') + ' ' + new Date(trade.exit_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
        trade.symbol || 'N/A',
        trade.strategy || 'N/A',
        trade.direction === 'long' ? 'Long' : 'Short',
        trade.entry_price.toString(),
        trade.exit_price.toString(),
        trade.duration ? formatDuration(trade.duration) : 'N/A',
        trade.quantity_total?.toString() || 'N/A',
        trade.quantity_compra?.toString() || 'N/A',
        trade.pnl.toString(),
        trade.pnl_pct.toFixed(2) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `operacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const handleDownloadAll = () => {
    // Se há operações selecionadas, baixa apenas elas
    if (selectedTradesForDownload.size > 0) {
      const selectedTrades = filteredTrades.filter((trade, index) => 
        selectedTradesForDownload.has(trade.id || index)
      );
      downloadTrades(selectedTrades);
    } else {
      // Caso contrário, baixa todas as operações filtradas
      downloadTrades(filteredTrades);
    }
  };

  const toggleTradeSelection = (tradeId: number) => {
    const newSelection = new Set(selectedTradesForDownload);
    if (newSelection.has(tradeId)) {
      newSelection.delete(tradeId);
    } else {
      newSelection.add(tradeId);
    }
    setSelectedTradesForDownload(newSelection);
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
            <div className="flex items-center gap-3">
              {/* Botão de download sempre visível */}
                            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadAll}
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
                      selectedTradesForDownload.size > 0 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    title={selectedTradesForDownload.size > 0 
                      ? `Baixar ${selectedTradesForDownload.size} operação(ões) selecionada(s)` 
                      : `Baixar ${filteredTrades.length} operação(ões) exibida(s) nos filtros atuais`
                    }
                  >
                    <Download className="w-4 h-4" />
                    {selectedTradesForDownload.size > 0 ? `Baixar (${selectedTradesForDownload.size})` : 'Baixar'}
                  </button>
                </div>
                <div className="text-xs text-gray-400 text-right max-w-xs">
                  O download será feito com base nos itens exibidos nessa lista, caso precise de alguma operação específica, filtre-a
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
                        onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
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
              <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-800 shadow-lg">
                {currentTrades.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
                      <tr className="border-b border-gray-600">
                        <th className="px-5 py-3 text-center w-12">
                          <input
                            type="checkbox"
                            checked={selectedTradesForDownload.size === filteredTrades.length && filteredTrades.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTradesForDownload(new Set(filteredTrades.map((t, idx) => t.id || idx)));
                              } else {
                                setSelectedTradesForDownload(new Set());
                              }
                            }}
                            className="rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-400 focus:ring-2 transition-all"
                          />
                        </th>
                        <th className="px-5 py-3 text-left">
                          <button
                            onClick={() => handleSort('entry_date')}
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors font-medium"
                          >
                            Data Entrada
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-5 py-3 text-left">
                          <button
                            onClick={() => handleSort('exit_date')}
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors font-medium"
                          >
                            Data Saída
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-5 py-3 text-center">
                          <button
                            onClick={() => handleSort('symbol')}
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors font-medium"
                          >
                            Ativo
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-5 py-3 text-center font-medium">Estratégia</th>
                        <th className="px-5 py-3 text-center font-medium">Direção</th>
                        <th className="px-5 py-3 text-right font-medium">Entrada</th>
                        <th className="px-5 py-3 text-right font-medium">Saída</th>
                        <th className="px-5 py-3 text-center font-medium">Duração</th>
                        <th className="px-5 py-3 text-center font-medium">Giro Total</th>
                        <th className="px-5 py-3 text-center font-medium">Quantidade</th>
                        <th className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleSort('pnl')}
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors font-medium"
                          >
                            P&L (R$)
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleSort('pnl_pct')}
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors font-medium"
                          >
                            P&L (%)
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-5 py-3 text-center font-medium">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {currentTrades.map((trade, index) => (
                        <tr 
                          key={trade.id || index} 
                          className={`group transition-all duration-200 hover:bg-gray-700/50 ${
                            trade.pnl > 0 
                              ? 'hover:bg-green-900/20 border-l-4 border-l-green-500/30' 
                              : 'hover:bg-red-900/20 border-l-4 border-l-red-500/30'
                          } ${trade.pnl > 0 ? 'bg-green-900/5' : 'bg-red-900/5'}`}
                        >
                          <td className="px-5 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedTradesForDownload.has(trade.id || index)}
                              onChange={() => toggleTradeSelection(trade.id || index)}
                              className="rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-400 focus:ring-2 transition-all"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-white text-sm">
                                {new Date(trade.entry_date).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(trade.entry_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-white text-sm">
                                {new Date(trade.exit_date).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(trade.exit_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-900/50 text-blue-300 border border-blue-700/30">
                              {trade.symbol || 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-600/50 text-gray-200 border border-gray-500/30">
                              {trade.strategy || 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              trade.direction === 'long' 
                                ? 'bg-green-900/50 text-green-300 border border-green-700/30' 
                                : 'bg-red-900/50 text-red-300 border border-red-700/30'
                            }`}>
                              {trade.direction === 'long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {trade.direction === 'long' ? 'Long' : 'Short'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="font-mono text-xs font-medium text-white">
                              {formatCurrency(trade.entry_price)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="font-mono text-xs font-medium text-white">
                              {formatCurrency(trade.exit_price)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-600/30 text-gray-300">
                              {trade.duration ? formatDuration(trade.duration) : 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-mono text-xs text-gray-300">
                              {trade?.quantity_total || 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-mono text-xs text-gray-300">
                              {trade?.quantity_compra || 'N/A'}
                            </span>
                          </td>
                          <td className={`px-5 py-3 text-right font-mono text-xs font-bold ${
                            trade.pnl > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.pnl > 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                          </td>
                          <td className={`px-5 py-3 text-right font-mono text-xs font-bold ${
                            trade.pnl_pct > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.pnl_pct > 0 ? '+' : ''}{trade.pnl_pct.toFixed(2)}%
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => setSelectedTrade(trade)}
                              className="p-1.5 hover:bg-gray-600 rounded-lg transition-all duration-200 group-hover:bg-gray-600/50"
                              title="Ver detalhes"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16 bg-gray-800/50">
                    <BarChart className="w-16 h-16 text-gray-500 mx-auto mb-6" />
                    <div className="text-gray-300 text-xl font-medium mb-3">
                      Nenhuma operação encontrada
                    </div>
                    <div className="text-gray-500 text-sm max-w-md mx-auto">
                      Tente ajustar os filtros de busca ou verificar se há dados disponíveis
                    </div>
                  </div>
                )}
              </div>
              
              {/* Controles de paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded-lg mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">Itens por página:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-300">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTrades.length)} de {filteredTrades.length} operações
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 rounded transition-colors"
                    >
                      Primeira
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500 rounded transition-colors"
                    >
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500 rounded transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 rounded transition-colors"
                    >
                      Última
                    </button>
                  </div>
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
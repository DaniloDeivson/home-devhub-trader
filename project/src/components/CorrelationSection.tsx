import React, { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';

interface SimpleCorrelationProps {
  showCorrelation: boolean;
  setShowCorrelation: (show: boolean) => void;
  backtestResult: any;
}

export function SimpleCorrelationComponent({
  showCorrelation,
  setShowCorrelation,
  backtestResult
}: SimpleCorrelationProps) {
  const [activeTab, setActiveTab] = useState('resultado');

  // Dados de correlação (vindos da API)
  const correlationData = backtestResult?.dateDirectionCorrelation;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const renderResultadoTab = () => {
    if (!correlationData?.correlacao_data_resultado) return null;

    const { resumo, detalhes } = correlationData.correlacao_data_resultado;

    return (
      <div className="space-y-6">
        {/* Cards principais - RESPOSTA À PERGUNTA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-900 bg-opacity-20 p-4 rounded-lg border border-red-700">
            <div className="text-center">
              <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-400">
                {resumo.resposta_pergunta.quando_uma_perde_outra_tambem_perde_pct}%
              </div>
              <div className="text-sm text-red-300">
                Quando uma perde, a outra também perde
              </div>
            </div>
          </div>

          <div className="bg-green-900 bg-opacity-20 p-4 rounded-lg border border-green-700">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">
                {resumo.resposta_pergunta.quando_uma_ganha_outra_tambem_ganha_pct}%
              </div>
              <div className="text-sm text-green-300">
                Quando uma ganha, a outra também ganha
              </div>
            </div>
          </div>

          <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg border border-blue-700">
            <div className="text-center">
              <ArrowUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">
                {resumo.resposta_pergunta.dias_com_diversificacao_pct}%
              </div>
              <div className="text-sm text-blue-300">
                Dias com diversificação (resultados opostos)
              </div>
            </div>
          </div>
        </div>

        {/* Interpretação */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-lg font-medium mb-2">Interpretação</h4>
          <div className="text-lg font-medium text-yellow-400 mb-2">
            {resumo.interpretacao}
          </div>
          <div className="text-sm text-gray-300">
            {resumo.interpretacao === "Boa diversificação" && 
              "✅ As estratégias se complementam bem. Usar ambas reduz o risco."
            }
            {resumo.interpretacao === "Alta correlação" && 
              "⚠️ As estratégias são muito similares. Pouco benefício em diversificação."
            }
            {resumo.interpretacao === "Correlação moderada" && 
              "📊 Há algum benefício de diversificação, mas não é muito alto."
            }
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Analisados {resumo.total_dias_analisados} dias com operações simultâneas.
          </div>
        </div>

        {/* Detalhes por dia */}
        <div>
          <h4 className="text-lg font-medium mb-4">Últimos Dias Analisados</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-3 py-2 text-left">Data</th>
                  {Object.keys(detalhes[0]?.estrategias || {}).map(nome => (
                    <th key={nome} className="px-3 py-2 text-center">{nome}</th>
                  ))}
                  <th className="px-3 py-2 text-center">Correlação</th>
                </tr>
              </thead>
              <tbody>
                {detalhes.slice(0, 10).map((dia, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="px-3 py-2">{formatDate(dia.data)}</td>
                    
                    {Object.entries(dia.estrategias).map(([nome, dados]) => (
                      <td key={nome} className="px-3 py-2 text-center">
                        <div className="space-y-1">
                          <div className={`text-xs font-medium ${
                            dados.status === 'ganhou' ? 'text-green-400' : 
                            dados.status === 'perdeu' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {formatCurrency(dados.resultado_dia)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {dados.num_operacoes} ops
                          </div>
                        </div>
                      </td>
                    ))}
                    
                    <td className="px-3 py-2 text-center">
                      {dia.analise.todas_ganharam && (
                        <span className="text-green-400 text-xs font-medium">Todas +</span>
                      )}
                      {dia.analise.todas_perderam && (
                        <span className="text-red-400 text-xs font-medium">Todas -</span>
                      )}
                      {dia.analise.resultados_mistos && (
                        <span className="text-blue-400 text-xs font-medium">Diversif.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDirecaoTab = () => {
    if (!correlationData?.correlacao_data_direcao) return null;

    const { resumo, detalhes } = correlationData.correlacao_data_direcao;

    return (
      <div className="space-y-6">
        {/* Resumo da correlação por direção */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-3">Operações Simultâneas</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-medium">{resumo.total_operacoes_simultaneas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">Todas ganharam:</span>
                <span className="text-green-400 font-medium">{resumo.todas_ganharam_simultaneo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Todas perderam:</span>
                <span className="text-red-400 font-medium">{resumo.todas_perderam_simultaneo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400">Resultados mistos:</span>
                <span className="text-blue-400 font-medium">{resumo.resultados_mistos}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-3">Percentuais</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-400">Correlação positiva:</span>
                <span className="text-green-400 font-medium">{resumo.pct_correlacao_positiva}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Correlação negativa:</span>
                <span className="text-red-400 font-medium">{resumo.pct_correlacao_negativa}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400">Diversificação:</span>
                <span className="text-blue-400 font-medium">{resumo.pct_diversificacao}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes das operações por data/direção */}
        <div>
          <h4 className="text-lg font-medium mb-4">Operações por Data e Direção</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-center">Direção</th>
                  {Object.keys(detalhes[0]?.estrategias || {}).map(nome => (
                    <th key={nome} className="px-3 py-2 text-center">{nome}</th>
                  ))}
                  <th className="px-3 py-2 text-center">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {detalhes.slice(0, 15).map((op, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="px-3 py-2">{formatDate(op.data)}</td>
                    
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center">
                        {op.direcao === 'COMPRA' ? (
                          <ArrowUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className="ml-1 text-xs">{op.direcao}</span>
                      </div>
                    </td>
                    
                    {Object.entries(op.estrategias).map(([nome, dados]) => (
                      <td key={nome} className="px-3 py-2 text-center">
                        {dados.operou ? (
                          <div className="space-y-1">
                            <div className={`text-xs font-medium ${
                              dados.status === 'ganhou' ? 'text-green-400' : 
                              dados.status === 'perdeu' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {formatCurrency(dados.resultado)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {dados.num_operacoes} ops
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">Não operou</span>
                        )}
                      </td>
                    ))}
                    
                    <td className="px-3 py-2 text-center">
                      {op.analise.multiplas_estrategias ? (
                        <>
                          {op.analise.todas_ganharam && (
                            <span className="text-green-400 text-xs font-medium">Todas +</span>
                          )}
                          {op.analise.todas_perderam && (
                            <span className="text-red-400 text-xs font-medium">Todas -</span>
                          )}
                          {op.analise.resultados_mistos && (
                            <span className="text-yellow-400 text-xs font-medium">Mistos</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs">1 estratégia</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-blue-400 mr-2" />
          <h2 className="text-lg font-medium">
            Correlação: Data + Direção + Resultado
            {correlationData && (
              <span className="ml-2 text-sm text-green-400">✓ Disponível</span>
            )}
          </h2>
        </div>
        <button 
          onClick={() => setShowCorrelation(!showCorrelation)}
          className="p-1.5 hover:bg-gray-700 rounded-md"
        >
          {showCorrelation ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      
      {showCorrelation && (
        <div className="p-4">
          {correlationData ? (
            <div>
              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('resultado')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'resultado'
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Por Resultado
                </button>
                
                <button
                  onClick={() => setActiveTab('direcao')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'direcao'
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Por Direção
                </button>
              </div>

              {/* Conteúdo das tabs */}
              {activeTab === 'resultado' && renderResultadoTab()}
              {activeTab === 'direcao' && renderDirecaoTab()}
            </div>
          ) : (
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <Info className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">Análise de Correlação por Data e Direção</h3>
              <p className="text-gray-400 mb-4">
                Faça upload de 2 ou mais arquivos CSV para análise detalhada
              </p>
              
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>O que será analisado:</strong></p>
                <ul className="text-left inline-block space-y-1">
                  <li>📅 <strong>Mesma data + direção:</strong> Operações simultâneas de compra/venda</li>
                  <li>📊 <strong>Correlação de resultado:</strong> Quando uma perde, a outra também perde?</li>
                  <li>🎯 <strong>Benefício de diversificação:</strong> Quanto as estratégias se complementam</li>
                  <li>📈 <strong>Padrões temporais:</strong> Dias com ganhos/perdas simultâneos</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
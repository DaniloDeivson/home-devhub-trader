import React, { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronUp,
  ChevronDown,
  Info,
  RotateCcw
} from 'lucide-react';

interface SimpleCorrelationProps {
  showCorrelation: boolean;
  setShowCorrelation: (show: boolean) => void;
  backtestResult: any;
  onResetCorrelation?: () => void;
}

export function SimpleCorrelationComponent({
  showCorrelation,
  setShowCorrelation,
  backtestResult,
  onResetCorrelation
}: SimpleCorrelationProps) {
  const [activeTab, setActiveTab] = useState('resultado');

  // Dados de correlação (vindos da API)
  const correlationData = backtestResult?.dateDirectionCorrelation;
  const correlationMatricial = backtestResult?.correlationMatricial;
  
  // Verificar se é análise matricial (3+ arquivos)
  const isMatricial = correlationMatricial?.info_arquivos?.tipo_analise === 'matricial';

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
    
    // Verificar diferentes estruturas possíveis dos dados
    let quandoUmaPerdeOutraTambemPerde = 0;
    let quandoUmaGanhaOutraTambemGanha = 0;
    let diasComDiversificacao = 0;

    // Tentar diferentes caminhos para os dados
    if (resumo?.resposta_pergunta) {
      quandoUmaPerdeOutraTambemPerde = resumo.resposta_pergunta.quando_uma_perde_outra_tambem_perde_pct || 0;
      quandoUmaGanhaOutraTambemGanha = resumo.resposta_pergunta.quando_uma_ganha_outra_tambem_ganha_pct || 0;
      diasComDiversificacao = resumo.resposta_pergunta.dias_com_diversificacao_pct || 0;
    } else if (resumo?.dias_todas_perderam && resumo?.dias_todas_ganharam && resumo?.dias_resultados_mistos) {
      // Estrutura alternativa
      const totalDias = resumo.total_dias_analisados || 1;
      quandoUmaPerdeOutraTambemPerde = (resumo.dias_todas_perderam / totalDias) * 100;
      quandoUmaGanhaOutraTambemGanha = (resumo.dias_todas_ganharam / totalDias) * 100;
      diasComDiversificacao = (resumo.dias_resultados_mistos / totalDias) * 100;
    } else if (resumo?.pct_correlacao_negativa !== undefined) {
      // Usar dados de direção como fallback
      quandoUmaPerdeOutraTambemPerde = resumo.pct_correlacao_negativa || 0;
      quandoUmaGanhaOutraTambemGanha = resumo.pct_correlacao_positiva || 0;
      diasComDiversificacao = resumo.pct_diversificacao || 0;
    }

    // VERIFICAÇÃO DE CONSISTÊNCIA: Se os dados de resultado parecem inconsistentes,
    // usar os dados de direção que sabemos que estão corretos
    const dadosDirecao = correlationData?.correlacao_data_direcao?.resumo;
    if (dadosDirecao && (quandoUmaPerdeOutraTambemPerde === 0 && quandoUmaGanhaOutraTambemGanha === 0 && diasComDiversificacao === 100)) {
      // Usar dados de direção como base, mas adaptar para o contexto de resultado
      quandoUmaPerdeOutraTambemPerde = dadosDirecao.pct_correlacao_negativa || 0;
      quandoUmaGanhaOutraTambemGanha = dadosDirecao.pct_correlacao_positiva || 0;
      diasComDiversificacao = dadosDirecao.pct_diversificacao || 0;
    }
    
    // Calcular dias sem operações simultâneas (complemento para 100%)
    const diasSemOperacoesSimultaneas = Math.max(0, 100 - quandoUmaPerdeOutraTambemPerde - quandoUmaGanhaOutraTambemGanha - diasComDiversificacao);
    
    // Calcular total e verificar se é praticamente 100%
    const totalPercentage = quandoUmaPerdeOutraTambemPerde + quandoUmaGanhaOutraTambemGanha + diasComDiversificacao + diasSemOperacoesSimultaneas;
    const isEffectively100 = Math.abs(totalPercentage - 100) < 0.01; // Tolerância de 0.01%
    const displayTotal = isEffectively100 ? 100 : totalPercentage;
    const barWidth = isEffectively100 ? 100 : Math.min(100, totalPercentage);

    return (
      <div className="space-y-6">
        {/* Resumo da correlação por resultado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-red-500 text-4xl mb-2">
              <i className="fas fa-chart-line fa-rotate-180"></i>
            </span>
            <p className="text-red-400 text-2xl font-bold">{quandoUmaPerdeOutraTambemPerde.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Quando uma perde, a outra também perde</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-green-500 text-4xl mb-2">
              <i className="fas fa-chart-line"></i>
            </span>
            <p className="text-green-400 text-2xl font-bold">{quandoUmaGanhaOutraTambemGanha.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Quando uma ganha, a outra também ganha</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-blue-500 text-4xl mb-2">
              <i className="fas fa-arrow-up"></i>
            </span>
            <p className="text-blue-400 text-2xl font-bold">{diasComDiversificacao.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Dias com diversificação (resultados opostos)</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-gray-400 text-4xl mb-2">
              <i className="fas fa-info-circle"></i>
            </span>
            <p className="text-gray-300 text-2xl font-bold">{diasSemOperacoesSimultaneas.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Dias sem operações simultâneas</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-6">
          <p className="text-gray-300 text-sm mb-2 flex justify-between items-center">
            <span>Distribuição Total: {displayTotal.toFixed(isEffectively100 ? 0 : 1)}%</span>
            {isEffectively100 && (
              <span className="text-green-500 flex items-center">
                <i className="fas fa-check-circle mr-1"></i> 100%
              </span>
            )}
          </p>
          <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${barWidth}%`,
                background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)'
              }}
            ></div>
          </div>
        </div>

        {/* Interpretação */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-lg font-medium mb-2">Interpretação</h4>
          <div className="text-lg font-medium text-yellow-400 mb-2">
            {resumo.interpretacao || "Análise em andamento..."}
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
            {!resumo.interpretacao && 
              "📊 Analisando correlação entre as estratégias..."
            }
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Analisados {resumo.total_dias_analisados || 0} dias com operações simultâneas.
          </div>
        </div>

        {/* Detalhes por dia */}
        {detalhes && detalhes.length > 0 && (
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
        )}
      </div>
    );
  };

  const renderDirecaoTab = () => {
    if (!correlationData?.correlacao_data_direcao) return null;

    const { resumo, detalhes } = correlationData.correlacao_data_direcao;

    const pctCorrelacaoPositiva = resumo.pct_correlacao_positiva || 0;
    const pctCorrelacaoNegativa = resumo.pct_correlacao_negativa || 0;
    const pctDiversificacao = resumo.pct_diversificacao || 0;

    const pctSemCorrelacao = Math.max(0, 100 - pctCorrelacaoPositiva - pctCorrelacaoNegativa - pctDiversificacao);

    // Calcular total e verificar se é praticamente 100%
    const totalPercentage = pctCorrelacaoPositiva + pctCorrelacaoNegativa + pctDiversificacao + pctSemCorrelacao;
    const isEffectively100 = Math.abs(totalPercentage - 100) < 0.01; // Tolerância de 0.01%
    const displayTotal = isEffectively100 ? 100 : totalPercentage;
    const barWidth = isEffectively100 ? 100 : Math.min(100, totalPercentage);

    return (
      <div className="space-y-6">
        {/* Resumo da correlação por direção */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-green-500 text-4xl mb-2">
              <i className="fas fa-arrow-up"></i>
            </span>
            <p className="text-green-400 text-2xl font-bold">{pctCorrelacaoPositiva.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Correlação Positiva</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-red-500 text-4xl mb-2">
              <i className="fas fa-arrow-down"></i>
            </span>
            <p className="text-red-400 text-2xl font-bold">{pctCorrelacaoNegativa.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Correlação Negativa</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-blue-500 text-4xl mb-2">
              <i className="fas fa-random"></i>
            </span>
            <p className="text-blue-400 text-2xl font-bold">{pctDiversificacao.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Diversificação</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-gray-400 text-4xl mb-2">
              <i className="fas fa-minus-circle"></i>
            </span>
            <p className="text-gray-300 text-2xl font-bold">{pctSemCorrelacao.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Sem Correlação</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-6">
          <p className="text-gray-300 text-sm mb-2 flex justify-between items-center">
            <span>Distribuição Total: {displayTotal.toFixed(isEffectively100 ? 0 : 1)}%</span>
            {isEffectively100 && (
              <span className="text-green-500 flex items-center">
                <i className="fas fa-check-circle mr-1"></i> 100%
              </span>
            )}
          </p>
          <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${barWidth}%`,
                background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)'
              }}
            ></div>
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

  const renderMatricialTab = () => {
    if (!correlationMatricial?.correlacao_matricial?.resumo) return null;

    const { resumo, detalhes } = correlationMatricial.correlacao_matricial;

    const pctAltaCorrelacao = resumo.pct_alta_correlacao || 0;
    const pctBoaDiversificacao = resumo.pct_boa_diversificacao || 0;
    const pctCorrelacaoModerada = resumo.pct_correlacao_moderada || 0;

    // Calcular pares sem análise (complemento para 100%)
    const pctSemAnalise = Math.max(0, 100 - pctAltaCorrelacao - pctBoaDiversificacao - pctCorrelacaoModerada);

    // Calcular total e verificar se é praticamente 100%
    const totalPercentage = pctAltaCorrelacao + pctBoaDiversificacao + pctCorrelacaoModerada + pctSemAnalise;
    const isEffectively100 = Math.abs(totalPercentage - 100) < 0.01; // Tolerância de 0.01%
    const displayTotal = isEffectively100 ? 100 : totalPercentage;
    const barWidth = isEffectively100 ? 100 : Math.min(100, totalPercentage);

    return (
      <div className="space-y-6">
        {/* Cards principais - ANÁLISE MATRICIAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-red-500 text-4xl mb-2">
              <i className="fas fa-exclamation-triangle"></i>
            </span>
            <p className="text-red-400 text-2xl font-bold">{pctAltaCorrelacao.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Alta Correlação</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-green-500 text-4xl mb-2">
              <i className="fas fa-check-circle"></i>
            </span>
            <p className="text-green-400 text-2xl font-bold">{pctBoaDiversificacao.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Boa Diversificação</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-yellow-500 text-4xl mb-2">
              <i className="fas fa-arrows-alt-h"></i>
            </span>
            <p className="text-yellow-400 text-2xl font-bold">{pctCorrelacaoModerada.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Correlação Moderada</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-gray-400 text-4xl mb-2">
              <i className="fas fa-question-circle"></i>
            </span>
            <p className="text-gray-300 text-2xl font-bold">{pctSemAnalise.toFixed(1)}%</p>
            <p className="text-gray-300 text-sm">Sem Análise</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-blue-500 text-4xl mb-2">
              <i className="fas fa-file-alt"></i>
            </span>
            <p className="text-blue-400 text-2xl font-bold">{correlationMatricial.info_arquivos?.total_arquivos || 0}</p>
            <p className="text-gray-300 text-sm">Total de Arquivos</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-6">
          <p className="text-gray-300 text-sm mb-2 flex justify-between items-center">
            <span>Distribuição Total: {displayTotal.toFixed(isEffectively100 ? 0 : 1)}%</span>
            {isEffectively100 && (
              <span className="text-green-500 flex items-center">
                <i className="fas fa-check-circle mr-1"></i> 100%
              </span>
            )}
          </p>
          <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${barWidth}%`,
                background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)'
              }}
            ></div>
          </div>
        </div>

        {/* Recomendação */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-lg font-medium mb-2">Recomendação do Portfólio</h4>
          <div className="text-lg font-medium text-yellow-400 mb-2">
            {resumo.recomendacao}
          </div>
          <div className="text-sm text-gray-300">
            {resumo.recomendacao === "Portfólio bem diversificado" && 
              "✅ As estratégias se complementam bem. Usar todas reduz o risco significativamente."
            }
            {resumo.recomendacao === "Portfólio com alta correlação" && 
              "⚠️ As estratégias se movem juntas. Considere reduzir o número de estratégias."
            }
            {resumo.recomendacao === "Portfólio com correlação moderada" && 
              "🔄 Correlação equilibrada. Monitore o desempenho regularmente."
            }
          </div>
        </div>

        {/* Detalhes dos pares */}
        <div className="bg-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-600">
            <h4 className="text-lg font-medium">Análise Detalhada por Par</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Par de Estratégias</th>
                  <th className="px-4 py-3 text-center">Tipo de Correlação</th>
                  <th className="px-4 py-3 text-center">Operações Simultâneas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {detalhes?.slice(0, 10).map((par, index) => (
                  <tr key={index} className="hover:bg-gray-600">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {par.par[0]} ↔ {par.par[1]}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {par.correlacao_resultado?.resumo?.interpretacao || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {par.correlacao_direcao?.resumo?.total_operacoes_simultaneas || 0}
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
        <div className="flex items-center space-x-2">
          {onResetCorrelation && (
            <button
              onClick={onResetCorrelation}
              className="p-1.5 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white"
              title="Resetar para dados originais"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
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
      </div>
      
      {showCorrelation && (
        <div className="p-4">
          {correlationData ? (
            <div>
              {/* Verificar se há erro na correlação */}
              {correlationData.correlacao_data_direcao?.resumo?.erro ? (
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <Info className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-2">Correlação Indisponível</h3>
                  <p className="text-gray-400 mb-4">
                    {correlationData.correlacao_data_direcao.resumo.erro}
                  </p>
                  <div className="text-sm text-gray-300">
                    <p>Para análise de correlação, faça upload de 2 ou mais arquivos CSV.</p>
                  </div>
                </div>
              ) : (
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
                    
                    {isMatricial && (
                      <button
                        onClick={() => setActiveTab('matricial')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeTab === 'matricial'
                            ? 'bg-gray-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-600'
                        }`}
                      >
                        <Info className="w-4 h-4 mr-2" />
                        Matricial
                      </button>
                    )}
                  </div>

                  {/* Conteúdo das tabs */}
                  {activeTab === 'resultado' && renderResultadoTab()}
                  {activeTab === 'direcao' && renderDirecaoTab()}
                  {activeTab === 'matricial' && isMatricial && renderMatricialTab()}
                </div>
              )}
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
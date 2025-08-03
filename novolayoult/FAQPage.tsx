import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Zap, Code2, BarChart2, Users, Crown, Shield, Gift } from 'lucide-react';

export function FAQPage() {
  const navigate = useNavigate();

  const faqCategories = [
    {
      title: 'Planos e Preços',
      icon: <Crown className="w-6 h-6 text-yellow-500" />,
      questions: [
        {
          question: 'Qual a diferença entre os planos Pro 1, Pro 2, Pro 3 e Pro 4?',
          answer: 'Pro 1 (R$ 259,80): Até 25 robôs, IA para gerar robôs, 20.000 tokens. Pro 2 (R$ 499,80): Até 100 robôs, 50.000 tokens, suporte dedicado. Pro 3 (R$ 999,80): Até 500 robôs, 100.000 tokens, todos os recursos premium.'
        },
        {
          question: 'O plano Free tem limitações?',
          answer: 'Sim, o plano Free inclui até 3 robôs de trading, 3 robôs gratuitos pré-configurados, 1.000 tokens mensais, análise simples de backtest (sem IA avançada), e suporte via comunidade e grupo WhatsApp. Não inclui IA para gerar robôs.'
        },
        {
          question: 'Posso fazer upgrade ou downgrade a qualquer momento?',
          answer: 'Sim, você pode alterar seu plano a qualquer momento. Upgrades são aplicados imediatamente, downgrades entram em vigor no próximo ciclo de faturamento.'
        },
        {
          question: 'Como funciona o período de teste?',
          answer: 'Oferecemos 7 dias gratuitos para testar qualquer plano Pro. Durante este período, você tem acesso completo a todos os recursos do plano escolhido.'
        }
      ]
    },
    {
      title: 'Tokens e Desafios',
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      questions: [
        {
          question: 'Como ganhar tokens gratuitos?',
          answer: 'Complete desafios diários e semanais: criar primeiro robô (+500 tokens), fazer primeira análise (+200 tokens), compartilhar estratégia (+100 tokens), participar de competições (até 1000 tokens), contribuir com tutoriais (+300 tokens).'
        },
        {
          question: 'Quais são os desafios disponíveis?',
          answer: 'Desafios Diários: Login diário (+10 tokens), análise de backtest (+50 tokens). Desafios Semanais: Criar robô (+500 tokens), otimizar estratégia (+300 tokens). Desafios Mensais: Competição de performance (+2000 tokens), tutorial da comunidade (+1000 tokens).'
        },
        {
          question: 'Os tokens expiram?',
          answer: 'Tokens mensais do plano são renovados a cada ciclo. Tokens ganhos em desafios e comprados separadamente nunca expiram. Tokens não utilizados do plano mensal não são acumulados.'
        },
        {
          question: 'Quanto custam os tokens extras?',
          answer: 'Pacotes disponíveis: 2.500 tokens (R$ 70,00), 7.500 tokens (R$ 150,00), 25.000 tokens (R$ 300,00). Tokens extras nunca expiram e podem ser usados a qualquer momento.'
        }
      ]
    },
    {
      title: 'IA e Geração de Robôs',
      icon: <Code2 className="w-6 h-6 text-blue-500" />,
      questions: [
        {
          question: 'Como funciona a IA para gerar robôs?',
          answer: 'Disponível a partir do Pro 1. Você descreve sua estratégia em linguagem natural ("Crie um robô que compra quando RSI < 30") e a IA gera automaticamente o código em NTSL, MQL5 ou outras linguagens. O processo leva 30-60 segundos.'
        },
        {
          question: 'Posso modificar o código gerado pela IA?',
          answer: 'Sim! O código gerado é totalmente editável. Você pode modificar parâmetros, adicionar filtros, ajustar lógica de entrada/saída. A IA também pode fazer modificações baseadas em suas solicitações.'
        },
        {
          question: 'Quais plataformas são suportadas?',
          answer: 'Geramos código para: Profit (NTSL), MetaTrader 4/5 (MQL4/MQL5), TradingView (Pine Script), Python (para backtesting), e outras plataformas populares. O código é exportável em formato compatível.'
        },
        {
          question: 'A IA pode criar estratégias complexas?',
          answer: 'Sim! A IA pode criar desde estratégias simples (cruzamento de médias) até complexas (arbitragem, grid trading, machine learning). Quanto mais detalhada sua descrição, melhor o resultado.'
        }
      ]
    },
    {
      title: 'Análise de Backtest',
      icon: <BarChart2 className="w-6 h-6 text-green-500" />,
      questions: [
        {
          question: 'Qual a diferença entre análise simples e completa?',
          answer: 'Análise Simples (Free): Métricas básicas como Profit Factor, Win Rate, Drawdown. Análise Completa (Pro): Insights de IA, sugestões de otimização, análise de correlação, identificação de padrões, recomendações personalizadas.'
        },
        {
          question: 'Que formato de arquivo posso usar?',
          answer: 'Aceitamos arquivos CSV com colunas: Data, Hora, Ativo, Direção (Compra/Venda), Preço Entrada, Preço Saída, Resultado, Volume (opcional). Máximo 10MB por arquivo.'
        },
        {
          question: 'Quanto tempo demora a análise?',
          answer: 'Análise simples: 10-30 segundos. Análise completa com IA: 1-3 minutos. Análises mais complexas (>1000 trades) podem levar até 5 minutos.'
        },
        {
          question: 'Posso analisar múltiplas estratégias?',
          answer: 'Sim! Você pode fazer upload de múltiplos CSVs e comparar estratégias lado a lado. A IA pode sugerir combinações ótimas para diversificação de portfólio.'
        }
      ]
    },
    {
      title: 'Montagem de Portfólios',
      icon: <Shield className="w-6 h-6 text-purple-500" />,
      questions: [
        {
          question: 'Como funciona a montagem automática de portfólios?',
          answer: 'A IA analisa suas estratégias e cria portfólios diversificados baseados em correlação, risco, retorno e drawdown. Sugere alocação de capital e rebalanceamento automático.'
        },
        {
          question: 'Posso personalizar os portfólios sugeridos?',
          answer: 'Sim! Você pode ajustar pesos, adicionar/remover estratégias, definir limites de risco e configurar regras de rebalanceamento. A IA aprende suas preferências ao longo do tempo.'
        },
        {
          question: 'Com quantas estratégias posso montar um portfólio?',
          answer: 'Recomendamos 3-8 estratégias para diversificação ótima. A IA pode trabalhar com 2-20 estratégias, mas mais de 10 pode gerar complexidade desnecessária.'
        },
        {
          question: 'O portfólio é rebalanceado automaticamente?',
          answer: 'Sim, você pode configurar rebalanceamento automático: diário, semanal, mensal ou baseado em performance. A IA monitora correlações e ajusta alocações conforme necessário.'
        }
      ]
    },
    {
      title: 'Suporte e Comunidade',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      questions: [
        {
          question: 'Como funciona o suporte em cada plano?',
          answer: 'Free e Pro 1: Suporte via comunidade e grupo WhatsApp. Pro 2 e Pro 3: Suporte dedicado com resposta prioritária. Todos os planos têm acesso ao grupo WhatsApp da comunidade.'
        },
        {
          question: 'Posso compartilhar meus robôs?',
          answer: 'Sim! Você pode compartilhar robôs com outros usuários, definir permissões (visualizar/editar), criar links públicos e participar da comunidade. Compartilhamentos geram tokens extras.'
        },
        {
          question: 'Existe marketplace de estratégias?',
          answer: 'Sim! Usuários podem vender/comprar estratégias verificadas. Vendedores ganham 70% do valor, plataforma fica com 30%. Todas as estratégias passam por verificação de performance.'
        },
        {
          question: 'Como reportar bugs ou sugerir melhorias?',
          answer: 'Use o sistema de feedback integrado na plataforma, envie email para suporte@devhubtrader.com.br ou reporte via comunidade. Bugs confirmados geram tokens de recompensa.'
        }
      ]
    },
    {
      title: 'Segurança e Dados',
      icon: <Shield className="w-6 h-6 text-red-500" />,
      questions: [
        {
          question: 'Meus dados estão seguros?',
          answer: 'Sim! Usamos criptografia AES-256, servidores seguros, backup automático e conformidade com LGPD. Seus códigos e estratégias são privados por padrão.'
        },
        {
          question: 'Vocês têm acesso aos meus robôs?',
          answer: 'Não! Seus robôs são privados por padrão. Só temos acesso se você compartilhar publicamente ou solicitar suporte específico. Nunca compartilhamos dados sem permissão.'
        },
        {
          question: 'Posso exportar meus dados?',
          answer: 'Sim! Você pode exportar todos os seus robôs, análises e dados a qualquer momento em formato JSON, CSV ou código fonte. Não há lock-in na plataforma.'
        },
        {
          question: 'O que acontece se eu cancelar?',
          answer: 'Seus dados permanecem disponíveis por 90 dias após cancelamento. Você pode exportar tudo neste período. Após 90 dias, dados são removidos permanentemente (conforme LGPD).'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <Code2 className="w-8 h-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-white">DevHub Trader</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/faq')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                FAQ
              </button>
              <button 
                onClick={() => navigate('/plans')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Planos
              </button>
              <button 
                onClick={() => navigate('/?login=true')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Entrar
              </button>
              <button 
                onClick={() => navigate('/?signup=true')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/plans')}
              className="mr-4 p-2 hover:bg-blue-800 rounded-full transition-colors"
              title="Voltar para planos"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-4">
                Perguntas Frequentes
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl">
                Encontre respostas para as dúvidas mais comuns sobre a plataforma DevHub Trader
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-900 px-6 py-4 flex items-center">
                  {category.icon}
                  <h2 className="ml-3 text-2xl font-bold">{category.title}</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {category.questions.map((faq, faqIndex) => (
                    <div key={faqIndex} className="border-b border-gray-700 last:border-b-0 pb-6 last:pb-0">
                      <h3 className="text-lg font-semibold mb-3 flex items-start">
                        <HelpCircle className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        {faq.question}
                      </h3>
                      <p className="text-gray-300 leading-relaxed ml-7">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Não encontrou sua resposta?</h2>
            <p className="text-blue-100 mb-6">
              Nossa equipe está pronta para ajudar você com qualquer dúvida
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  const message = "Olá! Tenho uma dúvida sobre a plataforma DevHub Trader que não encontrei no FAQ.";
                  const encodedMessage = encodeURIComponent(message);
                  window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
              >
                Falar no WhatsApp
              </button>
              <button
                onClick={() => window.open('mailto:suporte@devhubtrader.com.br', '_blank')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Enviar Email
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-medium"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
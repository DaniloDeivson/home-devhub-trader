import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, Zap, Check, ArrowRight, Shield, Users, 
  Code2, BarChart2, Sparkles, MessageSquare
} from 'lucide-react';

export function PublicPlansPage() {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free-forever',
      name: 'Free Forever',
      price: 'R$ 0,00',
      description: 'Ideal para iniciantes explorarem a plataforma com recursos básicos',
      features: [
        'Até 3 robôs de trading',
        '3 robôs gratuitos para primeiros passos',
        '1.000 tokens mensais',
        'CSVs para análise básica',
        'Análise simples (limitada)',
        'Acesso à comunidade',
        'Documentação básica',
        'Suporte por comunidade',
        'Grupo WhatsApp'
      ],
      popular: false,
      cta: 'Começar Grátis'
    },
    {
      id: 'pro1',
      name: 'Pro 1',
      price: 'R$ 259,80/mês',
      description: 'Para traders que querem gerar robôs com IA',
      features: [
        'Até 25 robôs de trading',
        'IA para gerar robôs de trading',
        '20.000 tokens mensais',
        'Análise de backtest completa',
        'Montagem de portfólios automática',
        'Acesso à comunidade',
        'Suporte por comunidade',
        'Grupo WhatsApp'
      ],
      popular: true,
      cta: 'Escolher Plano'
    },
    {
      id: 'pro2',
      name: 'Pro 2',
      price: 'R$ 499,80/mês',
      description: 'Para traders sérios com recursos avançados',
      features: [
        'Até 100 robôs de trading',
        'IA para gerar robôs de trading',
        '50.000 tokens mensais',
        'Análise de backtest avançada',
        'Montagem de portfólios automática',
        'Suporte dedicado',
        'Grupo WhatsApp'
      ],
      popular: false,
      recommended: true,
      cta: 'Escolher Plano'
    },
    {
      id: 'pro3',
      name: 'Pro 3',
      price: 'R$ 999,80/mês',
      description: 'Para traders profissionais com recursos premium',
      features: [
        'Até 500 robôs de trading',
        'IA para gerar robôs de trading',
        '100.000 tokens mensais',
        'Análise de backtest avançada',
        'Montagem de portfólios automática',
        'Suporte dedicado',
        'Acesso a todos os recursos',
        'Grupo WhatsApp'
      ],
      popular: false,
      cta: 'Escolher Plano'
    }
  ];

  const tokenPackages = [
    {
      tokens: '2.500',
      price: 'R$ 70,00',
      popular: false
    },
    {
      tokens: '7.500',
      price: 'R$ 150,00',
      popular: true
    },
    {
      tokens: '25.000',
      price: 'R$ 300,00',
      popular: false
    }
  ];

  const handleSignUp = () => {
    navigate('/?signup=true');
  };

  const handleContactSupport = () => {
    const message = "Olá vim do DevHub Trader e quero mais informações sobre os planos";
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
  };

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
                onClick={() => navigate('/?login=true')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Entrar
              </button>
              <button 
                onClick={() => navigate('/?signup=true')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                Cadastrar <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Planos para Todos os Perfis de Trader
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Escolha o plano ideal para suas necessidades de trading automatizado e comece a criar robôs com assistência de IA hoje mesmo.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleSignUp}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium text-lg"
            >
              Começar Gratuitamente
            </button>
            <button
              onClick={handleContactSupport}
              className="px-6 py-3 bg-white text-blue-900 hover:bg-gray-100 rounded-md font-medium text-lg"
            >
              Falar com Especialista
            </button>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nossos Planos</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Escolha o plano que melhor se adapta às suas necessidades de trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`bg-gray-800 rounded-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-blue-500 transform scale-105 z-10' : 
                  plan.recommended ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="bg-blue-600 text-center py-2">
                    <p className="text-sm font-medium">Mais Vendido</p>
                  </div>
                )}
                {plan.recommended && (
                  <div className="bg-green-600 text-center py-2">
                    <p className="text-sm font-medium">Recomendado</p>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.id === 'pro2' && <Crown className="w-5 h-5 text-yellow-500" />}
                    {plan.id === 'pro3' && <Shield className="w-5 h-5 text-purple-500" />}
                    {plan.id === 'free-forever' && <Users className="w-5 h-5 text-green-500" />}
                    {plan.id === 'pro1' && <Zap className="w-5 h-5 text-blue-500" />}
                  </div>
                  <p className="text-2xl font-bold mb-2">{plan.price}</p>
                  <p className="text-gray-400 mb-6 text-sm">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={plan.id === 'free-forever' ? handleSignUp : handleContactSupport}
                    className={`w-full py-2 rounded-md ${
                      plan.popular || plan.recommended
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Token Packages */}
      <div className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Pacotes de Tokens</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Recarregue seus tokens para continuar utilizando os recursos de IA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {tokenPackages.map((pkg, index) => (
              <div 
                key={index}
                className={`bg-gray-800 rounded-lg overflow-hidden ${
                  pkg.popular ? 'ring-2 ring-yellow-500' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="bg-yellow-600 text-center py-2">
                    <p className="text-sm font-medium">Melhor Custo-Benefício</p>
                  </div>
                )}
                <div className="p-6 text-center">
                  <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{pkg.tokens}</h3>
                  <p className="text-gray-400 mb-2">tokens</p>
                  <p className="text-xl font-bold mb-6">{pkg.price}</p>
                  
                  <button
                    onClick={handleContactSupport}
                    className={`w-full py-2 rounded-md ${
                      pkg.popular
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    Comprar Tokens
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">O Que Você Pode Fazer</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Conheça os recursos disponíveis em nossa plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 rounded-full p-3 mr-4">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">IA para Gerar Robôs</h3>
              </div>
              <p className="text-gray-300">
                Crie robôs de trading automaticamente com IA. Descreva sua estratégia e receba código pronto para usar. (Disponível a partir do Pro 1)
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-600 rounded-full p-3 mr-4">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Análise de Backtest</h3>
              </div>
              <p className="text-gray-300">
                Analise seus resultados de backtest com IA. Versão Free tem análise simples, planos Pro têm análise completa com insights avançados.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-600 rounded-full p-3 mr-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Montagem de Portfólios</h3>
              </div>
              <p className="text-gray-300">
                IA automática para montar portfólios diversificados com suas estratégias, otimizando risco e retorno. (Planos Pro)
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-600 rounded-full p-3 mr-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Colaboração em Tempo Real</h3>
              </div>
              <p className="text-gray-300">
                Colabore com sua equipe em tempo real no desenvolvimento de robôs, com controle de versão integrado.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-600 rounded-full p-3 mr-4">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Suporte Especializado</h3>
              </div>
              <p className="text-gray-300">
                Receba suporte de especialistas em trading e desenvolvimento para tirar suas dúvidas e resolver problemas.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-600 rounded-full p-3 mr-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Ganhe Tokens</h3>
              </div>
              <p className="text-gray-300">
                Complete desafios da plataforma e ganhe tokens gratuitos. Participe de competições, compartilhe estratégias e contribua com a comunidade.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-600 rounded-full p-3 mr-4">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Recursos Premium</h3>
              </div>
              <p className="text-gray-300">
                Acesse recursos exclusivos como indicadores personalizados, análise de mercado e estratégias avançadas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Challenges Section */}
      <div className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ganhe Tokens com Desafios</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Complete desafios diários e semanais para ganhar tokens gratuitos e acelerar seu aprendizado
          </p>
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-lg font-medium mb-2">🏆 Desafio da Semana</p>
            <p className="text-yellow-100">Crie seu primeiro robô e ganhe 500 tokens extras!</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
            <p className="text-xl text-gray-400">
              Tire suas dúvidas sobre nossos planos e serviços
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">O que são tokens e como funcionam?</h3>
              <p className="text-gray-300">
                Tokens são a moeda utilizada para acessar recursos de IA na plataforma. Cada interação com a IA (criação de robô, análise de backtest, montagem de portfólios) consome tokens. Você pode ganhar tokens completando desafios ou comprando pacotes adicionais.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">Posso mudar de plano a qualquer momento?</h3>
              <p className="text-gray-300">
                Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Ao fazer upgrade, você terá acesso imediato aos novos recursos e tokens. Ao fazer downgrade, as mudanças serão aplicadas no próximo ciclo de faturamento.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">Qual a diferença entre análise simples e completa?</h3>
              <p className="text-gray-300">
                A análise simples (Free) fornece métricas básicas como Profit Factor e Win Rate. A análise completa (Pro) inclui insights avançados de IA, sugestões de otimização, análise de correlação e recomendações personalizadas para melhorar sua estratégia.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">Como funciona a IA para gerar robôs?</h3>
              <p className="text-gray-300">
                A IA para gerar robôs está disponível a partir do plano Pro 1. Você descreve sua estratégia em linguagem natural e a IA gera automaticamente o código do robô em NTSL, MQL5 ou outras linguagens. O código pode ser exportado diretamente para sua plataforma de trading.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">Como ganhar tokens gratuitos?</h3>
              <p className="text-gray-300">
                Você pode ganhar tokens completando desafios da plataforma, como criar seu primeiro robô, fazer análises de backtest, compartilhar estratégias com a comunidade, participar de competições e contribuir com tutoriais. Novos desafios são adicionados semanalmente.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">O que são os robôs gratuitos do plano Free?</h3>
              <p className="text-gray-300">
                O plano Free inclui 3 robôs pré-configurados para você começar: um robô de scalping, um de trend following e um de grid trading. Estes robôs são otimizados e prontos para usar, perfeitos para aprender os conceitos básicos de trading automatizado.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">Os tokens expiram?</h3>
              <p className="text-gray-300">
                Tokens incluídos em sua assinatura mensal são renovados a cada ciclo de faturamento. Tokens não utilizados não são acumulados para o próximo mês. Tokens ganhos em desafios e comprados separadamente não expiram.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">Posso cancelar minha assinatura?</h3>
              <p className="text-gray-300">
                Sim, você pode cancelar sua assinatura a qualquer momento. Após o cancelamento, você manterá o acesso ao plano atual até o final do período de faturamento. Depois disso, sua conta será convertida para o plano gratuito, mantendo seus robôs existentes dentro do limite do plano gratuito.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">Como funciona o suporte?</h3>
              <p className="text-gray-300">
                O nível de suporte varia de acordo com seu plano. O plano Free oferece suporte via comunidade, Pro 1 e Pro 2 incluem suporte por email, Pro 3 oferece suporte prioritário, e Pro 4 inclui suporte dedicado com tempos de resposta mais rápidos.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-3">Posso usar os robôs em qualquer corretora?</h3>
              <p className="text-gray-300">
                Sim! Nossos robôs são compatíveis com as principais plataformas: Profit, MetaTrader 4/5, NTSL e outras. O código gerado pode ser exportado no formato adequado para sua plataforma de preferência.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-900 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para Transformar seu Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Junte-se a milhares de traders que já estão usando o DevHub Trader para criar, analisar e otimizar suas estratégias de trading.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleSignUp}
              className="px-8 py-4 bg-white text-blue-900 rounded-md font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Comece Agora
            </button>
            <button
              onClick={() => navigate('/faq')}
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-bold text-lg transition-colors"
            >
              Ver FAQ Completo
            </button>
            <button
              onClick={handleContactSupport}
              className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-bold text-lg transition-colors"
            >
              Falar com Especialista
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Code2 className="w-8 h-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-white">DevHub Trader</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white">Termos de Serviço</a>
              <a href="#" className="text-gray-400 hover:text-white">Política de Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-white">Contato</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} DevHub Trader. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code2, BarChart2, Download, Check, X, AlertTriangle, Star, DollarSign, Shield, Zap, Clock, Users, FileText, ExternalLink, ChevronDown, ChevronUp, Mail, Phone, Calendar, Apple as WhatsApp } from 'lucide-react';
import { Navbar } from '../components/Navbar';

interface Strategy {
  id: string;
  name: string;
  description: string;
  price: string;
  platform: string;
  market: string;
  timeframe: string;
  rating: number;
  reviews: number;
  image: string;
  featured?: boolean;
}

export function ProfitEstrategistaPage() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  const strategies: Strategy[] = [
    {
      id: '1',
      name: 'Trend Master Pro',
      description: 'Estratégia de seguimento de tendência com filtros avançados e gerenciamento de risco dinâmico.',
      price: 'R$ 997',
      platform: 'Profit',
      market: 'Mini Índice',
      timeframe: 'M5',
      rating: 4.8,
      reviews: 124,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&h=300&fit=crop',
      featured: true
    },
    {
      id: '2',
      name: 'Reversal Hunter',
      description: 'Estratégia de reversão à média com identificação precisa de pontos de entrada e saída.',
      price: 'R$ 897',
      platform: 'Profit',
      market: 'Mini Dólar',
      timeframe: 'M15',
      rating: 4.6,
      reviews: 98,
      image: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=500&h=300&fit=crop'
    },
    {
      id: '3',
      name: 'Scalper Elite',
      description: 'Estratégia de scalping de alta frequência para operações rápidas e precisas.',
      price: 'R$ 1.297',
      platform: 'Profit',
      market: 'Mini Índice/Dólar',
      timeframe: 'M1/M5',
      rating: 4.9,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1642790551116-18e150f248e5?w=500&h=300&fit=crop'
    },
    {
      id: '4',
      name: 'Breakout Master',
      description: 'Estratégia especializada em identificar e operar rompimentos de suportes e resistências.',
      price: 'R$ 997',
      platform: 'Profit',
      market: 'Mini Índice',
      timeframe: 'M15/H1',
      rating: 4.7,
      reviews: 87,
      image: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=500&h=300&fit=crop'
    }
  ];

  const faqs = [
    {
      question: 'Como funcionam as estratégias para Profit?',
      answer: 'Nossas estratégias são desenvolvidas especificamente para a plataforma Profit. Após a compra, você recebe um arquivo de configuração que pode ser importado diretamente na plataforma. Todas as estratégias vêm com instruções detalhadas de instalação e uso.'
    },
    {
      question: 'As estratégias funcionam em outras plataformas?',
      answer: 'Não, nossas estratégias são desenvolvidas exclusivamente para a plataforma Profit. Cada plataforma tem sua própria linguagem e estrutura, por isso não é possível utilizar em outras plataformas como MetaTrader ou TradingView.'
    },
    {
      question: 'Posso personalizar as estratégias?',
      answer: 'Sim, todas as nossas estratégias permitem personalização dos principais parâmetros como stop loss, take profit, horários de operação e filtros. No entanto, o código-fonte não é fornecido para preservar a propriedade intelectual.'
    },
    {
      question: 'Vocês oferecem suporte após a compra?',
      answer: 'Sim, oferecemos suporte técnico por 6 meses após a compra. Isso inclui ajuda com instalação, configuração e otimização da estratégia para seu perfil de risco. Após esse período, é possível adquirir extensões de suporte.'
    },
    {
      question: 'Qual a garantia de que as estratégias são lucrativas?',
      answer: 'Todas as nossas estratégias passam por rigorosos testes de backtesting e são utilizadas por traders reais. Oferecemos uma garantia de 30 dias: se a estratégia não atender às suas expectativas, devolvemos seu dinheiro. No entanto, é importante lembrar que resultados passados não garantem resultados futuros.'
    },
    {
      question: 'Como recebo a estratégia após a compra?',
      answer: 'Após a confirmação do pagamento, você receberá um email com os arquivos da estratégia e instruções detalhadas de instalação. Normalmente, o envio é feito em até 24 horas úteis.'
    }
  ];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handlePurchase = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setShowPurchaseModal(true);
  };

  const contactViaWhatsApp = (subject: string) => {
    const message = `Olá vim do DevHub Trader e quero mais informações e ajuda para criar robôs${subject ? ` - ${subject}` : ''}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
  };

  const handleSubmitContactForm = (e: React.FormEvent) => {
    e.preventDefault();
    contactViaWhatsApp('Formulário de Contato');
    setShowContactModal(false);
  };

  const handleSubmitPurchaseForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStrategy) {
      contactViaWhatsApp(`Compra de Estratégia - ${selectedStrategy.name}`);
    }
    setShowPurchaseModal(false);
    setSelectedStrategy(null);
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl font-bold mb-4">
                Profit Estrategista
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Estratégias automatizadas de alta performance para a plataforma Profit.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={() => {
                    const strategiesSection = document.getElementById('strategies');
                    strategiesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
                >
                  Ver Estratégias
                </button>
                <button 
                  onClick={() => contactViaWhatsApp('Demonstração')}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-md font-medium flex items-center justify-center"
                >
                  <WhatsApp className="w-5 h-5 mr-2" />
                  Solicitar Demonstração
                </button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-blue-800 bg-opacity-40 rounded-lg p-8">
                <Code2 className="w-32 h-32 text-blue-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Estratégias</h3>
                <Code2 className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">12+</p>
              <p className="text-sm text-gray-400">Estratégias disponíveis</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Clientes</h3>
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-gray-400">Traders satisfeitos</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Rentabilidade</h3>
                <BarChart2 className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold">2.5%</p>
              <p className="text-sm text-gray-400">Média mensal</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Suporte</h3>
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-3xl font-bold">6</p>
              <p className="text-sm text-gray-400">Meses inclusos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Por Que Escolher Nossas Estratégias</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Desenvolvidas por traders profissionais com anos de experiência no mercado.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 rounded-full p-3 mr-4">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Performance Comprovada</h3>
              </div>
              <p className="text-gray-300">
                Todas as estratégias são testadas em condições reais de mercado e possuem histórico de performance comprovada.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-600 rounded-full p-3 mr-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Gerenciamento de Risco</h3>
              </div>
              <p className="text-gray-300">
                Sistemas avançados de gerenciamento de risco para proteger seu capital e maximizar seus ganhos.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-600 rounded-full p-3 mr-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Suporte Especializado</h3>
              </div>
              <p className="text-gray-300">
                Suporte técnico especializado por 6 meses para ajudar na configuração e otimização da sua estratégia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategies Section */}
      <div id="strategies" className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nossas Estratégias</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Escolha a estratégia que melhor se adapta ao seu perfil e objetivos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {strategies.map((strategy) => (
              <div 
                key={strategy.id}
                className={`bg-gray-800 rounded-lg overflow-hidden ${
                  strategy.featured ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {strategy.featured && (
                  <div className="bg-blue-600 text-center py-2">
                    <p className="text-sm font-medium">Mais Vendida</p>
                  </div>
                )}
                
                <img 
                  src={strategy.image} 
                  alt={strategy.name}
                  className="w-full h-48 object-cover"
                />
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{strategy.name}</h3>
                  <p className="text-gray-300 mb-4">{strategy.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                      {strategy.platform}
                    </span>
                    <span className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                      {strategy.market}
                    </span>
                    <span className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                      {strategy.timeframe}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= Math.floor(strategy.rating) ? 'text-yellow-500' : 'text-gray-600'}`}
                          fill={star <= Math.floor(strategy.rating) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">
                      ({strategy.reviews} avaliações)
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{strategy.price}</p>
                    <button
                      onClick={() => contactViaWhatsApp(`Estratégia ${strategy.name}`)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md flex items-center"
                    >
                      <WhatsApp className="w-4 h-4 mr-2" />
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button
              onClick={() => contactViaWhatsApp('Estratégia Personalizada')}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-md font-medium flex items-center mx-auto"
            >
              <WhatsApp className="w-5 h-5 mr-2" />
              Solicitar Estratégia Personalizada
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Como Funciona</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Processo simples para começar a operar com nossas estratégias automatizadas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-gray-800 rounded-lg p-6 relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-4">Escolha</h3>
              <p className="text-gray-300">
                Selecione a estratégia que melhor se adapta ao seu perfil e objetivos de trading.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-4">Compre</h3>
              <p className="text-gray-300">
                Entre em contato conosco via WhatsApp para finalizar sua compra de forma segura.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-4">Instale</h3>
              <p className="text-gray-300">
                Receba os arquivos por email e siga as instruções detalhadas de instalação.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-4">Opere</h3>
              <p className="text-gray-300">
                Configure a estratégia conforme suas preferências e comece a operar automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">O Que Dizem Nossos Clientes</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Veja o que os traders que utilizam nossas estratégias têm a dizer.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" 
                  alt="Cliente" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-medium">Carlos Mendes</h4>
                  <p className="text-sm text-gray-400">Trader há 3 anos</p>
                </div>
              </div>
              <p className="text-gray-300">
                "A estratégia Trend Master Pro superou todas as minhas expectativas. O suporte técnico é excelente e os resultados são consistentes."
              </p>
              <div className="flex mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                  />
                ))}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                  alt="Cliente" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-medium">Fernanda Silva</h4>
                  <p className="text-sm text-gray-400">Trader há 2 anos</p>
                </div>
              </div>
              <p className="text-gray-300">
                "Comecei com a Reversal Hunter e depois adquiri a Scalper Elite. Ambas são excelentes e me ajudaram a ter consistência nos resultados."
              </p>
              <div className="flex mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-5 h-5 ${star <= 4 ? 'text-yellow-500' : 'text-gray-600'}`}
                    fill={star <= 4 ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" 
                  alt="Cliente" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-medium">Ricardo Alves</h4>
                  <p className="text-sm text-gray-400">Trader há 5 anos</p>
                </div>
              </div>
              <p className="text-gray-300">
                "Como trader experiente, posso dizer que as estratégias da Profit Estrategista estão entre as melhores que já utilizei. Recomendo fortemente."
              </p>
              <div className="flex mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
            <p className="text-xl text-gray-400">
              Tire suas dúvidas sobre nossas estratégias
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-gray-800 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none"
                >
                  <h3 className="text-lg font-medium">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-3xl font-bold mb-4">Pronto para automatizar suas operações?</h2>
                <p className="text-blue-100 max-w-xl mb-6">
                  Escolha uma de nossas estratégias prontas ou solicite uma estratégia personalizada para suas necessidades específicas.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button 
                    onClick={() => {
                      const strategiesSection = document.getElementById('strategies');
                      strategiesSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3 bg-white text-blue-900 font-medium rounded-md hover:bg-gray-100"
                  >
                    Ver Estratégias
                  </button>
                  <button 
                    onClick={() => contactViaWhatsApp('Estratégia Personalizada')}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md flex items-center justify-center"
                  >
                    <WhatsApp className="w-5 h-5 mr-2" />
                    Estratégia Personalizada
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Code2 className="w-32 h-32 text-blue-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Solicitar Informações</h2>
              <p className="text-gray-400 mt-2">
                Preencha o formulário abaixo para receber mais informações sobre nossas estratégias
              </p>
            </div>
            
            <form onSubmit={handleSubmitContactForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Interesse
                </label>
                <select
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione uma opção</option>
                  <option value="strategy">Estratégia específica</option>
                  <option value="custom">Estratégia personalizada</option>
                  <option value="demo">Demonstração</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Mensagem
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-md font-medium flex items-center justify-center"
              >
                <WhatsApp className="w-5 h-5 mr-2" />
                Enviar Mensagem
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setShowPurchaseModal(false);
                setSelectedStrategy(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Comprar Estratégia</h2>
              <p className="text-gray-400 mt-2">
                {selectedStrategy.name} - {selectedStrategy.price}
              </p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Detalhes da Estratégia</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Plataforma: {selectedStrategy.platform}</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Mercado: {selectedStrategy.market}</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Timeframe: {selectedStrategy.timeframe}</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Suporte técnico por 6 meses</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Atualizações gratuitas</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Garantia de 30 dias</span>
                </li>
              </ul>
            </div>
            
            <form onSubmit={handleSubmitPurchaseForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 mr-2"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-300">
                  Concordo com os <a href="#" className="text-blue-400 hover:text-blue-300">Termos e Condições</a> e <a href="#" className="text-blue-400 hover:text-blue-300">Política de Privacidade</a>
                </label>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-md font-medium flex items-center justify-center"
              >
                <WhatsApp className="w-5 h-5 mr-2" />
                Finalizar Compra
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Users, BarChart2, DollarSign, Calendar, CheckCircle, ExternalLink, Clock, ChevronRight, Apple as WhatsApp } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export function ProprietaryTradingPage() {
  const navigate = useNavigate();

  // Contact via WhatsApp
  const contactViaWhatsApp = (subject: string) => {
    const message = `Olá vim do DevHub Trader e quero mais informações e ajuda para criar robôs${subject ? ` - ${subject}` : ''}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
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
                Mesa Proprietária de Trading
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Opere com nosso capital e divida os lucros. Sem risco financeiro para você.
              </p>
              <button 
                onClick={() => contactViaWhatsApp('Mesa Proprietária')}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-md font-medium flex items-center"
              >
                <WhatsApp className="w-5 h-5 mr-2" />
                Falar com Especialista
              </button>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-blue-800 bg-opacity-30 rounded-lg p-8">
                <Building className="w-32 h-32 text-blue-300" />
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
                <h3 className="text-lg font-medium">Traders Ativos</h3>
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">120+</p>
              <p className="text-sm text-gray-400">Operando diariamente</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Capital Gerenciado</h3>
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-3xl font-bold">R$ 5M+</p>
              <p className="text-sm text-gray-400">Em operações ativas</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Retorno Médio</h3>
                <BarChart2 className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold">3.2%</p>
              <p className="text-sm text-gray-400">Mensal por trader</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Anos de Mercado</h3>
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-3xl font-bold">8+</p>
              <p className="text-sm text-gray-400">De experiência</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div 
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform duration-200"
              onClick={() => contactViaWhatsApp('Capital Gerenciado')}
            >
              <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center">
                <DollarSign className="w-24 h-24 text-white opacity-75" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Capital Gerenciado</h3>
                <p className="text-gray-300 mb-4">
                  Opere com nosso capital e divida os lucros. Planos a partir de R$ 5.000 até R$ 50.000.
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-sm text-gray-400">Sem risco financeiro</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform duration-200"
              onClick={() => contactViaWhatsApp('Mentoria Especializada')}
            >
              <div className="h-48 bg-gradient-to-r from-green-600 to-teal-700 flex items-center justify-center">
                <Users className="w-24 h-24 text-white opacity-75" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Mentoria Especializada</h3>
                <p className="text-gray-300 mb-4">
                  Receba orientação de traders profissionais e desenvolva suas habilidades com suporte contínuo.
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-sm text-gray-400">Acompanhamento semanal</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div 
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform duration-200"
              onClick={() => contactViaWhatsApp('Estratégias Exclusivas')}
            >
              <div className="h-48 bg-gradient-to-r from-purple-600 to-pink-700 flex items-center justify-center">
                <BarChart2 className="w-24 h-24 text-white opacity-75" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Estratégias Exclusivas</h3>
                <p className="text-gray-300 mb-4">
                  Acesse estratégias proprietárias desenvolvidas por nossa equipe com alto índice de assertividade.
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-sm text-gray-400">Resultados comprovados</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-2xl font-bold mb-3">Pronto para começar?</h2>
                <p className="text-blue-100 max-w-xl mb-4">
                  Acesse nossa plataforma completa de mesa proprietária e comece a operar com nosso capital hoje mesmo.
                </p>
                <div className="flex items-center text-sm text-blue-200">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Processo de avaliação rápido e 100% online</span>
                </div>
              </div>
              <button
                onClick={() => contactViaWhatsApp('Mesa Proprietária - CTA')}
                className="px-6 py-3 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 flex items-center"
              >
                <WhatsApp className="w-5 h-5 mr-2" />
                Falar com Especialista
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Comece sua jornada como trader profissional</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Junte-se a centenas de traders que já estão operando com nosso capital e transformando suas carreiras.
          </p>
          <button
            onClick={() => contactViaWhatsApp('Jornada Trader Profissional')}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 rounded-md font-medium text-lg inline-flex items-center"
          >
            <WhatsApp className="w-5 h-5 mr-2" />
            Falar com Especialista
          </button>
        </div>
      </div>
    </div>
  );
}
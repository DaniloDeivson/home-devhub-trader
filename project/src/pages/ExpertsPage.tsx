import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Star, MessageSquare, Calendar, Clock, Award, CheckCircle, Filter, Search, ChevronDown, X, Mail, Building, Users, ExternalLink, User, BarChart2, Download, Apple as WhatsApp } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Navbar } from '../components/Navbar';

export function ExpertsPage() {
  const navigate = useNavigate();

  // Redirect to external site
  const redirectToExternalSite = (url: string) => {
    window.open(url, '_blank');
  };

  // Contact via WhatsApp
  const contactViaWhatsApp = (subject: string) => {
    const message = `Olá vim do DevHub Trader e quero mais informações e ajuda para criar robôs${subject ? ` - ${subject}` : ''}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/robots')}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                title="Back to robots"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">Robôs Prontos e Copy Trade</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Card 1 */}
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center">
              <Download className="w-24 h-24 text-white opacity-75" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Robôs Prontos</h3>
              <p className="text-gray-300 mb-4">
                Adquira robôs de trading já configurados e prontos para operar em diversos mercados.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-sm text-gray-400">Resultados comprovados</span>
                </div>
                <button 
                  onClick={() => contactViaWhatsApp('Robôs Prontos')}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md flex items-center"
                >
                  <WhatsApp className="w-4 h-4 mr-2" />
                  Contato
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <div className="h-48 bg-gradient-to-r from-green-600 to-teal-700 flex items-center justify-center">
              <Users className="w-24 h-24 text-white opacity-75" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Copy Trade</h3>
              <p className="text-gray-300 mb-4">
                Copie automaticamente as operações dos melhores traders da plataforma e lucre junto.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-sm text-gray-400">Sem conhecimento técnico</span>
                </div>
                <button 
                  onClick={() => contactViaWhatsApp('Copy Trade')}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md flex items-center"
                >
                  <WhatsApp className="w-4 h-4 mr-2" />
                  Contato
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <div className="h-48 bg-gradient-to-r from-purple-600 to-pink-700 flex items-center justify-center">
              <Briefcase className="w-24 h-24 text-white opacity-75" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Estratégias Personalizadas</h3>
              <p className="text-gray-300 mb-4">
                Solicite o desenvolvimento de estratégias sob medida para suas necessidades específicas.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-sm text-gray-400">Suporte dedicado</span>
                </div>
                <button 
                  onClick={() => contactViaWhatsApp('Estratégias Personalizadas')}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md flex items-center"
                >
                  <WhatsApp className="w-4 h-4 mr-2" />
                  Solicitar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <h2 className="text-2xl font-bold mb-3">Robôs prontos para todos os perfis</h2>
              <p className="text-blue-100 max-w-xl mb-4">
                Acesse nossa plataforma completa com dezenas de robôs prontos para uso, estratégias testadas e sistema de copy trade.
              </p>
              <div className="flex items-center text-sm text-blue-200">
                <Clock className="w-4 h-4 mr-1" />
                <span>Comece a operar em minutos</span>
              </div>
            </div>
            <button
              onClick={() => contactViaWhatsApp('Plataforma Completa')}
              className="px-6 py-3 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 flex items-center"
            >
              <WhatsApp className="w-5 h-5 mr-2" />
              Falar com Especialista
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 rounded-full p-3 mr-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Robôs Verificados</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Todos os robôs são testados e verificados pela nossa equipe para garantir qualidade e segurança.
            </p>
            <button
              onClick={() => contactViaWhatsApp('Robôs Verificados')}
              className="text-green-400 hover:text-green-300 flex items-center text-sm"
            >
              <WhatsApp className="w-4 h-4 mr-1" />
              Fale com um especialista
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-600 rounded-full p-3 mr-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Copy Trade Premium</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Copie as operações dos melhores traders da plataforma e obtenha resultados consistentes sem precisar operar.
            </p>
            <button
              onClick={() => contactViaWhatsApp('Copy Trade Premium')}
              className="text-green-400 hover:text-green-300 flex items-center text-sm"
            >
              <WhatsApp className="w-4 h-4 mr-1" />
              Conhecer Copy Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
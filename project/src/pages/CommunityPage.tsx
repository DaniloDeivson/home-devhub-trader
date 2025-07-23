import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GitPullRequest, Star, Search, 
  ArrowLeft, User, ThumbsUp, ExternalLink,
  BookOpen, GitFork, Clock, Code2, MessageSquare
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

export function CommunityPage() {
  const navigate = useNavigate();

  // Redirect to external site
  const redirectToExternalSite = () => {
    window.open('https://profitestrategista.com.br/login', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/robots')}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Back to robots"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Comunidade de Trading</h1>
          </div>
        </div>

        {/* Main Content - Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Card 1 */}
          <div 
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform duration-200"
            onClick={redirectToExternalSite}
          >
            <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center">
              <Users className="w-24 h-24 text-white opacity-75" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Comunidade de Traders</h3>
              <p className="text-gray-300 mb-4">
                Conecte-se com outros traders, compartilhe estratégias e aprenda com os melhores profissionais do mercado.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-blue-400 mr-1" />
                  <span className="text-sm text-gray-400">500+ membros</span>
                </div>
                <ExternalLink className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform duration-200"
            onClick={redirectToExternalSite}
          >
            <div className="h-48 bg-gradient-to-r from-green-600 to-teal-700 flex items-center justify-center">
              <Code2 className="w-24 h-24 text-white opacity-75" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Robôs Gratuitos</h3>
              <p className="text-gray-300 mb-4">
                Acesse uma biblioteca de robôs de trading gratuitos desenvolvidos pela comunidade e compartilhe os seus.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <GitFork className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-sm text-gray-400">200+ robôs</span>
                </div>
                <ExternalLink className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 transform duration-200"
            onClick={redirectToExternalSite}
          >
            <div className="h-48 bg-gradient-to-r from-purple-600 to-pink-700 flex items-center justify-center">
              <MessageSquare className="w-24 h-24 text-white opacity-75" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Fórum de Discussão</h3>
              <p className="text-gray-300 mb-4">
                Participe de discussões sobre estratégias, análise técnica e compartilhe suas operações com outros traders.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ThumbsUp className="w-4 h-4 text-purple-400 mr-1" />
                  <span className="text-sm text-gray-400">1000+ tópicos</span>
                </div>
                <ExternalLink className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <h2 className="text-2xl font-bold mb-3">Junte-se à nossa comunidade hoje</h2>
              <p className="text-blue-100 max-w-xl mb-4">
                Acesse nossa plataforma completa de comunidade, com fóruns, robôs gratuitos, análises compartilhadas e muito mais.
              </p>
              <div className="flex items-center text-sm text-blue-200">
                <Clock className="w-4 h-4 mr-1" />
                <span>Acesso imediato após o login</span>
              </div>
            </div>
            <button
              onClick={redirectToExternalSite}
              className="px-6 py-3 bg-white text-blue-900 font-medium rounded-md hover:bg-gray-100 flex items-center"
            >
              Acessar Comunidade
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 rounded-full p-3 mr-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Robôs Verificados</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Todos os robôs gratuitos são testados e verificados pela nossa equipe para garantir qualidade e segurança.
            </p>
            <button
              onClick={redirectToExternalSite}
              className="text-blue-400 hover:text-blue-300 flex items-center text-sm"
            >
              Ver robôs verificados
              <ExternalLink className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-600 rounded-full p-3 mr-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Biblioteca de Conhecimento</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Acesse artigos, tutoriais e recursos educacionais compartilhados pela comunidade para aprimorar suas habilidades.
            </p>
            <button
              onClick={redirectToExternalSite}
              className="text-green-400 hover:text-green-300 flex items-center text-sm"
            >
              Explorar biblioteca
              <ExternalLink className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
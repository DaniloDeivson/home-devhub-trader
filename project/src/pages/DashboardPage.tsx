import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Code2, 
  Activity, 
  BookOpen, 
  ShoppingCart, 
  Users, 
  Upload, 
  Bot, 
  TrendingUp, 
  BarChart2, 
  Zap, 
  Share2,
  ChevronDown,
  ImageIcon,
  Lightbulb,
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  PieChart,
  Layers,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../stores/authStore';
import { useRobotStore } from '../stores/robotStore';
import { supabase } from '../lib/supabase';

// Componente TutorialCard
const TutorialCard = ({ tutorial }: { tutorial: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-gray-700/30 rounded-xl overflow-hidden">
      {/* Header do Tutorial */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              tutorial.level === 'Fácil' ? 'bg-green-500/20' :
              tutorial.level === 'Médio' ? 'bg-blue-500/20' : 'bg-red-500/20'
            }`}>
              {tutorial.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{tutorial.title}</h3>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-400">{tutorial.duration}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tutorial.level === 'Fácil' ? 'bg-green-500/20 text-green-400' :
                  tutorial.level === 'Médio' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {tutorial.level}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{tutorial.steps?.length || 0} passos</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} />
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-2">{tutorial.description}</p>
      </div>
      
      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="border-t border-gray-600/50">
          <div className="p-6 space-y-6">
            {tutorial.steps?.map((step: any, stepIndex: number) => (
              <div key={stepIndex} className="flex space-x-4">
                {/* Número do Passo */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {stepIndex + 1}
                  </div>
                  {stepIndex < tutorial.steps.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-600 mx-auto mt-2"></div>
                  )}
                </div>
                
                {/* Conteúdo do Passo */}
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-2">{step.title}</h4>
                  <p className="text-gray-300 text-sm mb-3 leading-relaxed">{step.description}</p>
                  
                  {/* Espaço para Imagem */}
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-3 border-2 border-dashed border-gray-600">
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Imagem: {step.imageDescription}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dicas Adicionais */}
                  {step.tips && (
                    <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-blue-400 mb-1">Dica:</p>
                          <p className="text-xs text-blue-300">{step.tips}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Código de Exemplo */}
                  {step.code && (
                    <div className="bg-gray-900 rounded-lg p-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400">Código de exemplo:</span>
                        <button className="text-xs text-blue-400 hover:text-blue-300">
                          Copiar
                        </button>
                      </div>
                      <pre className="text-xs text-green-400 overflow-x-auto">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Botão de Ação Final */}
            <div className="pt-4 border-t border-gray-600/50">
              <button
                onClick={() => {
                  if (tutorial.actionUrl) {
                    window.location.href = tutorial.actionUrl;
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-medium transition-all duration-300"
              >
                {tutorial.actionText || 'Começar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { profile, loadProfile } = useAuthStore();
  const { robots, loadRobots, robotLimit } = useRobotStore();
  const [activeSection, setActiveSection] = useState('analyses');
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [loadingRobots, setLoadingRobots] = useState(false);

  // Mock data para tutoriais
  const mockTutorials = [
    {
      title: 'Como fazer upload de CSV',
      duration: '8 min',
      level: 'Fácil',
      description: 'Aprenda a preparar e enviar dados de backtest para análise completa',
      icon: <Upload className="w-6 h-6 text-green-400" />,
      actionText: 'Fazer Upload Agora',
      actionUrl: '/backtest-analysis',
      steps: [
        {
          title: 'Prepare seus dados de backtest',
          description: 'Exporte os resultados do seu backtest em formato CSV. O arquivo deve conter colunas como: Data, Hora, Ativo, Direção (Compra/Venda), Preço de Entrada, Preço de Saída, Resultado (Lucro/Prejuízo), Volume.',
          imageDescription: 'Screenshot mostrando exemplo de planilha CSV formatada',
          tips: 'Certifique-se de que as datas estão no formato DD/MM/AAAA e os valores monetários usam ponto como separador decimal.'
        },
        {
          title: 'Acesse a página de análise',
          description: 'Navegue até a seção "Análise de Backtest" no menu principal. Você verá uma área de upload onde pode arrastar e soltar seu arquivo CSV.',
          imageDescription: 'Interface da página de análise com área de upload destacada',
          tips: 'A área de upload aceita arquivos de até 10MB. Para arquivos maiores, considere filtrar apenas os dados mais relevantes.'
        },
        {
          title: 'Faça o upload do arquivo',
          description: 'Clique na área de upload ou arraste seu arquivo CSV diretamente. O sistema validará automaticamente o formato e mostrará uma prévia dos dados.',
          imageDescription: 'Processo de upload com barra de progresso e validação',
          tips: 'Se houver erros de formato, o sistema mostrará sugestões específicas para corrigir o arquivo.'
        },
        {
          title: 'Inicie a análise com IA',
          description: 'Após o upload bem-sucedido, clique em "Analisar Backtest". A IA processará seus dados e gerará métricas detalhadas como Profit Factor, Sharpe Ratio, Drawdown Máximo e muito mais.',
          imageDescription: 'Botão de análise e indicador de progresso da IA',
          tips: 'A análise consome 1000 tokens. Certifique-se de ter saldo suficiente antes de iniciar.'
        },
        {
          title: 'Interprete os resultados',
          description: 'Revise o relatório gerado com métricas de performance, pontos fortes e fracos da estratégia, e sugestões de otimização personalizadas.',
          imageDescription: 'Dashboard de resultados com gráficos e métricas',
          tips: 'Use o chat com IA para fazer perguntas específicas sobre os resultados e obter insights adicionais.'
        }
      ]
    },
    {
      title: 'Gerar código de robô com IA',
      duration: '12 min',
      level: 'Médio',
      description: 'Tutorial completo para criar robôs de trading automaticamente usando IA',
      icon: <Bot className="w-6 h-6 text-blue-400" />,
      actionText: 'Criar Robô com IA',
      actionUrl: '/robots',
      steps: [
        {
          title: 'Defina sua estratégia de trading',
          description: 'Antes de usar a IA, tenha uma ideia clara da sua estratégia. Pense nos indicadores que quer usar (médias móveis, RSI, MACD), condições de entrada e saída, e regras de gerenciamento de risco.',
          imageDescription: 'Diagrama mostrando elementos de uma estratégia de trading',
          tips: 'Quanto mais específico você for na descrição, melhor será o código gerado pela IA.'
        },
        {
          title: 'Acesse o editor de robôs',
          description: 'Vá para "Meus Robôs" e clique em "Criar Robô". Você será direcionado para o editor onde encontrará o chat da IA no painel lateral esquerdo.',
          imageDescription: 'Interface do editor com chat da IA destacado',
          tips: 'O editor suporta múltiplas linguagens: NTSL (Profit), MQL5 (MetaTrader) e outras plataformas.'
        },
        {
          title: 'Descreva sua estratégia para a IA',
          description: 'No chat da IA, descreva detalhadamente sua estratégia. Exemplo: "Crie um robô que compra quando a média móvel de 9 períodos cruza acima da de 21, com stop loss de 50 pontos e take profit de 100 pontos."',
          imageDescription: 'Chat da IA com exemplo de prompt detalhado',
          tips: 'Inclua informações sobre timeframe, ativo, horários de operação e regras específicas de entrada/saída.',
          code: `// Exemplo de prompt para IA:
"Crie um robô para WINFUT que:
- Use médias móveis 9 e 21
- Compre no cruzamento para cima
- Stop loss: 50 pontos
- Take profit: 100 pontos
- Opere apenas das 9h às 17h"`
        },
        {
          title: 'Revise e ajuste o código gerado',
          description: 'A IA gerará o código automaticamente. Revise a lógica, teste os parâmetros e faça ajustes se necessário. Você pode pedir à IA para modificar partes específicas.',
          imageDescription: 'Editor mostrando código gerado com destaque nas seções principais',
          tips: 'Use o chat para pedir modificações: "Adicione um filtro de volume mínimo" ou "Mude o stop loss para trailing stop".'
        },
        {
          title: 'Salve e teste seu robô',
          description: 'Salve o código como uma nova versão, dê um nome descritivo e adicione tags relevantes. Depois, teste em conta demo antes de usar em operações reais.',
          imageDescription: 'Modal de salvamento com campos de versão e tags',
          tips: 'Use tags como "scalping", "trend-following", "M5", "WINFUT" para organizar melhor seus robôs.'
        }
      ]
    }
  ];

  // Mock data para marketplace
  const mockMarketplace = [
    {
      name: 'QuantBroker',
      description: 'Portfólios de IA copy trade',
      logo: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      verified: true,
      rating: 4.8,
      services: ['Copy Trade IA', 'Gestão Automatizada', 'Análise Preditiva']
    },
    {
      name: 'NotBroker',
      description: 'Contabilidade e resultados auditados',
      logo: 'https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      verified: true,
      rating: 4.9,
      services: ['Auditoria de Resultados', 'Relatórios Fiscais', 'Compliance']
    },
    {
      name: 'Estrategista Solutions',
      description: 'Projetos personalizados por humanos',
      logo: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      verified: true,
      rating: 4.7,
      services: ['Desenvolvimento Custom', 'Consultoria Estratégica', 'Mentoria']
    },
    {
      name: 'Pack de Robôs',
      description: 'Estrategista Solutions',
      logo: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      verified: true,
      rating: 4.6,
      services: ['Robôs Prontos', 'Suporte Técnico', 'Atualizações'],
      link: 'https://profitestrategista.com.br'
    }
  ];

  // Mock data para posts do feed
  const mockPosts = [
    {
      id: 1,
      user: { 
        name: 'Carlos Silva', 
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        quantScore: 94,
        level: 'Expert'
      },
      content: 'Acabei de otimizar minha estratégia de scalping e consegui aumentar o Profit Factor de 1.8 para 2.3! A chave foi adicionar um filtro de volume.',
      timestamp: '2h',
      likes: 24,
      comments: 8,
      type: 'strategy'
    },
    {
      id: 2,
      user: { 
        name: 'Ana Costa', 
        avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        quantScore: 87,
        level: 'Pro'
      },
      content: 'Compartilhando minha análise de backtest do WINFUT. Win rate de 68% com drawdown máximo de apenas 8.5%. Alguém quer trocar ideias?',
      timestamp: '4h',
      likes: 31,
      comments: 12,
      type: 'analysis'
    },
    {
      id: 3,
      user: { 
        name: 'Roberto Lima', 
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        quantScore: 91,
        level: 'Expert'
      },
      content: 'Novo robô de grid trading funcionando perfeitamente! Testei por 30 dias e os resultados superaram as expectativas.',
      timestamp: '6h',
      likes: 18,
      comments: 5,
      type: 'robot'
    }
  ];

  // Carregar análises salvas
  const loadSavedAnalyses = async () => {
    try {
      setLoadingAnalyses(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("strategy_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const analyses = data.map(item => {
          const analysisData = item.analysis_data || {};
          return {
            id: item.id,
            name: analysisData.name || `Análise ${item.id.slice(0, 8)}`,
            createdAt: item.created_at,
            updatedAt: item.updated_at || item.created_at,
            profitFactor: analysisData.metrics?.["Performance Metrics"]?.["Profit Factor"] || 0,
            winRate: analysisData.metrics?.["Performance Metrics"]?.["Win Rate (%)"] || 0,
            drawdown: analysisData.metrics?.["Performance Metrics"]?.["Max Drawdown (%)"] || 0,
            totalTrades: analysisData.metrics?.["Performance Metrics"]?.["Total Trades"] || 0
          };
        });
        
        setSavedAnalyses(analyses);
      }
    } catch (error) {
      console.error("Error loading saved analyses:", error);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  // Carregar robôs
  const loadUserRobots = async () => {
    try {
      setLoadingRobots(true);
      await loadRobots();
    } catch (error) {
      console.error("Error loading robots:", error);
    } finally {
      setLoadingRobots(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadSavedAnalyses();
    loadUserRobots();
    setActiveSection('analyses');
  }, []);

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard da Comunidade</h1>
          <p className="text-gray-400">Conecte-se, aprenda e evolua com outros traders</p>
        </div>

        {/* Painel de Navegação */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {/* Minhas Análises */}
          <button
            onClick={() => setActiveSection('analyses')}
            className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
              activeSection === 'analyses'
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25'
                : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-blue-600/20 hover:to-blue-700/20'
            }`}
          >
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                activeSection === 'analyses' ? 'bg-white/20' : 'bg-blue-500/20'
              }`}>
                <BarChart2 className={`w-6 h-6 ${
                  activeSection === 'analyses' ? 'text-white' : 'text-blue-400'
                }`} />
              </div>
              <h3 className="font-semibold text-white mb-1">Minhas Análises</h3>
              <p className="text-xs text-gray-300">Backtest</p>
            </div>
          </button>

          {/* Meus Robôs */}
          <button
            onClick={() => setActiveSection('myrobots')}
            className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
              activeSection === 'myrobots'
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-500/25'
                : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-emerald-600/20 hover:to-emerald-700/20'
            }`}
          >
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                activeSection === 'myrobots' ? 'bg-white/20' : 'bg-emerald-500/20'
              }`}>
                <Code2 className={`w-6 h-6 ${
                  activeSection === 'myrobots' ? 'text-white' : 'text-emerald-400'
                }`} />
              </div>
              <h3 className="font-semibold text-white mb-1">Meus Robôs</h3>
              <p className="text-xs text-gray-300">Gerenciar</p>
            </div>
          </button>

          {/* Feed de Postagens */}
          <button
            onClick={() => setActiveSection('feed')}
            className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
              activeSection === 'feed'
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25'
                : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-blue-600/20 hover:to-blue-700/20'
            }`}
          >
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                activeSection === 'feed' ? 'bg-white/20' : 'bg-blue-500/20'
              }`}>
                <Activity className={`w-6 h-6 ${
                  activeSection === 'feed' ? 'text-white' : 'text-blue-400'
                }`} />
              </div>
              <h3 className="font-semibold text-white mb-1">Feed</h3>
              <p className="text-xs text-gray-300">Postagens</p>
            </div>
          </button>

          {/* Tutoriais */}
          <button
            onClick={() => setActiveSection('tutorials')}
            className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
              activeSection === 'tutorials'
                ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-500/25'
                : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-purple-600/20 hover:to-purple-700/20'
            }`}
          >
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                activeSection === 'tutorials' ? 'bg-white/20' : 'bg-purple-500/20'
              }`}>
                <BookOpen className={`w-6 h-6 ${
                  activeSection === 'tutorials' ? 'text-white' : 'text-purple-400'
                }`} />
              </div>
              <h3 className="font-semibold text-white mb-1">Tutoriais</h3>
              <p className="text-xs text-gray-300">Aprenda</p>
            </div>
          </button>

          {/* Marketplace */}
          <button
            onClick={() => setActiveSection('marketplace')}
            className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
              activeSection === 'marketplace'
                ? 'bg-gradient-to-br from-orange-600 to-orange-700 shadow-lg shadow-orange-500/25'
                : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-orange-600/20 hover:to-orange-700/20'
            }`}
          >
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                activeSection === 'marketplace' ? 'bg-white/20' : 'bg-orange-500/20'
              }`}>
                <ShoppingCart className={`w-6 h-6 ${
                  activeSection === 'marketplace' ? 'text-white' : 'text-orange-400'
                }`} />
              </div>
              <h3 className="font-semibold text-white mb-1">Marketplace</h3>
              <p className="text-xs text-gray-300">Comprar</p>
            </div>
          </button>
        </div>

        {/* Conteúdo das Seções */}
        <div className="space-y-6">
          {/* Minhas Análises */}
          {activeSection === 'analyses' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Minhas Análises</h2>
                    <p className="text-gray-400 text-sm">Histórico de análises de backtest</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/backtest-analysis')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Nova Análise
                </button>
              </div>
              
              {loadingAnalyses ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-400">Carregando análises...</span>
                </div>
              ) : savedAnalyses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedAnalyses.map((analysis, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium truncate">{analysis.name}</h3>
                        <span className="text-xs text-gray-400">
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-400">
                            {analysis.profitFactor ? analysis.profitFactor.toFixed(2) : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400">P.F.</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-blue-400">
                            {analysis.winRate ? `${analysis.winRate.toFixed(1)}%` : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400">Win</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-red-400">
                            {analysis.drawdown ? `${analysis.drawdown.toFixed(1)}%` : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400">DD</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate('/backtest-analysis')}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => {}}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                        >
                          <Share2 className="w-3 h-3 mr-1" />
                          Compartilhar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma análise encontrada</h3>
                  <p className="text-gray-400 mb-4">Comece fazendo sua primeira análise de backtest</p>
                  <button
                    onClick={() => navigate('/backtest-analysis')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                  >
                    Fazer Primeira Análise
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Meus Robôs */}
          {activeSection === 'myrobots' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Meus Robôs</h2>
                    <p className="text-gray-400 text-sm">Gerencie seus robôs de trading</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/robots')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Novo Robô
                </button>
              </div>
              
              {loadingRobots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  <span className="ml-3 text-gray-400">Carregando robôs...</span>
                </div>
              ) : robots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {robots.slice(0, 6).map((robot, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Code2 className="w-4 h-4 text-emerald-400" />
                          </div>
                          <h3 className="font-medium">{robot.name}</h3>
                        </div>
                        <span className="text-xs text-gray-400">
                          {robot.current_version_id ? 'v1.0' : 'Sem versão'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-400">-</p>
                          <p className="text-xs text-gray-400">Profit Factor</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-400">-</p>
                          <p className="text-xs text-gray-400">Win Rate</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/editor/${robot.id}`)}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {}}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                        >
                          <Share2 className="w-3 h-3 mr-1" />
                          Compartilhar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Code2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum robô encontrado</h3>
                  <p className="text-gray-400 mb-4">Comece criando seu primeiro robô de trading</p>
                  <button
                    onClick={() => navigate('/robots')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
                  >
                    Criar Primeiro Robô
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feed de Postagens */}
          {activeSection === 'feed' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Feed da Comunidade</h2>
                  <p className="text-gray-400 text-sm">Últimas atualizações dos traders</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {(showAllPosts ? mockPosts : mockPosts.slice(0, 3)).map((post, index) => (
                  <div key={index} className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{post.user.name}</h3>
                          <div className="flex items-center space-x-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              post.user.quantScore >= 90 ? 'bg-blue-500 text-white' :
                              post.user.quantScore >= 70 ? 'bg-emerald-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              Q
                            </div>
                            <span className={`text-sm font-medium ${
                              post.user.quantScore >= 90 ? 'text-blue-400' :
                              post.user.quantScore >= 70 ? 'text-emerald-400' :
                              'text-gray-400'
                            }`}>
                              {post.user.quantScore}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            post.user.quantScore >= 90 ? 'bg-blue-500/20 text-blue-400' :
                            post.user.quantScore >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {post.user.quantScore >= 90 ? 'Expert' : post.user.quantScore >= 70 ? 'Pro' : 'Advanced'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{post.timestamp}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-3 leading-relaxed">{post.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <button className="hover:text-blue-400 transition-colors">
                        👍 {post.likes}
                      </button>
                      <button className="hover:text-blue-400 transition-colors">
                        💬 {post.comments}
                      </button>
                      <button className="hover:text-blue-400 transition-colors">
                        🔄 Compartilhar
                      </button>
                    </div>
                  </div>
                ))}
                
                {!showAllPosts && mockPosts.length > 3 && (
                  <button
                    onClick={() => setShowAllPosts(true)}
                    className="w-full py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-gray-300 hover:text-white transition-colors"
                  >
                    Ver Mais ({mockPosts.length - 3} posts restantes)
                  </button>
                )}
                
                {showAllPosts && (
                  <button
                    onClick={() => setShowAllPosts(false)}
                    className="w-full py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-gray-300 hover:text-white transition-colors"
                  >
                    Ver Menos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tutoriais */}
          {activeSection === 'tutorials' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Tutoriais</h2>
                  <p className="text-gray-400 text-sm">Aprenda a usar todas as funcionalidades</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {mockTutorials.map((tutorial, index) => (
                  <TutorialCard key={index} tutorial={tutorial} />
                ))}
              </div>
            </div>
          )}

          {/* Marketplace */}
          {activeSection === 'marketplace' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Marketplace</h2>
                  <p className="text-gray-400 text-sm">Serviços e soluções para traders</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockMarketplace.map((company, index) => (
                  <div key={index} className="bg-gray-700/30 rounded-xl p-6 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center space-x-4 mb-4">
                      <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">{company.name}</h3>
                          {company.verified && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{company.description}</p>
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-medium">{company.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {company.services.map((service, serviceIndex) => (
                        <div key={serviceIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          <span className="text-sm text-gray-300">{service}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => {
                        if (company.link) {
                          window.open(company.link, '_blank');
                        }
                      }}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors"
                    >
                      Acessar Serviço
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 
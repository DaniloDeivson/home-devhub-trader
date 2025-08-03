import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, XCircle, Bot, User, Zap, Sparkles, TrendingUp, BarChart2, Calendar } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface AIResponseChatProps {
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  onCancelAnalysis: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  analysisResult: any;
  onMetricsReceived?: (metrics: any) => void;
}

export function AIResponseChat({
  isAnalyzing,
  setIsAnalyzing,
  onCancelAnalysis,
  error,
  setError,
  analysisResult,
  onMetricsReceived
}: AIResponseChatProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { 
      role: 'assistant', 
      content: 'Olá! Estou analisando seus dados de backtest. Você pode me perguntar sobre os resultados ou pedir sugestões para melhorar sua estratégia.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuthStore();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (analysisResult) {
      addMessage('assistant', 'Análise concluída! Aqui estão os principais resultados:\n\n' +
        `- Profit Factor: ${analysisResult.profitFactor?.toFixed(2) || 'N/A'}\n` +
        `- Win Rate: ${analysisResult.winRate?.toFixed(2) || 'N/A'}%\n` +
        `- Drawdown Máximo: ${analysisResult.maxDrawdown?.toFixed(2) || 'N/A'}%\n` +
        `- Lucro Líquido: R$ ${analysisResult.netProfit?.toFixed(2) || 'N/A'}\n\n` +
        'Você pode me perguntar mais detalhes sobre esses resultados ou pedir sugestões para melhorar a estratégia.'
      );
    }
  }, [analysisResult]);

  useEffect(() => {
    if (error) {
      addMessage('assistant', `Ocorreu um erro: ${error}`);
    }
  }, [error]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Check if user has enough tokens
    const tokenBalance = profile?.token_balance || 0;
    if (tokenBalance < 100) {
      setError('Saldo de tokens insuficiente. Esta consulta requer 100 tokens.');
      return;
    }
    
    const userMessage = input;
    addMessage('user', userMessage);
    setInput('');
    setIsTyping(true);
    
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a response based on the user's message
      let response = '';
      
      if (userMessage.toLowerCase().includes('melhorar') || userMessage.toLowerCase().includes('otimizar')) {
        response = 'Para melhorar sua estratégia, considere:\n\n' +
          '1. Ajustar o stop loss para reduzir o drawdown máximo\n' +
          '2. Filtrar entradas em dias de alta volatilidade\n' +
          '3. Considerar o horário de operação, evitando períodos de baixa liquidez\n' +
          '4. Implementar trailing stop para maximizar ganhos em tendências fortes';
      } else if (userMessage.toLowerCase().includes('drawdown') || userMessage.toLowerCase().includes('risco')) {
        response = 'Análise de drawdown:\n\n' +
          '- Drawdown máximo: 15.2% (R$ 1,520.00)\n' +
          '- Duração do drawdown: 8 dias\n' +
          '- Período: 12/03/2023 a 20/03/2023\n\n' +
          'Recomendação: Considere reduzir o tamanho das posições em 20% para diminuir o impacto do drawdown.';
      } else if (userMessage.toLowerCase().includes('correlação')) {
        response = 'Análise de correlação entre ativos:\n\n' +
          '- WINFUT e WDOFUT: 0.72 (alta correlação)\n' +
          '- WINFUT e PETR4: 0.45 (correlação moderada)\n' +
          '- WDOFUT e VALE3: 0.18 (baixa correlação)\n\n' +
          'Para melhor diversificação, considere combinar estratégias em WINFUT e VALE3.';
      } else if (userMessage.toLowerCase().includes('melhor') && userMessage.toLowerCase().includes('dia')) {
        response = 'Análise por dia da semana:\n\n' +
          '- Melhor dia: Terça-feira (Profit Factor: 2.35)\n' +
          '- Pior dia: Sexta-feira (Profit Factor: 0.85)\n\n' +
          'Recomendação: Considere operar apenas de segunda a quinta-feira para evitar o desempenho negativo das sextas-feiras.';
      } else {
        response = 'Baseado na análise do backtest, posso destacar:\n\n' +
          '- A estratégia tem um Profit Factor de 1.45, o que é razoável\n' +
          '- Win Rate de 58.3% está acima da média\n' +
          '- O drawdown máximo de 15.2% está dentro de limites aceitáveis\n\n' +
          'Você gostaria de saber mais sobre algum aspecto específico ou receber sugestões de otimização?';
      }
      
      addMessage('assistant', response);
      
      // Update metrics if needed
      if (onMetricsReceived && userMessage.toLowerCase().includes('atualizar métricas')) {
        const updatedMetrics = {
          ...analysisResult,
          profitFactor: 1.45,
          winRate: 58.3,
          maxDrawdown: 15.2,
          netProfit: 2450.75
        };
        onMetricsReceived(updatedMetrics);
      }
      
    } catch (err) {
      console.error('Error processing message:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar mensagem');
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    handleSubmit(new Event('submit') as any);
  };

  const handleAnalysisOptionSelect = (analysisType: string) => {
    let prompt = '';
    
    switch (analysisType) {
      case 'otimização':
        prompt = 'Analise minha estratégia e sugira otimizações para melhorar o desempenho';
        break;
      case 'risco':
        prompt = 'Faça uma análise detalhada do risco e drawdown da minha estratégia';
        break;
      case 'correlação':
        prompt = 'Analise a correlação entre os ativos e sugira combinações para diversificação';
        break;
      case 'sazonalidade':
        prompt = 'Identifique padrões sazonais nos resultados (dias da semana, meses, horários)';
        break;
      default:
        prompt = 'Analise minha estratégia e forneça insights gerais';
    }
    
    setInput(prompt);
    setShowAnalysisOptions(false);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              <div className="flex items-center mb-1">
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4 mr-2 text-blue-400" />
                ) : (
                  <User className="w-4 h-4 mr-2 text-gray-300" />
                )}
                <span className="text-xs font-medium">
                  {message.role === 'assistant' ? 'Assistente IA' : 'Você'}
                </span>
              </div>
              <p className="whitespace-pre-line">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center">
                <Bot className="w-4 h-4 mr-2 text-blue-400" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3 text-red-500 flex items-center">
              <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick optimization buttons */}
      <div className="px-4 pt-2 pb-0 flex flex-wrap gap-2">
        <button
          onClick={() => handleQuickPrompt("Como posso melhorar o profit factor?")}
          className="px-2 py-1 bg-blue-900 bg-opacity-40 hover:bg-opacity-60 text-blue-300 rounded-full text-xs flex items-center"
          disabled={isAnalyzing || isTyping}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Melhorar Profit Factor
        </button>
        <button
          onClick={() => handleQuickPrompt("Como reduzir o drawdown?")}
          className="px-2 py-1 bg-red-900 bg-opacity-40 hover:bg-opacity-60 text-red-300 rounded-full text-xs flex items-center"
          disabled={isAnalyzing || isTyping}
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Reduzir Drawdown
        </button>
        <button
          onClick={() => handleQuickPrompt("Quais são os melhores dias para operar?")}
          className="px-2 py-1 bg-green-900 bg-opacity-40 hover:bg-opacity-60 text-green-300 rounded-full text-xs flex items-center"
          disabled={isAnalyzing || isTyping}
        >
          <Calendar className="w-3 h-3 mr-1" />
          Melhores Dias
        </button>
        <button
          onClick={() => handleQuickPrompt("Analise a correlação entre ativos")}
          className="px-2 py-1 bg-purple-900 bg-opacity-40 hover:bg-opacity-60 text-purple-300 rounded-full text-xs flex items-center"
          disabled={isAnalyzing || isTyping}
        >
          <BarChart2 className="w-3 h-3 mr-1" />
          Correlação
        </button>
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre os resultados ou peça sugestões..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAnalyzing}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 flex items-center">
              <Zap className="w-3 h-3 mr-1 text-yellow-500" />
              100 tokens
            </div>
          </div>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAnalysisOptions(!showAnalysisOptions)}
              className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isAnalyzing || isTyping}
            >
              <Sparkles className="w-5 h-5" />
            </button>
            
            {showAnalysisOptions && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg p-2 w-64 border border-gray-700">
                <div className="text-sm font-medium mb-2 text-center text-gray-300">Análises Especializadas</div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleAnalysisOptionSelect('otimização')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-md text-sm flex items-center"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
                    <span>Otimização de Estratégia</span>
                  </button>
                  <button
                    onClick={() => handleAnalysisOptionSelect('risco')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-md text-sm flex items-center"
                  >
                    <TrendingUp className="w-4 h-4 mr-2 text-red-400" />
                    <span>Análise de Risco</span>
                  </button>
                  <button
                    onClick={() => handleAnalysisOptionSelect('correlação')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-md text-sm flex items-center"
                  >
                    <BarChart2 className="w-4 h-4 mr-2 text-purple-400" />
                    <span>Correlação de Ativos</span>
                  </button>
                  <button
                    onClick={() => handleAnalysisOptionSelect('sazonalidade')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-md text-sm flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-2 text-green-400" />
                    <span>Análise de Sazonalidade</span>
                  </button>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-center text-gray-400">
                  Cada análise especializada: 1000 tokens
                </div>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!input.trim() || isAnalyzing || isTyping}
            className={`p-2 rounded-md ${
              !input.trim() || isAnalyzing || isTyping
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isTyping ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Send, RefreshCw, XCircle, Bot, User, Zap, PieChart, Layers, TrendingUp, Shield } from "lucide-react";
import { useAuthStore } from "../stores/authStore";

interface AIResponseChatProps {
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  onCancelAnalysis: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  analysisResult: any;
  onMetricsReceived?: (metrics: any) => void;
  backtestData?: any;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
  tokens: number;
  icon: React.ReactNode;
}

export function AIResponseChat({
  isAnalyzing,
  setIsAnalyzing,
  onCancelAnalysis,
  error,
  setError,
  analysisResult,
  onMetricsReceived,
  backtestData
}: AIResponseChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Estou analisando seus dados de backtest. Você pode me perguntar sobre os resultados ou pedir sugestões para melhorar sua estratégia.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile, updateTokenBalance } = useAuthStore();

  const PYTHON_API_URL = "https://api.devhubtrader.com.br";

  // Removed the useEffect for scrollToBottom to prevent automatic scrolling

  useEffect(() => {
    if (analysisResult) {
      addMessage(
        "assistant",
        "Análise concluída! Aqui estão os principais resultados:\n\n" +
          `- Profit Factor: ${
            analysisResult.profitFactor?.toFixed(2) || "N/A"
          }\n` +
          `- Win Rate: ${analysisResult.winRate?.toFixed(2) || "N/A"}%\n` +
          `- Drawdown Máximo: ${
            analysisResult.maxDrawdown?.toFixed(2) || "N/A"
          }%\n` +
          `- Lucro Líquido: R$ ${
            analysisResult.netProfit?.toFixed(2) || "N/A"
          }\n\n` +
          "Você pode me perguntar mais detalhes sobre esses resultados ou pedir sugestões para melhorar a estratégia."
      );
    }
  }, [analysisResult]);

  useEffect(() => {
    if (error) {
      addMessage("assistant", `Ocorreu um erro: ${error}`);
    }
  }, [error]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const prepareMessagesWithContext = (userMessage: string) => {
    // Preparar o contexto dos dados de backtest
    let contextMessage = "";

    if (backtestData) {
      const contextData = {
        performanceMetrics: backtestData["Performance Metrics"],
        dayOfWeekAnalysis: backtestData["Day of Week Analysis"],
        monthlyAnalysis: backtestData["Monthly Analysis"],
        trades: backtestData.trades ? backtestData.trades.slice(0, 50) : [], // Limitar trades para evitar limite de tokens
        totalTrades: backtestData.trades?.length || 0,
      };

      contextMessage = `
CONTEXTO DOS DADOS DE BACKTEST:
${JSON.stringify(contextData, null, 2)}

PERGUNTA DO USUÁRIO: ${userMessage}

Por favor, analise os dados fornecidos e responda à pergunta do usuário com base nas informações reais do backtest. Forneça insights específicos e sugestões práticas para melhorar a estratégia de trading.
`;
    } else {
      contextMessage = userMessage;
    }

    // Preparar array de mensagens para enviar à API
    const messagesToSend = [
      {
        role: "user",
        content:
          "Você é um especialista em análise de trading e backtesting. Analise os dados fornecidos e forneça insights valiosos e sugestões práticas para melhorar estratégias de trading.",
      },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: contextMessage,
      },
    ];

    return messagesToSend;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Disable free-form input submission
    return;
  };

  const handleQuickPrompt = async (prompt: QuickPrompt) => {
    if (!backtestData) {
      setError("Por favor, faça upload de um arquivo de backtest primeiro.");
      return;
    }

    const tokenBalance = profile?.token_balance || 0;
    if (tokenBalance < prompt.tokens) {
      setError(`Saldo de tokens insuficiente. Esta análise requer ${prompt.tokens} tokens.`);
      return;
    }

    // Add user message to chat
    addMessage("user", prompt.prompt);
    setIsTyping(true);
    setError(null);

    try {
      // Prepare messages with context
      const messagesToSend = prepareMessagesWithContext(prompt.prompt);

      // Call the API
      const response = await fetch(`${PYTHON_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Check for errors
      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response
      if (data.content) {
        addMessage("assistant", data.content);
      } else {
        throw new Error("Resposta inválida da API");
      }
      
      // Deduzir tokens
      await updateTokenBalance(-prompt.tokens);
    } catch (err) {
      console.error("Erro ao processar prompt rápido:", err);
      setError(err instanceof Error ? err.message : "Erro ao processar análise");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              <div className="flex items-center mb-1">
                {message.role === "assistant" ? (
                  <Bot className="w-4 h-4 mr-2 text-blue-400" />
                ) : (
                  <User className="w-4 h-4 mr-2 text-gray-300" />
                )}
                <span className="text-xs font-medium">
                  {message.role === "assistant" ? "Assistente IA" : "Você"}
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
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
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

      {/* Input area */}
      <div className="border-t border-gray-800 p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => handleQuickPrompt({
              id: "portfolio-analysis",
              label: "Análise da Carteira",
              prompt: "Analise minha carteira de trading com base nos dados de backtest fornecidos. Identifique pontos fortes, fracos e oportunidades de melhoria.",
              tokens: 500,
              icon: <PieChart className="w-4 h-4" />
            })}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
            disabled={!backtestData}
          >
            <div className="flex items-center mb-2">
              <PieChart className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">Análise da Carteira</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                500 tokens
              </span>
              <Zap className="w-3 h-3 text-yellow-500" />
            </div>
          </button>
          
          <button
            onClick={() => handleQuickPrompt({
              id: "uncorrelated-portfolio",
              label: "Portfólio Sem Correlação",
              prompt: "Com base nos dados de backtest, monte um portfólio de estratégias sem correlação para diversificar riscos e maximizar retornos consistentes.",
              tokens: 1000,
              icon: <Layers className="w-4 h-4" />
            })}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
            disabled={!backtestData}
          >
            <div className="flex items-center mb-2">
              <Layers className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">Portfólio Sem Correlação</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                1000 tokens
              </span>
              <Zap className="w-3 h-3 text-yellow-500" />
            </div>
          </button>
          
          <button
            onClick={() => handleQuickPrompt({
              id: "risk-return-portfolio",
              label: "Portfólio Risco-Retorno",
              prompt: "Crie um portfólio otimizado focando na relação risco-retorno ideal com base nos dados de performance das estratégias analisadas.",
              tokens: 1000,
              icon: <TrendingUp className="w-4 h-4" />
            })}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
            disabled={!backtestData}
          >
            <div className="flex items-center mb-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">Portfólio Risco-Retorno</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                1000 tokens
              </span>
              <Zap className="w-3 h-3 text-yellow-500" />
            </div>
          </button>
          
          <button
            onClick={() => handleQuickPrompt({
              id: "consistency-portfolio",
              label: "Portfólio Consistência",
              prompt: "Monte um portfólio priorizando consistência e estabilidade de retornos, minimizando drawdowns e volatilidade excessiva.",
              tokens: 1000,
              icon: <Shield className="w-4 h-4" />
            })}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
            disabled={!backtestData}
          >
            <div className="flex items-center mb-2">
              <Shield className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">Portfólio Consistência</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                1000 tokens
              </span>
              <Zap className="w-3 h-3 text-yellow-500" />
            </div>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Use os botões acima para análises específicas..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={true}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 flex items-center">
              <Zap className="w-3 h-3 mr-1 text-yellow-500" />
              Apenas prompts pré-definidos
            </div>
          </div>
          <button
            type="submit"
            disabled={true}
            className="p-2 rounded-md bg-gray-700 text-gray-400 cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
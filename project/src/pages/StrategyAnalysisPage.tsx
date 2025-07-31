import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart,
  FileText,
  AlertTriangle,
  Check,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Zap,
  Layers,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuthStore } from "../stores/authStore";
import { openai } from "../lib/openaiClient";
import { supabase } from "../lib/supabase";
import { AIResponseChat } from "../components/AIResponseChat";

interface StrategyAnalysisResult {
  summary: string;
  marketConditions: {
    bestFor: string[];
    worstFor: string[];
  };
  riskAnalysis: {
    riskLevel: string;
    keyRisks: string[];
    mitigationStrategies: string[];
  };
  optimizationSuggestions: string[];
  tradingPlan: {
    entryRules: string[];
    exitRules: string[];
    positionSizing: string;
    timeManagement: string;
  };
}

// Utility function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff retry function
async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let currentTry = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      currentTry++;

      if (currentTry >= maxRetries) {
        throw error;
      }

      const retryAfter =
        error instanceof Error &&
        "response" in error &&
        (error as any).response?.headers?.["retry-after"];

      const waitTime = retryAfter
        ? parseInt(retryAfter) * 1000
        : initialDelay * Math.pow(2, currentTry - 1);

      console.log(`Retrying after ${waitTime}ms...`);
      await delay(waitTime);
    }
  }
}

// Function to extract structured data from text response
function extractStructuredData(text: string): StrategyAnalysisResult {
  console.log("Extracting structured data from text:", text);

  // Default values
  const result: StrategyAnalysisResult = {
    summary: "",
    marketConditions: {
      bestFor: [],
      worstFor: [],
    },
    riskAnalysis: {
      riskLevel: "Médio",
      keyRisks: [],
      mitigationStrategies: [],
    },
    optimizationSuggestions: [],
    tradingPlan: {
      entryRules: [],
      exitRules: [],
      positionSizing: "",
      timeManagement: "",
    },
  };

  // Extract summary
  const summaryMatch = text.match(
    /resumo:?\s*([\s\S]*?)(?=condições|mercado|$)/i
  );
  if (summaryMatch && summaryMatch[1]) {
    result.summary = summaryMatch[1].trim();
  } else {
    // Try to get the first paragraph as summary
    const firstParagraph = text.split("\n\n")[0];
    if (firstParagraph) {
      result.summary = firstParagraph.trim();
    }
  }

  // Extract market conditions
  const bestConditionsSection = text.match(
    /melhores\s*condições|condições\s*ideais|mercados?\s*ideais?:?\s*([\s\S]*?)(?=piores|condições\s*ruins|$)/i
  );
  if (bestConditionsSection && bestConditionsSection[1]) {
    const bestConditionsList =
      bestConditionsSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (bestConditionsList) {
      result.marketConditions.bestFor = bestConditionsList
        .map((item) => item.replace(/[-•*]\s*/, "").trim())
        .filter((item) => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = bestConditionsSection[1]
        .split("\n")
        .filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        result.marketConditions.bestFor = lines.map((line) => line.trim());
      }
    }
  }

  const worstConditionsSection = text.match(
    /piores\s*condições|condições\s*ruins|mercados?\s*ruins?:?\s*([\s\S]*?)(?=análise|risco|$)/i
  );
  if (worstConditionsSection && worstConditionsSection[1]) {
    const worstConditionsList =
      worstConditionsSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (worstConditionsList) {
      result.marketConditions.worstFor = worstConditionsList
        .map((item) => item.replace(/[-•*]\s*/, "").trim())
        .filter((item) => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = worstConditionsSection[1]
        .split("\n")
        .filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        result.marketConditions.worstFor = lines.map((line) => line.trim());
      }
    }
  }

  // Extract risk analysis
  const riskLevelMatch = text.match(/nível\s*de\s*risco:?\s*([^\n,\.]+)/i);
  if (riskLevelMatch && riskLevelMatch[1]) {
    result.riskAnalysis.riskLevel = riskLevelMatch[1].trim();
  }

  const keyRisksSection = text.match(
    /riscos?\s*principais?|principais\s*riscos?:?\s*([\s\S]*?)(?=estratégias?|mitigação|$)/i
  );
  if (keyRisksSection && keyRisksSection[1]) {
    const keyRisksList = keyRisksSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (keyRisksList) {
      result.riskAnalysis.keyRisks = keyRisksList
        .map((item) => item.replace(/[-•*]\s*/, "").trim())
        .filter((item) => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = keyRisksSection[1]
        .split("\n")
        .filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        result.riskAnalysis.keyRisks = lines.map((line) => line.trim());
      }
    }
  }

  const mitigationSection = text.match(
    /estratégias?\s*de\s*mitigação|mitigação\s*de\s*riscos?:?\s*([\s\S]*?)(?=sugestões|otimização|$)/i
  );
  if (mitigationSection && mitigationSection[1]) {
    const mitigationList = mitigationSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (mitigationList) {
      result.riskAnalysis.mitigationStrategies = mitigationList
        .map((item) => item.replace(/[-•*]\s*/, "").trim())
        .filter((item) => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = mitigationSection[1]
        .split("\n")
        .filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        result.riskAnalysis.mitigationStrategies = lines.map((line) =>
          line.trim()
        );
      }
    }
  }

  // Extract optimization suggestions
  const suggestionsSection = text.match(
    /sugestões\s*de\s*otimização|otimização|melhorias:?\s*([\s\S]*?)(?=plano|trading|$)/i
  );
  if (suggestionsSection && suggestionsSection[1]) {
    const suggestionsList = suggestionsSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (suggestionsList) {
      result.optimizationSuggestions = suggestionsList
        .map((item) => item.replace(/[-•*]\s*/, "").trim())
        .filter((item) => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = suggestionsSection[1]
        .split("\n")
        .filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        result.optimizationSuggestions = lines.map((line) => line.trim());
      }
    }
  }

  // Extract trading plan
  const entryRulesSection = text.match(
    /regras?\s*de\s*entrada:?\s*([\s\S]*?)(?=regras?\s*de\s*saída|$)/i
  );
  if (entryRulesSection && entryRulesSection[1]) {
    const entryRulesList = entryRulesSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (entryRulesList) {
      result.tradingPlan.entryRules = entryRulesList
        .map((item) => item.replace(/[-•*]\s*/, "").trim())
        .filter((item) => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = entryRulesSection[1]
        .split("\n")
        .filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        result.tradingPlan.entryRules = lines.map((line) => line.trim());
      }
    }
  }

  const exitRulesSection = text.match(
    /regras?\s*de\s*saída:?\s*([\s\S]*?)(?=dimensionamento|posição|$)/i
  );
  if (exitRulesSection && exitRulesSection[1]) {
    const exitRulesList = exitRulesSection[1].match(/[-•*]\s*([^\n]+)/g);
    if (exitRulesList) {
      result.tradingPlan.exitRules = exitRulesList
        .map((item) => item.replace(/[-•*]\s*/, "").trim())
        .filter((item) => item.length > 0);
    } else {
      // Try to extract from plain text
      const lines = exitRulesSection[1]
        .split("\n")
        .filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        result.tradingPlan.exitRules = lines.map((line) => line.trim());
      }
    }
  }

  const positionSizingMatch = text.match(
    /dimensionamento\s*de\s*posição|tamanho\s*de\s*posição|position\s*sizing:?\s*([^\n]+)/i
  );
  if (positionSizingMatch && positionSizingMatch[1]) {
    result.tradingPlan.positionSizing = positionSizingMatch[1].trim();
  }

  const timeManagementMatch = text.match(
    /gerenciamento\s*de\s*tempo|horários:?\s*([^\n]+)/i
  );
  if (timeManagementMatch && timeManagementMatch[1]) {
    result.tradingPlan.timeManagement = timeManagementMatch[1].trim();
  }

  // Ensure we have at least some data in each section
  if (!result.summary) {
    result.summary = "Estratégia com potencial para ser otimizada";
  }

  if (result.marketConditions.bestFor.length === 0) {
    result.marketConditions.bestFor = [
      "Mercados em tendência",
      "Volatilidade moderada",
    ];
  }

  if (result.marketConditions.worstFor.length === 0) {
    result.marketConditions.worstFor = [
      "Mercados lateralizados",
      "Volatilidade extrema",
    ];
  }

  if (result.riskAnalysis.keyRisks.length === 0) {
    result.riskAnalysis.keyRisks = [
      "Drawdown em períodos de alta volatilidade",
      "Falsos sinais em mercados lateralizados",
    ];
  }

  if (result.riskAnalysis.mitigationStrategies.length === 0) {
    result.riskAnalysis.mitigationStrategies = [
      "Implementar stop loss adequado",
      "Filtrar sinais com indicadores adicionais",
    ];
  }

  if (result.optimizationSuggestions.length === 0) {
    result.optimizationSuggestions = [
      "Otimizar parâmetros dos indicadores",
      "Adicionar filtros para reduzir falsos sinais",
    ];
  }

  if (result.tradingPlan.entryRules.length === 0) {
    result.tradingPlan.entryRules = [
      "Entrar quando houver confirmação de tendência",
      "Verificar volume antes de entrar",
    ];
  }

  if (result.tradingPlan.exitRules.length === 0) {
    result.tradingPlan.exitRules = [
      "Sair quando o preço atingir o alvo de lucro",
      "Sair quando o stop loss for atingido",
    ];
  }

  if (!result.tradingPlan.positionSizing) {
    result.tradingPlan.positionSizing = "Aplicar regra de 2% de risco por trade: Position Size = Account Risk ÷ Trade Risk. Máximo 1% de risco por operação para gestão conservadora.";
  }

  if (!result.tradingPlan.timeManagement) {
    result.tradingPlan.timeManagement =
      "Operar nos horários de maior liquidez do mercado";
  }

  return result;
}

export function StrategyAnalysisPage() {
  const navigate = useNavigate();
  const { profile, updateTokenBalance } = useAuthStore();
  const [strategyDescription, setStrategyDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<StrategyAnalysisResult | null>(null);
  const [showMarketConditions, setShowMarketConditions] = useState(true);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(true);
  const [showOptimization, setShowOptimization] = useState(true);
  const [showTradingPlan, setShowTradingPlan] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [loadingSavedAnalyses, setLoadingSavedAnalyses] = useState(false);
  const [useAssistant, setUseAssistant] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [analysisTimeout, setAnalysisTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(
    null
  );
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  // Timer for tracking analysis duration
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isAnalyzing && analysisStartTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - analysisStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else if (!isAnalyzing) {
      setElapsedTime(0);
      setAnalysisStartTime(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAnalyzing, analysisStartTime]);

  const loadSavedAnalyses = async () => {
    try {
      setLoadingSavedAnalyses(true);
      const { data, error } = await supabase
        .from("strategy_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setSavedAnalyses(data || []);
    } catch (error) {
      console.error("Error loading saved analyses:", error);
    } finally {
      setLoadingSavedAnalyses(false);
    }
  };

  const analyzeStrategyWithAssistant = async () => {
    if (!strategyDescription.trim()) {
      setError("Por favor, descreva sua estratégia antes de analisar.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setShowChat(true);
    setAnalysisStartTime(Date.now());

    // Set a timeout for the analysis (2 minutes)
    const timeout = setTimeout(() => {
      if (isAnalyzing) {
        setError(
          "A análise demorou muito tempo e foi cancelada. A API OpenAI pode estar sobrecarregada. Por favor, tente novamente mais tarde."
        );
        setIsAnalyzing(false);
      }
    }, 120000); // 2 minutes

    setAnalysisTimeout(timeout);

    try {
      // Check if user has enough tokens
      const tokenBalance = profile?.token_balance || 0;
      if (tokenBalance < 1000) {
        setError(
          "Saldo de tokens insuficiente. Esta análise requer 1000 tokens. Clique no contador de tokens para comprar mais."
        );
        setIsAnalyzing(false);
        clearTimeout(timeout);
        setAnalysisTimeout(null);
        return;
      }

      const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID;

      if (!assistantId) {
        throw new Error("Assistant ID não configurado.");
      }

      // Create a thread
      const thread = await openai.beta.threads.create();

      // Add a message to the thread
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Analise a seguinte estratégia de trading e forneça uma análise detalhada, incluindo condições de mercado ideais, análise de risco, sugestões de otimização e um plano de trading estruturado.

Estratégia:
${strategyDescription}

Por favor, forneça uma análise estruturada com seções claras para:
1. Resumo da estratégia
2. Condições de mercado ideais e ruins
3. Análise de risco (nível, riscos principais, estratégias de mitigação)
4. Sugestões de otimização
5. Plano de trading (regras de entrada, regras de saída, dimensionamento de posição, gerenciamento de tempo)

IMPORTANTE sobre Position Sizing:
- Aplique a regra de 2% de risco por trade: Position Size = Account Risk ÷ Trade Risk
- Recomende máximo 1% de risco por operação para gestão conservadora
- Considere o tipo de ativo (ações vs futuros) para determinar o tamanho da posição
- Inclua considerações sobre leverage e margem

NÃO retorne um objeto JSON. Apenas forneça uma análise de texto clara e bem estruturada com seções.`,
      });

      // Create a run with the assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
      });

      // Poll for the run to complete
      let runStatus;
      do {
        await delay(1000); // Wait 1 second between polls
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        console.log(`Run status: ${runStatus.status}`);

        if (runStatus.status === "failed") {
          throw new Error(
            "Analysis run failed: " +
              (runStatus.last_error?.message || "Unknown error")
          );
        }
      } while (runStatus.status !== "completed");

      // Get the messages from the thread
      const messages = await openai.beta.threads.messages.list(thread.id);

      // Find the assistant's response
      const assistantMessage = messages.data.find(
        (msg) => msg.role === "assistant"
      );
      if (!assistantMessage) {
        throw new Error("No response from assistant");
      }

      // Extract the content from the message
      const content = assistantMessage.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response format");
      }

      const textContent = content.text.value;
      console.log("Received text content:", textContent);

      try {
        // Extract and process the text response
        const result = extractStructuredData(textContent);

        setAnalysisResult(result);

        // Save analysis and update tokens
        await saveAnalysisToDatabase(result);
        await updateTokenBalance(-1000);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error(
          `Erro ao processar a resposta da análise: ${parseError.message}`
        );
      }
    } catch (error) {
      console.error("Error analyzing strategy:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao analisar a estratégia.";
      setError(errorMessage);

      if (errorMessage.includes("Rate limit")) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setIsAnalyzing(false);
      if (analysisTimeout) {
        clearTimeout(analysisTimeout);
        setAnalysisTimeout(null);
      }
    }
  };

  const analyzeStrategyWithChatCompletion = async () => {
    if (!strategyDescription.trim()) {
      setError("Por favor, descreva sua estratégia antes de analisar.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setShowChat(true);
    setAnalysisStartTime(Date.now());

    // Set a timeout for the analysis (2 minutes)
    const timeout = setTimeout(() => {
      if (isAnalyzing) {
        setError(
          "A análise demorou muito tempo e foi cancelada. A API OpenAI pode estar sobrecarregada. Por favor, tente novamente mais tarde."
        );
        setIsAnalyzing(false);
      }
    }, 120000); // 2 minutes

    setAnalysisTimeout(timeout);

    try {
      // Check if user has enough tokens
      const tokenBalance = profile?.token_balance || 0;
      if (tokenBalance < 1000) {
        setError(
          "Saldo de tokens insuficiente. Esta análise requer 1000 tokens. Clique no contador de tokens para comprar mais."
        );
        setIsAnalyzing(false);
        clearTimeout(timeout);
        setAnalysisTimeout(null);
        return;
      }

      // Updated prompt to be more explicit about text format
      const prompt = `
Analise a seguinte estratégia de trading e forneça uma análise detalhada, incluindo condições de mercado ideais, análise de risco, sugestões de otimização e um plano de trading estruturado.

Estratégia:
${strategyDescription}

Por favor, forneça uma análise estruturada com seções claras para:
1. Resumo da estratégia
2. Condições de mercado ideais e ruins
3. Análise de risco (nível, riscos principais, estratégias de mitigação)
4. Sugestões de otimização
5. Plano de trading (regras de entrada, regras de saída, dimensionamento de posição, gerenciamento de tempo)

IMPORTANTE sobre Position Sizing:
- Aplique a regra de 2% de risco por trade: Position Size = Account Risk ÷ Trade Risk
- Recomende máximo 1% de risco por operação para gestão conservadora
- Considere o tipo de ativo (ações vs futuros) para determinar o tamanho da posição
- Inclua considerações sobre leverage e margem

NÃO retorne um objeto JSON. Apenas forneça uma análise de texto clara e bem estruturada com seções.`;

      // Call OpenAI API with retry logic
      const response = await retryWithExponentialBackoff(
        async () => {
          try {
            const completion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "assistant",
                  content:
                    "Você é um especialista em análise de estratégias de trading. Forneça análises detalhadas e estruturadas.",
                },
                { role: "user", content: prompt },
              ],
              temperature: 0.2,
            });

            setRetryCount(0);
            return completion;
          } catch (error: any) {
            console.error("OpenAI API error:", error);
            if (error.status === 429) {
              const retryAfter = error.response?.headers?.["retry-after"] || 8;
              throw new Error(
                `Rate limit atingido. Tentando novamente em ${retryAfter} segundos...`
              );
            }
            throw error;
          }
        },
        3,
        2000
      );

      // Process the response
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Resposta vazia da API.");
      }

      console.log("OpenAI response content:", content);

      try {
        // Extract and process the text response
        const result = extractStructuredData(content);

        setAnalysisResult(result);

        // Save analysis and update tokens
        await saveAnalysisToDatabase(result);
        await updateTokenBalance(-1000);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error(
          `Erro ao processar a resposta da análise: ${parseError.message}`
        );
      }
    } catch (error) {
      console.error("Error analyzing strategy:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao analisar a estratégia.";
      setError(errorMessage);

      if (errorMessage.includes("Rate limit")) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setIsAnalyzing(false);
      if (analysisTimeout) {
        clearTimeout(analysisTimeout);
        setAnalysisTimeout(null);
      }
    }
  };

  const analyzeStrategy = async () => {
    if (useAssistant) {
      await analyzeStrategyWithAssistant();
    } else {
      await analyzeStrategyWithChatCompletion();
    }
  };

  const handleCancelAnalysis = () => {
    if (analysisTimeout) {
      clearTimeout(analysisTimeout);
      setAnalysisTimeout(null);
    }
    setIsAnalyzing(false);
    setError("Análise cancelada pelo usuário.");
  };

  const saveAnalysisToDatabase = async (result: StrategyAnalysisResult) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("strategy_analyses").insert({
        user_id: user.id,
        analysis_data: result,
      });

      if (error) throw error;

      // Refresh saved analyses
      await loadSavedAnalyses();
    } catch (error) {
      console.error("Error saving analysis to database:", error);
      // Don't show error to user, just log it
    }
  };

  const downloadAnalysisReport = () => {
    if (!analysisResult) return;

    const report = `
# Análise de Estratégia de Trading

## Resumo
${analysisResult.summary}

## Condições de Mercado
### Melhores Condições
${analysisResult.marketConditions.bestFor.map((c) => `- ${c}`).join("\n")}

### Piores Condições
${analysisResult.marketConditions.worstFor.map((c) => `- ${c}`).join("\n")}

## Análise de Risco
Nível de Risco: ${analysisResult.riskAnalysis.riskLevel}

### Riscos Principais
${analysisResult.riskAnalysis.keyRisks.map((r) => `- ${r}`).join("\n")}

### Estratégias de Mitigação
${analysisResult.riskAnalysis.mitigationStrategies
  .map((s) => `- ${s}`)
  .join("\n")}

## Sugestões de Otimização
${analysisResult.optimizationSuggestions.map((s) => `- ${s}`).join("\n")}

## Plano de Trading
### Regras de Entrada
${analysisResult.tradingPlan.entryRules.map((r) => `- ${r}`).join("\n")}

### Regras de Saída
${analysisResult.tradingPlan.exitRules.map((r) => `- ${r}`).join("\n")}

### Dimensionamento de Posição
${analysisResult.tradingPlan.positionSizing}

### Gerenciamento de Tempo
${analysisResult.tradingPlan.timeManagement}

Relatório gerado em: ${new Date().toLocaleString()}
`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analise-estrategia.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to format risk level with color and description
  const formatRiskLevel = (riskLevel: string) => {
    const level = riskLevel.toLowerCase();

    if (level.includes("alto") || level.includes("elevado")) {
      return (
        <span className="text-red-400">
          Alto - Recomendado para traders experientes
        </span>
      );
    } else if (level.includes("médio") || level.includes("moderado")) {
      return (
        <span className="text-yellow-400">
          Médio - Adequado para traders intermediários
        </span>
      );
    } else if (level.includes("baixo")) {
      return (
        <span className="text-green-400">Baixo - Adequado para iniciantes</span>
      );
    }

    return <span>{riskLevel}</span>;
  };

  const loadSavedAnalysis = (analysisData: any) => {
    setAnalysisResult(analysisData);
    setShowChat(true);
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/robots")}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Voltar para robôs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Análise de Estratégia</h1>
          </div>

          {isAnalyzing && (
            <div className="flex items-center bg-blue-900 bg-opacity-20 px-4 py-2 rounded-md">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin text-blue-400" />
              <span className="text-blue-300">
                Analisando... {elapsedTime}s
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Usar Assistente:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAssistant}
                  onChange={() => setUseAssistant(!useAssistant)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Strategy Input */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 text-blue-400 mr-2" />
                Descreva sua Estratégia
              </h2>

              <textarea
                value={strategyDescription}
                onChange={(e) => setStrategyDescription(e.target.value)}
                placeholder="Descreva sua estratégia de trading em detalhes. Inclua informações sobre indicadores utilizados, regras de entrada e saída, gerenciamento de risco, timeframes, etc."
                className="w-full h-64 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {error && !showChat && (
                <div className="mt-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center text-red-500">
                  <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p>{error}</p>
                  {error.includes("Rate limit") && (
                    <p className="text-sm mt-1">
                      Tentativa {retryCount}/3. Aguarde alguns segundos e tente
                      novamente.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={analyzeStrategy}
                disabled={!strategyDescription.trim() || isAnalyzing}
                className={`w-full mt-4 py-2 rounded-md flex items-center justify-center ${
                  !strategyDescription.trim() || isAnalyzing
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <BarChart className="w-5 h-5 mr-2" />
                    Analisar Estratégia
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 mt-2 text-center">
                Esta análise consumirá 1000 tokens
              </p>
            </div>

            {/* Saved Analyses */}
            {savedAnalyses.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Layers className="w-5 h-5 text-blue-400 mr-2" />
                  Análises Recentes
                </h2>

                <div className="space-y-3">
                  {savedAnalyses.map((analysis, index) => (
                    <button
                      key={index}
                      onClick={() => loadSavedAnalysis(analysis.analysis_data)}
                      className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left flex items-center"
                    >
                      <FileText className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          Análise {index + 1}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(analysis.created_at).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Section */}
            {showChat && (
              <div className="bg-gray-800 rounded-lg overflow-hidden h-[500px] mb-6">
                <AIResponseChat
                  isAnalyzing={isAnalyzing}
                  setIsAnalyzing={setIsAnalyzing}
                  onCancelAnalysis={handleCancelAnalysis}
                  error={error}
                  setError={setError}
                  analysisResult={analysisResult}
                />
              </div>
            )}

            {!showChat && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 text-yellow-400 mr-2" />
                  Dicas para Descrição
                </h2>

                <div className="space-y-4 text-gray-300">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="font-medium mb-1">Inclua os Indicadores</p>
                    <p className="text-sm">
                      Descreva quais indicadores técnicos sua estratégia utiliza
                      (ex: médias móveis, RSI, Bollinger Bands).
                    </p>
                  </div>

                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="font-medium mb-1">
                      Regras de Entrada e Saída
                    </p>
                    <p className="text-sm">
                      Explique claramente o que dispara suas entradas e saídas
                      no mercado.
                    </p>
                  </div>

                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="font-medium mb-1">Gerenciamento de Risco</p>
                    <p className="text-sm">
                      Detalhe como você define stop loss, take profit e tamanho
                      das posições.
                    </p>
                  </div>

                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="font-medium mb-1">Timeframes e Mercados</p>
                    <p className="text-sm">
                      Mencione em quais timeframes e mercados você aplica esta
                      estratégia.
                    </p>
                  </div>

                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="font-medium mb-1">Filtros e Condições</p>
                    <p className="text-sm">
                      Descreva quaisquer filtros ou condições especiais que você
                      usa para melhorar a qualidade dos sinais.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Analysis Results */}
          <div className="lg:col-span-2">
            {analysisResult ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FileText className="w-5 h-5 text-blue-400 mr-2" />
                    Resumo da Estratégia
                  </h2>
                  <p className="text-gray-300">{analysisResult.summary}</p>
                </div>

                {/* Market Conditions */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center">
                      <TrendingUp className="w-5 h-5 text-blue-400 mr-2" />
                      Condições de Mercado
                    </h2>
                    <button
                      onClick={() =>
                        setShowMarketConditions(!showMarketConditions)
                      }
                      className="p-1.5 hover:bg-gray-700 rounded-md"
                    >
                      {showMarketConditions ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {showMarketConditions && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h5 className="text-sm font-medium mb-2 text-green-400">
                          Melhores Condições
                        </h5>
                        <ul className="space-y-1.5">
                          {analysisResult.marketConditions.bestFor.map(
                            (condition, index) => (
                              <li
                                key={index}
                                className="flex items-start text-sm"
                              >
                                <Check className="w-4 h-4 text-green-500 mr-1.5 flex-shrink-0 mt-0.5" />
                                <span>{condition}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h5 className="text-sm font-medium mb-2 text-red-400">
                          Piores Condições
                        </h5>
                        <ul className="space-y-1.5">
                          {analysisResult.marketConditions.worstFor.map(
                            (condition, index) => (
                              <li
                                key={index}
                                className="flex items-start text-sm"
                              >
                                <AlertTriangle className="w-4 h-4 text-red-500 mr-1.5 flex-shrink-0 mt-0.5" />
                                <span>{condition}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Risk Analysis */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                      Análise de Risco
                    </h2>
                    <button
                      onClick={() => setShowRiskAnalysis(!showRiskAnalysis)}
                      className="p-1.5 hover:bg-gray-700 rounded-md"
                    >
                      {showRiskAnalysis ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {showRiskAnalysis && (
                    <>
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-1">
                          Nível de Risco
                        </p>
                        <div
                          className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                            analysisResult.riskAnalysis.riskLevel
                              .toLowerCase()
                              .includes("alto")
                              ? "bg-red-500 bg-opacity-20 text-red-400"
                              : analysisResult.riskAnalysis.riskLevel
                                  .toLowerCase()
                                  .includes("médio")
                              ? "bg-yellow-500 bg-opacity-20 text-yellow-400"
                              : "bg-green-500 bg-opacity-20 text-green-400"
                          }`}
                        >
                          {formatRiskLevel(
                            analysisResult.riskAnalysis.riskLevel
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Riscos Principais
                          </h3>
                          <ul className="space-y-2">
                            {analysisResult.riskAnalysis.keyRisks.map(
                              (risk, index) => (
                                <li key={index} className="flex items-start">
                                  <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                                  <span>{risk}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Estratégias de Mitigação
                          </h3>
                          <ul className="space-y-2">
                            {analysisResult.riskAnalysis.mitigationStrategies.map(
                              (strategy, index) => (
                                <li key={index} className="flex items-start">
                                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                  <span>{strategy}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Optimization Suggestions */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center">
                      <Zap className="w-5 h-5 text-purple-400 mr-2" />
                      Sugestões de Otimização
                    </h2>
                    <button
                      onClick={() => setShowOptimization(!showOptimization)}
                      className="p-1.5 hover:bg-gray-700 rounded-md"
                    >
                      {showOptimization ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {showOptimization && (
                    <div className="space-y-3">
                      {analysisResult.optimizationSuggestions.map(
                        (suggestion, index) => (
                          <div
                            key={index}
                            className="bg-gray-700 p-4 rounded-lg"
                          >
                            <div className="flex items-start">
                              <div className="bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">
                                {index + 1}
                              </div>
                              <p>{suggestion}</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Trading Plan */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center">
                      <Layers className="w-5 h-5 text-blue-400 mr-2" />
                      Plano de Trading
                    </h2>
                    <button
                      onClick={() => setShowTradingPlan(!showTradingPlan)}
                      className="p-1.5 hover:bg-gray-700 rounded-md"
                    >
                      {showTradingPlan ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {showTradingPlan && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Regras de Entrada
                          </h3>
                          <ul className="space-y-2">
                            {analysisResult.tradingPlan.entryRules.map(
                              (rule, index) => (
                                <li key={index} className="flex items-start">
                                  <div className="bg-green-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium mr-2 flex-shrink-0">
                                    {index + 1}
                                  </div>
                                  <span>{rule}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Regras de Saída
                          </h3>
                          <ul className="space-y-2">
                            {analysisResult.tradingPlan.exitRules.map(
                              (rule, index) => (
                                <li key={index} className="flex items-start">
                                  <div className="bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-medium mr-2 flex-shrink-0">
                                    {index + 1}
                                  </div>
                                  <span>{rule}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-2">
                            Dimensionamento de Posição
                          </h3>
                          <p>{analysisResult.tradingPlan.positionSizing}</p>
                        </div>

                        <div className="bg-gray-700 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-2">
                            Gerenciamento de Tempo
                          </h3>
                          <p>{analysisResult.tradingPlan.timeManagement}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={downloadAnalysisReport}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Baixar Relatório
                  </button>

                  <button
                    onClick={() => {
                      navigate("/robots");
                    }}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-md flex items-center justify-center"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Consultar IA para Melhorias
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center justify-center text-center h-full">
                <BarChart className="w-16 h-16 text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Nenhuma análise disponível
                </h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  Descreva sua estratégia de trading para receber uma análise
                  detalhada e recomendações personalizadas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

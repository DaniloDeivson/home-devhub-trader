import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, XCircle, Bot, User, Zap, PieChart, Layers, TrendingUp, Shield } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { buildApiUrl } from '../config/api';

interface AIResponseChatProps {
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  onCancelAnalysis: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  analysisResult: unknown;
  onMetricsReceived?: (metrics: unknown) => void;
  backtestData?: unknown;
  fileResults?: Record<string, unknown>;
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
  analysisMode?: "single" | "portfolio";
}

export function AIResponseChat({
  isAnalyzing,
  setIsAnalyzing,
  // onCancelAnalysis, // not used in this component's current UI
  error,
  setError,
  analysisResult,
  onMetricsReceived,
  backtestData,
  fileResults
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
  const summarySentRef = useRef<boolean>(false);
  const { profile, updateTokenBalance } = useAuthStore();

  const PYTHON_API_URL = buildApiUrl('/chat');

  // Determinar quantidade de arquivos/estratégias disponíveis
  const numFiles = (fileResults && Object.keys(fileResults).length) || (backtestData ? 1 : 0);
  const canSingle = !!backtestData && !isAnalyzing && numFiles === 1;
  const canPortfolio = !!backtestData && !isAnalyzing && numFiles >= 2;

  // Removed the useEffect for scrollToBottom to prevent automatic scrolling

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
    };
    setMessages((prev) => [...prev, newMessage]);
    // garantir scroll ao fim após cada mensagem
    setTimeout(scrollToBottom, 0);
  }, []);

  useEffect(() => {
    if (summarySentRef.current) return;
    const ar = (analysisResult || {}) as Record<string, unknown>;

    const parseNumberLike = (val: unknown): number | undefined => {
      if (typeof val === 'number' && isFinite(val)) return val;
      if (typeof val === 'string') {
        const hasParens = val.includes('(') && val.includes(')');
        const cleaned = val
          .replace(/[R$r$\s]/gi, '')
          .replace(/\./g, '')
          .replace(',', '.')
          .replace(/[()%]/g, '');
        const num = parseFloat(cleaned);
        if (!isNaN(num)) return hasParens ? -Math.abs(num) : num;
      }
      return undefined;
    };

    const tryKeys = (obj: Record<string, unknown> | undefined, keys: string[]): number | undefined => {
      if (!obj) return undefined;
      for (const key of keys) {
        const parsed = parseNumberLike(obj[key]);
        if (parsed !== undefined) return parsed;
      }
      return undefined;
    };

    const extractPnl = (trade: Record<string, unknown>): number => {
      const keys = ['pnl','PnL','net_profit','resultado','profit','result','netProfit','lucroLiquido','lucro','gain','loss','P/L','p_l'];
      for (const key of keys) {
        if (key in trade) {
          const parsed = parseNumberLike(trade[key]);
          if (typeof parsed === 'number' && isFinite(parsed)) return parsed;
        }
      }
      return 0;
    };

    const calcFromTrades = (trades: Array<Record<string, unknown>> | undefined) => {
      if (!Array.isArray(trades) || trades.length === 0) return undefined;
      let grossProfit = 0, grossLossAbs = 0, net = 0, cum = 0, peak = 0, maxDD = 0;
      trades.forEach(t => {
        const pnl = extractPnl(t) ?? 0;
        net += pnl;
        if (pnl > 0) grossProfit += pnl; else if (pnl < 0) grossLossAbs += Math.abs(pnl);
        cum += pnl;
        if (cum > peak) peak = cum;
        const dd = peak - cum;
        if (dd > maxDD) maxDD = dd;
      });
      const pf = grossLossAbs > 0 ? grossProfit / grossLossAbs : (grossProfit > 0 ? 999 : 0);
      const ddPctPeak = peak > 0 ? (maxDD / peak) * 100 : undefined;
      return { profitFactor: pf, netProfit: net, maxDDPctPeak: ddPctPeak };
    };

    // Origem 1: analysisResult raiz e campos aninhados
    const consolidatedApi = (ar['consolidated_api'] || {}) as Record<string, unknown>;
    const consolidatedCalc = (ar['consolidated_calc'] || {}) as Record<string, unknown>;

    // Origem 2: backtestData -> Performance Metrics e cálculo local a partir de trades
    let pm: Record<string, unknown> | undefined = undefined;
    let calcLocal: { profitFactor?: number; netProfit?: number; maxDDPctPeak?: number } | undefined = undefined;
    if (backtestData && typeof backtestData === 'object') {
      const bd = backtestData as Record<string, unknown>;
      const bdObj = bd as { [key: string]: unknown };
      const pmRaw = bdObj['Performance Metrics'];
      if (pmRaw && typeof pmRaw === 'object') pm = pmRaw as Record<string, unknown>;
      const trsRaw = bdObj['trades'];
      const trs = Array.isArray(trsRaw) ? (trsRaw as Array<Record<string, unknown>>) : undefined;
      calcLocal = calcFromTrades(trs);
    }

    const profitFactor =
      tryKeys(ar, ['profitFactor','Profit Factor']) ??
      tryKeys(consolidatedApi, ['profitFactor','Profit Factor']) ??
      tryKeys(consolidatedCalc, ['profitFactor']) ??
      (calcLocal?.profitFactor);

    const winRatePct =
      tryKeys(ar, ['winRate','winRatePct','Win Rate (%)']) ??
      tryKeys(consolidatedApi, ['winRatePct','Win Rate (%)']) ??
      tryKeys(pm, ['Win Rate (%)']);

    const maxDrawdownPct =
      tryKeys(ar, ['maxDrawdownPct','Max Drawdown (%)']) ??
      tryKeys(consolidatedApi, ['maxDDPct','Max Drawdown (%)']) ??
      tryKeys(consolidatedCalc, ['maxDDPctPeak']) ??
      (calcLocal?.maxDDPctPeak);

    const netProfit =
      tryKeys(ar, ['netProfit','Net Profit']) ??
      tryKeys(consolidatedApi, ['netProfit','Net Profit']) ??
      tryKeys(consolidatedCalc, ['netProfit']) ??
      (calcLocal?.netProfit);

    // Se nada foi encontrado, não adicionar mensagem com N/A
    if (
      profitFactor === undefined &&
      winRatePct === undefined &&
      maxDrawdownPct === undefined &&
      netProfit === undefined
    ) {
      return;
    }

    addMessage(
      'assistant',
      `Análise concluída! Aqui estão os principais resultados:\n\n- Profit Factor: ${profitFactor !== undefined ? profitFactor.toFixed(2) : 'N/A'}\n- Win Rate: ${winRatePct !== undefined ? winRatePct.toFixed(2) : 'N/A'}%\n- Drawdown Máximo: ${maxDrawdownPct !== undefined ? maxDrawdownPct.toFixed(2) : 'N/A'}%\n- Lucro Líquido: R$ ${netProfit !== undefined ? netProfit.toFixed(2) : 'N/A'}\n\nVocê pode me perguntar mais detalhes sobre esses resultados ou pedir sugestões para melhorar a estratégia.`
    );
    summarySentRef.current = true;
  }, [analysisResult, backtestData, addMessage]);

  useEffect(() => {
    if (error) {
      addMessage("assistant", `Ocorreu um erro: ${error}`);
    }
  }, [error, addMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  
  // Gera um resumo numérico rápido a partir do contexto disponível
  // buildSummaryFromContext removido para evitar duplicidade de mensagens automáticas

  const prepareMessagesWithContext = (userMessage: string, analysisMode: "single" | "portfolio" = "single") => {
    // Preparar o contexto dos dados de backtest
    let contextMessage = "";
    const selectedHeader = analysisMode === "portfolio" ? "[2 OU MAIS ESTRATÉGIAS]" : "[Estratégia Individual]";

    if (backtestData) {
      const bd = backtestData as Record<string, unknown>;
      const bdObj = bd as { [key: string]: unknown };
      const pmRaw = bdObj["Performance Metrics"];
      const pm: Record<string, unknown> =
        typeof pmRaw === 'object' && pmRaw !== null ? (pmRaw as Record<string, unknown>) : {};
      // Helpers de cálculo local (sem enviar trades)
      const parseNumberLike = (val: unknown): number | undefined => {
        if (typeof val === 'number' && isFinite(val)) return val;
        if (typeof val === 'string') {
          const hasParens = val.includes('(') && val.includes(')');
          const cleaned = val
            .replace(/[R$r$\s]/gi, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[()]/g, '');
          const num = parseFloat(cleaned);
          if (!isNaN(num)) return hasParens ? -Math.abs(num) : num;
        }
        return undefined;
      };

      const extractPnl = (trade: Record<string, unknown>): number => {
        const keys = [
          'pnl', 'PnL', 'net_profit', 'resultado', 'profit', 'result',
          'netProfit', 'lucroLiquido', 'lucro', 'gain', 'loss', 'P/L', 'p_l'
        ];
        for (const key of keys) {
          if (key in trade) {
            const parsed = parseNumberLike((trade as Record<string, unknown>)[key]);
            if (typeof parsed === 'number' && isFinite(parsed)) return parsed;
          }
        }
        return 0;
      };

      const calcFromTrades = (trades: Array<Record<string, unknown>>) => {
        if (!Array.isArray(trades) || trades.length === 0) return undefined;
        let grossProfit = 0;
        let grossLossAbs = 0;
        let net = 0;
        let cum = 0;
        let peak = 0;
        let maxDD = 0;
        const getTime = (t: Record<string, unknown>): number => {
          const candidateKeys = ["entry_date", "date", "exit_date"] as const;
          let raw: unknown = undefined;
          for (const key of candidateKeys) {
            const val = (t as Record<string, unknown>)[key];
            if (val !== undefined && val !== null) {
              raw = val;
              break;
            }
          }
          if (raw === undefined || raw === null) return 0;
          if (typeof raw !== 'string' && typeof raw !== 'number') return 0;
          const d = new Date(raw);
          const ts = d.getTime();
          return Number.isFinite(ts) ? ts : 0;
        };
        const ordered = [...trades].sort((a, b) => getTime(a) - getTime(b));
        ordered.forEach(t => {
          const pnl = extractPnl(t) ?? 0;
          net += pnl;
          if (pnl > 0) grossProfit += pnl; else if (pnl < 0) grossLossAbs += Math.abs(pnl);
          cum += pnl;
          if (cum > peak) peak = cum;
          const dd = peak - cum;
          if (dd > maxDD) maxDD = dd;
        });
        const pf = grossLossAbs > 0 ? grossProfit / grossLossAbs : (grossProfit > 0 ? 999 : 0);
        const ddPctPeak = peak > 0 ? (maxDD / peak) * 100 : 0;
        // Evitar retornar zeros não informativos: se tudo zerado, considerar cálculo inválido
        const allZero = grossProfit === 0 && grossLossAbs === 0 && net === 0 && maxDD === 0;
        if (ordered.length > 0 && allZero) return undefined;
        return { profitFactor: pf, netProfit: net, grossProfit, grossLossAbs, maxDD, maxDDPctPeak: ddPctPeak, totalTrades: ordered.length };
      };

      const extractPerfApi = (p: Record<string, unknown>) => ({
        profitFactor: parseNumberLike(p["Profit Factor"]),
        winRatePct: parseNumberLike(p["Win Rate (%)"]),
        netProfit: parseNumberLike(p["Net Profit"]),
        maxDD: parseNumberLike(p["Max Drawdown ($)"]),
        maxDDPct: parseNumberLike(p["Max Drawdown (%)"]),
        sharpe: parseNumberLike(p["Sharpe Ratio"]),
        totalTrades: parseNumberLike(p["Total Trades"]),
      });

      const consolidated_api = extractPerfApi(pm);
      const bdTradesRaw = bdObj["trades"];
      const consolidated_calc = calcFromTrades(Array.isArray(bdTradesRaw) ? (bdTradesRaw as Array<Record<string, unknown>>) : []);

      const strategies = fileResults && Object.keys(fileResults).length > 0
        ? Object.entries(fileResults).map(([name, res]) => {
            const resObj = res as { [key: string]: unknown };
            const rpRaw = resObj["Performance Metrics"];
            const rp: Record<string, unknown> =
              typeof rpRaw === 'object' && rpRaw !== null ? (rpRaw as Record<string, unknown>) : {};
            const trsRaw = resObj["trades"];
            const trs: Array<Record<string, unknown>> = Array.isArray(trsRaw) ? (trsRaw as Array<Record<string, unknown>>) : [];
            const api = extractPerfApi(rp);
            const calc = calcFromTrades(trs);
            // Fallback automático: se calc vier indefinido/zerado, usar dados reais da API
            const calcIsInvalid = !calc || (
              calc.totalTrades > 0 &&
              (calc.netProfit === 0 && calc.grossProfit === 0 && calc.grossLossAbs === 0 && calc.maxDD === 0)
            );
            const gpApi = parseNumberLike(rp["Gross Profit"]);
            const glApi = parseNumberLike(rp["Gross Loss"]);
            const calcFromApi = calcIsInvalid
              ? {
                  profitFactor: parseNumberLike(rp["Profit Factor"]),
                  netProfit: parseNumberLike(rp["Net Profit"]),
                  grossProfit: gpApi,
                  grossLossAbs: typeof glApi === 'number' ? Math.abs(glApi) : undefined,
                  maxDD: parseNumberLike(rp["Max Drawdown ($)"]),
                  maxDDPctPeak: parseNumberLike(rp["Max Drawdown (%)"]), // usar % do API como proxy
                  totalTrades: parseNumberLike(rp["Total Trades"]),
                }
              : calc;
            return { name, api, calc: calcFromApi };
           })
        : [];
      const contextData = { consolidated_api, consolidated_calc, strategies };

      contextMessage = `
CONTEXTO DOS DADOS DE BACKTEST:
${JSON.stringify(contextData)}

PERGUNTA DO USUÁRIO: ${userMessage}

Por favor, analise os dados fornecidos e responda à pergunta do usuário com base nas informações reais do backtest. Forneça insights específicos e sugestões práticas para melhorar a estratégia de trading.
`;
    } else {
      contextMessage = userMessage;
    }

    // Prefixar o cabeçalho selecionado ao contexto (sempre)
    contextMessage = `${selectedHeader}\n` + contextMessage;

    // Enxugar instruções para evitar estouro de tokens
    const instructionContent = `${selectedHeader}\n` + (
      analysisMode === "portfolio"
        ? "Analise o portfólio com base apenas nas métricas fornecidas (Sharpe combinado, drawdown consolidado, profit factor, correlação/diversificação e contribuição por estratégia). Termine com diagnóstico e 3–6 recomendações objetivas."
        : "Analise a estratégia individual com base apenas nas métricas fornecidas (Sharpe, profit factor, drawdown em R$ e %, taxa de acerto, payoff e tamanho de amostra). Termine com diagnóstico e 3–6 recomendações objetivas."
    );

    // Retornar somente instruções curtas + contexto para reduzir tokens
    return [
      { role: "user", content: instructionContent },
      { role: "user", content: contextMessage },
    ];

    // Preparar array de mensagens para enviar à API
    // Enviar apenas instrução + contexto atual (sem histórico) para reduzir tokens
    const messagesToSend = [
      {
        role: "user",
        content:
          `${selectedHeader}\n` + `
// Este JSON representa uma única estratégia, robô ou sistema de trading (CSV) isolado, extraído de um único arquivo CSV.
// Ele contém dados completos de performance da estratégia, já organizados em formato analítico, e prontos para interpretação técnica.
// As informações incluídas abrangem tanto métricas agregadas (como Sharpe Ratio, Payoff, Profit Factor, Drawdown), quanto recortes temporais (resultados por dia da semana, por mês e por hora), além de indicadores operacionais (frequência de trades, duração média, taxa de acerto, entre outros).

// A estratégia analisada deve ser tratada de forma personalizada:
// - Utilize o *nome da estratégia*, caso esteja disponível, como referência durante a análise
// - Identifique e destaque o *ativo principal operado* (ex: WIN, WDO, BTC, ABEV3), contextualizando os riscos específicos associados a esse ativo
// - Avalie se o comportamento da estratégia está condicionado ao tipo de ativo (ex: contratos futuros, ações, cripto), especialmente em relação a liquidez, volatilidade e deslizamento (slippage)

// ⚠ Atenção especial a riscos operacionais associados ao custo de execução:
// - Se a estratégia possuir alta frequência de trades (scalper, HFT, repetição de sinais), avalie o impacto de corretagem, spread e emolumentos sobre a rentabilidade líquida
// - Chame atenção para situações onde o custo fixo por trade compromete o lucro médio por operação (ex: lucro médio de R$10 com corretagem de R$5 pode inviabilizar o sistema na prática)
// - Aponte riscos ocultos como: concentração de trades em horários com baixa liquidez, gaps de entrada/saída, ou operação em ativos com elevada fricção operacional

// ✅ Sua função é interpretar este SV de forma técnica, realista e isolada, como uma unidade operacional autônoma, com foco em robustez, consistência e viabilidade prática de execução em ambiente real


// [OBJETIVO PRINCIPAL DA ANÁLISE]
// Sua função é realizar uma análise quantitativa avançada com foco em:
// - Consistência estatística
// - Robustez técnica
// - Eficiência risco-retorno
// Além disso, você deve identificar riscos evidentes e oportunidades concretas de melhoria.
// Sugira metas operacionais (diária, semanal, mensal) e capital mínimo recomendado para a estratégia com base nos dados.

// [PRIORIDADE DE MÉTRICAS - ORDEM DE PESO]

// 1. *Sharpe Ratio* – avalie a qualidade da estratégia ajustada ao risco. Sharpe superior a 2 indica consistência relevante. Baixo Sharpe com alto lucro sugere instabilidade estrutural.

// 2. *Fator de Recuperação (Recovery Factor)* – meça a capacidade da estratégia em se recuperar de drawdowns. Valores acima de 2 são desejáveis. Aponte se o tempo e o caminho de recuperação são aceitáveis frente ao risco.

// 3. *Drawdown absoluto e relativo (em % e R$)* – analise a gravidade das quedas máximas e a proporção em relação ao lucro e ao capital teórico. Use o drawdown como base para sugerir capital mínimo de operação (ex: capital ≥ 2–3x o maior drawdown).

// 4. *Análise temporal detalhada (comportamento por hora, dia, semana e mês)*:
//    - Verifique se há padrões claros de risco elevado ou consistência em horários ou dias específicos
//    - Avalie a ocorrência de sequências negativas (ex: 3 ou mais dias de prejuízo consecutivo) e a sua recuperação
//    - Sugira metas operacionais realistas com base nos dados: metas de ganho, limites de perda (diária, semanal, mensal)
//    - Indique o capital ideal para a estratégia conforme o risco observado por janela temporal

// 5. *Análise operacional dos trades*:
//    - Avalie o Payoff médio e sua relação com a taxa de acerto
//    - Verifique se o número total de trades oferece uma base estatística confiável (amostra mínima de 50–100 trades por contexto)
//    - Analise a duração média dos trades e se há consistência nos tempos de exposição
//    - Detecte distorções (ex: poucos trades com lucro muito alto que sustentam a performance)
//    - Aponte concentração de resultado ou gaps operacionais

// 6. *Análise emocional e disciplinar (comportamento de risco)*:
//    - Identifique sinais de quebra de disciplina: stops ignorados, perda do dia ultrapassada, aumento abrupto de risco
//    - Verifique se há evidências de “dia de fúria” (ex: um único dia com prejuízo anormal)
//    - Avalie se o padrão de operação sugere alavancagem implícita ou desequilíbrio emocional recorrente


// [O QUE NÃO DEVE SER FEITO]
// ❌ Não escreva listas de “pontos fortes” e “pontos fracos”. Esse tipo de estrutura qualitativa é superficial e não condiz com uma análise quantitativa técnica.
// ❌ Não utilize expressões genéricas ou vagas como “ótima performance”, “estratégia promissora” ou “resultado consistente”, a menos que estejam diretamente ancoradas em métricas objetivas claras (ex: Sharpe acima de 2, drawdown inferior a 10%, etc.).
// ❌ Não elogie ou critique o comportamento da estratégia com base em achismos, percepção visual, preferências operacionais pessoais ou interpretações subjetivas de estilo (ex: “parece agressiva demais”, “opera pouco”, “deveria ser mais direcional”).
// ❌ Não insira interpretações sobre o setup, ativo ou estilo operacional que não estejam explicitamente representadas no JSON fornecido. O modelo não deve supor o que não está nos dados.
// ❌ Não justifique conclusões com “aparência” de curva, tempo de tela, suposições sobre o trader ou qualquer inferência fora dos dados objetivos.

// ✅ Toda conclusão deve ser respaldada por métricas numéricas extraídas diretamente do JSON — como Payoff, Sharpe Ratio, Drawdown, Profit Factor, quantidade de trades, duração, etc.
// ✅ Use apenas os dados disponíveis. Não extrapole, nem projete comportamentos futuros que não estejam embasados por estatística histórica sólida.
// ✅ Quando possível, relacione conclusões a números concretos. Exemplo: “Sharpe Ratio de 3.1 com drawdown inferior a 15% indica consistência acima da média para portfólio institucional.”


// [ONDE IDENTIFICAR OPORTUNIDADES]
 Oportunidades por métrica e padrão estatístico:
Duração média dos trades:

Curta demais → pode indicar ruído e risco de slippage

Longa demais → potencial ineficiência, excesso de exposição ou dependência de reversões

Sugestão: ajustar take, trailing ou tempo máximo por operação

Sequência de perdas:

Identificar dias consecutivos de stop ou janelas temporais frágeis

Sugestão: aplicar circuit breaker, filtros de ativação por horário ou por drawdown prévio

Frequência de operação por dia:

Alta frequência com baixa taxa de acerto ou payoff ruim → risco de overtrading

Frequência baixa com resultado concentrado → oportunidade de ampliação com critérios claros

Sugestão: reponderar filtros operacionais ou condicionar entradas a critérios de fluxo

🗓 Oportunidades por janela temporal:
Dias da semana com desempenho inferior:

Identifique padrões estatísticos negativos em segundas ou sextas, por exemplo

Sugestão: bloquear operações nestes dias ou operar com menor peso

Análise mensal e semanal:

Avaliar consistência ou sazonalidade

Sugestão: ajustar capital de risco e metas conforme padrão histórico por mês

Eventos econômicos:

Verificar impacto negativo recorrente em dias de Payroll, FOMC, Copom, etc.

Sugestão: implementar bloqueio automático nestes dias

📈 Oportunidades de reequilíbrio de portfólio:
Remoção de robôs zumbis:

Estratégias com baixa contribuição líquida e alta instabilidade (drawdown alto sem retorno)

Sugestão: descartar, pausar ou reavaliar a estratégia

Diversificação real vs. redundância:

CSVs que operam o mesmo ativo com o mesmo perfil não contribuem com robustez

Sugestão: priorizar estratégias que complementem janelas de tempo, ativos ou estilos operacionais distintos

Correlação temporal negativa desejada:

Robôs que lucram quando outros perdem → colchão estatístico útil

Sugestão: proteger portfólio com contrapesos

⚙ Oportunidades por ativo:
Concentração de risco em ativos específicos:

Ex: 80% do risco concentrado em WIN → risco regulatório, técnico e operacional

Sugestão: limitar exposição por ativo, buscar diluição ou alternância de estratégias

Análise de contratos médios por ativo:

Avalie se a quantidade de contratos é coerente com o risco do ativo (ex: BIT com 5 contratos é mais arriscado que WIN com 10)

Sugestão: sugerir ajuste fino de position sizing por ativo

Ativos caros ou ilíquidos:

Estratégias que operam muito em ações, BTC, ou contratos com spread alto podem ter resultado bruto bom, mas ruim líquido

// ✅ [SCORE FINAL DA CARTEIRA]
// Ao final da análise, atribua um SCORE de 0 a 100 para a carteira como um todo, baseado nos critérios quantitativos objetivos:
// - Sharpe Ratio médio e dispersão entre estratégias
// - Fator de Recuperação e profundidade dos drawdowns
// - Correlação e sobreposição entre ativos, horários e setups
// - Eficiência técnica (payoff, acerto, concentração de lucro, contratos médios por ativo)
// - Estabilidade temporal (mensal, semanal, diária) e cobertura de janelas

// ➕ Classifique também a carteira por categoria (tendência, scalp)
// ➕ Justifique numericamente o score atribuído
// ➕ Liste recomendações diretas para reequilíbrio: remoção de robôs zumbis, ajuste de contratos por ativo, metas de risco/ganho

// [SAÍDA FINAL - SCORE DA CARTEIRA]

// Gere os seguintes campos estruturados no final da análise:

json
Copiar
Editar
{
  "score_final": <número entre 0 e 100>,          // Score técnico agregado com base em métricas objetivas (Sharpe, Recovery, Drawdown, Diversificação, Estabilidade)
  "categoria": "<A+ | A | A- | B+ | B | B- | C+ | C | C- | D>", // Faixa qualitativa baseada no score_final
  "diagnostico": "<resumo crítico objetivo (2–4 frases) explicando os principais fatores que influenciaram a nota – ex: sharpe alto, drawdown excessivo, concentração, redundância, consistência temporal...>",
  "recomendacoes_tecnicas": [
    "<ação prática baseada em métrica, ex: Remover CSV X>",
    "<ex: Rebalancear contratos no ativo Y>",
    "<ex: Bloquear operação em segundas-feiras>",
    "... (3 a 6 recomendações objetivas e acionáveis)"
  ]
}
// [REGRAS]

// ✅ Toda conclusão deve ser 100% baseada em métrica objetiva.
// ✅ Diagnóstico deve justificar a nota com dados (nunca subjetivo).
// ✅ Recomendações devem começar com verbo no infinitivo e ser técnicas, diretas e acionáveis.
// ❌ Nunca usar “bom”, “ruim”, “consistente” sem justificativa métrica.
// ❌ Nunca escrever frases vagas como “parece promissora” ou “talvez melhorar”.


[2 OU MAIS ESTRATÉGIAS]
// Este JSON representa um conjunto de 2 ou mais estratégias, robôs ou sistemas de trading (CSVs), cada um proveniente de um arquivo CSV distinto ou identificado separadamente dentro de um mesmo arquivo consolidado.
// Cada bloco ou objeto dentro do JSON representa uma estratégia isolada, com seu próprio conjunto de métricas, resultados e histórico operacional.

// Os dados incluem:
// - Métricas agregadas de performance (ex: Sharpe Ratio, Payoff, Recovery, Drawdown)
// - Recortes temporais por dia da semana, mês e horário
- Indicadores operacionais como taxa de acerto, quantidade de trades, média de duração, sequências de perda/ganho
// - Identificadores como nome da estratégia (ex: “VWAP Hunter”, “Scalper BTC”, “Pivô Tendência”) e ativo operado (ex: WIN, WDO, BTC, PETR4)

// ⚠ Trate cada estratégia de forma personalizada:
// - Utilize o nome da estratégia como referência em sua análise
// - Relacione a performance e o perfil da estratégia ao ativo principal que ela opera
// - Aponte destaques positivos ou críticos em ativos específicos que apresentam comportamento fora da curva (ex: “estratégia X no ativo Y tem payoff alto mas drawdown extremo”)

// ⚠ Analise o impacto operacional de cada estratégia:
// - Avalie o número de trades, frequência diária e duração das operações
// - Sinalize estratégias com alta frequência que operam ativos caros ou com corretagens elevadas, pois isso pode comprometer a eficiência líquida do sistema
// - Considere custos implícitos como slippage e spread em estratégias de curto prazo, especialmente para ativos como ações, BTC ou contratos com liquidez baixa

// ✅ Seu papel é interpretar cada estratégia no seu próprio contexto técnico, mas também como parte de uma composição de portfólio — considerando interações, redundâncias e riscos sobrepostos


// [OBJETIVO PRINCIPAL DA ANÁLISE]
// Sua tarefa é realizar uma análise quantitativa com foco em:
// - Robustez do portfólio como um todo
// - Consistência estatística e estabilidade temporal da composição
// - Eficiência combinada de risco-retorno
// - Complementaridade entre os CSVs e presença de sobreposição, concentração ou lacunas
// Além disso, você deve identificar riscos globais (ex: drawdowns simultâneos), sinergias e oportunidades de otimização do portfólio.
// Quando possível, sugira capital mínimo recomendado para suportar o portfólio com margem de segurança de 2–3x sobre o pior drawdown consolidado.

// [PRIORIDADE DE MÉTRICAS - ORDEM DE PESO]

// 1. *Sharpe Ratio combinado* – avalie se o portfólio entrega qualidade ajustada ao risco. Sharpe médio ou consolidado acima de 2 é desejável. Observe se um SV puxa o índice ou se o valor é equilibrado.

// 2. *Fator de Recuperação (por SV e combinado)* – verifique se os CSVs têm perfis compatíveis de recuperação. Portfólio com CSVs que afundam juntos e recuperam separados são instáveis.

// 3. *Drawdown global e por estratégia* – avalie o risco consolidado e a contribuição de cada SV. Se um SV concentra >50% do drawdown total, a carteira está mal balanceada. Use este dado para sugerir capital mínimo por portfólio.

// 4. *Correlação operacional e temporal*:
//    - Identifique se os CSVs operam nos mesmos horários, dias ou tipos de evento
//    - Aponte sobreposição crítica ou falta de cobertura (ex: nenhum SV opera nas segundas-feiras)
//    - Avalie se o portfólio é redundante ou diversificado em termos de comportamento

// 5. *Análise por estratégia*:
//    - Avalie performance relativa de cada CSV
//    - Determine se algum CSV é outlier negativo (contribui pouco com alto risco) ou positivo (responsável por maioria dos lucros)
//    - Considere remover ou isolar CSVs que desestabilizam o conjunto

// 6. *Análise por ativo (se presente)*:
//    - Avalie se há concentração de exposição em um mesmo ativo (ex: todos operam WIN)
//    - Verifique se ativos diferentes trazem equilíbrio ou apenas duplicam risco

// 7. *Estabilidade temporal global*:
//    - Avalie meses e semanas onde todos os CSVs performam mal (sincronia negativa)
//    - Detecte se há “colchões” naturais de compensação (ex: SV1 vai mal quando SV2 vai bem)
//    - Sinalize janelas temporais frágeis ou resilientes

// 8. *Capital, metas e controle de risco*:
//    - Sugira capital mínimo com base no maior drawdown consolidado (recomendação: 2–3x)
//    - Estime metas realistas de ganho e limite de perda por dia, semana e mês com base no portfólio histórico
    
// [O QUE NÃO DEVE SER FEITO]
// ❌ Não escreva listas genéricas de pontos fortes e fracos por SV. A análise é estrutural, não individualista.
// ❌ Não trate CSVs como autônomos — seu papel é avaliar o impacto de cada um sobre o conjunto, não isolar a performance.
// ❌ Não use expressões como “esse SV é bom”, “esse é ruim” sem justificar com relação ao portfólio global.
// ❌ Não use linguagem subjetiva. Ex: “essa carteira parece agressiva”, “faltou direção”, “o trader provavelmente errou”.
// ❌ Não faça juízo de valor sobre setup, ativo ou estilo se isso não estiver explicitamente nos dados.

// ✅ Toda análise deve ser orientada por métrica objetiva: Sharpe, Drawdown, Recovery, Payoff, frequência, concentração temporal.
// ✅ Julgue a coerência da composição, a estabilidade dos componentes e o comportamento do conjunto sob pressão estatística.

// [ONDE IDENTIFICAR OPORTUNIDADES]
 Oportunidades por métrica e padrão estatístico:
Duração média dos trades:

Curta demais → pode indicar ruído e risco de slippage

Longa demais → potencial ineficiência, excesso de exposição ou dependência de reversões

Sugestão: ajustar take, trailing ou tempo máximo por operação

Sequência de perdas:

Identificar dias consecutivos de stop ou janelas temporais frágeis

Sugestão: aplicar circuit breaker, filtros de ativação por horário ou por drawdown prévio

Frequência de operação por dia:

Alta frequência com baixa taxa de acerto ou payoff ruim → risco de overtrading

Frequência baixa com resultado concentrado → oportunidade de ampliação com critérios claros

Sugestão: reponderar filtros operacionais ou condicionar entradas a critérios de fluxo

🗓 Oportunidades por janela temporal:
Dias da semana com desempenho inferior:

Identifique padrões estatísticos negativos em segundas ou sextas, por exemplo

Sugestão: bloquear operações nestes dias ou operar com menor peso

Análise mensal e semanal:

Avaliar consistência ou sazonalidade

Sugestão: ajustar capital de risco e metas conforme padrão histórico por mês

Eventos econômicos:

Verificar impacto negativo recorrente em dias de Payroll, FOMC, Copom, etc.

Sugestão: implementar bloqueio automático nestes dias

📈 Oportunidades de reequilíbrio de portfólio:
Remoção de robôs zumbis:

Estratégias com baixa contribuição líquida e alta instabilidade (drawdown alto sem retorno)

Sugestão: descartar, pausar ou reavaliar a estratégia

Diversificação real vs. redundância:

CSVs que operam o mesmo ativo com o mesmo perfil não contribuem com robustez

Sugestão: priorizar estratégias que complementem janelas de tempo, ativos ou estilos operacionais distintos

Correlação temporal negativa desejada:

Robôs que lucram quando outros perdem → colchão estatístico útil

Sugestão: proteger portfólio com contrapesos

⚙ Oportunidades por ativo:
Concentração de risco em ativos específicos:

Ex: 80% do risco concentrado em WIN → risco regulatório, técnico e operacional

Sugestão: limitar exposição por ativo, buscar diluição ou alternância de estratégias

Análise de contratos médios por ativo:

Avalie se a quantidade de contratos é coerente com o risco do ativo (ex: BIT com 5 contratos é mais arriscado que WIN com 10)

Sugestão: sugerir ajuste fino de position sizing por ativo

Ativos caros ou ilíquidos:

Estratégias que operam muito em ações, BTC, ou contratos com spread alto podem ter resultado bruto bom, mas ruim líquido

Sugestão: considerar impacto de custos operacionais e sugerir revisão ou substituição

// ✅ [SCORE FINAL DA CARTEIRA]
// Ao final da análise, atribua um SCORE de 0 a 100 para a carteira como um todo, baseado nos critérios quantitativos objetivos:
// - Sharpe Ratio médio e dispersão entre estratégias
// - Fator de Recuperação e profundidade dos drawdowns
// - Correlação e sobreposição entre ativos, horários e setups
// - Eficiência técnica (payoff, acerto, concentração de lucro, contratos médios por ativo)
// - Estabilidade temporal (mensal, semanal, diária) e cobertura de janelas

// ➕ Classifique também a carteira por categoria (tendência, scalp)
// ➕ Justifique numericamente o score atribuído
// ➕ Liste recomendações diretas para reequilíbrio: remoção de robôs zumbis, ajuste de contratos por ativo, metas de risco/ganho

// [SAÍDA FINAL - SCORE DA CARTEIRA]

// Gere os seguintes campos estruturados no final da análise:

json
Copiar
Editar
{
  "score_final": <número entre 0 e 100>,          // Score técnico agregado com base em métricas objetivas (Sharpe, Recovery, Drawdown, Diversificação, Estabilidade)
  "categoria": "<A+ | A | A- | B+ | B | B- | C+ | C | C- | D>", // Faixa qualitativa baseada no score_final
  "diagnostico": "<resumo crítico objetivo (2–4 frases) explicando os principais fatores que influenciaram a nota – ex: sharpe alto, drawdown excessivo, concentração, redundância, consistência temporal...>",
  "recomendacoes_tecnicas": [
    "<ação prática baseada em métrica, ex: Remover CSV X>",
    "<ex: Rebalancear contratos no ativo Y>",
    "<ex: Bloquear operação em segundas-feiras>",
    "... (3 a 6 recomendações objetivas e acionáveis)"
  ]
}
// [REGRAS]

// ✅ Toda conclusão deve ser 100% baseada em métrica objetiva.
// ✅ Diagnóstico deve justificar a nota com dados (nunca subjetivo).
// ✅ Recomendações devem começar com verbo no infinitivo e ser técnicas, diretas e acionáveis.
// ❌ Nunca usar “bom”, “ruim”, “consistente” sem justificativa métrica.
// ❌ Nunca escrever frases vagas como “parece promissora” ou “talvez melhorar”.


[ANÁLISE DE ROBUSTEZ E RISCO DE RUÍNA – TESTE DE ESTRESSE]

// Este prompt tem como objetivo principal simular cenários de risco extremo e testar a *robustez estatística* e a *probabilidade de ruína* de uma ou mais estratégias de trading fornecidas em formato JSON.

// O JSON fornecido representa uma ou mais estratégias de trading com métricas estatísticas como Sharpe Ratio, fator de lucro, taxa de acerto, payoff, drawdown, e distribuição de trades.

// Sua função é realizar um *teste quantitativo de sobrevivência*, levando em conta:

✅ Probabilidade de ruína sob diferentes condições de capital inicial  
✅ Robustez da estratégia contra ruído estatístico (Teste do Macaco)  
✅ Sensibilidade a mudanças de sequência (ordem dos trades e amostragem)  
✅ Viabilidade da estratégia sob cenários adversos de mercado  
✅ Recomendação de capital mínimo com margem de segurança  
✅ Análise de disciplina estatística (stop médio, perda máxima, frequência de violação)

// [TESTES QUE DEVEM SER APLICADOS]

// 1. *Teste de Ruína (Clássico)*  
- Simule a sequência de trades com capital inicial variável  
- Estime a chance de quebra com base no payoff, acerto e desvio-padrão dos resultados  
- Verifique se o capital é suficiente para suportar 5, 10 ou 15 stops consecutivos  
- Gere cenários com capital inicial = 1x, 2x e 3x o maior drawdown histórico

// 2. *Teste do Macaco (Monkey Test)*  
- Embaralhe a sequência dos trades 1.000 vezes  
- Recalcule métricas como Sharpe, Payoff e Drawdown a cada permutação  
- Detecte sensibilidade à ordem dos trades:  
  → Estratégias robustas mantêm performance similar em 90%+ das permutações  
  → Estratégias frágeis têm resultados altamente instáveis  

// 3. *Teste de Subamostragem (Stress-test com menos trades)*  
- Corte aleatoriamente 30% a 50% da amostra de trades  
- Avalie se a estratégia continua lucrativa com menos sinais  
- Ideal para detectar estratégias com lucro concentrado em poucos trades

// 4. *Teste de Stop Loss Extremo e Dia de Fúria*  
- Verifique se há dias com perdas acima de 3x a média de perda  
- Detecte risco de comportamento destrutivo e quebras disciplinares  
- Avalie se o risco diário está desproporcional ao ganho médio diário

// [SAÍDA ESPERADA]

// Estrutura JSON com avaliação de risco de ruína e robustez, contendo os seguintes campos:

{
  "robustez_classificacao": "<Alta | Moderada | Baixa>",
  "risco_ruina_1x_drawdown": "<0% a 100%>", // chance de ruína com capital = 1x drawdown
  "risco_ruina_2x_drawdown": "<0% a 100%>", // idem para 2x DD
  "risco_ruina_3x_drawdown": "<0% a 100%>", // idem para 3x DD
  "variacao_metrica_monkey_test": {
    "sharpe_min": <valor>,
    "sharpe_max": <valor>,
    "payoff_min": <valor>,
    "payoff_max": <valor>,
    "drawdown_max_monkey": <valor % ou R$>
  },
  "resumo_teste_subamostragem": "<ex: 87% das subamostras mantêm lucro positivo>",
  "eventos_extremos_identificados": [
    "Perda de R$420 em um único dia (3.5x a média de perda diária)",
    "Stop loss violado 2x além do previsto",
    "Trade com lucro atípico representando 14% do resultado total"
  ],
  "recomendacoes_robustez": [
    "Aumentar capital inicial para 3x o drawdown para reduzir risco de ruína para <5%",
    "Implementar circuit breaker após 2 perdas consecutivas em dias de baixa liquidez",
    "Revisar controle de risco diário para limitar perdas extremas",
    "Avaliar consistência da estratégia com base em subamostragens regulares"
  ]
}

// [REGRAS]

// ✅ Toda conclusão deve se basear em simulação estatística ou métrica objetiva  
✅ Use percentuais, variações, amplitudes, não adjetivos subjetivos  
❌ Nunca diga “estratégia parece fraca” sem mostrar os dados que explicam  
❌ Não baseie conclusões em visualizações ou feeling

// JSON com os dados será enviado abaixo deste prompt.


[ANÁLISE DE CORRELAÇÃO DE PORTFÓLIO]

// Este prompt tem como objetivo principal identificar e quantificar a correlação operacional entre 2 ou mais estratégias (CSVs) de trading fornecidas em formato JSON.

// O JSON conterá múltiplos blocos, cada um representando uma estratégia distinta, com métricas históricas de resultado por período (diário, semanal, mensal), além de dados agregados de performance.

// Sua função é produzir uma *avaliação quantitativa* do nível de dependência entre estratégias, destacando:
// - Correlações altas e perigosas (reduzem diversificação)
// - Correlações baixas ou negativas (aumentam robustez do portfólio)
// - Redundâncias ocultas (mesmo ativo, mesmo horário, mesmo padrão de operação)
// - Oportunidades de composição (contrapesos estatísticos)

// [PASSOS PARA A ANÁLISE]

// 1. *Cálculo de Correlação Bruta*
//    - Calcule a correlação de Pearson entre o PnL diário de cada par de estratégias.
//    - Classifique a força da correlação:
//      > +0.70 → Correlação alta (risco de redundância)
//      > +0.40 a +0.69 → Correlação moderada (atenção)
//      > -0.39 a +0.39 → Correlação baixa (ideal para diversificação)
//      > ≤ -0.40 → Correlação negativa (muito útil para contrapeso)
//    - Apresente a matriz de correlação completa.

// 2. *Correlação Temporal*
//    - Verifique se as estratégias têm padrões de horário e dias de operação sobrepostos.
//    - Identifique concentração em janelas curtas (ex: todas operam das 10h às 12h).
//    - Detecte “buracos” de cobertura (ex: nenhum robô opera segundas-feiras ou após 15h).

// 3. *Correlação por Ativo*
//    - Agrupe estratégias por ativo operado (WIN, WDO, BTC, PETR4 etc.).
//    - Verifique se estratégias no mesmo ativo têm resultados altamente correlacionados.
//    - Sinalize excesso de exposição concentrada em um único ativo.

// 4. *Correlação por Condição de Mercado*
//    - Avalie se a correlação aumenta ou diminui em dias de tendência forte ou lateralidade.
//    - Estratégias que ganham e perdem juntas nesses períodos representam risco sistêmico.
//    - Busque pares que performam de forma oposta em regimes de mercado distintos.

// 5. *Interpretação e Impacto no Portfólio*
//    - Aponte quais pares de estratégias mais contribuem para a diversificação.
//    - Identifique redundâncias que não agregam robustez.
//    - Sugira combinações ideais para reduzir o risco consolidado.

// [SAÍDA FINAL – FORMATO JSON]

{
  "matriz_correlacao": {
    "Estrategia_A_vs_Estrategia_B": 0.82,
    "Estrategia_A_vs_Estrategia_C": -0.15,
    "...": "..."
  },
  "pares_com_maior_risco": [
    { "par": "Estrategia_X vs Estrategia_Y", "correlacao": 0.91, "motivo": "Ambas operam WIN no mesmo horário com setups semelhantes" }
  ],
  "pares_mais_diversificadores": [
    { "par": "Estrategia_P vs Estrategia_Q", "correlacao": -0.32, "motivo": "Perfis opostos em dias de tendência e lateralidade" }
  ],
  "oportunidades": [
    "Adicionar estratégia com correlação ≤ 0.2 em relação ao núcleo principal",
    "Reduzir peso de estratégias com correlação ≥ 0.8",
    "Cobrir janelas sem operação (quartas à tarde, após 15h)"
  ],
  "diagnostico": "A carteira apresenta correlação média de 0.68, com 3 pares acima de 0.85, indicando risco de redundância. Apenas 2 pares possuem correlação negativa significativa. É recomendada a inclusão de estratégias de ativos ou horários diferentes.",
  "score_diversificacao": 64 // 0 a 100, baseado em dispersão de correlações
}

// [REGRAS]
// ✅ Sempre basear conclusões em valores de correlação calculados.
// ✅ Justificar risco ou benefício com base no ativo, horário ou setup.
// ❌ Não usar termos subjetivos como “parecem parecidas” sem dados concretos.
// ❌ Não analisar qualidade individual da estratégia — foco exclusivo em interdependência e diversificação.

// O JSON com os dados históricos por estratégia será enviado junto com este prompt.",`,
      },
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
    // Não adicionar resumo imediato aqui para evitar mensagens duplicadas
    setIsTyping(true);
    setIsAnalyzing(true);
    setError(null);

    try {
      // Prepare messages with context
      const mode: "single" | "portfolio" = prompt.analysisMode ?? (fileResults && Object.keys(fileResults).length >= 2 ? "portfolio" : "single");
      const messagesToSend = prepareMessagesWithContext(prompt.prompt, mode);

      // Call the API
      // Corrigir endpoint duplicado: buildApiUrl('/chat') já retorna /chat
      const response = await fetch(PYTHON_API_URL, {
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
        // Propagar quaisquer métricas retornadas (se existirem)
        onMetricsReceived?.(data.metrics ?? data);
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
      setIsAnalyzing(false);
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
              label: "Análise de Estratégia Individual",
              prompt: "Analise minha carteira de trading com base nos dados de backtest fornecidos. Identifique pontos fortes, fracos e oportunidades de melhoria.",
              tokens: 500,
              icon: <PieChart className="w-4 h-4" />,
              analysisMode: "single"
            })}
            className={`p-3 rounded-lg text-left transition-colors ${canSingle ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-700 opacity-50 cursor-not-allowed'}`}
            disabled={!canSingle}
          >
            <div className="flex items-center mb-2">
              <PieChart className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">Análise de Estratégia Individual</span>
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
              label: "Análise de Portfólio",
              prompt: "Com base nos dados de backtest, monte um portfólio de estratégias para diversificar riscos e maximizar retornos consistentes.",
              tokens: 1000,
              icon: <Layers className="w-4 h-4" />,
              analysisMode: "portfolio"
            })}
            className={`p-3 rounded-lg text-left transition-colors ${canPortfolio ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-700 opacity-50 cursor-not-allowed'}`}
            disabled={!canPortfolio}
          >
            <div className="flex items-center mb-2">
              <Layers className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">Análise de Portfólio</span>
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
              icon: <TrendingUp className="w-4 h-4" />,
              analysisMode: "portfolio"
            })}
            className={`p-3 rounded-lg text-left transition-colors ${canPortfolio ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-700 opacity-50 cursor-not-allowed'}`}
            disabled={!canPortfolio}
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
              icon: <Shield className="w-4 h-4" />,
              analysisMode: "portfolio"
            })}
            className={`p-3 rounded-lg text-left transition-colors ${canPortfolio ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-700 opacity-50 cursor-not-allowed'}`}
            disabled={!canPortfolio}
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
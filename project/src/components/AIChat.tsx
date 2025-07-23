import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Loader2, Settings, Bot, Code2, HelpCircle, Coins, Trash2, AlertTriangle, Check, Plus, Tag, Sparkles, Clock, Calendar, BookOpen, TrendingUp, BarChart2, Repeat, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { TokenDisplay } from './TokenDisplay';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../stores/languageStore';
import { useRobotStore } from '../stores/robotStore';
import { generateUniqueVersionName } from '../utils/robotUtils';
import { openai } from '../lib/openaiClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  onGenerateCode: (code: string, description?: string, tags?: string[]) => void;
  robotId?: string | null;
  robotName?: string;
  selectedVersion?: string | null;
}

export function AIChat({ onGenerateCode, robotId, robotName, selectedVersion }: AIChatProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { profile, updateTokenBalance } = useAuthStore();
  const { t, language } = useLanguageStore();
  const { createVersion, versions, loadVersions } = useRobotStore();
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [tokenCost, setTokenCost] = useState(500);
  const [operationType, setOperationType] = useState<'create' | 'optimize'>('create');
  const [currentCode, setCurrentCode] = useState<string>('');
  const [selectedVersionName, setSelectedVersionName] = useState<string | null>(null);
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [pendingDescription, setPendingDescription] = useState<string>('');
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [showMessageConfirmation, setShowMessageConfirmation] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [showInformationGatheringModal, setShowInformationGatheringModal] = useState(false);
  const [gatheringInfo, setGatheringInfo] = useState({
    strategy: '',
    timeframes: [] as string[],
    assets: [] as string[],
    riskLevel: '',
    additionalDetails: ''
  });
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [versionCreationStatus, setVersionCreationStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [versionCreationError, setVersionCreationError] = useState<string | null>(null);
  const [codeNotFunctional, setCodeNotFunctional] = useState(false);
  const [showFixCodeModal, setShowFixCodeModal] = useState(false);

  // Predefined strategy prompts for creation
  const creationStrategyPrompts = [
    { 
      id: 'trend-following',
      name: 'Seguidor de Tendência', 
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Estratégia que segue a direção da tendência do mercado'
    },
    { 
      id: 'mean-reversion',
      name: 'Reversão à Média', 
      icon: <Repeat className="w-5 h-5" />,
      description: 'Estratégia que opera quando o preço se afasta da média'
    },
    { 
      id: 'breakout',
      name: 'Rompimento', 
      icon: <BarChart2 className="w-5 h-5" />,
      description: 'Estratégia que opera em rompimentos de suportes e resistências'
    },
    { 
      id: 'scalping',
      name: 'Scalping', 
      icon: <Zap className="w-5 h-5" />,
      description: 'Estratégia de operações rápidas com pequenos ganhos'
    }
  ];

  // Predefined strategy prompts for optimization
  const optimizationStrategyPrompts = [
    { 
      id: 'quick-optimization',
      name: 'Otimização Rápida', 
      icon: <Zap className="w-5 h-5" />,
      description: 'Melhoria geral de performance e código'
    },
    { 
      id: 'add-trailing',
      name: 'Incluir Trailing Stop', 
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Adicionar trailing stop para proteger lucros'
    },
    { 
      id: 'add-breakeven',
      name: 'Incluir Breakeven', 
      icon: <BarChart2 className="w-5 h-5" />,
      description: 'Adicionar ponto de breakeven para reduzir risco'
    },
    { 
      id: 'financial-stop',
      name: 'Stop Financeiro', 
      icon: <Coins className="w-5 h-5" />,
      description: 'Implementar stop loss baseado em valor financeiro'
    }
  ];

  const availableTags = [
    'trailing', 'sem-trailing', 'tendencia', 'reversao', 'medias-moveis', 
    'rompimento', 'volatilidade-alta', 'volatilidade-baixa', 'correlacao', 
    'alvo-longo', 'alvo-curto'
  ];

  const availableTimeframes = [
    { id: 'M1', name: '1 minuto' },
    { id: 'M5', name: '5 minutos' },
    { id: 'M15', name: '15 minutos' },
    { id: 'M30', name: '30 minutos' },
    { id: 'H1', name: '1 hora' },
    { id: 'H4', name: '4 horas' },
    { id: 'D1', name: '1 dia' },
    { id: 'W1', name: '1 semana' }
  ];

  const availableAssets = [
    'WINFUT', 'WDOFUT', 'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'MGLU3', 'BOVA11'
  ];

  const availableStrategies = [
    'Tendência', 'Reversão à Média', 'Rompimento', 'Scalping', 
    'HFT', 'Correlação', 'Volatilidade', 'Média Móvel'
  ];

  const availableRiskLevels = [
    'Conservador', 'Moderado', 'Agressivo'
  ];

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedVersion) {
      setSelectedVersionName(selectedVersion);
    }
  }, [selectedVersion]);

useEffect(() => {
  if (robotId) {
    console.log('Carregando versões para robotId:', robotId);
    
    loadVersions(robotId).then(loadedVersions => {
      console.log('Versões carregadas:', loadedVersions.length);
      
      if (loadedVersions.length > 0) {
        let currentVersion;
        
        // Se há uma versão selecionada, tenta encontrá-la
        if (selectedVersionName) {
          currentVersion = loadedVersions.find(v => v.version_name === selectedVersionName);
          console.log('Versão selecionada encontrada:', !!currentVersion);
        }
        
        // Se não encontrou a versão selecionada ou não há seleção, usa a primeira
        if (!currentVersion) {
          currentVersion = loadedVersions[0];
          console.log('Usando primeira versão:', currentVersion.version_name);
          
          // Atualiza a seleção apenas se não havia uma selecionada antes
          if (!selectedVersionName) {
            setSelectedVersionName(currentVersion.version_name);
          }
        }
        
        // Atualiza o código e metadados atuais
        if (currentVersion) {
          console.log('Atualizando código atual com versão:', currentVersion.version_name);
          setCurrentCode(currentVersion.code);
          setCurrentDescription(currentVersion.description || '');
          setCurrentTags(currentVersion.tags || []);
        }
      } else {
        console.log('Nenhuma versão encontrada, limpando dados atuais');
        // Se não há versões, limpa os dados atuais
        setCurrentCode('');
        setCurrentDescription('');
        setCurrentTags([]);
        setSelectedVersionName('');
      }
    }).catch(error => {
      console.error('Erro ao carregar versões:', error);
    });
  } else {
    console.log('Sem robotId, limpando dados');
    // Se não há robotId, limpa tudo
    setCurrentCode('');
    setCurrentDescription('');
    setCurrentTags([]);
    setSelectedVersionName('');
  }
}, [robotId, loadVersions]); // Removido selectedVersionName das dependências

// useEffect separado para quando selectedVersionName muda externamente
useEffect(() => {
  if (robotId && selectedVersionName) {
    console.log('selectedVersionName mudou para:', selectedVersionName);
    
    loadVersions(robotId).then(loadedVersions => {
      const selectedVersion = loadedVersions.find(v => v.version_name === selectedVersionName);
      
      if (selectedVersion) {
        console.log('Carregando versão selecionada:', selectedVersionName);
        setCurrentCode(selectedVersion.code);
        setCurrentDescription(selectedVersion.description || '');
        setCurrentTags(selectedVersion.tags || []);
      } else {
        console.warn('Versão selecionada não encontrada:', selectedVersionName);
      }
    }).catch(error => {
      console.error('Erro ao carregar versão selecionada:', error);
    });
  }
}, [selectedVersionName, robotId, loadVersions]); // Este useEffect roda quando selectedVersionName muda
  const handleCreateRobotClick = () => {
    const tokenBalance = profile?.token_balance || 0;
    if (tokenBalance < 500) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
      errorMessage.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        Tokens insuficientes. A criação de robô com IA custa 500 tokens.
      `;
      document.body.appendChild(errorMessage);

      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 3000);
      return;
    }

    setOperationType('create');
    setShowInformationGatheringModal(true);
  };

  const handleOptimizeRobotClick = async () => {
    const tokenBalance = profile?.token_balance || 0;
    if (tokenBalance < 500) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
      errorMessage.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        Tokens insuficientes. A otimização custa 500 tokens.
      `;
      document.body.appendChild(errorMessage);

      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 3000);
      return;
    }

    setOperationType('optimize');
    setShowInformationGatheringModal(true);
  };

  const handleFixCodeClick = () => {
    const tokenBalance = profile?.token_balance || 0;
    if (tokenBalance < 500) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
      errorMessage.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        Tokens insuficientes. A correção de código custa 500 tokens.
      `;
      document.body.appendChild(errorMessage);

      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 3000);
      return;
    }

    setShowFixCodeModal(true);
  };

  const handleSubmitInformationGathering = () => {
    // Validate that at least some information is provided
    if (!gatheringInfo.strategy && gatheringInfo.timeframes.length === 0 && gatheringInfo.assets.length === 0 && !gatheringInfo.additionalDetails) {
      alert("Por favor, forneça pelo menos uma estratégia, timeframe, ativo ou detalhes adicionais para continuar.");
      return;
    }

    // Construct a detailed prompt based on gathered information
    let prompt = '';
    
    if (operationType === 'create') {
      prompt = `Criar nova versão `;
      
      if (gatheringInfo.strategy) {
        prompt += `utilizando a estratégia de ${gatheringInfo.strategy}`;
      }
      
      if (gatheringInfo.timeframes.length > 0) {
        const timeframeNames = gatheringInfo.timeframes.map(tf => {
          const timeframe = availableTimeframes.find(t => t.id === tf);
          return timeframe ? timeframe.name : tf;
        });
        prompt += ` para operar em ${timeframeNames.join(', ')}`;
      }
      
      if (gatheringInfo.assets.length > 0) {
        prompt += ` nos ativos ${gatheringInfo.assets.join(', ')}`;
      }
      
      if (gatheringInfo.riskLevel) {
        prompt += ` com perfil de risco ${gatheringInfo.riskLevel}`;
      }
      
      if (gatheringInfo.additionalDetails) {
        prompt += `. ${gatheringInfo.additionalDetails}`;
      }
    } else {
      // For optimization
      prompt = `Otimize o código atual do robô `;
      
      if (gatheringInfo.strategy) {
        prompt += `para melhorar a estratégia de ${gatheringInfo.strategy}`;
      }
      
      if (gatheringInfo.timeframes.length > 0) {
        const timeframeNames = gatheringInfo.timeframes.map(tf => {
          const timeframe = availableTimeframes.find(t => t.id === tf);
          return timeframe ? timeframe.name : tf;
        });
        prompt += ` para operar em ${timeframeNames.join(', ')}`;
      }
      
      if (gatheringInfo.assets.length > 0) {
        prompt += ` nos ativos ${gatheringInfo.assets.join(', ')}`;
      }
      
      if (gatheringInfo.riskLevel) {
        prompt += ` com perfil de risco ${gatheringInfo.riskLevel}`;
      }
      
      if (gatheringInfo.additionalDetails) {
        prompt += `. ${gatheringInfo.additionalDetails}`;
      }
      
      // Add current code for optimization
      prompt += `\n\nCódigo atual:\n\`\`\`\n${currentCode}\n\`\`\`\n\n`;
      
      if (currentDescription) {
        prompt += `Descrição atual: ${currentDescription}\n\n`;
      }
      
      if (currentTags && currentTags.length > 0) {
        prompt += `Tags atuais: ${currentTags.join(', ')}\n\n`;
      }
    }
    
    // Set the constructed prompt as input
    setInput(prompt);
    
    // Close the modal
    setShowInformationGatheringModal(false);
    
    // Show message confirmation
    setPendingMessage(prompt);
    setShowMessageConfirmation(true);
    
    // Reset gathering info for next time
    setGatheringInfo({
      strategy: '',
      timeframes: [],
      assets: [],
      riskLevel: '',
      additionalDetails: ''
    });
  };

  const handleSubmitFixCodeModal = () => {
    if (!currentCode) {
      alert("Não há código para corrigir.");
      return;
    }

    let prompt = `O código gerado não está funcionando corretamente. Por favor, corrija os erros e gere uma nova versão funcional. 
    
Código atual com problemas:
\`\`\`
${currentCode}
\`\`\`

Descrição do problema: ${pendingDescription || "O código não está funcionando como esperado."}

Por favor, forneça uma versão corrigida do código que seja funcional, mantendo a mesma estratégia e lógica, mas corrigindo quaisquer erros de sintaxe ou lógica.`;

    setInput(prompt);
    setShowFixCodeModal(false);
    setPendingMessage(prompt);
    setShowMessageConfirmation(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check if the message is too short or lacks details
    if (input.trim().length < 15 && !pendingMessage) {
      setShowInformationGatheringModal(true);
      setGatheringInfo({
        ...gatheringInfo,
        additionalDetails: input.trim()
      });
      return;
    }

    setPendingMessage(input.trim());
    setShowMessageConfirmation(true);
  };

const handleConfirmSendMessage = async () => {
  if (!pendingMessage || isLoading) return;

  const tokenBalance = profile?.token_balance || 0;
  if (tokenBalance < 500) {
    setMessages(prev => [...prev, 
      { role: 'user', content: pendingMessage },
      { role: 'assistant', content: language === 'en' 
        ? "You don't have enough tokens to use the AI assistant. Each message costs 500 tokens. Please purchase more tokens or upgrade your plan."
        : "Você não tem tokens suficientes para usar o assistente de IA. Cada mensagem custa 500 tokens. Por favor, compre mais tokens ou atualize seu plano." 
      }
    ]);
    setInput('');
    setShowMessageConfirmation(false);
    setPendingMessage('');
    return;
  }

  const isRobotCreationRequest = 
    pendingMessage.toLowerCase().includes('create a robot') || 
    pendingMessage.toLowerCase().includes('criar um robô') ||
    pendingMessage.toLowerCase().includes('fazer um robô') ||
    pendingMessage.toLowerCase().includes('build a robot') ||
    pendingMessage.toLowerCase().includes('create a new version') ||
    pendingMessage.toLowerCase().includes('criar uma nova versão');
    
  const isRobotOptimizationRequest = 
    pendingMessage.toLowerCase().includes('optimize') || 
    pendingMessage.toLowerCase().includes('otimizar') ||
    pendingMessage.toLowerCase().includes('improve') ||
    pendingMessage.toLowerCase().includes('melhorar');

  const isCodeFixRequest =
    pendingMessage.toLowerCase().includes('fix') ||
    pendingMessage.toLowerCase().includes('corrigir') ||
    pendingMessage.toLowerCase().includes('consertar') ||
    pendingMessage.toLowerCase().includes('arrumar') ||
    pendingMessage.toLowerCase().includes('não funciona') ||
    pendingMessage.toLowerCase().includes('not working');

  if (isRobotCreationRequest) {
    setOperationType('create');
  } else if (isRobotOptimizationRequest) {
    setOperationType('optimize');
  } else if (isCodeFixRequest) {
    setCodeNotFunctional(true);
  }

  const userMessage = pendingMessage;
  setLastUserMessage(userMessage);
  setInput('');
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setIsLoading(true);
  setShowMessageConfirmation(false);
  setPendingMessage('');
  setTaskCompleted(false);
  setVersionCreationStatus('idle');
  setVersionCreationError(null);

  try {
    const apiKey = customApiKey || import.meta.env.VITE_OPENAI_API_KEY;
    const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID;

    if (!apiKey || !assistantId) {
      throw new Error('Missing API key or Assistant ID');
    }

    // Construir prompt mais específico para garantir que a IA retorne apenas código
    let messageContent = '';
    
    if (isRobotOptimizationRequest && currentCode) {
      messageContent = `${userMessage}

CURRENT CODE TO OPTIMIZE:
\`\`\`ntsl
${currentCode}
\`\`\`

${currentDescription ? `Current description: ${currentDescription}` : ''}
${currentTags && currentTags.length > 0 ? `Current tags: ${currentTags.join(', ')}` : ''}

IMPORTANT: Please respond with ONLY the optimized NTSL code inside a code block. Do not include explanations, descriptions, or any other text. Format your response exactly like this:

\`\`\`ntsl
[YOUR OPTIMIZED CODE HERE]
\`\`\``;

    } else if (isCodeFixRequest && currentCode) {
      messageContent = `${userMessage}

CODE TO FIX:
\`\`\`ntsl
${currentCode}
\`\`\`

${currentDescription ? `Current description: ${currentDescription}` : ''}
${currentTags && currentTags.length > 0 ? `Current tags: ${currentTags.join(', ')}` : ''}

IMPORTANT: Please respond with ONLY the corrected NTSL code inside a code block. Do not include explanations, descriptions, or any other text. Format your response exactly like this:

\`\`\`ntsl
[YOUR FIXED CODE HERE]
\`\`\``;

    } else {
      // Para criação de novos robôs
      messageContent = `${userMessage}

IMPORTANT: Please respond with ONLY the NTSL code inside a code block. Do not include explanations, descriptions, or any other text. Format your response exactly like this:

\`\`\`ntsl
[YOUR CODE HERE]
\`\`\``;
    }

    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: messageContent,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    let response;
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        response = messages.data[0].content[0];
        break;
      } else if (runStatus.status === 'failed') {
        throw new Error('Assistant failed to process the request');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!response) {
      throw new Error('No response from assistant');
    }

    const fullResponse = response.text.value;
    console.log('=== RESPOSTA COMPLETA DA IA ===');
    console.log(fullResponse);
    console.log('=== FIM DA RESPOSTA ===');

    // EXTRAÇÃO SIMPLIFICADA E MAIS ROBUSTA DO CÓDIGO
    let extractedCode = '';
    
    // Primeira tentativa: buscar código dentro de ```ntsl ou ```
    const codeBlockRegex = /```(?:ntsl)?\s*\n([\s\S]*?)```/;
    const codeMatch = fullResponse.match(codeBlockRegex);
    
    if (codeMatch && codeMatch[1]) {
      extractedCode = codeMatch[1].trim();
      console.log('✅ Código extraído de bloco markdown');
    } else {
      // Segunda tentativa: se não tem bloco de código, usar toda a resposta
      // mas filtrar apenas linhas que parecem ser código NTSL
      const lines = fullResponse.split('\n');
      const codeLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        
        // Se a linha tem palavras-chave típicas de NTSL
        return (
          trimmed.includes('input:') ||
          trimmed.includes('var:') ||
          trimmed.includes('begin') ||
          trimmed.includes('end;') ||
          trimmed.includes('buyatmarket') ||
          trimmed.includes('sellshortatmarket') ||
          trimmed.includes('plot') ||
          trimmed.includes('if ') ||
          trimmed.includes('then') ||
          trimmed.includes('else') ||
          /^[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(trimmed) || // Declarações de variável
          /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(trimmed)    // Atribuições
        );
      });
      
      if (codeLines.length > 0) {
        extractedCode = codeLines.join('\n').trim();
        console.log('✅ Código extraído por filtro de linhas');
      }
    }

    console.log('=== CÓDIGO EXTRAÍDO ===');
    console.log('Tamanho:', extractedCode.length);
    console.log('Primeiros 200 chars:', extractedCode.substring(0, 200));

    // Validação básica do código NTSL
    const isValidNTSLCode = extractedCode.length > 10 && (
      extractedCode.includes('input:') ||
      extractedCode.includes('var:') ||
      extractedCode.includes('begin') ||
      extractedCode.includes('end;')
    );

    if (!isValidNTSLCode) {
      throw new Error('Código NTSL válido não foi encontrado na resposta da IA');
    }

    // Aplicar código ao editor
    const description = `${operationType === 'create' ? 'Nova versão criada' : 
                        codeNotFunctional ? 'Código corrigido' : 
                        'Versão otimizada'} com IA - ${userMessage.substring(0, 100)}`;
    
    // Tags básicas baseadas no tipo de operação
    const basicTags = [
      operationType === 'create' ? 'nova-versao' : 
      codeNotFunctional ? 'correcao' : 'otimizacao',
      'ia-gerada'
    ];

    console.log('Aplicando código ao editor...');
    onGenerateCode(extractedCode, description, basicTags);

    // Criar nova versão se temos robotId
    if (robotId) {
      try {
        setVersionCreationStatus('creating');
        console.log('=== CRIANDO NOVA VERSÃO ===');
        
        // Gerar nome simples e único
        const timestamp = new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/[/:]/g, '-').replace(/,/g, '');
        
        const versionName = `Versão ${versions.length + 1}-${timestamp}`;
        
        console.log('Nome da versão:', versionName);
        
        await createVersion(robotId, versionName, extractedCode, description, basicTags);
        
        setSelectedVersionName(versionName);
        setVersionCreationStatus('success');
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: language === 'en' 
            ? `✅ Code generated and applied successfully! Version "${versionName}" created.`
            : `✅ Código gerado e aplicado com sucesso! Versão "${versionName}" criada.`
        }]);
        
        console.log('✅ Versão criada com sucesso!');
        
      } catch (versionError) {
        console.error('❌ Erro ao criar versão:', versionError);
        
        setVersionCreationStatus('error');
        setVersionCreationError(versionError.message);
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: language === 'en' 
            ? `⚠️ Code applied to editor, but failed to save version: ${versionError.message}`
            : `⚠️ Código aplicado ao editor, mas falhou ao salvar versão: ${versionError.message}`
        }]);
      }
    } else {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: language === 'en' 
          ? '✅ Code generated and applied to editor successfully.'
          : '✅ Código gerado e aplicado ao editor com sucesso.'
      }]);
    }

    setTaskCompleted(true);
    setCodeNotFunctional(false);
    await updateTokenBalance(-500);

  } catch (error) {
    console.error('=== ERRO NA FUNÇÃO PRINCIPAL ===');
    console.error(error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `❌ ${language === 'en' ? 'Error' : 'Erro'}: ${errorMessage}`
    }]);
    
    setVersionCreationStatus('error');
    setVersionCreationError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const handleCancelSendMessage = () => {
    setShowMessageConfirmation(false);
    setPendingMessage('');
  };

  const handleBuyTokens = () => {
    const message = "Olá vim do DevHub Trader e quero mais informações e ajuda para comprar tokens";
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
  };

  const toggleGatheringTimeframe = (timeframe: string) => {
    if (gatheringInfo.timeframes.includes(timeframe)) {
      setGatheringInfo({
        ...gatheringInfo,
        timeframes: gatheringInfo.timeframes.filter(t => t !== timeframe)
      });
    } else {
      setGatheringInfo({
        ...gatheringInfo,
        timeframes: [...gatheringInfo.timeframes, timeframe]
      });
    }
  };

  const toggleGatheringAsset = (asset: string) => {
    if (gatheringInfo.assets.includes(asset)) {
      setGatheringInfo({
        ...gatheringInfo,
        assets: gatheringInfo.assets.filter(a => a !== asset)
      });
    } else {
      setGatheringInfo({
        ...gatheringInfo,
        assets: [...gatheringInfo.assets, asset]
      });
    }
  };

  const handleSelectStrategyPrompt = (strategyId: string) => {
    let prompt = '';
    
    if (operationType === 'create') {
      switch(strategyId) {
        case 'trend-following':
          prompt = "Criar nova versão utilizando estratégia seguidor de tendência com médias móveis e indicadores de momentum para identificar a direção do mercado e entrar em operações na direção da tendência.";
          break;
        case 'mean-reversion':
          prompt = "Criar nova versão utilizando estratégia de reversão à média que opere quando o preço se afasta muito da média, utilizando bandas de bollinger e RSI para identificar pontos de entrada e saída.";
          break;
        case 'breakout':
          prompt = "Criar nova versão utilizando estratégia de rompimento que identifique suportes e resistências e opere quando o preço rompe esses níveis com volume significativo.";
          break;
        case 'scalping':
          prompt = "Criar nova versão utilizando estratégia de scalping para operações rápidas com pequenos ganhos, utilizando indicadores de curto prazo e gerenciamento de risco rigoroso.";
          break;
        default:
          prompt = "Criar nova versão ";
      }
    } else {
      // Optimization prompts
      switch(strategyId) {
        case 'quick-optimization':
          prompt = "Otimize o código atual para melhorar a performance e legibilidade, mantendo a mesma estratégia.";
          break;
        case 'add-trailing':
          prompt = "Adicione um trailing stop ao código atual para proteger lucros quando o preço se mover a favor.";
          break;
        case 'add-breakeven':
          prompt = "Implemente um mecanismo de breakeven que move o stop loss para o ponto de entrada após o preço atingir um determinado lucro.";
          break;
        case 'financial-stop':
          prompt = "Modifique o código para usar stop loss baseado em valor financeiro ao invés de pontos/ticks.";
          break;
        default:
          prompt = "Otimize o código atual ";
      }
    }
    
    setGatheringInfo({
      ...gatheringInfo,
      additionalDetails: prompt
    });
  };

  const renderCreateRobotCTA = (messageIndex: number) => {
    if (messages[messageIndex].role !== 'assistant' || messageIndex !== messages.length - 1) {
      return null;
    }

    const hasEnoughTokens = (profile?.token_balance || 0) >= 500;
    const currentVersionName = selectedVersionName || (versions.length > 0 ? versions[0].version_name : '');

    return (
      <div className="mt-4 flex flex-col space-y-2">
        {taskCompleted && (
          <div className="flex items-center justify-center mb-2 bg-green-600 bg-opacity-20 py-2 px-3 rounded-md">
            <div className="flex items-center">
              <div className="w-5 h-5 mr-2 rounded-md border-2 border-green-500 flex items-center justify-center bg-green-500">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-green-400 text-sm font-medium">
                {language === 'en' ? 'Task completed' : 'Tarefa concluída'}
              </span>
            </div>
          </div>
        )}
        
        {versionCreationStatus === 'creating' && (
          <div className="flex items-center justify-center mb-2 bg-blue-600 bg-opacity-20 py-2 px-3 rounded-md">
            <div className="flex items-center">
              <div className="w-5 h-5 mr-2 rounded-md flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
              <span className="text-blue-400 text-sm font-medium">
                {language === 'en' ? 'Creating version...' : 'Criando versão...'}
              </span>
            </div>
          </div>
        )}
        
        {versionCreationStatus === 'success' && (
          <div className="flex items-center justify-center mb-2 bg-green-600 bg-opacity-20 py-2 px-3 rounded-md">
            <div className="flex items-center">
              <div className="w-5 h-5 mr-2 rounded-md border-2 border-green-500 flex items-center justify-center bg-green-500">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-green-400 text-sm font-medium">
                {language === 'en' ? 'Version created successfully' : 'Versão criada com sucesso'}
              </span>
            </div>
          </div>
        )}
        
        {versionCreationStatus === 'error' && (
          <div className="flex items-center justify-center mb-2 bg-red-600 bg-opacity-20 py-2 px-3 rounded-md">
            <div className="flex items-center">
              <div className="w-5 h-5 mr-2 rounded-md border-2 border-red-500 flex items-center justify-center bg-red-500">
                <X className="w-3 h-3 text-white" />
              </div>
              <span className="text-red-400 text-sm font-medium">
                {language === 'en' ? `Error: ${versionCreationError}` : `Erro: ${versionCreationError}`}
              </span>
            </div>
          </div>
        )}
        
        <button
          onClick={handleCreateRobotClick}
          disabled={!hasEnoughTokens}
          className={`w-full py-2 px-4 rounded-md flex items-center justify-center space-x-2 ${
            hasEnoughTokens 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>{language === 'en' ? 'Create New Version with AI' : 'Criar Nova Versão com IA'}</span>
        </button>
        
        <button
          onClick={handleOptimizeRobotClick}
          disabled={!hasEnoughTokens || !robotId}
          className={`w-full py-2 px-4 rounded-md flex items-center justify-center space-x-2 ${
            hasEnoughTokens && robotId
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          <span>
            {language === 'en' 
              ? `Optimize ${robotName ? `"${robotName}"` : 'This Robot'} ${currentVersionName ? `(${currentVersionName})` : ''}`
              : `Otimizar ${robotName ? `"${robotName}"` : 'Este Robô'} ${currentVersionName ? `(${currentVersionName})` : ''}`}
          </span>
        </button>
        
        {currentCode && (
          <button
            onClick={handleFixCodeClick}
            disabled={!hasEnoughTokens}
            className={`w-full py-2 px-4 rounded-md flex items-center justify-center space-x-2 ${
              hasEnoughTokens 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Code2 className="w-4 h-4 mr-1" />
            <span>{language === 'en' ? 'Fix Non-Functional Code' : 'Corrigir Código Não Funcional'}</span>
          </button>
        )}
        
        {!hasEnoughTokens && (
          <div className="text-xs text-yellow-500 text-center mt-1 flex items-center justify-center">
            <Coins className="w-3 h-3 mr-1" />
            <span>{language === 'en' ? 'Not enough tokens (500 required)' : 'Tokens insuficientes (500 necessários)'}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center">
          <MessageSquare className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="font-medium">{t('ai.title')}</h3>
        </div>
        <TokenDisplay />
      </div>

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="mb-2">{language === 'en' ? "Hi! I'm your AI trading assistant." : "Olá! Sou seu assistente de trading com IA."}</p>
            <p className="text-sm">{language === 'en' ? "Try asking me to:" : "Tente me pedir para:"}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>{language === 'en' ? "Create a trading bot that uses RSI for trend following" : "Criar nova versão utilizando RSI para seguir tendências"}</li>
              <li>{language === 'en' ? "Generate a mean reversion strategy with Bollinger Bands" : "Criar nova versão com estratégia de reversão à média com Bandas de Bollinger"}</li>
              <li>{language === 'en' ? "Build a breakout trading system with proper risk management" : "Criar nova versão com sistema de trading de rompimento com gerenciamento de risco adequado"}</li>
            </ul>
            
            <div className="mt-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 max-w-sm mx-auto">
              <button
                onClick={handleCreateRobotClick}
                disabled={(profile?.token_balance || 0) < 500}
                className={`w-full py-3 px-4 rounded-md flex items-center justify-center space-x-2 ${
                  (profile?.token_balance || 0) >= 500 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5 mr-1" />
                <span className="font-medium">{language === 'en' ? 'Create New Version with AI' : 'Criar Nova Versão com IA'}</span>
              </button>
              
              {robotId && (
                <button
                  onClick={handleOptimizeRobotClick}
                  disabled={(profile?.token_balance || 0) < 500}
                  className={`w-full py-3 px-4 rounded-md flex items-center justify-center space-x-2 ${
                    (profile?.token_balance || 0) >= 500 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-5 h-5 mr-1" />
                  <span className="font-medium">
                    {language === 'en' 
                      ? `Optimize ${robotName ? `"${robotName}"` : 'This Robot'} ${selectedVersionName ? `(${selectedVersionName})` : ''}`
                      : `Otimizar ${robotName ? `"${robotName}"` : 'Este Robô'} ${selectedVersionName ? `(${selectedVersionName})` : ''}`}
                  </span>
                </button>
              )}
              
              {currentCode && (
                <button
                  onClick={handleFixCodeClick}
                  disabled={(profile?.token_balance || 0) < 500}
                  className={`w-full py-3 px-4 rounded-md flex items-center justify-center space-x-2 ${
                    (profile?.token_balance || 0) >= 500 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Code2 className="w-5 h-5 mr-1" />
                  <span className="font-medium">{language === 'en' ? 'Fix Non-Functional Code' : 'Corrigir Código Não Funcional'}</span>
                </button>
              )}
              
              {(profile?.token_balance || 0) < 500 && (
                <div className="text-xs text-yellow-500 text-center mt-1 flex items-center justify-center">
                  <Coins className="w-3 h-3 mr-1" />
                  <span>{language === 'en' ? 'Not enough tokens (500 required)' : 'Tokens insuficientes (500 necessários)'}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">
                  {message.content}
                </pre>
                {message.role === 'assistant' && renderCreateRobotCTA(index)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Information Gathering Modal */}
      {showInformationGatheringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-4">
              {operationType === 'create' 
                ? 'Detalhes para Criação do Robô' 
                : 'Detalhes para Otimização do Robô'}
            </h3>
            
            {/* Predefined Strategy Prompts */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estratégias Prontas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {operationType === 'create' ? (
                  // Creation strategy prompts
                  creationStrategyPrompts.map(strategy => (
                    <button
                      key={strategy.id}
                      type="button"
                      onClick={() => handleSelectStrategyPrompt(strategy.id)}
                      className="flex items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-md text-left"
                    >
                      <div className="bg-blue-600 rounded-full p-2 mr-3">
                        {strategy.icon}
                      </div>
                      <div>
                        <p className="font-medium">{strategy.name}</p>
                        <p className="text-xs text-gray-400">{strategy.description}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  // Optimization strategy prompts
                  optimizationStrategyPrompts.map(strategy => (
                    <button
                      key={strategy.id}
                      type="button"
                      onClick={() => handleSelectStrategyPrompt(strategy.id)}
                      className="flex items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-md text-left"
                    >
                      <div className="bg-blue-600 rounded-full p-2 mr-3">
                        {strategy.icon}
                      </div>
                      <div>
                        <p className="font-medium">{strategy.name}</p>
                        <p className="text-xs text-gray-400">{strategy.description}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              {/* Strategy Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estratégia
                </label>
                <select
                  value={gatheringInfo.strategy}
                  onChange={(e) => setGatheringInfo({...gatheringInfo, strategy: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma estratégia</option>
                  {availableStrategies.map(strategy => (
                    <option key={strategy} value={strategy}>{strategy}</option>
                  ))}
                </select>
              </div>
              
              {/* Timeframes Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Períodos (Timeframes)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {availableTimeframes.map(timeframe => (
                    <button
                      key={timeframe.id}
                      type="button"
                      onClick={() => toggleGatheringTimeframe(timeframe.id)}
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        gatheringInfo.timeframes.includes(timeframe.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {timeframe.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Assets Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ativos
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {availableAssets.map(asset => (
                    <button
                      key={asset}
                      type="button"
                      onClick={() => toggleGatheringAsset(asset)}
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        gatheringInfo.assets.includes(asset)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {asset}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Risk Level */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nível de Risco
                </label>
                <div className="flex gap-3">
                  {availableRiskLevels.map(risk => (
                    <button
                      key={risk}
                      type="button"
                      onClick={() => setGatheringInfo({...gatheringInfo, riskLevel: risk})}
                      className={`px-3 py-1.5 rounded-md text-sm flex-1 ${
                        gatheringInfo.riskLevel === risk
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Additional Details */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Detalhes Adicionais
                </label>
                <textarea
                  value={gatheringInfo.additionalDetails}
                  onChange={(e) => setGatheringInfo({...gatheringInfo, additionalDetails: e.target.value})}
                  placeholder="Descreva detalhes específicos para seu robô..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowInformationGatheringModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitInformationGathering}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Gerar Robô
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fix Code Modal */}
      {showFixCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <Code2 className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-4">
              Corrigir Código Não Funcional
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição do Problema
                </label>
                <textarea
                  value={pendingDescription}
                  onChange={(e) => setPendingDescription(e.target.value)}
                  placeholder="Descreva o problema com o código atual (erros, comportamento inesperado, etc.)"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Código Atual</h4>
                <div className="bg-gray-900 p-3 rounded-lg max-h-48 overflow-y-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">{currentCode}</pre>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowFixCodeModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitFixCodeModal}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md flex items-center"
              >
                <Code2 className="w-4 h-4 mr-2" />
                Corrigir Código
              </button>
            </div>
          </div>
        </div>
      )}

      {showMessageConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <MessageSquare className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">
              {language === 'en' ? "Send Message to AI Assistant?" : "Enviar Mensagem para o Assistente de IA?"}
            </h3>
            <p className="mt-2 text-gray-400 text-center mb-4">
              {language === 'en' 
                ? "This will use 500 tokens from your balance."
                : "Isso usará 500 tokens do seu saldo."}
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmSendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                {language === 'en' ? "Send" : "Enviar"}
              </button>
              <button
                onClick={handleCancelSendMessage}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-md flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                {language === 'en' ? "Cancel" : "Cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-800">
        <div className="flex flex-col space-y-2">
          <textarea
            name="chatInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === 'en' ? "Type your message..." : "Digite sua mensagem..."}
            className="w-full bg-gray-800 text-white rounded-md px-4 py-3 min-h-[80px] max-h-[150px] resize-y"
            disabled={isLoading}
            rows={3}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400">
              {language === 'en' ? "Each message costs 500 tokens" : "Cada mensagem custa 500 tokens"}
            </div>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className={`px-4 py-2 rounded-md flex items-center ${
                isLoading || !input.trim()
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {language === 'en' ? "Send" : "Enviar"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { create } from 'zustand';

type Language = 'en' | 'pt';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Translations dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.robots': 'My Robots',
    'nav.community': 'Community',
    'nav.profile': 'Profile',
    'nav.subscription': 'Subscription',
    'nav.experts': 'Experts',
    'nav.signOut': 'Sign Out',
    
    // Buttons
    'button.createRobot': 'Create Robot',
    'button.newVersion': 'New Version',
    'button.save': 'Save',
    'button.share': 'Share',
    'button.export': 'Export',
    'button.cancel': 'Cancel',
    'button.back': 'Back',
    
    // Robot actions
    'robot.edit': 'Edit',
    'robot.delete': 'Delete',
    'robot.view': 'View',
    'robot.rename': 'Rename',
    
    // Sharing
    'share.title': 'Share Robot',
    'share.permission': 'Permission Level',
    'share.viewOnly': 'View Only',
    'share.canEdit': 'Can Edit',
    'share.generateLink': 'Generate Link',
    'share.inviteByEmail': 'Invite by Email',
    'share.shareLink': 'Share Link',
    
    // AI Assistant
    'ai.title': 'AI Assistant',
    'ai.placeholder': 'Ask me anything...',
    'ai.createRobot': 'Create Robot with AI',
    'ai.configAssistant': 'Configuration Assistant',
    'ai.clearChat': 'Clear Chat',
    'ai.buyTokens': 'Buy Tokens',
    'ai.notEnoughTokens': 'Not enough tokens. Please buy more.',
    'ai.tokenCost': 'Each AI analysis costs 100 tokens',
    
    // Tokens
    'tokens.balance': 'tokens',
    'tokens.buy': 'Buy Tokens',
    
    // Profile
    'profile.title': 'Profile Settings',
    'profile.photo': 'Profile Photo',
    'profile.email': 'Email Address',
    'profile.name': 'Display Name',
    'profile.save': 'Save Changes',
    
    // Subscription
    'subscription.title': 'Subscription & Tokens',
    'subscription.current': 'Current Plan',
    'subscription.status': 'Status',
    'subscription.renewal': 'Next Renewal',
    'subscription.manage': 'Manage Subscription',
    
    // Misc
    'loading': 'Loading...',
    'error': 'An error occurred',
    'success': 'Success!',
  },
  pt: {
    // Navigation
    'nav.robots': 'Meus Robôs',
    'nav.community': 'Comunidade',
    'nav.profile': 'Perfil',
    'nav.subscription': 'Assinatura',
    'nav.experts': 'Especialistas',
    'nav.signOut': 'Sair',
    
    // Buttons
    'button.createRobot': 'Criar Robô',
    'button.newVersion': 'Nova Versão',
    'button.save': 'Salvar',
    'button.share': 'Compartilhar',
    'button.export': 'Exportar',
    'button.cancel': 'Cancelar',
    'button.back': 'Voltar',
    
    // Robot actions
    'robot.edit': 'Editar',
    'robot.delete': 'Excluir',
    'robot.view': 'Visualizar',
    'robot.rename': 'Renomear',
    
    // Sharing
    'share.title': 'Compartilhar Robô',
    'share.permission': 'Nível de Permissão',
    'share.viewOnly': 'Apenas Visualização',
    'share.canEdit': 'Pode Editar',
    'share.generateLink': 'Gerar Link',
    'share.inviteByEmail': 'Convidar por Email',
    'share.shareLink': 'Link de Compartilhamento',
    
    // AI Assistant
    'ai.title': 'Assistente de IA',
    'ai.placeholder': 'Pergunte-me qualquer coisa...',
    'ai.createRobot': 'Criar Robô com IA',
    'ai.configAssistant': 'Assistente de Configuração',
    'ai.clearChat': 'Limpar Chat',
    'ai.buyTokens': 'Comprar Tokens',
    'ai.notEnoughTokens': 'Tokens insuficientes. Por favor, compre mais.',
    'ai.tokenCost': 'Cada análise de IA custa 100 tokens',
    
    // Tokens
    'tokens.balance': 'tokens',
    'tokens.buy': 'Comprar Tokens',
    
    // Profile
    'profile.title': 'Configurações de Perfil',
    'profile.photo': 'Foto de Perfil',
    'profile.email': 'Endereço de Email',
    'profile.name': 'Nome de Exibição',
    'profile.save': 'Salvar Alterações',
    
    // Subscription
    'subscription.title': 'Assinatura e Tokens',
    'subscription.current': 'Plano Atual',
    'subscription.status': 'Status',
    'subscription.renewal': 'Próxima Renovação',
    'subscription.manage': 'Gerenciar Assinatura',
    
    // Misc
    'loading': 'Carregando...',
    'error': 'Ocorreu um erro',
    'success': 'Sucesso!',
  }
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'pt', // Default language
  
  setLanguage: (language: Language) => {
    set({ language });
    // Save to localStorage for persistence
    localStorage.setItem('preferredLanguage', language);
  },
  
  t: (key: string) => {
    const { language } = get();
    return translations[language][key] || key;
  }
}));

// Initialize language from localStorage if available
if (typeof window !== 'undefined') {
  const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
  if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pt')) {
    useLanguageStore.getState().setLanguage(savedLanguage);
  }
}
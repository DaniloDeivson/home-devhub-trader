import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Bot, Users, Zap, Code2, MessageSquare } from 'lucide-react';

interface FloatingAssistantProps {
  onClose?: () => void;
}

export function FloatingAssistant({ onClose }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if the assistant has been dismissed before
    const assistantDismissed = localStorage.getItem('assistantDismissed');
    if (assistantDismissed === 'true') {
      setDismissed(true);
      setIsOpen(false);
    } else {
      // Always show the assistant by default
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Don't mark as permanently dismissed yet
    if (onClose) onClose();
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setDismissed(true);
    // Mark as dismissed in localStorage
    localStorage.setItem('assistantDismissed', 'true');
    if (onClose) onClose();
  };

  const steps = [
    {
      title: "Bem-vindo ao DevHub Trader!",
      content: "Crie e gerencie seus robôs de trading com facilidade. Vamos conhecer as principais funcionalidades da plataforma.",
      icon: <Bot className="w-8 h-8 text-blue-500" />
    },
    {
      title: "Crie seu robô sozinho ou com amigos",
      content: "Desenvolva robôs de trading individualmente ou colabore em tempo real com outros usuários. Compartilhe seus projetos facilmente.",
      icon: <Users className="w-8 h-8 text-green-500" />
    },
    {
      title: "Use a IA ou programe no editor",
      content: "Utilize nosso assistente de IA para criar estratégias automaticamente ou programe diretamente no editor avançado com suporte a NTSL.",
      icon: <Code2 className="w-8 h-8 text-purple-500" />
    },
    {
      title: "Faça reload de tokens e crie robôs no automático",
      content: "Recarregue tokens para utilizar recursos de IA e crie robôs automaticamente com base em suas necessidades de trading.",
      icon: <Zap className="w-8 h-8 text-yellow-500" />
    }
  ];

  if (dismissed) {
    return (
      <button 
        onClick={() => {
          setDismissed(false);
          setIsOpen(true);
          localStorage.removeItem('assistantDismissed');
        }}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg z-50 flex items-center justify-center"
        aria-label="Open assistant"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    );
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg z-50 flex items-center justify-center"
        aria-label="Open assistant"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-medium text-white">Assistente da Plataforma</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white"
              aria-label="Dismiss assistant"
              title="Não mostrar novamente"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
              aria-label="Minimize assistant"
              title="Minimizar"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-center mb-4">
            {steps[currentStep].icon}
          </div>
          
          <h4 className="text-lg font-semibold text-center mb-3">
            {steps[currentStep].title}
          </h4>
          
          <p className="text-gray-300 text-center mb-6">
            {steps[currentStep].content}
          </p>
          
          {/* Step indicators */}
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full ${
                  currentStep === index ? 'bg-blue-500' : 'bg-gray-600'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                Entendi!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
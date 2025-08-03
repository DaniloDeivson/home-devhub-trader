import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Eye, EyeOff, ArrowRight, Code2, Check, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>(initialMode);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [smsTimer, setSmsTimer] = useState(0);
  
  const { signInWithEmail, signUpWithEmail } = useAuthStore();
  const { language } = useLanguageStore();

  // SMS timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (smsTimer > 0) {
      interval = setInterval(() => {
        setSmsTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [smsTimer]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      resetForm();
    }
  }, [isOpen, initialMode]);

  const resetForm = () => {
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setSmsCode('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setSuccess(null);
    setSmsTimer(0);
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError(language === 'en' ? 'Email is required' : 'Email é obrigatório');
      return false;
    }

    if (!email.includes('@')) {
      setError(language === 'en' ? 'Please enter a valid email' : 'Por favor, insira um email válido');
      return false;
    }

    if (!password.trim()) {
      setError(language === 'en' ? 'Password is required' : 'Senha é obrigatória');
      return false;
    }

    if (password.length < 6) {
      setError(language === 'en' ? 'Password must be at least 6 characters' : 'Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (mode === 'register') {
      if (!phone.trim()) {
        setError(language === 'en' ? 'Phone number is required' : 'Telefone é obrigatório');
        return false;
      }

      if (password !== confirmPassword) {
        setError(language === 'en' ? 'Passwords do not match' : 'Senhas não coincidem');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        // Simulate SMS sending
        setSmsTimer(60);
        setMode('verify');
        setSuccess(language === 'en' 
          ? 'Verification code sent to your phone' 
          : 'Código de verificação enviado para seu telefone');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 
        (mode === 'register' 
          ? (language === 'en' ? 'Registration failed' : 'Falha no cadastro')
          : (language === 'en' ? 'Login failed' : 'Falha no login')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSMSVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!smsCode.trim() || smsCode.length !== 6) {
      setError(language === 'en' ? 'Please enter the 6-digit code' : 'Por favor, insira o código de 6 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate SMS verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Complete registration
      await signUpWithEmail(email, password, phone);
      
      setSuccess(language === 'en' ? 'Account created successfully!' : 'Conta criada com sucesso!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('SMS verification error:', error);
      setError(error instanceof Error ? error.message : 
        (language === 'en' ? 'Verification failed' : 'Falha na verificação'));
    } finally {
      setIsLoading(false);
    }
  };

  const resendSMS = () => {
    setSmsTimer(60);
    setSuccess(language === 'en' 
      ? 'New code sent to your phone' 
      : 'Novo código enviado para seu telefone');
  };

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as +55 (11) 98765-4321
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E1E1E] rounded-lg w-full max-w-md mx-auto p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Code2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
            {mode === 'login' 
              ? (language === 'en' ? 'Welcome Back' : 'Bem-vindo de Volta')
              : mode === 'register'
              ? (language === 'en' ? 'Create Account' : 'Criar Conta')
              : (language === 'en' ? 'Verify Phone' : 'Verificar Telefone')}
          </h2>
          <p className="mt-2 text-gray-400 text-sm sm:text-base">
            {mode === 'login' 
              ? (language === 'en' ? 'Sign in to continue' : 'Entre para continuar')
              : mode === 'register'
              ? (language === 'en' ? 'Start your trading journey' : 'Comece sua jornada de trading')
              : (language === 'en' ? 'Enter the code sent to your phone' : 'Digite o código enviado para seu telefone')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md text-red-500 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-md text-green-500 text-sm flex items-center">
            <Check className="w-4 h-4 mr-2 flex-shrink-0" />
            {success}
          </div>
        )}

        {mode === 'verify' ? (
          <form onSubmit={handleSMSVerification} className="space-y-4">
            <div>
              <label htmlFor="sms-code" className="block text-sm font-medium text-gray-300 mb-2">
                {language === 'en' ? 'Verification Code' : 'Código de Verificação'}
              </label>
              <input
                id="sms-code"
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
                autoComplete="one-time-code"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-1 text-center">
                {language === 'en' ? 'Code sent to' : 'Código enviado para'} {phone}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || smsCode.length !== 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Verifying...' : 'Verificando...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Verify & Create Account' : 'Verificar e Criar Conta'}
                </>
              )}
            </button>

            <div className="text-center">
              {smsTimer > 0 ? (
                <p className="text-sm text-gray-400">
                  {language === 'en' ? 'Resend code in' : 'Reenviar código em'} {smsTimer}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={resendSMS}
                  className="text-sm text-blue-400 hover:text-blue-300"
                  disabled={isLoading}
                >
                  {language === 'en' ? 'Resend code' : 'Reenviar código'}
                </button>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-sm text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                {language === 'en' ? '← Back to registration' : '← Voltar ao cadastro'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'en' ? 'your@email.com' : 'seu@email.com'}
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                  {language === 'en' ? 'Phone Number' : 'Telefone'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+55 (11) 98765-4321"
                    autoComplete="tel"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                {language === 'en' ? 'Password' : 'Senha'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  placeholder="••••••••"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
                  {language === 'en' ? 'Confirm Password' : 'Confirmar Senha'}
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'register' 
                    ? (language === 'en' ? 'Creating...' : 'Criando...')
                    : (language === 'en' ? 'Signing in...' : 'Entrando...')}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {mode === 'register' 
                    ? (language === 'en' ? 'Create Account' : 'Criar Conta')
                    : (language === 'en' ? 'Sign In' : 'Entrar')}
                </>
              )}
            </button>
          </form>
        )}

        {mode !== 'verify' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {mode === 'register' 
                ? (language === 'en' ? 'Already have an account?' : 'Já tem uma conta?')
                : (language === 'en' ? 'Don\'t have an account?' : 'Não tem uma conta?')}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register');
                  resetForm();
                }}
                className="text-blue-400 hover:text-blue-300 font-medium"
                disabled={isLoading}
              >
                {mode === 'register' 
                  ? (language === 'en' ? 'Sign in' : 'Fazer login')
                  : (language === 'en' ? 'Sign up' : 'Cadastrar-se')}
              </button>
            </p>
            
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              {language === 'en' 
                ? 'By continuing, you agree to our'
                : 'Ao continuar, você concorda com nossos'}{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                {language === 'en' ? 'Terms of Service' : 'Termos de Serviço'}
              </a> {language === 'en' ? 'and' : 'e'}{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                {language === 'en' ? 'Privacy Policy' : 'Política de Privacidade'}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
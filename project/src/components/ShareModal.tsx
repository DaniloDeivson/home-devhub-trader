import React, { useState, useEffect } from 'react';
import { Share2, X, Mail, Check, AlertTriangle, Copy, Link } from 'lucide-react';
import { useSharingStore } from '../stores/sharingStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  robotName: string;
}

export function ShareModal({ isOpen, onClose, robotName }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingInvite, setExistingInvite] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLinkSection, setShowLinkSection] = useState(false);
  const { invites, createInvite, loadInvites, isLoading, checkExistingInvite } = useSharingStore();
  const { profile } = useAuthStore();

  useEffect(() => {
    if (!robotName) {
      onClose();
      return;
    }
    loadInvites(robotName);
  }, [robotName, loadInvites, onClose]);

  useEffect(() => {
    const checkInvite = async () => {
      if (email && robotName) {
        const existing = await checkExistingInvite(robotName, email);
        setExistingInvite(!!existing);
      } else {
        setExistingInvite(false);
      }
    };
    checkInvite();
  }, [email, robotName, checkExistingInvite]);

  const handleInvite = async () => {
    setError(null);

    if (!robotName?.trim()) {
      setError('Robot name cannot be empty');
      return;
    }

    if (!email?.trim()) {
      setError('Email cannot be empty');
      return;
    }

    try {
      // Check if user exists first with retry logic
      const checkUser = async (retries = 3): Promise<boolean> => {
        try {
          const { data: response, error: userCheckError } = await supabase.functions.invoke('check-user-exists', {
            body: { email },
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (userCheckError) throw userCheckError;
          return response?.exists ?? false;

        } catch (error) {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return checkUser(retries - 1);
          }
          throw error;
        }
      };

      const userExists = await checkUser();
      
      if (!userExists) {
        setError('Este email não está registrado. Por favor, convide um usuário registrado.');
        return;
      }

      // First create the invite in the database
      await createInvite({
        robotName,
        email,
        permission
      });

      // Generate invite link with proper domain
      const baseUrl = "https://devhubtrader.com.br";
      const inviteLink = `${baseUrl}/robots/${robotName}`;

      // Send the invitation email with retry logic
      const sendEmail = async (retries = 3) => {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
            body: {
              robotName,
              email,
              inviterName: profile?.name || profile?.email || 'A user',
              permission,
              inviteLink,
            },
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (emailError) throw emailError;
        } catch (error) {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return sendEmail(retries - 1);
          }
          throw error;
        }
      };

      await sendEmail();

      setEmail('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error: any) {
      console.error('Error sending invite:', error);
      const errorMessage = error.message || 'Failed to send invite. Please try again.';
      setError(errorMessage.includes('Server configuration error') 
        ? 'The server is currently unavailable. Please try again later or contact support.'
        : errorMessage
      );
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      const { error } = await supabase.functions.invoke('revoke-invite', {
        body: { inviteId },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        throw error;
      }

      await loadInvites(robotName);
    } catch (error: any) {
      console.error('Error revoking invite:', error);
      setError(error.message || 'Failed to revoke access. Please try again.');
    }
  };

  const handleCreateLink = async () => {
    try {
      setError(null);

      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: {
          robotName,
          permission
        }
      });

      if (error) throw error;
      
      // Use the new domain for the share URL
      const baseUrl = "https://devhubtrader.com.br";
      const shareUrl = `${baseUrl}/shared/${data.data.token}`;
      setShareUrl(shareUrl);
      setShowLinkSection(true);
    } catch (error) {
      console.error('Error creating share link:', error);
      setError(error instanceof Error ? error.message : 'Failed to create share link');
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setError('Failed to copy to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E1E1E] rounded-lg max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Share2 className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">
            Compartilhar Robô
          </h2>
          <p className="mt-2 text-gray-400">
            Compartilhe "{robotName}" com outros usuários
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center text-red-500">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {showSuccess && (
          <div className="mb-4 p-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-md flex items-center text-green-500">
            <Check className="w-4 h-4 mr-2" />
            <span>Convite enviado com sucesso!</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Permissão de acesso
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="view"
                  checked={permission === 'view'}
                  onChange={() => setPermission('view')}
                  className="sr-only"
                />
                <div className={`px-3 py-1.5 rounded ${
                  permission === 'view' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  Visualizar
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="edit"
                  checked={permission === 'edit'}
                  onChange={() => setPermission('edit')}
                  className="sr-only"
                />
                <div className={`px-3 py-1.5 rounded ${
                  permission === 'edit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  Editar
                </div>
              </label>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleCreateLink}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center"
            >
              <Link className="w-4 h-4 mr-2" />
              Gerar Link
            </button>
            
            <button
              onClick={() => setShowLinkSection(false)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Convidar por Email
            </button>
          </div>

          {showLinkSection ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Link de compartilhamento
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={shareUrl || ''}
                  readOnly
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-l-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-r-md flex items-center"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Este link permite {permission === 'view' ? 'visualizar' : 'editar'} o robô
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email do colaborador
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colaborador@email.com"
                    className="w-full pl-3 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {existingInvite && (
                  <p className="mt-2 text-yellow-500 text-sm">
                    Um convite ativo já existe para este email. Enviar um novo convite substituirá o anterior.
                  </p>
                )}
              </div>

              <button
                onClick={handleInvite}
                disabled={isLoading}
                className={`w-full py-2 rounded-md transition-colors ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isLoading ? 'Enviando...' : 'Enviar Convite'}
              </button>
            </>
          )}
        </div>

        {invites.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Convites Ativos
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {invites.map((invite) => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{invite.email}</p>
                    <p className="text-xs text-gray-400">
                      {invite.permission === 'edit' ? 'Editor' : 'Viewer'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(invite.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-white"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-800 rounded-md flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-medium mb-1">Sobre Compartilhamento</p>
            <ul className="space-y-1">
              <li>• Os convites são gerenciados dentro da plataforma</li>
              <li>• Os colaboradores serão notificados quando fizerem login</li>
              <li>• Você pode revogar o acesso a qualquer momento</li>
              <li>• Os convites expiram após 7 dias se não forem aceitos</li>
              <li>• Links de compartilhamento funcionam para qualquer pessoa</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
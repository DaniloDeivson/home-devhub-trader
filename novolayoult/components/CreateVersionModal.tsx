import React, { useState, useEffect } from 'react';
import { Save, X, AlertTriangle, Check, Tag, Plus, Clock, Calendar } from 'lucide-react';
import { isValidVersionFormat, generateUniqueVersionName } from '../utils/robotUtils';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (versionName: string, description?: string, tags?: string[]) => Promise<void>;
  existingVersions: string[];
  suggestedName?: string;
  suggestedDescription?: string;
}

export function CreateVersionModal({
  isOpen,
  onClose,
  onSave,
  existingVersions = [], // Provide default empty array
  suggestedName = '',
  suggestedDescription = ''
}: CreateVersionModalProps) {
  const [versionName, setVersionName] = useState(suggestedName);
  const [description, setDescription] = useState(suggestedDescription);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [showTagsInput, setShowTagsInput] = useState(false);
  
  // Timeframes and Assets
  const [showTimeframeInput, setShowTimeframeInput] = useState(false);
  const [showAssetInput, setShowAssetInput] = useState(false);
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [customAsset, setCustomAsset] = useState('');
  
  // Available options
  const availableTags = [
    'trailing', 'sem-trailing', 'tendencia', 'reversao', 'medias-moveis', 
    'rompimento', 'volatilidade-alta', 'volatilidade-baixa', 'correlacao', 
    'alvo-longo', 'alvo-curto'
  ];
  
  const availableTimeframes = [
    'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'
  ];
  
  const availableAssets = [
    'WINFUT', 'WDOFUT', 'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'MGLU3', 'BOVA11'
  ];

  // Reset form when modal opens or suggestions change
  useEffect(() => {
    if (isOpen) {
      setVersionName(suggestedName);
      setDescription(suggestedDescription);
      setError(null);
      setSelectedTags([]);
      setCustomTag('');
      setShowSuccess(false);
      setShowTagsInput(false);
      setShowTimeframeInput(false);
      setShowAssetInput(false);
      setCustomTimeframe('');
      setCustomAsset('');
    }
  }, [isOpen, suggestedName, suggestedDescription]);

  const validateVersion = (): boolean => {
    // First check if versionName exists and is not empty
    if (!versionName || typeof versionName !== 'string' || !versionName.trim()) {
      setError('O nome da versão não pode estar vazio');
      return false;
    }

    const trimmedVersionName = versionName.trim();

    // Only check version format if it starts with 'v'
    if (trimmedVersionName.startsWith('v')) {
      try {
        if (!isValidVersionFormat(trimmedVersionName)) {
          setError('O formato de versão deve ser vX.X.X (ex: v1.0.0)');
          return false;
        }
      } catch (error) {
        setError('Formato de versão inválido');
        return false;
      }
    }

    // Check if name already exists in the existingVersions array
    if (existingVersions.includes(trimmedVersionName)) {
      setError('Já existe uma versão com este nome');
      return false;
    }

    // Require description
    if (!description?.trim()) {
      setError('A descrição da versão é obrigatória');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateVersion()) {
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      // Ensure versionName exists and is trimmed before generating unique name
      if (!versionName) {
        throw new Error('Nome da versão é obrigatório');
      }
      
      // Generate a unique version name
      const uniqueVersionName = await generateUniqueVersionName(versionName.trim(), existingVersions);
      
      // Combine selected tags with custom tag if provided
      const finalTags = [...selectedTags];
      if (customTag.trim() && !finalTags.includes(customTag.trim())) {
        finalTags.push(customTag.trim());
      }
      
      await onSave(
        uniqueVersionName,
        description.trim(), 
        finalTags.length > 0 ? finalTags : undefined
      );
      
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving version:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar versão');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };
  
  const toggleTimeframe = (timeframe: string) => {
    const tag = `tf-${timeframe.toLowerCase()}`;
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const toggleAsset = (asset: string) => {
    const tag = `ativo-${asset.toLowerCase()}`;
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const handleAddCustomTimeframe = () => {
    if (customTimeframe.trim()) {
      const tag = `tf-${customTimeframe.trim().toLowerCase()}`;
      if (!selectedTags.includes(tag)) {
        setSelectedTags([...selectedTags, tag]);
        setCustomTimeframe('');
      }
    }
  };
  
  const handleAddCustomAsset = () => {
    if (customAsset.trim()) {
      const tag = `ativo-${customAsset.trim().toLowerCase()}`;
      if (!selectedTags.includes(tag)) {
        setSelectedTags([...selectedTags, tag]);
        setCustomAsset('');
      }
    }
  };
  
  // Helper functions to filter tags by type
  const getTimeframeTags = () => {
    return selectedTags.filter(tag => tag.startsWith('tf-')).map(tag => tag.replace('tf-', '').toUpperCase());
  };
  
  const getAssetTags = () => {
    return selectedTags.filter(tag => tag.startsWith('ativo-')).map(tag => tag.replace('ativo-', '').toUpperCase());
  };
  
  const getRegularTags = () => {
    return selectedTags.filter(tag => !tag.startsWith('tf-') && !tag.startsWith('ativo-'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E1E1E] rounded-lg max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={isSaving || showSuccess}
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Save className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">
            Salvar Nova Versão
          </h2>
          <p className="mt-2 text-gray-400">
            Dê um nome à sua versão para facilitar a identificação futura
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
            <span>Versão salva com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="version-name" className="block text-sm font-medium text-gray-300 mb-1">
              Nome da versão*
            </label>
            <input
              id="version-name"
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Ex: v1.0.0, Implementação Stop Loss"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              disabled={isSaving || showSuccess}
            />
          </div>

          <div>
            <label htmlFor="version-description" className="block text-sm font-medium text-gray-300 mb-1">
              Descrição*
            </label>
            <textarea
              id="version-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as alterações desta versão"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving || showSuccess}
            />
          </div>

          {/* Timeframes Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Timeframes
              </label>
              <span className="text-xs text-gray-500">
                {getTimeframeTags().length} selecionados
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableTimeframes.map(timeframe => (
                <button
                  key={timeframe}
                  type="button"
                  onClick={() => toggleTimeframe(timeframe)}
                  className={`px-2 py-1 rounded-md text-xs flex items-center ${
                    getTimeframeTags().includes(timeframe)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={isSaving || showSuccess}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {timeframe}
                </button>
              ))}
            </div>
            
            {showTimeframeInput ? (
              <div className="flex gap-2 items-center mb-3">
                <input
                  type="text"
                  value={customTimeframe}
                  onChange={(e) => setCustomTimeframe(e.target.value)}
                  placeholder="Timeframe personalizado"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isSaving || showSuccess}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTimeframe}
                  disabled={!customTimeframe.trim() || isSaving || showSuccess}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimeframeInput(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm"
                  disabled={isSaving || showSuccess}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTimeframeInput(true)}
                className="text-purple-400 hover:text-purple-300 text-xs flex items-center mb-3"
                disabled={isSaving || showSuccess}
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar Timeframe Personalizado
              </button>
            )}
          </div>
          
          {/* Assets Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Ativos
              </label>
              <span className="text-xs text-gray-500">
                {getAssetTags().length} selecionados
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableAssets.map(asset => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => toggleAsset(asset)}
                  className={`px-2 py-1 rounded-md text-xs flex items-center ${
                    getAssetTags().includes(asset)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={isSaving || showSuccess}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {asset}
                </button>
              ))}
            </div>
            
            {showAssetInput ? (
              <div className="flex gap-2 items-center mb-3">
                <input
                  type="text"
                  value={customAsset}
                  onChange={(e) => setCustomAsset(e.target.value)}
                  placeholder="Ativo personalizado"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isSaving || showSuccess}
                />
                <button
                  type="button"
                  onClick={handleAddCustomAsset}
                  disabled={!customAsset.trim() || isSaving || showSuccess}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssetInput(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm"
                  disabled={isSaving || showSuccess}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAssetInput(true)}
                className="text-green-400 hover:text-green-300 text-xs flex items-center mb-3"
                disabled={isSaving || showSuccess}
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar Ativo Personalizado
              </button>
            )}
          </div>

          {/* Regular Tags Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Tags
              </label>
              <span className="text-xs text-gray-500">
                {getRegularTags().length} selecionadas
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 rounded-md text-xs ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={isSaving || showSuccess}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            {showTagsInput ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Tag personalizada"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isSaving || showSuccess}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim() || isSaving || showSuccess}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setShowTagsInput(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
                  disabled={isSaving || showSuccess}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTagsInput(true)}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                disabled={isSaving || showSuccess}
              >
                <Tag className="w-4 h-4 mr-1" />
                Adicionar Tag Personalizada
              </button>
            )}
          </div>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="p-3 bg-gray-800 rounded-md">
              <div className="flex flex-wrap gap-2">
                {/* Timeframe Tags */}
                {getTimeframeTags().length > 0 && (
                  <div className="flex items-center mr-1">
                    <Clock className="w-3 h-3 text-purple-400 mr-1" />
                    {getTimeframeTags().map(tf => (
                      <span key={`tf-${tf}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-900 text-purple-300 mr-1">
                        {tf}
                        <button
                          type="button"
                          onClick={() => toggleTimeframe(tf)}
                          className="ml-1 text-purple-300 hover:text-purple-100"
                          disabled={isSaving || showSuccess}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Asset Tags */}
                {getAssetTags().length > 0 && (
                  <div className="flex items-center mr-1">
                    <Calendar className="w-3 h-3 text-green-400 mr-1" />
                    {getAssetTags().map(asset => (
                      <span key={`asset-${asset}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-900 text-green-300 mr-1">
                        {asset}
                        <button
                          type="button"
                          onClick={() => toggleAsset(asset)}
                          className="ml-1 text-green-300 hover:text-green-100"
                          disabled={isSaving || showSuccess}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Regular Tags */}
                {getRegularTags().map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-900 text-blue-300">
                    {tag}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="ml-1 text-blue-300 hover:text-blue-100"
                      disabled={isSaving || showSuccess}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
              disabled={isSaving || showSuccess}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!versionName?.trim() || !description?.trim() || isSaving || showSuccess}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Versão
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-400">
            <p className="mb-2">
              <strong>Dica:</strong> Use nomes descritivos para identificar facilmente cada versão.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Para alterações importantes: <span className="text-blue-400">v1.0.0</span></li>
              <li>Para novas funcionalidades: <span className="text-blue-400">v0.2.0</span></li>
              <li>Para correções: <span className="text-blue-400">v0.1.1</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
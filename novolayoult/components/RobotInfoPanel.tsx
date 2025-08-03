import React, { useState, useEffect } from 'react';
import { 
  Info, Edit2, Save, X, Tag, Clock, Calendar, Clipboard, Check, 
  ChevronDown, ChevronUp, Plus
} from 'lucide-react';
import { useRobotStore } from '../stores/robotStore';

interface RobotInfoPanelProps {
  robotId: string;
  versionId: string | null;
  versionName: string | null;
  description: string;
  tags: string[];
  createdAt: string;
  createdBy: string;
  onUpdate: (data: {
    description: string;
    tags: string[];
  }) => Promise<void>;
}

export function RobotInfoPanel({
  robotId,
  versionId,
  versionName,
  description,
  tags,
  createdAt,
  createdBy,
  onUpdate
}: RobotInfoPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);
  const [editedTags, setEditedTags] = useState<string[]>(tags);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [descriptionCopied, setDescriptionCopied] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [customAsset, setCustomAsset] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showTimeframeInput, setShowTimeframeInput] = useState(false);
  const [showAssetInput, setShowAssetInput] = useState(false);

  // Available options
  const availableTags = [
    'trailing', 'sem-trailing', 'tendencia', 'reversao', 'medias-moveis', 
    'rompimento', 'volatilidade-alta', 'volatilidade-baixa', 'correlacao', 
    'alvo-longo', 'alvo-curto', 'hft', 'scalping', 'intraday', 'swing'
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

  useEffect(() => {
    setEditedDescription(description);
    setEditedTags(tags);
  }, [description, tags]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Extract timeframes and assets from tags
  const getTimeframesFromTags = () => {
    return editedTags
      .filter(tag => tag.startsWith('tf-'))
      .map(tag => {
        const timeframeId = tag.replace('tf-', '').toUpperCase();
        const timeframe = availableTimeframes.find(t => t.id === timeframeId);
        return {
          id: timeframeId,
          name: timeframe ? timeframe.name : timeframeId
        };
      });
  };

  const getAssetsFromTags = () => {
    return editedTags
      .filter(tag => tag.startsWith('ativo-'))
      .map(tag => tag.replace('ativo-', '').toUpperCase());
  };

  // Get other tags (not timeframes or assets)
  const getOtherTags = () => {
    return editedTags
      .filter(tag => !tag.startsWith('tf-') && !tag.startsWith('ativo-'));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        description: editedDescription,
        tags: editedTags
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating robot info:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedDescription(description);
    setEditedTags(tags);
    setIsEditing(false);
  };

  const toggleTag = (tag: string) => {
    if (editedTags.includes(tag)) {
      setEditedTags(editedTags.filter(t => t !== tag));
    } else {
      setEditedTags([...editedTags, tag]);
    }
  };

  const toggleTimeframe = (timeframeId: string) => {
    const timeframeTag = `tf-${timeframeId.toLowerCase()}`;
    if (editedTags.includes(timeframeTag)) {
      setEditedTags(editedTags.filter(t => t !== timeframeTag));
    } else {
      // Remove other timeframe tags first (optional, if you want only one timeframe)
      // const newTags = editedTags.filter(t => !t.startsWith('tf-'));
      // setEditedTags([...newTags, timeframeTag]);
      
      // Or allow multiple timeframes
      setEditedTags([...editedTags, timeframeTag]);
    }
  };

  const toggleAsset = (asset: string) => {
    const assetTag = `ativo-${asset.toLowerCase()}`;
    if (editedTags.includes(assetTag)) {
      setEditedTags(editedTags.filter(t => t !== assetTag));
    } else {
      setEditedTags([...editedTags, assetTag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !editedTags.includes(customTag.trim())) {
      setEditedTags([...editedTags, customTag.trim()]);
      setCustomTag('');
      setShowTagInput(false);
    }
  };

  const handleAddCustomTimeframe = () => {
    if (customTimeframe.trim()) {
      const timeframeTag = `tf-${customTimeframe.trim().toLowerCase()}`;
      if (!editedTags.includes(timeframeTag)) {
        setEditedTags([...editedTags, timeframeTag]);
        setCustomTimeframe('');
        setShowTimeframeInput(false);
      }
    }
  };

  const handleAddCustomAsset = () => {
    if (customAsset.trim()) {
      const assetTag = `ativo-${customAsset.trim().toLowerCase()}`;
      if (!editedTags.includes(assetTag)) {
        setEditedTags([...editedTags, assetTag]);
        setCustomAsset('');
        setShowAssetInput(false);
      }
    }
  };

  const copyVersionInfo = async () => {
    try {
      const versionInfo = `Informações da Versão\n\n` +
        `Nome: ${versionName}\n` +
        `Criada em: ${formatDate(createdAt)}\n` +
        `Criada por: ${createdBy ? 'Usuário' : 'IA'}\n` +
        `Descrição completa: ${description}\n` +
        `Tags: ${tags.join(', ')}\n`;

      await navigator.clipboard.writeText(versionInfo);
      setDescriptionCopied(true);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setDescriptionCopied(false);
      }, 2000);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
      successMessage.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Informações da versão copiadas para a área de transferência!
      `;
      document.body.appendChild(successMessage);

      // Remove success message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy version info:', err);
      alert('Falha ao copiar informações da versão');
    }
  };

  return (
    <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Info className="w-4 h-4 text-blue-400 mr-2" />
          <h3 className="font-medium text-white">Informações da Versão</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                title="Cancelar edição"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                className="p-1 hover:bg-gray-700 rounded text-blue-400 hover:text-blue-300"
                title="Salvar alterações"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                title="Editar informações"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={copyVersionInfo}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                title="Copiar informações"
              >
                {descriptionCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Clipboard className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                title={isExpanded ? "Recolher painel" : "Expandir painel"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-2 p-3 bg-gray-700 rounded-md">
        {isEditing ? (
          <div className="space-y-4">
            {/* Description Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descreva esta versão do robô..."
              />
            </div>

            {/* Timeframes Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Períodos (Timeframes)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {availableTimeframes.map(timeframe => (
                  <button
                    key={timeframe.id}
                    type="button"
                    onClick={() => toggleTimeframe(timeframe.id)}
                    className={`px-2 py-1 rounded-md text-xs flex items-center ${
                      editedTags.includes(`tf-${timeframe.id.toLowerCase()}`)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {timeframe.name}
                  </button>
                ))}
              </div>
              
              {showTimeframeInput ? (
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={customTimeframe}
                    onChange={(e) => setCustomTimeframe(e.target.value)}
                    placeholder="Período personalizado"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-l-md px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTimeframe}
                    disabled={!customTimeframe.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded-r-md text-xs disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTimeframeInput(false)}
                    className="bg-gray-800 hover:bg-gray-600 text-white px-2 py-1.5 rounded-md text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTimeframeInput(true)}
                  className="text-purple-400 hover:text-purple-300 text-xs flex items-center mb-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Período Personalizado
                </button>
              )}
            </div>

            {/* Assets Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Ativos
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {availableAssets.map(asset => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => toggleAsset(asset)}
                    className={`px-2 py-1 rounded-md text-xs flex items-center ${
                      editedTags.includes(`ativo-${asset.toLowerCase()}`)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {asset}
                  </button>
                ))}
              </div>
              
              {showAssetInput ? (
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={customAsset}
                    onChange={(e) => setCustomAsset(e.target.value)}
                    placeholder="Ativo personalizado"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-l-md px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAsset}
                    disabled={!customAsset.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded-r-md text-xs disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssetInput(false)}
                    className="bg-gray-800 hover:bg-gray-600 text-white px-2 py-1.5 rounded-md text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAssetInput(true)}
                  className="text-green-400 hover:text-green-300 text-xs flex items-center mb-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Ativo Personalizado
                </button>
              )}
            </div>

            {/* Tags Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded-md text-xs ${
                      editedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              {showTagInput ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Tag personalizada"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-l-md px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    disabled={!customTag.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-r-md text-xs disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTagInput(false)}
                    className="bg-gray-800 hover:bg-gray-600 text-white px-2 py-1.5 rounded-md text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTagInput(true)}
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Tag Personalizada
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`space-y-2 ${isExpanded ? '' : 'max-h-32 overflow-hidden'}`}>
            <div>
              <p className="text-xs text-gray-400">Criada em:</p>
              <p className="text-sm">{formatDate(createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Criada por:</p>
              <p className="text-sm">{createdBy ? 'Usuário' : 'IA'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Descrição:</p>
              <p className="text-sm whitespace-pre-line">{description}</p>
            </div>
            
            {/* Timeframes Section */}
            {getTimeframesFromTags().length > 0 && (
              <div>
                <p className="text-xs text-gray-400">Períodos:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getTimeframesFromTags().map(tf => (
                    <span key={tf.id} className="px-2 py-0.5 text-xs bg-purple-900 text-purple-300 rounded flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {tf.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Assets Section */}
            {getAssetsFromTags().length > 0 && (
              <div>
                <p className="text-xs text-gray-400">Ativos:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getAssetsFromTags().map(asset => (
                    <span key={asset} className="px-2 py-0.5 text-xs bg-green-900 text-green-300 rounded flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Other Tags Section */}
            {getOtherTags().length > 0 && (
              <div>
                <p className="text-xs text-gray-400">Tags:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getOtherTags().map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-blue-900 text-blue-300 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, Folder, Search, Clock, FolderPlus, 
  RefreshCw, AlertTriangle, ChevronDown, MoreHorizontal,
  User, Share2, Settings, Trash2, Edit2, X, Code2, Save, Download, Check, LogOut, MessageSquare,
  ArrowLeft, Layers, Grid, Copy, FileDown, HelpCircle, Tag, Info, Clipboard, Calendar
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useRobotStore } from '../stores/robotStore';
import { Editor } from '../components/Editor';
import { ShareModal } from '../components/ShareModal';
import { CreateVersionModal } from '../components/CreateVersionModal';
import { AIChat } from '../components/AIChat';
import { FloatingAssistant } from '../components/FloatingAssistant';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLanguageStore } from '../stores/languageStore';
import { Navbar } from '../components/Navbar';
import { RobotInfoPanel } from '../components/RobotInfoPanel';
import { RobotTechnicalInfo } from '../components/RobotTechnicalInfo';

export function EditorPage() {
  const { robotId } = useParams<{ robotId: string }>();
  const navigate = useNavigate();
  
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState<'ntsl' | 'mql5'>('ntsl');
  const [collaborators, setCollaborators] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(true);
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [robotTitle, setRobotTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAssistant, setShowAssistant] = useState(true);
  const [currentVersionTags, setCurrentVersionTags] = useState<string[]>([]);
  const [currentVersionDescription, setCurrentVersionDescription] = useState<string>('');
  const [showVersionInfoPanel, setShowVersionInfoPanel] = useState(false);
  const [currentVersionCreatedAt, setCurrentVersionCreatedAt] = useState<string>('');
  const [currentVersionCreatedBy, setCurrentVersionCreatedBy] = useState<string>('');
  const [descriptionCopied, setDescriptionCopied] = useState(false);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { signOut, profile } = useAuthStore();
  const { robots, versions, currentVersion, loadVersions, createVersion, updateVersion, loadRobots, renameRobot } = useRobotStore();
  const { t } = useLanguageStore();

  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadRobots();
      } catch (error) {
        console.error('Error loading robots:', error);
        // Don't block the editor if robots fail to load
      }
    };
    
    initializeData();
  }, [loadRobots]);

  useEffect(() => {
    if (robotId) {
      const robot = robots.find(r => r.id === robotId);
      if (robot) {
        setRobotTitle(robot.name);
        loadVersions(robotId)
          .then(loadedVersions => {
            if (loadedVersions.length > 0) {
              const firstVersion = loadedVersions[0];
              setSelectedVersion(firstVersion.version_name);
              setEditorContent(firstVersion.code);
              setCurrentVersionDescription(firstVersion.description || '');
              setCurrentVersionTags(firstVersion.tags || []);
              setCurrentVersionCreatedAt(firstVersion.created_at);
              setCurrentVersionCreatedBy(firstVersion.created_by || '');
            }
          })
          .catch(error => {
            console.error('Error loading versions:', error);
            // Don't block the editor if versions fail to load
          });
      }
    }
  }, [robotId, robots]);

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
  };

  const handleSaveVersion = async () => {
    if (!robotId || !selectedVersion) {
      alert('Selecione um robô e uma versão para salvar');
      return;
    }

    try {
      setIsSaving(true);
      const version = versions.find(v => v.version_name === selectedVersion);
      if (!version) {
        throw new Error('Versão não encontrada');
      }

      await updateVersion(version.id, {
        code: editorContent,
        updated_at: new Date().toISOString()
      });

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
      successMessage.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Versão salva com sucesso!
      `;
      document.body.appendChild(successMessage);

      // Remove success message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar robô:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar versão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to check if a version name already exists
  const getUniqueVersionName = (baseName: string): string => {
    // If the name doesn't exist, return it as is
    if (!versions.some(v => v.version_name === baseName)) {
      return baseName;
    }
    
    // If it exists, try adding a suffix
    let counter = 1;
    let newName = `${baseName} (${counter})`;
    
    while (versions.some(v => v.version_name === newName)) {
      counter++;
      newName = `${baseName} (${counter})`;
    }
    
    return newName;
  };

  const handleCreateVersionSubmit = async (versionName: string, description?: string, tags?: string[]) => {
    if (!robotId) {
      alert('Robô não encontrado. Por favor, selecione um robô válido');
      return;
    }
    
    try {
      // Ensure version name is unique
      const uniqueVersionName = getUniqueVersionName(versionName);
      
      const version = await createVersion(robotId, uniqueVersionName, editorContent, description, tags);
      if (!version) throw new Error('Falha ao criar versão');
      
      setShowCreateVersionModal(false);
      setSelectedVersion(uniqueVersionName);
      
      await loadVersions(robotId);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
      successMessage.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Nova versão "${uniqueVersionName}" criada com sucesso!
      `;
      document.body.appendChild(successMessage);

      // Remove success message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar versão';
      alert(errorMessage);
    }
  };

  const handleVersionSelect = async (versionName: string) => {
    setSelectedVersion(versionName);
    
    if (!robotId) return;
    
    const version = versions.find(v => v.version_name === versionName);
    if (version) {
      setEditorContent(version.code);
      setCurrentVersionDescription(version.description || '');
      setCurrentVersionTags(version.tags || []);
      setCurrentVersionCreatedAt(version.created_at);
      setCurrentVersionCreatedBy(version.created_by || '');
    }
  };

  const handleSaveTitle = async () => {
    if (!robotId || !robotTitle.trim()) {
      setTitleError('O nome do robô não pode estar vazio');
      return;
    }

    setIsSavingTitle(true);
    setTitleError(null);

    try {
      await renameRobot(robotId, robotTitle.trim());
      setIsEditingTitle(false);
      await loadRobots();
    } catch (error) {
      console.error('Error renaming robot:', error);
      setTitleError(error instanceof Error ? error.message : 'Erro ao renomear robô');
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(editorContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
      successMessage.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Code copied to clipboard!
      `;
      document.body.appendChild(successMessage);

      // Remove success message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      alert('Failed to copy code to clipboard');
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([editorContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${robotTitle}_${selectedVersion || 'latest'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateCode = async (code: string, description?: string, tags?: string[]) => {
    // Always apply the code to the editor first
    setEditorContent(code);
    
    // If we have a robotId, automatically create a new version
    if (robotId) {
      try {
        const nextVersion = versions.length + 1;
        let versionName = `Versão ${nextVersion}`;
        
        // Ensure version name is unique
        versionName = getUniqueVersionName(versionName);
        
        // Use provided description or default
        const versionDescription = description || "Versão gerada por IA";
        
        // Use provided tags or default
        const versionTags = tags && tags.length > 0 ? tags : ['tendencia'];
        
        const version = await createVersion(robotId, versionName, code, versionDescription, versionTags);
        if (version) {
          setSelectedVersion(versionName);
          await loadVersions(robotId);
          
          // Update current version info
          setCurrentVersionDescription(versionDescription);
          setCurrentVersionTags(versionTags);
          setCurrentVersionCreatedAt(new Date().toISOString());
          setCurrentVersionCreatedBy('');
          
          // Show success message
          const successMessage = document.createElement('div');
          successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
          successMessage.innerHTML = `
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Nova versão "${versionName}" criada automaticamente!
          `;
          document.body.appendChild(successMessage);

          // Remove success message after 3 seconds
          setTimeout(() => {
            document.body.removeChild(successMessage);
          }, 3000);
        }
      } catch (error) {
        console.error('Error creating version:', error);
        // Show error message but don't block the code application
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
        errorMessage.innerHTML = `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          Erro ao salvar versão: ${error instanceof Error ? error.message : 'Erro desconhecido'}
        `;
        document.body.appendChild(errorMessage);

        // Remove error message after 5 seconds
        setTimeout(() => {
          document.body.removeChild(errorMessage);
        }, 5000);
      }
    }
  };

  const handleUpdateVersionInfo = async (data: { description: string; tags: string[] }) => {
    if (!robotId || !selectedVersion) {
      alert('Selecione um robô e uma versão para atualizar');
      return;
    }

    try {
      const version = versions.find(v => v.version_name === selectedVersion);
      if (!version) {
        throw new Error('Versão não encontrada');
      }

      await updateVersion(version.id, {
        description: data.description,
        tags: data.tags
      });

      // Update local state
      setCurrentVersionDescription(data.description);
      setCurrentVersionTags(data.tags);

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md z-50 flex items-center';
      successMessage.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Informações da versão atualizadas com sucesso!
      `;
      document.body.appendChild(successMessage);

      // Remove success message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);

      // Reload versions to ensure we have the latest data
      await loadVersions(robotId);
    } catch (error) {
      console.error('Error updating version info:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar informações da versão. Tente novamente.');
    }
  };

  const currentRobot = robotId ? robots.find(r => r.id === robotId) : null;

  if (!currentRobot) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Robot Not Found</h2>
          <p className="text-gray-400 mb-6">Select a robot from your list to start editing</p>
          <button
            onClick={() => navigate('/robots')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center mx-auto"
          >
            <Folder className="w-5 h-5 mr-2" />
            My Robots
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-[#1E1E1E] text-gray-100 flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Chat */}
        <div className="w-112 border-r border-gray-800 flex flex-col">
          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <AIChat 
              onGenerateCode={handleGenerateCode} 
              robotId={robotId} 
              robotName={robotTitle}
              selectedVersion={selectedVersion}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b border-gray-800 bg-gray-900 p-3 lg:p-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 lg:space-x-4 flex-1 min-w-0">
                <div className="flex items-center space-x-1 lg:space-x-2">
                  <button 
                    onClick={() => navigate('/robots')}
                    className="p-2 hover:bg-gray-800 rounded-full"
                    title="Back to robots"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => navigate('/robots')}
                    className="px-2 lg:px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm"
                    title="View all robots"
                  >
                    <Grid className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden sm:inline">{t('nav.robots')}</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {isEditingTitle ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={robotTitle}
                        onChange={(e) => setRobotTitle(e.target.value)}
                        className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base min-w-0 flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setIsEditingTitle(false);
                          setRobotTitle(currentRobot.name);
                        }}
                        className="p-1 text-gray-400 hover:text-white"
                        disabled={isSavingTitle}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSaveTitle}
                        className="p-1 text-blue-400 hover:text-blue-300"
                        disabled={isSavingTitle}
                      >
                        {isSavingTitle ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base lg:text-lg font-medium truncate">{robotTitle}</h2>
                      <button
                        onClick={() => setIsEditingTitle(true)}
                        className="p-1 text-gray-400 hover:text-white"
                        title="Rename robot"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {selectedVersion && (
                    <span className="text-xs lg:text-sm text-gray-400 ml-2 hidden sm:inline">
                      ({selectedVersion})
                    </span>
                  )}
                  {titleError && (
                    <span className="text-sm text-red-500 ml-2">
                      {titleError}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1 lg:space-x-3">
                <button
                  onClick={handleSaveVersion}
                  className={`px-2 lg:px-3 py-1.5 ${isSaving ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'} rounded-md flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm`}
                  title="Save current version"
                  disabled={!selectedVersion || isSaving}
                >
                  {isSaving ? (
                    <RefreshCw className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 lg:w-4 lg:h-4" />
                  )}
                  <span className="hidden sm:inline">{t('button.save')}</span>
                </button>

                <button
                  onClick={() => setShowCreateVersionModal(true)}
                  className="px-2 lg:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm"
                  title="Create new version"
                >
                  <Layers className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden lg:inline">{t('button.newVersion')}</span>
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-2 lg:px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm"
                    title="Export code"
                  >
                    <FileDown className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline">{t('button.export')}</span>
                    <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4 ml-1" />
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-40 lg:w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                      <button
                        onClick={() => {
                          handleCopyCode();
                          setShowExportMenu(false);
                        }}
                        className="flex items-center w-full px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-300 hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Clipboard
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadCode();
                          setShowExportMenu(false);
                        }}
                        className="flex items-center w-full px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-300 hover:bg-gray-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download as File
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-2 lg:px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm"
                  title="Share robot"
                >
                  <Share2 className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden lg:inline">{t('button.share')}</span>
                </button>
                
                <button
                  className="p-1.5 lg:p-2 hover:bg-gray-800 rounded-full"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </header>

          {/* Technical Info Panel */}
          {showTechnicalInfo && robotId && (
            <RobotTechnicalInfo robotId={robotId} robotName={robotTitle} />
          )}

          {/* Version Info Panel */}
          {selectedVersion && (
            <RobotInfoPanel
              robotId={robotId}
              versionId={versions.find(v => v.version_name === selectedVersion)?.id || null}
              versionName={selectedVersion}
              description={currentVersionDescription}
              tags={currentVersionTags}
              createdAt={currentVersionCreatedAt}
              createdBy={currentVersionCreatedBy}
              onUpdate={handleUpdateVersionInfo}
            />
          )}

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {/* Main Editor */}
            <div className="h-full">
              <Editor
                fileId={robotId}
                content={editorContent}
                language={language}
                onContentChange={handleEditorChange}
                versions={versions}
                selectedVersion={selectedVersion}
                onVersionSelect={handleVersionSelect}
                showCreateVersionModal={showCreateVersionModal}
                setShowCreateVersionModal={setShowCreateVersionModal}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showShareModal && (
        <ShareModal 
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          robotName={robotTitle}
        />
      )}
      {showCreateVersionModal && (
        <CreateVersionModal
          isOpen={showCreateVersionModal}
          onClose={() => setShowCreateVersionModal(false)}
          onSave={handleCreateVersionSubmit}
          existingVersions={versions.map(v => v.version_name)}
          suggestedName={`v${versions.length + 1}.0.0`}
          suggestedDescription={currentVersionDescription}
        />
      )}

      {/* Floating Assistant - Always visible unless dismissed */}
      {showAssistant && <FloatingAssistant onClose={() => setShowAssistant(false)} />}
    </div>
  );
}
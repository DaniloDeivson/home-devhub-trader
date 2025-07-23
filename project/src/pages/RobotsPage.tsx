import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Folder, Search, Clock, FolderPlus, 
  RefreshCw, AlertTriangle, ChevronDown, MoreHorizontal,
  User, Share2, Settings, Trash2, Edit2, X, Code2, LogOut,
  Download, ExternalLink, AlertCircle, Coins
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useRobotStore } from '../stores/robotStore';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLanguageStore } from '../stores/languageStore';
import { Navbar } from '../components/Navbar';
import { TokenDisplay } from '../components/TokenDisplay';
import { RobotLimitDisplay } from '../components/RobotLimitDisplay';

export function RobotsPage() {
  const navigate = useNavigate();
  const [robotFilter, setRobotFilter] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated');
  const [showNewRobotModal, setShowNewRobotModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newRobotName, setNewRobotName] = useState('');
  const [robotToRename, setRobotToRename] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const { robots, loadRobots, createRobot, deleteRobot, renameRobot, isLoading, robotLimit, getRobotLimit } = useRobotStore();
  const { signOut, profile } = useAuthStore();
  const { t, language } = useLanguageStore();

  useEffect(() => {
    loadRobots();
    getRobotLimit();
  }, [loadRobots, getRobotLimit]);

  const handleCreateRobot = async () => {
    if (!newRobotName.trim()) {
      setError('Robot name cannot be empty');
      return;
    }

    try {
      // Check if user has reached their robot limit
      if (robots.length >= robotLimit) {
        throw new Error(`You have reached your limit of ${robotLimit} robots. Please upgrade your plan to create more robots.`);
      }

      const robot = await createRobot(newRobotName);
      if (robot) {
        setShowNewRobotModal(false);
        setNewRobotName('');
        setSuccess('Robot created successfully');
        navigate(`/editor/${robot.id}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create robot');
    }
  };

  const handleRenameRobot = async () => {
    if (!robotToRename) return;
    
    if (!newRobotName.trim()) {
      setError('Robot name cannot be empty');
      return;
    }

    try {
      setIsRenaming(true);
      await renameRobot(robotToRename.id, newRobotName);
      setShowRenameModal(false);
      setRobotToRename(null);
      setNewRobotName('');
      setSuccess('Robot renamed successfully');
      
      // Reload robots to get updated names
      await loadRobots();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to rename robot');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteRobot = async (robotId: string) => {
    try {
      setIsDeleting(true);
      await deleteRobot(robotId);
      setSuccess('Robot deleted successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete robot');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportRobot = (robotId: string, robotName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to editor
    
    // Navigate to editor with export intent
    navigate(`/editor/${robotId}?action=export`);
  };

  const handleBuyTokens = () => {
    window.open('https://buy.stripe.com/fZe5nX2320AB4EgfZC', '_blank');
  };

  // Filter and sort robots
  const filteredRobots = [...robots]
    .filter(robot => robot.name.toLowerCase().includes(robotFilter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{t('nav.robots')}</h1>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBuyTokens}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md flex items-center"
              title="Buy more tokens"
            >
              <Coins className="w-4 h-4 mr-2" />
              <span>{language === 'en' ? 'Buy Tokens' : 'Comprar Tokens'}</span>
            </button>
            
            <button
              onClick={() => loadRobots()}
              className="p-2 hover:bg-gray-800 rounded"
              title="Refresh robots"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowNewRobotModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
              disabled={robots.length >= robotLimit}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('button.createRobot')}
            </button>
          </div>
        </div>
        
        {/* Robot Limit Display */}
        <div className="mb-6">
          <RobotLimitDisplay />
        </div>
        
        {/* Search and filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search robots..."
              value={robotFilter}
              onChange={(e) => setRobotFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updated' | 'name')}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated">Last Updated</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        
        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-start text-red-500">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-md flex items-start text-green-500">
            <div className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5">✓</div>
            <p>{success}</p>
            <button 
              onClick={() => setSuccess(null)} 
              className="ml-auto"
              title="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Robot list */}
        {isLoading && robots.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredRobots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderPlus className="w-16 h-16 text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No robots found</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              {robotFilter 
                ? `No robots match your search "${robotFilter}"`
                : "Create your first robot to get started"}
            </p>
            {robotFilter ? (
              <button
                onClick={() => setRobotFilter('')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={() => setShowNewRobotModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
                disabled={robots.length >= robotLimit}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('button.createRobot')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRobots.map(robot => (
              <div 
                key={robot.id}
                className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors cursor-pointer group"
                onClick={() => navigate(`/editor/${robot.id}`)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Folder className="w-8 h-8 text-blue-500 mr-3" />
                      <h3 className="text-lg font-semibold">{robot.name}</h3>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRobotToRename(robot);
                          setNewRobotName(robot.name);
                          setShowRenameModal(true);
                        }}
                        className="p-1 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Rename robot"
                      >
                        <Edit2 className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRobot(robot.id);
                        }}
                        disabled={isDeleting}
                        className={`p-1 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity
                          ${isDeleting ? 'cursor-not-allowed opacity-50' : ''}`}
                        title="Delete robot"
                      >
                        <Trash2 className={`w-5 h-5 text-gray-400 ${!isDeleting && 'hover:text-red-500'}`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center text-sm text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Updated {formatDate(robot.updated_at)}</span>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-400">{profile?.name || 'You'}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleExportRobot(robot.id, robot.name, e)}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Export robot"
                      >
                        <Download className="w-4 h-4 hover:text-blue-400" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Share robot
                        }}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Share robot"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open settings
                        }}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Robot settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Robot Modal */}
      {showNewRobotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="bg-[#1E1E1E] rounded-lg max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setShowNewRobotModal(false);
                setNewRobotName('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Code2 className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100">
                {t('button.createRobot')}
              </h2>
              <p className="mt-2 text-gray-400">
                Enter a name for your new robot
              </p>
            </div>

            {/* Robot Limit Warning */}
            {robots.length >= robotLimit && (
              <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-red-500">
                    {language === 'en' 
                      ? `You have reached your limit of ${robotLimit} robots.` 
                      : `Você atingiu seu limite de ${robotLimit} robôs.`}
                  </p>
                  <button 
                    onClick={() => {
                      setShowNewRobotModal(false);
                      navigate('/subscription');
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-1"
                  >
                    {language === 'en' ? 'Upgrade your plan' : 'Atualize seu plano'} →
                  </button>
                </div>
              </div>
            )}

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateRobot();
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={newRobotName}
                onChange={(e) => setNewRobotName(e.target.value)}
                placeholder="Robot name"
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={robots.length >= robotLimit}
              />

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
                disabled={robots.length >= robotLimit}
              >
                {t('button.createRobot')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rename Robot Modal */}
      {showRenameModal && robotToRename && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="bg-[#1E1E1E] rounded-lg max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setShowRenameModal(false);
                setRobotToRename(null);
                setNewRobotName('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              disabled={isRenaming}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Edit2 className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100">
                {t('robot.rename')}
              </h2>
              <p className="mt-2 text-gray-400">
                Enter a new name for "{robotToRename.name}"
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleRenameRobot();
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={newRobotName}
                onChange={(e) => setNewRobotName(e.target.value)}
                placeholder="New robot name"
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRenaming}
              />

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium flex items-center justify-center"
                disabled={isRenaming}
              >
                {isRenaming ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Renaming...
                  </>
                ) : (
                  t('robot.rename')
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
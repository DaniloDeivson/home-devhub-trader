import { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Plus, Search, ChevronRight, ChevronDown } from 'lucide-react';
// import { ntslSnippets } from '../lib/ntslSnippets';
import { supabase } from '../lib/supabase';

interface Topic {
  name: string;
  ranges: { start: number; end: number }[];
}

interface EditorProps {
  fileId: string;
  content: string;
  language: string;
  onContentChange: (content: string) => void;
  versions: Array<{
    id: string;
    version_name: string;
    created_at: string;
  }>;
  selectedVersion: string | null;
  onVersionSelect: (versionName: string) => void;
  showCreateVersionModal: boolean;
  setShowCreateVersionModal: (show: boolean) => void;
}

export function Editor({ 
  fileId, 
  content, 
  language, 
  onContentChange,
  versions,
  selectedVersion,
  onVersionSelect,
  // showCreateVersionModal,
  setShowCreateVersionModal
}: EditorProps) {
  type EditorLike = {
    layout: () => void;
    revealLineInCenter: (lineNumber: number) => void;
    setSelection: (sel: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    }) => void;
    getPosition: () => { lineNumber: number; column: number };
    executeEdits: (source: string, edits: Array<{ range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }; text: string }>) => void;
    setPosition: (pos: { lineNumber: number; column: number }) => void;
    trigger: (source: string, handlerId: string, payload?: unknown) => void;
  } | null;

  const editorRef = useRef<EditorLike>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  // const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    if (fileId) {
      const loadInitialVersion = async () => {
        const { data: robot } = await supabase
          .from('robots')
          .select('*, robot_versions!robot_versions_robot_id_fkey(*)')
          .eq('id', fileId)
          .single();

        if (robot?.robot_versions?.length > 0) {
          const version1 = robot.robot_versions.find((v: { version_name: string; code: string }) => v.version_name === 'Versão 1');
          if (version1) {
            onContentChange(version1.code);
          }
        }
      };

      loadInitialVersion();
    }
  }, [fileId, onContentChange]);

  const handleEditorDidMount = (editor: unknown) => {
    editorRef.current = editor as EditorLike;
    // setIsEditorReady(true);

    // Editor keybindings and JS completion disabled

    const resizeObserver = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  };

  const extractTopics = (code: string): Record<string, Topic> => {
    if (!code) return {};
    
    const topics: Record<string, Topic> = {};
    const lines = code.split('\n');
    
    let currentTopic = '';
    let topicStart = 0;
    
    lines.forEach((line, index) => {
      const topicMatch = line.match(/\/\/#([^#\n]+)/);
      if (topicMatch) {
        const topicName = topicMatch[1].trim();
        
        if (currentTopic) {
          if (!topics[currentTopic]) {
            topics[currentTopic] = { name: currentTopic, ranges: [] };
          }
          topics[currentTopic].ranges.push({ start: topicStart, end: index - 1 });
        }
        
        currentTopic = topicName;
        topicStart = index + 1;
      }
    });
    
    if (currentTopic) {
      if (!topics[currentTopic]) {
        topics[currentTopic] = { name: currentTopic, ranges: [] };
      }
      topics[currentTopic].ranges.push({ start: topicStart, end: lines.length - 1 });
    }
    
    return topics;
  };

  const handleTopicClick = (topic: string, range: { start: number; end: number }) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(range.start);
      editorRef.current.setSelection({
        startLineNumber: range.start,
        startColumn: 1,
        endLineNumber: range.end,
        endColumn: 1,
      });
    }
  };

  // Fragments feature disabled

  const handleAddTopic = () => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      const lineNumber = position.lineNumber;
      editorRef.current.executeEdits('', [
        {
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: 1,
          },
          text: '//#Topic Name\n',
        },
      ]);
      editorRef.current.setPosition({ lineNumber, column: 4 });
    }
  };

  const topics = content ? extractTopics(content) : {};

  return (
    <div ref={containerRef} className="h-full w-full flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-800 p-4 flex flex-col overflow-y-auto">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (editorRef.current) {
                  editorRef.current.trigger('', 'actions.find', {
                    searchString: e.target.value
                  });
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Version History */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Version History</h3>
            <button
              onClick={() => setShowCreateVersionModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
              title="Create new version"
            >
              <Plus className="w-3 h-3 mr-1" />
              New Version
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`p-2 rounded cursor-pointer ${
                  selectedVersion === version.version_name ? 'bg-blue-600' : 'hover:bg-gray-800'
                }`}
                onClick={() => onVersionSelect(version.version_name)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{version.version_name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(version.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Topics</h3>
            <button
              onClick={handleAddTopic}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
              title="Add new topic"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Topic
            </button>
          </div>
          <div className="space-y-1">
            {Object.entries(topics).length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No topics found. Add topics by writing //#topic in your code
              </p>
            ) : (
              Object.entries(topics).map(([topicName, topic]) => (
                <div key={topicName}>
                  <button
                    onClick={() => {
                      if (expandedTopics.includes(topicName)) {
                        setExpandedTopics(expandedTopics.filter(t => t !== topicName));
                      } else {
                        setExpandedTopics([...expandedTopics, topicName]);
                      }
                    }}
                    className="flex items-center w-full p-2 hover:bg-gray-800 rounded-md text-left"
                  >
                    {expandedTopics.includes(topicName) ? (
                      <ChevronDown className="w-4 h-4 mr-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mr-2" />
                    )}
                    <span>{topicName}</span>
                  </button>
                  {expandedTopics.includes(topicName) && (
                    <div className="ml-6 space-y-1">
                      {topic.ranges.map((range, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTopicClick(topicName, range)}
                          className="w-full p-2 hover:bg-gray-800 rounded-md text-left text-sm text-gray-400"
                        >
                          Lines {range.start}-{range.end}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Code Fragments - comentado
        <div>
          <h3 className="text-sm font-medium mb-2">Fragments</h3>
          <div className="space-y-1">
            {Object.entries(ntslSnippets).map(([name, content]) => (
              <button
                key={name}
                onClick={() => handleSnippetInsert(content)}
                className="flex items-center w-full p-2 hover:bg-gray-800 rounded-md text-left"
              >
                <FileCode2 className="w-4 h-4 text-blue-400 mr-2" />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
        */}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-dark"
          value={content}
          onChange={(value) => onContentChange(value || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            autoClosingQuotes: 'always',
            autoClosingBrackets: 'always',
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            fontFamily: '"Fira Code", Menlo, Monaco, "Courier New", monospace',
            fontLigatures: true,
          }}
        />
      </div>
    </div>
  );
}
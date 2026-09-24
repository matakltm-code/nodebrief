import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Database,
  ChevronDown,
  Download,
  Upload,
  Check,
  Trash2,
  FileCode2,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { ProjectData, SaveStatus } from '../types/schema';

export interface HeaderProps {
  projectName: string;
  onProjectNameChange: (newName: string) => void;
  activeProjectId?: string;
  projectsList?: ProjectData[];
  onSelectProject?: (projectId: string) => void;
  onCreateNewProject: () => void;
  onDeleteProject?: (projectId: string) => void;
  onExportCanvasJson?: () => void;
  onOpenExportModal?: () => void;
  onImportProjectJson?: (file: File) => void;
  onOpenImportModal?: () => void;
  saveStatus?: SaveStatus;
  onAddNode: () => void;
}

export default function Header({
  projectName,
  onProjectNameChange,
  activeProjectId,
  projectsList = [],
  onSelectProject,
  onCreateNewProject,
  onDeleteProject,
  onExportCanvasJson,
  onOpenExportModal,
  onImportProjectJson,
  onOpenImportModal,
  saveStatus = 'saved',
  onAddNode,
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const formatLastModified = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportProjectJson) {
      onImportProjectJson(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <header className="h-11 sm:h-12 bg-white border-b border-slate-200 px-2.5 sm:px-3 flex items-center justify-between shrink-0 z-50 shadow-[0_1px_2px_rgba(15,23,42,0.03)] font-sans">
      {/* Hidden File Input for JSON Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Left Section: Compact Brand Logo, Project Title Dropdown, Auto-Save Status Badge */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Compact NodeBrief SVG Logo */}
        <div className="flex items-center gap-1 focus:outline-none cursor-pointer">
          <svg
            className="shrink-0 w-6 h-6 sm:w-7 sm:h-7"
            fill="none"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect fill="#0F172A" height="32" rx="6" width="32" />
            <rect fill="#FFFFFF" height="6" rx="1.5" width="8" x="6" y="8" />
            <rect fill="#FF0071" height="6" rx="1.5" width="8" x="18" y="18" />
            <path
              d="M10 14V17C10 19.2091 11.7909 21 14 21H18"
              stroke="#94A3B8"
              strokeDasharray="2 2"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
            <circle cx="10" cy="14" fill="#0F172A" r="1.5" stroke="#FFFFFF" strokeWidth="1" />
            <circle cx="18" cy="21" fill="#0F172A" r="1.5" stroke="#FF0071" strokeWidth="1" />
          </svg>
        </div>

        {/* Project Title (Inline Editable) & Multi-Project Dropdown Menu */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <input
            type="text"
            aria-label="Project Name"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="text-xs sm:text-sm font-semibold text-slate-900 bg-transparent border-0 px-1 py-0.5 rounded hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-[#FF0071] focus:outline-none w-20 sm:w-36 transition-all truncate"
          />
          {/* Functional Chevron Toggle */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`p-0.5 sm:p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors ${
              isDropdownOpen ? 'bg-slate-100 text-slate-800' : ''
            }`}
            title="Projects & Options"
          >
            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Project List & Action Dropdown Modal */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-60 sm:w-68 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
              {/* Header Label */}
              <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-100 mb-1">
                <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <FolderOpen className="w-3 h-3 text-slate-400" />
                  Your Projects ({projectsList.length})
                </span>
              </div>

              {/* Projects List with Switching */}
              <div className="max-h-48 overflow-y-auto px-1 space-y-0.5">
                {projectsList.map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  return (
                    <div
                      key={proj.id}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-pink-50/80 text-[#FF0071] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      onClick={() => {
                        if (onSelectProject && !isActive) {
                          onSelectProject(proj.id);
                        }
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isActive ? (
                          <Check className="w-3.5 h-3.5 text-[#FF0071] shrink-0" />
                        ) : (
                          <FileCode2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <div className="truncate flex-1">
                          <p className="truncate text-xs">{proj.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-normal">
                            {proj.nodes.length} entities • {formatLastModified(proj.updatedAt)}
                          </p>
                        </div>
                      </div>

                      {/* Delete Project Action (Allowed if more than 1 project) */}
                      {onDeleteProject && projectsList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(proj.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all shrink-0 ml-1"
                          title="Delete project"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="h-[1px] bg-slate-100 my-1.5" />

              {/* Actions */}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  onCreateNewProject();
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF0071]" />
                <span>Create New Project</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onOpenExportModal) {
                    onOpenExportModal();
                  } else if (onExportCanvasJson) {
                    onExportCanvasJson();
                  }
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export (JSON / YAML)</span>
              </button>

              {(onOpenImportModal || onImportProjectJson) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (onOpenImportModal) {
                      onOpenImportModal();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Import (JSON / YAML)</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

        {/* Automated Background Auto-Save Status Badge */}
        <div
          className={`hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono transition-all duration-200 ${
            saveStatus === 'saving'
              ? 'bg-amber-50/80 border-amber-200 text-amber-700'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
          title={saveStatus === 'saving' ? 'Syncing mutations to local database...' : 'All changes saved locally'}
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
              <span className="text-[10px] sm:text-[11px] font-medium">Saving...</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] sm:text-[11px]">
                <span className="hidden sm:inline">Saved locally</span>
                <span className="sm:hidden">Saved</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Section: GitHub Repo Link & Compact + Add Node */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* GitHub Repository Link Button */}
        <a
          href="https://github.com/matakltm-code/nodebrief"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors font-medium"
          title="View source on GitHub: https://github.com/matakltm-code/nodebrief"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span className="hidden sm:inline font-mono text-[11px]">GitHub</span>
        </a>

        {/* Primary CTA: Add Entity Node */}
        <button
          type="button"
          onClick={onAddNode}
          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 bg-slate-900 hover:bg-black text-white rounded text-xs font-semibold shadow-xs transition-colors active:scale-95"
          title="Add Node"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Node</span>
        </button>
      </div>
    </header>
  );
}

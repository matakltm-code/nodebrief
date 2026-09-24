import { useState, useMemo, useId, useEffect } from 'react';
import {
  FileJson,
  FileCode,
  Download,
  Copy,
  Check,
  Database,
} from 'lucide-react';
import { SchemaNode, SchemaEdge } from '../../types/schema';
import {
  serializeCanvasToJson,
  serializeCanvasToYaml,
  downloadFile,
} from '../../utils/exportCanvas';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  onNotify?: (message: string) => void;
}

type ExportTab = 'JSON' | 'YAML';

export default function ExportModal({
  isOpen,
  onClose,
  projectName,
  nodes,
  edges,
  onNotify,
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>('JSON');
  const [copiedTab, setCopiedTab] = useState<ExportTab | null>(null);
  const titleId = useId();

  // Generate serialized string outputs
  const jsonContent = useMemo(() => {
    return serializeCanvasToJson(projectName || 'Untitled Project', nodes, edges);
  }, [projectName, nodes, edges]);

  const yamlContent = useMemo(() => {
    return serializeCanvasToYaml(projectName || 'Untitled Project', nodes, edges);
  }, [projectName, nodes, edges]);

  const activeContent = activeTab === 'JSON' ? jsonContent : yamlContent;

  const projectSlug = useMemo(() => {
    return (
      (projectName || 'project')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'canvas-export'
    );
  }, [projectName]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Safe clipboard copy handler
  const handleCopy = async (tab: ExportTab) => {
    const content = tab === 'JSON' ? jsonContent : yamlContent;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const ta = document.createElement('textarea');
        ta.value = content;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedTab(tab);
      onNotify?.(`Copied ${tab} schema to clipboard`);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = content;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopiedTab(tab);
        onNotify?.(`Copied ${tab} schema to clipboard`);
        setTimeout(() => setCopiedTab(null), 2000);
      } catch {
        onNotify?.(`Failed to copy ${tab} schema`);
      }
    }
  };

  // Download handlers
  const handleDownloadJson = () => {
    try {
      downloadFile(`${projectSlug}.json`, jsonContent, 'application/json');
      onNotify?.(`Downloaded ${projectSlug}.json`);
    } catch {
      onNotify?.('Failed to download JSON file');
    }
  };

  const handleDownloadYaml = () => {
    try {
      downloadFile(`${projectSlug}.yaml`, yamlContent, 'text/yaml;charset=utf-8');
      onNotify?.(`Downloaded ${projectSlug}.yaml`);
    } catch {
      onNotify?.('Failed to download YAML file');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 id={titleId} className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Export {projectName || 'Project'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-mono">
                <span>{nodes.length} entities</span>
                <span>•</span>
                <span>{edges.length} relations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Quick Download Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* JSON Export Card */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-amber-100 text-amber-800 flex items-center justify-center">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-mono">JSON Format</h3>
                    <p className="text-[11px] text-slate-500">Standard serialized schema object</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  .json
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => handleCopy('JSON')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded border text-xs font-medium transition-all ${
                    copiedTab === 'JSON'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {copiedTab === 'JSON' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-black text-white rounded text-xs font-semibold shadow-2xs transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* YAML Export Card */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-sky-100 text-sky-800 flex items-center justify-center">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-mono">YAML Format</h3>
                    <p className="text-[11px] text-slate-500">Human-readable indentation format</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  .yaml
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => handleCopy('YAML')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded border text-xs font-medium transition-all ${
                    copiedTab === 'YAML'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {copiedTab === 'YAML' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy YAML</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadYaml}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-black text-white rounded text-xs font-semibold shadow-2xs transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>

          {/* Code Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('JSON')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'JSON'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5 text-amber-600" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('YAML')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'YAML'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-sky-600" />
                  <span>YAML</span>
                </button>
              </div>

              {/* Copy Tab Preview Button */}
              <button
                type="button"
                onClick={() => handleCopy(activeTab)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium transition-all ${
                  copiedTab === activeTab
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {copiedTab === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy {activeTab}</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Output Box */}
            <div className="relative">
              <pre className="w-full max-h-56 overflow-auto font-mono text-[11px] sm:text-xs bg-slate-950 text-slate-100 rounded-lg p-3.5 leading-relaxed border border-slate-800 shadow-inner selection:bg-[#FF0071] selection:text-white">
                <code className="text-slate-100 font-mono whitespace-pre">{activeContent}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Ready to export {nodes.length} nodes</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 active:bg-rose-200 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

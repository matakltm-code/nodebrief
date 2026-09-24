import { useState, useRef, useEffect, useCallback, useId } from 'react';
import {
  X,
  Upload,
  FileCode,
  Code2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  GitMerge,
  FolderPlus,
  Copy,
  Check,
  ClipboardPaste,
} from 'lucide-react';
import { parseImportText, ParsedImportResult } from '../../utils/importParser';
import { NormalizedImportPayload } from '../../utils/importParser';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectName: string;
  activeProjectId: string;
  onConfirmImport: (payload: NormalizedImportPayload, targetMode: 'merge' | 'new') => void;
}

const SAMPLE_JSON = `{
  "name": "E-Commerce Microservices",
  "nodes": [
    {
      "id": "node-user-auth",
      "title": "Account",
      "tag": "Auth",
      "tagType": "primary",
      "x": 80,
      "y": 100,
      "fields": [
        { "name": "id", "type": "uuid", "isPk": true },
        { "name": "email", "type": "varchar(255)" },
        { "name": "role", "type": "enum(admin,customer)" }
      ]
    },
    {
      "id": "node-order-svc",
      "title": "Order",
      "tag": "Billing",
      "tagType": "active",
      "x": 420,
      "y": 100,
      "fields": [
        { "name": "id", "type": "uuid", "isPk": true },
        { "name": "account_id", "type": "uuid", "isFk": true, "refTarget": "Account.id" },
        { "name": "total_usd", "type": "decimal(10,2)" },
        { "name": "status", "type": "enum(pending,paid,shipped)" }
      ]
    }
  ],
  "edges": [
    {
      "sourceNodeId": "node-user-auth",
      "targetNodeId": "node-order-svc",
      "cardinality": "1:N",
      "label": "has many [1:N]",
      "style": "solid",
      "pathStyle": "bezier"
    }
  ]
}`;

const SAMPLE_YAML = `name: Logistics Network
nodes:
  - id: node-warehouse
    title: Warehouse
    tag: Hub
    tagType: primary
    x: 80
    y: 100
    fields:
      - name: id
        type: uuid
        isPk: true
      - name: location_code
        type: varchar(64)
      - name: capacity
        type: integer
  - id: node-shipment
    title: Shipment
    tag: Transit
    tagType: active
    x: 420
    y: 100
    fields:
      - name: id
        type: uuid
        isPk: true
      - name: warehouse_id
        type: uuid
        isFk: true
        refTarget: Warehouse.id
      - name: tracking_num
        type: varchar(128)
edges:
  - sourceNodeId: node-warehouse
    targetNodeId: node-shipment
    cardinality: "1:N"
    label: "dispatches [1:N]"
    style: solid
    pathStyle: bezier
`;

export default function ImportModal({
  isOpen,
  onClose,
  activeProjectName,
  activeProjectId,
  onConfirmImport,
}: ImportModalProps) {
  const [activeTab, setActiveTab] = useState<'JSON' | 'YAML'>('JSON');
  const [rawText, setRawText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ParsedImportResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleId = useId();

  const handleCopyText = async () => {
    if (!rawText.trim()) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(rawText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = rawText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = rawText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch {
        // Fallback silently if clipboard write is completely restricted
      }
    }
  };

  const handlePasteText = async () => {
    textareaRef.current?.focus();
    try {
      if (navigator?.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && typeof clipText === 'string') {
          setRawText(clipText);
        }
      }
    } catch {
      // Clipboard read is restricted by the browser/iframe permissions policy.
      // Textarea is focused so user can paste with keyboard shortcut (Ctrl+V / Cmd+V).
    }
  };

  // Run validation when rawText or activeTab changes
  useEffect(() => {
    if (!rawText.trim()) {
      setValidationResult(null);
      return;
    }

    const timer = setTimeout(() => {
      const result = parseImportText(rawText, activeTab, {
        id: activeProjectId,
        name: activeProjectName,
      });
      setValidationResult(result);
    }, 120);

    return () => clearTimeout(timer);
  }, [rawText, activeTab, activeProjectId, activeProjectName]);

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

  // Handle File Processing
  const processFile = useCallback(
    (file: File) => {
      setIsLoadingFile(true);
      setLoadedFileName(file.name);

      const isYaml = /\.ya?ml$/i.test(file.name);
      const isJson = /\.json$/i.test(file.name);

      if (isYaml) {
        setActiveTab('YAML');
      } else if (isJson) {
        setActiveTab('JSON');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        setRawText(content);
        // Short simulated delay to render the clean loading overlay
        setTimeout(() => {
          const format = isYaml ? 'YAML' : 'JSON';
          const result = parseImportText(content, format, {
            id: activeProjectId,
            name: activeProjectName,
          });
          setValidationResult(result);
          setIsLoadingFile(false);
        }, 300);
      };

      reader.onerror = () => {
        setIsLoadingFile(false);
        setValidationResult({
          success: false,
          format: isYaml ? 'YAML' : 'JSON',
          nodeCount: 0,
          edgeCount: 0,
          targetMode: 'merge',
          summary: `Failed to read file ${file.name}.`,
          error: 'File read error',
        });
      };

      reader.readAsText(file);
    },
    [activeProjectId, activeProjectName]
  );

  // File Drop Handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const handleConfirm = () => {
    if (!validationResult || !validationResult.success || !validationResult.payload) return;
    onConfirmImport(validationResult.payload, validationResult.targetMode);
    onClose();
  };

  const handleLoadSample = () => {
    setLoadedFileName(null);
    if (activeTab === 'JSON') {
      setRawText(SAMPLE_JSON);
    } else {
      setRawText(SAMPLE_YAML);
    }
  };

  const handleClear = () => {
    setRawText('');
    setLoadedFileName(null);
    setValidationResult(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/45 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-[#FF0071]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-sm font-semibold text-slate-900 leading-tight">
                Import Schema or Project
              </h2>
              <p className="text-[11px] text-slate-500">
                Paste JSON/YAML payload or drop schema files directly into your workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Divided Vertically into 2 Sections */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* ======================================================== */}
          {/* TOP SECTION: Paste Area with JSON / YAML Tab Navigation */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {/* Tab Navigation */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('JSON')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'JSON'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-[#FF0071]" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('YAML')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'YAML'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>YAML</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                  title="Load sample schema"
                >
                  <Sparkles className="w-3 h-3 text-[#FF0071]" />
                  <span>Sample</span>
                </button>
                {rawText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[11px] text-slate-400 hover:text-slate-700 px-1.5 py-0.5"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Paste Text Area with Top-Right Action Button */}
            <div className="relative group">
              <textarea
                ref={textareaRef}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  activeTab === 'JSON'
                    ? 'Paste raw JSON schema or project payload here...\nExample: { "name": "Catalog", "nodes": [...] }'
                    : 'Paste raw YAML schema or project payload here...\nExample:\nname: Catalog\nnodes:\n  - title: Product'
                }
                rows={6}
                spellCheck={false}
                className="w-full font-mono text-[11px] sm:text-xs text-slate-800 bg-slate-50/80 border border-slate-200 rounded-lg p-3 pr-20 leading-relaxed placeholder:text-slate-400 focus:outline-none focus:border-[#FF0071] focus:ring-1 focus:ring-[#FF0071] transition-all resize-none shadow-inner"
              />

              {/* In-Textarea Action Button: Copy when text exists, Paste when empty */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                {rawText.trim() ? (
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] sm:text-[11px] font-medium transition-all shadow-2xs backdrop-blur-xs ${
                      isCopied
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white/90 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900'
                    }`}
                    title="Copy text to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePasteText}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:border-slate-300 bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 text-[10px] sm:text-[11px] font-medium transition-all shadow-2xs backdrop-blur-xs"
                    title="Paste schema from clipboard"
                  >
                    <ClipboardPaste className="w-3 h-3 text-slate-500" />
                    <span>Paste</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BOTTOM SECTION: File Drag-and-Drop Area & Validation Box */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Or Drag & Drop Schema File
            </div>

            {/* Dashed-border dropzone box */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-150 ${
                isDragOver
                  ? 'border-[#FF0071] bg-pink-50/40 scale-[1.005]'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
              }`}
            >
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml,application/json,text/yaml,text/x-yaml"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Loading State Overlay */}
              {isLoadingFile && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center gap-2 z-10">
                  <Loader2 className="w-5 h-5 text-[#FF0071] animate-spin" />
                  <span className="text-xs font-medium text-slate-700">
                    Reading and validating {loadedFileName || 'file'}...
                  </span>
                </div>
              )}

              {/* Dropzone Inner Content */}
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-0.5">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium text-slate-800">
                  {loadedFileName ? (
                    <span className="text-slate-900 font-semibold">{loadedFileName}</span>
                  ) : (
                    <span>Click to browse or drop file here</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Supports <strong className="text-slate-600">.json</strong>,{' '}
                  <strong className="text-slate-600">.yaml</strong>, and{' '}
                  <strong className="text-slate-600">.yml</strong>
                </div>
              </div>
            </div>

            {/* Validation Confirmation & Routing Box */}
            {validationResult && (
              <div
                className={`p-3 rounded-lg border text-xs transition-all ${
                  validationResult.success
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {validationResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 space-y-1">
                    <div className="font-semibold leading-tight">
                      {validationResult.summary}
                    </div>

                    {validationResult.success && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        {/* Routing Mode Indicator */}
                        {validationResult.targetMode === 'merge' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100/90 text-emerald-800 font-medium">
                            <GitMerge className="w-3 h-3 text-emerald-700" />
                            <span>Merge with "{activeProjectName}"</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100/90 text-blue-800 font-medium">
                            <FolderPlus className="w-3 h-3 text-blue-700" />
                            <span>
                              New Project:{' '}
                              {validationResult.detectedProjectName || 'Imported Workspace'}
                            </span>
                          </span>
                        )}

                        <span className="text-emerald-700">
                          {validationResult.nodeCount} node
                          {validationResult.nodeCount === 1 ? '' : 's'} ·{' '}
                          {validationResult.edgeCount} relation
                          {validationResult.edgeCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    )}

                    {!validationResult.success && validationResult.error && (
                      <div className="text-[11px] text-rose-700 font-mono mt-0.5">
                        {validationResult.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Action Button Area */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!validationResult?.success || isLoadingFile}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all ${
              validationResult?.success && !isLoadingFile
                ? 'bg-[#FF0071] hover:bg-[#E00064] text-white active:scale-95 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {validationResult?.targetMode === 'merge' ? (
              <GitMerge className="w-3.5 h-3.5" />
            ) : (
              <FolderPlus className="w-3.5 h-3.5" />
            )}
            <span>Confirm & Import</span>
          </button>
        </div>
      </div>
    </div>
  );
}

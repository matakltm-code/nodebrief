import { useState, useMemo } from 'react';
import {
  Workflow,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  X,
  FileDown,
} from 'lucide-react';
import {
  SchemaNode,
  SchemaEdge,
  PromptGeneratorTarget,
  OutputPanelTab,
} from '../types/schema';

export interface RightOutputPanelProps {
  projectName: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  activeTab: OutputPanelTab;
  onTabChange: (tab: OutputPanelTab) => void;
  onNotify: (msg: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function RightOutputPanel({
  projectName,
  nodes,
  edges,
  activeTab,
  onTabChange,
  onNotify,
  isOpenMobile = false,
  onCloseMobile,
}: RightOutputPanelProps) {
  const [promptTarget, setPromptTarget] = useState<PromptGeneratorTarget>('PRD Generator');

  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Dynamic project slug generator for clean down-stream file downloads
  const projectSlug = useMemo(() => {
    return (projectName || 'nodebrief')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'nodebrief';
  }, [projectName]);

  // 1. Dynamic Structured Markdown Schema Compiler (real-time useMemo)
  const markdownOutput = useMemo(() => {
    const cleanTitle = projectName.trim() || 'Untitled Project';
    let md = `# Schema: ${cleanTitle} Entity Graph\n`;
    md += `Generated directly from canvas topology · ${nodes.length} Entities, ${edges.length} Relational Edges\n\n`;

    md += `## Entities & Attributes\n\n`;
    if (nodes.length === 0) {
      md += `_No entities currently created on canvas._\n\n`;
    } else {
      nodes.forEach((node) => {
        md += `### table ${node.title} (${node.fields.length} fields)\n`;
        if (node.fields.length === 0) {
          md += `- _(no fields defined)_\n`;
        } else {
          node.fields.forEach((field) => {
            let suffix = `[${field.type}]`;
            if (field.isPk) {
              suffix = `uuid [pk]`;
            } else if (field.isFk && field.refTarget) {
              suffix = `uuid [ref: > ${field.refTarget}]`;
            } else if (field.details) {
              suffix = `${field.type} [${field.details}]`;
            }
            md += `- ${field.name}: ${suffix}\n`;
          });
        }
        md += `\n`;
      });
    }

    md += `## Explicit Relations\n\n`;
    if (edges.length === 0) {
      md += `_No explicit relations mapped._\n`;
    } else {
      edges.forEach((edge) => {
        const src = nodes.find((n) => n.id === edge.sourceNodeId)?.title || 'Unknown';
        const tgt = nodes.find((n) => n.id === edge.targetNodeId)?.title || 'Unknown';
        const sym = edge.cardinality === 'M:N' ? '<>' : '<';
        md += `- ${src}.id ${sym} ${tgt}.id (${edge.label})\n`;
      });
    }

    return md;
  }, [projectName, nodes, edges]);

  // 2. Dynamic AI Prompt Compiler (real-time useMemo)
  const promptOutput = useMemo(() => {
    const cleanTitle = projectName.trim() || 'Untitled Project';

    const nodeLines = nodes
      .map((n) => {
        const fieldsStr = n.fields
          .map((f) => {
            if (f.isPk) return `Key Attribute: ${f.name}[${f.type}]`;
            if (f.isFk) return `${f.name} -> references (${f.refTarget || 'entity'})`;
            return `${f.name}: ${f.type}${f.details ? ` (${f.details})` : ''}`;
          })
          .join(', ');
        return `- Concept Node: ${n.title} (${fieldsStr || 'no attributes defined'})`;
      })
      .join('\n');

    const edgeLines = edges
      .map((e) => {
        const src = nodes.find((n) => n.id === e.sourceNodeId)?.title || 'Source';
        const tgt = nodes.find((n) => n.id === e.targetNodeId)?.title || 'Target';
        if (e.cardinality === 'M:N') {
          return `- ${src} <--> ${tgt} (${e.label || 'interacts with'}) [Multi-way relationship]`;
        }
        return `- ${src} --> ${tgt} (${e.label || 'connects to'}) [Direct relation]`;
      })
      .join('\n');

    let instructionTarget =
      'You are an expert Principal Product Manager. Analyze the following project nodes, connections, and attributes. Write a detailed Product Requirement Document (PRD) detailing user personas, primary user flows, core assumptions to validate, and out-of-scope items for an initial launch.';

    if (promptTarget === 'Gap Analyzer') {
      instructionTarget =
        'You are a critical startup advisor and risk analyst. Review these entity definitions and connections. Find the hidden missing features, operational flaws, data model gaps, and structural requirements that have been overlooked in this design. Ask 5 hard questions about how this business idea scales.';
    } else if (promptTarget === 'Lean Canvas') {
      instructionTarget =
        'You are an elite venture capitalist and business strategist. Read this structural layout as a business idea blueprint. Translate these entities into a complete Lean Startup Canvas format, defining the core Problem, Solution, Unique Value Proposition, Channels, and Cost/Revenue streams implied by these nodes.';
    } else if (promptTarget === 'MVP Scoper') {
      instructionTarget =
        'You are a pragmatic Agile Project Manager. Help me scope down this idea into a minimum viable product. Identify which nodes are essential for a Day 1 release, which nodes can be simulated manually, and provide a 2-week implementation milestone plan.';
    }

    return `// Prompt Context: ${cleanTitle} Business Concept Validation Layout
// Note: Evolving, unstructured business concept model for exploration and validation.

## CONCEPT NODES & ATTRIBUTES:
${nodeLines || '- (No concept nodes currently defined)'}

## CONNECTIONS & RELATIONSHIPS:
${edgeLines || '- (No explicit relationships)'}

## SYSTEM INSTRUCTION:
${instructionTarget}`;
  }, [projectName, nodes, edges, promptTarget]);

  // File Download Handlers with Slugified File Naming
  const handleDownloadMd = () => {
    try {
      const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectSlug}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onNotify(`Downloaded ${projectSlug}.md`);
    } catch {
      onNotify('Failed to download markdown file');
    }
  };

  const handleDownloadTxt = () => {
    try {
      const blob = new Blob([markdownOutput], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectSlug}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onNotify(`Downloaded ${projectSlug}.txt`);
    } catch {
      onNotify('Failed to download text file');
    }
  };

  // Clipboard Handlers
  const handleCopyMarkdown = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(markdownOutput).catch(() => {});
    }
    setCopiedMd(true);
    onNotify('Copied Markdown schema to clipboard');
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyPrompt = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(promptOutput).catch(() => {});
    }
    setCopiedPrompt(true);
    onNotify('Copied AI Prompt to clipboard');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <aside
      className={`
        fixed inset-x-0 bottom-0 z-50 h-[85vh] max-h-[85vh] rounded-t-2xl shadow-2xl border-t border-slate-200 bg-white flex flex-col overflow-hidden transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-y-0' : 'translate-y-full'}
        md:static md:inset-auto md:w-[40%] md:h-full md:max-h-full md:rounded-none md:shadow-[-2px_0_6px_rgba(0,0,0,0.02)] md:border-t-0 md:border-l md:z-30 md:translate-y-0
      `}
    >
      {/* Mobile Drag Indicator Handle */}
      <div className="w-full flex items-center justify-center pt-2 pb-1 md:hidden bg-slate-50 border-b border-slate-100">
        <div className="w-10 h-1.5 bg-slate-300 rounded-full cursor-grab" onClick={onCloseMobile} />
      </div>

      {/* Dual Tabs Header */}
      <div className="h-12 border-b border-slate-200 px-3 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => onTabChange('structured')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${
              activeTab === 'structured'
                ? 'font-semibold bg-white text-slate-900 shadow-xs'
                : 'font-medium text-slate-500 hover:text-slate-900'
            }`}
          >
            <Workflow className={`w-3.5 h-3.5 ${activeTab === 'structured' ? 'text-[#FF0071]' : 'text-slate-400'}`} />
            <span>Structured Output</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('prompt')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
              activeTab === 'prompt'
                ? 'font-semibold bg-white text-slate-900 shadow-xs'
                : 'font-medium text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'prompt' ? 'text-[#FF0071]' : 'text-slate-400'}`} />
            <span>AI Prompt</span>
          </button>
        </div>

        {/* Live Sync Status & Close Button */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync</span>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: STRUCTURED OUTPUT */}
      {activeTab === 'structured' && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Format and Download/Copy Actions Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Format</span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-xs text-slate-700 font-medium">
                schema.md
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMd ? 'Copied!' : 'Copy'}</span>
              </button>
              <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />
              <button
                type="button"
                onClick={handleDownloadMd}
                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-mono text-[11px] transition-colors"
                title={`Download ${projectSlug}.md`}
              >
                <FileDown className="w-3 h-3 text-slate-400" />
                <span>.md</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-mono text-[11px] transition-colors"
                title={`Download ${projectSlug}.txt`}
              >
                <FileDown className="w-3 h-3 text-slate-400" />
                <span>.txt</span>
              </button>
            </div>
          </div>

          {/* Formatted Markdown Output Representation */}
          <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-4 font-sans text-xs">
            <div className="pb-3 border-b border-slate-100">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                # Schema: {projectName.trim() || 'Untitled Project'} Entity Graph
              </h1>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Generated directly from canvas topology · {nodes.length} Entities, {edges.length} Relational Edges
              </p>
            </div>

            {/* Section: Entities & Attributes */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                <span className="text-[#FF0071] font-mono">##</span> Entities &amp; Attributes
              </h2>

              {nodes.length === 0 ? (
                <p className="text-slate-400 italic text-xs">No entities created yet.</p>
              ) : (
                nodes.map((node) => (
                  <div
                    key={node.id}
                    className="rounded-lg bg-slate-50/70 p-3 border border-slate-200 space-y-1.5 font-mono text-[11px]"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 font-sans">
                      <span className="font-bold text-slate-900 font-mono">table {node.title}</span>
                      <span className="text-slate-400 text-[10px]">{node.fields.length} fields</span>
                    </div>
                    <ul className="space-y-1 pt-0.5">
                      {node.fields.length === 0 ? (
                        <li className="text-slate-400 italic text-[10px]">No properties added</li>
                      ) : (
                        node.fields.map((f) => (
                          <li key={f.id} className="flex items-center justify-between">
                            <span className="text-slate-800 font-medium">- {f.name}</span>
                            {f.isPk ? (
                              <span className="text-[#FF0071] font-semibold">uuid [pk]</span>
                            ) : f.isFk ? (
                              <span className="text-emerald-600 font-medium">uuid [ref: &gt; {f.refTarget}]</span>
                            ) : (
                              <span className="text-slate-400">
                                {f.type} {f.details ? `[${f.details}]` : ''}
                              </span>
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ))
              )}
            </div>

            {/* Section: Explicit Relations */}
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                <span className="text-[#FF0071] font-mono">##</span> Explicit Relations
              </h2>
              <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200 space-y-2 font-mono text-[11px] text-slate-700">
                {edges.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">No relations created yet.</p>
                ) : (
                  edges.map((edge) => {
                    const src = nodes.find((n) => n.id === edge.sourceNodeId)?.title || 'Source';
                    const tgt = nodes.find((n) => n.id === edge.targetNodeId)?.title || 'Target';
                    return (
                      <div key={edge.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5 text-[#FF0071]" />
                          <span className="font-semibold text-slate-900">{src}.id</span>
                          <span className="text-slate-400">{edge.cardinality === 'M:N' ? '<>' : '<'}</span>
                          <span className="font-semibold text-slate-900">{tgt}.id</span>
                        </div>
                        <span className="text-[10px] text-slate-400">({edge.label})</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI PROMPT GENERATOR */}
      {activeTab === 'prompt' && (
        <div className="flex-1 overflow-y-auto p-4 pb-12 flex flex-col gap-3 font-sans text-xs animate-in fade-in duration-200">
          {/* Target Framework Selector */}
          <div className="p-2.5 bg-slate-50/60 border border-slate-200 rounded-lg flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-slate-500 font-semibold">Generator Target</span>
              <span className="text-[10px] font-mono text-[#FF0071] font-semibold">Variables Injected</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-0.5 bg-white rounded-md border border-slate-200">
              {(['PRD Generator', 'Gap Analyzer', 'Lean Canvas', 'MVP Scoper'] as const).map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setPromptTarget(target)}
                  className={`px-1.5 py-1 text-[11px] font-mono rounded transition-all text-center truncate ${
                    promptTarget === target
                      ? 'bg-slate-900 text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {target}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Code Block with Inset Top-Right Animated Copy Button */}
          <div className="relative rounded-lg bg-slate-900 text-slate-200 p-3 font-mono text-[11px] leading-relaxed overflow-hidden shadow-inner border border-slate-800 flex-1 flex flex-col">
            <div className="text-slate-400 pb-2 mb-2 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {promptTarget}
              </span>

              {/* Inset Top-Right Copy Button */}
              <button
                type="button"
                onClick={handleCopyPrompt}
                aria-label="Copy to Clipboard"
                title={copiedPrompt ? 'Copied prompt to clipboard!' : 'Copy prompt to clipboard'}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 border cursor-pointer ${
                  copiedPrompt
                    ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 scale-105 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                    : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700/80 text-white hover:border-slate-600 shadow-xs'
                }`}
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 scale-110" />
                    <span className="text-[11px] text-emerald-300 font-mono font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-[11px] text-white font-mono">Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="whitespace-pre-wrap flex-1 text-slate-200 selection:bg-[#FF0071]/30 overflow-y-auto font-mono text-[11px] leading-relaxed">
              {promptOutput}
            </pre>
          </div>
        </div>
      )}
    </aside>
  );
}

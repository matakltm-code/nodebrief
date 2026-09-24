import { useState, useRef, useEffect } from 'react';
import {
  Handle,
  Position,
  NodeProps,
  Node as FlowNode,
  NodeResizeControl,
  useUpdateNodeInternals,
} from '@xyflow/react';
import {
  Key,
  Mail,
  Shield,
  Tag,
  BookOpen,
  Star,
  FileText,
  Boxes,
  User as UserIcon,
  Move,
  X,
  Plus,
  Workflow,
  ChevronDown,
  Check,
} from 'lucide-react';
import { SchemaField, NodeTagType, UpdateFieldPayload } from '../../types/schema';

const COMMON_TYPES = [
  'uuid',
  'string',
  'int',
  'bigint',
  'boolean',
  'datetime',
  'json',
  'text',
  'float',
];

export interface SchemaNodeData extends Record<string, unknown> {
  id: string;
  title: string;
  tag: string;
  tagType: NodeTagType;
  fields: SchemaField[];
  width?: number;
  height?: number;
  isSelected?: boolean;
  onUpdateTitle?: (nodeId: string, newTitle: string) => void;
  onAddField?: (nodeId: string) => void;
  onUpdateField?: (nodeId: string, fieldId: string, updates: UpdateFieldPayload) => void;
  onDeleteField?: (nodeId: string, fieldId: string) => void;
  onQuickConnect?: (sourceNodeId: string) => void;
}

export type CustomSchemaNode = FlowNode<SchemaNodeData, 'schemaNode'>;

export default function SchemaNodeComponent({
  id,
  data,
  selected,
}: NodeProps<CustomSchemaNode>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const isSelected = selected || data.isSelected;
  const [activeTypeMenuFieldId, setActiveTypeMenuFieldId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data.fields?.length, data.title, data.width, data.height, updateNodeInternals]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveTypeMenuFieldId(null);
      }
    }
    if (activeTypeMenuFieldId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeTypeMenuFieldId]);

  const renderEntityIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t === 'user') return <UserIcon className="w-3.5 h-3.5 text-slate-700 shrink-0" />;
    if (t === 'books' || t === 'book') return <BookOpen className="w-3.5 h-3.5 text-[#FF0071] shrink-0" />;
    if (t === 'category') return <Tag className="w-3.5 h-3.5 text-slate-700 shrink-0" />;
    if (t === 'review') return <Star className="w-3.5 h-3.5 text-slate-700 shrink-0" />;
    return <Boxes className="w-3.5 h-3.5 text-slate-700 shrink-0" />;
  };

  return (
    <div
      style={{ width: '100%', height: '100%', minWidth: '220px' }}
      className={`relative bg-white rounded-lg shadow-sm group select-none transition-[border-color,box-shadow,background-color] ${
        isSelected
          ? 'border-2 border-[#FF0071] shadow-md ring-2 ring-pink-100'
          : 'border border-slate-200 hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Target Inbound Port (Left Center) */}
      <Handle
        type="target"
        position={Position.Left}
        id="inbound"
        className={`!w-3.5 !h-3.5 !-left-[7px] !bg-white !border-2 transition-all cursor-crosshair ${
          isSelected
            ? '!border-[#FF0071] !ring-2 !ring-pink-100'
            : '!border-slate-400 group-hover:!border-[#FF0071]'
        }`}
      />

      {/* Source Outbound Port (Right Center) */}
      <Handle
        type="source"
        position={Position.Right}
        id="outbound"
        className={`!w-3.5 !h-3.5 !-right-[7px] !bg-white !border-2 transition-all cursor-crosshair ${
          isSelected
            ? '!border-[#FF0071] !ring-2 !ring-pink-100'
            : '!border-slate-400 group-hover:!border-[#FF0071]'
        }`}
      />

      {/* Quick Connect Floating Button (Hover on Right Edge) */}
      {data.onQuickConnect && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onQuickConnect?.(id);
          }}
          className="nodrag nopan absolute top-1/2 -right-4.5 -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-[#FF0071] text-[#FF0071] hover:bg-[#FF0071] hover:text-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform hover:scale-115 z-30 opacity-0 group-hover:opacity-100"
          title="Click to spawn & connect new node"
        >
          +
        </button>
      )}

      {/* Node Header (Drag Handle + Inline Editable Title) */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b rounded-t-lg transition-colors ${
          isSelected ? 'border-pink-100 bg-pink-50/50' : 'border-slate-100 bg-slate-50/80'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-1">
          <Move className="w-3 h-3 text-slate-400 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
          {renderEntityIcon(data.title)}

          <input
            type="text"
            value={data.title}
            onChange={(e) => data.onUpdateTitle?.(id, e.target.value)}
            className={`nodrag nopan font-semibold text-xs bg-transparent border-0 px-1 py-0.5 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF0071] w-full transition-all ${
              isSelected ? 'text-slate-900 font-bold' : 'text-slate-800'
            }`}
          />
        </div>

        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
            data.tagType === 'primary'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : data.tagType === 'active'
              ? 'bg-[#FF0071] text-white font-semibold shadow-xs'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {data.tag}
        </span>
      </div>

      {/* Node Attributes & Inline Field Editor */}
      <div className="p-2 space-y-1 font-mono text-[11px]">
        {data.fields.map((field) => {
          const isForeign = field.isFk;
          return (
            <div
              key={field.id}
              className={`group/field flex items-center justify-between py-1 px-1.5 rounded transition-colors gap-1.5 overflow-hidden ${
                isForeign
                  ? 'bg-pink-50/70 border border-pink-100 text-[#FF0071]'
                  : 'hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onUpdateField?.(id, field.id, { isPk: !field.isPk });
                  }}
                  className="nodrag nopan p-0.5 hover:bg-slate-100 rounded transition-colors cursor-pointer shrink-0"
                  title={field.isPk ? 'Primary Key (click to toggle)' : 'Click to set as Primary Key'}
                >
                  {field.isPk && <Key className="w-3 h-3 text-[#FF0071] shrink-0" />}
                  {!field.isPk && field.name === 'email' && <Mail className="w-3 h-3 text-slate-400 shrink-0" />}
                  {!field.isPk && field.name === 'role' && <Shield className="w-3 h-3 text-slate-400 shrink-0" />}
                  {!field.isPk && field.name === 'title' && <FileText className="w-3 h-3 text-slate-400 shrink-0" />}
                  {!field.isPk && field.isFk && <Workflow className="w-3 h-3 text-[#FF0071] shrink-0" />}
                  {!field.isPk && field.name === 'rating' && <Star className="w-3 h-3 text-amber-500 shrink-0" />}
                  {!field.isPk && field.name === 'name' && <Tag className="w-3 h-3 text-slate-400 shrink-0" />}
                  {!field.isPk &&
                    !field.isFk &&
                    !['email', 'role', 'title', 'rating', 'name'].includes(field.name) && (
                      <span className="text-slate-400 shrink-0 font-bold">•</span>
                    )}
                </button>

                <input
                  type="text"
                  value={field.name}
                  onChange={(e) =>
                    data.onUpdateField?.(id, field.id, { name: e.target.value })
                  }
                  className="nodrag nopan font-medium text-[11px] bg-transparent border-0 p-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#FF0071] rounded flex-1 min-w-0 truncate text-slate-800"
                  title={field.name}
                />
              </div>

              <div className="relative flex items-center gap-0.5 shrink-0 max-w-[55%]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTypeMenuFieldId(
                      activeTypeMenuFieldId === field.id ? null : field.id
                    );
                  }}
                  className={`nodrag nopan flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] transition-colors cursor-pointer max-w-full ${
                    isForeign
                      ? 'text-[#FF0071] font-semibold hover:bg-pink-100/60'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={
                    field.isFk
                      ? `Foreign Key -> ${field.refTarget || 'referenced entity'}`
                      : `Type: ${field.type} (click to change)`
                  }
                >
                  <span className="truncate max-w-[105px]">
                    {field.isFk ? `-> ${field.refTarget || 'ref'}` : field.type}
                  </span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0 ml-0.5" />
                </button>

                {/* Interactive Field Type & Constraint Popover */}
                {activeTypeMenuFieldId === field.id && (
                  <div
                    ref={popoverRef}
                    className="nodrag nopan absolute right-0 top-full mt-1 z-40 w-44 bg-white rounded-lg border border-slate-200 shadow-xl p-2 font-sans text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100 text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-800 truncate">
                        {field.name || 'Property'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTypeMenuFieldId(null)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div>
                      <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                        Data Type
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {COMMON_TYPES.map((t) => {
                          const isCurrent = field.type.toLowerCase() === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                data.onUpdateField?.(id, field.id, { type: t });
                                setActiveTypeMenuFieldId(null);
                              }}
                              className={`px-1.5 py-1 text-[10px] font-mono rounded text-center transition-colors ${
                                isCurrent
                                  ? 'bg-[#FF0071] text-white font-semibold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          data.onUpdateField?.(id, field.id, { isPk: !field.isPk });
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors ${
                          field.isPk
                            ? 'bg-pink-50 text-[#FF0071] font-semibold border border-pink-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Key className="w-3 h-3 text-[#FF0071]" />
                          Primary Key (PK)
                        </span>
                        {field.isPk && <Check className="w-3 h-3 text-[#FF0071]" />}
                      </button>
                    </div>
                  </div>
                )}

                {data.onDeleteField && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onDeleteField?.(id, field.id);
                    }}
                    className="nodrag nopan opacity-0 group-hover/field:opacity-100 p-0.5 text-[#FF0071] hover:text-rose-700 hover:bg-pink-50 rounded transition-all"
                    title="Remove field"
                  >
                    <X className="w-2.5 h-2.5 text-[#FF0071]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onAddField?.(id);
          }}
          className="nodrag nopan w-full mt-1 pt-1 border-t border-slate-100 text-[10px] text-slate-500 hover:text-[#FF0071] hover:bg-slate-50 rounded flex items-center justify-center gap-1 transition-colors py-0.5 font-sans font-medium"
        >
          <Plus className="w-3 h-3 text-slate-400" />
          <span>+ Add Property</span>
        </button>
      </div>

      {/* Node Resize Control on Bottom-Right */}
      <NodeResizeControl
        position="bottom-right"
        minWidth={220}
        minHeight={100}
        onResize={() => {
          updateNodeInternals(id);
        }}
        onResizeEnd={() => {
          updateNodeInternals(id);
        }}
        className="!border-none !bg-transparent !p-0 !bottom-0.5 !right-0.5 z-20 cursor-se-resize nodrag"
      >
        <div
          className="w-3.5 h-3.5 flex items-center justify-center rounded-br text-slate-300 hover:text-[#FF0071] group-hover:text-slate-400 transition-colors"
          title="Resize node"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-60 group-hover:opacity-100"
          >
            <path
              d="M7 1L1 7M7 4L4 7M7 7H7.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </NodeResizeControl>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import {
  SchemaNode,
  SchemaEdge,
  Cardinality,
  EdgeStyle,
  PathStyle,
  EdgeColor,
} from '../../types/schema';
import { getDefaultLabelForCardinality } from '../../utils/relationUtils';

export interface EditRelationModalProps {
  isOpen: boolean;
  editingEdge: SchemaEdge | null;
  nodes: SchemaNode[];
  onClose: () => void;
  onSave: (
    edgeId: string,
    updates: {
      sourceNodeId: string;
      targetNodeId: string;
      label: string;
      cardinality: Cardinality;
      style: EdgeStyle;
      pathStyle: PathStyle;
      color: EdgeColor;
    }
  ) => void;
  onDelete: (edgeId: string) => void;
}

export default function EditRelationModal({
  isOpen,
  editingEdge,
  nodes,
  onClose,
  onSave,
  onDelete,
}: EditRelationModalProps) {
  const [sourceNodeId, setSourceNodeId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [label, setLabel] = useState('');
  const [cardinality, setCardinality] = useState<Cardinality>('1:N');
  const [style, setStyle] = useState<EdgeStyle>('solid');
  const [pathStyle, setPathStyle] = useState<PathStyle>('bezier');
  const [color, setColor] = useState<EdgeColor>('slate');

  useEffect(() => {
    if (editingEdge && isOpen) {
      const baseLabel = editingEdge.label
        ? editingEdge.label.replace(/\s*\[.*\]\s*$/, '').trim()
        : 'has many';
      setSourceNodeId(editingEdge.sourceNodeId);
      setTargetNodeId(editingEdge.targetNodeId);
      setCardinality(editingEdge.cardinality || '1:N');
      setLabel(baseLabel);
      setStyle(editingEdge.style || (editingEdge.cardinality === 'M:N' ? 'dashed' : 'solid'));
      setPathStyle(editingEdge.pathStyle || 'bezier');
      setColor(editingEdge.color || (editingEdge.cardinality === 'M:N' ? 'magenta' : 'slate'));
    }
  }, [editingEdge, isOpen]);

  if (!isOpen || !editingEdge) return null;

  const handleSave = () => {
    const cleanLabel = label.trim() || 'has many';
    onSave(editingEdge.id, {
      sourceNodeId,
      targetNodeId,
      label: `${cleanLabel} [${cardinality}]`,
      cardinality,
      style,
      pathStyle,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-semibold text-sm text-slate-900">Edit Relationship Link</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2.5 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Source Entity</label>
            <select
              value={sourceNodeId}
              onChange={(e) => setSourceNodeId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:border-[#FF0071] focus:outline-none"
            >
              <option value="">Select source entity...</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Target Entity</label>
            <select
              value={targetNodeId}
              onChange={(e) => setTargetNodeId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:border-[#FF0071] focus:outline-none"
            >
              <option value="">Select target entity...</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Relation Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. has many, belongs to, owns"
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:border-[#FF0071] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Cardinality / Relation Type</label>
            <select
              value={cardinality}
              onChange={(e) => {
                const newCard = e.target.value as Cardinality;
                setCardinality(newCard);
                setLabel(getDefaultLabelForCardinality(newCard));
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:border-[#FF0071] focus:outline-none"
            >
              <option value="1:N">1:N (One to Many)</option>
              <option value="M:N">M:N (Many to Many)</option>
              <option value="1:1">1:1 (One to One)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Line Curve</label>
              <select
                value={pathStyle}
                onChange={(e) => setPathStyle(e.target.value as PathStyle)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:border-[#FF0071] focus:outline-none"
              >
                <option value="bezier">Bezier Curve</option>
                <option value="smoothstep">Smooth Step</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Stroke Pattern</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as EdgeStyle)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:border-[#FF0071] focus:outline-none"
              >
                <option value="solid">Solid Line</option>
                <option value="dashed">Dashed Line</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onDelete(editingEdge.id);
              onClose();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded transition-colors font-medium"
            title="Delete relationship"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-black text-white font-medium rounded shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

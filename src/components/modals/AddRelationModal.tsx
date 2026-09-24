import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SchemaNode, Cardinality } from '../../types/schema';
import { getDefaultLabelForCardinality } from '../../utils/relationUtils';

export interface AddRelationModalProps {
  isOpen: boolean;
  nodes: SchemaNode[];
  initialSourceId?: string;
  onClose: () => void;
  onAddRelation: (
    sourceId: string,
    targetId: string,
    label: string,
    cardinality: Cardinality
  ) => void;
}

export default function AddRelationModal({
  isOpen,
  nodes,
  initialSourceId = '',
  onClose,
  onAddRelation,
}: AddRelationModalProps) {
  const [relSource, setRelSource] = useState(initialSourceId);
  const [relTarget, setRelTarget] = useState('');
  const [relLabel, setRelLabel] = useState('has many');
  const [relCardinality, setRelCardinality] = useState<Cardinality>('1:N');

  useEffect(() => {
    if (isOpen) {
      setRelSource(initialSourceId || (nodes[0]?.id ?? ''));
      setRelTarget(nodes[1]?.id ?? '');
      setRelLabel('has many');
      setRelCardinality('1:N');
    }
  }, [isOpen, initialSourceId, nodes]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!relSource || !relTarget || relSource === relTarget) return;
    onAddRelation(relSource, relTarget, relLabel, relCardinality);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-semibold text-sm text-slate-900">Add Relationship Link</h3>
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
              value={relSource}
              onChange={(e) => setRelSource(e.target.value)}
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
              value={relTarget}
              onChange={(e) => setRelTarget(e.target.value)}
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
              value={relLabel}
              onChange={(e) => setRelLabel(e.target.value)}
              placeholder="e.g. has many, belongs to, owns"
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:border-[#FF0071] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Cardinality</label>
            <select
              value={relCardinality}
              onChange={(e) => {
                const newCard = e.target.value as Cardinality;
                setRelCardinality(newCard);
                setRelLabel(getDefaultLabelForCardinality(newCard));
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:border-[#FF0071] focus:outline-none"
            >
              <option value="1:N">1:N (One to Many)</option>
              <option value="M:N">M:N (Many to Many)</option>
              <option value="1:1">1:1 (One to One)</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!relSource || !relTarget || relSource === relTarget}
            className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-medium rounded shadow-xs"
          >
            Connect Entities
          </button>
        </div>
      </div>
    </div>
  );
}

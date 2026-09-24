import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (name: string, tag: string) => void;
}

export default function AddNodeModal({
  isOpen,
  onClose,
  onAddNode,
}: AddNodeModalProps) {
  const [nodeName, setNodeName] = useState('');
  const [nodeTag, setNodeTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNodeName('');
      setNodeTag('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!nodeName.trim()) return;
    onAddNode(nodeName.trim(), nodeTag.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-semibold text-sm text-slate-900">Add New Entity Node</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Entity Name</label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="e.g. Order, Product, Transaction"
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:border-[#FF0071] focus:outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Tag / Group</label>
            <input
              type="text"
              value={nodeTag}
              onChange={(e) => setNodeTag(e.target.value)}
              placeholder="e.g. Core, Billing, Analytics"
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:border-[#FF0071] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
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
            disabled={!nodeName.trim()}
            className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-medium rounded shadow-xs"
          >
            Add Entity
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import Header from './components/Header';
import CanvasWorkbench from './components/CanvasWorkbench';
import RightOutputPanel from './components/RightOutputPanel';
import ConfirmationModal from './components/ConfirmationModal';
import AddNodeModal from './components/modals/AddNodeModal';
import AddRelationModal from './components/modals/AddRelationModal';
import EditRelationModal from './components/modals/EditRelationModal';
import ImportModal from './components/modals/ImportModal';
import ExportModal from './components/modals/ExportModal';
import {
  SchemaNode,
  SchemaEdge,
  Cardinality,
  EdgeStyle,
  PathStyle,
  EdgeColor,
  OutputPanelTab,
  ConfirmationModalState,
} from './types/schema';
import { getLayoutedNodes } from './utils/dagreLayout';
import { useProjectManager } from './hooks/useProjectManager';
import { useHistoryState } from './hooks/useHistoryState';
import { useCanvasShortcuts } from './hooks/useCanvasShortcuts';
import { Sparkles } from 'lucide-react';

export default function App() {
  // Toast Notification State
  const [notification, setNotification] = useState<string | null>(null);
  const triggerNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 2500);
  }, []);

  // Generic Confirmation Modal Dialog State
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    danger: false,
    onConfirm: () => {},
  });

  // UI Workbench States
  const [isMobileOutputOpen, setIsMobileOutputOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<OutputPanelTab>('structured');
  const [zoom, setZoom] = useState(1);

  // Modal Dialog Visibility States
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isAddRelationModalOpen, setIsAddRelationModalOpen] = useState(false);
  const [relInitialSource, setRelInitialSource] = useState<string>('');
  const [isEditRelationModalOpen, setIsEditRelationModalOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<SchemaEdge | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Multi-Project Database & Persistence Hook
  const {
    projectsList,
    activeProjectId,
    saveStatus,
    projectName,
    setProjectName,
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
    handleSelectProject,
    handleCreateNewProject,
    handleDeleteProject,
    handleExportCanvasJson,
    handleImportProjectJson,
    handleCommitImport,
  } = useProjectManager({
    onNotify: triggerNotification,
    onConfirmDelete: (config) => {
      setConfirmModal({
        isOpen: true,
        title: config.title,
        message: config.message,
        confirmLabel: 'Delete Project',
        cancelLabel: 'Cancel',
        danger: true,
        onConfirm: () => {
          config.onConfirm();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        },
      });
    },
    onClearHistory: () => resetHistory(),
  });

  // Canvas Topology History (Undo / Redo) Hook
  const {
    pushSnapshot,
    handleUndo,
    handleRedo,
    resetHistory,
  } = useHistoryState(nodes, edges, setNodes, setEdges, triggerNotification);

  // Global Keyboard Shortcuts Hook
  useCanvasShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  // Zoom Actions
  const handleZoomIn = () => setZoom((z) => Math.min(1.75, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)));
  const handleZoomReset = () => setZoom(1);

  // Node Mutations
  const handleUpdateNodeTitle = (nodeId: string, newTitle: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, title: newTitle } : n))
    );
  };

  const handleAddField = (nodeId: string, fieldName?: string, fieldType?: string) => {
    pushSnapshot();
    const name = fieldName || `attr_${Date.now().toString().slice(-4)}`;
    const type = fieldType || 'string';

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            fields: [
              ...n.fields,
              {
                id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name,
                type,
                icon: 'tag',
              },
            ],
          };
        }
        return n;
      })
    );
    triggerNotification(`Added property "${name}"`);
  };

  const handleUpdateField = (
    nodeId: string,
    fieldId: string,
    updates: Partial<{ name: string; type: string; details?: string; isPk?: boolean; isFk?: boolean; refTarget?: string }>
  ) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            fields: n.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
          };
        }
        return n;
      })
    );
  };

  // Delete Property Field with Confirmation Dialog
  const handleDeleteField = (nodeId: string, fieldId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    const field = node?.fields.find((f) => f.id === fieldId);
    const fieldName = field ? field.name : 'this property';
    const nodeTitle = node ? node.title : 'entity';

    setConfirmModal({
      isOpen: true,
      title: `Delete Property "${fieldName}"?`,
      message: `Are you sure you want to delete the property "${fieldName}" from "${nodeTitle}"?`,
      confirmLabel: 'Delete Property',
      cancelLabel: 'Cancel',
      danger: true,
      onConfirm: () => {
        pushSnapshot();
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id === nodeId) {
              return {
                ...n,
                fields: n.fields.filter((f) => f.id !== fieldId),
              };
            }
            return n;
          })
        );
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        triggerNotification(`Property "${fieldName}" deleted`);
      },
    });
  };

  // Delete Entity Node with Confirmation Dialog
  const handleDeleteNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const connectedEdges = edges.filter(
      (e) => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
    );

    setConfirmModal({
      isOpen: true,
      title: `Delete Entity "${node.title}"?`,
      message: `Are you sure you want to delete entity "${node.title}"?${
        connectedEdges.length > 0
          ? ` This will also remove ${connectedEdges.length} connected relationship${
              connectedEdges.length > 1 ? 's' : ''
            }.`
          : ''
      }`,
      confirmLabel: 'Delete Entity',
      cancelLabel: 'Cancel',
      danger: true,
      onConfirm: () => {
        pushSnapshot();
        setNodes((prev) => prev.filter((n) => n.id !== nodeId));
        setEdges((prev) =>
          prev.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId)
        );
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        triggerNotification(`Entity "${node.title}" deleted`);
      },
    });
  };

  // Delete Relationship Link with Confirmation Dialog
  const handleDeleteEdge = (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const source = nodes.find((n) => n.id === edge.sourceNodeId)?.title || 'Source';
    const target = nodes.find((n) => n.id === edge.targetNodeId)?.title || 'Target';

    setConfirmModal({
      isOpen: true,
      title: 'Delete Relationship?',
      message: `Are you sure you want to delete the "${edge.label}" relationship connecting ${source} and ${target}?`,
      confirmLabel: 'Delete Relationship',
      cancelLabel: 'Cancel',
      danger: true,
      onConfirm: () => {
        pushSnapshot();
        setEdges((prev) => prev.filter((e) => e.id !== edgeId));
        setIsEditRelationModalOpen(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        triggerNotification('Relationship deleted');
      },
    });
  };

  const handleAddNodeAtPosition = (x: number, y: number, customTitle?: string) => {
    pushSnapshot();
    const title = customTitle || `Entity_${nodes.length + 1}`;
    const newNode: SchemaNode = {
      id: `node-${Date.now()}`,
      title,
      tag: 'Custom',
      tagType: 'custom',
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: 240,
      fields: [
        { id: `f-${Date.now()}-1`, name: 'id', type: 'uuid', isPk: true, icon: 'key' },
        { id: `f-${Date.now()}-2`, name: 'name', type: 'string', icon: 'tag' },
      ],
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    triggerNotification(`Created entity "${title}"`);
  };

  const handleAddNewNode = (name: string, tag: string) => {
    pushSnapshot();
    const newNode: SchemaNode = {
      id: `node-${Date.now()}`,
      title: name,
      tag: tag || 'Custom',
      tagType: 'custom',
      x: 200 + Math.random() * 80,
      y: 150 + Math.random() * 60,
      width: 240,
      fields: [
        { id: `f-${Date.now()}-1`, name: 'id', type: 'uuid', isPk: true, icon: 'key' },
        { id: `f-${Date.now()}-2`, name: 'created_at', type: 'timestamp', icon: 'tag' },
      ],
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    triggerNotification(`Created entity "${newNode.title}"`);
  };

  const handleAddNewRelation = (
    sourceId: string,
    targetId: string,
    label: string,
    cardinality: Cardinality
  ) => {
    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);
    if (!sourceNode || !targetNode) return;

    pushSnapshot();
    const newEdge: SchemaEdge = {
      id: `edge-${Date.now()}`,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      label: `${label} [${cardinality}]`,
      cardinality,
      style: cardinality === 'M:N' ? 'dashed' : 'solid',
      color: cardinality === 'M:N' ? 'magenta' : 'slate',
    };

    setEdges((prev) => [...prev, newEdge]);
    triggerNotification(`Connected ${sourceNode.title} to ${targetNode.title}`);
  };

  // Open Edit Relation Modal on double-clicking relation line or badge
  const handleOpenEditRelation = (edge: SchemaEdge) => {
    setEditingEdge(edge);
    setIsEditRelationModalOpen(true);
  };

  const handleSaveEditRelation = (
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
  ) => {
    pushSnapshot();
    setEdges((prev) =>
      prev.map((e) => (e.id === edgeId ? { ...e, ...updates } : e))
    );
    setIsEditRelationModalOpen(false);
    setEditingEdge(null);
    triggerNotification(`Updated relationship "${updates.label}"`);
  };

  const handleUpdateEdgeLabel = (edgeId: string, newLabel: string) => {
    pushSnapshot();
    setEdges((prev) =>
      prev.map((e) => (e.id === edgeId ? { ...e, label: newLabel } : e))
    );
    triggerNotification('Relationship updated');
  };

  const handleQuickConnectNewNode = (sourceNodeId: string) => {
    const sourceNode = nodes.find((n) => n.id === sourceNodeId);
    if (!sourceNode) return;

    pushSnapshot();
    const newIndex = nodes.length + 1;
    const newNodeTitle = `Entity_${newIndex}`;
    const newNodeId = `node-${Date.now()}`;

    // Compute non-overlapping position to the right
    const newX = sourceNode.x + 290;
    const newY = sourceNode.y + (nodes.length % 2 === 0 ? 30 : -30);

    const newNode: SchemaNode = {
      id: newNodeId,
      title: newNodeTitle,
      tag: 'Custom',
      tagType: 'custom',
      x: Math.max(0, newX),
      y: Math.max(0, newY),
      width: 240,
      fields: [
        { id: `f-${Date.now()}-1`, name: 'id', type: 'uuid', isPk: true, icon: 'key' },
        { id: `f-${Date.now()}-2`, name: 'name', type: 'string', icon: 'tag' },
      ],
    };

    const newEdge: SchemaEdge = {
      id: `edge-${Date.now()}`,
      sourceNodeId: sourceNodeId,
      targetNodeId: newNodeId,
      label: 'has many [1:N]',
      cardinality: '1:N',
      style: 'solid',
      color: 'slate',
    };

    setNodes((prev) => [...prev, newNode]);
    setEdges((prev) => [...prev, newEdge]);
    setSelectedNodeId(newNodeId);
    triggerNotification(`Connected ${sourceNode.title} -> ${newNodeTitle}`);
  };

  const handleConnectNodes = (sourceId: string, targetId: string) => {
    const existing = edges.find(
      (e) =>
        (e.sourceNodeId === sourceId && e.targetNodeId === targetId) ||
        (e.sourceNodeId === targetId && e.targetNodeId === sourceId)
    );
    if (existing) {
      triggerNotification('Relationship already exists');
      return;
    }

    pushSnapshot();
    const newEdge: SchemaEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      label: 'has many [1:N]',
      cardinality: '1:N',
      style: 'solid',
      color: 'slate',
    };
    setEdges((prev) => [...prev, newEdge]);
    triggerNotification('Connected entities');
  };

  const handleReconnectEdge = (edgeId: string, newSourceId: string, newTargetId: string) => {
    pushSnapshot();
    setEdges((prev) =>
      prev.map((e) =>
        e.id === edgeId
          ? { ...e, sourceNodeId: newSourceId, targetNodeId: newTargetId }
          : e
      )
    );
    triggerNotification('Relationship reconnected');
  };

  const handleAutoLayout = (direction: 'LR' | 'TB' = 'LR') => {
    pushSnapshot();
    setNodes((prev) => getLayoutedNodes(prev, edges, direction));
    setZoom(1);
    triggerNotification(`Hierarchical layout applied (${direction === 'LR' ? 'Horizontal' : 'Vertical'})`);
  };

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-screen overflow-hidden bg-white text-slate-900 select-none">
      {/* 1. Global Header with Multi-Project Dropdown & Auto-Save */}
      <Header
        projectName={projectName}
        onProjectNameChange={setProjectName}
        saveStatus={saveStatus}
        projectsList={projectsList}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateNewProject={handleCreateNewProject}
        onDeleteProject={handleDeleteProject}
        onExportCanvasJson={handleExportCanvasJson}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onImportProjectJson={handleImportProjectJson}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onAddNode={() => setIsAddNodeModalOpen(true)}
      />

      {/* 2. Main Workbench Studio */}
      <main className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Left: Infinite Flow Canvas */}
        <CanvasWorkbench
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onUpdateNodeTitle={handleUpdateNodeTitle}
          onAddField={handleAddField}
          onUpdateField={handleUpdateField}
          onDeleteField={handleDeleteField}
          onAddNodeAtPosition={handleAddNodeAtPosition}
          onDeleteNode={handleDeleteNode}
          onEditRelation={handleOpenEditRelation}
          onUpdateEdgeLabel={handleUpdateEdgeLabel}
          onQuickConnectNewNode={handleQuickConnectNewNode}
          onOpenAddNodeModal={() => setIsAddNodeModalOpen(true)}
          onOpenAddRelationModal={() => {
            setRelInitialSource(nodes[0]?.id || '');
            setIsAddRelationModalOpen(true);
          }}
          onAutoLayout={handleAutoLayout}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onNodesChange={setNodes}
          onConnectNodes={handleConnectNodes}
          onReconnectEdge={handleReconnectEdge}
        />

        {/* Right: Code Generation & Synchronized Schema Output Panel */}
        <RightOutputPanel
          projectName={projectName}
          nodes={nodes}
          edges={edges}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNotify={triggerNotification}
          isOpenMobile={isMobileOutputOpen}
          onCloseMobile={() => setIsMobileOutputOpen(false)}
        />
      </main>

      {/* Mobile Drawer Trigger Bar */}
      <div className="md:hidden border-t border-slate-200 bg-white px-3.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-[11px] font-semibold text-slate-800">{nodes.length} Entities</span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-slate-500">{edges.length} Relations</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOutputOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded text-[11px] font-medium shadow-2xs active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF0071]" />
          <span>View Schema &amp; Prompts</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Modular Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projectName={projectName}
        nodes={nodes}
        edges={edges}
        onNotify={triggerNotification}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        activeProjectName={projectName}
        activeProjectId={activeProjectId}
        onConfirmImport={handleCommitImport}
      />

      <AddNodeModal
        isOpen={isAddNodeModalOpen}
        onClose={() => setIsAddNodeModalOpen(false)}
        onAddNode={handleAddNewNode}
      />

      <AddRelationModal
        isOpen={isAddRelationModalOpen}
        nodes={nodes}
        initialSourceId={relInitialSource}
        onClose={() => setIsAddRelationModalOpen(false)}
        onAddRelation={handleAddNewRelation}
      />

      <EditRelationModal
        isOpen={isEditRelationModalOpen}
        editingEdge={editingEdge}
        nodes={nodes}
        onClose={() => {
          setIsEditRelationModalOpen(false);
          setEditingEdge(null);
        }}
        onSave={handleSaveEditRelation}
        onDelete={handleDeleteEdge}
      />

      {/* Floating Action Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-[#FF0071]" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}

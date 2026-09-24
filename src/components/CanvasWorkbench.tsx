import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  NodeChange,
  Connection,
} from '@xyflow/react';
import {
  Plus,
  Minus,
  Maximize2,
  Lock,
  Unlock,
  Workflow,
  Trash2,
  MousePointer,
} from 'lucide-react';
import {
  SchemaNode,
  SchemaEdge,
  UpdateFieldPayload,
  ContextMenuState,
} from '../types/schema';
import SchemaNodeComponent, { SchemaNodeData } from './flow/SchemaNodeComponent';
import RelationEdgeComponent, { RelationEdgeData } from './flow/RelationEdgeComponent';

export interface CanvasWorkbenchProps {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodeTitle: (nodeId: string, newTitle: string) => void;
  onAddField: (nodeId: string, name?: string, type?: string) => void;
  onUpdateField?: (
    nodeId: string,
    fieldId: string,
    updates: UpdateFieldPayload
  ) => void;
  onDeleteField?: (nodeId: string, fieldId: string) => void;
  onAddNodeAtPosition?: (x: number, y: number, title?: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onEditRelation?: (edge: SchemaEdge) => void;
  onUpdateEdgeLabel?: (edgeId: string, newLabel: string) => void;
  onQuickConnectNewNode?: (sourceNodeId: string) => void;
  onOpenAddNodeModal: () => void;
  onOpenAddRelationModal: () => void;
  onAutoLayout: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onNodesChange: Dispatch<SetStateAction<SchemaNode[]>>;
  onConnectNodes?: (sourceId: string, targetId: string) => void;
  onReconnectEdge?: (edgeId: string, newSourceId: string, newTargetId: string) => void;
}

const nodeTypes = {
  schemaNode: SchemaNodeComponent,
};

const edgeTypes = {
  relationEdge: RelationEdgeComponent,
};

function FlowCanvasInner({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodeTitle,
  onAddField,
  onUpdateField,
  onDeleteField,
  onAddNodeAtPosition,
  onDeleteNode,
  onEditRelation,
  onQuickConnectNewNode,
  onOpenAddNodeModal,
  onOpenAddRelationModal,
  onAutoLayout,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onNodesChange,
  onConnectNodes,
  onReconnectEdge,
}: CanvasWorkbenchProps) {
  const reactFlow = useReactFlow();
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
  });

  // Map SchemaNode[] to React Flow Node<SchemaNodeData>[]
  const flowNodes: Node<SchemaNodeData>[] = useMemo(() => {
    return nodes.map((node) => {
      const standardWidth = node.width || 240;
      const standardHeight = node.height;
      return {
        id: node.id,
        type: 'schemaNode',
        position: {
          x: Number.isFinite(node.x) ? node.x : 40,
          y: Number.isFinite(node.y) ? node.y : 60,
        },
        width: standardWidth,
        height: standardHeight,
        style: {
          width: `${standardWidth}px`,
          ...(standardHeight ? { height: `${standardHeight}px` } : {}),
        },
        selected: selectedNodeId === node.id,
        data: {
          id: node.id,
          title: node.title,
          tag: node.tag,
          tagType: node.tagType,
          fields: node.fields,
          width: standardWidth,
          height: standardHeight,
          isSelected: selectedNodeId === node.id,
          onUpdateTitle: onUpdateNodeTitle,
          onAddField: onAddField,
          onUpdateField: onUpdateField,
          onDeleteField: onDeleteField,
          onQuickConnect: onQuickConnectNewNode,
        },
      };
    });
  }, [
    nodes,
    selectedNodeId,
    onUpdateNodeTitle,
    onAddField,
    onUpdateField,
    onDeleteField,
    onQuickConnectNewNode,
  ]);

  // Map SchemaEdge[] to React Flow Edge<RelationEdgeData>[]
  const flowEdges: Edge<RelationEdgeData>[] = useMemo(() => {
    const nodeMap = new Set(nodes.map((n) => n.id));
    return edges
      .filter((edge) => nodeMap.has(edge.sourceNodeId) && nodeMap.has(edge.targetNodeId))
      .map((edge) => ({
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        sourceHandle: 'outbound',
        targetHandle: 'inbound',
        type: 'relationEdge',
        reconnectable: !isCanvasLocked,
        data: {
          label: edge.label,
          cardinality: edge.cardinality,
          style: edge.style,
          color: edge.color,
          pathStyle: edge.pathStyle,
          onEdit: () => onEditRelation?.(edge),
        },
      }));
  }, [nodes, edges, isCanvasLocked, onEditRelation]);

  // Handle reconnecting an edge from one handle to another
  const handleReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (newConnection.source && newConnection.target && onReconnectEdge) {
        onReconnectEdge(oldEdge.id, newConnection.source, newConnection.target);
      }
    },
    [onReconnectEdge]
  );

  // Synchronize React Flow position drag changes back to parent SchemaNode state
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange((prevNodes) => {
        let updated = [...prevNodes];
        let hasChanges = false;

        for (const change of changes) {
          if (change.type === 'position' && change.position) {
            hasChanges = true;
            updated = updated.map((n) =>
              n.id === change.id
                ? {
                    ...n,
                    x: Math.round(change.position!.x),
                    y: Math.round(change.position!.y),
                  }
                : n
            );
          } else if (change.type === 'dimensions' && change.dimensions) {
            const newWidth = Math.round(change.dimensions.width);
            const newHeight = Math.round(change.dimensions.height);
            const target = updated.find((n) => n.id === change.id);
            if (
              target &&
              newWidth >= 180 &&
              newHeight >= 60 &&
              (target.width !== newWidth || target.height !== newHeight)
            ) {
              hasChanges = true;
              updated = updated.map((n) =>
                n.id === change.id
                  ? {
                      ...n,
                      width: newWidth,
                      height: newHeight,
                    }
                  : n
              );
            }
          } else if (change.type === 'select') {
            if (change.selected) {
              onSelectNode(change.id);
            } else if (selectedNodeId === change.id) {
              onSelectNode(null);
            }
          }
        }
        return hasChanges ? updated : prevNodes;
      });
    },
    [onNodesChange, onSelectNode, selectedNodeId]
  );

  // Handle Drag-to-Connect between node handles
  const handleConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) {
        return;
      }
      if (onConnectNodes) {
        onConnectNodes(params.source, params.target);
      } else {
        // Fallback open relation modal
        onOpenAddRelationModal();
      }
    },
    [onConnectNodes, onOpenAddRelationModal]
  );

  // Keyboard shortcut listener (Delete/Backspace to delete selected entity, Esc to close menus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(
        (e.target as HTMLElement).tagName
      );
      if (e.key === 'Escape') {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedNodeId &&
        !isInput
      ) {
        onDeleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, onDeleteNode]);

  // Context menu on pane right click
  const handlePaneContextMenu = (e: MouseEvent | React.MouseEvent) => {
    e.preventDefault();
    const position = reactFlow.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      canvasX: Math.round(position.x),
      canvasY: Math.round(position.y),
    });
  };

  const handlePaneClick = () => {
    if (contextMenu.visible) {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
    onSelectNode(null);
  };

  // Zoom control wrappers
  const handleZoomInClick = () => {
    reactFlow.zoomIn({ duration: 250 });
    onZoomIn();
  };

  const handleZoomOutClick = () => {
    reactFlow.zoomOut({ duration: 250 });
    onZoomOut();
  };

  const handleFitViewClick = () => {
    reactFlow.fitView({ padding: 0.25, duration: 400 });
    onZoomReset();
  };

  return (
    <section
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className="relative w-full md:w-[60%] h-full flex flex-col bg-white overflow-hidden select-none"
    >
      {/* Top Floating Canvas Toolbar (Centered) */}
      <div className="absolute top-2 sm:top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur p-0.5 sm:p-1 rounded-md sm:rounded-lg border border-slate-200 shadow-xs sm:shadow-sm max-w-[calc(100%-16px)] sm:max-w-[calc(100%-24px)] w-auto shrink-0 whitespace-nowrap">
        <button
          type="button"
          onClick={onOpenAddNodeModal}
          className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold bg-slate-900 text-white rounded hover:bg-black transition-colors shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
        >
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="whitespace-nowrap">Add Entity</span>
        </button>
        <button
          type="button"
          onClick={onOpenAddRelationModal}
          className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors whitespace-nowrap shrink-0"
        >
          <Workflow className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
          <span className="whitespace-nowrap">Add Relation</span>
        </button>
        <div className="w-[1px] h-3.5 sm:h-4 bg-slate-200 mx-0.5 shrink-0" />
        <button
          type="button"
          onClick={onAutoLayout}
          className="flex items-center gap-1 p-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors whitespace-nowrap shrink-0"
          title="Auto Layout"
        >
          <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Auto-layout</span>
        </button>
        {selectedNodeId && (
          <button
            type="button"
            onClick={() => onDeleteNode(selectedNodeId)}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors shrink-0"
            title="Delete Selected Node (Del / Backspace)"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          </button>
        )}
      </div>

      {/* React Flow Viewport */}
      <div className="w-full h-full">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onConnect={handleConnect}
          onReconnect={handleReconnect}
          reconnectRadius={20}
          onPaneClick={handlePaneClick}
          onPaneContextMenu={handlePaneContextMenu}
          nodesDraggable={!isCanvasLocked}
          nodesConnectable={!isCanvasLocked}
          elementsSelectable={true}
          panOnDrag={!isCanvasLocked}
          zoomOnScroll={true}
          zoomOnPinch={true}
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          className="bg-white"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#cbd5e1"
          />
        </ReactFlow>
      </div>

      {/* Floating Right-Click / Long-Press Context Menu */}
      {contextMenu.visible && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-1 w-52 animate-in fade-in zoom-in-95 duration-100 font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 border-b border-slate-100 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>CANVAS ACTION</span>
            <span>
              ({contextMenu.canvasX}, {contextMenu.canvasY})
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setContextMenu((prev) => ({ ...prev, visible: false }));
              if (onAddNodeAtPosition) {
                onAddNodeAtPosition(contextMenu.canvasX, contextMenu.canvasY);
              } else {
                onOpenAddNodeModal();
              }
            }}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-800 hover:bg-slate-50 hover:text-[#FF0071] rounded font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF0071]" />
            <span>+ Create New Node Here</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setContextMenu((prev) => ({ ...prev, visible: false }));
              onOpenAddRelationModal();
            }}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors"
          >
            <Workflow className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Relationship Link</span>
          </button>

          <div className="w-full h-[1px] bg-slate-100 my-0.5" />

          <button
            type="button"
            onClick={() => {
              setContextMenu((prev) => ({ ...prev, visible: false }));
              onAutoLayout();
            }}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Auto-layout Entities</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setContextMenu((prev) => ({ ...prev, visible: false }));
              handleFitViewClick();
            }}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors"
          >
            <MousePointer className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Viewport Pan/Zoom</span>
          </button>
        </div>
      )}

      {/* Bottom-Left Controls */}
      <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-2">
        <div className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={handleZoomInClick}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="w-full h-[1px] bg-slate-100" />
          <div className="px-1 py-0.5 text-[9px] font-mono text-slate-500 text-center select-none leading-none">
            {Math.round(zoom * 100)}%
          </div>
          <div className="w-full h-[1px] bg-slate-100" />
          <button
            type="button"
            onClick={handleZoomOutClick}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="w-full h-[1px] bg-slate-100" />
          <button
            type="button"
            onClick={handleFitViewClick}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-full h-[1px] bg-slate-100" />
          <button
            type="button"
            onClick={() => setIsCanvasLocked(!isCanvasLocked)}
            className={`p-1.5 transition-colors ${
              isCanvasLocked
                ? 'text-[#FF0071] bg-pink-50'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title={isCanvasLocked ? 'Unlock Canvas' : 'Lock Canvas'}
          >
            {isCanvasLocked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function CanvasWorkbench(props: CanvasWorkbenchProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

import { useState, useCallback } from 'react';
import { SchemaNode, SchemaEdge, CanvasHistorySnapshot } from '../types/schema';

export function useHistoryState(
  nodes: SchemaNode[],
  edges: SchemaEdge[],
  setNodes: React.Dispatch<React.SetStateAction<SchemaNode[]>>,
  setEdges: React.Dispatch<React.SetStateAction<SchemaEdge[]>>,
  onNotify?: (msg: string) => void
) {
  const [historyPast, setHistoryPast] = useState<CanvasHistorySnapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<CanvasHistorySnapshot[]>([]);

  const pushSnapshot = useCallback(() => {
    setHistoryPast((prev) => [
      ...prev.slice(-30),
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    ]);
    setHistoryFuture([]);
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, -1);

    setHistoryFuture((prev) => [
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
      ...prev,
    ]);
    setHistoryPast(newPast);

    setNodes(previous.nodes);
    setEdges(previous.edges);
    onNotify?.('Action undone');
  }, [historyPast, nodes, edges, setNodes, setEdges, onNotify]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);

    setHistoryPast((prev) => [
      ...prev,
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    ]);
    setHistoryFuture(newFuture);

    setNodes(next.nodes);
    setEdges(next.edges);
    onNotify?.('Action redone');
  }, [historyFuture, nodes, edges, setNodes, setEdges, onNotify]);

  const resetHistory = useCallback(() => {
    setHistoryPast([]);
    setHistoryFuture([]);
  }, []);

  return {
    pushSnapshot,
    handleUndo,
    handleRedo,
    resetHistory,
    canUndo: historyPast.length > 0,
    canRedo: historyFuture.length > 0,
  };
}

import dagre from 'dagre';
import { SchemaNode, SchemaEdge } from '../types/schema';

export function getLayoutedNodes(
  nodes: SchemaNode[],
  edges: SchemaEdge[],
  direction: 'TB' | 'LR' = 'LR'
): SchemaNode[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 90,
    marginx: 50,
    marginy: 60,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const nodeWidth = node.width || 240;
    const nodeHeight = node.height || Math.max(130, 68 + (node.fields?.length || 0) * 26);
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.sourceNodeId, edge.targetNodeId);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const nodeWithPos = g.node(node.id);
    if (!nodeWithPos) return node;
    const nodeWidth = node.width || 240;
    const nodeHeight = node.height || Math.max(130, 68 + (node.fields?.length || 0) * 26);
    const computedX = Math.round(nodeWithPos.x - nodeWidth / 2);
    const computedY = Math.round(nodeWithPos.y - nodeHeight / 2);
    return {
      ...node,
      // Dagre returns center x & y, convert to top-left for standard node placement with finite check
      x: Number.isFinite(computedX) ? computedX : (node.x ?? 40),
      y: Number.isFinite(computedY) ? computedY : (node.y ?? 60),
    };
  });
}

import { describe, it, expect } from 'vitest';
import { getLayoutedNodes } from '../utils/dagreLayout';
import { SchemaNode, SchemaEdge } from '../types/schema';

describe('Dagre Hierarchical Layout Utility', () => {
  const sampleNodes: SchemaNode[] = [
    {
      id: 'node-user',
      title: 'User',
      tag: 'Primary',
      tagType: 'primary',
      x: 0,
      y: 0,
      fields: [{ id: 'f1', name: 'id', type: 'uuid', isPk: true }],
    },
    {
      id: 'node-order',
      title: 'Order',
      tag: 'Active',
      tagType: 'active',
      x: 0,
      y: 0,
      fields: [{ id: 'f2', name: 'id', type: 'uuid', isPk: true }],
    },
  ];

  const sampleEdges: SchemaEdge[] = [
    {
      id: 'edge-1',
      sourceNodeId: 'node-user',
      targetNodeId: 'node-order',
      label: 'has many',
      cardinality: '1:N',
    },
  ];

  it('assigns hierarchical left-to-right positions where parent is placed to the left of child in LR direction', () => {
    const layouted = getLayoutedNodes(sampleNodes, sampleEdges, 'LR');
    expect(layouted).toHaveLength(2);

    const userNode = layouted.find((n) => n.id === 'node-user')!;
    const orderNode = layouted.find((n) => n.id === 'node-order')!;

    // In 'LR' direction, source node should precede target node horizontally (x-axis)
    expect(userNode.x).toBeLessThan(orderNode.x);
  });

  it('assigns hierarchical top-to-bottom positions where parent is placed above child in TB direction', () => {
    const layouted = getLayoutedNodes(sampleNodes, sampleEdges, 'TB');
    expect(layouted).toHaveLength(2);

    const userNode = layouted.find((n) => n.id === 'node-user')!;
    const orderNode = layouted.find((n) => n.id === 'node-order')!;

    // In 'TB' direction, source node should precede target node vertically (y-axis)
    expect(userNode.y).toBeLessThan(orderNode.y);
  });

  it('gracefully handles empty node arrays', () => {
    const layouted = getLayoutedNodes([], []);
    expect(layouted).toEqual([]);
  });
});

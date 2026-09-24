import { describe, it, expect } from 'vitest';
import {
  serializeCanvasToJson,
  serializeCanvasToYaml,
  parseCanvasFromJson,
  isCanvasExportPayload,
} from '../utils/exportCanvas';
import { SchemaNode, SchemaEdge } from '../types/schema';
import { load as yamlLoad } from 'js-yaml';

describe('Canvas JSON & YAML Export Serializer', () => {
  const sampleNodes: SchemaNode[] = [
    {
      id: 'node-customer',
      title: 'Customer',
      tag: 'Primary',
      tagType: 'primary',
      x: 100,
      y: 100,
      fields: [
        { id: 'c1', name: 'id', type: 'uuid', isPk: true },
        { id: 'c2', name: 'email', type: 'string', details: 'unique' },
      ],
    },
    {
      id: 'node-order',
      title: 'Order',
      tag: 'Transaction',
      tagType: 'relation',
      x: 400,
      y: 100,
      fields: [
        { id: 'o1', name: 'id', type: 'uuid', isPk: true },
        { id: 'o2', name: 'customer_id', type: 'uuid', isFk: true, refTarget: 'Customer.id' },
        { id: 'o3', name: 'total_amount', type: 'decimal(10,2)' },
      ],
    },
  ];

  const sampleEdges: SchemaEdge[] = [
    {
      id: 'edge-customer-order',
      sourceNodeId: 'node-customer',
      targetNodeId: 'node-order',
      label: 'places [1:N]',
      cardinality: '1:N',
      style: 'solid',
      color: 'slate',
    },
  ];

  it('correctly serializes project into YAML format matching schema nodes and edges', () => {
    const fixedTimestamp = '2026-09-23T00:00:00.000Z';
    const yamlString = serializeCanvasToYaml('WarehouseModel', sampleNodes, sampleEdges, fixedTimestamp);

    expect(typeof yamlString).toBe('string');
    expect(yamlString).toContain('project: WarehouseModel');
    expect(yamlString).toContain('title: Customer');
    expect(yamlString).toContain('title: Order');

    const parsedYaml = yamlLoad(yamlString) as { project: string; nodes: SchemaNode[]; edges: SchemaEdge[] };
    expect(parsedYaml.project).toBe('WarehouseModel');
    expect(parsedYaml.nodes).toHaveLength(2);
    expect(parsedYaml.edges).toHaveLength(1);
    expect(parsedYaml.edges[0].label).toBe('places [1:N]');
  });

  it('correctly serializes project name, nodes, and connections into a valid JSON string', () => {
    const fixedTimestamp = '2026-09-23T00:00:00.000Z';
    const jsonString = serializeCanvasToJson('ECommerceSchema', sampleNodes, sampleEdges, fixedTimestamp);

    expect(typeof jsonString).toBe('string');

    const parsed = JSON.parse(jsonString);
    expect(parsed.project).toBe('ECommerceSchema');
    expect(parsed.generatedAt).toBe(fixedTimestamp);
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.edges).toHaveLength(1);
    expect(parsed.nodes[0].title).toBe('Customer');
    expect(parsed.nodes[1].fields[1].refTarget).toBe('Customer.id');
    expect(parsed.edges[0].label).toBe('places [1:N]');
  });

  it('preserves foreign key references and cardinalities during serialization round-trip', () => {
    const jsonString = serializeCanvasToJson('StoreApp', sampleNodes, sampleEdges);
    const parsed = parseCanvasFromJson(jsonString);

    expect(parsed.project).toBe('StoreApp');
    expect(parsed.nodes).toEqual(sampleNodes);
    expect(parsed.edges).toEqual(sampleEdges);
  });

  it('handles empty graphs cleanly with default arrays', () => {
    const jsonString = serializeCanvasToJson('BlankProject', [], []);
    const parsed = parseCanvasFromJson(jsonString);

    expect(parsed.project).toBe('BlankProject');
    expect(parsed.nodes).toEqual([]);
    expect(parsed.edges).toEqual([]);
  });

  it('validates canvas export payloads using isCanvasExportPayload type guard', () => {
    const valid = {
      project: 'ValidApp',
      generatedAt: new Date().toISOString(),
      nodes: sampleNodes,
      edges: sampleEdges,
    };
    expect(isCanvasExportPayload(valid)).toBe(true);
    expect(isCanvasExportPayload(null)).toBe(false);
    expect(isCanvasExportPayload({ project: 123 })).toBe(false);
  });

  it('throws an error when parsing an invalid canvas payload structure', () => {
    const invalidJson = JSON.stringify({ invalidKey: 'not a canvas payload' });
    expect(() => parseCanvasFromJson(invalidJson)).toThrowError(/Invalid Canvas JSON format/);
  });
});

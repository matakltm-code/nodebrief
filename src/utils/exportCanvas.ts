import { dump as yamlDump } from 'js-yaml';
import { SchemaNode, SchemaEdge } from '../types/schema';
import { logger } from './logger';

export interface CanvasExportPayload {
  project: string;
  generatedAt: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}

/**
 * Strict TypeScript Type Guard to validate serialized canvas export payloads
 */
export function isCanvasExportPayload(value: unknown): value is CanvasExportPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.project !== 'string') {
    return false;
  }
  if (typeof candidate.generatedAt !== 'string') {
    return false;
  }
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    return false;
  }

  // Validate each node entity structure
  const isValidNode = candidate.nodes.every((node: unknown) => {
    if (!node || typeof node !== 'object') return false;
    const n = node as Record<string, unknown>;
    if (
      typeof n.id !== 'string' ||
      typeof n.title !== 'string' ||
      typeof n.x !== 'number' ||
      typeof n.y !== 'number' ||
      !Array.isArray(n.fields)
    ) {
      return false;
    }

    // Validate fields
    return n.fields.every((f: unknown) => {
      if (!f || typeof f !== 'object') return false;
      const field = f as Record<string, unknown>;
      return typeof field.id === 'string' && typeof field.name === 'string' && typeof field.type === 'string';
    });
  });
  if (!isValidNode) return false;

  // Validate each relation edge structure
  const isValidEdge = candidate.edges.every((edge: unknown) => {
    if (!edge || typeof edge !== 'object') return false;
    const e = edge as Record<string, unknown>;
    return (
      typeof e.id === 'string' &&
      typeof e.sourceNodeId === 'string' &&
      typeof e.targetNodeId === 'string' &&
      typeof e.label === 'string' &&
      (e.cardinality === '1:N' || e.cardinality === 'M:N' || e.cardinality === '1:1')
    );
  });

  return isValidEdge;
}

export function serializeCanvasToJson(
  projectName: string,
  nodes: SchemaNode[],
  edges: SchemaEdge[],
  timestamp?: string
): string {
  const exportData: CanvasExportPayload = {
    project: projectName,
    generatedAt: timestamp || new Date().toISOString(),
    nodes,
    edges,
  };
  return JSON.stringify(exportData, null, 2);
}

export function serializeCanvasToYaml(
  projectName: string,
  nodes: SchemaNode[],
  edges: SchemaEdge[],
  timestamp?: string
): string {
  const exportData: CanvasExportPayload = {
    project: projectName,
    generatedAt: timestamp || new Date().toISOString(),
    nodes,
    edges,
  };
  return yamlDump(exportData, { indent: 2, lineWidth: -1 });
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Failed to download file:', error);
    throw error;
  }
}

export function parseCanvasFromJson(jsonString: string): CanvasExportPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format: syntax error');
  }

  if (!isCanvasExportPayload(parsed)) {
    throw new Error('Invalid Canvas JSON format: missing required schema fields');
  }

  return parsed;
}


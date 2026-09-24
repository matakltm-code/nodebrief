import { load as yamlLoad } from 'js-yaml';
import { SchemaNode, SchemaEdge, SchemaField, NodeTagType, Cardinality } from '../types/schema';

export interface NormalizedImportPayload {
  id?: string;
  name?: string;
  createdAt?: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}

export interface ParsedImportResult {
  success: boolean;
  format: 'JSON' | 'YAML';
  nodeCount: number;
  edgeCount: number;
  detectedProjectName?: string;
  detectedProjectId?: string;
  targetMode: 'merge' | 'new';
  summary: string;
  error?: string;
  payload?: NormalizedImportPayload;
}

interface ActiveProjectContext {
  id: string;
  name: string;
}

/**
 * Normalizes an arbitrary parsed object into SchemaNode[] and SchemaEdge[]
 */
function normalizeExtractedData(
  raw: Record<string, unknown> | Array<unknown>,
  activeProject: ActiveProjectContext
): {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  detectedId?: string;
  detectedName?: string;
  targetMode: 'merge' | 'new';
} {
  let rawNodes: unknown[] = [];
  let rawEdges: unknown[] = [];
  let detectedId: string | undefined;
  let detectedName: string | undefined;

  if (Array.isArray(raw)) {
    // Top-level array of entities
    rawNodes = raw;
  } else if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;

    if (typeof obj.id === 'string' && obj.id.trim()) {
      detectedId = obj.id.trim();
    }

    if (typeof obj.name === 'string' && obj.name.trim()) {
      detectedName = obj.name.trim();
    } else if (typeof obj.project === 'string' && obj.project.trim()) {
      detectedName = obj.project.trim();
    } else if (typeof obj.workspace === 'string' && obj.workspace.trim()) {
      detectedName = obj.workspace.trim();
    }

    // Nodes extraction
    if (Array.isArray(obj.nodes)) {
      rawNodes = obj.nodes;
    } else if (Array.isArray(obj.entities)) {
      rawNodes = obj.entities;
    } else if (Array.isArray(obj.models)) {
      rawNodes = obj.models;
    }

    // Edges extraction
    if (Array.isArray(obj.edges)) {
      rawEdges = obj.edges;
    } else if (Array.isArray(obj.relations)) {
      rawEdges = obj.relations;
    } else if (Array.isArray(obj.relationships)) {
      rawEdges = obj.relationships;
    }
  }

  // 1. Process Nodes
  const nodes: SchemaNode[] = [];
  const nodeTitleToIdMap = new Map<string, string>();

  rawNodes.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) return;
    const n = item as Record<string, unknown>;

    const title = String(n.title || n.name || `Entity_${index + 1}`).trim();
    const id = String(n.id || `node-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`);
    nodeTitleToIdMap.set(title.toLowerCase(), id);

    const tag = String(n.tag || 'Custom').trim();
    const tagType: NodeTagType =
      n.tagType === 'primary' ||
      n.tagType === 'active' ||
      n.tagType === 'taxonomy' ||
      n.tagType === 'relation' ||
      n.tagType === 'custom'
        ? n.tagType
        : 'custom';

    const x = typeof n.x === 'number' && Number.isFinite(n.x) ? n.x : 100 + (index % 3) * 320;
    const y = typeof n.y === 'number' && Number.isFinite(n.y) ? n.y : 80 + Math.floor(index / 3) * 260;

    const fields: SchemaField[] = [];
    const rawFields = Array.isArray(n.fields)
      ? n.fields
      : Array.isArray(n.attributes)
      ? n.attributes
      : Array.isArray(n.properties)
      ? n.properties
      : [];

    rawFields.forEach((fieldItem, fIdx) => {
      if (typeof fieldItem !== 'object' || fieldItem === null) return;
      const f = fieldItem as Record<string, unknown>;
      const fName = String(f.name || `field_${fIdx + 1}`).trim();
      const fType = String(f.type || 'string').trim();
      const fId = String(f.id || `f-${id}-${fIdx + 1}`);

      fields.push({
        id: fId,
        name: fName,
        type: fType,
        isPk: Boolean(f.isPk || f.primaryKey || fName.toLowerCase() === 'id'),
        isFk: Boolean(f.isFk || f.foreignKey || f.refTarget),
        refTarget: typeof f.refTarget === 'string' ? f.refTarget : undefined,
        details: typeof f.details === 'string' ? f.details : undefined,
      });
    });

    if (fields.length === 0) {
      fields.push(
        { id: `f-${id}-1`, name: 'id', type: 'uuid', isPk: true },
        { id: `f-${id}-2`, name: 'created_at', type: 'timestamp' }
      );
    }

    nodes.push({
      id,
      title,
      tag,
      tagType,
      x,
      y,
      width: typeof n.width === 'number' && Number.isFinite(n.width) ? n.width : 240,
      height: typeof n.height === 'number' && Number.isFinite(n.height) ? n.height : undefined,
      fields,
    });
  });

  // 2. Process Edges
  const edges: SchemaEdge[] = [];
  rawEdges.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) return;
    const e = item as Record<string, unknown>;

    let sourceId = String(e.sourceNodeId || e.source || e.from || '');
    let targetId = String(e.targetNodeId || e.target || e.to || '');

    // Check if source or target were referenced by title instead of id
    if (!nodes.some((n) => n.id === sourceId) && nodeTitleToIdMap.has(sourceId.toLowerCase())) {
      sourceId = nodeTitleToIdMap.get(sourceId.toLowerCase())!;
    }
    if (!nodes.some((n) => n.id === targetId) && nodeTitleToIdMap.has(targetId.toLowerCase())) {
      targetId = nodeTitleToIdMap.get(targetId.toLowerCase())!;
    }

    if (!sourceId || !targetId || sourceId === targetId) return;

    const rawCard = String(e.cardinality || '1:N');
    const cardinality: Cardinality =
      rawCard === 'M:N' || rawCard === '1:1' || rawCard === '1:N' ? rawCard : '1:N';

    const label = String(e.label || (cardinality === 'M:N' ? 'many to many [M:N]' : 'has many [1:N]'));

    edges.push({
      id: String(e.id || `edge-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`),
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      label,
      cardinality,
      style: e.style === 'dashed' || cardinality === 'M:N' ? 'dashed' : 'solid',
      color: e.color === 'magenta' || cardinality === 'M:N' ? 'magenta' : 'slate',
      pathStyle: e.pathStyle === 'smoothstep' ? 'smoothstep' : 'bezier',
    });
  });

  // 3. Routing Determination:
  // - Current Project Merge: If imported metadata matches current active project (same ID or same Name,
  //   or no distinct workspace metadata specified)
  // - New Project Routing: If payload explicitly defines a different ID or different Name / Workspace
  let targetMode: 'merge' | 'new' = 'merge';

  const hasDistinctId = Boolean(detectedId && detectedId !== activeProject.id);
  const hasDistinctName = Boolean(
    detectedName && detectedName.toLowerCase() !== activeProject.name.toLowerCase()
  );

  if (hasDistinctId || hasDistinctName) {
    targetMode = 'new';
  } else {
    targetMode = 'merge';
  }

  return {
    nodes,
    edges,
    detectedId,
    detectedName,
    targetMode,
  };
}

/**
 * Parses raw text as JSON or YAML and validates schema content
 */
export function parseImportText(
  rawText: string,
  preferredFormat: 'JSON' | 'YAML',
  activeProject: ActiveProjectContext
): ParsedImportResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      success: false,
      format: preferredFormat,
      nodeCount: 0,
      edgeCount: 0,
      targetMode: 'merge',
      summary: 'Input is empty. Please paste your schema content or drop a file.',
      error: 'Empty input',
    };
  }

  let parsedObject: unknown = null;
  let detectedFormat: 'JSON' | 'YAML' = preferredFormat;

  // Try JSON parsing first if preferred or if it starts with { or [
  if (preferredFormat === 'JSON' || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      parsedObject = JSON.parse(trimmed);
      detectedFormat = 'JSON';
    } catch (jsonErr) {
      if (preferredFormat === 'JSON') {
        return {
          success: false,
          format: 'JSON',
          nodeCount: 0,
          edgeCount: 0,
          targetMode: 'merge',
          summary: 'Invalid JSON syntax.',
          error: (jsonErr as Error).message || 'Failed to parse JSON',
        };
      }
    }
  }

  // If not parsed as JSON, try YAML
  if (!parsedObject) {
    try {
      parsedObject = yamlLoad(trimmed);
      detectedFormat = 'YAML';
    } catch (yamlErr) {
      return {
        success: false,
        format: detectedFormat,
        nodeCount: 0,
        edgeCount: 0,
        targetMode: 'merge',
        summary: `Invalid ${detectedFormat} format.`,
        error: (yamlErr as Error).message || 'Failed to parse YAML',
      };
    }
  }

  if (!parsedObject || (typeof parsedObject !== 'object' && !Array.isArray(parsedObject))) {
    return {
      success: false,
      format: detectedFormat,
      nodeCount: 0,
      edgeCount: 0,
      targetMode: 'merge',
      summary: 'Data must be a JSON object or YAML mapping with entities/nodes.',
      error: 'Invalid root structure',
    };
  }

  const { nodes, edges, detectedId, detectedName, targetMode } = normalizeExtractedData(
    parsedObject as Record<string, unknown> | Array<unknown>,
    activeProject
  );

  if (nodes.length === 0) {
    return {
      success: false,
      format: detectedFormat,
      nodeCount: 0,
      edgeCount: 0,
      targetMode,
      summary: `Valid ${detectedFormat} structure parsed, but no entity nodes were detected.`,
      error: 'No entities found in schema',
    };
  }

  const summary =
    targetMode === 'merge'
      ? `Valid ${detectedFormat} format detected. Found ${nodes.length} node${
          nodes.length === 1 ? '' : 's'
        } and ${edges.length} relationship${
          edges.length === 1 ? '' : 's'
        } to merge into "${activeProject.name}".`
      : `Valid ${detectedFormat} format detected. Found ${nodes.length} node${
          nodes.length === 1 ? '' : 's'
        } and ${edges.length} relationship${
          edges.length === 1 ? '' : 's'
        } for new workspace "${detectedName || 'New Project'}".`;

  return {
    success: true,
    format: detectedFormat,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    detectedProjectId: detectedId,
    detectedProjectName: detectedName,
    targetMode,
    summary,
    payload: {
      id: detectedId,
      name: detectedName,
      nodes,
      edges,
    },
  };
}

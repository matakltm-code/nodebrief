export type Cardinality = '1:N' | 'M:N' | '1:1';

export type EdgeStyle = 'solid' | 'dashed';

export type PathStyle = 'bezier' | 'smoothstep';

export type EdgeColor = 'slate' | 'magenta';

export type NodeTagType = 'primary' | 'active' | 'taxonomy' | 'relation' | 'custom';

export type FieldIcon =
  | 'key'
  | 'email'
  | 'shield'
  | 'title'
  | 'link'
  | 'tag'
  | 'star'
  | 'notes'
  | 'toggle';

export interface SchemaField {
  id: string;
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  refTarget?: string;
  details?: string;
  icon?: FieldIcon;
}

export interface SchemaNode {
  id: string;
  title: string;
  tag: string;
  tagType: NodeTagType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fields: SchemaField[];
}

export interface SchemaEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
  cardinality: Cardinality;
  style?: EdgeStyle;
  color?: EdgeColor;
  pathStyle?: PathStyle;
}

/**
 * Field update payload
 */
export type UpdateFieldPayload = Partial<Omit<SchemaField, 'id'>>;

/**
 * AI Prompt Generator target languages/formats
 */
export type PromptGeneratorTarget =
  | 'PRD Generator'
  | 'Gap Analyzer'
  | 'Lean Canvas'
  | 'MVP Scoper';

/**
 * UI Output Panel Tab selection
 */
export type OutputPanelTab = 'structured' | 'prompt';

/**
 * Persistence save status indicators
 */
export type SaveStatus = 'saved' | 'saving' | 'unsaved';

/**
 * Floating context menu location and canvas coordinates
 */
export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
}

/**
 * Dialog state for generic deletion/confirmation actions
 */
export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Snapshot representation of canvas topology for undo/redo stacks
 */
export interface CanvasHistorySnapshot {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}

/**
 * Standard project schema representation stored and exported
 */
export interface ProjectData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  version?: number;
}

/**
 * Serialized JSON export structure for NodeBrief schemas
 */
export interface CanvasExportPayload {
  project: string;
  generatedAt: string;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}

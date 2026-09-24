import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  EdgeProps,
  Edge,
} from '@xyflow/react';
import { Cardinality, EdgeStyle, EdgeColor, PathStyle } from '../../types/schema';

export interface RelationEdgeData extends Record<string, unknown> {
  label: string;
  cardinality: Cardinality;
  style?: EdgeStyle;
  color?: EdgeColor;
  pathStyle?: PathStyle;
  onEdit?: () => void;
}

export type CustomRelationEdge = Edge<RelationEdgeData, 'relationEdge'>;

export default function RelationEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<CustomRelationEdge>) {
  const edgeData: RelationEdgeData = data || {
    label: 'has many [1:N]',
    cardinality: '1:N',
  };

  if (
    !Number.isFinite(sourceX) ||
    !Number.isFinite(sourceY) ||
    !Number.isFinite(targetX) ||
    !Number.isFinite(targetY)
  ) {
    return null;
  }

  const [edgePath, labelX, labelY] =
    edgeData.pathStyle === 'smoothstep'
      ? getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 8,
        })
      : getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });

  const isMagenta =
    edgeData.color === 'magenta' ||
    edgeData.cardinality === 'M:N' ||
    selected;

  const strokeColor = isMagenta ? '#FF0071' : '#94A3B8';
  const strokeDasharray = edgeData.style === 'dashed' ? '4 2' : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: isMagenta ? 2.2 : 1.8,
          strokeDasharray,
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            type="button"
            onDoubleClick={(e) => {
              e.stopPropagation();
              edgeData.onEdit?.();
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Allow single click or double click to access
              if (e.detail === 2) {
                edgeData.onEdit?.();
              }
            }}
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-tight shadow-xs cursor-pointer select-none transition-all active:scale-95 ${
              isMagenta
                ? 'bg-pink-50 border border-pink-200 text-[#FF0071] font-semibold hover:bg-pink-100 hover:border-pink-300'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900'
            }`}
            title="Double-click to edit relationship"
          >
            {edgeData.label || `${edgeData.cardinality}`}
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

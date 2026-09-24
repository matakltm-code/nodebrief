import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import CanvasWorkbench from '../components/CanvasWorkbench';
import { SchemaNode, SchemaEdge } from '../types/schema';

describe('CanvasWorkbench Component', () => {
  const initialNodes: SchemaNode[] = [
    {
      id: 'node-user',
      title: 'User',
      tag: 'Primary',
      tagType: 'primary',
      x: 50,
      y: 80,
      fields: [
        { id: 'f1', name: 'id', type: 'uuid', isPk: true },
        { id: 'f2', name: 'email', type: 'string' },
      ],
    },
    {
      id: 'node-posts',
      title: 'Posts',
      tag: 'Active Node',
      tagType: 'active',
      x: 350,
      y: 80,
      fields: [
        { id: 'f3', name: 'id', type: 'uuid', isPk: true },
        { id: 'f4', name: 'title', type: 'string' },
      ],
    },
  ];

  const initialEdges: SchemaEdge[] = [
    {
      id: 'edge-user-posts',
      sourceNodeId: 'node-user',
      targetNodeId: 'node-posts',
      label: 'has many [1:N]',
      cardinality: '1:N',
      style: 'solid',
      color: 'slate',
    },
  ];

  it('renders existing nodes and relationships correctly', () => {
    render(
      <CanvasWorkbench
        nodes={initialNodes}
        edges={initialEdges}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
        onUpdateNodeTitle={vi.fn()}
        onAddField={vi.fn()}
        onDeleteNode={vi.fn()}
        onOpenAddNodeModal={vi.fn()}
        onOpenAddRelationModal={vi.fn()}
        onAutoLayout={vi.fn()}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
        onNodesChange={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Posts')).toBeInTheDocument();
    expect(screen.getByText('has many [1:N]')).toBeInTheDocument();
  });

  it('triggers onOpenAddNodeModal when "+ Add Entity" button is clicked', () => {
    const handleOpenAddNodeModal = vi.fn();

    render(
      <CanvasWorkbench
        nodes={initialNodes}
        edges={initialEdges}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
        onUpdateNodeTitle={vi.fn()}
        onAddField={vi.fn()}
        onDeleteNode={vi.fn()}
        onOpenAddNodeModal={handleOpenAddNodeModal}
        onOpenAddRelationModal={vi.fn()}
        onAutoLayout={vi.fn()}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
        onNodesChange={vi.fn()}
      />
    );

    const addEntityButton = screen.getByRole('button', { name: /Add Entity/i });
    fireEvent.click(addEntityButton);

    expect(handleOpenAddNodeModal).toHaveBeenCalledTimes(1);
  });

  it('triggers onAddField when "+ Add Property" button inside a card is clicked', () => {
    const handleAddField = vi.fn();

    render(
      <CanvasWorkbench
        nodes={initialNodes}
        edges={initialEdges}
        selectedNodeId="node-user"
        onSelectNode={vi.fn()}
        onUpdateNodeTitle={vi.fn()}
        onAddField={handleAddField}
        onDeleteNode={vi.fn()}
        onOpenAddNodeModal={vi.fn()}
        onOpenAddRelationModal={vi.fn()}
        onAutoLayout={vi.fn()}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
        onNodesChange={vi.fn()}
      />
    );

    const addPropButtons = screen.getAllByText(/\+ Add Property/i);
    expect(addPropButtons.length).toBeGreaterThan(0);
    fireEvent.click(addPropButtons[0]);

    expect(handleAddField).toHaveBeenCalledWith('node-user');
  });

  it('correctly adds a new node record to the React state array when simulated in a test wrapper', () => {
    function TestWorkbenchHarness() {
      const [nodes, setNodes] = useState<SchemaNode[]>(initialNodes);

      const handleAddNode = () => {
        const newNode: SchemaNode = {
          id: `node-${nodes.length + 1}`,
          title: 'Organization',
          tag: 'Core',
          tagType: 'custom',
          x: 200,
          y: 200,
          fields: [
            { id: 'f-org-1', name: 'id', type: 'uuid', isPk: true },
            { id: 'f-org-2', name: 'name', type: 'string' },
          ],
        };
        setNodes((prev) => [...prev, newNode]);
      };

      return (
        <CanvasWorkbench
          nodes={nodes}
          edges={initialEdges}
          selectedNodeId={null}
          onSelectNode={vi.fn()}
          onUpdateNodeTitle={vi.fn()}
          onAddField={vi.fn()}
          onDeleteNode={vi.fn()}
          onOpenAddNodeModal={handleAddNode}
          onOpenAddRelationModal={vi.fn()}
          onAutoLayout={vi.fn()}
          zoom={1}
          onZoomIn={vi.fn()}
          onZoomOut={vi.fn()}
          onZoomReset={vi.fn()}
          onNodesChange={setNodes}
        />
      );
    }

    render(<TestWorkbenchHarness />);

    expect(screen.queryByDisplayValue('Organization')).not.toBeInTheDocument();

    const addEntityButton = screen.getByRole('button', { name: /Add Entity/i });
    fireEvent.click(addEntityButton);

    // Verify state array updated and newly rendered
    expect(screen.getByDisplayValue('Organization')).toBeInTheDocument();
  });
});

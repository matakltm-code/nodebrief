import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportModal from '../components/modals/ImportModal';
import { parseImportText } from '../utils/importParser';

describe('Import Parser & Routing Logic', () => {
  const activeContext = {
    id: 'proj-123',
    name: 'Active Workspace',
  };

  it('correctly parses valid JSON and detects merge mode when project matches or is generic', () => {
    const rawJson = JSON.stringify({
      nodes: [
        {
          id: 'user',
          title: 'User',
          fields: [{ name: 'id', type: 'uuid', isPk: true }],
        },
        {
          id: 'post',
          title: 'Post',
          fields: [{ name: 'id', type: 'uuid', isPk: true }],
        },
      ],
      edges: [
        {
          sourceNodeId: 'user',
          targetNodeId: 'post',
          cardinality: '1:N',
        },
      ],
    });

    const result = parseImportText(rawJson, 'JSON', activeContext);
    expect(result.success).toBe(true);
    expect(result.format).toBe('JSON');
    expect(result.nodeCount).toBe(2);
    expect(result.edgeCount).toBe(1);
    expect(result.targetMode).toBe('merge');
    expect(result.summary).toContain('Found 2 nodes');
  });

  it('correctly parses valid YAML and detects new project routing when distinct name is provided', () => {
    const rawYaml = `
name: Distinct Analytics System
nodes:
  - id: metric
    title: Metric
    fields:
      - name: id
        type: uuid
        isPk: true
  - id: event
    title: Event
    fields:
      - name: id
        type: uuid
        isPk: true
edges:
  - sourceNodeId: metric
    targetNodeId: event
    cardinality: "1:N"
`;

    const result = parseImportText(rawYaml, 'YAML', activeContext);
    expect(result.success).toBe(true);
    expect(result.format).toBe('YAML');
    expect(result.nodeCount).toBe(2);
    expect(result.edgeCount).toBe(1);
    expect(result.targetMode).toBe('new');
    expect(result.detectedProjectName).toBe('Distinct Analytics System');
    expect(result.summary).toContain('Distinct Analytics System');
  });

  it('handles invalid JSON gracefully with error message', () => {
    const invalidJson = '{ "nodes": [ invalid json }';
    const result = parseImportText(invalidJson, 'JSON', activeContext);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.summary).toContain('Invalid JSON');
  });
});

describe('ImportModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    activeProjectName: 'E-Commerce Core',
    activeProjectId: 'proj-main',
    onConfirmImport: vi.fn(),
  };

  it('renders modal with paste tabs (JSON/YAML) and dropzone area', () => {
    render(<ImportModal {...defaultProps} />);

    expect(screen.getByText('Import Schema or Project')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /JSON/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /YAML/i })).toBeInTheDocument();
    expect(screen.getByText(/Drag & Drop Schema File/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm & Import/i })).toBeInTheDocument();
  });

  it('validates pasted JSON and enables confirm button with merge indicator', async () => {
    const onConfirmImport = vi.fn();
    render(<ImportModal {...defaultProps} onConfirmImport={onConfirmImport} />);

    const textarea = screen.getByPlaceholderText(/Paste raw JSON schema/i);
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify({
          nodes: [{ id: 'account', title: 'Account' }],
        }),
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Found 1 node/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Import/i });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(onConfirmImport).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([expect.objectContaining({ title: 'Account' })]),
      }),
      'merge'
    );
  });

  it('switches between JSON and YAML tabs and updates placeholders', () => {
    render(<ImportModal {...defaultProps} />);

    expect(screen.getByPlaceholderText(/Paste raw JSON schema/i)).toBeInTheDocument();

    const yamlTab = screen.getByRole('button', { name: /YAML/i });
    fireEvent.click(yamlTab);

    expect(screen.getByPlaceholderText(/Paste raw YAML schema/i)).toBeInTheDocument();

    const jsonTab = screen.getByRole('button', { name: /JSON/i });
    fireEvent.click(jsonTab);

    expect(screen.getByPlaceholderText(/Paste raw JSON schema/i)).toBeInTheDocument();
  });

  it('renders Paste button when textarea is empty and reads clipboard on click', async () => {
    const mockClipboardText = JSON.stringify({
      nodes: [{ id: 'order', title: 'Order' }],
    });
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValueOnce(mockClipboardText);

    render(<ImportModal {...defaultProps} />);

    const pasteBtn = screen.getByRole('button', { name: /Paste/i });
    expect(pasteBtn).toBeInTheDocument();

    fireEvent.click(pasteBtn);

    await waitFor(() => {
      expect(navigator.clipboard.readText).toHaveBeenCalled();
      expect(screen.getByText(/Found 1 node/i)).toBeInTheDocument();
    });
  });

  it('renders Copy button when textarea has content and copies text on click', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValueOnce();

    render(<ImportModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste raw JSON schema/i);
    fireEvent.change(textarea, {
      target: { value: '{"name":"Catalog","nodes":[]}' },
    });

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    expect(copyBtn).toBeInTheDocument();

    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{"name":"Catalog","nodes":[]}');
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });

  it('handles clipboard read permission restrictions gracefully and focuses textarea', async () => {
    vi.spyOn(navigator.clipboard, 'readText').mockRejectedValueOnce(
      new Error('The Clipboard API has been blocked because of a permissions policy')
    );

    render(<ImportModal {...defaultProps} />);

    const pasteBtn = screen.getByRole('button', { name: /Paste/i });
    expect(pasteBtn).toBeInTheDocument();

    fireEvent.click(pasteBtn);

    const textarea = screen.getByPlaceholderText(/Paste raw JSON schema/i);
    expect(textarea).toHaveFocus();
  });
});

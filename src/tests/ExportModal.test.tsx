import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportModal from '../components/modals/ExportModal';
import { SchemaNode, SchemaEdge } from '../types/schema';

describe('ExportModal Component', () => {
  const sampleNodes: SchemaNode[] = [
    {
      id: 'node-account',
      title: 'Account',
      tag: 'Core',
      tagType: 'primary',
      x: 100,
      y: 100,
      fields: [{ id: 'f1', name: 'id', type: 'uuid', isPk: true }],
    },
  ];

  const sampleEdges: SchemaEdge[] = [];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    projectName: 'FinTech Platform',
    nodes: sampleNodes,
    edges: sampleEdges,
    onNotify: vi.fn(),
  };

  it('renders modal with project details and format choices', () => {
    render(<ExportModal {...defaultProps} />);

    expect(screen.getByText('Export FinTech Platform')).toBeInTheDocument();
    expect(screen.getByText(/1 entities/i)).toBeInTheDocument();
    expect(screen.getByText('JSON Format')).toBeInTheDocument();
    expect(screen.getByText('YAML Format')).toBeInTheDocument();
  });

  it('allows switching between JSON and YAML preview tabs', () => {
    render(<ExportModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /^JSON$/i })).toBeInTheDocument();
    const yamlTab = screen.getByRole('button', { name: /^YAML$/i });
    expect(yamlTab).toBeInTheDocument();

    fireEvent.click(yamlTab);
    expect(screen.getByText(/project: FinTech Platform/i)).toBeInTheDocument();
  });

  it('copies JSON content to clipboard when Copy JSON is clicked', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValueOnce();
    const onNotify = vi.fn();

    render(<ExportModal {...defaultProps} onNotify={onNotify} />);

    const copyButtons = screen.getAllByRole('button', { name: /Copy JSON/i });
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(onNotify).toHaveBeenCalledWith(expect.stringContaining('Copied JSON'));
    });
  });

  it('copies YAML content to clipboard when Copy YAML is clicked', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValueOnce();
    const onNotify = vi.fn();

    render(<ExportModal {...defaultProps} onNotify={onNotify} />);

    const copyYamlBtn = screen.getByRole('button', { name: /Copy YAML/i });
    fireEvent.click(copyYamlBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(onNotify).toHaveBeenCalledWith(expect.stringContaining('Copied YAML'));
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RightOutputPanel from '../components/RightOutputPanel';
import { DEFAULT_SEED_PROJECT } from '../utils/projectDatabase';

describe('RightOutputPanel Real-Time Parsing & Synchronization Pipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('dynamically compiles structured Markdown schema matching active project title and nodes', () => {
    const onNotify = vi.fn();
    const onTabChange = vi.fn();

    render(
      <RightOutputPanel
        projectName="Store Architecture"
        nodes={DEFAULT_SEED_PROJECT.nodes}
        edges={DEFAULT_SEED_PROJECT.edges}
        activeTab="structured"
        onTabChange={onTabChange}
        onNotify={onNotify}
      />
    );

    // Verify title synchronization
    expect(screen.getByText('# Schema: Store Architecture Entity Graph')).toBeInTheDocument();
    expect(screen.getByText(/4 Entities, 3 Relational Edges/)).toBeInTheDocument();
    expect(screen.getByText('table User')).toBeInTheDocument();
    expect(screen.getByText('table Project')).toBeInTheDocument();
  });

  it('updates target prompt when switching generator target toggles', () => {
    const onNotify = vi.fn();
    const onTabChange = vi.fn();

    render(
      <RightOutputPanel
        projectName="NodeBrief Engine"
        nodes={DEFAULT_SEED_PROJECT.nodes}
        edges={DEFAULT_SEED_PROJECT.edges}
        activeTab="prompt"
        onTabChange={onTabChange}
        onNotify={onNotify}
      />
    );

    // Default PRD Generator selected
    expect(screen.getByText(/expert Principal Product Manager/)).toBeInTheDocument();
    expect(screen.getByText(/Product Requirement Document \(PRD\)/)).toBeInTheDocument();

    // Click Lean Canvas target toggle
    const leanCanvasButton = screen.getByRole('button', { name: 'Lean Canvas' });
    fireEvent.click(leanCanvasButton);

    expect(screen.getByText(/elite venture capitalist and business strategist/)).toBeInTheDocument();
    expect(screen.getByText(/Lean Startup Canvas format/)).toBeInTheDocument();

    // Click Gap Analyzer target toggle
    const gapButton = screen.getByRole('button', { name: 'Gap Analyzer' });
    fireEvent.click(gapButton);

    expect(screen.getByText(/critical startup advisor and risk analyst/)).toBeInTheDocument();
    expect(screen.getByText(/Ask 5 hard questions/)).toBeInTheDocument();

    // Click MVP Scoper target toggle
    const mvpButton = screen.getByRole('button', { name: 'MVP Scoper' });
    fireEvent.click(mvpButton);

    expect(screen.getByText(/pragmatic Agile Project Manager/)).toBeInTheDocument();
    expect(screen.getByText(/2-week implementation milestone plan/)).toBeInTheDocument();
  });

  it('downloads markdown and text files with slugified project name', () => {
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    window.URL.revokeObjectURL = vi.fn();

    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    let downloadedFilename = '';

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const el = originalCreateElement('a');
        el.click = mockClick;
        Object.defineProperty(el, 'download', {
          set(val: string) {
            downloadedFilename = val;
          },
          get() {
            return downloadedFilename;
          },
        });
        return el;
      }
      return originalCreateElement(tag);
    });

    const onNotify = vi.fn();
    render(
      <RightOutputPanel
        projectName="E Commerce Engine"
        nodes={DEFAULT_SEED_PROJECT.nodes}
        edges={DEFAULT_SEED_PROJECT.edges}
        activeTab="structured"
        onTabChange={vi.fn()}
        onNotify={onNotify}
      />
    );

    const mdDownloadButton = screen.getByTitle('Download e-commerce-engine.md');
    fireEvent.click(mdDownloadButton);

    expect(downloadedFilename).toBe('e-commerce-engine.md');
    expect(onNotify).toHaveBeenCalledWith('Downloaded e-commerce-engine.md');
  });

  it('copies generated AI prompt context to clipboard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const onNotify = vi.fn();
    render(
      <RightOutputPanel
        projectName="NodeBrief"
        nodes={DEFAULT_SEED_PROJECT.nodes}
        edges={DEFAULT_SEED_PROJECT.edges}
        activeTab="prompt"
        onTabChange={vi.fn()}
        onNotify={onNotify}
      />
    );

    const copyPromptButton = screen.getByRole('button', { name: /Copy to Clipboard/i });
    fireEvent.click(copyPromptButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(onNotify).toHaveBeenCalledWith('Copied AI Prompt to clipboard');
  });
});

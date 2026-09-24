import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllProjects,
  saveProjectToStorage,
  deleteProjectFromStorage,
  createNewProject,
  initializeProjectDatabase,
  downloadProjectAsJsonFile,
  STORAGE_KEYS,
  DEFAULT_SEED_PROJECT,
} from '../utils/projectDatabase';

describe('Local-First Multi-Project Database Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('gracefully seeds default starter project when storage is empty', () => {
    const { activeProject, projects } = initializeProjectDatabase();

    expect(projects).toHaveLength(1);
    expect(activeProject.name).toBe('NodeBrief');
    expect(activeProject.nodes).toHaveLength(4);
    expect(activeProject.edges).toHaveLength(3);
    expect(localStorage.getItem(STORAGE_KEYS.PROJECTS_INDEX)).toBeDefined();
  });

  it('saves new project and persists it to project collection index', () => {
    const project = createNewProject('Payment Service');
    expect(project.name).toBe('Payment Service');
    expect(project.nodes.length).toBeGreaterThanOrEqual(1);

    const storedProjects = getAllProjects();
    expect(storedProjects).toHaveLength(1);
    expect(storedProjects[0].name).toBe('Payment Service');
  });

  it('switches between projects and maintains separate schema states', () => {
    const projA = createNewProject('Alpha');
    const projB = createNewProject('Beta');

    let all = getAllProjects();
    expect(all).toHaveLength(2);

    // Mutate Alpha
    const updatedProjA = {
      ...projA,
      name: 'Alpha Updated',
      nodes: [
        ...projA.nodes,
        {
          id: 'node-alpha-extra',
          title: 'Invoice',
          tag: 'Core',
          tagType: 'primary' as const,
          x: 200,
          y: 200,
          fields: [],
        },
      ],
    };
    saveProjectToStorage(updatedProjA);

    const loaded = getAllProjects();
    const loadedA = loaded.find((p) => p.id === projA.id);
    const loadedB = loaded.find((p) => p.id === projB.id);

    expect(loadedA?.name).toBe('Alpha Updated');
    expect(loadedA?.nodes).toHaveLength(2);
    expect(loadedB?.name).toBe('Beta');
    expect(loadedB?.nodes).toHaveLength(1);
  });

  it('persists and tracks custom node dimensions (width and height) in storage', () => {
    const project = createNewProject('Resized Entities');
    const resizedNode = {
      ...project.nodes[0],
      width: 320,
      height: 280,
    };

    saveProjectToStorage({
      ...project,
      nodes: [resizedNode],
    });

    const storedProjects = getAllProjects();
    const loaded = storedProjects.find((p) => p.id === project.id);
    expect(loaded?.nodes[0].width).toBe(320);
    expect(loaded?.nodes[0].height).toBe(280);
  });

  it('deletes a project and updates storage correctly', () => {
    const p1 = createNewProject('Project 1');
    const p2 = createNewProject('Project 2');

    let all = getAllProjects();
    expect(all).toHaveLength(2);

    deleteProjectFromStorage(p1.id);
    all = getAllProjects();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(p2.id);
  });

  it('triggers browser downstream file save for canvas JSON export', () => {
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-uuid');
    window.URL.revokeObjectURL = vi.fn();

    const mockClick = vi.fn();
    const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        const el = originalCreateElement('a');
        el.click = mockClick;
        return el;
      }
      return originalCreateElement(tag);
    });

    downloadProjectAsJsonFile(DEFAULT_SEED_PROJECT);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
  });
});

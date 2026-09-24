import { ProjectData } from '../types/schema';
import { serializeCanvasToJson } from './exportCanvas';
import { logger } from './logger';

export const STORAGE_KEYS = {
  PROJECTS_INDEX: 'nodebrief_projects_v1',
  ACTIVE_PROJECT_ID: 'nodebrief_active_project_id_v1',
};

export const DEFAULT_SEED_PROJECT: ProjectData = {
  id: 'proj-seed-nodebrief',
  name: 'NodeBrief',
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
  version: 1,
  nodes: [
    {
      id: 'node-user',
      title: 'User',
      tag: 'Primary',
      tagType: 'primary',
      x: 35,
      y: 60,
      width: 240,
      fields: [
        { id: 'f1', name: 'id', type: 'uuid', isPk: true, icon: 'key' },
        { id: 'f2', name: 'email', type: 'string', details: 'unique, indexed', icon: 'email' },
        { id: 'f3', name: 'name', type: 'string', details: 'not null', icon: 'title' },
        { id: 'f4', name: 'role', type: 'enum(admin, member)', icon: 'shield' },
      ],
    },
    {
      id: 'node-project',
      title: 'Project',
      tag: 'Active Node',
      tagType: 'active',
      x: 340,
      y: 60,
      width: 240,
      fields: [
        { id: 'f5', name: 'id', type: 'uuid', isPk: true, icon: 'key' },
        { id: 'f6', name: 'name', type: 'string', details: 'not null', icon: 'title' },
        { id: 'f7', name: 'owner_id', type: 'uuid', isFk: true, refTarget: 'User.id', icon: 'link' },
        { id: 'f8', name: 'status', type: 'enum(active, archived)', details: 'default: active', icon: 'toggle' },
      ],
    },
    {
      id: 'node-task',
      title: 'Task',
      tag: 'Relation',
      tagType: 'relation',
      x: 650,
      y: 60,
      width: 240,
      fields: [
        { id: 'f9', name: 'id', type: 'uuid', isPk: true, icon: 'key' },
        { id: 'f10', name: 'title', type: 'string', details: 'not null', icon: 'title' },
        { id: 'f11', name: 'project_id', type: 'uuid', isFk: true, refTarget: 'Project.id', icon: 'link' },
        { id: 'f12', name: 'assignee_id', type: 'uuid', isFk: true, refTarget: 'User.id', icon: 'link' },
        { id: 'f13', name: 'completed', type: 'boolean', details: 'default: false', icon: 'toggle' },
      ],
    },
    {
      id: 'node-tag',
      title: 'Tag',
      tag: 'Taxonomy',
      tagType: 'taxonomy',
      x: 340,
      y: 310,
      width: 240,
      fields: [
        { id: 'f14', name: 'id', type: 'uuid', isPk: true, icon: 'key' },
        { id: 'f15', name: 'name', type: 'slug', details: 'unique', icon: 'tag' },
      ],
    },
  ],
  edges: [
    {
      id: 'edge-user-project',
      sourceNodeId: 'node-user',
      targetNodeId: 'node-project',
      label: 'has many [1:N]',
      cardinality: '1:N',
      style: 'solid',
      color: 'slate',
    },
    {
      id: 'edge-project-task',
      sourceNodeId: 'node-project',
      targetNodeId: 'node-task',
      label: 'has many [1:N]',
      cardinality: '1:N',
      style: 'solid',
      color: 'slate',
    },
    {
      id: 'edge-tag-task',
      sourceNodeId: 'node-tag',
      targetNodeId: 'node-task',
      label: 'categorizes [M:N]',
      cardinality: 'M:N',
      style: 'dashed',
      color: 'magenta',
    },
  ],
};

/**
 * Type guard for ProjectData structure validation
 */
export function isProjectData(value: unknown): value is ProjectData {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.createdAt === 'string' &&
    typeof p.updatedAt === 'string' &&
    Array.isArray(p.nodes) &&
    Array.isArray(p.edges)
  );
}

/**
 * Retrieves all projects stored in local storage with schema integrity validation
 */
export function getAllProjects(): ProjectData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS_INDEX);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter(isProjectData);
    }
    return [];
  } catch (err) {
    logger.error('Failed to load projects from storage:', err);
    return [];
  }
}

/**
 * Saves or updates a project in the local storage database
 */
export function saveProjectToStorage(project: ProjectData): ProjectData[] {
  try {
    const projects = getAllProjects();
    const existingIndex = projects.findIndex((p) => p.id === project.id);
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    let updatedList: ProjectData[];
    if (existingIndex >= 0) {
      updatedList = [...projects];
      updatedList[existingIndex] = updatedProject;
    } else {
      updatedList = [updatedProject, ...projects];
    }

    localStorage.setItem(STORAGE_KEYS.PROJECTS_INDEX, JSON.stringify(updatedList));
    return updatedList;
  } catch (err) {
    logger.error('Failed to save project to storage:', err);
    return [];
  }
}

/**
 * Deletes a project by ID from local storage
 */
export function deleteProjectFromStorage(id: string): ProjectData[] {
  try {
    const projects = getAllProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS_INDEX, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    logger.error('Failed to delete project from storage:', err);
    return [];
  }
}

/**
 * Gets the active project ID
 */
export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
  } catch {
    return null;
  }
}

/**
 * Sets the active project ID in storage
 */
export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  } catch (err) {
    logger.error('Failed to set active project ID in storage:', err);
  }
}

/**
 * Creates a brand new empty canvas project template
 */
export function createNewProject(name: string = 'Untitled Project'): ProjectData {
  const timestamp = new Date().toISOString();
  const newId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  const newProject: ProjectData = {
    id: newId,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
    nodes: [
      {
        id: `node-${Date.now()}`,
        title: 'Entity_1',
        tag: 'Primary',
        tagType: 'primary',
        x: 100,
        y: 100,
        width: 240,
        fields: [
          { id: `f-${Date.now()}-1`, name: 'id', type: 'uuid', isPk: true, icon: 'key' },
          { id: `f-${Date.now()}-2`, name: 'name', type: 'string', details: 'not null', icon: 'title' },
        ],
      },
    ],
    edges: [],
  };

  saveProjectToStorage(newProject);
  setActiveProjectId(newId);
  return newProject;
}

/**
 * Gracefully initializes storage: if no projects exist, seed default project.
 */
export function initializeProjectDatabase(): {
  activeProject: ProjectData;
  projects: ProjectData[];
} {
  let projects = getAllProjects();

  if (projects.length === 0) {
    // Seed default project
    saveProjectToStorage(DEFAULT_SEED_PROJECT);
    setActiveProjectId(DEFAULT_SEED_PROJECT.id);
    return {
      activeProject: DEFAULT_SEED_PROJECT,
      projects: [DEFAULT_SEED_PROJECT],
    };
  }

  const activeId = getActiveProjectId();
  const matchedActive = projects.find((p) => p.id === activeId);

  if (matchedActive) {
    return {
      activeProject: matchedActive,
      projects,
    };
  }

  // Fallback to first project
  setActiveProjectId(projects[0].id);
  return {
    activeProject: projects[0],
    projects,
  };
}

/**
 * Native downstream JSON download utility
 */
export function downloadProjectAsJsonFile(project: ProjectData): void {
  try {
    const jsonContent = serializeCanvasToJson(
      project.name,
      project.nodes,
      project.edges,
      project.updatedAt || new Date().toISOString()
    );

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Clean sanitized filename: [project-name]-export.json
    const sanitizedName = (project.name || 'nodebrief')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '_');

    link.href = url;
    link.download = `${sanitizedName}-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    logger.error('Failed to export canvas JSON:', err);
  }
}

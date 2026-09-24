import { useState, useEffect, useRef } from 'react';
import { SchemaNode, SchemaEdge, SaveStatus, ProjectData } from '../types/schema';
import { NormalizedImportPayload } from '../utils/importParser';
import {
  initializeProjectDatabase,
  saveProjectToStorage,
  deleteProjectFromStorage,
  createNewProject,
  setActiveProjectId,
  downloadProjectAsJsonFile,
  DEFAULT_SEED_PROJECT,
} from '../utils/projectDatabase';

export interface UseProjectManagerOptions {
  onNotify?: (msg: string) => void;
  onConfirmDelete?: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) => void;
  onClearHistory?: () => void;
}

export function useProjectManager({
  onNotify,
  onConfirmDelete,
  onClearHistory,
}: UseProjectManagerOptions = {}) {
  // Multi-Project State
  const [projectsList, setProjectsList] = useState<ProjectData[]>([]);
  const [activeProjectId, setCurrentActiveProjectId] = useState<string>(DEFAULT_SEED_PROJECT.id);
  const [activeProjectCreatedAt, setActiveProjectCreatedAt] = useState<string>(
    DEFAULT_SEED_PROJECT.createdAt
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // Active Project Content States
  const [projectName, setProjectName] = useState('NodeBrief');
  const [nodes, setNodes] = useState<SchemaNode[]>(DEFAULT_SEED_PROJECT.nodes);
  const [edges, setEdges] = useState<SchemaEdge[]>(DEFAULT_SEED_PROJECT.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-project');

  // Synchronization & Debounce References
  const isInitialMount = useRef(true);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Storage Bootstrap
  useEffect(() => {
    const { activeProject, projects } = initializeProjectDatabase();
    setProjectsList(projects);
    setCurrentActiveProjectId(activeProject.id);
    setActiveProjectCreatedAt(activeProject.createdAt || new Date().toISOString());
    setProjectName(activeProject.name);
    setNodes(activeProject.nodes || []);
    setEdges(activeProject.edges || []);
    if (activeProject.nodes && activeProject.nodes.length > 0) {
      setSelectedNodeId(activeProject.nodes[0].id);
    }
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 2. Automated Background Auto-Save (500ms Debounce)
  useEffect(() => {
    if (isInitialMount.current) return;

    setSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      const currentProjectPayload: ProjectData = {
        id: activeProjectId,
        name: projectName.trim() || 'Untitled Project',
        createdAt: activeProjectCreatedAt,
        updatedAt: new Date().toISOString(),
        nodes,
        edges,
        version: 1,
      };

      const updatedProjects = saveProjectToStorage(currentProjectPayload);
      setProjectsList(updatedProjects);
      setSaveStatus('saved');
    }, 500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [projectName, nodes, edges, activeProjectId, activeProjectCreatedAt]);

  // Project Switching
  const handleSelectProject = (projectId: string) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    const currentPayload: ProjectData = {
      id: activeProjectId,
      name: projectName.trim() || 'Untitled Project',
      createdAt: activeProjectCreatedAt,
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
      version: 1,
    };
    saveProjectToStorage(currentPayload);

    const targetProject = projectsList.find((p) => p.id === projectId);
    if (!targetProject) return;

    setCurrentActiveProjectId(targetProject.id);
    setActiveProjectCreatedAt(targetProject.createdAt);
    setProjectName(targetProject.name);
    setNodes(targetProject.nodes || []);
    setEdges(targetProject.edges || []);
    setSelectedNodeId(targetProject.nodes?.[0]?.id || null);
    onClearHistory?.();
    setActiveProjectId(targetProject.id);
    setSaveStatus('saved');
    onNotify?.(`Switched to "${targetProject.name}"`);
  };

  // Create Project
  const handleCreateNewProject = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    saveProjectToStorage({
      id: activeProjectId,
      name: projectName.trim() || 'Untitled Project',
      createdAt: activeProjectCreatedAt,
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
      version: 1,
    });

    const newProject = createNewProject('Untitled Project');
    setProjectsList((prev) => [newProject, ...prev]);
    setCurrentActiveProjectId(newProject.id);
    setActiveProjectCreatedAt(newProject.createdAt);
    setProjectName(newProject.name);
    setNodes(newProject.nodes);
    setEdges(newProject.edges);
    setSelectedNodeId(newProject.nodes[0]?.id || null);
    onClearHistory?.();
    setSaveStatus('saved');
    onNotify?.('Created new project "Untitled Project"');
  };

  // Delete Project with Confirmation
  const handleDeleteProject = (projectId: string) => {
    if (projectsList.length <= 1) {
      onNotify?.('Cannot delete the only remaining project');
      return;
    }

    const targetProject = projectsList.find((p) => p.id === projectId);
    const targetName = targetProject ? targetProject.name : 'this project';

    const executeDeletion = () => {
      const updatedProjects = deleteProjectFromStorage(projectId);
      setProjectsList(updatedProjects);

      if (activeProjectId === projectId) {
        const nextActive = updatedProjects[0];
        if (nextActive) {
          setCurrentActiveProjectId(nextActive.id);
          setActiveProjectCreatedAt(nextActive.createdAt);
          setProjectName(nextActive.name);
          setNodes(nextActive.nodes || []);
          setEdges(nextActive.edges || []);
          setSelectedNodeId(nextActive.nodes?.[0]?.id || null);
          setActiveProjectId(nextActive.id);
        }
      }
      onNotify?.(`Project "${targetName}" deleted`);
    };

    if (onConfirmDelete) {
      onConfirmDelete({
        title: `Delete Project "${targetName}"?`,
        message: `Are you sure you want to permanently delete "${targetName}"? All entities, properties, and relationships in this project will be deleted.`,
        onConfirm: executeDeletion,
      });
    } else {
      executeDeletion();
    }
  };

  // Export JSON
  const handleExportCanvasJson = () => {
    const currentPayload: ProjectData = {
      id: activeProjectId,
      name: projectName.trim() || 'nodebrief',
      createdAt: activeProjectCreatedAt,
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
      version: 1,
    };
    downloadProjectAsJsonFile(currentPayload);
    const sanitizedName = (projectName || 'nodebrief')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '_');
    onNotify?.(`Exported ${sanitizedName}-export.json`);
  };

  // Advanced Import & Routing Handler (JSON / YAML)
  const handleCommitImport = (payload: NormalizedImportPayload, mode: 'merge' | 'new') => {
    if (mode === 'merge') {
      // Current Project Merge
      let addedNodesCount = 0;
      let mergedNodesCount = 0;
      const updatedNodes = [...nodes];
      const idMap = new Map<string, string>();

      payload.nodes.forEach((incomingNode) => {
        const existingNodeIndex = updatedNodes.findIndex(
          (n) => n.id === incomingNode.id || n.title.toLowerCase() === incomingNode.title.toLowerCase()
        );

        if (existingNodeIndex !== -1) {
          const existing = updatedNodes[existingNodeIndex];
          idMap.set(incomingNode.id, existing.id);
          const existingFieldNames = new Set(existing.fields.map((f) => f.name.toLowerCase()));
          const newFields = incomingNode.fields.filter(
            (f) => !existingFieldNames.has(f.name.toLowerCase())
          );
          if (newFields.length > 0) {
            updatedNodes[existingNodeIndex] = {
              ...existing,
              fields: [...existing.fields, ...newFields],
            };
          }
          mergedNodesCount++;
        } else {
          let safeX = incomingNode.x;
          let safeY = incomingNode.y;
          const collides = updatedNodes.some(
            (n) => Math.abs(n.x - safeX) < 40 && Math.abs(n.y - safeY) < 40
          );
          if (collides) {
            safeX += 60;
            safeY += 60;
          }
          const newNode: SchemaNode = {
            ...incomingNode,
            x: safeX,
            y: safeY,
          };
          updatedNodes.push(newNode);
          idMap.set(incomingNode.id, newNode.id);
          addedNodesCount++;
        }
      });

      const updatedEdges = [...edges];
      let addedEdgesCount = 0;
      payload.edges.forEach((incomingEdge) => {
        const resolvedSource = idMap.get(incomingEdge.sourceNodeId) || incomingEdge.sourceNodeId;
        const resolvedTarget = idMap.get(incomingEdge.targetNodeId) || incomingEdge.targetNodeId;

        const sourceExists = updatedNodes.some((n) => n.id === resolvedSource);
        const targetExists = updatedNodes.some((n) => n.id === resolvedTarget);

        if (sourceExists && targetExists && resolvedSource !== resolvedTarget) {
          const edgeAlreadyExists = updatedEdges.some(
            (e) => e.sourceNodeId === resolvedSource && e.targetNodeId === resolvedTarget
          );
          if (!edgeAlreadyExists) {
            updatedEdges.push({
              ...incomingEdge,
              sourceNodeId: resolvedSource,
              targetNodeId: resolvedTarget,
            });
            addedEdgesCount++;
          }
        }
      });

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      onNotify?.(
        `Merged ${addedNodesCount + mergedNodesCount} entities and ${addedEdgesCount} relationships into "${projectName}"`
      );
    } else {
      // New Project Routing
      const currentProjectPayload: ProjectData = {
        id: activeProjectId,
        name: projectName.trim() || 'Untitled Project',
        createdAt: activeProjectCreatedAt,
        updatedAt: new Date().toISOString(),
        nodes,
        edges,
        version: 1,
      };
      saveProjectToStorage(currentProjectPayload);

      const newId = payload.id || `proj-${Date.now()}`;
      const newName = payload.name || 'Imported Workspace';
      const newProject: ProjectData = {
        id: newId,
        name: newName,
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: payload.nodes,
        edges: payload.edges,
        version: 1,
      };

      const updatedProjects = saveProjectToStorage(newProject);
      setProjectsList(updatedProjects);
      setCurrentActiveProjectId(newProject.id);
      setActiveProjectCreatedAt(newProject.createdAt);
      setProjectName(newProject.name);
      setNodes(newProject.nodes);
      setEdges(newProject.edges);
      setSelectedNodeId(newProject.nodes?.[0]?.id || null);
      onClearHistory?.();
      setActiveProjectId(newProject.id);
      onNotify?.(`Created & opened new workspace "${newProject.name}"`);
    }
  };

  // Import JSON legacy fallback
  const handleImportProjectJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || (!Array.isArray(parsed.nodes) && !parsed.name)) {
          onNotify?.('Invalid project JSON format');
          return;
        }

        const importedId = parsed.id || `proj-${Date.now()}`;
        const importedProject: ProjectData = {
          id: importedId,
          name: parsed.name || file.name.replace(/\.json$/i, '') || 'Imported Project',
          createdAt: parsed.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
          edges: Array.isArray(parsed.edges) ? parsed.edges : [],
          version: parsed.version || 1,
        };

        const updatedProjects = saveProjectToStorage(importedProject);
        setProjectsList(updatedProjects);
        setCurrentActiveProjectId(importedProject.id);
        setActiveProjectCreatedAt(importedProject.createdAt);
        setProjectName(importedProject.name);
        setNodes(importedProject.nodes);
        setEdges(importedProject.edges);
        setSelectedNodeId(importedProject.nodes?.[0]?.id || null);
        onClearHistory?.();
        setActiveProjectId(importedProject.id);
        onNotify?.(`Imported project "${importedProject.name}"`);
      } catch {
        onNotify?.('Failed to parse project file');
      }
    };
    reader.readAsText(file);
  };

  return {
    projectsList,
    activeProjectId,
    saveStatus,
    projectName,
    setProjectName,
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
    handleSelectProject,
    handleCreateNewProject,
    handleDeleteProject,
    handleExportCanvasJson,
    handleImportProjectJson,
    handleCommitImport,
  };
}

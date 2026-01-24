import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, ProjectType } from '../types/project';

interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;
    loading: boolean;
    error: string | null;

    // Actions
    addProject: (project: Omit<Project, 'id' | 'lastActive'>) => void;
    removeProject: (id: string) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    setActiveProject: (id: string | null) => void;
    detectProjectType: (path: string) => Promise<ProjectType>;
    refreshActiveTimestamp: (id: string) => void;
}

const generateId = () => crypto.randomUUID();

// Pre-registered projects for the Antigravity ecosystem
const DEFAULT_PROJECTS: Project[] = [
    {
        id: 'flow-daw-2030',
        name: 'Flow DAW 2030',
        path: '/Volumes/PRIME APP SSD/Projects/flow-daw-2030',
        type: 'tauri',
        lastActive: new Date().toISOString(),
        aiContext: 'Professional DAW with AURA AI. Tauri v2 + React. Key components: ArrangeWindow, FloatingHUD, MasterChain, SpectralEditor.',
        color: '#8B5CF6', // Purple
    },
    {
        id: 'mixxos-prime-fabric',
        name: 'MixxOS Prime Fabric',
        path: '/Volumes/PRIME APP SSD/Projects/MixxOS---Prime-Fabric-Prototype',
        type: 'web',
        lastActive: new Date().toISOString(),
        aiContext: 'MixxOS desktop environment prototype with district system, tower portals, and glassmorphic design.',
        color: '#06B6D4', // Cyan
    },
    {
        id: 'raven-mix-ai',
        name: 'Raven Mix AI',
        path: '/Volumes/PRIME APP SSD/Projects/raven-mix-ai',
        type: 'web',
        lastActive: new Date().toISOString(),
        aiContext: 'AI-powered mixing assistant with HybridDAW integration and intelligent stem processing.',
        color: '#F97316', // Orange
    },
    {
        id: 'mixxverse-creative-engine',
        name: 'Mixxverse Creative Engine V2',
        path: '/Volumes/PRIME APP SSD/Projects/mixxverse-creative-engine-v2',
        type: 'web',
        lastActive: new Date().toISOString(),
        aiContext: 'Creative content engine for the Mixxverse ecosystem with AI-driven generation tools.',
        color: '#EC4899', // Pink
    },
    {
        id: 'antigravity-manager',
        name: 'Antigravity Manager',
        path: '/Volumes/PRIME APP SSD/Projects/Antigravity-Manager',
        type: 'tauri',
        lastActive: new Date().toISOString(),
        aiContext: 'AI account orchestration and API gateway. Manages Gemini/Claude/OpenAI proxy with smart routing.',
        color: '#10B981', // Green
    },
    {
        id: 'cognee',
        name: 'Cognee',
        path: '/Volumes/PRIME APP SSD/Projects/cognee',
        type: 'other',
        lastActive: new Date().toISOString(),
        aiContext: 'Knowledge graph and memory system for AI applications.',
        color: '#6366F1', // Indigo
    },
    {
        id: 'auto-claude',
        name: 'Auto-Claude',
        path: '/Volumes/PRIME APP SSD/Projects/Auto-Claude',
        type: 'other',
        lastActive: new Date().toISOString(),
        aiContext: 'Autonomous multi-agent coding framework. Python backend + Electron frontend. Planner→Coder→QA pipeline with Git worktree isolation.',
        color: '#EF4444', // Red
    },
    {
        id: 'creative-engine-v2',
        name: 'Creative Engine V2',
        path: '/Volumes/PRIME APP SSD/Projects/Creative-engine-V2',
        type: 'web',
        lastActive: new Date().toISOString(),
        aiContext: 'MixxOS Creative Singularity. 109 React components, Gemini-powered. NeuralPodManager, SwarmOrchestrator, HandoffHub, KnowledgeMesh, LatentGit.',
        color: '#FBBF24', // Amber/Gold
    },
];

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            projects: DEFAULT_PROJECTS,
            activeProjectId: 'flow-daw-2030',
            loading: false,
            error: null,

            addProject: (projectData) => {
                const newProject: Project = {
                    ...projectData,
                    id: generateId(),
                    lastActive: new Date().toISOString(),
                };
                set((state) => ({
                    projects: [...state.projects, newProject],
                }));
            },

            removeProject: (id) => {
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                    activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
                }));
            },

            updateProject: (id, updates) => {
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                }));
            },

            setActiveProject: (id) => {
                set({ activeProjectId: id });
                if (id) {
                    get().refreshActiveTimestamp(id);
                }
            },

            refreshActiveTimestamp: (id) => {
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id ? { ...p, lastActive: new Date().toISOString() } : p
                    ),
                }));
            },

            detectProjectType: async (path: string): Promise<ProjectType> => {
                // Try to detect project type from common config files
                try {
                    const { exists } = await import('@tauri-apps/plugin-fs');
                    
                    // Check for Tauri project
                    if (await exists(`${path}/src-tauri/tauri.conf.json`)) {
                        return 'tauri';
                    }
                    // Check for Rust project
                    if (await exists(`${path}/Cargo.toml`)) {
                        return 'rust';
                    }
                    // Check for web project (package.json)
                    if (await exists(`${path}/package.json`)) {
                        return 'web';
                    }
                    return 'other';
                } catch {
                    return 'other';
                }
            },
        }),
        {
            name: 'antigravity-projects',
            partialize: (state) => ({
                projects: state.projects,
                activeProjectId: state.activeProjectId,
            }),
        }
    )
);

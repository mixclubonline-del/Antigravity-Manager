export type ProjectType = 'tauri' | 'web' | 'rust' | 'other';

export interface Project {
  id: string;
  name: string;
  path: string;
  type: ProjectType;
  lastActive: string;
  /** Brief context for AI assistance */
  aiContext?: string;
  /** Custom icon or color for the project */
  color?: string;
}

export interface ProjectRegistry {
  projects: Project[];
  activeProjectId: string | null;
}

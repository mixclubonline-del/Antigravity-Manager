import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Plus, Trash2, ExternalLink, Code2, Box, Globe, FileQuestion } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';
import { Project, ProjectType } from '../types/project';
import { open } from '@tauri-apps/plugin-dialog';
import { showToast } from '../components/common/ToastContainer';

const PROJECT_TYPE_ICONS: Record<ProjectType, React.ReactNode> = {
    tauri: <Box className="w-5 h-5 text-orange-400" />,
    web: <Globe className="w-5 h-5 text-blue-400" />,
    rust: <Code2 className="w-5 h-5 text-amber-500" />,
    other: <FileQuestion className="w-5 h-5 text-gray-400" />,
};

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
    tauri: 'Tauri App',
    web: 'Web Project',
    rust: 'Rust Project',
    other: 'Other',
};

function Projects() {
    const { t } = useTranslation();
    const {
        projects,
        activeProjectId,
        addProject,
        removeProject,
        setActiveProject,
        detectProjectType,
    } = useProjectStore();

    const [isAdding, setIsAdding] = useState(false);

    const handleAddProject = async () => {
        setIsAdding(true);
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Project Folder',
            });

            if (selected && typeof selected === 'string') {
                // Extract project name from path
                const pathParts = selected.split('/');
                const name = pathParts[pathParts.length - 1] || 'Untitled Project';

                // Detect project type
                const type = await detectProjectType(selected);

                addProject({
                    name,
                    path: selected,
                    type,
                });

                showToast({
                    type: 'success',
                    message: `Added project: ${name}`,
                });
            }
        } catch (error) {
            console.error('Failed to add project:', error);
            showToast({
                type: 'error',
                message: 'Failed to add project',
            });
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveProject = (id: string, name: string) => {
        removeProject(id);
        showToast({
            type: 'info',
            message: `Removed project: ${name}`,
        });
    };

    const handleActivate = (id: string) => {
        setActiveProject(id);
    };

    const formatLastActive = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <p className="text-base-content/60 text-sm mt-1">
                        Manage your Antigravity-assisted projects
                    </p>
                </div>
                <button
                    className="btn btn-primary gap-2"
                    onClick={handleAddProject}
                    disabled={isAdding}
                >
                    {isAdding ? (
                        <span className="loading loading-spinner loading-sm" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                    Add Project
                </button>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="card bg-base-200 p-12 text-center">
                    <FolderOpen className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-base-content/60 mb-4">
                        Add your first project to get started with Antigravity management
                    </p>
                    <button
                        className="btn btn-primary btn-sm mx-auto"
                        onClick={handleAddProject}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className={`card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer ${
                                activeProjectId === project.id
                                    ? 'ring-2 ring-primary'
                                    : ''
                            }`}
                            onClick={() => handleActivate(project.id)}
                        >
                            <div className="card-body p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="p-2 rounded-lg"
                                            style={{
                                                backgroundColor: project.color
                                                    ? `${project.color}20`
                                                    : undefined,
                                            }}
                                        >
                                            {PROJECT_TYPE_ICONS[project.type]}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                {project.name}
                                                {activeProjectId === project.id && (
                                                    <span className="badge badge-primary badge-xs">
                                                        Active
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-base-content/50">
                                                {PROJECT_TYPE_LABELS[project.type]}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            className="btn btn-ghost btn-xs btn-square"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveProject(project.id, project.name);
                                            }}
                                            title="Remove project"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-error" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-base-content/40 truncate mt-2">
                                    {project.path}
                                </p>

                                {project.aiContext && (
                                    <p className="text-xs text-base-content/60 mt-2 line-clamp-2">
                                        {project.aiContext}
                                    </p>
                                )}

                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-base-content/10">
                                    <span className="text-xs text-base-content/40">
                                        {formatLastActive(project.lastActive)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Projects;

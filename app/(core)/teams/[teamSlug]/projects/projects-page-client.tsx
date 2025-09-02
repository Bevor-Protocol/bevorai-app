"use client";

import { Button } from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CodeProjectSchema, TeamSchemaI } from "@/utils/types";
import {
  Calendar,
  FileText,
  Filter,
  GitBranch,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProjectsPageClientProps {
  team: TeamSchemaI;
  projects: CodeProjectSchema[];
}

const ProjectsPageClient: React.FC<ProjectsPageClientProps> = ({ team, projects }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="px-6 py-8 bg-neutral-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">Projects</h1>
          <p className="text-neutral-400">Manage projects for {team.name}</p>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search
                className={cn(
                  "w-4 h-4 absolute left-3 top-1/2",
                  "transform -translate-y-1/2 text-neutral-500",
                )}
              />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 pr-4 py-2 border border-neutral-700 text-neutral-100",
                  "placeholder-neutral-500 rounded-md focus:outline-none",
                  "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80",
                )}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "archived")}
              className={cn(
                "px-3 py-2 border border-neutral-700 text-neutral-100",
                "rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              )}
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="dark">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="bright">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card.Main
              key={project.id}
              className="border border-neutral-800 hover:border-neutral-700 transition-all"
            >
              <Card.Content className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <button className="p-2 text-neutral-500 hover:text-neutral-300 rounded-md hover:bg-neutral-800 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-neutral-100 mb-2 hover:text-blue-400 cursor-pointer">
                  {project.name}
                </h3>

                {project.description && (
                  <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(project.created_at)}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <GitBranch className="w-4 h-4" />
                    <span>{project.n_versions || 0} versions</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/teams/${team.slug}/projects/${project.slug}/versions/new`}
                    className="flex-1"
                  >
                    <Button variant="dark" className="w-full">
                      <Shield className="w-4 h-4 mr-2" />
                      New Version
                    </Button>
                  </Link>
                  <Button variant="dark">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </Card.Content>
            </Card.Main>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-100 mb-2">No projects found</h3>
            <p className="text-neutral-400">Try adjusting your search terms</p>
          </div>
        )}

        {projects.length === 0 && !searchQuery && (
          <div className="text-center py-16 border-2 border-dashed border-neutral-700 rounded-lg bg-neutral-900/50">
            <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-100 mb-2">No projects created</h3>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto">
              Create your first project to begin security analysis and auditing.
            </p>
            <Button variant="bright" className="text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPageClient;

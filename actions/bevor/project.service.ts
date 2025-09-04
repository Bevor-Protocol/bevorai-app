import api from "@/lib/api";
import { CodeProjectSchema, CodeProjectsResponse, CreateProjectBody } from "@/utils/types";

class ProjectService {
  async createProject(data: CreateProjectBody): Promise<CodeProjectSchema> {
    return api.post("/projects", data).then((response: any) => {
      return response.data;
    });
  }

  async getProjects(filters: { [key: string]: string }): Promise<CodeProjectsResponse> {
    const searchParams = new URLSearchParams(filters);
    searchParams.set("page_size", filters.page_size ?? "9");

    return api.get(`/projects?${searchParams.toString()}`).then((response: any) => {
      return response.data;
    });
  }

  async getProject(projectId: string): Promise<CodeProjectSchema> {
    return api.get(`/projects/${projectId}`).then((response: any) => {
      return response.data;
    });
  }

  async getProjectBySlug(projectSlug: string): Promise<CodeProjectSchema> {
    return api.get(`/projects/from-slug/${projectSlug}`).then((response: any) => {
      return response.data;
    });
  }

  async getAllProjects(): Promise<CodeProjectSchema[]> {
    return api
      .get("/projects/admin/all", { headers: { "skip-team": true } })
      .then((response: any) => {
        return response.data.results;
      });
  }

  async deleteProject(projectId: string): Promise<boolean> {
    return api.delete(`/projects/${projectId}`).then((response: any) => {
      return response.data.success;
    });
  }

  async updateProject(
    projectId: string,
    data: { name?: string; description?: string; tags?: string },
  ): Promise<CodeProjectSchema> {
    return api.patch(`/projects/${projectId}`, data).then((response: any) => {
      return response.data;
    });
  }
}

const projectService = new ProjectService();
export default projectService;

import api from "@/lib/api";
import { CodeProjectSchema, CodeVersionSchema, CreateProjectBody } from "@/utils/types";

class ProjectService {
  async createProject(data: CreateProjectBody): Promise<string> {
    return api.post("/projects", data).then((response: any) => {
      return response.data.id;
    });
  }

  async getProjects(): Promise<CodeProjectSchema[]> {
    return api.get("/projects").then((response: any) => {
      return response.data.results;
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

  async getVersions(projectId: string): Promise<CodeVersionSchema[]> {
    return api.get(`/projects/${projectId}/versions`).then((response: any) => {
      return response.data.results;
    });
  }
}

const projectService = new ProjectService();
export default projectService;

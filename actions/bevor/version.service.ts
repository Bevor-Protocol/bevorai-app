import api from "@/lib/api";
import {
  CodeVersionSchema,
  ContractResponseI,
  ContractSourceResponseI,
  ContractVersionSourceI,
  ContractVersionSourceTrimI,
  FunctionChunkResponseI,
  TreeResponseI,
} from "@/utils/types";

class VersionService {
  async contractUploadFolder(fileMap: Record<string, File>): Promise<ContractResponseI> {
    const formData = new FormData();
    Object.entries(fileMap).forEach(([relativePath, file]) => {
      formData.append("files", file, relativePath);
    });

    return api.post("/versions/create/folder", formData).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async contractUploadFile(file: File): Promise<ContractResponseI> {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/versions/create/file", formData).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async contractUploadScan({
    address,
    projectId,
  }: {
    address: string;
    projectId: string;
  }): Promise<ContractResponseI> {
    return api
      .post("/versions/create/scan", { address, project_id: projectId })
      .then((response) => {
        if (!response.data) {
          throw new Error(response.statusText);
        }
        return response.data;
      });
  }

  async contractUploadPaste(code: string): Promise<ContractResponseI> {
    return api.post("/versions/create/paste", { code }).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getContractVersion(versionId: string): Promise<CodeVersionSchema> {
    return api.get(`/versions/${versionId}`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getContractVersionSources(versionId: string): Promise<ContractVersionSourceTrimI[]> {
    return api.get(`/versions/${versionId}/sources`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.results;
    });
  }

  async getContractVersionSource(
    sourceId: string,
    versionId: string,
  ): Promise<ContractVersionSourceI> {
    return api.get(`/versions/${versionId}/sources/${sourceId}`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getContractTree(versionId: string): Promise<TreeResponseI[]> {
    return api.get(`/versions/${versionId}/tree`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.results;
    });
  }

  async getContractSources(versionId: string): Promise<ContractSourceResponseI[]> {
    return api.get(`/contract/version/${versionId}/sources`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getFunctionChunk(functionId: string): Promise<FunctionChunkResponseI> {
    return api.get(`/contract/function/${functionId}`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }
}

const versionService = new VersionService();
export default versionService;

export const defaultProjectsQuery = (): { [key: string]: string | undefined } => ({
  page: "0",
  page_size: "6",
  name: "",
  tag: "",
});

export const extractProjectsQuery = (params: {
  [key: string]: string;
}): { [key: string]: string | undefined } => {
  const defaultQuery = defaultProjectsQuery();
  return {
    page_size: params?.page_size ?? defaultQuery.page_size,
    page: params?.page ?? defaultQuery.page,
    name: params?.name ?? defaultQuery.name,
    tag: params?.tag ?? defaultQuery.tag,
  };
};

export const defaultCodesQuery = (projectId: string): { [key: string]: string | undefined } => ({
  page_size: "12",
  page: "0",
  order: "desc",
  project_id: projectId,
  user_id: "",
  method: "",
  network: "",
  identifier: "",
});

export const extractCodesQuery = (
  projectId: string,
  params: {
    [key: string]: string;
  },
): { [key: string]: string | undefined } => {
  const defaultQuery = defaultCodesQuery(projectId);
  return {
    page_size: params?.page_size ?? defaultQuery.page_size,
    page: params?.page ?? defaultQuery.page,
    project_id: defaultQuery.project_id,
    user_id: params?.user_id,
    method: params?.method,
    network: params?.network,
    identifier: params?.identifier,
    order: params?.order ?? defaultQuery.order,
  };
};

export const defaultAnalysesQuery = (projectId: string): { [key: string]: string | undefined } => ({
  page: "0",
  page_size: "12",
  user_id: "",
  project_id: projectId,
  name: "",
});

export const extractAnalysesQuery = (
  projectId: string,
  params: {
    [key: string]: string;
  },
): { [key: string]: string | undefined } => {
  const defaultQuery = defaultAnalysesQuery(projectId);
  return {
    page_size: params?.page_size ?? defaultQuery.page_size,
    page: params?.page ?? defaultQuery.page,
    project_id: defaultQuery.project_id,
    user_id: params?.user_id,
    name: params?.name,
  };
};

export const defaultTeamAnalysesQuery = (): { [key: string]: string | undefined } => ({
  page: "0",
  page_size: "12",
  user_id: "",
  project_id: "",
  name: "",
});

export const extractTeamAnalysesQuery = (params: {
  [key: string]: string;
}): { [key: string]: string | undefined } => {
  const defaultQuery = defaultTeamAnalysesQuery();
  return {
    page_size: params?.page_size ?? defaultQuery.page_size,
    page: params?.page ?? defaultQuery.page,
    project_id: defaultQuery.project_id,
    user_id: params?.user_id,
    name: params?.name,
  };
};

export const defaultAnalysisVersionsQuery = (
  analysisId: string,
): { [key: string]: string | undefined } => ({
  page: "0",
  page_size: "12",
  user_id: "",
  project_id: "",
  analysis_id: analysisId,
  status: "success",
});

export const extractAnalysisVersionsQuery = (
  analysisId: string,
  params: {
    [key: string]: string;
  },
): { [key: string]: string | undefined } => {
  const defaultQuery = defaultAnalysisVersionsQuery(analysisId);
  return {
    page_size: params?.page_size ?? defaultQuery.page_size,
    page: params?.page ?? defaultQuery.page,
    project_id: defaultQuery.project_id,
    user_id: params?.user_id,
    status: params?.status,
    analysis_id: defaultQuery.analysis_id,
  };
};

export const defaultAnalysisChatsQuery = (
  analysisId: string,
): { [key: string]: string | undefined } => ({
  page: "0",
  page_size: "12",
  user_id: "",
  project_id: "",
  analysis_id: analysisId,
});

export const extractAnalysisChatsQuery = (
  analysisId: string,
  params: {
    [key: string]: string;
  },
): { [key: string]: string | undefined } => {
  const defaultQuery = defaultAnalysisChatsQuery(analysisId);
  return {
    page_size: params?.page_size ?? defaultQuery.page_size,
    page: params?.page ?? defaultQuery.page,
    project_id: defaultQuery.project_id,
    user_id: params?.user_id,
    analysis_id: params?.analysis_id,
  };
};

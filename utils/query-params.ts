function extractQuery<T extends Record<string, string>>(defaults: T, params: Partial<T> = {}): T {
  const result = { ...defaults };

  for (const key in params) {
    if (key in defaults && params[key] !== undefined) {
      result[key] = params[key]!;
    }
  }

  return result;
}

export const DefaultCodesQuery = {
  page: "0",
  page_size: "20",
  order: "desc",
  order_by: "created_at",
  project_slug: "",
  user_id: "",
  method: "",
  network: "",
  identifier: "",
};

export const DefaultProjectsQuery = {
  page: "0",
  page_size: "6",
  order: "desc",
  order_by: "created_at",
  name: "",
  tag: "",
};

export const DefaultAnalysisNodesQuery = {
  page: "0",
  page_size: "12",
  order: "desc",
  user_id: "",
  project_id: "",
  project_slug: "",
  code_version_id: "",
  trigger: "",
  is_leaf: "",
  is_root: "",
  root_node_id: "",
};

export const DefaultChatsQuery = {
  page: "0",
  page_size: "12",
  order: "desc",
  order_by: "created_at",
  project_id: "",
  project_slug: "",
  code_version_id: "",
  analysis_node_id: "",
  chat_type: "",
};

export const extractCodesQuery = (
  params?: Partial<typeof DefaultCodesQuery>,
): typeof DefaultCodesQuery => {
  return extractQuery(DefaultCodesQuery, params);
};

export const extractProjectsQuery = (
  params?: Partial<typeof DefaultProjectsQuery>,
): typeof DefaultProjectsQuery => {
  return extractQuery(DefaultProjectsQuery, params);
};

export const extractAnalysisNodesQuery = (
  params?: Partial<typeof DefaultAnalysisNodesQuery>,
): typeof DefaultAnalysisNodesQuery => {
  return extractQuery(DefaultAnalysisNodesQuery, params);
};

export const extractChatsQuery = (
  params?: Partial<typeof DefaultChatsQuery>,
): typeof DefaultChatsQuery => {
  return extractQuery(DefaultChatsQuery, params);
};

/*
Strip out empty fields to produce a query param string
*/
export const buildSearchParams = (query: { [key: string]: string }): string => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v) {
      params.set(k, v);
    }
  });

  return params.toString();
};

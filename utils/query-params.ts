/**
 * Normalized URL / search params: only keys with non-empty values are kept.
 * Omitted keys are left to API defaults.
 */
export type QueryParamsRecord = Record<string, string | undefined>;

/** Same as {@link QueryParamsRecord}; kept for analysis list UI naming. */
export type AnalysisNodesQuery = QueryParamsRecord;

type ParamValue = string | number | boolean | string[] | null | undefined;

const normalize = (value: ParamValue): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value ? "true" : undefined;
  if (Array.isArray(value)) {
    const first = value[0];
    if (first === undefined || first === "") return undefined;
    return first;
  }
  if (typeof value === "string") return value === "" ? undefined : value;
  return String(value);
};

/** Pick non-empty search/URL param entries for API and client filter state. */
export const extractQueryParams = (params?: Record<string, ParamValue>): QueryParamsRecord => {
  if (!params) return {};
  const out: QueryParamsRecord = {};
  for (const [key, raw] of Object.entries(params)) {
    const v = normalize(raw);
    if (v !== undefined) out[key] = v;
  }
  return out;
};

/*
Strip out empty fields to produce a query param string
*/
export const buildSearchParams = (query: { [key: string]: string | undefined }): string => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v) {
      params.set(k, v);
    }
  });

  return params.toString();
};

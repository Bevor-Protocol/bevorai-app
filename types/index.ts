export type ItemType = "team" | "project" | "code" | "chat" | "analysis" | "member" | "settings";

export type HrefProps = {
  teamSlug?: string;
  projectSlug?: string;
  codeId?: string;
  chatId?: string;
  nodeId?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AsyncComponent<P = {}> = AsyncFunctionComponent<P>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AsyncFunctionComponent<P = {}> {
  (props: P): Promise<React.ReactNode>;
}

export interface DropdownOption {
  name: string;
  value: string;
}

export type ProjectResponse = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  hasApiKey: boolean;
};

export type ProjectLogsResponse = {
  projectId: string;
  projectName: string;
  hasApiKey: boolean;
  logs: Array<{
    id: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    errorMessage: string | null;
    createdAt: Date;
  }>;
};
